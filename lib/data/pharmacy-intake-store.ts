// ============================================================
// MEDORA — PHARMACY PRESCRIPTION INTAKE REPOSITORY (PHASE 9.1)
// Operational Intake, Validation & Clarification Request Store
// ============================================================

import type {
  PharmacyPrescriptionIntake,
  PharmacyIntakeStatus,
  PrescriptionClarificationRequest,
  ClarificationStatus,
} from "@/types/database.types";
import { getPharmacyFacilityById } from "@/lib/data/pharmacy-organization-store";
import { appendAuditEvent } from "@/lib/data/audit-store";

let INTAKES_STORE: PharmacyPrescriptionIntake[] = [
  {
    id: "PHARM-INTAKE-1001",
    prescription_id: "PRX-1001",
    prescription_version: 1,
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    prescriber_id: "DOC-1001",
    prescriber_name: "Dr. Ananya Sharma",
    pharmacy_organization_id: "PHARM-ORG-1001",
    facility_id: "PHARM-FAC-1001",
    status: "VALID",
    received_at: "2026-08-20T11:00:00Z",
    received_by_id: "USR-PHARM-01",
    received_by_name: "Pharmacist Priya",
    validated_at: "2026-08-20T11:05:00Z",
    validated_by_id: "USR-PHARM-01",
    validated_by_name: "Pharmacist Priya",
    created_at: "2026-08-20T11:00:00Z",
    updated_at: "2026-08-20T11:05:00Z",
  },
];

let CLARIFICATIONS_STORE: PrescriptionClarificationRequest[] = [];

const INTAKES_KEY = "medora_pharmacy_intakes_store";

export function getAllIntakes(): PharmacyPrescriptionIntake[] {
  let intakes = [...INTAKES_STORE];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(INTAKES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          intakes = parsed;
        }
      }
    } catch {}
  }

  // Synchronize with prescription store so any prescription routed to a pharmacy is guaranteed to be in the intake queue
  try {
    const rxStore = require("@/lib/data/prescription-store");
    const allRxs = rxStore.getAllPrescriptions ? rxStore.getAllPrescriptions() : [];
    allRxs.forEach((rx: any) => {
      const targetPharmacyId = rx.selected_pharmacy_id || rx.assigned_pharmacy_id;
      if (targetPharmacyId && rx.status !== "DRAFT" && rx.status !== "CANCELLED") {
        const exists = intakes.some(
          (i) => i.prescription_id.toLowerCase() === rx.id.toLowerCase() && i.facility_id.toLowerCase() === targetPharmacyId.toLowerCase()
        );
        if (!exists) {
          const intakeId = `PHARM-INTAKE-${1000 + intakes.length + 1}`;
          intakes.unshift({
            id: intakeId,
            prescription_id: rx.id,
            prescription_version: rx.version || 1,
            patient_id: rx.patient_id,
            patient_name: rx.patient_name,
            prescriber_id: rx.prescriber_id,
            prescriber_name: rx.prescriber_name,
            pharmacy_organization_id: "PHARM-ORG-1001",
            facility_id: targetPharmacyId,
            status: rx.status === "DISPENSED" ? "DISPENSED" as any : "RECEIVED",
            received_at: rx.pharmacy_selected_at || rx.issued_at || rx.created_at,
            created_at: rx.pharmacy_selected_at || rx.created_at,
            updated_at: rx.updated_at || rx.created_at,
          });
        }
      }
    });
  } catch {}

  return intakes;
}

export function saveIntakes(intakes: PharmacyPrescriptionIntake[]): void {
  INTAKES_STORE = intakes;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(INTAKES_KEY, JSON.stringify(intakes));
      window.dispatchEvent(new CustomEvent("medora-pharmacy-intakes-updated"));
      window.dispatchEvent(new CustomEvent("medora-pharmacy-updated"));
      window.dispatchEvent(new CustomEvent("medora-prescriptions-updated"));
    } catch (e) {
      console.error("Failed to persist pharmacy intakes:", e);
    }
  }
}

