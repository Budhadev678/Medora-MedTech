// ============================================================
// MEDORA — CLINICAL RECORD CORE STORE (PHASE 4.2)
// Structured, traceable clinical information attached to an Encounter.
// Hierarchy: PATIENT -> ENCOUNTER -> CLINICAL RECORD
// ============================================================

import type {
  ClinicalRecord,
  ClinicalRecordStatus,
  ClinicalSymptom,
  ClinicalVitals,
  ClinicalDiagnosis,
  ClinicalFollowUpPlan,
  ClinicalRecordVersionSnapshot,
  SymptomSeverity,
  DiagnosisStatus,
} from "@/types/database.types";
import { getEncounterById } from "@/lib/data/encounter-store";
import { findIdentityById } from "@/lib/data/identity-store";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { AccessEngine } from "@/lib/services/access-engine";

export type {
  ClinicalRecord,
  ClinicalRecordStatus,
  ClinicalSymptom,
  ClinicalVitals,
  ClinicalDiagnosis,
  ClinicalFollowUpPlan,
  ClinicalRecordVersionSnapshot,
  SymptomSeverity,
  DiagnosisStatus,
};

// ============================================================
// CANONICAL SEEDED CLINICAL RECORDS
// ============================================================

export const SEEDED_CLINICAL_RECORDS: ClinicalRecord[] = [
  // 1. Record for ENC-1001 (Rahul Verma at City Hospital - Completed)
  {
    id: "CR-1001",
    record_reference: "CR-1001",
    encounter_id: "ENC-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    author_id: "DOC-1001",
    author_name: "Dr. Ananya Sharma",
    author_role: "Consultant Cardiologist",
    created_by: "DOC-1001",
    created_by_role: "doctor",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    department_id: "DEP-CARDIO",
    department_name: "Cardiology OPD",
    status: "COMPLETED",
    chief_complaint: "Exertional chest tightness & morning headaches for 2 weeks",
    symptoms: [
      {
        id: "SYM-1",
        name: "Exertional chest tightness",
        onset: "2 weeks ago",
        duration: "2 weeks",
        severity: "MODERATE",
        notes: "Substernal heaviness on climbing stairs, relieved by rest",
      },
      {
        id: "SYM-2",
        name: "Occipital morning headache",
        onset: "10 days ago",
        duration: "10 days",
        severity: "MILD",
        notes: "Present upon waking up",
      },
    ],
    vitals: {
      temperature_celsius: 36.8,
      heart_rate_bpm: 76,
      systolic_bp_mmhg: 142,
      diastolic_bp_mmhg: 92,
      respiratory_rate_bpm: 16,
      spo2_percent: 98,
      weight_kg: 74,
      height_cm: 175,
      bmi: 24.2,
      recorded_at: "2026-08-20T10:05:00Z",
      recorded_by: "DOC-1001",
      recorded_by_name: "Dr. Ananya Sharma",
    },
    observations: "Alert, oriented, no acute distress. Heart sounds S1, S2 regular, no murmurs. Bilateral breath sounds clear.",
    clinical_notes: "Patient has a positive family history of hypertension (father). Sedentary desk job with high sodium dietary habits. No prior anti-hypertensive medication.",
    assessment: "Stage 1 Primary Essential Hypertension with mild exertional symptoms. Low cardiovascular risk profile currently.",
    diagnoses: [
      {
        id: "DX-1",
        name: "Essential (primary) hypertension",
        icd10_code: "I10",
        status: "CONFIRMED",
        category: "PRIMARY",
        recorded_by: "DOC-1001",
        recorded_by_name: "Dr. Ananya Sharma",
        recorded_at: "2026-08-20T10:20:00Z",
        notes: "Confirmed based on repeated office readings and clinical profile",
      },
    ],
    treatment_plan: "Initiate lifestyle modification: Dietary Approaches to Stop Hypertension (DASH) low sodium diet (<2g/day), 30 minutes daily aerobic walking. Prescribed Telmisartan 40mg once daily in morning. Maintain daily home BP log.",
    follow_up_plan: {
      required: true,
      follow_up_date: "2026-08-27",
      follow_up_timeframe: "7 days",
      instructions: "Return to Cardiology OPD with 7-day home blood pressure monitoring chart or sooner if chest tightness worsens.",
    },
    version: 1,
    version_history: [],
    created_at: "2026-08-20T10:00:00Z",
    updated_at: "2026-08-20T10:30:00Z",
    completed_at: "2026-08-20T10:30:00Z",
  },
  // 2. Record for ENC-1002 (Rahul Verma at Green Care Clinic - Completed Follow-Up)
  {
    id: "CR-1002",
    record_reference: "CR-1002",
    encounter_id: "ENC-1002",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    author_id: "DOC-1001",
    author_name: "Dr. Ananya Sharma",
    author_role: "Visiting Cardiologist",
    created_by: "DOC-1001",
    created_by_role: "doctor",
    organization_id: "CLN-1001",
    organization_name: "Green Care Clinic",
    department_id: "DEP-GENMED",
    department_name: "General Medicine",
    status: "COMPLETED",
    chief_complaint: "Routine blood pressure checkup & medication review",
    symptoms: [],
    vitals: {
      temperature_celsius: 36.6,
      heart_rate_bpm: 72,
      systolic_bp_mmhg: 128,
      diastolic_bp_mmhg: 82,
      respiratory_rate_bpm: 14,
      spo2_percent: 99,
      weight_kg: 73.5,
      height_cm: 175,
      bmi: 24.0,
      recorded_at: "2026-08-15T16:05:00Z",
      recorded_by: "DOC-1001",
      recorded_by_name: "Dr. Ananya Sharma",
    },
    observations: "Patient feels well, asymptomatic. BP well controlled on current regimen.",
    clinical_notes: "Compliant with Telmisartan 40mg OD and sodium restriction. No adverse drug reactions.",
    assessment: "Controlled essential hypertension on monotherapy.",
    diagnoses: [
      {
        id: "DX-1",
        name: "Essential (primary) hypertension",
        icd10_code: "I10",
        status: "CONFIRMED",
        category: "PRIMARY",
        recorded_by: "DOC-1001",
        recorded_by_name: "Dr. Ananya Sharma",
        recorded_at: "2026-08-15T16:15:00Z",
      },
    ],
    treatment_plan: "Continue Telmisartan 40mg OD. Maintain daily exercise and salt restriction.",
    follow_up_plan: {
      required: false,
      instructions: "Routine follow-up in 3 months or as needed.",
    },
    version: 1,
    version_history: [],
    created_at: "2026-08-15T16:00:00Z",
    updated_at: "2026-08-15T16:20:00Z",
    completed_at: "2026-08-15T16:20:00Z",
  },
  // 3. Record for ENC-1003 (Priya Sharma at City Hospital - Active Draft)
  {
    id: "CR-1003",
    record_reference: "CR-1003",
    encounter_id: "ENC-1003",
    patient_id: "PAT-1002",
    patient_name: "Priya Sharma",
    author_id: "DOC-1001",
    author_name: "Dr. Ananya Sharma",
    author_role: "Consultant Cardiologist",
    created_by: "DOC-1001",
    created_by_role: "doctor",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    department_id: "DEP-CARDIO",
    department_name: "Cardiology OPD",
    status: "DRAFT",
    chief_complaint: "Persistent migraine, palpitations and dizziness for 3 days",
    symptoms: [
      {
        id: "SYM-1",
        name: "Throbbing unilateral headache",
        onset: "3 days ago",
        duration: "3 days",
        severity: "MODERATE",
      },
      {
        id: "SYM-2",
        name: "Intermittent palpitations",
        onset: "2 days ago",
        duration: "2 days",
        severity: "MILD",
      },
    ],
    vitals: {
      temperature_celsius: 37.0,
      heart_rate_bpm: 88,
      systolic_bp_mmhg: 118,
      diastolic_bp_mmhg: 76,
      respiratory_rate_bpm: 16,
      spo2_percent: 99,
      recorded_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      recorded_by: "DOC-1001",
      recorded_by_name: "Dr. Ananya Sharma",
    },
    observations: "Mild photophobia noted. Cranial nerves grossly intact, no focal neurological deficits.",
    clinical_notes: "Under active clinical assessment in Cardiology OPD. ECG ordered to evaluate palpitations.",
    assessment: "Stress-associated migraine with secondary sinus tachycardia.",
    diagnoses: [
      {
        id: "DX-1",
        name: "Migraine without aura",
        icd10_code: "G43.0",
        status: "SUSPECTED",
        category: "PRIMARY",
        recorded_by: "DOC-1001",
        recorded_by_name: "Dr. Ananya Sharma",
        recorded_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ],
    treatment_plan: "Rest in quiet, dark environment. Adequate oral hydration. Paracetamol 650mg SOS for severe headache.",
    follow_up_plan: {
      required: true,
      instructions: "Review with 12-lead ECG strip.",
    },
    version: 1,
    version_history: [],
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

const STORAGE_KEY = "medora_clinical_records_store_v1";

// Cache for debounce / rapid submission lock
const recentSubmissions = new Map<string, number>();

/**
 * Retrieve all clinical records with localStorage persistence.
 */
export function getAllClinicalRecords(): ClinicalRecord[] {
  if (typeof window === "undefined") {
    return SEEDED_CLINICAL_RECORDS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_CLINICAL_RECORDS));
      return SEEDED_CLINICAL_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEEDED_CLINICAL_RECORDS;
  } catch {
    return SEEDED_CLINICAL_RECORDS;
  }
}

/**
 * Persist records to localStorage and dispatch update event.
 */
function saveRecords(records: ClinicalRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event("medora-clinical-records-updated"));
  } catch (e) {
    console.error("Failed to save clinical records:", e);
  }
}

