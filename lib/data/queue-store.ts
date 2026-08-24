// ============================================================
// MEDORA — QUEUE & TOKEN REPOSITORY
// MODIFICATION PHASE B.2
// ============================================================

import { QueueEntry, QueueStatus } from "@/types/database.types";

const STORAGE_KEY = "medora_queue_store";

// Helper to get today's ISO date (YYYY-MM-DD)
export function getTodayDateStr(): string {
  return new Date().toISOString().split("T")[0];
}

// Initial Seed Data for Phase B.2
const createSeededQueueEntries = (): QueueEntry[] => {
  const today = getTodayDateStr();
  const now = new Date();
  const timeOffset = (minsAgo: number) =>
    new Date(now.getTime() - minsAgo * 60000).toISOString();

  return [
    // 1. Dr. Ananya @ City Hospital (HSP-1001 / SES-1001) - Completed
    {
      id: "q-1001",
      queue_no: "QUE-1001",
      appointment_id: "apt-1000",
      patient_id: "PAT-1003",
      patient_name: "Amit Das",
      patient_phone: "+91 98765 00003",
      doctor_id: "DOC-1001",
      doctor_name: "Dr. Ananya Sharma",
      organization_id: "11111111-1111-1111-1111-111111111101",
      organization_identifier: "HSP-1001",
      organization_name: "City Hospital",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      department_name: "Cardiology OPD",
      session_id: "SES-1001",
      date: today,
      token_number: "C-01",
      token_sequence: 1,
      source: "APPOINTMENT",
      checkin_source: "RECEPTIONIST",
      status: "COMPLETED",
      room_number: "Room 102",
      checked_in_at: timeOffset(45),
      called_at: timeOffset(40),
      consultation_started_at: timeOffset(38),
      completed_at: timeOffset(15),
      created_at: timeOffset(45),
    },
    // 2. Dr. Ananya @ City Hospital (HSP-1001 / SES-1001) - In Consultation
    {
      id: "q-1002",
      queue_no: "QUE-1002",
      appointment_id: "apt-1001",
      patient_id: "PAT-1001",
      patient_name: "Rahul Verma",
      patient_phone: "+91 98765 43210",
      doctor_id: "DOC-1001",
      doctor_name: "Dr. Ananya Sharma",
      organization_id: "11111111-1111-1111-1111-111111111101",
      organization_identifier: "HSP-1001",
      organization_name: "City Hospital",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      department_name: "Cardiology OPD",
      session_id: "SES-1001",
      date: today,
      token_number: "C-02",
      token_sequence: 2,
      source: "APPOINTMENT",
      checkin_source: "PATIENT_SELF",
      status: "IN_CONSULTATION",
      room_number: "Room 102",
      checked_in_at: timeOffset(30),
      called_at: timeOffset(14),
      consultation_started_at: timeOffset(12),
      created_at: timeOffset(30),
    },
    // 3. Dr. Ananya @ City Hospital (HSP-1001 / SES-1001) - Waiting (Next in Line)
    {
      id: "q-1003",
      queue_no: "QUE-1003",
      appointment_id: "apt-1002",
      encounter_id: "ENC-1003",
      patient_id: "PAT-1002",
      patient_name: "Priya Sharma",
      patient_phone: "+91 98765 00002",
      doctor_id: "DOC-1001",
      doctor_name: "Dr. Ananya Sharma",
      organization_id: "11111111-1111-1111-1111-111111111101",
      organization_identifier: "HSP-1001",
      organization_name: "City Hospital",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      department_name: "Cardiology OPD",
      session_id: "SES-1001",
      date: today,
      token_number: "C-03",
      token_sequence: 3,
      source: "APPOINTMENT",
      checkin_source: "RECEPTIONIST",
      status: "WAITING",
      room_number: "Room 102",
      checked_in_at: timeOffset(25),
      created_at: timeOffset(25),
    },
    // 4. Dr. Ananya @ City Hospital (HSP-1001 / SES-1001) - Waiting
    {
      id: "q-1004",
      queue_no: "QUE-1004",
      appointment_id: "apt-1004",
      patient_id: "PAT-1004",
      patient_name: "Pooja Das",
      patient_phone: "+91 98765 00004",
      doctor_id: "DOC-1001",
      doctor_name: "Dr. Ananya Sharma",
      organization_id: "11111111-1111-1111-1111-111111111101",
      organization_identifier: "HSP-1001",
      organization_name: "City Hospital",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      department_name: "Cardiology OPD",
      session_id: "SES-1001",
      date: today,
      token_number: "C-04",
      token_sequence: 4,
      source: "APPOINTMENT",
      checkin_source: "PATIENT_SELF",
      status: "WAITING",
      room_number: "Room 102",
      checked_in_at: timeOffset(20),
      created_at: timeOffset(20),
    },
    // 5. Dr. Ananya @ City Hospital (HSP-1001 / SES-1001) - Skipped
    {
      id: "q-1005",
      queue_no: "QUE-1005",
      appointment_id: "apt-1005",
      patient_id: "PAT-1005",
      patient_name: "Rohan Mehra",
      patient_phone: "+91 98765 00005",
      doctor_id: "DOC-1001",
      doctor_name: "Dr. Ananya Sharma",
      organization_id: "11111111-1111-1111-1111-111111111101",
      organization_identifier: "HSP-1001",
      organization_name: "City Hospital",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      department_name: "Cardiology OPD",
      session_id: "SES-1001",
      date: today,
      token_number: "C-05",
      token_sequence: 5,
      source: "APPOINTMENT",
      checkin_source: "RECEPTIONIST",
      status: "SKIPPED",
      room_number: "Room 102",
      checked_in_at: timeOffset(18),
      called_at: timeOffset(16),
      skipped_at: timeOffset(13),
      notes: "Patient did not respond to initial call",
      created_at: timeOffset(18),
    },
    // 6. Dr. Rahul Sharma @ City Hospital (HSP-1001 / SES-1005) - Independent Queue
    {
      id: "q-1006",
      queue_no: "QUE-1006",
      appointment_id: "apt-1006",
      patient_id: "PAT-1006",
      patient_name: "Sunil Mohanty",
      patient_phone: "+91 98765 00006",
      doctor_id: "MULTI-1001",
      doctor_name: "Dr. Rahul Sharma",
      organization_id: "11111111-1111-1111-1111-111111111101",
      organization_identifier: "HSP-1001",
      organization_name: "City Hospital",
      facility_id: "FAC-1001",
      department_id: "DEP-GEN-1001",
      department_name: "General Medicine",
      session_id: "SES-1005",
      date: today,
      token_number: "R-01",
      token_sequence: 1,
      source: "APPOINTMENT",
      checkin_source: "RECEPTIONIST",
      status: "WAITING",
      room_number: "Room 105",
      checked_in_at: timeOffset(15),
      created_at: timeOffset(15),
    },
    // 7. Dr. Ananya @ Green Care Clinic (CLN-1001 / SES-1003) - Independent Facility Queue
    {
      id: "q-1007",
      queue_no: "QUE-1007",
      appointment_id: "apt-1007",
      patient_id: "PAT-1007",
      patient_name: "Sanjay Pattnayak",
      patient_phone: "+91 98765 00007",
      doctor_id: "DOC-1001",
      doctor_name: "Dr. Ananya Sharma",
      organization_id: "11111111-1111-1111-1111-111111111103",
      organization_identifier: "CLN-1001",
      organization_name: "Green Care Clinic",
      facility_id: "FAC-1003",
      department_id: "DEP-CARD-1003",
      department_name: "Cardiology Day Care",
      session_id: "SES-1003",
      date: today,
      token_number: "G-01",
      token_sequence: 1,
      source: "APPOINTMENT",
      checkin_source: "RECEPTIONIST",
      status: "WAITING",
      room_number: "Consultation 1",
      checked_in_at: timeOffset(10),
      created_at: timeOffset(10),
    },
  ];
};

