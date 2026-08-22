// ============================================================
// MEDORA — FOLLOW-UP RECOMMENDATION DOMAIN SERVICE (PHASE 7.3)
// Server-Authoritative Follow-Up Recommendation & Phase 6 Integration Service
// ============================================================

import {
  createFollowUpRecommendation as createFollowUpRecommendationInStore,
  linkAppointmentToFollowUp as linkAppointmentToFollowUpInStore,
  getFollowUpById,
  getEncounterFollowUps as getEncounterFollowUpsInStore,
  getPatientFollowUps as getPatientFollowUpsInStore,
} from "@/lib/data/followup-store";
import { getEncounterById } from "@/lib/data/encounter-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import type { HealthcareFollowUp } from "@/types/database.types";

export class FollowUpService {
  /**
   * Creates or updates a follow-up recommendation for an active encounter.
   */
  public static async createRecommendation(
    encounterId: string,
    data: {
      timeframe_type: "DAYS" | "WEEKS" | "MONTHS" | "SPECIFIC_DATE";
      timeframe_value: number | string;
      reason: string;
      instructions?: string;
      preferred_doctor_id?: string;
      preferred_doctor_name?: string;
      preferred_facility_id?: string;
      preferred_facility_name?: string;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; followup?: HealthcareFollowUp; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) {
      return { success: false, error: "Healthcare Encounter not found." };
    }

    if (encounter.status === "CANCELLED") {
      return { success: false, error: "Cannot create follow-up recommendation for a CANCELLED encounter." };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can create follow-up recommendations." };
    }

    if (
      actor.role === "doctor" &&
      encounter.provider_id.toLowerCase() !== actorId.toLowerCase() &&
      encounter.provider_id.toLowerCase() !== actor.identifier?.toLowerCase()
    ) {
      return { success: false, error: "Access denied. Only the attending doctor for this encounter can create follow-up recommendations." };
    }

    if (!data.reason || !data.reason.trim()) {
      return { success: false, error: "Clinical reason for follow-up recommendation is required." };
    }

    return createFollowUpRecommendationInStore({
      encounterId,
      timeframeType: data.timeframe_type,
      timeframeValue: data.timeframe_value,
      reason: data.reason.trim(),
      instructions: data.instructions,
      preferredDoctorId: data.preferred_doctor_id,
      preferredDoctorName: data.preferred_doctor_name,
      preferredFacilityId: data.preferred_facility_id,
      preferredFacilityName: data.preferred_facility_name,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Links a Phase 6 booked appointment to a follow-up recommendation.
   */
  public static async linkAppointment(
    followupId: string,
    appointmentId: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; followup?: HealthcareFollowUp; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const actorId = actor.identifier || actor.id;
    return linkAppointmentToFollowUpInStore(followupId, appointmentId, actorId, actor.fullName, actor.role);
  }

  /**
   * Retrieves follow-up recommendations for a patient with anti-IDOR protection.
   */
  public static getPatientFollowUps(
    patientId: string,
    actor: StoredIdentity | null
  ): { success: boolean; followups?: HealthcareFollowUp[]; error?: string } {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const actorId = actor.identifier || actor.id;

    // Patient IDOR protection
    if (actor.role === "patient" && actorId.toLowerCase() !== patientId.toLowerCase()) {
      return { success: false, error: "Access denied. You can only access your own follow-up recommendations." };
    }

    const followups = getPatientFollowUpsInStore(patientId);
    return { success: true, followups };
  }

  /**
   * Retrieves follow-up recommendations for an encounter.
   */
  public static getEncounterFollowUps(encounterId: string): HealthcareFollowUp[] {
    return getEncounterFollowUpsInStore(encounterId);
  }
}
