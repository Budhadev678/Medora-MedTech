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

const BILLS_KEY = "medora_bills_store";

export function getAllBills(): HealthcareBill[] {
  if (typeof window === "undefined") {
    return [...BILLS_STORE];
  }
  try {
    const raw = localStorage.getItem(BILLS_KEY);
    if (!raw) {
      localStorage.setItem(BILLS_KEY, JSON.stringify(BILLS_STORE));
      return [...BILLS_STORE];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...BILLS_STORE];
  } catch {
    return [...BILLS_STORE];
  }
}

export function getBillById(id: string): HealthcareBill | null {
  const all = getAllBills();
  const clean = (id || "").trim().toLowerCase();
  return all.find((b) => b.id.toLowerCase() === clean || b.bill_number.toLowerCase() === clean) || null;
}

export function getBillsByPatient(patientId: string): HealthcareBill[] {
  const all = getAllBills();
  const clean = (patientId || "").trim().toLowerCase();
  return all.filter((b) => b.patient_id.toLowerCase() === clean);
}

export function getBillsByFacility(facilityId: string, filterStatus?: string): HealthcareBill[] {
  const all = getAllBills();
  const cleanFac = (facilityId || "").trim().toLowerCase();
  return all.filter((b) => {
    if (b.facility_id.toLowerCase() !== cleanFac) return false;
    if (filterStatus && filterStatus !== "ALL") {
      if (b.status !== filterStatus.trim()) return false;
    }
    return true;
  });
}

export function getBillsByEncounter(encounterId: string): HealthcareBill[] {
  const all = getAllBills();
  const clean = (encounterId || "").trim().toLowerCase();
  return all.filter((b) => (b.encounter_id || "").toLowerCase() === clean);
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
  const all = getAllBills();
  const index = all.findIndex((b) => b.id === bill.id);
  if (index >= 0) {
    all[index] = bill;
  } else {
    all.unshift(bill);
  }

  // Update in-memory fallback
  const memIndex = BILLS_STORE.findIndex((b) => b.id === bill.id);
  if (memIndex >= 0) {
    BILLS_STORE[memIndex] = bill;
  } else {
    BILLS_STORE.unshift(bill);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(BILLS_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent("medora-billing-updated"));
      window.dispatchEvent(new CustomEvent("medora-bills-updated"));
    } catch (e) {
      console.error("Failed to save bill to localStorage:", e);
    }
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
    saveBill(b);
  }
}

/**
 * Creates or updates an authoritative bill upon clinical consultation completion.
 * Automatically adds Consultation OPD Fee, Prescribed Medication items, and Diagnostic Lab items.
 */