/**
 * Retrieve a single clinical record by ID.
 */
export function getClinicalRecordById(id: string): ClinicalRecord | null {
  const all = getAllClinicalRecords();
  const cleanId = id.trim();
  return all.find((r) => r.id === cleanId || r.record_reference === cleanId) || null;
}

/**
 * Retrieve the active clinical record for a specific Encounter.
 */
export function getClinicalRecordByEncounterId(encounterId: string): ClinicalRecord | null {
  const all = getAllClinicalRecords();
  const cleanId = encounterId.trim();
  return all.find((r) => r.encounter_id === cleanId) || null;
}

/**
 * Retrieve clinical records for a specific patient.
 * STRICT PATIENT PRIVACY: If called in patient portal mode, filters out unfinalized DRAFT records.
 */
export function getPatientClinicalRecords(
  patientIdOrIdentifier: string,
  includeDrafts: boolean = false
): ClinicalRecord[] {
  const all = getAllClinicalRecords();
  const targetId = patientIdOrIdentifier.trim().toLowerCase();

  return all
    .filter((r) => {
      const matchPatient = r.patient_id.toLowerCase() === targetId;
      if (!matchPatient) return false;
      if (!includeDrafts && r.status === "DRAFT") return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Retrieve clinical records for a specific doctor with optional organization scoping.
 */
export function getDoctorClinicalRecords(
  doctorIdOrIdentifier: string,
  organizationId?: string
): ClinicalRecord[] {
  const all = getAllClinicalRecords();
  const targetDoc = doctorIdOrIdentifier.trim();

  return all
    .filter((r) => {
      const matchDoc = r.author_id === targetDoc || r.created_by === targetDoc;
      if (!matchDoc) return false;
      if (organizationId && r.organization_id !== organizationId.trim()) return false;
      return true;
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

/**
 * Retrieve clinical records for an organization (Hospital / Clinic).
 */
export function getOrganizationClinicalRecords(
  organizationId: string,
  statusFilter?: ClinicalRecordStatus
): ClinicalRecord[] {
  const all = getAllClinicalRecords();
  const orgId = organizationId.trim();

  return all
    .filter((r) => {
      if (r.organization_id !== orgId) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export interface SaveClinicalRecordDraftParams {
  encounterId: string;
  chiefComplaint: string;
  symptoms?: ClinicalSymptom[];
  vitals?: ClinicalVitals;
  observations?: string;
  clinicalNotes?: string;
  assessment?: string;
  diagnoses?: ClinicalDiagnosis[];
  treatmentPlan?: string;
  followUpPlan?: ClinicalFollowUpPlan;
  actorId: string;
  actorName: string;
  actorRole: string;
}

/**
 * Save or update a Clinical Record Draft for an active Encounter.
 * Includes affiliation checks, debounce locking, and audit logging.
 */
export function saveClinicalRecordDraft(
  params: SaveClinicalRecordDraftParams
): { success: boolean; record?: ClinicalRecord; error?: string } {
  const {
    encounterId,
    chiefComplaint,
    symptoms = [],
    vitals,
    observations,
    clinicalNotes,
    assessment,
    diagnoses = [],
    treatmentPlan,
    followUpPlan,
    actorId,
    actorName,
    actorRole,
  } = params;

  // 1. Debounce protection (3s lock per encounter)
  const debounceKey = `draft_${encounterId}_${actorId}`;
  const lastTime = recentSubmissions.get(debounceKey) || 0;
  if (Date.now() - lastTime < 2000) {
    return { success: false, error: "A save operation is currently processing. Please wait." };
  }
  recentSubmissions.set(debounceKey, Date.now());

  // 2. Validate Encounter Exists & Is Not Cancelled
  const encounter = getEncounterById(encounterId);
  if (!encounter) {
    return { success: false, error: `Parent Healthcare Encounter ${encounterId} not found.` };
  }
  if (encounter.status === "CANCELLED") {
    return { success: false, error: "Cannot create or modify clinical record for a CANCELLED encounter." };
  }

  // 3. Resolve Provider & Validate Permissions
  const author = findIdentityById(actorId);
  if (!author) {
    return { success: false, error: `Author account not found for ID ${actorId}.` };
  }
  if (author.accountStatus !== "active") {
    return { success: false, error: `Doctor account is ${author.accountStatus}. Clinical editing denied.` };
  }

  // Verify doctor affiliation with the encounter organization
  if (author.doctorData) {
    const activeAffiliation = author.doctorData.affiliations.find(
      (a) =>
        (a.organizationId === encounter.organization_id || a.organizationIdentifier === encounter.organization_id) &&
        a.status === "active"
    );
    if (!activeAffiliation && author.role === "doctor") {
      return {
        success: false,
        error: `Doctor ${author.fullName} is not actively affiliated with ${encounter.organization_name}.`,
      };
    }
  }

  // 4. Validate Chief Complaint
  const cleanComplaint = chiefComplaint.trim() || encounter.reason_for_visit;

  const all = getAllClinicalRecords();
  const existingIndex = all.findIndex((r) => r.encounter_id === encounterId);
  const nowIso = new Date().toISOString();

  if (existingIndex >= 0) {
    const existing = all[existingIndex];

    // Completed records cannot be silently modified via saveDraft; require amendment flow
    if (existing.status === "COMPLETED" || existing.status === "AMENDED") {
      return {
        success: false,
        error: "This clinical record has already been COMPLETED. Modifications require a documented amendment.",
      };
    }

    // Update Draft Record
    existing.chief_complaint = cleanComplaint;
    existing.symptoms = symptoms;
    existing.vitals = vitals;
    existing.observations = observations?.trim();
    existing.clinical_notes = clinicalNotes?.trim();
    existing.assessment = assessment?.trim();
    existing.diagnoses = diagnoses;
    existing.treatment_plan = treatmentPlan?.trim();
    existing.follow_up_plan = followUpPlan;
    existing.updated_at = nowIso;

    all[existingIndex] = existing;
    saveRecords(all);

    // Audit Log
    appendAuditEvent(
      "CLINICAL_RECORD_UPDATED",
      actorId,
      actorName,
      actorRole,
      `Updated draft clinical record ${existing.id} for encounter ${encounterId}`,
      existing.patient_id,
      existing.organization_id,
      existing.organization_name,
      existing.id,
      { status: existing.status, version: existing.version }
    );

    return { success: true, record: existing };
  }

  // 5. Create New Draft Record
  const newNum = all.length + 1001;
  const newId = `CR-${newNum}`;

  const newRecord: ClinicalRecord = {
    id: newId,
    record_reference: newId,
    encounter_id: encounterId,
    patient_id: encounter.patient_id,
    patient_name: encounter.patient_name,
    author_id: actorId,
    author_name: author.fullName,
    author_role: author.doctorData?.qualifications ? `Consultant (${author.doctorData.specialization})` : "Attending Physician",
    created_by: actorId,
    created_by_role: actorRole,
    organization_id: encounter.organization_id,
    organization_name: encounter.organization_name,
    department_id: encounter.department_id,
    department_name: encounter.department_name,
    status: "DRAFT",
    chief_complaint: cleanComplaint,
    symptoms,
    vitals,
    observations: observations?.trim(),
    clinical_notes: clinicalNotes?.trim(),
    assessment: assessment?.trim(),
    diagnoses,
    treatment_plan: treatmentPlan?.trim(),
    follow_up_plan: followUpPlan,
    version: 1,
    version_history: [],
    created_at: nowIso,
    updated_at: nowIso,
  };

  all.unshift(newRecord);
  saveRecords(all);

  // Audit Log
  appendAuditEvent(
    "CLINICAL_RECORD_CREATED",
    actorId,
    actorName,
    actorRole,
    `Created draft clinical record ${newId} for encounter ${encounterId}`,
    encounter.patient_id,
    encounter.organization_id,
    encounter.organization_name,
    newId,
    { encounterId, status: "DRAFT" }
  );

  return { success: true, record: newRecord };
}

export interface CompleteClinicalRecordParams {
  recordId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}

/**
 * Complete a Clinical Record.
 * Validates mandatory clinical fields, locks record against silent overwrites,
 * and publishes it to the patient's viewable medical record.
 */
export function completeClinicalRecord(
  params: CompleteClinicalRecordParams
): { success: boolean; record?: ClinicalRecord; error?: string } {
  const { recordId, actorId, actorName, actorRole } = params;

  const all = getAllClinicalRecords();
  const index = all.findIndex((r) => r.id === recordId || r.record_reference === recordId);

  if (index < 0) {
    return { success: false, error: `Clinical record ${recordId} not found.` };
  }

  const record = all[index];
  if (record.status === "COMPLETED") {
    return { success: false, error: "This clinical record is already COMPLETED." };
  }
  if (record.status === "CANCELLED") {
    return { success: false, error: "Cannot complete a CANCELLED clinical record." };
  }

  // Clinical Completeness Validation
  if (!record.chief_complaint?.trim()) {
    return { success: false, error: "Chief complaint is required to complete the clinical record." };
  }
  if (!record.assessment?.trim() && record.diagnoses.length === 0) {
    return { success: false, error: "Clinical assessment or at least one formal diagnosis is required before completing." };
  }

  const nowIso = new Date().toISOString();
  record.status = "COMPLETED";
  record.completed_at = nowIso;
  record.updated_at = nowIso;

  all[index] = record;
  saveRecords(all);

  // Audit Log
  appendAuditEvent(
    "CLINICAL_RECORD_COMPLETED",
    actorId,
    actorName,
    actorRole,
    `Completed clinical record ${record.id} for patient ${record.patient_name}`,
    record.patient_id,
    record.organization_id,
    record.organization_name,
    record.id,
    {
      version: record.version,
      diagnosesCount: record.diagnoses.length,
      symptomsCount: record.symptoms.length,
      completedAt: nowIso,
    }
  );

  return { success: true, record };
}

export interface AmendClinicalRecordParams {
  recordId: string;
  amendmentReason: string;
  chiefComplaint?: string;
  symptoms?: ClinicalSymptom[];
  vitals?: ClinicalVitals;
  observations?: string;
  clinicalNotes?: string;
  assessment?: string;
  diagnoses?: ClinicalDiagnosis[];
  treatmentPlan?: string;
  followUpPlan?: ClinicalFollowUpPlan;
  actorId: string;
  actorName: string;
  actorRole: string;
}

/**
 * Amend a Completed Clinical Record.
 * Creates an immutable version snapshot of the previous state,
 * increments version, requires a documented reason, and updates the record.
 */
export function amendClinicalRecord(
  params: AmendClinicalRecordParams
): { success: boolean; record?: ClinicalRecord; error?: string } {
  const {
    recordId,
    amendmentReason,
    chiefComplaint,
    symptoms,
    vitals,
    observations,
    clinicalNotes,
    assessment,
    diagnoses,
    treatmentPlan,
    followUpPlan,
    actorId,
    actorName,
    actorRole,
  } = params;

  const cleanReason = amendmentReason?.trim();
  if (!cleanReason) {
    return { success: false, error: "An amendment reason is required to modify a completed clinical record." };
  }

  const all = getAllClinicalRecords();
  const index = all.findIndex((r) => r.id === recordId || r.record_reference === recordId);

  if (index < 0) {
    return { success: false, error: `Clinical record ${recordId} not found.` };
  }

  const record = all[index];
  if (record.status !== "COMPLETED" && record.status !== "AMENDED") {
    return { success: false, error: "Only COMPLETED or AMENDED records can undergo clinical amendment." };
  }

  const nowIso = new Date().toISOString();

  // Create Snapshot of Current State
  const snapshot: ClinicalRecordVersionSnapshot = {
    version: record.version,
    saved_at: record.updated_at || record.created_at,
    saved_by: record.author_id,
    saved_by_name: record.author_name,
    saved_by_role: record.author_role,
    amendment_reason: record.amendment_reason,
    status: record.status,
    chief_complaint: record.chief_complaint,
    symptoms: [...record.symptoms],
    vitals: record.vitals ? { ...record.vitals } : undefined,
    observations: record.observations,
    clinical_notes: record.clinical_notes,
    assessment: record.assessment,
    diagnoses: [...record.diagnoses],
    treatment_plan: record.treatment_plan,
    follow_up_plan: record.follow_up_plan ? { ...record.follow_up_plan } : undefined,
  };

  record.version_history.push(snapshot);
  record.version += 1;
  record.status = "AMENDED";
  record.amended_at = nowIso;
  record.amendment_reason = cleanReason;
  record.updated_at = nowIso;

  // Apply updates
  if (chiefComplaint !== undefined) record.chief_complaint = chiefComplaint.trim();
  if (symptoms !== undefined) record.symptoms = symptoms;
  if (vitals !== undefined) record.vitals = vitals;
  if (observations !== undefined) record.observations = observations.trim();
  if (clinicalNotes !== undefined) record.clinical_notes = clinicalNotes.trim();
  if (assessment !== undefined) record.assessment = assessment.trim();
  if (diagnoses !== undefined) record.diagnoses = diagnoses;
  if (treatmentPlan !== undefined) record.treatment_plan = treatmentPlan.trim();
  if (followUpPlan !== undefined) record.follow_up_plan = followUpPlan;

  all[index] = record;
  saveRecords(all);

  // Audit Log
  appendAuditEvent(
    "CLINICAL_RECORD_AMENDED",
    actorId,
    actorName,
    actorRole,
    `Amended clinical record ${record.id} to version ${record.version}: ${cleanReason}`,
    record.patient_id,
    record.organization_id,
    record.organization_name,
    record.id,
    {
      newVersion: record.version,
      amendmentReason: cleanReason,
    }
  );

  return { success: true, record };
}
