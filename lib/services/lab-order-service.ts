// ============================================================
// MEDORA — LABORATORY ORDER DOMAIN SERVICE (PHASE 7.3)
// Server-Authoritative Lab Order Creation, Review & Finalization
// ============================================================

import {
  saveLabOrderDraft as saveLabOrderDraftInStore,
  finalizeLabOrder as finalizeLabOrderInStore,
  cancelLabOrder as cancelLabOrderInStore,
  getLabOrderById,
  getEncounterLabOrders as getEncounterLabOrdersInStore,
  getPatientLabOrders as getPatientLabOrdersInStore,
} from "@/lib/data/lab-order-store";
import { getEncounterById } from "@/lib/data/encounter-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import { AuditLedger } from "@/lib/data/audit-store";
import type { HealthcareLabOrder, LabOrderItem, LabOrderPriority } from "@/types/database.types";

export class LabOrderService {
  /**
   * Saves or updates a DRAFT lab order for an active encounter.
   */
  public static async saveDraft(
    encounterId: string,
    data: {
      order_id?: string;
      items: LabOrderItem[];
      priority?: LabOrderPriority;
      reason?: string;
      instructions?: string;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; order?: HealthcareLabOrder; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) {
      return { success: false, error: "Healthcare Encounter not found." };
    }

    if (encounter.status === "CANCELLED") {
      return { success: false, error: "Cannot create lab order for a CANCELLED encounter." };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can compose lab orders." };
    }

    // Prescriber / Attending Doctor authorization guard
    if (
      actor.role === "doctor" &&
      (encounter.provider_id || "").toLowerCase() !== (actor.identifier || "").toLowerCase() &&
      (encounter.provider_id || "").toLowerCase() !== (actor.id || "").toLowerCase()
    ) {
      return { success: false, error: "Access denied. Only the attending doctor for this encounter can compose lab orders." };
    }

    return saveLabOrderDraftInStore({
      orderId: data.order_id,
      encounterId,
      items: data.items || [],
      priority: data.priority,
      reason: data.reason,
      instructions: data.instructions,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Authoritatively finalizes a digital lab order.
   * Validates non-empty test list, clinical reason, locks record,
   * and emits Phase 8 handoff integration payload.
   */
  public static async finalizeLabOrder(
    encounterId: string,
    data: {
      order_id?: string;
      items: LabOrderItem[];
      priority?: LabOrderPriority;
      reason: string;
      instructions?: string;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; order?: HealthcareLabOrder; phase8_handoff_event?: any; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) {
      return { success: false, error: "Healthcare Encounter not found." };
    }

    if (encounter.status === "CANCELLED") {
      return { success: false, error: "Cannot finalize lab order for a CANCELLED encounter." };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can finalize lab orders." };
    }

    if (
      actor.role === "doctor" &&
      (encounter.provider_id || "").toLowerCase() !== (actor.identifier || "").toLowerCase() &&
      (encounter.provider_id || "").toLowerCase() !== (actor.id || "").toLowerCase()
    ) {
      return { success: false, error: "Access denied. Only the attending doctor for this encounter can finalize lab orders." };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Please select at least one laboratory test before finalization." };
    }

    if (!data.reason || !data.reason.trim()) {
      return { success: false, error: "Clinical reason / indication is required for lab order finalization." };
    }

    return finalizeLabOrderInStore({
      orderId: data.order_id,
      encounterId,
      items: data.items,
      priority: data.priority || "ROUTINE",
      reason: data.reason.trim(),
      instructions: data.instructions,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Cancels a lab order with mandatory documented reason.
   */
  public static async cancelLabOrder(
    orderId: string,
    reason: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; order?: HealthcareLabOrder; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A documented reason is required to cancel a lab order." };
    }

    const existing = getLabOrderById(orderId);
    if (!existing) {
      return { success: false, error: `Lab order ${orderId} not found.` };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors or admins can cancel lab orders." };
    }

    return cancelLabOrderInStore(orderId, reason.trim(), actorId, actor.fullName, actor.role);
  }

  /**
   * Retrieves lab orders for a patient with patient isolation check.
   */
  public static getPatientLabOrders(
    patientId: string,
    actor: StoredIdentity | null
  ): { success: boolean; orders?: HealthcareLabOrder[]; error?: string } {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const actorId = actor.identifier || actor.id;

    // Patient IDOR protection
    if (actor.role === "patient" && actorId.toLowerCase() !== patientId.toLowerCase()) {
      return { success: false, error: "Access denied. You can only access your own lab orders." };
    }

    const includeDrafts = actor.role === "doctor" || actor.role === "admin";
    const orders = getPatientLabOrdersInStore(patientId, includeDrafts);
    return { success: true, orders };
  }

  /**
   * Retrieves lab orders for an encounter.
   */
  public static getEncounterLabOrders(encounterId: string): HealthcareLabOrder[] {
    return getEncounterLabOrdersInStore(encounterId);
  }
}
