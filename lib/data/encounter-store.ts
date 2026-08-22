// ============================================================
// MEDORA — HEALTHCARE ENCOUNTER STORE (PHASE 4.1)
// Core Domain Entity representing clinical interactions between
// Patient, Healthcare Professional, and Healthcare Organization.
// ============================================================

import type {
  HealthcareEncounter,
  EncounterType,
  EncounterStatus,
  EncounterSourceType,
} from "@/types/database.types";
import { findIdentityById } from "@/lib/data/identity-store";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { AccessEngine } from "@/lib/services/access-engine";

export type { HealthcareEncounter, EncounterType, EncounterStatus, EncounterSourceType };

// ============================================================
// CANONICAL SEEDED ENCOUNTERS
// ============================================================

export const SEEDED_ENCOUNTERS: HealthcareEncounter[] = [
  // 1. Encounter 1: Rahul Verma at City Hospital (Completed Consultation)
  {
    id: "ENC-1001",
    encounter_reference: "ENC-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    patient_gender: "male",
    patient_dob: "1995-05-14",
    patient_blood_group: "O+",
    provider_id: "DOC-1001",
    provider_name: "Dr. Ananya Sharma",
    provider_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "HSP-1001-MAIN",
    facility_name: "City Hospital — Main Campus",
    department_id: "DEP-CARDIO",
    department_name: "Cardiology OPD",
    encounter_type: "CONSULTATION",
    status: "COMPLETED",
    source_type: "DIRECT_CONSULTATION",
    reason_for_visit: "Exertional chest tightness & hypertension follow-up",
    location: "Room 204, OPD Block A",
    started_at: "2026-08-20T10:00:00Z",
    ended_at: "2026-08-20T10:32:00Z",
    created_by: "DOC-1001",
    created_by_role: "doctor",
    created_at: "2026-08-20T10:00:00Z",
    updated_at: "2026-08-20T10:32:00Z",
    consent_id: "CNS-1001",
  },
  // 2. Encounter 2: Rahul Verma at Green Care Clinic (Completed Routine Checkup)
  {
    id: "ENC-1002",
    encounter_reference: "ENC-1002",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    patient_gender: "male",
    patient_dob: "1995-05-14",
    patient_blood_group: "O+",
    provider_id: "DOC-1001",
    provider_name: "Dr. Ananya Sharma",
    provider_role: "Visiting Cardiologist",
    organization_id: "CLN-1001",
    organization_name: "Green Care Clinic",
    facility_id: "CLN-1001-MAIN",
    facility_name: "Green Care Day Clinic",
    department_id: "DEP-GENMED",
    department_name: "General Medicine",
    encounter_type: "FOLLOW_UP",
    status: "COMPLETED",
    source_type: "DIRECT_CONSULTATION",
    reason_for_visit: "Routine blood pressure checkup & medication review",
    location: "Consulting Suite 2",
    started_at: "2026-08-15T16:00:00Z",
    ended_at: "2026-08-15T16:25:00Z",
    created_by: "DOC-1001",
    created_by_role: "doctor",
    created_at: "2026-08-15T16:00:00Z",
    updated_at: "2026-08-15T16:25:00Z",
    consent_id: "CNS-1001",
  },
  // 3. Encounter 3: Priya Sharma at City Hospital (Active Clinical Encounter)
  {
    id: "ENC-1003",
    encounter_reference: "ENC-1003",
    patient_id: "PAT-1002",
    patient_name: "Priya Sharma",
    patient_gender: "female",
    patient_dob: "1998-09-22",
    patient_blood_group: "B+",
    provider_id: "DOC-1001",
    provider_name: "Dr. Ananya Sharma",
    provider_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "HSP-1001-MAIN",
    facility_name: "City Hospital — Main Campus",
    department_id: "DEP-CARDIO",
    department_name: "Cardiology OPD",
    encounter_type: "CONSULTATION",
    status: "ACTIVE",
    source_type: "DIRECT_CONSULTATION",
    reason_for_visit: "Persistent migraine, palpitations and dizziness",
    location: "Room 204, OPD Block A",
    started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    created_by: "DOC-1001",
    created_by_role: "doctor",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
];

const STORAGE_KEY = "medora_encounters_store_v1";

let inMemoryEncounters: HealthcareEncounter[] = [...SEEDED_ENCOUNTERS];

// Cache for rapid double-click debounce
const recentCreationSubmissions = new Map<string, number>();

/**
 * Retrieve all encounters with localStorage persistence.
 */
export function getAllEncounters(): HealthcareEncounter[] {
  if (typeof window === "undefined") {
    return inMemoryEncounters;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryEncounters));
      return inMemoryEncounters;
    }
    const parsed = JSON.parse(raw);
    inMemoryEncounters = Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryEncounters;
    return inMemoryEncounters;
  } catch {
    return inMemoryEncounters;
  }
}

