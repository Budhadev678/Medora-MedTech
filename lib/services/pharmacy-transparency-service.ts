// ============================================================
// MEDORA — PHARMACY TRANSPARENCY & NOTIFICATION SERVICE (PHASE 9.4)
// Presentation, Event Processing, Visual Timeline Compiler & Patient Notification Service
// ============================================================

import {
  createPatientNotification,
  createTimelineEvent,
  getNotificationsForUser,
  getTimelineEventsForOrder,
} from "@/lib/data/notification-store";
import { getDispensingRecordsByPatient } from "@/lib/data/dispensing-store";
import type { PharmacyOrder, DispensingRecord, PatientNotification, PharmacyTimelineEvent } from "@/types/database.types";

export class PharmacyTransparencyService {
  /**
   * Event Handler: Triggered when a new pharmacy order is confirmed.
   */
  public static async handleOrderCreated(order: PharmacyOrder): Promise<void> {
    createTimelineEvent({
      orderId: order.id,
      patientId: order.patient_id,
      eventType: "PHARMACY_ORDER_CREATED",
      displayTitle: "Order Created & Confirmed",
      description: `Order ${order.id} confirmed at ${order.facility_name} (${order.fulfillment_type})`,
      actorType: "PATIENT",
      actorName: order.patient_name,
    });

    createPatientNotification({
      userId: order.patient_id,
      eventType: "ORDER_CONFIRMED",
      title: "Pharmacy Order Confirmed",
      message: `Your medicine order ${order.id} was confirmed by ${order.facility_name}.`,
      priority: "INFO",
      referenceType: "PHARMACY_ORDER",
      referenceId: order.id,
    });
  }

  /**
   * Event Handler: Triggered when pharmacist begins preparation.
   */
  public static async handleOrderPreparing(order: PharmacyOrder, pharmacistName: string): Promise<void> {
    createTimelineEvent({
      orderId: order.id,
      patientId: order.patient_id,
      eventType: "PHARMACY_PREPARATION_STARTED",
      displayTitle: "Medicines Being Prepared",
      description: `Pharmacist ${pharmacistName} is collecting and verifying medicines in prescription ${order.prescription_id}`,
      actorType: "PHARMACIST",
      actorName: pharmacistName,
    });

    createPatientNotification({
      userId: order.patient_id,
      eventType: "MEDICINE_PREPARING",
      title: "Medicines Being Prepared",
      message: `${order.facility_name} is actively preparing your prescribed medicines.`,
      priority: "INFO",
      referenceType: "PHARMACY_ORDER",
      referenceId: order.id,
    });
  }

  /**
   * Event Handler: Triggered when order preparation is ready for pickup or dispatch.
   */
  public static async handleOrderReady(order: PharmacyOrder): Promise<void> {
    const isPickup = order.fulfillment_type === "PICKUP";
    const title = isPickup ? "Ready for Counter Pickup" : "Ready for Courier Dispatch";
    const desc = isPickup
      ? `Your medicines are packed and ready for pickup at ${order.facility_name}. Verification OTP: ${order.verification_otp}`
      : `Your order is packed and assigned to MEDORA Express Dispatch.`;

    createTimelineEvent({
      orderId: order.id,
      patientId: order.patient_id,
      eventType: "PHARMACY_ORDER_READY",
      displayTitle: title,
      description: desc,
      actorType: "PHARMACIST",
    });

    createPatientNotification({
      userId: order.patient_id,
      eventType: "MEDICINE_READY",
      title: isPickup ? "Medicines Ready for Pickup" : "Order Ready for Dispatch",
      message: desc,
      priority: "IMPORTANT",
      referenceType: "PHARMACY_ORDER",
      referenceId: order.id,
    });
  }

  /**
   * Event Handler: Triggered when dispensing is completed.
   */
  public static async handleOrderDispensed(order: PharmacyOrder, dispensing: DispensingRecord): Promise<void> {
    const title = dispensing.is_partial ? "Partially Dispensed" : "Medicines Dispensed";
    const desc = dispensing.is_partial
      ? `Pharmacist ${dispensing.pharmacist_name} dispensed partial quantity (${dispensing.items.map((i) => `${i.quantity_dispensed}/${i.quantity_prescribed} ${i.medicine_name}`).join(", ")})`
      : `Pharmacist ${dispensing.pharmacist_name} verified identity and handed over full prescribed medicines.`;

    createTimelineEvent({
      orderId: order.id,
      patientId: order.patient_id,
      eventType: "PHARMACY_MEDICINE_DISPENSED",
      displayTitle: title,
      description: desc,
      actorType: "PHARMACIST",
      actorName: dispensing.pharmacist_name,
    });

    createPatientNotification({
      userId: order.patient_id,
      eventType: dispensing.is_partial ? "PARTIAL_DISPENSING" : "MEDICINE_DISPENSED",
      title: title,
      message: `Receipt ${dispensing.id}: Medicines dispensed at ${dispensing.facility_name}.`,
      priority: "IMPORTANT",
      referenceType: "PHARMACY_ORDER",
      referenceId: order.id,
    });
  }

  /**
   * Retrieves visual fulfillment timeline for a patient order.
   */
  public static getVisualTimeline(orderId: string): PharmacyTimelineEvent[] {
    return getTimelineEventsForOrder(orderId);
  }

  /**
   * Retrieves patient notifications.
   */
  public static getPatientNotifications(patientId: string): PatientNotification[] {
    return getNotificationsForUser(patientId);
  }
}
