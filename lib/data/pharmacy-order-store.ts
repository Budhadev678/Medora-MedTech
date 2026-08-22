// ============================================================
// MEDORA — PHARMACY ORDER REPOSITORY (PHASE 9.3)
// Authoritative Pharmacy Order, Preparation, Handover & Delivery Store
// ============================================================

import type {
  PharmacyOrder,
  PharmacyOrderItem,
  PharmacyOrderStatus,
  PharmacyFulfillmentType,
  PharmacyPreparationRecord,
  PharmacyHandoverRecord,
  PharmacyDeliveryRecord,
  PharmacyReturnRecord,
  PharmacyReversalRecord,
} from "@/types/database.types";
import { getPharmacyFacilityById } from "@/lib/data/pharmacy-organization-store";
import { appendAuditEvent } from "@/lib/data/audit-store";

let ORDERS_STORE: PharmacyOrder[] = [
  {
    id: "PHARM-ORD-1001",
    prescription_id: "PRX-1001",
    pharmacy_intake_id: "PHARM-INTAKE-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    prescriber_id: "DOC-1001",
    prescriber_name: "Dr. Ananya Sharma",
    pharmacy_organization_id: "PHARM-ORG-1001",
    facility_id: "PHARM-FAC-1001",
    facility_name: "ABC Pharmacy — Rourkela Central",
    fulfillment_type: "PICKUP",
    status: "CONFIRMED",
    items: [
      {
        id: "ORD-ITEM-1001",
        order_id: "PHARM-ORD-1001",
        prescription_item_id: "PRX-ITEM-1001",
        medicine_id: "MED-1001",
        medicine_name: "Paracetamol 500mg Tablet",
        generic_name: "Paracetamol",
        strength: "500 mg",
        dosage_form: "TABLET",
        reservation_id: "RES-1001",
        batch_id: "BATCH-1001",
        batch_number: "PCM-2026-01",
        quantity_requested: 10,
        quantity_reserved: 10,
        quantity_prepared: 0,
        quantity_dispensed: 0,
        unit_price: 15.00,
        subtotal: 150.00,
        status: "PENDING",
      },
    ],
    total_items: 1,
    total_amount: 150.00,
    verification_otp: "948201",
    created_at: "2026-08-20T11:10:00Z",
    updated_at: "2026-08-20T11:10:00Z",
  },
];

let PREPARATIONS_STORE: PharmacyPreparationRecord[] = [];
let HANDOVERS_STORE: PharmacyHandoverRecord[] = [];
let DELIVERIES_STORE: PharmacyDeliveryRecord[] = [];
let RETURNS_STORE: PharmacyReturnRecord[] = [];
let REVERSALS_STORE: PharmacyReversalRecord[] = [];

// ============================================================
// ORDER QUERIES
// ============================================================

export function getAllOrders(): PharmacyOrder[] {
  return [...ORDERS_STORE];
}

export function getOrderById(id: string): PharmacyOrder | null {
  const clean = (id || "").trim().toLowerCase();
  return ORDERS_STORE.find((o) => o.id.toLowerCase() === clean) || null;
}

export function getOrdersByFacility(facilityId: string, filterStatus?: string): PharmacyOrder[] {
  const cleanFac = (facilityId || "").trim().toLowerCase();
  return ORDERS_STORE.filter((o) => {
    if (o.facility_id.toLowerCase() !== cleanFac) return false;
    if (filterStatus && filterStatus !== "ALL") {
      if (o.status !== filterStatus.trim()) return false;
    }
    return true;
  });
}

export function getOrdersByPatient(patientId: string): PharmacyOrder[] {
  const clean = (patientId || "").trim().toLowerCase();
  return ORDERS_STORE.filter((o) => o.patient_id.toLowerCase() === clean);
}

export function getOrdersByPrescription(prescriptionId: string): PharmacyOrder[] {
  const clean = (prescriptionId || "").trim().toLowerCase();
  return ORDERS_STORE.filter((o) => o.prescription_id.toLowerCase() === clean);
}

// ============================================================
// ORDER CREATION & STATE MACHINE
// ============================================================

