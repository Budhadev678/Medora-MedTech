// ============================================================
// MEDORA — PRESCRIPTION CORE STORE (PHASE 4.3)
// Authoritative Clinician-Prescribed Medication Orders
// Hierarchy: PATIENT -> ENCOUNTER -> CLINICAL RECORD -> PRESCRIPTION
// ============================================================

import type {
  HealthcarePrescription,
  PrescriptionItem,
  PrescriptionStatus,
  PrescriptionRoute,
} from "@/types/database.types";
import { getEncounterById } from "@/lib/data/encounter-store";
import { findIdentityById } from "@/lib/data/identity-store";
import { appendAuditEvent } from "@/lib/data/audit-store";

export type { HealthcarePrescription, PrescriptionItem, PrescriptionStatus, PrescriptionRoute };

// ============================================================
// CANONICAL SEEDED PRESCRIPTIONS
// ============================================================

export const SEEDED_PRESCRIPTIONS: HealthcarePrescription[] = [
  // 1. Prescription for ENC-1001 (Rahul Verma at City Hospital - Issued)
  {
    id: "RX-1001",
    prescription_reference: "RX-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1001",
    clinical_record_id: "CR-1001",
    prescriber_id: "DOC-1001",
    prescriber_name: "Dr. Ananya Sharma",
    prescriber_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    department_name: "Cardiology OPD",
    status: "ISSUED",
    items: [
      {
        id: "RXI-1",
        medicine_name: "Telmisartan",
        strength: "40 mg",
        dosage: "1 tablet",
        route: "ORAL",
        frequency: "Once daily (morning)",
        duration: "30 days",
        quantity: "30 tablets",
        instructions: "Take after breakfast with a glass of water.",
      },
      {
        id: "RXI-2",
        medicine_name: "Aspirin (Enteric Coated)",
        strength: "75 mg",
        dosage: "1 tablet",
        route: "ORAL",
        frequency: "Once daily (night)",
        duration: "30 days",
        quantity: "30 tablets",
        instructions: "Take after dinner.",
      },
    ],
    refills_allowed: 1,
    refills_used: 0,
    notes: "Patient advised DASH diet, sodium restriction (<2g/day), and daily home BP log.",
    issued_at: "2026-08-20T10:25:00Z",
    created_at: "2026-08-20T10:20:00Z",
    updated_at: "2026-08-20T10:25:00Z",
  },
  // 2. Prescription for ENC-1002 (Rahul Verma at Green Care Clinic - Issued Follow-Up)
  {
    id: "RX-1002",
    prescription_reference: "RX-1002",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1002",
    clinical_record_id: "CR-1002",
    prescriber_id: "DOC-1001",
    prescriber_name: "Dr. Ananya Sharma",
    prescriber_role: "Visiting Cardiologist",
    organization_id: "CLN-1001",
    organization_name: "Green Care Clinic",
    department_name: "General Medicine",
    status: "ISSUED",
    items: [
      {
        id: "RXI-1",
        medicine_name: "Telmisartan",
        strength: "40 mg",
        dosage: "1 tablet",
        route: "ORAL",
        frequency: "Once daily (morning)",
        duration: "90 days",
        quantity: "90 tablets",
        instructions: "Continue maintenance monotherapy. Recheck in 3 months.",
      },
    ],
    refills_allowed: 2,
    refills_used: 0,
    notes: "Maintenance refill prescribed for 3-month follow-up window.",
    issued_at: "2026-08-15T16:18:00Z",
    created_at: "2026-08-15T16:15:00Z",
    updated_at: "2026-08-15T16:18:00Z",
  },
];

const STORAGE_KEY = "medora_prescriptions_store_v1";

// Cache for rapid double-click debounce
const recentPrescriptionSubmissions = new Map<string, number>();

/**
 * Retrieve all prescriptions with localStorage persistence.
 */
