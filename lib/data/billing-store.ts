// ============================================================
// MEDORA — AUTHORITATIVE BILLING REPOSITORY (PHASE 10.1)
// Authoritative Healthcare Bills, Bill Items & Bill Versioning Store
// ============================================================

import type { HealthcareBill, BillableItem, BillVersion, BillStatus, BillType } from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";

let BILLS_STORE: HealthcareBill[] = [
  {
    id: "BILL-1001",
    bill_number: "MEDORA-INV-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Rourkela Central",
    encounter_id: "ENC-1001",
    bill_type: "FINAL",
    status: "ISSUED",
    gross_total: 14000.00,
    net_billable_total: 14000.00,
    patient_responsibility: 14000.00,
    currency: "INR",
    current_version: 1,
    items: [
      {
        id: "BILLITEM-1001",
        bill_id: "BILL-1001",
        service_id: "SERV-CONS-01",
        service_code: "CONS-OPD-01",
        service_name: "Doctor Outpatient Consultation",
        category: "CONSULTATION",
        source_type: "ENCOUNTER",
        source_id: "ENC-1001",
        description_snapshot: "Doctor Outpatient Consultation — Dr. Ananya Sharma",
        quantity: 1,
        unit_price: 500.00,
        base_amount: 500.00,
        currency: "INR",
        price_id: "PRICE-CONS-01",
        service_date: "2026-08-20T10:00:00Z",
        verification_status: "VERIFIED",
        provenance: {
          ordered_by_id: "DOC-1001",
          ordered_by_name: "Dr. Ananya Sharma",
          order_reference_id: "ENC-1001",
          performed_at: "2026-08-20T10:15:00Z",
          facility_name: "City Hospital — Rourkela Central",
          clinical_reason: "Cardiology consultation",
        },
        created_at: "2026-08-20T10:15:00Z",
      },
      {
        id: "BILLITEM-1002",
        bill_id: "BILL-1001",
        service_id: "SERV-IMG-01",
        service_code: "IMG-MRI-BRAIN-01",
        service_name: "MRI Brain Without Contrast",
        category: "IMAGING",
        source_type: "IMAGING",
        source_id: "IMG-1001",
        description_snapshot: "MRI Brain Without Contrast",
        quantity: 1,
        unit_price: 12000.00,
        base_amount: 12000.00,
        currency: "INR",
        price_id: "PRICE-IMG-01",
        service_date: "2026-08-20T10:45:00Z",
        verification_status: "VERIFIED",
        provenance: {
          ordered_by_id: "DOC-1001",
          ordered_by_name: "Dr. Ananya Sharma",
          order_reference_id: "IMG-1001",
          performed_at: "2026-08-20T10:45:00Z",
          facility_name: "City Hospital — Rourkela Central",
          report_reference_id: "RPT-IMG-1001",
          clinical_reason: "Diagnostic investigation",
        },
        created_at: "2026-08-20T10:45:00Z",
      },
      {
        id: "BILLITEM-1003",
        bill_id: "BILL-1001",
        service_id: "SERV-LAB-01",
        service_code: "LAB-CBC-01",
        service_name: "Complete Blood Count (CBC)",
        category: "LABORATORY",
        source_type: "LAB_TEST",
        source_id: "LAB-1001",
        description_snapshot: "Complete Blood Count (CBC)",
        quantity: 1,
        unit_price: 500.00,
        base_amount: 500.00,
        currency: "INR",
        price_id: "PRICE-LAB-01",
        service_date: "2026-08-20T11:00:00Z",
        verification_status: "VERIFIED",
        provenance: {
          ordered_by_id: "DOC-1001",
          ordered_by_name: "Dr. Ananya Sharma",
          order_reference_id: "LAB-1001",
          performed_at: "2026-08-20T11:00:00Z",
          facility_name: "City Hospital — Rourkela Central",
          report_reference_id: "RPT-LAB-1001",
          clinical_reason: "Routine diagnostic panel",
        },
        created_at: "2026-08-20T11:00:00Z",
      },
      {
        id: "BILLITEM-1004",
        bill_id: "BILL-1001",
        service_id: "SERV-MED-01",
        service_code: "MED-PCM-500",
        service_name: "Paracetamol 500mg Tablet (10s)",
        category: "PHARMACY",
        source_type: "DISPENSING",
        source_id: "DISP-1001",
        description_snapshot: "Paracetamol 500mg Tablet (10s)",
        quantity: 1,
        unit_price: 1000.00,
        base_amount: 1000.00,
        currency: "INR",
        price_id: "PRICE-MED-01",
        service_date: "2026-08-20T11:30:00Z",
        verification_status: "VERIFIED",
        provenance: {
          ordered_by_id: "DOC-1001",
          ordered_by_name: "Dr. Ananya Sharma",
          order_reference_id: "PRX-1001",
          performed_at: "2026-08-20T11:30:00Z",
          facility_name: "ABC Pharmacy — Rourkela Central",
          clinical_reason: "Post-op analgesia",
        },
        created_at: "2026-08-20T11:30:00Z",
      },
    ],
    issued_at: "2026-08-20T12:00:00Z",
    created_at: "2026-08-20T12:00:00Z",
    updated_at: "2026-08-20T12:00:00Z",
  },
];