export function createPharmacyOrder(params: {
  prescriptionId: string;
  pharmacyIntakeId: string;
  patientId: string;
  patientName: string;
  prescriberId: string;
  prescriberName: string;
  facilityId: string;
  fulfillmentType: PharmacyFulfillmentType;
  deliveryAddress?: string;
  items: Omit<PharmacyOrderItem, "id" | "order_id" | "quantity_prepared" | "quantity_dispensed" | "status">[];
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; order?: PharmacyOrder; error?: string } {
  const facility = getPharmacyFacilityById(params.facilityId);
  if (!facility) return { success: false, error: `Facility ${params.facilityId} not found.` };

  // Idempotency: Check if order already exists for prescription & facility
  const existing = ORDERS_STORE.find(
    (o) =>
      o.prescription_id.toLowerCase() === params.prescriptionId.toLowerCase() &&
      o.facility_id.toLowerCase() === params.facilityId.toLowerCase() &&
      o.status !== "CANCELLED"
  );

  if (existing) {
    return { success: true, order: existing };
  }

  const now = new Date().toISOString();
  const nextNum = 1000 + ORDERS_STORE.length + 1;
  const orderId = `PHARM-ORD-${nextNum}`;

  let totalAmount = 0;
  const orderItems: PharmacyOrderItem[] = params.items.map((item, idx) => {
    totalAmount += item.subtotal;
    return {
      ...item,
      id: `ORD-ITEM-${nextNum}-${idx + 1}`,
      order_id: orderId,
      quantity_prepared: 0,
      quantity_dispensed: 0,
      status: "PENDING",
    };
  });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const newOrder: PharmacyOrder = {
    id: orderId,
    prescription_id: params.prescriptionId,
    pharmacy_intake_id: params.pharmacyIntakeId,
    patient_id: params.patientId,
    patient_name: params.patientName,
    prescriber_id: params.prescriberId,
    prescriber_name: params.prescriberName,
    pharmacy_organization_id: facility.organization_id,
    facility_id: facility.id,
    facility_name: facility.name,
    fulfillment_type: params.fulfillmentType,
    delivery_address: params.deliveryAddress,
    status: "CREATED",
    items: orderItems,
    total_items: orderItems.length,
    total_amount: totalAmount,
    verification_otp: otp,
    created_at: now,
    updated_at: now,
  };

  ORDERS_STORE.push(newOrder);

  appendAuditEvent(
    "PHARMACY_ORDER_CREATED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Created pharmacy order ${orderId} for prescription ${params.prescriptionId} (${params.fulfillmentType})`,
    params.patientId,
    facility.organization_id,
    facility.organization_name,
    orderId
  );

  return { success: true, order: newOrder };
}

export function updateOrderStatus(
  orderId: string,
  targetStatus: PharmacyOrderStatus,
  reason: string | undefined,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; order?: PharmacyOrder; error?: string } {
  const index = ORDERS_STORE.findIndex((o) => o.id.toLowerCase() === orderId.trim().toLowerCase());
  if (index === -1) return { success: false, error: `Pharmacy order ${orderId} not found.` };

  const existing = ORDERS_STORE[index];

  // Block forbidden transitions (e.g. DISPENSED cannot be simple CANCELLED)
  if (existing.status === "DISPENSED" && targetStatus === "CANCELLED") {
    return { success: false, error: "Dispensed order cannot be cancelled. Use return or reversal workflow." };
  }

  const now = new Date().toISOString();
  const updated: PharmacyOrder = {
    ...existing,
    status: targetStatus,
    cancellation_reason: targetStatus === "CANCELLED" ? reason || existing.cancellation_reason : existing.cancellation_reason,
    updated_at: now,
  };

  ORDERS_STORE[index] = updated;

  appendAuditEvent(
    "PHARMACY_ORDER_CONFIRMED",
    actorId,
    actorName,
    actorRole,
    `Pharmacy order ${existing.id} status updated to ${targetStatus}`,
    existing.patient_id,
    existing.pharmacy_organization_id,
    undefined,
    existing.id
  );

  return { success: true, order: updated };
}

export function savePreparationRecord(record: PharmacyPreparationRecord): void {
  PREPARATIONS_STORE.push(record);
}

export function saveHandoverRecord(record: PharmacyHandoverRecord): void {
  HANDOVERS_STORE.push(record);
}

export function saveDeliveryRecord(record: PharmacyDeliveryRecord): void {
  DELIVERIES_STORE.push(record);
}

export function getDeliveryRecordForOrder(orderId: string): PharmacyDeliveryRecord | null {
  const clean = (orderId || "").trim().toLowerCase();
  return DELIVERIES_STORE.find((d) => d.order_id.toLowerCase() === clean) || null;
}
