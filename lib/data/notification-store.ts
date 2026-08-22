// ============================================================
// MEDORA — PATIENT NOTIFICATION & TIMELINE REPOSITORY (PHASE 9.4)
// Authoritative In-App Notifications & Visual Fulfillment Timeline Store
// ============================================================

import type { PatientNotification, PharmacyTimelineEvent } from "@/types/database.types";

let NOTIFICATIONS_STORE: PatientNotification[] = [
  {
    id: "NOTIF-1001",
    user_id: "PAT-1001",
    event_type: "ORDER_CONFIRMED",
    title: "Order Confirmed",
    message: "ABC Pharmacy has confirmed your medicine order PHARM-ORD-1001.",
    priority: "INFO",
    reference_type: "PHARMACY_ORDER",
    reference_id: "PHARM-ORD-1001",
    created_at: "2026-08-20T11:10:00Z",
  },
  {
    id: "NOTIF-1002",
    user_id: "PAT-1001",
    event_type: "MEDICINE_DISPENSED",
    title: "Medicines Dispensed",
    message: "Your medicines for prescription PRX-1001 were successfully dispensed at ABC Pharmacy.",
    priority: "IMPORTANT",
    reference_type: "PHARMACY_ORDER",
    reference_id: "PHARM-ORD-1001",
    created_at: "2026-08-20T11:30:00Z",
  },
];

let TIMELINE_EVENTS_STORE: PharmacyTimelineEvent[] = [
  {
    id: "PHARM-TL-1001",
    order_id: "PHARM-ORD-1001",
    patient_id: "PAT-1001",
    event_type: "PRESCRIPTION_RECEIVED",
    display_title: "Prescription Received",
    description: "Pharmacy received digital prescription PRX-1001",
    occurred_at: "2026-08-20T11:00:00Z",
    actor_type: "SYSTEM",
  },
  {
    id: "PHARM-TL-1002",
    order_id: "PHARM-ORD-1001",
    patient_id: "PAT-1001",
    event_type: "STOCK_RESERVED",
    display_title: "Stock Reserved",
    description: "10 units of Paracetamol 500mg reserved (Batch PCM-2026-01)",
    occurred_at: "2026-08-20T11:05:00Z",
    actor_type: "SYSTEM",
  },
  {
    id: "PHARM-TL-1003",
    order_id: "PHARM-ORD-1001",
    patient_id: "PAT-1001",
    event_type: "MEDICINE_DISPENSED",
    display_title: "Medicines Dispensed",
    description: "Medicines verified and handed over at counter",
    occurred_at: "2026-08-20T11:30:00Z",
    actor_type: "PHARMACIST",
    actor_name: "Pharmacist Priya",
  },
];

// ============================================================
// NOTIFICATION QUERIES & MUTATIONS
// ============================================================

export function getNotificationsForUser(userId: string): PatientNotification[] {
  const clean = (userId || "").trim().toLowerCase();
  return NOTIFICATIONS_STORE.filter((n) => n.user_id.toLowerCase() === clean).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function createPatientNotification(params: {
  userId: string;
  eventType: string;
  title: string;
  message: string;
  priority?: "INFO" | "IMPORTANT" | "ACTION_REQUIRED" | "CRITICAL";
  referenceType: "PHARMACY_ORDER" | "PRESCRIPTION" | "LAB_REPORT" | "APPOINTMENT";
  referenceId: string;
}): PatientNotification {
  // Idempotency: Prevent identical duplicate notification within short timeframe
  const existing = NOTIFICATIONS_STORE.find(
    (n) =>
      n.user_id === params.userId &&
      n.event_type === params.eventType &&
      n.reference_id === params.referenceId
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const notif: PatientNotification = {
    id: `NOTIF-${1000 + NOTIFICATIONS_STORE.length + 1}`,
    user_id: params.userId,
    event_type: params.eventType,
    title: params.title,
    message: params.message,
    priority: params.priority || "INFO",
    reference_type: params.referenceType,
    reference_id: params.referenceId,
    created_at: now,
  };

  NOTIFICATIONS_STORE.push(notif);
  return notif;
}

export function markNotificationRead(notifId: string): void {
  const clean = (notifId || "").trim().toLowerCase();
  const n = NOTIFICATIONS_STORE.find((item) => item.id.toLowerCase() === clean);
  if (n && !n.read_at) {
    n.read_at = new Date().toISOString();
  }
}

// ============================================================
// TIMELINE QUERIES & MUTATIONS
// ============================================================

export function getTimelineEventsForOrder(orderId: string): PharmacyTimelineEvent[] {
  const clean = (orderId || "").trim().toLowerCase();
  return TIMELINE_EVENTS_STORE.filter((t) => t.order_id.toLowerCase() === clean).sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  );
}

export function createTimelineEvent(params: {
  orderId: string;
  patientId: string;
  eventType: string;
  displayTitle: string;
  description: string;
  actorType: "PATIENT" | "PHARMACIST" | "SYSTEM" | "COURIER";
  actorName?: string;
  metadata?: Record<string, any>;
}): PharmacyTimelineEvent {
  const now = new Date().toISOString();
  const evt: PharmacyTimelineEvent = {
    id: `PHARM-TL-${1000 + TIMELINE_EVENTS_STORE.length + 1}`,
    order_id: params.orderId,
    patient_id: params.patientId,
    event_type: params.eventType,
    display_title: params.displayTitle,
    description: params.description,
    occurred_at: now,
    actor_type: params.actorType,
    actor_name: params.actorName,
    metadata: params.metadata,
  };

  TIMELINE_EVENTS_STORE.push(evt);
  return evt;
}
