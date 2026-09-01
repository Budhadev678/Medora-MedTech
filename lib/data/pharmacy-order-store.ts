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

const ORDERS_KEY = "medora_pharmacy_orders_store";

// ============================================================
// ORDER QUERIES
// ============================================================

export function getAllOrders(): PharmacyOrder[] {
  let orders = [...ORDERS_STORE];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          orders = parsed;
        }
      }
    } catch {}
  }

  // Synchronize with prescription store so any patient-selected prescription is guaranteed in the order fulfillment queue
  try {
    const rxStore = require("@/lib/data/prescription-store");
    const allRxs = rxStore.getAllPrescriptions ? rxStore.getAllPrescriptions() : [];
    allRxs.forEach((rx: any) => {
      const targetPharmacyId = rx.selected_pharmacy_id || rx.assigned_pharmacy_id;
      if (targetPharmacyId && rx.status !== "DRAFT" && rx.status !== "CANCELLED") {
        const exists = orders.some(
          (o) => o.prescription_id.toLowerCase() === rx.id.toLowerCase() && o.facility_id.toLowerCase() === targetPharmacyId.toLowerCase()
        );
        if (!exists) {
          const nextNum = 1000 + orders.length + 1;
          const orderId = `PHARM-ORD-${nextNum}`;
          const items: PharmacyOrderItem[] = (rx.items || []).map((item: any, idx: number) => ({
            id: `ORD-ITEM-${nextNum}-${idx + 1}`,
            order_id: orderId,
            prescription_item_id: item.id || `PRX-ITEM-${idx + 1}`,
            medicine_id: `MED-${idx + 1001}`,
            medicine_name: item.medicine_name,
            generic_name: item.generic_name || item.medicine_name,
            strength: item.dosage || "Standard",
            dosage_form: "TABLET",
            reservation_id: `RES-${Date.now()}-${idx + 1}`,
            batch_id: `BATCH-${idx + 1001}`,
            batch_number: `BATCH-${(item.medicine_name || "MED").slice(0, 3).toUpperCase()}-2026`,
            quantity_requested: 10,
            quantity_reserved: 10,
            quantity_prepared: 0,
            quantity_dispensed: rx.status === "DISPENSED" ? 10 : 0,
            unit_price: 15.00,
            subtotal: 150.00,
            status: rx.status === "DISPENSED" ? "DISPENSED" : "PENDING",
          }));

          orders.unshift({
            id: orderId,
            prescription_id: rx.id,
            pharmacy_intake_id: `PHARM-INTAKE-${rx.id}`,
            patient_id: rx.patient_id,
            patient_name: rx.patient_name,
            prescriber_id: rx.prescriber_id,
            prescriber_name: rx.prescriber_name,
            pharmacy_organization_id: "PHARM-ORG-1001",
            facility_id: targetPharmacyId,
            facility_name: rx.selected_pharmacy_name || "ABC Pharmacy Facility",
            fulfillment_type: "PICKUP",
            status: rx.status === "DISPENSED" ? "DISPENSED" as any : "CONFIRMED",
            items,
            total_items: items.length,
            total_amount: items.reduce((s, i) => s + i.subtotal, 0),
            verification_otp: "948201",
            created_at: rx.pharmacy_selected_at || rx.created_at,
            updated_at: rx.updated_at || rx.created_at,
          });
        }
      }
    });
  } catch {}

  return orders;
}

export function saveOrders(orders: PharmacyOrder[]): void {
  ORDERS_STORE = orders;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent("medora-pharmacy-orders-updated"));
      window.dispatchEvent(new CustomEvent("medora-pharmacy-updated"));
      window.dispatchEvent(new CustomEvent("medora-prescriptions-updated"));
    } catch (e) {
      console.error("Failed to persist pharmacy orders:", e);
    }
  }
}

export function getOrderById(id: string): PharmacyOrder | null {
  const all = getAllOrders();
  const clean = (id || "").trim().toLowerCase();
  return all.find((o) => o.id.toLowerCase() === clean) || null;
}

export function getOrdersByFacility(facilityId: string, filterStatus?: string): PharmacyOrder[] {
  const cleanFac = (facilityId || "").trim().toLowerCase();
  const all = getAllOrders();
  return all.filter((o) => {
    if (o.facility_id.toLowerCase() !== cleanFac) return false;
    if (filterStatus && filterStatus !== "ALL") {
      if (o.status !== filterStatus.trim()) return false;
    }
    return true;
  });
}

export function getOrdersByPatient(patientId: string): PharmacyOrder[] {
  const clean = (patientId || "").trim().toLowerCase();
  const all = getAllOrders();
  return all.filter((o) => o.patient_id.toLowerCase() === clean);
}

export function getOrdersByPrescription(prescriptionId: string): PharmacyOrder[] {
  const clean = (prescriptionId || "").trim().toLowerCase();
  const all = getAllOrders();
  return all.filter((o) => o.prescription_id.toLowerCase() === clean);
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

  const all = getAllOrders();

  // Idempotency: Check if order already exists for prescription & facility
  const existing = all.find(
    (o) =>
      o.prescription_id.toLowerCase() === params.prescriptionId.toLowerCase() &&
      o.facility_id.toLowerCase() === params.facilityId.toLowerCase() &&
      o.status !== "CANCELLED"
  );

  if (existing) {
    return { success: true, order: existing };
  }

  const now = new Date().toISOString();
  const nextNum = 1000 + all.length + 1;
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

  all.unshift(newOrder);
  saveOrders(all);

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
  const all = getAllOrders();
  const index = all.findIndex((o) => o.id.toLowerCase() === orderId.trim().toLowerCase());
  if (index === -1) return { success: false, error: `Pharmacy order ${orderId} not found.` };

  const existing = all[index];

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

  all[index] = updated;
  saveOrders(all);

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
