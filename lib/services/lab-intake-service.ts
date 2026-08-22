// ============================================================
// MEDORA — LABORATORY ORDER INTAKE DOMAIN SERVICE (PHASE 8.1)
// Server-Authoritative Laboratory Order Intake, Validation & Acceptance
// ============================================================

import {
  acceptLabOrder,
  rejectLabOrderUnprocessable,
  getLabOrderById,
  getAllLabOrders,
} from "@/lib/data/lab-order-store";
import { checkFacilityCapability, getFacilityCapabilities } from "@/lib/data/lab-capability-store";
import { getLabStaffMemberships, getLabFacilityById } from "@/lib/data/lab-organization-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import type { HealthcareLabOrder } from "@/types/database.types";

export class LabIntakeService {
  /**
   * Retrieves laboratory order intake dashboard stats for a facility.
   */
  public static getFacilityDashboardStats(facilityId: string, actor: StoredIdentity | null) {
    if (!actor) return null;

    const allOrders = getAllLabOrders();
    const facilityOrders = allOrders.filter(
      (o) =>
        o.status === "FINALIZED" ||
        o.status === "ACCEPTED" ||
        o.status === "ORDERED" ||
        o.status === "REJECTED" ||
        (o.laboratory_id && o.laboratory_id.toLowerCase() === facilityId.toLowerCase())
    );

    const pending = facilityOrders.filter((o) => o.status === "FINALIZED" || o.status === "ORDERED");
    const accepted = facilityOrders.filter((o) => o.status === "ACCEPTED");
    const rejected = facilityOrders.filter((o) => o.status === "REJECTED");

    return {
      total: facilityOrders.length,
      pendingCount: pending.length,
      acceptedCount: accepted.length,
      unableToProcessCount: rejected.length,
      awaitingActionCount: pending.length,
    };
  }

  /**
   * Retrieves orders available for intake at a facility.
   */
  public static getIntakeOrders(
    facilityId: string,
    actor: StoredIdentity | null
  ): { success: boolean; orders?: HealthcareLabOrder[]; error?: string } {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const allOrders = getAllLabOrders();

    // Intake orders include finalized clinical orders available for laboratory review
    const intakeOrders = allOrders.filter((o) => {
      // Must be finalized or accepted
      if (o.status === "DRAFT") return false;
      if (o.laboratory_id && o.laboratory_id.toLowerCase() !== facilityId.toLowerCase()) {
        return false; // Assigned to another lab
      }
      return true;
    });

    return { success: true, orders: intakeOrders };
  }

  /**
   * Validates incoming lab order authenticity and facility capabilities.
   */
  public static validateOrderIntake(
    orderId: string,
    facilityId: string
  ): {
    valid: boolean;
    order?: HealthcareLabOrder;
    capabilityIssues: string[];
    error?: string;
  } {
    const order = getLabOrderById(orderId);
    if (!order) {
      return { valid: false, capabilityIssues: [], error: `Lab order ${orderId} not found.` };
    }

    if (order.status === "DRAFT") {
      return { valid: false, order, capabilityIssues: [], error: "Laboratory cannot accept a DRAFT clinical order. Order must be FINALIZED." };
    }

    if (order.status === "CANCELLED") {
      return { valid: false, order, capabilityIssues: [], error: "Laboratory cannot process a CANCELLED clinical order." };
    }

    const capabilityIssues: string[] = [];
    for (const item of order.items) {
      const check = checkFacilityCapability(facilityId, item.test_code || item.test_id || item.test_name);
      if (!check.supported) {
        capabilityIssues.push(`Test "${item.test_name}" is ${check.status} at facility ${facilityId}: ${check.reason || "Not supported"}`);
      }
    }

    return {
      valid: capabilityIssues.length === 0,
      order,
      capabilityIssues,
    };
  }

  /**
   * Accepts a finalized lab order for laboratory processing.
   */
  public static async acceptOrder(
    orderId: string,
    facilityId: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; order?: HealthcareLabOrder; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const facility = getLabFacilityById(facilityId);
    if (!facility) {
      return { success: false, error: `Laboratory facility ${facilityId} not found.` };
    }

    const val = this.validateOrderIntake(orderId, facilityId);
    if (!val.valid && val.error) {
      return { success: false, error: val.error };
    }

    if (val.capabilityIssues.length > 0) {
      return {
        success: false,
        error: `Cannot accept order: ${val.capabilityIssues.join("; ")}`,
      };
    }

    const actorId = actor.identifier || actor.id;
    return acceptLabOrder({
      orderId,
      facilityId,
      facilityName: facility.name,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Marks a lab order as unable to process with mandatory documented reason.
   */
  public static async markUnableToProcess(
    orderId: string,
    reasonCategory: string,
    explanation: string | undefined,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; order?: HealthcareLabOrder; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    if (!reasonCategory || !reasonCategory.trim()) {
      return { success: false, error: "Documented reason category is required to mark order unable to process." };
    }

    const actorId = actor.identifier || actor.id;
    return rejectLabOrderUnprocessable({
      orderId,
      reasonCategory: reasonCategory.trim(),
      explanation,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }
}
