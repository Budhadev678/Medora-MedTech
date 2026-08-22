// ============================================================
// MEDORA — REFERRAL DOMAIN REPOSITORY (PHASE 7.3)
// Clinical Referral Management Store
// ============================================================

import type { HealthcareReferral, ReferralPriority, ReferralStatus } from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { getEncounterById } from "@/lib/data/encounter-store";

let REFERRALS_MEMORY_STORE: HealthcareReferral[] = [
  {
    id: "REF-1001",
    referral_reference: "REF-1001",
    encounter_id: "ENC-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    referring_doctor_id: "DOC-1001",
    referring_doctor_name: "Dr. Ananya Sharma",
    referring_doctor_role: "Consultant Cardiologist",
    source_facility_id: "FAC-1001",
    source_facility_name: "City Hospital Main Campus",
    source_organization_id: "HSP-1001",
    source_organization_name: "City Hospital",
    destination_type: "SPECIALTY",
    destination_specialty_id: "DEP-CARDIO",
    destination_specialty_name: "Cardiology Specialist Evaluation",
    priority: "ROUTINE",
    reason: "Further evaluation for mild ST segment changes observed on resting ECG.",
    notes: "Please evaluate for stress echocardiography.",
    status: "FINALIZED",
    finalized_at: "2026-08-20T10:35:00Z",
    finalized_by: "DOC-1001",
    created_at: "2026-08-20T10:30:00Z",
    updated_at: "2026-08-20T10:35:00Z",
  },
];

export function getAllReferrals(): HealthcareReferral[] {
  return [...REFERRALS_MEMORY_STORE];
}

