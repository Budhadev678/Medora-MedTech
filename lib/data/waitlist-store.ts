// ============================================================
// MEDORA — APPOINTMENT WAITLIST REPOSITORY
// MODIFICATION PHASE B.4
// ============================================================

import { WaitlistEntry, WaitlistRequest, WaitlistResult, WaitlistStatus } from "@/types/database.types";
import { getTodayDateStr } from "@/lib/data/queue-store";
import { SEEDED_ORGANIZATIONS, StoredIdentity } from "@/lib/data/identity-store";
import { AuditLedger } from "@/lib/data/audit-store";

const STORAGE_KEY = "medora_waitlist_store";

const createSeededWaitlists = (): WaitlistEntry[] => {
  const today = getTodayDateStr();
  return [
    {
      id: "wtl-1001",
      waitlist_no: "WTL-1001",
      patient_id: "PAT-1001",
      patient_name: "Rahul Verma",
      patient_phone: "+91 98765 00001",
      doctor_id: "DOC-1001",
      doctor_name: "Dr. Ananya Sharma",
      organization_id: "11111111-1111-1111-1111-111111111101",
      organization_identifier: "HSP-1001",
      organization_name: "City Hospital",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      department_name: "Cardiology OPD",
      preferred_date: today,
      preferred_session_id: "SES-1001",
      preferred_time_window: "08:00 AM - 10:00 AM",
      status: "ACTIVE",
      notification_channel: "SMS",
      created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
  ];
};

class WaitlistStoreClass {
  private waitlists: Map<string, WaitlistEntry> = new Map();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: WaitlistEntry[] = JSON.parse(stored);
          parsed.forEach((w) => this.waitlists.set(w.id.toLowerCase(), w));
          this.isInitialized = true;
          return;
        }
      } catch (err) {
        console.warn("WaitlistStore: Failed to load from localStorage", err);
      }
    }

    const seeds = createSeededWaitlists();
    seeds.forEach((w) => this.waitlists.set(w.id.toLowerCase(), w));
    this.persist();
    this.isInitialized = true;
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        const list = Array.from(this.waitlists.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent("medora-waitlist-updated"));
      } catch (err) {
        // quota limit
      }
    }
  }

  public reset() {
    this.waitlists.clear();
    const seeds = createSeededWaitlists();
    seeds.forEach((w) => this.waitlists.set(w.id.toLowerCase(), w));
    this.persist();
  }

  public clearAll() {
    this.waitlists.clear();
    this.persist();
  }

  // ==========================================
  // QUERY APIS
  // ==========================================

  public getAllWaitlists(): WaitlistEntry[] {
    return Array.from(this.waitlists.values());
  }

  public getWaitlistById(id: string): WaitlistEntry | null {
    if (!id) return null;
    const direct = this.waitlists.get(id.toLowerCase());
    if (direct) return direct;
    return (
      this.getAllWaitlists().find(
        (w) => w.id.toLowerCase() === id.toLowerCase() || (w.waitlist_no && w.waitlist_no.toLowerCase() === id.toLowerCase())
      ) || null
    );
  }

  public getPatientActiveWaitlists(patientId: string): WaitlistEntry[] {
    if (!patientId) return [];
    return this.getAllWaitlists().filter(
      (w) =>
        w.patient_id.toLowerCase() === patientId.toLowerCase() &&
        (w.status === "ACTIVE" || w.status === "NOTIFIED")
    );
  }

  public getWaitlistsForSession(sessionId: string, date: string): WaitlistEntry[] {
    return this.getAllWaitlists()
      .filter(
        (w) =>
          w.preferred_session_id === sessionId &&
          w.preferred_date === date &&
          w.status === "ACTIVE"
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public getWaitlistsForDoctorDate(doctorId: string, orgIdentifier: string, date: string): WaitlistEntry[] {
    return this.getAllWaitlists()
      .filter(
        (w) =>
          w.doctor_id === doctorId &&
          w.organization_identifier === orgIdentifier &&
          w.preferred_date === date &&
          (w.status === "ACTIVE" || w.status === "NOTIFIED")
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // ==========================================
  // MUTATION APIS
  // ==========================================

  public saveWaitlistEntry(entry: WaitlistEntry): WaitlistEntry {
    this.waitlists.set(entry.id.toLowerCase(), entry);
    this.persist();
    return entry;
  }

  public joinWaitlist(
    request: WaitlistRequest,
    patientName: string,
    doctorName: string,
    departmentName: string,
    organizationName: string,
    patientPhone?: string
  ): WaitlistResult {
    const todayStr = getTodayDateStr();

    // 1. Past Date Guard
    if (request.preferred_date < todayStr) {
      return {
        success: false,
        error_code: "PAST_DATE",
        message: "Cannot join a waitlist for a past date.",
      };
    }

    // 2. Duplicate Active Entry Guard
    const existing = this.getAllWaitlists().find(
      (w) =>
        w.patient_id.toLowerCase() === request.patient_id.toLowerCase() &&
        w.doctor_id === request.doctor_id &&
        w.organization_identifier === request.organization_identifier &&
        w.preferred_date === request.preferred_date &&
        (w.status === "ACTIVE" || w.status === "NOTIFIED")
    );

    if (existing) {
      return {
        success: false,
        waitlist_entry: existing,
        error_code: "ALREADY_WAITLISTED",
        message: `You are already on the active waitlist (#${existing.waitlist_no}) for ${doctorName} on ${request.preferred_date}.`,
      };
    }

    const org = SEEDED_ORGANIZATIONS.find((o) => o.medora_id === request.organization_identifier);
    const orgId = org ? org.id : "11111111-1111-1111-1111-111111111101";

    const count = this.getAllWaitlists().length;
    const waitlistNo = `WTL-${1000 + count + 1}`;
    const id = `wtl-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newEntry: WaitlistEntry = {
      id,
      waitlist_no: waitlistNo,
      patient_id: request.patient_id,
      patient_name: patientName,
      patient_phone: patientPhone || "+91 98765 00000",
      doctor_id: request.doctor_id,
      doctor_name: doctorName,
      organization_id: orgId,
      organization_identifier: request.organization_identifier,
      organization_name: organizationName,
      facility_id: request.facility_id,
      department_id: request.department_id,
      department_name: departmentName,
      preferred_date: request.preferred_date,
      preferred_session_id: request.preferred_session_id,
      preferred_time_window: request.preferred_time_window,
      status: "ACTIVE",
      notification_channel: request.notification_channel || "SMS",
      created_at: new Date().toISOString(),
      notes: request.notes,
    };

    this.saveWaitlistEntry(newEntry);

    AuditLedger.recordEvent({
      actor_id: request.patient_id,
      actor_name: patientName,
      action: "WAITLIST_JOINED" as any,
      resource_type: "WAITLIST_ENTRY",
      resource_id: newEntry.id,
      details: {
        waitlist_no: waitlistNo,
        doctor: doctorName,
        facility: organizationName,
        date: request.preferred_date,
      },
    });

    return {
      success: true,
      waitlist_entry: newEntry,
      message: `Successfully joined the waitlist for ${doctorName}. You will be notified immediately if a slot opens up.`,
    };
  }

  public notifyWaitlistEntry(waitlistId: string): WaitlistEntry | null {
    const entry = this.getWaitlistById(waitlistId);
    if (!entry || entry.status !== "ACTIVE") return null;

    const nowIso = new Date().toISOString();
    const updated: WaitlistEntry = {
      ...entry,
      status: "NOTIFIED",
      offered_at: nowIso,
      notified_at: nowIso,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2-hour offer acceptance window
    };

    this.saveWaitlistEntry(updated);

    AuditLedger.recordEvent({
      actor_id: "SYSTEM",
      actor_name: "MEDORA Slot Release Engine",
      action: "WAITLIST_OFFERED" as any,
      resource_type: "WAITLIST_ENTRY",
      resource_id: updated.id,
      details: {
        waitlist_no: updated.waitlist_no,
        patient: updated.patient_name,
        doctor: updated.doctor_name,
        offered_at: nowIso,
      },
    });

    return updated;
  }

  public offerWaitlistSlot(waitlistId: string): WaitlistEntry | null {
    return this.notifyWaitlistEntry(waitlistId);
  }

  public acceptWaitlistOffer(waitlistId: string, actor: StoredIdentity | null): { success: boolean; waitlist?: WaitlistEntry; error?: string } {
    const entry = this.getWaitlistById(waitlistId);
    if (!entry) return { success: false, error: "Waitlist entry not found." };

    if (entry.status !== "OFFERED" && entry.status !== "NOTIFIED") {
      return { success: false, error: `Cannot accept offer with status '${entry.status}'.` };
    }

    if (entry.expires_at && new Date(entry.expires_at) < new Date()) {
      entry.status = "EXPIRED";
      this.saveWaitlistEntry(entry);
      return { success: false, error: "Waitlist offer has expired." };
    }

    const nowIso = new Date().toISOString();
    const updated: WaitlistEntry = {
      ...entry,
      status: "ACCEPTED",
      accepted_at: nowIso,
    };

    this.saveWaitlistEntry(updated);

    AuditLedger.recordEvent({
      actor_id: actor?.identifier || actor?.id || entry.patient_id,
      actor_name: actor?.fullName || entry.patient_name,
      action: "WAITLIST_ACCEPTED" as any,
      resource_type: "WAITLIST_ENTRY",
      resource_id: updated.id,
      details: {
        waitlist_no: updated.waitlist_no,
        accepted_at: nowIso,
      },
    });

    return { success: true, waitlist: updated };
  }

  public markWaitlistBooked(waitlistId: string, appointmentId: string): WaitlistEntry | null {
    const entry = this.getWaitlistById(waitlistId);
    if (!entry) return null;

    const updated: WaitlistEntry = {
      ...entry,
      status: "BOOKED",
      booked_appointment_id: appointmentId,
    };

    this.saveWaitlistEntry(updated);
    return updated;
  }

  public cancelWaitlistEntry(waitlistId: string, actorId: string): boolean {
    const entry = this.getWaitlistById(waitlistId);
    if (!entry) return false;

    const updated: WaitlistEntry = {
      ...entry,
      status: "CANCELLED",
      cancelled_at: new Date().toISOString(),
    };

    this.saveWaitlistEntry(updated);

    AuditLedger.recordEvent({
      actor_id: actorId,
      actor_name: entry.patient_name,
      action: "WAITLIST_CANCELLED" as any,
      resource_type: "WAITLIST_ENTRY",
      resource_id: updated.id,
      details: {
        waitlist_no: updated.waitlist_no,
        doctor: updated.doctor_name,
      },
    });

    return true;
  }

  public expirePastWaitlists(): number {
    const todayStr = getTodayDateStr();
    let count = 0;

    this.getAllWaitlists().forEach((entry) => {
      if (entry.preferred_date < todayStr && (entry.status === "ACTIVE" || entry.status === "NOTIFIED")) {
        this.saveWaitlistEntry({
          ...entry,
          status: "EXPIRED",
        });
        count++;
      }
    });

    return count;
  }
}

export const WaitlistStore = new WaitlistStoreClass();
