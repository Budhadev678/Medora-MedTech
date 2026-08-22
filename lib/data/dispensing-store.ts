// ============================================================
// MEDORA — AUTHORITATIVE DISPENSING REPOSITORY (PHASE 9.3)
// Server-Authoritative Dispensing Record & Dispensing Item Store
// ============================================================

import type { DispensingRecord, DispensingItem, DispensingStatus } from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";

let DISPENSING_RECORDS_STORE: DispensingRecord[] = [
  {
    id: "DISP-1001",
    order_id: "PHARM-ORD-1001",
    prescription_id: "PRX-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    facility_id: "PHARM-FAC-1001",
    facility_name: "ABC Pharmacy — Rourkela Central",
    pharmacist_id: "USR-PHARM-01",
    pharmacist_name: "Pharmacist Priya",
    dispensed_at: "2026-08-20T11:30:00Z",
    status: "DISPENSED",
    verification_method: "MEDORA_ID_OTP",
    items: [
      {
        id: "DISP-ITEM-1001",
        dispensing_id: "DISP-1001",
        order_item_id: "ORD-ITEM-1001",
        medicine_id: "MED-1001",
        medicine_name: "Paracetamol 500mg Tablet",
        batch_id: "BATCH-1001",
        batch_number: "PCM-2026-01",
        quantity_prescribed: 10,
        quantity_dispensed: 10,
        quantity_remaining: 0,
        unit_price: 15.00,
        subtotal: 150.00,
      },
    ],
    total_dispensed_amount: 150.00,
    is_partial: false,
    created_at: "2026-08-20T11:30:00Z",
  },
];

export function getAllDispensingRecords(): DispensingRecord[] {
  return [...DISPENSING_RECORDS_STORE];
}

export function getDispensingRecordById(id: string): DispensingRecord | null {
  const clean = (id || "").trim().toLowerCase();
  return DISPENSING_RECORDS_STORE.find((d) => d.id.toLowerCase() === clean) || null;
}

export function getDispensingRecordByOrder(orderId: string): DispensingRecord | null {
  const clean = (orderId || "").trim().toLowerCase();
  return DISPENSING_RECORDS_STORE.find((d) => d.order_id.toLowerCase() === clean) || null;
}

export function getDispensingRecordsByPatient(patientId: string): DispensingRecord[] {
  const clean = (patientId || "").trim().toLowerCase();
  return DISPENSING_RECORDS_STORE.filter((d) => d.patient_id.toLowerCase() === clean);
}

export function saveDispensingRecord(record: DispensingRecord): void {
  // Idempotency: Prevent duplicate record insertion
  const existing = DISPENSING_RECORDS_STORE.find((d) => d.id === record.id || d.order_id === record.order_id);
  if (existing) return;

  DISPENSING_RECORDS_STORE.push(record);

  appendAuditEvent(
    record.is_partial ? "PARTIAL_DISPENSING" : "MEDICINE_DISPENSED",
    record.pharmacist_id,
    record.pharmacist_name,
    "lab_staff",
    `Recorded dispensing transaction ${record.id} for order ${record.order_id} (Patient: ${record.patient_name})`,
    record.patient_id,
    record.facility_id,
    undefined,
    record.id
  );
}