export function saveReferralDraft(params: {
  referralId?: string;
  encounterId: string;
  destinationType: "SPECIALTY" | "DOCTOR" | "FACILITY" | "DEPARTMENT";
  destinationSpecialtyId?: string;
  destinationSpecialtyName?: string;
  destinationDoctorId?: string;
  destinationDoctorName?: string;
  destinationFacilityId?: string;
  destinationFacilityName?: string;
  priority?: ReferralPriority;
  reason?: string;
  notes?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; referral?: HealthcareReferral; error?: string } {
  const encounter = getEncounterById(params.encounterId);
  if (!encounter) {
    return { success: false, error: "Healthcare Encounter not found." };
  }

  const now = new Date().toISOString();
  let existingIndex = -1;

  if (params.referralId) {
    existingIndex = REFERRALS_MEMORY_STORE.findIndex((r) => r.id === params.referralId);
  } else {
    existingIndex = REFERRALS_MEMORY_STORE.findIndex((r) => r.encounter_id === params.encounterId && r.status === "DRAFT");
  }

  if (existingIndex >= 0) {
    const existing = REFERRALS_MEMORY_STORE[existingIndex];
    if (existing.status === "FINALIZED" || existing.status === "CANCELLED") {
      return { success: false, error: `Referral ${existing.id} is ${existing.status} and cannot be modified as a draft.` };
    }

    const updatedReferral: HealthcareReferral = {
      ...existing,
      destination_type: params.destinationType,
      destination_specialty_id: params.destinationSpecialtyId,
      destination_specialty_name: params.destinationSpecialtyName,
      destination_doctor_id: params.destinationDoctorId,
      destination_doctor_name: params.destinationDoctorName,
      destination_facility_id: params.destinationFacilityId,
      destination_facility_name: params.destinationFacilityName,
      priority: params.priority || existing.priority,
      reason: params.reason || existing.reason,
      notes: params.notes !== undefined ? params.notes : existing.notes,
      updated_at: now,
    };
    REFERRALS_MEMORY_STORE[existingIndex] = updatedReferral;

    return { success: true, referral: updatedReferral };
  }

  const newId = `REF-${1000 + REFERRALS_MEMORY_STORE.length + 1}`;
  const newReferral: HealthcareReferral = {
    id: newId,
    referral_reference: newId,
    encounter_id: params.encounterId,
    patient_id: encounter.patient_id,
    patient_name: encounter.patient_name,
    referring_doctor_id: params.actorId,
    referring_doctor_name: params.actorName,
    referring_doctor_role: params.actorRole,
    source_facility_id: encounter.facility_id || "FAC-1001",
    source_facility_name: encounter.facility_name || encounter.organization_name || "City Hospital Main Campus",
    source_organization_id: encounter.organization_id,
    source_organization_name: encounter.organization_name,
    destination_type: params.destinationType,
    destination_specialty_id: params.destinationSpecialtyId,
    destination_specialty_name: params.destinationSpecialtyName,
    destination_doctor_id: params.destinationDoctorId,
    destination_doctor_name: params.destinationDoctorName,
    destination_facility_id: params.destinationFacilityId,
    destination_facility_name: params.destinationFacilityName,
    priority: params.priority || "ROUTINE",
    reason: params.reason || "Specialist clinical consultation",
    notes: params.notes || "",
    status: "DRAFT",
    created_at: now,
    updated_at: now,
  };

  REFERRALS_MEMORY_STORE.push(newReferral);
  return { success: true, referral: newReferral };
}

export function finalizeReferral(params: {
  referralId?: string;
  encounterId: string;
  destinationType: "SPECIALTY" | "DOCTOR" | "FACILITY" | "DEPARTMENT";
  destinationSpecialtyId?: string;
  destinationSpecialtyName?: string;
  destinationDoctorId?: string;
  destinationDoctorName?: string;
  destinationFacilityId?: string;
  destinationFacilityName?: string;
  priority?: ReferralPriority;
  reason: string;
  notes?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; referral?: HealthcareReferral; error?: string } {
  const encounter = getEncounterById(params.encounterId);
  if (!encounter) {
    return { success: false, error: "Healthcare Encounter not found." };
  }

  if (!params.reason || !params.reason.trim()) {
    return { success: false, error: "Referral clinical reason is required." };
  }

  const now = new Date().toISOString();
  let existingIndex = -1;

  if (params.referralId) {
    existingIndex = REFERRALS_MEMORY_STORE.findIndex((r) => r.id === params.referralId);
  } else {
    existingIndex = REFERRALS_MEMORY_STORE.findIndex((r) => r.encounter_id === params.encounterId && r.status === "DRAFT");
  }

  const referralId = existingIndex >= 0 ? REFERRALS_MEMORY_STORE[existingIndex].id : `REF-${1000 + REFERRALS_MEMORY_STORE.length + 1}`;

  const finalizedReferral: HealthcareReferral = {
    id: referralId,
    referral_reference: referralId,
    encounter_id: params.encounterId,
    patient_id: encounter.patient_id,
    patient_name: encounter.patient_name,
    referring_doctor_id: params.actorId,
    referring_doctor_name: params.actorName,
    referring_doctor_role: params.actorRole,
    source_facility_id: encounter.facility_id || "FAC-1001",
    source_facility_name: encounter.facility_name || encounter.organization_name || "City Hospital Main Campus",
    source_organization_id: encounter.organization_id,
    source_organization_name: encounter.organization_name,
    destination_type: params.destinationType,
    destination_specialty_id: params.destinationSpecialtyId,
    destination_specialty_name: params.destinationSpecialtyName,
    destination_doctor_id: params.destinationDoctorId,
    destination_doctor_name: params.destinationDoctorName,
    destination_facility_id: params.destinationFacilityId,
    destination_facility_name: params.destinationFacilityName,
    priority: params.priority || "ROUTINE",
    reason: params.reason.trim(),
    notes: params.notes || "",
    status: "FINALIZED",
    finalized_at: now,
    finalized_by: params.actorId,
    created_at: existingIndex >= 0 ? REFERRALS_MEMORY_STORE[existingIndex].created_at : now,
    updated_at: now,
  };

  if (existingIndex >= 0) {
    REFERRALS_MEMORY_STORE[existingIndex] = finalizedReferral;
  } else {
    REFERRALS_MEMORY_STORE.push(finalizedReferral);
  }

  appendAuditEvent(
    "REFERRAL_FINALIZED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Finalized clinical referral ${referralId} for patient ${finalizedReferral.patient_name}`,
    finalizedReferral.patient_id,
    finalizedReferral.source_organization_id,
    finalizedReferral.source_organization_name,
    referralId
  );

  return { success: true, referral: finalizedReferral };
}

export function cancelReferral(
  referralId: string,
  reason: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; referral?: HealthcareReferral; error?: string } {
  const index = REFERRALS_MEMORY_STORE.findIndex((r) => r.id === referralId.trim());
  if (index === -1) {
    return { success: false, error: `Referral ${referralId} not found.` };
  }

  const existing = REFERRALS_MEMORY_STORE[index];
  const now = new Date().toISOString();
  const updated: HealthcareReferral = {
    ...existing,
    status: "CANCELLED",
    cancelled_at: now,
    cancellation_reason: reason,
    updated_at: now,
  };

  REFERRALS_MEMORY_STORE[index] = updated;

  appendAuditEvent(
    "REFERRAL_CANCELLED",
    actorId,
    actorName,
    actorRole,
    `Cancelled clinical referral ${referralId}: ${reason}`,
    existing.patient_id,
    existing.source_organization_id,
    existing.source_organization_name,
    referralId
  );

  return { success: true, referral: updated };
}

export function getReferralById(id: string): HealthcareReferral | null {
  return REFERRALS_MEMORY_STORE.find((r) => r.id.toLowerCase() === id.toLowerCase()) || null;
}

export function getEncounterReferrals(encounterId: string): HealthcareReferral[] {
  return REFERRALS_MEMORY_STORE.filter((r) => r.encounter_id.toLowerCase() === encounterId.toLowerCase());
}

export function getPatientReferrals(patientId: string, includeDrafts: boolean = false): HealthcareReferral[] {
  return REFERRALS_MEMORY_STORE.filter((r) => {
    if (r.patient_id.toLowerCase() !== patientId.toLowerCase()) return false;
    if (!includeDrafts && r.status === "DRAFT") return false;
    return true;
  });
}