export function createOrUpdateConsultationBill(params: {
  encounterId: string;
  patientId: string;
  patientName: string;
  organizationId: string;
  organizationName: string;
  facilityId?: string;
  facilityName?: string;
  doctorName?: string;
  doctorId?: string;
  prescriptions?: Array<{ medicine_name: string; dosage?: string }>;
  labOrders?: Array<{ test_name: string; test_code?: string }>;
  actorId: string;
  actorName: string;
  actorRole: string;
}): HealthcareBill {
  const {
    encounterId,
    patientId,
    patientName,
    organizationId,
    organizationName,
    facilityId = "FAC-1001",
    facilityName = "City Hospital — Rourkela Central",
    doctorName = "Dr. Ananya Sharma",
    doctorId = "DOC-1001",
    prescriptions = [],
    labOrders = [],
    actorId,
    actorName,
    actorRole,
  } = params;

  const now = new Date().toISOString();
  const existingBills = getBillsByEncounter(encounterId);
  let bill: HealthcareBill;

  const items: BillableItem[] = [];
  let nextItemIdx = 1;

  // 1. Consultation OPD Service Item
  items.push({
    id: `BILLITEM-${Date.now()}-${nextItemIdx++}`,
    bill_id: existingBills[0]?.id || `BILL-${Date.now() % 10000}`,
    service_id: "SERV-CONS-01",
    service_code: "CONS-OPD-01",
    service_name: "Doctor Outpatient Consultation",
    category: "CONSULTATION",
    source_type: "ENCOUNTER",
    source_id: encounterId,
    description_snapshot: `Doctor Outpatient Consultation — ${doctorName}`,
    quantity: 1,
    unit_price: 500.00,
    base_amount: 500.00,
    currency: "INR",
    price_id: "PRICE-CONS-01",
    service_date: now,
    verification_status: "VERIFIED",
    provenance: {
      ordered_by_id: doctorId,
      ordered_by_name: doctorName,
      order_reference_id: encounterId,
      performed_at: now,
      facility_name: facilityName,
      clinical_reason: "Clinical Outpatient Consultation",
    },
    created_at: now,
  });

  // 2. Prescribed Medications Items
  prescriptions.forEach((rx) => {
    items.push({
      id: `BILLITEM-${Date.now()}-${nextItemIdx++}`,
      bill_id: existingBills[0]?.id || `BILL-${Date.now() % 10000}`,
      service_id: "SERV-MED-GEN",
      service_code: "MED-RX-01",
      service_name: rx.medicine_name,
      category: "PHARMACY",
      source_type: "DISPENSING",
      source_id: encounterId,
      description_snapshot: `${rx.medicine_name} ${rx.dosage ? `(${rx.dosage})` : ""}`.trim(),
      quantity: 1,
      unit_price: 150.00,
      base_amount: 150.00,
      currency: "INR",
      price_id: "PRICE-MED-01",
      service_date: now,
      verification_status: "VERIFIED",
      provenance: {
        ordered_by_id: doctorId,
        ordered_by_name: doctorName,
        order_reference_id: encounterId,
        performed_at: now,
        facility_name: facilityName,
        clinical_reason: "Prescribed medication",
      },
      created_at: now,
    });
  });

  // 3. Ordered Laboratory Test Items
  labOrders.forEach((lab) => {
    items.push({
      id: `BILLITEM-${Date.now()}-${nextItemIdx++}`,
      bill_id: existingBills[0]?.id || `BILL-${Date.now() % 10000}`,
      service_id: "SERV-LAB-GEN",
      service_code: lab.test_code || "LAB-TEST-01",
      service_name: lab.test_name,
      category: "LABORATORY",
      source_type: "LAB_TEST",
      source_id: encounterId,
      description_snapshot: lab.test_name,
      quantity: 1,
      unit_price: 350.00,
      base_amount: 350.00,
      currency: "INR",
      price_id: "PRICE-LAB-01",
      service_date: now,
      verification_status: "VERIFIED",
      provenance: {
        ordered_by_id: doctorId,
        ordered_by_name: doctorName,
        order_reference_id: encounterId,
        performed_at: now,
        facility_name: facilityName,
        clinical_reason: "Diagnostic investigation",
      },
      created_at: now,
    });
  });

  const grossTotal = items.reduce((sum, item) => sum + item.base_amount, 0);

  if (existingBills.length > 0) {
    bill = existingBills[0];
    bill.items = items;
    bill.gross_total = grossTotal;
    bill.net_billable_total = grossTotal;
    bill.patient_responsibility = grossTotal;
    bill.status = "ISSUED";
    bill.updated_at = now;
  } else {
    const nextNum = 1000 + (Date.now() % 9000);
    const billId = `BILL-${nextNum}`;
    const billNumber = `MEDORA-INV-${nextNum}`;

    items.forEach((item) => (item.bill_id = billId));

    bill = {
      id: billId,
      bill_number: billNumber,
      patient_id: patientId,
      patient_name: patientName,
      organization_id: organizationId,
      organization_name: organizationName,
      facility_id: facilityId,
      facility_name: facilityName,
      encounter_id: encounterId,
      bill_type: "FINAL",
      status: "ISSUED",
      gross_total: grossTotal,
      net_billable_total: grossTotal,
      patient_responsibility: grossTotal,
      currency: "INR",
      current_version: 1,
      items,
      created_at: now,
      updated_at: now,
    };
  }

  saveBill(bill);

  appendAuditEvent(
    "BILL_ISSUED",
    actorId,
    actorName,
    actorRole,
    `Issued healthcare invoice ${bill.bill_number} for ₹${grossTotal} (Consultation & Orders)`,
    patientId,
    organizationId,
    organizationName,
    bill.id
  );

  return bill;
}
