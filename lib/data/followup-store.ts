// ============================================================
// MEDORA — FOLLOW-UP RECOMMENDATION REPOSITORY (PHASE 7.3)
// Clinical Follow-up Recommendation Store
// ============================================================

import type { HealthcareFollowUp, FollowUpStatus } from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { getEncounterById } from "@/lib/data/encounter-store";

let FOLLOWUPS_MEMORY_STORE: HealthcareFollowUp[] = [
  {
    id: "FU-1001",
    followup_reference: "FU-1001",
    encounter_id: "ENC-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    facility_id: "FAC-1001",
    facility_name: "City Hospital Main Campus",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    timeframe_type: "DAYS",
    timeframe_value: 7,
    timeframe_display: "Follow up in 7 days",
    reason: "Review diagnostic lab test results (lipid profile & renal function) and blood pressure log.",
    instructions: "Maintain daily blood pressure log in morning and evening.",
    preferred_doctor_id: "DOC-1001",
    preferred_doctor_name: "Dr. Ananya Sharma",
    preferred_facility_id: "FAC-1001",
    preferred_facility_name: "City Hospital Main Campus",
    status: "RECOMMENDED",
    created_at: "2026-08-20T10:40:00Z",
    updated_at: "2026-08-20T10:40:00Z",
  },
];

export function getAllFollowUps(): HealthcareFollowUp[] {
  return [...FOLLOWUPS_MEMORY_STORE];
}

export function createFollowUpRecommendation(params: {
  encounterId: string;
  timeframeType: "DAYS" | "WEEKS" | "MONTHS" | "SPECIFIC_DATE";
  timeframeValue: number | string;
  reason: string;
  instructions?: string;
  preferredDoctorId?: string;
  preferredDoctorName?: string;
  preferredFacilityId?: string;
  preferredFacilityName?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; followup?: HealthcareFollowUp; error?: string } {
  const encounter = getEncounterById(params.encounterId);
  if (!encounter) {
    return { success: false, error: "Healthcare Encounter not found." };
  }

  if (!params.reason || !params.reason.trim()) {
    return { success: false, error: "Follow-up clinical reason is required." };
  }

  const now = new Date().toISOString();
  let timeframeDisplay = `Follow up in ${params.timeframeValue} ${params.timeframeType.toLowerCase()}`;
  if (params.timeframeType === "SPECIFIC_DATE") {
    timeframeDisplay = `Follow up on ${params.timeframeValue}`;
  }

  // Idempotent check for existing follow-up for this encounter
  const existing = FOLLOWUPS_MEMORY_STORE.find((f) => f.encounter_id === params.encounterId && f.status === "RECOMMENDED");
  if (existing) {
    const updated: HealthcareFollowUp = {
      ...existing,
      timeframe_type: params.timeframeType,
      timeframe_value: params.timeframeValue,
      timeframe_display: timeframeDisplay,
      reason: params.reason.trim(),
      instructions: params.instructions !== undefined ? params.instructions : existing.instructions,
      preferred_doctor_id: params.preferredDoctorId || existing.preferred_doctor_id,
      preferred_doctor_name: params.preferredDoctorName || existing.preferred_doctor_name,
      preferred_facility_id: params.preferredFacilityId || existing.preferred_facility_id,
      preferred_facility_name: params.preferredFacilityName || existing.preferred_facility_name,
      updated_at: now,
    };
    const index = FOLLOWUPS_MEMORY_STORE.findIndex((f) => f.id === existing.id);
    FOLLOWUPS_MEMORY_STORE[index] = updated;

    return { success: true, followup: updated };
  }

  const newId = `FU-${1000 + FOLLOWUPS_MEMORY_STORE.length + 1}`;
  const newFollowUp: HealthcareFollowUp = {
    id: newId,
    followup_reference: newId,
    encounter_id: params.encounterId,
    patient_id: encounter.patient_id,
    patient_name: encounter.patient_name,
    doctor_id: params.actorId,
    doctor_name: params.actorName,
    facility_id: encounter.facility_id || "FAC-1001",
    facility_name: encounter.facility_name || encounter.organization_name || "City Hospital Main Campus",
    organization_id: encounter.organization_id,
    organization_name: encounter.organization_name,
    timeframe_type: params.timeframeType,
    timeframe_value: params.timeframeValue,
    timeframe_display: timeframeDisplay,
    reason: params.reason.trim(),
    instructions: params.instructions || "",
    preferred_doctor_id: params.preferredDoctorId || params.actorId,
    preferred_doctor_name: params.preferredDoctorName || params.actorName,
    preferred_facility_id: params.preferredFacilityId || encounter.facility_id,
    preferred_facility_name: params.preferredFacilityName || encounter.facility_name,
    status: "RECOMMENDED",
    created_at: now,
    updated_at: now,
  };

  FOLLOWUPS_MEMORY_STORE.push(newFollowUp);

  appendAuditEvent(
    "FOLLOWUP_RECOMMENDED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Created follow-up recommendation ${newId} for patient ${newFollowUp.patient_name}: ${timeframeDisplay}`,
    newFollowUp.patient_id,
    newFollowUp.organization_id,
    newFollowUp.organization_name,
    newId
  );

  return { success: true, followup: newFollowUp };
}

/**
 * Links a booked Phase 6 appointment to an existing follow-up recommendation.
 */
export function linkAppointmentToFollowUp(
  followupId: string,
  appointmentId: string,
  actorId: string = "PAT-1001",
  actorName: string = "Patient",
  actorRole: string = "patient"
): { success: boolean; followup?: HealthcareFollowUp; error?: string } {
  const index = FOLLOWUPS_MEMORY_STORE.findIndex((f) => f.id === followupId.trim());
  if (index === -1) {
    return { success: false, error: `Follow-up recommendation ${followupId} not found.` };
  }

  const existing = FOLLOWUPS_MEMORY_STORE[index];
  const now = new Date().toISOString();

  const updated: HealthcareFollowUp = {
    ...existing,
    status: "BOOKED",
    appointment_id: appointmentId,
    updated_at: now,
  };

  FOLLOWUPS_MEMORY_STORE[index] = updated;

  appendAuditEvent(
    "FOLLOWUP_BOOKED",
    actorId,
    actorName,
    actorRole,
    `Linked Phase 6 appointment ${appointmentId} to follow-up recommendation ${followupId}`,
    existing.patient_id,
    existing.organization_id,
    existing.organization_name,
    followupId
  );

  return { success: true, followup: updated };
}

export function getFollowUpById(id: string): HealthcareFollowUp | null {
  return FOLLOWUPS_MEMORY_STORE.find((f) => f.id.toLowerCase() === id.toLowerCase()) || null;
}

export function getEncounterFollowUps(encounterId: string): HealthcareFollowUp[] {
  return FOLLOWUPS_MEMORY_STORE.filter((f) => f.encounter_id.toLowerCase() === encounterId.toLowerCase());
}

export function getPatientFollowUps(patientId: string): HealthcareFollowUp[] {
  return FOLLOWUPS_MEMORY_STORE.filter((f) => f.patient_id.toLowerCase() === patientId.toLowerCase());
}
