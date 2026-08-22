// ============================================================
// MEDORA — PHARMACY PRESCRIPTION INTAKE SERVICE (PHASE 9.1)
// Server-Authoritative Prescription Intake, Validation & Clarification Service
// ============================================================

import {
  createPrescriptionIntake,
  updateIntakeStatus,
  createClarificationRequest,
  getIntakeById,
  getIntakesByFacility,
  getIntakesByPatient,
} from "@/lib/data/pharmacy-intake-store";
import { getPrescriptionById } from "@/lib/data/prescription-store";
import { getPharmacyFacilityById, getPharmacyStaffMembership } from "@/lib/data/pharmacy-organization-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import type { PharmacyPrescriptionIntake, PrescriptionClarificationRequest, HealthcarePrescription } from "@/types/database.types";

export class PharmacyIntakeService {
  /**
   * Submits a Phase 7 prescription to a connected pharmacy for operational intake.
   */
  public static async submitPrescriptionToIntake(
    prescriptionId: string,
    facilityId: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; intake?: PharmacyPrescriptionIntake; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const rx = getPrescriptionById(prescriptionId);
    if (!rx) return { success: false, error: `Prescription ${prescriptionId} not found.` };

    // Validation: Check prescription status
    if (rx.status === "CANCELLED" || rx.status === "VOIDED") {
      return { success: false, error: `Cannot send cancelled/voided prescription ${prescriptionId} to pharmacy.` };
    }

    const facility = getPharmacyFacilityById(facilityId);
    if (!facility) return { success: false, error: `Pharmacy facility ${facilityId} not found.` };

    if (facility.operational_status !== "ACTIVE") {
      return { success: false, error: `Pharmacy facility ${facility.name} is currently ${facility.operational_status}.` };
    }

    const actorId = actor.identifier || actor.id;
    return createPrescriptionIntake({
      prescriptionId: rx.id,
      prescriptionVersion: rx.version || 1,
      patientId: rx.patient_id,
      patientName: rx.patient_name,
      prescriberId: rx.prescriber_id,
      prescriberName: rx.prescriber_name,
      facilityId: facility.id,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Reviews and validates a pharmacy intake record (Pharmacist verification).
   */
  public static async validateIntake(
    intakeId: string,
    action: "MARK_VALID" | "MARK_INVALID" | "START_REVIEW",
    rejectionReason: string | undefined,
    notes: string | undefined,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; intake?: PharmacyPrescriptionIntake; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const intake = getIntakeById(intakeId);
    if (!intake) return { success: false, error: `Pharmacy intake ${intakeId} not found.` };

    const actorId = actor.identifier || actor.id;
    const actorRole = (actor.role || "").toLowerCase();

    // RBAC & Membership Check
    if (actorRole !== "admin") {
      const membership = getPharmacyStaffMembership(actorId, intake.facility_id);
      if (!membership || membership.role !== "PHARMACIST" && membership.role !== "PHARMACY_ADMIN") {
        return { success: false, error: "Access denied. Only authorized pharmacists or pharmacy admins may validate prescription intakes." };
      }
    }

    // Revalidate authoritative Phase 7 prescription state
    const rx = getPrescriptionById(intake.prescription_id);
    if (!rx) return { success: false, error: `Original prescription ${intake.prescription_id} no longer exists.` };

    if (rx.status === "CANCELLED" || rx.status === "VOIDED") {
      // Auto-invalidate intake if prescription was cancelled
      updateIntakeStatus({
        intakeId: intake.id,
        status: "INVALID",
        rejectionReason: "Prescription was cancelled by prescriber/clinical authority.",
        actorId,
        actorName: actor.fullName,
        actorRole: actor.role,
      });
      return { success: false, error: "Prescription was cancelled by prescriber. Intake marked INVALID." };
    }

    const targetStatus = action === "MARK_VALID" ? "VALID" : action === "MARK_INVALID" ? "INVALID" : "UNDER_REVIEW";

    return updateIntakeStatus({
      intakeId: intake.id,
      status: targetStatus,
      rejectionReason,
      notes,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Requests prescriber clarification for a prescription intake item.
   */
  public static async requestClarification(
    intakeId: string,
    reason: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; request?: PrescriptionClarificationRequest; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const intake = getIntakeById(intakeId);
    if (!intake) return { success: false, error: `Pharmacy intake ${intakeId} not found.` };

    const actorId = actor.identifier || actor.id;
    return createClarificationRequest({
      prescriptionId: intake.prescription_id,
      pharmacyIntakeId: intake.id,
      facilityId: intake.facility_id,
      recipientDoctorId: intake.prescriber_id,
      reason,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }
}