let BILL_VERSIONS_STORE: BillVersion[] = [
  {
    id: "BILL-VER-1001-V1",
    bill_id: "BILL-1001",
    version_number: 1,
    gross_total: 14000.00,
    change_delta: 14000.00,
    reason: "Initial authoritative bill issued",
    created_by_id: "USR-BILLING-01",
    created_by_name: "Billing Officer Suresh",
    authorized_by_id: "USR-BILLING-01",
    authorized_by_name: "Billing Officer Suresh",
    items: [
      { id: "VITEM-1", source_bill_item_id: "BILLITEM-1001", description_snapshot: "Doctor Outpatient Consultation", quantity: 1, unit_price: 500.00, line_total: 500.00 },
      { id: "VITEM-2", source_bill_item_id: "BILLITEM-1002", description_snapshot: "MRI Brain Without Contrast", quantity: 1, unit_price: 12000.00, line_total: 12000.00 },
      { id: "VITEM-3", source_bill_item_id: "BILLITEM-1003", description_snapshot: "Complete Blood Count (CBC)", quantity: 1, unit_price: 500.00, line_total: 500.00 },
      { id: "VITEM-4", source_bill_item_id: "BILLITEM-1004", description_snapshot: "Paracetamol 500mg Tablet (10s)", quantity: 1, unit_price: 1000.00, line_total: 1000.00 },
    ],
    created_at: "2026-08-20T12:00:00Z",
  },
];

// ============================================================
// BILL QUERIES
// ============================================================

export function getAllBills(): HealthcareBill[] {
  return [...BILLS_STORE];
}

export function getBillById(id: string): HealthcareBill | null {
  const clean = (id || "").trim().toLowerCase();
  return BILLS_STORE.find((b) => b.id.toLowerCase() === clean || b.bill_number.toLowerCase() === clean) || null;
}

export function getBillsByPatient(patientId: string): HealthcareBill[] {
  const clean = (patientId || "").trim().toLowerCase();
  return BILLS_STORE.filter((b) => b.patient_id.toLowerCase() === clean);
}

export function getBillsByFacility(facilityId: string, filterStatus?: string): HealthcareBill[] {
  const cleanFac = (facilityId || "").trim().toLowerCase();
  return BILLS_STORE.filter((b) => {
    if (b.facility_id.toLowerCase() !== cleanFac) return false;
    if (filterStatus && filterStatus !== "ALL") {
      if (b.status !== filterStatus.trim()) return false;
    }
    return true;
  });
}

export function getBillVersions(billId: string): BillVersion[] {
  const clean = (billId || "").trim().toLowerCase();
  return BILL_VERSIONS_STORE.filter((v) => v.bill_id.toLowerCase() === clean).sort((a, b) => b.version_number - a.version_number);
}

export const getPatientBills = getBillsByPatient;
export const getFacilityBills = getBillsByFacility;

// ============================================================
// BILL MUTATIONS
// ============================================================

export function saveBill(bill: HealthcareBill): void {
  const index = BILLS_STORE.findIndex((b) => b.id === bill.id);
  if (index >= 0) {
    BILLS_STORE[index] = bill;
  } else {
    BILLS_STORE.push(bill);
  }
}

export function saveBillVersion(version: BillVersion): void {
  BILL_VERSIONS_STORE.push(version);
}

export function updateBillTotals(billId: string, grossTotal: number, netTotal: number, patientResp: number): void {
  const b = getBillById(billId);
  if (b) {
    b.gross_total = grossTotal;
    b.net_billable_total = netTotal;
    b.patient_responsibility = patientResp;
    b.updated_at = new Date().toISOString();
  }
}