/**
 * Persist encounter list to localStorage and dispatch custom event.
 */
export function saveEncounters(encounters: HealthcareEncounter[]): void {
  inMemoryEncounters = [...encounters];
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encounters));
    window.dispatchEvent(new Event("medora-encounters-updated"));
  } catch (e) {
    console.error("Failed to save encounters:", e);
  }
}

/**
 * Save or update a single encounter in store.
 */
export function saveEncounter(encounter: HealthcareEncounter): HealthcareEncounter {
  const all = getAllEncounters();
  const idx = all.findIndex((e) => e.id === encounter.id);
  if (idx >= 0) {
    all[idx] = encounter;
  } else {
    all.unshift(encounter);
  }
  saveEncounters(all);
  return encounter;
}

/**
 * Retrieve encounters strictly for a specific patient (Strict Patient Isolation).
 */
export function getPatientEncounters(patientIdOrIdentifier: string): HealthcareEncounter[] {
  if (!patientIdOrIdentifier) return [];
  const all = getAllEncounters();
  const targetId = patientIdOrIdentifier.trim().toLowerCase();
  return all
    .filter((e) => e.patient_id.toLowerCase() === targetId)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

/**
 * Retrieve encounters for a specific doctor, scoped by organization context if provided.
 */
export function getDoctorEncounters(
  doctorIdOrIdentifier: string,
  organizationId?: string,
  statusFilter?: EncounterStatus
): HealthcareEncounter[] {
  if (!doctorIdOrIdentifier) return [];
  const all = getAllEncounters();
  const docId = doctorIdOrIdentifier.trim();

  return all
    .filter((e) => {
      const matchDoc = e.provider_id === docId || e.created_by === docId;
      if (!matchDoc) return false;

      if (organizationId && organizationId.trim()) {
        const orgMatch = e.organization_id === organizationId.trim();
        if (!orgMatch) return false;
      }

      if (statusFilter) {
        if (e.status !== statusFilter) return false;
      }

      return true;
    })
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

/**
 * Retrieve encounters for a specific organization (Hospital / Clinic workspace).
 */
export function getOrganizationEncounters(
  organizationId: string,
  statusFilter?: EncounterStatus
): HealthcareEncounter[] {
  if (!organizationId) return [];
  const all = getAllEncounters();
  const orgId = organizationId.trim();

  return all
    .filter((e) => {
      if (e.organization_id !== orgId) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

/**
 * Retrieve a single encounter by ID.
 */
export function getEncounterById(encounterId: string): HealthcareEncounter | null {
  if (!encounterId) return null;
  const all = getAllEncounters();
  const cleanId = String(encounterId).trim();
  return all.find((e) => e.id === cleanId || e.encounter_reference === cleanId) || null;
}

export interface CreateEncounterParams {
  patientId: string;
  providerId: string;
  organizationId: string;
  departmentId?: string;
  departmentName?: string;
  encounterType: EncounterType;
  reasonForVisit: string;
  location?: string;
  sourceType?: EncounterSourceType;
  actorId: string;
  actorName: string;
  actorRole: string;
}

/**
 * Start/Create a new Healthcare Encounter with validation, affiliation verification,
 * consent check, and double-click idempotency protection.
 */
export function createEncounter(
  params: CreateEncounterParams
): { success: boolean; encounter?: HealthcareEncounter; error?: string } {
  const {
    patientId,
    providerId,
    organizationId,
    departmentId,
    departmentName,
    encounterType,
    reasonForVisit,
    location,
    sourceType = "DIRECT_CONSULTATION",
    actorId,
    actorName,
    actorRole,
  } = params;

  // 1. Idempotency / Double-click protection (3 second debounce per patient+provider)
  const debounceKey = `${patientId}_${providerId}_${organizationId}`;
  const lastTime = recentCreationSubmissions.get(debounceKey) || 0;
  if (Date.now() - lastTime < 3000) {
    return {
      success: false,
      error: "An encounter creation request for this patient is already processing. Please wait.",
    };
  }
  recentCreationSubmissions.set(debounceKey, Date.now());

  // 2. Validate Reason
  const cleanReason = reasonForVisit.trim();
  if (!cleanReason) {
    return { success: false, error: "Please enter a valid clinical reason for this visit." };
  }

  // 3. Resolve Patient Identity
  const patient = findIdentityById(patientId);
  if (!patient) {
    return { success: false, error: `Patient record not found for ID ${patientId}.` };
  }
  if (patient.accountStatus === "suspended" || patient.accountStatus === "disabled") {
    return { success: false, error: `Patient account is ${patient.accountStatus}. Clinical encounter cannot be initiated.` };
  }

  // 4. Resolve Provider Identity & Affiliation
  const provider = findIdentityById(providerId);
  if (!provider) {
    return { success: false, error: `Doctor record not found for ID ${providerId}.` };
  }
  if (provider.accountStatus === "suspended" || provider.accountStatus === "disabled") {
    return { success: false, error: `Doctor account is ${provider.accountStatus}. Encounter creation denied.` };
  }

  // Verify doctor affiliation with organization
  if (provider.doctorData) {
    const activeAffiliation = provider.doctorData.affiliations.find(
      (a) =>
        (a.organizationId === organizationId || a.organizationIdentifier === organizationId) &&
        a.status === "active"
    );
    if (!activeAffiliation) {
      return {
        success: false,
        error: `Doctor ${provider.fullName} does not have an active practice affiliation with organization ${organizationId}.`,
      };
    }
  }

  // 5. Resolve Organization Identity
  const org = findIdentityById(organizationId);
  const organizationName = org?.organizationName || org?.fullName || "Healthcare Facility";

  // 6. Run Centralized Access & Relationship Check (Phase 3 integration)
  const accessCheck = AccessEngine.evaluateAccess({
    actor: provider,
    targetPatientId: patient.identifier || patient.id,
    organizationId: organizationId,
    purpose: "treatment",
    requiredScope: "medical_history",
  });

  if (!accessCheck.allowed && accessCheck.decision !== "ALLOW") {
    // If explicit consent is required, return authorization error
    return {
      success: false,
      error: `Access Engine: ${accessCheck.reason}`,
    };
  }

  // 7. Generate Unique Encounter ID
  const all = getAllEncounters();
  const nextNum = all.length + 1001;
  const newId = `ENC-${nextNum}`;
  const nowIso = new Date().toISOString();

  const newEncounter: HealthcareEncounter = {
    id: newId,
    encounter_reference: newId,
    patient_id: patient.identifier || patient.id,
    patient_name: patient.fullName,
    patient_gender: patient.patientData?.gender,
    patient_dob: patient.patientData?.dob,
    patient_blood_group: patient.patientData?.bloodGroup,
    provider_id: provider.identifier || provider.id,
    provider_name: provider.fullName,
    provider_role: provider.doctorData?.qualifications ? `Consultant (${provider.doctorData.specialization})` : "Attending Doctor",
    organization_id: organizationId,
    organization_name: organizationName,
    department_id: departmentId || "DEP-GENERAL",
    department_name: departmentName || "General OPD",
    encounter_type: encounterType || "CONSULTATION",
    status: "ACTIVE",
    source_type: sourceType,
    reason_for_visit: cleanReason,
    location: location || "OPD Consulting Room",
    started_at: nowIso,
    created_by: actorId,
    created_by_role: actorRole,
    created_at: nowIso,
    updated_at: nowIso,
    consent_id: accessCheck.consent_id,
  };

  all.unshift(newEncounter);
  saveEncounters(all);

  // 8. Append Immutable Audit Trail (Phase 3.4 Integration)
  appendAuditEvent(
    "ENCOUNTER_STARTED",
    actorId,
    actorName,
    actorRole,
    `Started ${encounterType.toLowerCase()} encounter ${newId} for patient ${patient.fullName} at ${organizationName}`,
    patient.identifier || patient.id,
    organizationId,
    organizationName,
    newId,
    {
      encounterType,
      reasonForVisit: cleanReason,
      department: newEncounter.department_name || null,
    }
  );

  return { success: true, encounter: newEncounter };
}

/**
 * Complete an active Healthcare Encounter.
 * Transitions status from ACTIVE -> COMPLETED and locks timestamps.
 */
export function completeEncounter(
  encounterId: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; encounter?: HealthcareEncounter; error?: string } {
  const all = getAllEncounters();
  const index = all.findIndex((e) => e.id === encounterId || e.encounter_reference === encounterId);

  if (index < 0) {
    return { success: false, error: `Encounter ${encounterId} not found.` };
  }

  const encounter = all[index];
  if (encounter.status === "COMPLETED" || encounter.status === "FINALIZED") {
    return { success: false, error: `Encounter ${encounterId} is already marked as ${encounter.status}.` };
  }
  if (encounter.status === "CANCELLED") {
    return { success: false, error: `Encounter ${encounterId} was CANCELLED and cannot be completed.` };
  }

  const nowIso = new Date().toISOString();
  encounter.status = "FINALIZED";
  encounter.ended_at = encounter.ended_at || nowIso;
  encounter.completed_at = nowIso;
  encounter.finalized_at = nowIso;
  encounter.finalized_by = actorId;
  encounter.finalized_by_name = actorName;
  encounter.updated_at = nowIso;

  all[index] = encounter;
  saveEncounters(all);

  // Append Audit Event
  appendAuditEvent(
    "ENCOUNTER_FINALIZED",
    actorId,
    actorName,
    actorRole,
    `Finalized encounter ${encounter.id} for patient ${encounter.patient_name}`,
    encounter.patient_id,
    encounter.organization_id,
    encounter.organization_name,
    encounter.id,
    {
      startedAt: encounter.started_at,
      finalizedAt: encounter.finalized_at,
      totalDurationMinutes: Math.round(
        (new Date(nowIso).getTime() - new Date(encounter.started_at).getTime()) / 60000
      ),
    }
  );

  return { success: true, encounter };
}

/**
 * Explicitly finalize an encounter (Phase 7.1 Clinical Finalization).
 */
export function finalizeEncounter(
  encounterId: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; encounter?: HealthcareEncounter; error?: string } {
  return completeEncounter(encounterId, actorId, actorName, actorRole);
}

/**
 * Cancel an encounter (e.g. patient no-show or cancelled before consultation).
 */
export function cancelEncounter(
  encounterId: string,
  cancelReason: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; encounter?: HealthcareEncounter; error?: string } {
  const all = getAllEncounters();
  const index = all.findIndex((e) => e.id === encounterId || e.encounter_reference === encounterId);

  if (index < 0) {
    return { success: false, error: `Encounter ${encounterId} not found.` };
  }

  const encounter = all[index];
  if (encounter.status === "COMPLETED") {
    return { success: false, error: "A completed encounter cannot be cancelled. Historical record is preserved." };
  }

  const nowIso = new Date().toISOString();
  encounter.status = "CANCELLED";
  encounter.reason_for_visit = `${encounter.reason_for_visit} [CANCELLED: ${cancelReason.trim()}]`;
  encounter.updated_at = nowIso;
  encounter.ended_at = nowIso;

  all[index] = encounter;
  saveEncounters(all);

  // Append Audit Event
  appendAuditEvent(
    "ENCOUNTER_CANCELLED",
    actorId,
    actorName,
    actorRole,
    `Cancelled encounter ${encounter.id}: ${cancelReason.trim()}`,
    encounter.patient_id,
    encounter.organization_id,
    encounter.organization_name,
    encounter.id,
    { cancelReason: cancelReason.trim() }
  );

  return { success: true, encounter };
}
