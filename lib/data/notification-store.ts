// ============================================================
// MEDORA — PATIENT NOTIFICATION & COMMUNICATION CENTER REPOSITORY
// Authoritative Multi-Category In-App Notifications & Event Routing
// ============================================================

import type { PatientNotification, PharmacyTimelineEvent } from "@/types/database.types";

export type NotificationCategory =
  | "ALL"
  | "EMERGENCY"
  | "APPOINTMENT"
  | "HEALTHCARE"
  | "LAB_REPORT"
  | "PRESCRIPTION"
  | "BILLING"
  | "PAYMENT"
  | "DISPUTE"
  | "SECURITY"
  | "SYSTEM";

export type NotificationPriority = "INFO" | "IMPORTANT" | "ACTION_REQUIRED" | "CRITICAL";

export type NotificationReferenceType =
  | "PHARMACY_ORDER"
  | "PRESCRIPTION"
  | "LAB_REPORT"
  | "APPOINTMENT"
  | "EMERGENCY"
  | "BILL"
  | "PAYMENT"
  | "DISPUTE"
  | "SECURITY"
  | "SYSTEM";

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
  {
    id: "NOTIF-1003",
    user_id: "PAT-1001",
    event_type: "APPOINTMENT_CONFIRMED",
    title: "Appointment Confirmed",
    message: "Your consultation with Dr. Rajesh Sharma is confirmed for tomorrow at 10:30 AM.",
    priority: "IMPORTANT",
    reference_type: "APPOINTMENT" as any,
    reference_id: "APT-1001",
    created_at: "2026-08-23T10:00:00Z",
  },
  {
    id: "NOTIF-1004",
    user_id: "PAT-1001",
    event_type: "LAB_REPORT_READY",
    title: "Lab Report Available",
    message: "Your Complete Blood Count (CBC) diagnostic test results have been released.",
    priority: "IMPORTANT",
    reference_type: "LAB_REPORT" as any,
    reference_id: "LAB-ORD-1001",
    created_at: "2026-08-23T14:30:00Z",
  },
  {
    id: "NOTIF-1005",
    user_id: "PAT-1001",
    event_type: "BILL_ISSUED",
    title: "New Healthcare Invoice Issued",
    message: "Bill BIL-1001 for ₹10,000 has been generated. Patient responsibility: ₹10,000.",
    priority: "IMPORTANT",
    reference_type: "BILL" as any,
    reference_id: "BILL-1001",
    created_at: "2026-08-23T15:00:00Z",
  },
  {
    id: "NOTIF-1006",
    user_id: "PAT-1001",
    event_type: "PAYMENT_CONFIRMED",
    title: "Payment Receipt Issued",
    message: "Receipt RCT-1001 for ₹10,000 recorded successfully. Full settlement reconciled.",
    priority: "INFO",
    reference_type: "PAYMENT" as any,
    reference_id: "RCT-1001",
    created_at: "2026-08-23T16:00:00Z",
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

export function getNotificationsForUser(
  userId: string,
  category: NotificationCategory = "ALL"
): PatientNotification[] {
  const clean = (userId || "").trim().toLowerCase();
  let list = NOTIFICATIONS_STORE.filter((n) => n.user_id.toLowerCase() === clean);

  if (category !== "ALL") {
    list = list.filter((n) => {
      const ref = (n.reference_type || "").toUpperCase();
      if (category === "EMERGENCY") return ref === "EMERGENCY";
      if (category === "APPOINTMENT") return ref === "APPOINTMENT";
      if (category === "HEALTHCARE") return ref === "PRESCRIPTION" || ref === "LAB_REPORT";
      if (category === "LAB_REPORT") return ref === "LAB_REPORT";
      if (category === "PRESCRIPTION") return ref === "PRESCRIPTION";
      if (category === "BILLING") return ref === "BILL" || ref === "DISPUTE";
      if (category === "PAYMENT") return ref === "PAYMENT";
      if (category === "DISPUTE") return ref === "DISPUTE";
      if (category === "SECURITY") return ref === "SECURITY";
      return true;
    });
  }

  // Priority sort: CRITICAL first, then newest
  return list.sort((a, b) => {
    if (a.priority === "CRITICAL" && b.priority !== "CRITICAL") return -1;
    if (b.priority === "CRITICAL" && a.priority !== "CRITICAL") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function getUnreadNotificationCount(userId: string): number {
  const clean = (userId || "").trim().toLowerCase();
  return NOTIFICATIONS_STORE.filter(
    (n) => n.user_id.toLowerCase() === clean && !n.read_at
  ).length;
}

export function createPatientNotification(params: {
  userId: string;
  eventType: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  referenceType: NotificationReferenceType;
  referenceId: string;
}): PatientNotification {
  // Idempotency: Prevent identical duplicate notification
  const existing = NOTIFICATIONS_STORE.find(
    (n) =>
      n.user_id.toLowerCase() === params.userId.toLowerCase() &&
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
    reference_type: params.referenceType as any,
    reference_id: params.referenceId,
    created_at: now,
  };

  NOTIFICATIONS_STORE.unshift(notif);
  return notif;
}

export function markNotificationRead(notifId: string): void {
  const clean = (notifId || "").trim().toLowerCase();
  const n = NOTIFICATIONS_STORE.find((item) => item.id.toLowerCase() === clean);
  if (n && !n.read_at) {
    n.read_at = new Date().toISOString();
  }
}

export function markNotificationUnread(notifId: string): void {
  const clean = (notifId || "").trim().toLowerCase();
  const n = NOTIFICATIONS_STORE.find((item) => item.id.toLowerCase() === clean);
  if (n) {
    delete n.read_at;
  }
}

export function markAllNotificationsRead(userId: string): void {
  const clean = (userId || "").trim().toLowerCase();
  const now = new Date().toISOString();
  NOTIFICATIONS_STORE.forEach((n) => {
    if (n.user_id.toLowerCase() === clean && !n.read_at) {
      n.read_at = now;
    }
  });
}

export function deletePatientNotification(notifId: string): boolean {
  const clean = (notifId || "").trim().toLowerCase();
  const idx = NOTIFICATIONS_STORE.findIndex((item) => item.id.toLowerCase() === clean);
  if (idx !== -1) {
    NOTIFICATIONS_STORE.splice(idx, 1);
    return true;
  }
  return false;
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
