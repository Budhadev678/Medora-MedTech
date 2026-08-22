// ============================================================
// MEDORA — CLINICAL REFERRAL DOMAIN SERVICE (PHASE 7.3)
// Server-Authoritative Clinical Referral Management Service
// ============================================================

import {
  saveReferralDraft as saveReferralDraftInStore,
  finalizeReferral as finalizeReferralInStore,
  cancelReferral as cancelReferralInStore,
  getReferralById,
  getEncounterReferrals as getEncounterReferralsInStore,
  getPatientReferrals as getPatientReferralsInStore,
} from "@/lib/data/referral-store";
import { getEncounterById } from "@/lib/data/encounter-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import type { HealthcareReferral, ReferralPriority } from "@/types/database.types";

export class ReferralService {
  /**
   * Saves or updates a DRAFT clinical referral for an active encounter.
   */
  public static async saveDraft(
    encounterId: string,
    data: {
      referral_id?: string;
      destination_type: "SPECIALTY" | "DOCTOR" | "FACILITY" | "DEPARTMENT";
      destination_specialty_id?: string;
      destination_specialty_name?: string;
      destination_doctor_id?: string;
      destination_doctor_name?: string;
      destination_facility_id?: string;
      destination_facility_name?: string;
      priority?: ReferralPriority;
      reason?: string;
      notes?: string;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; referral?: HealthcareReferral; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) {
      return { success: false, error: "Healthcare Encounter not found." };
    }

    if (encounter.status === "CANCELLED") {
      return { success: false, error: "Cannot create referral for a CANCELLED encounter." };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can create referrals." };
    }

    if (
      actor.role === "doctor" &&
      encounter.provider_id.toLowerCase() !== actorId.toLowerCase() &&
      encounter.provider_id.toLowerCase() !== actor.identifier?.toLowerCase()
    ) {
      return { success: false, error: "Access denied. Only the attending doctor for this encounter can create referrals." };
    }

    return saveReferralDraftInStore({
      referralId: data.referral_id,
      encounterId,
      destinationType: data.destination_type,
      destinationSpecialtyId: data.destination_specialty_id,
      destinationSpecialtyName: data.destination_specialty_name,
      destinationDoctorId: data.destination_doctor_id,
      destinationDoctorName: data.destination_doctor_name,
      destinationFacilityId: data.destination_facility_id,
      destinationFacilityName: data.destination_facility_name,
      priority: data.priority,
      reason: data.reason,
      notes: data.notes,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Authoritatively finalizes a clinical referral.
   */
  public static async finalizeReferral(
    encounterId: string,
    data: {
      referral_id?: string;
      destination_type: "SPECIALTY" | "DOCTOR" | "FACILITY" | "DEPARTMENT";
      destination_specialty_id?: string;
      destination_specialty_name?: string;
      destination_doctor_id?: string;
      destination_doctor_name?: string;
      destination_facility_id?: string;
      destination_facility_name?: string;
      priority?: ReferralPriority;
      reason: string;
      notes?: string;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; referral?: HealthcareReferral; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) {
      return { success: false, error: "Healthcare Encounter not found." };
    }

    if (encounter.status === "CANCELLED") {
      return { success: false, error: "Cannot finalize referral for a CANCELLED encounter." };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can finalize referrals." };
    }

    if (
      actor.role === "doctor" &&
      encounter.provider_id.toLowerCase() !== actorId.toLowerCase() &&
      encounter.provider_id.toLowerCase() !== actor.identifier?.toLowerCase()
    ) {
      return { success: false, error: "Access denied. Only the attending doctor for this encounter can finalize referrals." };
    }

    if (!data.reason || !data.reason.trim()) {
      return { success: false, error: "Clinical reason for referral is mandatory." };
    }

    return finalizeReferralInStore({
      referralId: data.referral_id,
      encounterId,
      destinationType: data.destination_type,
      destinationSpecialtyId: data.destination_specialty_id,
      destinationSpecialtyName: data.destination_specialty_name,
      destinationDoctorId: data.destination_doctor_id,
      destinationDoctorName: data.destination_doctor_name,
      destinationFacilityId: data.destination_facility_id,
      destinationFacilityName: data.destination_facility_name,
      priority: data.priority || "ROUTINE",
      reason: data.reason.trim(),
      notes: data.notes,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Cancels a referral with documented reason.
   */
  public static async cancelReferral(
    referralId: string,
    reason: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; referral?: HealthcareReferral; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A documented reason is required to cancel a referral." };
    }

    const existing = getReferralById(referralId);
    if (!existing) {
      return { success: false, error: `Referral ${referralId} not found.` };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors or admins can cancel referrals." };
    }

    return cancelReferralInStore(referralId, reason.trim(), actorId, actor.fullName, actor.role);
  }

  /**
   * Retrieves referrals for a patient with anti-IDOR protection.
   */
  public static getPatientReferrals(
    patientId: string,
    actor: StoredIdentity | null
  ): { success: boolean; referrals?: HealthcareReferral[]; error?: string } {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const actorId = actor.identifier || actor.id;

    // Patient IDOR protection
    if (actor.role === "patient" && actorId.toLowerCase() !== patientId.toLowerCase()) {
      return { success: false, error: "Access denied. You can only access your own referrals." };
    }

    const includeDrafts = actor.role === "doctor" || actor.role === "admin";
    const referrals = getPatientReferralsInStore(patientId, includeDrafts);
    return { success: true, referrals };
  }

  /**
   * Retrieves referrals for an encounter.
   */
  public static getEncounterReferrals(encounterId: string): HealthcareReferral[] {
    return getEncounterReferralsInStore(encounterId);
  }
}