export function getIntakeById(id: string): PharmacyPrescriptionIntake | null {
  const all = getAllIntakes();
  const clean = (id || "").trim().toLowerCase();
  return all.find((i) => i.id.toLowerCase() === clean) || null;
}

export function getIntakesByFacility(facilityId: string, filterStatus?: string): PharmacyPrescriptionIntake[] {
  const cleanFac = (facilityId || "").trim().toLowerCase();
  const all = getAllIntakes();
  return all.filter((i) => {
    if (i.facility_id.toLowerCase() !== cleanFac) return false;
    if (filterStatus && filterStatus !== "ALL") {
      if (i.status.toUpperCase() !== filterStatus.trim().toUpperCase()) return false;
    }
    return true;
  });
}

export function getIntakesByPrescription(prescriptionId: string): PharmacyPrescriptionIntake[] {
  const clean = (prescriptionId || "").trim().toLowerCase();
  const all = getAllIntakes();
  return all.filter((i) => i.prescription_id.toLowerCase() === clean);
}

export function getIntakesByPatient(patientId: string): PharmacyPrescriptionIntake[] {
  const clean = (patientId || "").trim().toLowerCase();
  const all = getAllIntakes();
  return all.filter((i) => i.patient_id.toLowerCase() === clean);
}

/**
 * Creates an operational PharmacyPrescriptionIntake record for a Phase 7 prescription.
 */
export function createPrescriptionIntake(params: {
  prescriptionId: string;
  prescriptionVersion: number;
  patientId: string;
  patientName: string;
  prescriberId: string;
  prescriberName: string;
  facilityId: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
}): { success: boolean; intake?: PharmacyPrescriptionIntake; error?: string } {
  const facility = getPharmacyFacilityById(params.facilityId);
  if (!facility) return { success: false, error: `Pharmacy facility ${params.facilityId} not found.` };

  if (facility.operational_status !== "ACTIVE") {
    return { success: false, error: `Pharmacy facility ${facility.name} is currently ${facility.operational_status}. Cannot accept intake.` };
  }

  const all = getAllIntakes();

  // Idempotent lookup for same prescription & facility
  const existing = all.find(
    (i) => i.prescription_id.toLowerCase() === params.prescriptionId.toLowerCase() && i.facility_id.toLowerCase() === params.facilityId.toLowerCase()
  );

  if (existing) {
    return { success: true, intake: existing };
  }

  const now = new Date().toISOString();
  const nextNum = 1000 + all.length + 1;
  const newIntake: PharmacyPrescriptionIntake = {
    id: `PHARM-INTAKE-${nextNum}`,
    prescription_id: params.prescriptionId,
    prescription_version: params.prescriptionVersion,
    patient_id: params.patientId,
    patient_name: params.patientName,
    prescriber_id: params.prescriberId,
    prescriber_name: params.prescriberName,
    pharmacy_organization_id: facility.organization_id,
    facility_id: facility.id,
    status: "RECEIVED",
    received_at: now,
    received_by_id: params.actorId,
    received_by_name: params.actorName,
    created_at: now,
    updated_at: now,
  };

  all.unshift(newIntake);
  saveIntakes(all);

  appendAuditEvent(
    "PRESCRIPTION_RECEIVED_BY_PHARMACY",
    params.actorId || "SYSTEM",
    params.actorName || "System",
    params.actorRole || "system",
    `Pharmacy ${facility.name} received prescription intake for ${params.prescriptionId} (Patient: ${params.patientName})`,
    params.patientId,
    facility.organization_id,
    facility.organization_name,
    newIntake.id
  );

  return { success: true, intake: newIntake };
}

/**
 * Updates status of a PharmacyPrescriptionIntake record in backend state machine.
 */