class QueueStoreClass {
  private queueEntries: Map<string, QueueEntry> = new Map();
  private pausedSessions: Map<string, { paused_at: string; actor_id: string; reason?: string }> = new Map();
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
          const parsed: QueueEntry[] = JSON.parse(stored);
          parsed.forEach((q) => this.queueEntries.set(q.id.toLowerCase(), q));
          this.isInitialized = true;
          return;
        }
      } catch (err) {
        console.warn("QueueStore: Failed to load from localStorage", err);
      }
    }

    // Load initial seeds
    const seeds = createSeededQueueEntries();
    seeds.forEach((q) => this.queueEntries.set(q.id.toLowerCase(), q));
    this.persist();
    this.isInitialized = true;
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        const list = Array.from(this.queueEntries.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent("medora-queue-updated"));
      } catch (err) {
        // quota limit
      }
    }
  }

  public reset() {
    this.queueEntries.clear();
    this.pausedSessions.clear();
    const seeds = createSeededQueueEntries();
    seeds.forEach((q) => this.queueEntries.set(q.id.toLowerCase(), q));
    this.persist();
  }

  public clearAll() {
    this.queueEntries.clear();
    this.pausedSessions.clear();
    this.persist();
  }

  // ==========================================
  // QUEUE PAUSE / RESUME CONTROLS
  // ==========================================

  public pauseSession(sessionId: string, date: string, actorId: string, reason?: string): { success: boolean; message: string } {
    const key = `${sessionId.toLowerCase()}_${date}`;
    this.pausedSessions.set(key, {
      paused_at: new Date().toISOString(),
      actor_id: actorId,
      reason: reason || "Doctor emergency / operational interruption",
    });
    this.persist();
    return { success: true, message: "Queue session paused successfully." };
  }

  public resumeSession(sessionId: string, date: string, actorId: string): { success: boolean; message: string } {
    const key = `${sessionId.toLowerCase()}_${date}`;
    this.pausedSessions.delete(key);
    this.persist();
    return { success: true, message: "Queue session resumed successfully." };
  }

  public isSessionPaused(sessionId: string, date: string): boolean {
    const key = `${sessionId.toLowerCase()}_${date}`;
    return this.pausedSessions.has(key);
  }

  // ==========================================
  // QUERY APIS
  // ==========================================

  public getAllQueueEntries(): QueueEntry[] {
    return Array.from(this.queueEntries.values());
  }

  public getQueueEntryById(id: string): QueueEntry | null {
    if (!id) return null;
    const direct = this.queueEntries.get(id.toLowerCase());
    if (direct) return direct;
    return (
      this.getAllQueueEntries().find(
        (q) => q.id.toLowerCase() === id.toLowerCase() || (q.queue_no && q.queue_no.toLowerCase() === id.toLowerCase())
      ) || null
    );
  }

  public getQueueEntryByAppointmentId(appointmentId: string): QueueEntry | null {
    if (!appointmentId) return null;
    return (
      this.getAllQueueEntries().find(
        (q) => q.appointment_id && q.appointment_id.toLowerCase() === appointmentId.toLowerCase()
      ) || null
    );
  }

  public getQueueForSession(sessionId: string, date: string): QueueEntry[] {
    return this.getAllQueueEntries()
      .filter((q) => q.session_id === sessionId && q.date === date)
      .sort((a, b) => a.token_sequence - b.token_sequence);
  }

  public getQueueForDoctor(doctorId: string, orgIdentifier?: string, date?: string): QueueEntry[] {
    return this.getAllQueueEntries()
      .filter((q) => {
        const matchDoc = q.doctor_id === doctorId;
        const matchOrg = orgIdentifier ? q.organization_identifier === orgIdentifier : true;
        const matchDate = date ? q.date === date : true;
        return matchDoc && matchOrg && matchDate;
      })
      .sort((a, b) => a.token_sequence - b.token_sequence);
  }

  public getQueueForFacility(orgIdentifier: string, date?: string): QueueEntry[] {
    return this.getAllQueueEntries()
      .filter((q) => {
        const matchOrg = q.organization_identifier === orgIdentifier;
        const matchDate = date ? q.date === date : true;
        return matchOrg && matchDate;
      })
      .sort((a, b) => a.token_sequence - b.token_sequence);
  }

  public getPatientActiveQueueEntry(patientId: string, date?: string): QueueEntry | null {
    const targetDate = date || getTodayDateStr();
    const activeStatuses: QueueStatus[] = ["WAITING", "CALLED", "IN_CONSULTATION"];
    return (
      this.getAllQueueEntries().find(
        (q) => q.patient_id === patientId && q.date === targetDate && activeStatuses.includes(q.status)
      ) || null
    );
  }

  // ==========================================
  // SERVER-SIDE TOKEN GENERATOR
  // ==========================================

  /**
   * Deterministically and atomically computes the next sequential token
   * strictly scoped to (organization, facility, doctor, session, date).
   */
  public getNextToken(
    orgIdentifier: string,
    facilityId: string,
    departmentId: string,
    doctorId: string,
    sessionId: string,
    date: string,
    doctorName?: string
  ): { tokenNumber: string; sequenceNumber: number } {
    // 1. Determine prefix
    let prefix = "C-"; // Default Cardiology / Clinical
    if (doctorName?.toLowerCase().includes("rahul")) {
      prefix = "R-";
    } else if (orgIdentifier === "CLN-1001") {
      prefix = "G-";
    } else if (departmentId.includes("GEN")) {
      prefix = "M-";
    } else if (departmentId.includes("PED")) {
      prefix = "P-";
    } else if (departmentId.includes("ORTH")) {
      prefix = "O-";
    }

    // 2. Query all existing entries for this specific queue context
    const existingEntries = this.getAllQueueEntries().filter(
      (q) =>
        q.organization_identifier === orgIdentifier &&
        q.session_id === sessionId &&
        q.doctor_id === doctorId &&
        q.date === date
    );

    // 3. Determine highest sequence
    let maxSequence = 0;
    for (const entry of existingEntries) {
      if (entry.token_sequence && entry.token_sequence > maxSequence) {
        maxSequence = entry.token_sequence;
      }
    }

    const sequenceNumber = maxSequence + 1;
    const tokenNumber = `${prefix}${String(sequenceNumber).padStart(2, "0")}`;

    return { tokenNumber, sequenceNumber };
  }

  // ==========================================
  // PERSISTENCE OPERATIONS
  // ==========================================

  public saveQueueEntry(entry: QueueEntry): QueueEntry {
    const updated = {
      ...entry,
      id: entry.id.toLowerCase(),
      updated_at: new Date().toISOString(),
    };
    this.queueEntries.set(updated.id, updated);
    this.persist();
    return updated;
  }

  public deleteQueueEntry(id: string): boolean {
    const deleted = this.queueEntries.delete(id.toLowerCase());
    if (deleted) this.persist();
    return deleted;
  }
}

export const QueueStore = new QueueStoreClass();