export function getAllPrescriptions(): HealthcarePrescription[] {
  if (typeof window === "undefined") {
    return SEEDED_PRESCRIPTIONS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_PRESCRIPTIONS));
      return SEEDED_PRESCRIPTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEEDED_PRESCRIPTIONS;
  } catch {
    return SEEDED_PRESCRIPTIONS;
  }
}

/**
 * Persist prescriptions to localStorage and dispatch update event.
 */
function savePrescriptions(prescriptions: HealthcarePrescription[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));
    window.dispatchEvent(new Event("medora-prescriptions-updated"));
  } catch (e) {
    console.error("Failed to save prescriptions:", e);
  }
}

/**
 * Retrieve a single prescription by ID or reference.
 */
export function getPrescriptionById(id: string): HealthcarePrescription | null {
  const all = getAllPrescriptions();
  const cleanId = id.trim();
  return all.find((p) => p.id === cleanId || p.prescription_reference === cleanId) || null;
}

/**
 * Retrieve prescriptions for a specific patient.
 * STRICT PATIENT ISOLATION: When called in patient mode, filters out unissued DRAFT prescriptions.
 */
export function getPatientPrescriptions(
  patientIdOrIdentifier: string,
  includeDrafts: boolean = false
): HealthcarePrescription[] {
  const all = getAllPrescriptions();
  const targetId = patientIdOrIdentifier.trim().toLowerCase();

  return all
    .filter((p) => {
      const matchPatient = p.patient_id.toLowerCase() === targetId;
      if (!matchPatient) return false;
      if (!includeDrafts && p.status === "DRAFT") return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Retrieve prescriptions for a doctor with optional organization scoping.
 */
export function getDoctorPrescriptions(
  doctorIdOrIdentifier: string,
  organizationId?: string
): HealthcarePrescription[] {
  const all = getAllPrescriptions();
  const targetDoc = doctorIdOrIdentifier.trim();

  return all
    .filter((p) => {
      const matchDoc = p.prescriber_id === targetDoc;
      if (!matchDoc) return false;
      if (organizationId && p.organization_id !== organizationId.trim()) return false;
      return true;
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

/**
 * Retrieve prescriptions attached to a specific Encounter.
 */
export function getEncounterPrescriptions(encounterId: string): HealthcarePrescription[] {
  const all = getAllPrescriptions();
  const cleanId = encounterId.trim();
  return all.filter((p) => p.encounter_id === cleanId);
}

export interface SavePrescriptionDraftParams {
  encounterId: string;
  items: PrescriptionItem[];
  notes?: string;
  refillsAllowed?: number;
  actorId: string;
  actorName: string;
  actorRole: string;
}

/**
 * Save or update a Prescription Draft for an active Encounter.
 */
export function savePrescriptionDraft(
  params: SavePrescriptionDraftParams
): { success: boolean; prescription?: HealthcarePrescription; error?: string } {
  const { encounterId, items, notes, refillsAllowed = 0, actorId, actorName, actorRole } = params;

  // 1. Debounce protection (2s lock)
  const debounceKey = `rx_draft_${encounterId}_${actorId}`;
  const lastTime = recentPrescriptionSubmissions.get(debounceKey) || 0;
  if (Date.now() - lastTime < 2000) {
    return { success: false, error: "A prescription save operation is in progress. Please wait." };
  }
  recentPrescriptionSubmissions.set(debounceKey, Date.now());

  // 2. Validate Encounter
  const encounter = getEncounterById(encounterId);
  if (!encounter) {
    return { success: false, error: `Encounter ${encounterId} not found.` };
  }
  if (encounter.status === "CANCELLED") {
    return { success: false, error: "Cannot create a prescription for a CANCELLED encounter." };
  }

  // 3. Resolve & Verify Prescriber
  const prescriber = findIdentityById(actorId);
  if (!prescriber || prescriber.accountStatus !== "active") {
    return { success: false, error: "Prescribing doctor account is invalid or inactive." };
  }

  // Verify doctor affiliation
  if (prescriber.doctorData && actorRole === "doctor") {
    const activeAffiliation = prescriber.doctorData.affiliations.find(
      (a) =>
        (a.organizationId === encounter.organization_id || a.organizationIdentifier === encounter.organization_id) &&
        a.status === "active"
    );
    if (!activeAffiliation) {
      return {
        success: false,
        error: `Doctor ${prescriber.fullName} is not actively affiliated with ${encounter.organization_name}.`,
      };
    }
  }

  const all = getAllPrescriptions();
  const existingDraftIndex = all.findIndex(
    (p) => p.encounter_id === encounterId && p.status === "DRAFT"
  );
  const nowIso = new Date().toISOString();

  if (existingDraftIndex >= 0) {
    const existing = all[existingDraftIndex];
    existing.items = items;
    existing.notes = notes;
    existing.refills_allowed = refillsAllowed;
    existing.updated_at = nowIso;

    all[existingDraftIndex] = existing;
    savePrescriptions(all);

    appendAuditEvent(
      "PRESCRIPTION_UPDATED",
      actorId,
      actorName,
      actorRole,
      `Updated draft prescription ${existing.id} for encounter ${encounterId}`,
      existing.patient_id,
      existing.organization_id,
      existing.organization_name,
      existing.id,
      { itemsCount: items.length }
    );

    return { success: true, prescription: existing };
  }

  // Create New Draft Prescription
  const nextNum = all.length + 1001;
  const newId = `RX-${nextNum}`;

  const newPrescription: HealthcarePrescription = {
    id: newId,
    prescription_reference: newId,
    patient_id: encounter.patient_id,
    patient_name: encounter.patient_name,
    encounter_id: encounterId,
    prescriber_id: actorId,
    prescriber_name: prescriber.fullName,
    prescriber_role: prescriber.doctorData?.qualifications
      ? `Consultant (${prescriber.doctorData.specialization})`
      : "Attending Doctor",
    organization_id: encounter.organization_id,
    organization_name: encounter.organization_name,
    department_name: encounter.department_name,
    status: "DRAFT",
    items,
    refills_allowed: refillsAllowed,
    refills_used: 0,
    notes,
    created_at: nowIso,
    updated_at: nowIso,
  };

  all.unshift(newPrescription);
  savePrescriptions(all);

  appendAuditEvent(
    "PRESCRIPTION_CREATED",
    actorId,
    actorName,
    actorRole,
    `Created draft prescription ${newId} for encounter ${encounterId}`,
    encounter.patient_id,
    encounter.organization_id,
    encounter.organization_name,
    newId,
    { itemsCount: items.length }
  );

  return { success: true, prescription: newPrescription };
}

export interface IssuePrescriptionParams {
  prescriptionId?: string;
  encounterId: string;
  items: PrescriptionItem[];
  notes?: string;
  refillsAllowed?: number;
  actorId: string;
  actorName: string;
  actorRole: string;
}

/**
 * Issue an authoritative Prescription.
 * Validates at least 1 medicine item, transitions to ISSUED, and signs off.
 */
export function issuePrescription(
  params: IssuePrescriptionParams
): { success: boolean; prescription?: HealthcarePrescription; error?: string } {
  const { prescriptionId, encounterId, items, notes, refillsAllowed = 0, actorId, actorName, actorRole } = params;

  // 1. Validation: At least one medicine required
  if (!items || items.length === 0) {
    return { success: false, error: "Please add at least one medicine item to issue a prescription." };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.medicine_name.trim()) {
      return { success: false, error: `Medicine item #${i + 1} requires a valid medicine name.` };
    }
    if (!item.dosage?.trim()) {
      return { success: false, error: `Medicine "${item.medicine_name}" requires a dosage (e.g. 1 tablet).` };
    }
    if (!item.frequency?.trim()) {
      return { success: false, error: `Medicine "${item.medicine_name}" requires a frequency.` };
    }
  }

  // 2. Validate Encounter
  const encounter = getEncounterById(encounterId);
  if (!encounter) {
    return { success: false, error: `Encounter ${encounterId} not found.` };
  }
  if (encounter.status === "CANCELLED") {
    return { success: false, error: "Cannot issue a prescription for a CANCELLED encounter." };
  }

  // 3. Resolve & Verify Prescriber
  const prescriber = findIdentityById(actorId);
  if (!prescriber || prescriber.accountStatus !== "active") {
    return { success: false, error: "Prescribing doctor account is invalid or inactive." };
  }

  const all = getAllPrescriptions();
  const nowIso = new Date().toISOString();

  // Find existing draft if ID provided or by encounter draft
  let targetIndex = -1;
  if (prescriptionId) {
    targetIndex = all.findIndex((p) => p.id === prescriptionId || p.prescription_reference === prescriptionId);
  } else {
    targetIndex = all.findIndex((p) => p.encounter_id === encounterId && p.status === "DRAFT");
  }

  let finalPrescription: HealthcarePrescription;

  if (targetIndex >= 0) {
    finalPrescription = all[targetIndex];
    if (finalPrescription.status === "ISSUED") {
      return { success: false, error: "This prescription is already ISSUED and cannot be re-issued." };
    }
    finalPrescription.items = items;
    finalPrescription.notes = notes;
    finalPrescription.refills_allowed = refillsAllowed;
    finalPrescription.status = "ISSUED";
    finalPrescription.issued_at = nowIso;
    finalPrescription.updated_at = nowIso;
    all[targetIndex] = finalPrescription;
  } else {
    const nextNum = all.length + 1001;
    const newId = `RX-${nextNum}`;

    finalPrescription = {
      id: newId,
      prescription_reference: newId,
      patient_id: encounter.patient_id,
      patient_name: encounter.patient_name,
      encounter_id: encounterId,
      prescriber_id: actorId,
      prescriber_name: prescriber.fullName,
      prescriber_role: prescriber.doctorData?.qualifications
        ? `Consultant (${prescriber.doctorData.specialization})`
        : "Attending Doctor",
      organization_id: encounter.organization_id,
      organization_name: encounter.organization_name,
      department_name: encounter.department_name,
      status: "ISSUED",
      items,
      refills_allowed: refillsAllowed,
      refills_used: 0,
      notes,
      issued_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };
    all.unshift(finalPrescription);
  }

  savePrescriptions(all);

  appendAuditEvent(
    "PRESCRIPTION_ISSUED",
    actorId,
    actorName,
    actorRole,
    `Issued digital prescription ${finalPrescription.id} with ${items.length} medicine(s) for patient ${encounter.patient_name}`,
    encounter.patient_id,
    encounter.organization_id,
    encounter.organization_name,
    finalPrescription.id,
    {
      itemsCount: items.length,
      issuedAt: nowIso,
    }
  );

  return { success: true, prescription: finalPrescription };
}

/**
 * Cancel an issued prescription with a mandatory documented reason.
 */
export function cancelPrescription(
  prescriptionId: string,
  cancellationReason: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; prescription?: HealthcarePrescription; error?: string } {
  const cleanReason = cancellationReason?.trim();
  if (!cleanReason) {
    return { success: false, error: "A cancellation reason is required to cancel an issued prescription." };
  }

  const all = getAllPrescriptions();
  const index = all.findIndex((p) => p.id === prescriptionId || p.prescription_reference === prescriptionId);

  if (index < 0) {
    return { success: false, error: `Prescription ${prescriptionId} not found.` };
  }

  const rx = all[index];
  const nowIso = new Date().toISOString();
  rx.status = "CANCELLED";
  rx.cancelled_at = nowIso;
  rx.cancellation_reason = cleanReason;
  rx.updated_at = nowIso;

  all[index] = rx;
  savePrescriptions(all);

  appendAuditEvent(
    "PRESCRIPTION_CANCELLED",
    actorId,
    actorName,
    actorRole,
    `Cancelled prescription ${rx.id}: ${cleanReason}`,
    rx.patient_id,
    rx.organization_id,
    rx.organization_name,
    rx.id,
    { cancellationReason: cleanReason }
  );

  return { success: true, prescription: rx };
}