export function updateIntakeStatus(params: {
  intakeId: string;
  status: PharmacyIntakeStatus;
  rejectionReason?: string;
  notes?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; intake?: PharmacyPrescriptionIntake; error?: string } {
  const all = getAllIntakes();
  const index = all.findIndex((i) => i.id.toLowerCase() === params.intakeId.trim().toLowerCase());
  if (index === -1) return { success: false, error: `Pharmacy intake ${params.intakeId} not found.` };

  const existing = all[index];

  // Prevent illegal transitions from terminal states
  if (existing.status === "CANCELLED" || existing.status === "INVALID") {
    return { success: false, error: `Cannot update intake in terminal status ${existing.status}.` };
  }

  const now = new Date().toISOString();
  const updated: PharmacyPrescriptionIntake = {
    ...existing,
    status: params.status,
    validated_at: params.status === "VALID" ? now : existing.validated_at,
    validated_by_id: params.status === "VALID" ? params.actorId : existing.validated_by_id,
    validated_by_name: params.status === "VALID" ? params.actorName : existing.validated_by_name,
    rejection_reason: params.rejectionReason || existing.rejection_reason,
    notes: params.notes || existing.notes,
    updated_at: now,
  };

  all[index] = updated;
  saveIntakes(all);

  const eventType =
    params.status === "VALID"
      ? "PRESCRIPTION_VALIDATED"
      : params.status === "INVALID"
      ? "PRESCRIPTION_REJECTED"
      : "PRESCRIPTION_REVIEW_STARTED";

  appendAuditEvent(
    eventType,
    params.actorId,
    params.actorName,
    params.actorRole,
    `Pharmacy intake ${existing.id} status updated to ${params.status}`,
    existing.patient_id,
    existing.pharmacy_organization_id,
    undefined,
    existing.id
  );

  return { success: true, intake: updated };
}

/**
 * Creates a formal Prescription Clarification Request.
 */
export function createClarificationRequest(params: {
  prescriptionId: string;
  pharmacyIntakeId: string;
  facilityId: string;
  recipientDoctorId: string;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; request?: PrescriptionClarificationRequest; error?: string } {
  if (!params.reason || !params.reason.trim()) {
    return { success: false, error: "Clarification reason is mandatory." };
  }

  const intake = getIntakeById(params.pharmacyIntakeId);
  if (!intake) return { success: false, error: `Pharmacy intake ${params.pharmacyIntakeId} not found.` };

  const now = new Date().toISOString();
  const nextNum = 1000 + CLARIFICATIONS_STORE.length + 1;
  const newReq: PrescriptionClarificationRequest = {
    id: `CLAR-${nextNum}`,
    prescription_id: params.prescriptionId,
    pharmacy_intake_id: params.pharmacyIntakeId,
    requested_by_id: params.actorId,
    requested_by_name: params.actorName,
    pharmacy_facility_id: params.facilityId,
    recipient_doctor_id: params.recipientDoctorId,
    reason: params.reason.trim(),
    status: "OPEN",
    created_at: now,
  };

  CLARIFICATIONS_STORE.push(newReq);

  // Update intake status to REQUIRES_CLARIFICATION
  updateIntakeStatus({
    intakeId: params.pharmacyIntakeId,
    status: "REQUIRES_CLARIFICATION",
    notes: `Clarification requested: ${params.reason.trim()}`,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
  });

  appendAuditEvent(
    "PRESCRIPTION_CLARIFICATION_REQUESTED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Requested prescriber clarification for ${params.prescriptionId}: ${params.reason.trim()}`,
    intake.patient_id,
    intake.pharmacy_organization_id,
    undefined,
    newReq.id
  );

  return { success: true, request: newReq };
}

export function getClarificationRequestsForIntake(intakeId: string): PrescriptionClarificationRequest[] {
  const clean = (intakeId || "").trim().toLowerCase();
  return CLARIFICATIONS_STORE.filter((c) => c.pharmacy_intake_id.toLowerCase() === clean);
}
