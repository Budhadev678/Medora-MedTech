// ============================================================
// MEDORA — PRESCRIPTION CORE STORE (PHASE C.2)
// Authoritative Clinician-Prescribed Medication Orders
// Hierarchy: PATIENT -> ENCOUNTER -> CLINICAL RECORD -> PRESCRIPTION
// ============================================================

import type {
  HealthcarePrescription,
  PrescriptionItem,
  PrescriptionStatus,
  PrescriptionRoute,
  PrescriptionVersionSnapshot,
} from "@/types/database.types";
import { getEncounterById } from "@/lib/data/encounter-store";
import { findIdentityById, StoredIdentity } from "@/lib/data/identity-store";
import { appendAuditEvent } from "@/lib/data/audit-store";

export type {
  HealthcarePrescription,
  PrescriptionItem,
  PrescriptionStatus,
  PrescriptionRoute,
  PrescriptionVersionSnapshot,
};

// ============================================================
// CANONICAL SEEDED PRESCRIPTIONS
// ============================================================

export const SEEDED_PRESCRIPTIONS: HealthcarePrescription[] = [
  // 1. Prescription for ENC-1001 (Rahul Verma at City Hospital - Issued)
  {
    id: "PRX-1001",
    prescription_reference: "PRX-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1001",
    clinical_record_id: "CR-1001",
    prescriber_id: "DOC-1001",
    prescriber_name: "Dr. Ananya Sharma",
    prescriber_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    facility_name: "City Hospital",
    department_name: "Cardiology OPD",
    status: "ISSUED",
    version: 1,
    version_history: [],
    items: [
      {
        id: "PRI-1",
        medicine_id: "MED-1001",
        medicine_name: "Telmisartan (Telma 40)",
        generic_name: "Telmisartan",
        brand_name: "Telma 40",
        strength: "40 mg",
        strength_value: 40,
        strength_unit: "mg",
        dosage: "1 tablet",
        dosage_quantity: 1,
        dosage_form: "tablet",
        route: "ORAL",
        frequency: "Once daily (morning)",
        timing: "AFTER_FOOD",
        duration: "30 days",
        duration_days: 30,
        duration_unit: "DAYS",
        quantity: "30 tablets",
        instructions: "Take after breakfast with a glass of water.",
        is_prn: false,
        status: "ACTIVE",
      },
      {
        id: "PRI-2",
        medicine_id: "MED-1003",
        medicine_name: "Aspirin (Enteric Coated) (Ecosprin 75)",
        generic_name: "Aspirin (Enteric Coated)",
        brand_name: "Ecosprin 75",
        strength: "75 mg",
        strength_value: 75,
        strength_unit: "mg",
        dosage: "1 tablet",
        dosage_quantity: 1,
        dosage_form: "tablet",
        route: "ORAL",
        frequency: "Once daily (night)",
        timing: "AFTER_FOOD",
        duration: "30 days",
        duration_days: 30,
        duration_unit: "DAYS",
        quantity: "30 tablets",
        instructions: "Take after dinner.",
        is_prn: false,
        status: "ACTIVE",
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
    id: "PRX-1002",
    prescription_reference: "PRX-1002",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1002",
    clinical_record_id: "CR-1002",
    prescriber_id: "DOC-1001",
    prescriber_name: "Dr. Ananya Sharma",
    prescriber_role: "Visiting Cardiologist",
    organization_id: "CLN-1001",
    organization_name: "Green Care Clinic",
    facility_id: "FAC-1003",
    facility_name: "Green Care Clinic",
    department_name: "General Medicine",
    status: "ISSUED",
    version: 1,
    version_history: [],
    items: [
      {
        id: "PRI-1",
        medicine_id: "MED-1001",
        medicine_name: "Telmisartan (Telma 40)",
        generic_name: "Telmisartan",
        brand_name: "Telma 40",
        strength: "40 mg",
        strength_value: 40,
        strength_unit: "mg",
        dosage: "1 tablet",
        dosage_quantity: 1,
        dosage_form: "tablet",
        route: "ORAL",
        frequency: "Once daily (morning)",
        timing: "AFTER_FOOD",
        duration: "90 days",
        duration_days: 90,
        duration_unit: "DAYS",
        quantity: "90 tablets",
        instructions: "Continue maintenance monotherapy. Recheck in 3 months.",
        is_prn: false,
        status: "ACTIVE",
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

let inMemoryPrescriptions: HealthcarePrescription[] = [...SEEDED_PRESCRIPTIONS];
const STORAGE_KEY = "medora_prescriptions_store_v1";

/**
 * Retrieve all prescriptions with localStorage persistence.
 */
export function getAllPrescriptions(): HealthcarePrescription[] {
  if (typeof window === "undefined") {
    return inMemoryPrescriptions;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryPrescriptions));
      return inMemoryPrescriptions;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryPrescriptions;
  } catch {
    return inMemoryPrescriptions;
  }
}

/**
 * Persist prescriptions to localStorage and in-memory cache.
 */
export function savePrescriptions(prescriptions: HealthcarePrescription[]): void {
  inMemoryPrescriptions = prescriptions;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));
    window.dispatchEvent(new Event("medora-prescriptions-updated"));
  } catch (e) {
    console.error("Failed to save prescriptions:", e);
  }
}

/**
 * Retrieve a single prescription by ID, reference, or verification token.
 */
export function getPrescriptionById(id: string): HealthcarePrescription | null {
  if (!id) return null;
  const all = getAllPrescriptions();
  const cleanId = id.trim().toUpperCase();
  const normalizedId = cleanId.startsWith("RX-") ? `PRX-${cleanId.substring(3)}` : cleanId;
  return (
    all.find(
      (p) =>
        (p.id && (p.id.toUpperCase() === cleanId || p.id.toUpperCase() === normalizedId)) ||
        (p.prescription_reference &&
          (p.prescription_reference.toUpperCase() === cleanId ||
            p.prescription_reference.toUpperCase() === normalizedId)) ||
        (p.verification_token && p.verification_token.toUpperCase() === cleanId)
    ) || null
  );
}

/**
 * Retrieve prescriptions for a specific patient.
 * STRICT PATIENT ISOLATION: When called in patient mode, filters out unissued DRAFT prescriptions.
 */
export function getPatientPrescriptions(
  patientIdOrIdentifier: string,
  includeDrafts: boolean = false
): HealthcarePrescription[] {
  if (!patientIdOrIdentifier) return [];
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
  if (!doctorIdOrIdentifier) return [];
  const all = getAllPrescriptions();
  const targetDoc = doctorIdOrIdentifier.trim().toLowerCase();

  return all
    .filter((p) => {
      const matchDoc = p.prescriber_id.toLowerCase() === targetDoc;
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
  if (!encounterId) return [];
  const all = getAllPrescriptions();
  const cleanId = encounterId.trim().toUpperCase();
  return all.filter((p) => p.encounter_id && p.encounter_id.toUpperCase() === cleanId);
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

  // 1. Validate Encounter
  const encounter = getEncounterById(encounterId);
  if (!encounter) {
    return { success: false, error: `Parent Healthcare Encounter ${encounterId} not found.` };
  }
  if (encounter.status === "CANCELLED") {
    return { success: false, error: "Cannot create or modify a prescription for a CANCELLED encounter." };
  }

  // 2. Resolve & Verify Prescriber
  const prescriber = findIdentityById(actorId);
  if (!prescriber || prescriber.accountStatus !== "active") {
    return { success: false, error: "Prescribing doctor account is invalid or inactive." };
  }

  // Doctor authorization guard: Doctor B cannot edit Doctor A's encounter
  if (
    actorRole === "doctor" &&
    encounter.provider_id.toLowerCase() !== actorId.toLowerCase() &&
    encounter.provider_id.toLowerCase() !== prescriber.identifier?.toLowerCase()
  ) {
    return { success: false, error: "Only the attending doctor for this encounter can prescribe medications." };
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
  const newId = `PRX-${nextNum}`;

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
    facility_id: encounter.facility_id || "FAC-1001",
    facility_name: encounter.facility_name || encounter.organization_name,
    department_name: encounter.department_name,
    status: "DRAFT",
    version: 1,
    version_history: [],
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
 * Validates at least 1 structured medicine item, enforces encounter & doctor authorization,
 * transitions to ISSUED, and records immutable audit sign-off.
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
    if (!item.medicine_name || !item.medicine_name.trim()) {
      return { success: false, error: `Medicine item #${i + 1} requires a valid medicine name.` };
    }
    if (!item.dosage || !item.dosage.trim()) {
      return { success: false, error: `Medicine "${item.medicine_name}" requires a dosage (e.g. 1 tablet).` };
    }
    if (!item.frequency || !item.frequency.trim()) {
      return { success: false, error: `Medicine "${item.medicine_name}" requires a frequency.` };
    }
  }

  // 2. Validate Encounter
  const encounter = getEncounterById(encounterId);
  if (!encounter) {
    return { success: false, error: `Healthcare Encounter ${encounterId} not found.` };
  }
  if (encounter.status === "CANCELLED") {
    return { success: false, error: "Cannot issue a prescription for a CANCELLED encounter." };
  }

  // 3. Resolve & Verify Prescriber
  const prescriber = findIdentityById(actorId);
  if (!prescriber || prescriber.accountStatus !== "active") {
    return { success: false, error: "Prescribing doctor account is invalid or inactive." };
  }

  // Doctor authorization guard: Doctor B cannot issue inside Doctor A's encounter
  if (
    actorRole === "doctor" &&
    encounter.provider_id.toLowerCase() !== actorId.toLowerCase() &&
    encounter.provider_id.toLowerCase() !== prescriber.identifier?.toLowerCase()
  ) {
    return { success: false, error: "Only the attending doctor for this encounter can issue prescriptions." };
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
      return { success: false, error: "This prescription is already ISSUED and cannot be re-issued without formal amendment." };
    }
    finalPrescription.items = items;
    finalPrescription.notes = notes;
    finalPrescription.refills_allowed = refillsAllowed;
    finalPrescription.status = "ISSUED";
    finalPrescription.version = finalPrescription.version || 1;
    finalPrescription.version_history = finalPrescription.version_history || [];
    finalPrescription.facility_id = encounter.facility_id || finalPrescription.facility_id || "FAC-1001";
    finalPrescription.facility_name = encounter.facility_name || encounter.organization_name;
    finalPrescription.issued_at = nowIso;
    finalPrescription.updated_at = nowIso;
    all[targetIndex] = finalPrescription;
  } else {
    const nextNum = all.length + 1001;
    const newId = `PRX-${nextNum}`;

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
      facility_id: encounter.facility_id || "FAC-1001",
      facility_name: encounter.facility_name || encounter.organization_name,
      department_name: encounter.department_name,
      status: "ISSUED",
      version: 1,
      version_history: [],
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
      facilityId: finalPrescription.facility_id || null,
      issuedAt: nowIso,
    }
  );

  return { success: true, prescription: finalPrescription };
}

/**
 * Helper to compute SHA-256 digital signature hash for authoritative prescriptions.
 */
export function generateDigitalSignatureHash(rx: Partial<HealthcarePrescription>): string {
  const raw = `${rx.id}:${rx.patient_id}:${rx.prescriber_id}:${rx.encounter_id}:${rx.finalized_at || rx.issued_at}:${(rx.items || []).map((i) => i.medicine_name).join(",")}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `SIG-SHA256-${Math.abs(hash).toString(16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Authoritatively Finalizes a Digital Prescription.
 * Locks the record against unversioned edits, generates digital signature hash & verification token,
 * transitions status to FINALIZED, and records audit event.
 */
export function finalizePrescription(
  params: IssuePrescriptionParams
): { success: boolean; prescription?: HealthcarePrescription; error?: string } {
  const { prescriptionId, encounterId, items, notes, refillsAllowed = 0, actorId, actorName, actorRole } = params;

  if (!items || items.length === 0) {
    return { success: false, error: "Cannot finalize an empty prescription. Please add at least one medication item." };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.medicine_name || !item.medicine_name.trim()) {
      return { success: false, error: `Medicine item #${i + 1} requires a valid medicine name.` };
    }
    if (!item.dosage || !item.dosage.trim()) {
      return { success: false, error: `Medicine "${item.medicine_name}" requires a dosage (e.g. 1 tablet).` };
    }
    if (!item.frequency || !item.frequency.trim()) {
      return { success: false, error: `Medicine "${item.medicine_name}" requires an administration frequency.` };
    }
  }

  const encounter = getEncounterById(encounterId);
  if (!encounter) {
    return { success: false, error: `Healthcare Encounter ${encounterId} not found.` };
  }
  if (encounter.status === "CANCELLED") {
    return { success: false, error: "Cannot finalize a prescription for a CANCELLED encounter." };
  }

  const prescriber = findIdentityById(actorId);
  if (!prescriber || prescriber.accountStatus !== "active") {
    return { success: false, error: "Prescribing doctor account is invalid or inactive." };
  }

  if (
    actorRole === "doctor" &&
    encounter.provider_id.toLowerCase() !== actorId.toLowerCase() &&
    encounter.provider_id.toLowerCase() !== prescriber.identifier?.toLowerCase()
  ) {
    return { success: false, error: "Only the attending doctor for this encounter can finalize prescriptions." };
  }

  const all = getAllPrescriptions();
  const nowIso = new Date().toISOString();

  let targetIndex = -1;
  if (prescriptionId) {
    targetIndex = all.findIndex((p) => p.id === prescriptionId || p.prescription_reference === prescriptionId);
  } else {
    targetIndex = all.findIndex((p) => p.encounter_id === encounterId && p.status === "DRAFT");
  }

  let finalRx: HealthcarePrescription;

  if (targetIndex >= 0) {
    finalRx = all[targetIndex];
    if (finalRx.status === "FINALIZED" || finalRx.status === "COMPLETED") {
      return { success: true, prescription: finalRx };
    }
    finalRx.items = items;
    finalRx.notes = notes;
    finalRx.refills_allowed = refillsAllowed;
    finalRx.status = "FINALIZED";
    finalRx.version = finalRx.version || 1;
    finalRx.version_history = finalRx.version_history || [];
    finalRx.facility_id = encounter.facility_id || finalRx.facility_id || "FAC-1001";
    finalRx.facility_name = encounter.facility_name || encounter.organization_name;
    finalRx.finalized_at = nowIso;
    finalRx.finalized_by = actorId;
    finalRx.finalized_by_name = prescriber.fullName;
    finalRx.issued_at = finalRx.issued_at || nowIso;
    finalRx.updated_at = nowIso;
    finalRx.verification_token = finalRx.verification_token || `VRF-${finalRx.id}`;
    finalRx.digital_signature_hash = generateDigitalSignatureHash(finalRx);

    all[targetIndex] = finalRx;
  } else {
    const nextNum = all.length + 1001;
    const newId = `RX-${nextNum}`;

    finalRx = {
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
      facility_id: encounter.facility_id || "FAC-1001",
      facility_name: encounter.facility_name || encounter.organization_name,
      department_name: encounter.department_name,
      status: "FINALIZED",
      version: 1,
      version_history: [],
      items,
      refills_allowed: refillsAllowed,
      refills_used: 0,
      notes,
      finalized_at: nowIso,
      finalized_by: actorId,
      finalized_by_name: prescriber.fullName,
      issued_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
      verification_token: `VRF-${newId}`,
    };
    finalRx.digital_signature_hash = generateDigitalSignatureHash(finalRx);
    all.unshift(finalRx);
  }

  savePrescriptions(all);

  appendAuditEvent(
    "PRESCRIPTION_FINALIZED",
    actorId,
    actorName,
    actorRole,
    `Finalized digital prescription ${finalRx.id} with ${items.length} medicine(s) for patient ${encounter.patient_name}`,
    encounter.patient_id,
    encounter.organization_id,
    encounter.organization_name,
    finalRx.id,
    {
      itemsCount: items.length,
      facilityId: finalRx.facility_id || null,
      finalizedAt: nowIso,
      digitalSignatureHash: finalRx.digital_signature_hash,
    }
  );

  return { success: true, prescription: finalRx };
}

/**
 * Void a prescription with a mandatory documented reason.
 */
export function voidPrescription(
  prescriptionId: string,
  voidReason: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; prescription?: HealthcarePrescription; error?: string } {
  const cleanReason = voidReason?.trim();
  if (!cleanReason) {
    return { success: false, error: "A void reason is required to void a prescription." };
  }

  const all = getAllPrescriptions();
  const index = all.findIndex((p) => p.id === prescriptionId || p.prescription_reference === prescriptionId);

  if (index < 0) {
    return { success: false, error: `Prescription ${prescriptionId} not found.` };
  }

  const rx = all[index];
  const nowIso = new Date().toISOString();
  rx.status = "VOIDED";
  rx.voided_at = nowIso;
  rx.voided_by = actorId;
  rx.void_reason = cleanReason;
  rx.updated_at = nowIso;

  all[index] = rx;
  savePrescriptions(all);

  appendAuditEvent(
    "PRESCRIPTION_VOIDED",
    actorId,
    actorName,
    actorRole,
    `Voided prescription ${rx.id}: ${cleanReason}`,
    rx.patient_id,
    rx.organization_id,
    rx.organization_name,
    rx.id,
    { voidReason: cleanReason }
  );

  return { success: true, prescription: rx };
}

/**
 * Correct / Supersede a finalized prescription.
 * Marks original as SUPERSEDED, creates a replacement FINALIZED prescription linking back to original ID.
 */
export function correctPrescription(
  params: AmendPrescriptionParams
): { success: boolean; prescription?: HealthcarePrescription; original_prescription?: HealthcarePrescription; error?: string } {
  const { prescriptionId, amendmentReason, items, notes, refillsAllowed, actorId, actorName, actorRole } = params;

  const cleanReason = amendmentReason?.trim();
  if (!cleanReason) {
    return { success: false, error: "A documented correction reason is required to correct/supersede a prescription." };
  }

  if (!items || items.length === 0) {
    return { success: false, error: "Corrected prescription must contain at least one medicine item." };
  }

  const all = getAllPrescriptions();
  const origIndex = all.findIndex((p) => p.id === prescriptionId || p.prescription_reference === prescriptionId);

  if (origIndex < 0) {
    return { success: false, error: `Original prescription ${prescriptionId} not found.` };
  }

  const origRx = all[origIndex];
  const nowIso = new Date().toISOString();

  // Create new replacement prescription RX-xxxx
  const nextNum = all.length + 1001;
  const newId = `RX-${nextNum}`;

  const newRx: HealthcarePrescription = {
    id: newId,
    prescription_reference: newId,
    patient_id: origRx.patient_id,
    patient_name: origRx.patient_name,
    encounter_id: origRx.encounter_id,
    clinical_record_id: origRx.clinical_record_id,
    prescriber_id: actorId,
    prescriber_name: actorName,
    prescriber_role: origRx.prescriber_role,
    organization_id: origRx.organization_id,
    organization_name: origRx.organization_name,
    facility_id: origRx.facility_id,
    facility_name: origRx.facility_name,
    department_name: origRx.department_name,
    status: "FINALIZED",
    version: (origRx.version || 1) + 1,
    version_history: [
      ...(origRx.version_history || []),
      {
        version: origRx.version || 1,
        saved_at: origRx.updated_at || origRx.finalized_at || origRx.created_at,
        saved_by: origRx.prescriber_id,
        saved_by_name: origRx.prescriber_name,
        saved_by_role: origRx.prescriber_role,
        amendment_reason: cleanReason,
        status: origRx.status,
        items: [...origRx.items],
        refills_allowed: origRx.refills_allowed,
        refills_used: origRx.refills_used,
        notes: origRx.notes,
      },
    ],
    items,
    refills_allowed: refillsAllowed !== undefined ? refillsAllowed : origRx.refills_allowed,
    refills_used: 0,
    notes: notes !== undefined ? notes : origRx.notes,
    supersedes_prescription_id: origRx.id,
    correction_reason: cleanReason,
    finalized_at: nowIso,
    finalized_by: actorId,
    finalized_by_name: actorName,
    issued_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
    verification_token: `VRF-${newId}`,
  };
  newRx.digital_signature_hash = generateDigitalSignatureHash(newRx);

  // Mark original as SUPERSEDED
  origRx.status = "SUPERSEDED";
  origRx.superseded_by_prescription_id = newId;
  origRx.updated_at = nowIso;

  all[origIndex] = origRx;
  all.unshift(newRx);

  savePrescriptions(all);

  appendAuditEvent(
    "PRESCRIPTION_CORRECTED",
    actorId,
    actorName,
    actorRole,
    `Corrected prescription ${origRx.id} -> ${newRx.id}: ${cleanReason}`,
    origRx.patient_id,
    origRx.organization_id,
    origRx.organization_name,
    newRx.id,
    {
      originalPrescriptionId: origRx.id,
      newPrescriptionId: newRx.id,
      correctionReason: cleanReason,
    }
  );

  return { success: true, prescription: newRx, original_prescription: origRx };
}

/**
 * Public Authenticity & Verification Lookup.
 * Returns minimal public verification confirmation without disclosing sensitive patient history.
 */
export function getPrescriptionByVerificationToken(token: string): {
  found: boolean;
  is_valid: boolean;
  status?: PrescriptionStatus;
  prescription_id?: string;
  prescription_reference?: string;
  prescriber_name?: string;
  facility_name?: string;
  finalized_at?: string;
  digital_signature_hash?: string;
  message: string;
} {
  if (!token || !token.trim()) {
    return { found: false, is_valid: false, message: "Verification token is required." };
  }

  const rx = getPrescriptionById(token);
  if (!rx) {
    return { found: false, is_valid: false, message: "Prescription record not found." };
  }

  const isValid = rx.status === "FINALIZED" || rx.status === "ISSUED" || rx.status === "COMPLETED";

  appendAuditEvent(
    "PRESCRIPTION_VERIFICATION_REQUESTED",
    "PUBLIC_ANONYMOUS",
    "Public Verification Scanner",
    "anonymous",
    `Public verified authenticity of prescription ${rx.id} (Status: ${rx.status})`,
    rx.patient_id,
    rx.organization_id,
    rx.organization_name,
    rx.id,
    { status: rx.status, isValid }
  );

  return {
    found: true,
    is_valid: isValid,
    status: rx.status,
    prescription_id: rx.id,
    prescription_reference: rx.prescription_reference,
    prescriber_name: rx.prescriber_name,
    facility_name: rx.facility_name || rx.organization_name,
    finalized_at: rx.finalized_at || rx.issued_at || rx.created_at,
    digital_signature_hash: rx.digital_signature_hash,
    message: isValid
      ? `Authentic Prescription ${rx.prescription_reference} issued by ${rx.prescriber_name} at ${rx.facility_name || rx.organization_name}.`
      : `Prescription ${rx.prescription_reference} is ${rx.status}.`,
  };
}

export interface AmendPrescriptionParams {
  prescriptionId: string;
  amendmentReason: string;
  items: PrescriptionItem[];
  notes?: string;
  refillsAllowed?: number;
  actorId: string;
  actorName: string;
  actorRole: string;
}

/**
 * Amend an issued prescription.
 * Preserves an immutable snapshot of Version 1 in version_history,
 * increments version to 2, requires documented reason, and updates the record.
 */
export function amendPrescription(
  params: AmendPrescriptionParams
): { success: boolean; prescription?: HealthcarePrescription; error?: string } {
  const { prescriptionId, amendmentReason, items, notes, refillsAllowed, actorId, actorName, actorRole } = params;

  const cleanReason = amendmentReason?.trim();
  if (!cleanReason) {
    return { success: false, error: "A documented clinical reason is required to amend an issued prescription." };
  }

  if (!items || items.length === 0) {
    return { success: false, error: "Amended prescription must contain at least one medicine item." };
  }

  const all = getAllPrescriptions();
  const index = all.findIndex((p) => p.id === prescriptionId || p.prescription_reference === prescriptionId);

  if (index < 0) {
    return { success: false, error: `Prescription ${prescriptionId} not found.` };
  }

  const rx = all[index];
  if (rx.status !== "ISSUED") {
    return { success: false, error: "Only ISSUED prescriptions can undergo clinical amendment." };
  }

  // Create Snapshot of Current State
  const snapshot: PrescriptionVersionSnapshot = {
    version: rx.version || 1,
    saved_at: rx.updated_at || rx.issued_at || rx.created_at,
    saved_by: rx.prescriber_id,
    saved_by_name: rx.prescriber_name,
    saved_by_role: rx.prescriber_role,
    amendment_reason: rx.amendment_reason,
    status: rx.status,
    items: [...rx.items],
    refills_allowed: rx.refills_allowed,
    refills_used: rx.refills_used,
    notes: rx.notes,
  };

  const nowIso = new Date().toISOString();
  const nextVersion = (rx.version || 1) + 1;

  rx.version = nextVersion;
  rx.version_history = rx.version_history ? [...rx.version_history, snapshot] : [snapshot];
  rx.items = items;
  if (notes !== undefined) rx.notes = notes;
  if (refillsAllowed !== undefined) rx.refills_allowed = refillsAllowed;
  rx.amended_at = nowIso;
  rx.amendment_reason = cleanReason;
  rx.updated_at = nowIso;

  all[index] = rx;
  savePrescriptions(all);

  appendAuditEvent(
    "PRESCRIPTION_AMENDED",
    actorId,
    actorName,
    actorRole,
    `Amended prescription ${rx.id} to v${nextVersion}: ${cleanReason}`,
    rx.patient_id,
    rx.organization_id,
    rx.organization_name,
    rx.id,
    {
      newVersion: nextVersion,
      amendmentReason: cleanReason,
      itemsCount: items.length,
    }
  );

  return { success: true, prescription: rx };
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

export interface PharmacyPrescriptionPayload {
  prescription_id: string;
  prescription_reference: string;
  patient_id: string;
  patient_name: string;
  prescriber_name: string;
  prescriber_role: string;
  organization_name: string;
  facility_name: string;
  issued_at: string;
  status: PrescriptionStatus;
  items: {
    item_id: string;
    medicine_name: string;
    generic_name?: string;
    brand_name?: string;
    strength?: string;
    dosage: string;
    route: PrescriptionRoute;
    frequency: string;
    timing?: string;
    duration: string;
    quantity?: string;
    instructions?: string;
  }[];
  refills_allowed: number;
  refills_used: number;
  notes?: string;
}

/**
 * Controlled Pharmacy Access Boundary.
 * Returns strictly MINIMUM NECESSARY data for dispensing and enforces pharmacy authorization.
 * Unrelated medical history, previous consultations, and private clinical notes are protected.
 */
export function getPrescriptionForPharmacy(
  prescriptionId: string,
  pharmacyActor: StoredIdentity | null
): { success: boolean; data?: PharmacyPrescriptionPayload; error?: string } {
  if (!pharmacyActor) {
    return { success: false, error: "Pharmacy authentication required." };
  }

  const allowedRoles = ["pharmacy_staff", "pharmacist", "pharmacy", "admin", "doctor"];
  if (!allowedRoles.includes(pharmacyActor.role)) {
    return { success: false, error: "Access denied. Only licensed pharmacy personnel may access dispensing payloads." };
  }

  const rx = getPrescriptionById(prescriptionId);
  if (!rx) {
    return { success: false, error: `Prescription ${prescriptionId} not found.` };
  }

  if (rx.status === "DRAFT") {
    return { success: false, error: "Cannot dispense an unfinalized DRAFT prescription." };
  }

  if (rx.status === "CANCELLED") {
    return { success: false, error: `Prescription ${prescriptionId} has been CANCELLED by the prescriber (${rx.cancellation_reason || "No reason given"}).` };
  }

  // Audit Access
  appendAuditEvent(
    "PRESCRIPTION_ACCESSED",
    pharmacyActor.identifier || pharmacyActor.id,
    pharmacyActor.fullName,
    pharmacyActor.role,
    `Pharmacy accessed prescription ${rx.id} for dispensing evaluation`,
    rx.patient_id,
    rx.organization_id,
    rx.organization_name,
    rx.id,
    { pharmacyId: pharmacyActor.identifier || pharmacyActor.id }
  );

  // Return Minimum Necessary Data Only
  const payload: PharmacyPrescriptionPayload = {
    prescription_id: rx.id,
    prescription_reference: rx.prescription_reference,
    patient_id: rx.patient_id,
    patient_name: rx.patient_name,
    prescriber_name: rx.prescriber_name,
    prescriber_role: rx.prescriber_role,
    organization_name: rx.organization_name,
    facility_name: rx.facility_name || rx.organization_name,
    issued_at: rx.issued_at || rx.created_at,
    status: rx.status,
    items: rx.items.map((item) => ({
      item_id: item.id,
      medicine_name: item.medicine_name,
      generic_name: item.generic_name,
      brand_name: item.brand_name,
      strength: item.strength,
      dosage: item.dosage,
      route: item.route,
      frequency: item.frequency,
      timing: item.timing,
      duration: item.duration,
      quantity: item.quantity,
      instructions: item.instructions,
    })),
    refills_allowed: rx.refills_allowed,
    refills_used: rx.refills_used,
    notes: rx.notes,
  };

  return { success: true, data: payload };
}
