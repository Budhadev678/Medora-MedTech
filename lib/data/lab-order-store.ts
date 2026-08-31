// ============================================================
// MEDORA — CONNECTED LABORATORY CORE REPOSITORY (PHASE C.3)
// Full End-to-End Diagnostic Domain Store:
// Lab Order -> Physical Sample -> Test Results -> Certified Report
// ============================================================

import type {
  HealthcareLabOrder,
  LabOrderItem,
  LabOrderPriority,
  LabOrderStatus,
  HealthcareLabSample,
  SampleType,
  SampleStatus,
  SampleRejectionReason,
  HealthcareTestResult,
  TestResultType,
  ResultAbnormalFlag,
  TestResultStatus,
  TestResultVersionSnapshot,
  HealthcareLabReport,
  LabReportStatus,
  LabReportVersionSnapshot,
} from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { getEncounterById } from "@/lib/data/encounter-store";
import { findIdentityById, type StoredIdentity } from "@/lib/data/identity-store";

export type {
  HealthcareLabOrder,
  LabOrderItem,
  LabOrderPriority,
  LabOrderStatus,
  HealthcareLabSample,
  SampleType,
  SampleStatus,
  SampleRejectionReason,
  HealthcareTestResult,
  HealthcareLabReport,
  LabReportStatus,
};

// ============================================================
// CANONICAL SEEDED DATA
// ============================================================

export const SEEDED_LAB_ORDERS: HealthcareLabOrder[] = [
  // 1. Lab Order for ENC-1001 (Rahul Verma at City Hospital - In Progress)
  {
    id: "LAB-ORD-1001",
    order_reference: "LAB-ORD-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1001",
    clinical_record_id: "CR-1001",
    ordering_provider_id: "DOC-1001",
    ordering_provider_name: "Dr. Ananya Sharma",
    ordering_provider_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    facility_name: "City Hospital Main Campus",
    department_name: "Cardiology OPD",
    laboratory_id: "LAB-1001",
    laboratory_name: "ABC Diagnostics",
    priority: "ROUTINE",
    reason: "Evaluate baseline renal parameters and lipid profile following elevated blood pressure reading.",
    instructions: "12-hour overnight fasting required for fasting lipid panel.",
    status: "PROCESSING",
    items: [
      {
        id: "LOI-1",
        test_id: "TEST-LIP-001",
        test_name: "Lipid Profile Panel",
        test_code: "LIP-01",
        specimen_type: "SERUM",
        instructions: "Fasting sample required (12 hours)",
        status: "PROCESSING",
      },
      {
        id: "LOI-2",
        test_id: "TEST-KFT-001",
        test_name: "Renal Function Test (KFT / RFT)",
        test_code: "REN-02",
        specimen_type: "SERUM",
        instructions: "Standard venipuncture",
        status: "PROCESSING",
      },
    ],
    ordered_at: "2026-08-20T10:28:00Z",
    accepted_at: "2026-08-20T11:00:00Z",
    created_at: "2026-08-20T10:26:00Z",
    updated_at: "2026-08-20T11:15:00Z",
  },
  // 2. Lab Order for ENC-1002 (Rahul Verma at Green Care Clinic - Ordered)
  {
    id: "LAB-ORD-1002",
    order_reference: "LAB-ORD-1002",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1002",
    ordering_provider_id: "DOC-1001",
    ordering_provider_name: "Dr. Ananya Sharma",
    ordering_provider_role: "Visiting Cardiologist",
    organization_id: "CLN-1001",
    organization_name: "Green Care Clinic",
    facility_id: "FAC-1003",
    facility_name: "Green Care Clinic - City Branch",
    priority: "ROUTINE",
    reason: "Routine HbA1c screening for metabolic risk assessment.",
    instructions: "Standard blood collection. Non-fasting random sample.",
    status: "ORDERED",
    items: [
      {
        id: "LOI-1",
        test_id: "TEST-DIA-001",
        test_name: "Glycated Hemoglobin (HbA1c)",
        test_code: "DIA-01",
        specimen_type: "WHOLE_BLOOD",
        instructions: "Random sample (non-fasting)",
        status: "ORDERED",
      },
    ],
    ordered_at: "2026-08-15T16:20:00Z",
    created_at: "2026-08-15T16:20:00Z",
    updated_at: "2026-08-15T16:20:00Z",
  },
];

export const SEEDED_SAMPLES: HealthcareLabSample[] = [
  {
    id: "SMP-1001",
    sample_barcode: "SMP-1001",
    lab_order_id: "LAB-ORD-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    laboratory_id: "LAB-1001",
    laboratory_name: "ABC Diagnostics",
    sample_type: "SERUM",
    status: "PROCESSING",
    test_item_ids: ["LOI-1", "LOI-2"],
    test_names: ["Lipid Profile Panel", "Renal Function Test (KFT / RFT)"],
    collected_at: "2026-08-20T11:15:00Z",
    collected_by_id: "LAB-STAFF-1",
    collected_by_name: "Sunil Phlebotomist",
    received_at: "2026-08-20T11:30:00Z",
    received_by_id: "LAB-STAFF-1",
    received_by_name: "Sunil Phlebotomist",
    created_at: "2026-08-20T11:00:00Z",
    updated_at: "2026-08-20T11:30:00Z",
  },
];

export const SEEDED_TEST_RESULTS: HealthcareTestResult[] = [
  {
    id: "RES-1001",
    lab_order_id: "LAB-ORD-1001",
    lab_order_item_id: "LOI-1",
    sample_id: "SMP-1001",
    patient_id: "PAT-1001",
    test_id: "TEST-LIP-001",
    test_name: "Lipid Profile Panel",
    parameter_id: "param-chol",
    parameter_name: "Total Cholesterol",
    result_type: "NUMERIC",
    value: "215",
    numeric_value: 215,
    unit: "mg/dL",
    reference_range: "< 200 mg/dL",
    flag: "HIGH",
    status: "VERIFIED",
    entered_by_id: "LAB-TECH-1",
    entered_by_name: "Prakash Technician",
    entered_at: "2026-08-20T13:00:00Z",
    verified_by_id: "LAB-PATH-1",
    verified_by_name: "Dr. B. Mohapatra, MD",
    verified_at: "2026-08-20T14:00:00Z",
    version: 1,
  },
  {
    id: "RES-1002",
    lab_order_id: "LAB-ORD-1001",
    lab_order_item_id: "LOI-1",
    sample_id: "SMP-1001",
    patient_id: "PAT-1001",
    test_id: "TEST-LIP-001",
    test_name: "Lipid Profile Panel",
    parameter_id: "param-hdl",
    parameter_name: "HDL Cholesterol",
    result_type: "NUMERIC",
    value: "42",
    numeric_value: 42,
    unit: "mg/dL",
    reference_range: "> 40 mg/dL",
    flag: "NORMAL",
    status: "VERIFIED",
    entered_by_id: "LAB-TECH-1",
    entered_by_name: "Prakash Technician",
    entered_at: "2026-08-20T13:00:00Z",
    verified_by_id: "LAB-PATH-1",
    verified_by_name: "Dr. B. Mohapatra, MD",
    verified_at: "2026-08-20T14:00:00Z",
    version: 1,
  },
  {
    id: "RES-1003",
    lab_order_id: "LAB-ORD-1001",
    lab_order_item_id: "LOI-2",
    sample_id: "SMP-1001",
    patient_id: "PAT-1001",
    test_id: "TEST-KFT-001",
    test_name: "Renal Function Test (KFT / RFT)",
    parameter_id: "param-creat",
    parameter_name: "Serum Creatinine",
    result_type: "NUMERIC",
    value: "0.95",
    numeric_value: 0.95,
    unit: "mg/dL",
    reference_range: "0.7 - 1.3 mg/dL",
    flag: "NORMAL",
    status: "VERIFIED",
    entered_by_id: "LAB-TECH-1",
    entered_by_name: "Prakash Technician",
    entered_at: "2026-08-20T13:00:00Z",
    verified_by_id: "LAB-PATH-1",
    verified_by_name: "Dr. B. Mohapatra, MD",
    verified_at: "2026-08-20T14:00:00Z",
    version: 1,
  },
];

export const SEEDED_LAB_REPORTS: HealthcareLabReport[] = [
  {
    id: "RPT-1001",
    report_reference: "RPT-1001",
    lab_order_id: "LAB-ORD-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1001",
    ordering_provider_id: "DOC-1001",
    ordering_provider_name: "Dr. Ananya Sharma",
    ordering_provider_role: "Consultant Cardiologist",
    laboratory_id: "LAB-1001",
    laboratory_name: "ABC Diagnostics",
    status: "RELEASED",
    version: 1,
    sample_ids: ["SMP-1001"],
    results: [...SEEDED_TEST_RESULTS],
    notes: "Mild hypercholesterolemia noted. Normal renal profile. Correlate clinically.",
    generated_at: "2026-08-20T14:15:00Z",
    verified_by_id: "LAB-PATH-1",
    verified_by_name: "Dr. B. Mohapatra, MD (Pathology)",
    verified_at: "2026-08-20T14:15:00Z",
    released_at: "2026-08-20T14:30:00Z",
    released_by_id: "LAB-PATH-1",
    released_by_name: "Dr. B. Mohapatra, MD (Pathology)",
    source_type: "MEDORA_CONNECTED_LAB",
    created_at: "2026-08-20T14:15:00Z",
    updated_at: "2026-08-20T14:30:00Z",
  },
];

// ============================================================
// IN-MEMORY / LOCAL STORAGE PERSISTENCE
// ============================================================

let inMemoryOrders: HealthcareLabOrder[] = [...SEEDED_LAB_ORDERS];
let inMemorySamples: HealthcareLabSample[] = [...SEEDED_SAMPLES];
let inMemoryResults: HealthcareTestResult[] = [...SEEDED_TEST_RESULTS];
let inMemoryReports: HealthcareLabReport[] = [...SEEDED_LAB_REPORTS];

const ORDERS_KEY = "medora_lab_orders_v2";
const SAMPLES_KEY = "medora_lab_samples_v2";
const RESULTS_KEY = "medora_lab_results_v2";
const REPORTS_KEY = "medora_lab_reports_v2";

export function resetLaboratoryStore(): void {
  inMemoryOrders = JSON.parse(JSON.stringify(SEEDED_LAB_ORDERS));
  inMemorySamples = JSON.parse(JSON.stringify(SEEDED_SAMPLES));
  inMemoryResults = JSON.parse(JSON.stringify(SEEDED_TEST_RESULTS));
  inMemoryReports = JSON.parse(JSON.stringify(SEEDED_LAB_REPORTS));

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(inMemoryOrders));
      localStorage.setItem(SAMPLES_KEY, JSON.stringify(inMemorySamples));
      localStorage.setItem(RESULTS_KEY, JSON.stringify(inMemoryResults));
      localStorage.setItem(REPORTS_KEY, JSON.stringify(inMemoryReports));
      window.dispatchEvent(new Event("medora-lab-orders-updated"));
    } catch {}
  }
}

// ============================================================
// 1. LAB ORDERS
// ============================================================

export function getAllLabOrders(): HealthcareLabOrder[] {
  if (typeof window === "undefined") {
    return inMemoryOrders;
  }
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(inMemoryOrders));
      return inMemoryOrders;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryOrders;
  } catch {
    return inMemoryOrders;
  }
}

export function saveLabOrders(orders: HealthcareLabOrder[]): void {
  inMemoryOrders = orders;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event("medora-lab-orders-updated"));
  } catch (e) {
    console.error("Failed to save lab orders:", e);
  }
}

export function getLabOrderById(id: string): HealthcareLabOrder | null {
  const all = getAllLabOrders();
  const clean = (id || "").trim();
  return all.find((o) => o.id === clean || o.order_reference === clean) || null;
}

export function getPatientLabOrders(
  patientIdOrIdentifier: string,
  includeDrafts: boolean = false
): HealthcareLabOrder[] {
  const all = getAllLabOrders();
  const cleanId = (patientIdOrIdentifier || "").trim().toUpperCase();

  return all.filter((order) => {
    const match =
      order.patient_id.toUpperCase() === cleanId ||
      order.patient_name.toUpperCase().includes(cleanId);
    if (!match) return false;
    if (!includeDrafts && order.status === "DRAFT") return false;
    return true;
  });
}

export function getDoctorLabOrders(
  doctorIdOrIdentifier: string,
  organizationId?: string
): HealthcareLabOrder[] {
  const all = getAllLabOrders();
  const cleanDoc = (doctorIdOrIdentifier || "").trim().toUpperCase();

  return all.filter((order) => {
    const match =
      order.ordering_provider_id.toUpperCase() === cleanDoc ||
      order.ordering_provider_name.toUpperCase().includes(cleanDoc);
    if (!match) return false;
    if (organizationId && order.organization_id !== organizationId) return false;
    return true;
  });
}

export function getLaboratoryLabOrders(laboratoryId: string): HealthcareLabOrder[] {
  const all = getAllLabOrders();
  const cleanLab = (laboratoryId || "").trim().toUpperCase();
  return all.filter((o) => {
    const isAssigned = (o.laboratory_id || "").toUpperCase() === cleanLab;
    const isSelected = (o.selected_lab_id || "").toUpperCase() === cleanLab;
    return (isAssigned || isSelected) && o.status !== "DRAFT" && o.status !== "CANCELLED";
  });
}

/**
 * Patient assigns an authorized diagnostic laboratory to process the order.
 * Enforces patient authorization & connects the order strictly to the selected laboratory.
 */
export function selectLaboratoryForOrder(params: {
  orderId: string;
  laboratoryId: string;
  laboratoryName: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; order?: HealthcareLabOrder; error?: string } {
  const { orderId, laboratoryId, laboratoryName, actorId, actorName, actorRole } = params;
  const orders = getAllLabOrders();
  const index = orders.findIndex((o) => o.id === orderId.trim() || o.order_reference === orderId.trim());

  if (index === -1) {
    return { success: false, error: `Lab order ${orderId} not found.` };
  }

  const order = orders[index];
  if (actorRole === "patient" && order.patient_id.toUpperCase() !== actorId.trim().toUpperCase()) {
    return { success: false, error: "Access denied. You can only select laboratory for your own orders." };
  }

  const now = new Date().toISOString();
  const updatedOrder: HealthcareLabOrder = {
    ...order,
    laboratory_id: laboratoryId,
    laboratory_name: laboratoryName,
    selected_lab_id: laboratoryId,
    selected_lab_name: laboratoryName,
    lab_selected_at: now,
    status: order.status === "DRAFT" ? "ORDERED" : order.status,
    updated_at: now,
  };

  orders[index] = updatedOrder;
  saveLabOrders(orders);

  appendAuditEvent(
    "LABORATORY_SELECTED",
    actorId,
    actorName,
    actorRole,
    `Patient selected laboratory ${laboratoryName} (${laboratoryId}) for order ${order.id}`,
    order.patient_id,
    order.organization_id,
    order.organization_name,
    order.id,
    { laboratoryId, laboratoryName, selectedAt: now }
  );

  return { success: true, order: updatedOrder };
}

// ============================================================
// 2. LAB SAMPLES
// ============================================================

export function getAllSamples(): HealthcareLabSample[] {
  if (typeof window === "undefined") {
    return inMemorySamples;
  }
  try {
    const raw = localStorage.getItem(SAMPLES_KEY);
    if (!raw) {
      localStorage.setItem(SAMPLES_KEY, JSON.stringify(inMemorySamples));
      return inMemorySamples;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemorySamples;
  } catch {
    return inMemorySamples;
  }
}

export function saveSamples(samples: HealthcareLabSample[]): void {
  inMemorySamples = samples;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAMPLES_KEY, JSON.stringify(samples));
    window.dispatchEvent(new Event("medora-lab-samples-updated"));
  } catch (e) {
    console.error("Failed to save samples:", e);
  }
}

export function getSampleById(sampleId: string): HealthcareLabSample | null {
  const all = getAllSamples();
  const clean = (sampleId || "").trim();
  return all.find((s) => s.id === clean || s.sample_barcode === clean) || null;
}

export function getOrderSamples(orderId: string): HealthcareLabSample[] {
  const all = getAllSamples();
  const clean = (orderId || "").trim();
  return all.filter((s) => s.lab_order_id === clean);
}

export function getPatientSamples(patientId: string): HealthcareLabSample[] {
  const all = getAllSamples();
  const clean = (patientId || "").trim().toUpperCase();
  return all.filter((s) => s.patient_id.toUpperCase() === clean);
}

// ============================================================
// 3. TEST RESULTS
// ============================================================

export function getAllTestResults(): HealthcareTestResult[] {
  if (typeof window === "undefined") {
    return inMemoryResults;
  }
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    if (!raw) {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(inMemoryResults));
      return inMemoryResults;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryResults;
  } catch {
    return inMemoryResults;
  }
}

export function saveTestResults(results: HealthcareTestResult[]): void {
  inMemoryResults = results;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    window.dispatchEvent(new Event("medora-lab-results-updated"));
  } catch (e) {
    console.error("Failed to save test results:", e);
  }
}

export function getResultById(id: string): HealthcareTestResult | null {
  const all = getAllTestResults();
  const clean = (id || "").trim();
  return all.find((r) => r.id === clean) || null;
}

export function getOrderTestResults(orderId: string): HealthcareTestResult[] {
  const all = getAllTestResults();
  const clean = (orderId || "").trim();
  return all.filter((r) => r.lab_order_id === clean);
}

// ============================================================
// 4. LAB REPORTS
// ============================================================

export function getAllLabReports(): HealthcareLabReport[] {
  if (typeof window === "undefined") {
    return inMemoryReports;
  }
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(inMemoryReports));
      return inMemoryReports;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryReports;
  } catch {
    return inMemoryReports;
  }
}

export function saveLabReports(reports: HealthcareLabReport[]): void {
  inMemoryReports = reports;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    window.dispatchEvent(new Event("medora-lab-reports-updated"));
  } catch (e) {
    console.error("Failed to save lab reports:", e);
  }
}

export function getLabReportById(reportId: string): HealthcareLabReport | null {
  const all = getAllLabReports();
  const clean = (reportId || "").trim();
  return all.find((r) => r.id === clean || r.report_reference === clean) || null;
}

export function getPatientLabReports(
  patientIdOrIdentifier: string,
  includeDrafts: boolean = false
): HealthcareLabReport[] {
  const all = getAllLabReports();
  const cleanId = (patientIdOrIdentifier || "").trim().toUpperCase();

  return all.filter((report) => {
    const match =
      report.patient_id.toUpperCase() === cleanId ||
      report.patient_name.toUpperCase().includes(cleanId);
    if (!match) return false;
    if (!includeDrafts && report.status !== "RELEASED" && report.status !== "AMENDED") return false;
    return true;
  });
}

export function getEncounterLabReports(encounterId: string): HealthcareLabReport[] {
  const all = getAllLabReports();
  const clean = (encounterId || "").trim();
  return all.filter((r) => r.encounter_id === clean);
}

export function getEncounterLabOrders(encounterId: string): HealthcareLabOrder[] {
  const all = getAllLabOrders();
  const clean = (encounterId || "").trim();
  return all.filter((o) => o.encounter_id === clean);
}

export function getAssignedLabOrders(laboratoryId: string): HealthcareLabOrder[] {
  return getLaboratoryLabOrders(laboratoryId);
}

/**
 * Saves or updates a DRAFT lab order for an encounter.
 */
export function saveLabOrderDraft(params: {
  orderId?: string;
  encounterId: string;
  patientId?: string;
  patientName?: string;
  items: LabOrderItem[];
  priority?: LabOrderPriority;
  reason?: string;
  instructions?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; order?: HealthcareLabOrder; error?: string } {
  const orders = getAllLabOrders();
  const encounter = getEncounterById(params.encounterId);
  if (!encounter) {
    return { success: false, error: "Healthcare Encounter not found." };
  }

  const now = new Date().toISOString();
  let existingIndex = -1;

  if (params.orderId) {
    existingIndex = orders.findIndex((o) => o.id === params.orderId);
  } else {
    // Check if there is a finalized order for this encounter
    const finalized = orders.find((o) => o.encounter_id === params.encounterId && o.status === "FINALIZED");
    if (finalized) {
      return { success: false, error: `Lab order ${finalized.id} for this encounter is FINALIZED and locked against ordinary draft edits.` };
    }
    existingIndex = orders.findIndex((o) => o.encounter_id === params.encounterId && o.status === "DRAFT");
  }

  if (existingIndex >= 0) {
    const existing = orders[existingIndex];
    if (existing.status === "FINALIZED" || existing.status === "CANCELLED") {
      return { success: false, error: `Lab order ${existing.id} is ${existing.status} and cannot be modified as a draft.` };
    }

    const updatedOrder: HealthcareLabOrder = {
      ...existing,
      items: params.items,
      priority: params.priority || existing.priority,
      reason: params.reason || existing.reason,
      instructions: params.instructions !== undefined ? params.instructions : existing.instructions,
      updated_at: now,
    };
    orders[existingIndex] = updatedOrder;
    saveLabOrders(orders);

    return { success: true, order: updatedOrder };
  }

  const newId = `LAB-ORD-${1000 + orders.length + 1}`;
  const newOrder: HealthcareLabOrder = {
    id: newId,
    order_reference: newId,
    patient_id: encounter.patient_id,
    patient_name: encounter.patient_name,
    encounter_id: params.encounterId,
    ordering_provider_id: params.actorId,
    ordering_provider_name: params.actorName,
    ordering_provider_role: params.actorRole,
    organization_id: encounter.organization_id,
    organization_name: encounter.organization_name,
    facility_id: encounter.facility_id,
    facility_name: encounter.facility_name,
    priority: params.priority || "ROUTINE",
    reason: params.reason || "Diagnostic evaluation",
    instructions: params.instructions || "",
    status: "DRAFT",
    items: params.items,
    created_at: now,
    updated_at: now,
  };

  orders.push(newOrder);
  saveLabOrders(orders);

  return { success: true, order: newOrder };
}

export function placeLabOrder(
  arg1: any,
  arg2?: any
): { success: boolean; order?: HealthcareLabOrder; error?: string } {
  const orders = getAllLabOrders();

  if (typeof arg1 === "string") {
    const orderIndex = orders.findIndex((o) => o.id === arg1.trim());
    if (orderIndex === -1) {
      return { success: false, error: `Lab order ${arg1} not found.` };
    }

    const order = orders[orderIndex];
    const now = new Date().toISOString();
    const updatedOrder: HealthcareLabOrder = {
      ...order,
      status: "ORDERED",
      ordered_at: now,
      updated_at: now,
    };

    orders[orderIndex] = updatedOrder;
    saveLabOrders(orders);
    return { success: true, order: updatedOrder };
  }

  const params = arg1;
  if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
    return { success: false, error: "Lab order must contain at least 1 test item." };
  }

  if (!params.reason || !params.reason.trim()) {
    return { success: false, error: "Clinical reason / indication is mandatory." };
  }

  const encounter = getEncounterById(params.encounterId);
  const newId = `LAB-ORD-${1000 + orders.length + 1}`;
  const now = new Date().toISOString();

  const newOrder: HealthcareLabOrder = {
    id: newId,
    order_reference: newId,
    patient_id: params.patientId || encounter?.patient_id || "PAT-1002",
    patient_name: params.patientName || encounter?.patient_name || "Priya Sharma",
    encounter_id: params.encounterId,
    appointment_id: params.appointmentId || encounter?.appointment_id,
    ordering_provider_id: params.actorId || (encounter as any)?.attending_doctor_id || "DOC-1001",
    ordering_provider_name: params.actorName || (encounter as any)?.attending_doctor_name || "Dr. Ananya Sharma",
    ordering_provider_role: params.actorRole || "doctor",
    organization_id: params.organizationId || encounter?.organization_id || "HSP-1001",
    organization_name: params.organizationName || encounter?.organization_name || "City Hospital",
    laboratory_id: params.laboratoryId,
    laboratory_name: params.laboratoryName,
    priority: params.priority || "ROUTINE",
    reason: params.reason,
    instructions: params.instructions,
    status: "ORDERED",
    items: params.items,
    ordered_at: now,
    created_at: now,
    updated_at: now,
  };

  orders.push(newOrder);
  saveLabOrders(orders);

  appendAuditEvent(
    "LAB_ORDER_ORDERED",
    params.actorId || "DOC-1001",
    params.actorName || "Dr. Ananya Sharma",
    params.actorRole || "doctor",
    `Placed diagnostic lab order ${newId} for patient ${newOrder.patient_name}`,
    newOrder.patient_id,
    newOrder.organization_id,
    newOrder.organization_name,
    newId
  );

  return { success: true, order: newOrder };
}

export function cancelLabOrder(
  orderId: string,
  reason: string,
  actorId: string = "DOC-1001",
  actorName: string = "Dr. Ananya Sharma",
  actorRole: string = "doctor"
): { success: boolean; order?: HealthcareLabOrder; error?: string } {
  const orders = getAllLabOrders();
  const orderIndex = orders.findIndex((o) => o.id === orderId.trim());
  if (orderIndex === -1) {
    return { success: false, error: `Lab order ${orderId} not found.` };
  }

  const order = orders[orderIndex];

  // Authorization guard: Doctor B cannot cancel Doctor A's lab order
  if (actorRole === "doctor" && actorId && order.ordering_provider_id && actorId.toLowerCase() !== order.ordering_provider_id.toLowerCase()) {
    return { success: false, error: "Only the ordering doctor can cancel this laboratory order." };
  }

  const now = new Date().toISOString();
  const updatedOrder: HealthcareLabOrder = {
    ...order,
    status: "CANCELLED",
    cancelled_at: now,
    cancellation_reason: reason,
    updated_at: now,
  };

  orders[orderIndex] = updatedOrder;
  saveLabOrders(orders);

  appendAuditEvent(
    "LAB_ORDER_CANCELLED",
    actorId,
    actorName,
    actorRole,
    `Cancelled diagnostic lab order ${order.id}: ${reason}`,
    order.patient_id,
    order.organization_id,
    order.organization_name,
    order.id
  );

  return { success: true, order: updatedOrder };
}

/**
 * Authoritatively finalizes a digital lab order.
 * Transitions status to FINALIZED, locks edits, and generates verification metadata.
 */
export function finalizeLabOrder(params: {
  orderId?: string;
  encounterId: string;
  items: LabOrderItem[];
  priority?: LabOrderPriority;
  reason: string;
  instructions?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; order?: HealthcareLabOrder; phase8_handoff_event?: any; error?: string } {
  const orders = getAllLabOrders();
  const encounter = getEncounterById(params.encounterId);
  if (!encounter) {
    return { success: false, error: "Healthcare Encounter not found." };
  }

  if (!params.items || params.items.length === 0) {
    return { success: false, error: "Lab order must contain at least 1 test item." };
  }

  if (!params.reason || !params.reason.trim()) {
    return { success: false, error: "Clinical reason / indication is mandatory." };
  }

  const now = new Date().toISOString();
  let existingIndex = -1;

  if (params.orderId) {
    existingIndex = orders.findIndex((o) => o.id === params.orderId);
  } else {
    existingIndex = orders.findIndex((o) => o.encounter_id === params.encounterId && o.status === "DRAFT");
  }

  const orderId = existingIndex >= 0 ? orders[existingIndex].id : `LAB-ORD-${1000 + orders.length + 1}`;

  const finalizedOrder: HealthcareLabOrder = {
    id: orderId,
    order_reference: orderId,
    patient_id: encounter.patient_id,
    patient_name: encounter.patient_name,
    encounter_id: params.encounterId,
    ordering_provider_id: params.actorId,
    ordering_provider_name: params.actorName,
    ordering_provider_role: params.actorRole,
    organization_id: encounter.organization_id,
    organization_name: encounter.organization_name,
    facility_id: encounter.facility_id,
    facility_name: encounter.facility_name,
    priority: params.priority || "ROUTINE",
    reason: params.reason.trim(),
    instructions: params.instructions || "",
    status: "FINALIZED",
    items: params.items,
    ordered_at: now,
    created_at: existingIndex >= 0 ? orders[existingIndex].created_at : now,
    updated_at: now,
  };

  if (existingIndex >= 0) {
    orders[existingIndex] = finalizedOrder;
  } else {
    orders.push(finalizedOrder);
  }

  saveLabOrders(orders);

  appendAuditEvent(
    "LAB_ORDER_FINALIZED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Finalized diagnostic lab order ${orderId} for patient ${finalizedOrder.patient_name}`,
    finalizedOrder.patient_id,
    finalizedOrder.organization_id,
    finalizedOrder.organization_name,
    orderId
  );

  const phase8HandoffEvent = {
    event_type: "LAB_ORDER_FINALIZED",
    idempotency_key: `HANDSHAKE-LAB-${finalizedOrder.id}`,
    timestamp: now,
    order: {
      id: finalizedOrder.id,
      patient_id: finalizedOrder.patient_id,
      patient_name: finalizedOrder.patient_name,
      encounter_id: finalizedOrder.encounter_id,
      ordering_provider_id: finalizedOrder.ordering_provider_id,
      ordering_provider_name: finalizedOrder.ordering_provider_name,
      organization_id: finalizedOrder.organization_id,
      facility_id: finalizedOrder.facility_id,
      priority: finalizedOrder.priority,
      reason: finalizedOrder.reason,
      items: finalizedOrder.items,
    },
  };

  return { success: true, order: finalizedOrder, phase8_handoff_event: phase8HandoffEvent };
}

/**
 * Accepts a finalized laboratory order for operational processing in Phase 8.1.
 */
export function acceptLabOrder(params: {
  orderId: string;
  facilityId: string;
  facilityName: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; order?: HealthcareLabOrder; error?: string } {
  const orders = getAllLabOrders();
  const index = orders.findIndex((o) => o.id.toLowerCase() === params.orderId.trim().toLowerCase());
  if (index === -1) return { success: false, error: `Lab order ${params.orderId} not found.` };

  const existing = orders[index];
  if (existing.status === "CANCELLED") {
    return { success: false, error: `Cannot accept lab order ${existing.id} because it has been CANCELLED by the clinician.` };
  }

  if (existing.status === "ACCEPTED") {
    // Idempotent double-click protection
    return { success: true, order: existing };
  }

  const now = new Date().toISOString();
  const updatedOrder: HealthcareLabOrder = {
    ...existing,
    status: "ACCEPTED",
    accepted_at: now,
    laboratory_id: params.facilityId,
    laboratory_name: params.facilityName,
    updated_at: now,
  };

  orders[index] = updatedOrder;
  saveLabOrders(orders);

  appendAuditEvent(
    "LAB_ORDER_ACCEPTED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Laboratory facility ${params.facilityName} accepted order ${existing.id} for patient ${existing.patient_name}`,
    existing.patient_id,
    existing.organization_id,
    existing.organization_name,
    existing.id
  );

  return { success: true, order: updatedOrder };
}

/**
 * Marks a laboratory order as UNABLE_TO_PROCESS with mandatory documented reason.
 */
export function rejectLabOrderUnprocessable(params: {
  orderId: string;
  reasonCategory: string;
  explanation?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; order?: HealthcareLabOrder; error?: string } {
  const orders = getAllLabOrders();
  const index = orders.findIndex((o) => o.id.toLowerCase() === params.orderId.trim().toLowerCase());
  if (index === -1) return { success: false, error: `Lab order ${params.orderId} not found.` };

  const existing = orders[index];
  if (!params.reasonCategory || !params.reasonCategory.trim()) {
    return { success: false, error: "Reason category is required to mark an order unable to process." };
  }

  const now = new Date().toISOString();
  const fullReason = `${params.reasonCategory}${params.explanation ? `: ${params.explanation.trim()}` : ""}`;

  const updatedOrder: HealthcareLabOrder = {
    ...existing,
    status: "REJECTED",
    rejected_at: now,
    rejection_reason: fullReason,
    updated_at: now,
  };

  orders[index] = updatedOrder;
  saveLabOrders(orders);

  appendAuditEvent(
    "LAB_ORDER_UNABLE_TO_PROCESS",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Marked lab order ${existing.id} as unable to process: ${fullReason}`,
    existing.patient_id,
    existing.id
  );

  return { success: true, order: updatedOrder };
}

// Memory Stores for Phase 8.4 Verification Tokens & Shares
let REPORT_TOKENS_STORE: any[] = [];
let REPORT_SHARES_STORE: any[] = [];

export function getReportVerificationToken(tokenString: string): any | null {
  const clean = (tokenString || "").trim().toUpperCase();
  return REPORT_TOKENS_STORE.find((t) => t.verification_token.toUpperCase() === clean) || null;
}

export function createReportVerificationToken(reportId: string, version: number): any {
  const existing = REPORT_TOKENS_STORE.find((t) => t.report_id === reportId && t.report_version === version);
  if (existing) return existing;

  const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  const tokenString = `RPT-VERIFY-${randPart}`;
  const newToken = {
    id: `RPT-TOK-${1000 + REPORT_TOKENS_STORE.length + 1}`,
    report_id: reportId,
    report_version: version,
    verification_token: tokenString,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  };

  REPORT_TOKENS_STORE.push(newToken);
  return newToken;
}

export function shareLabReport(params: {
  reportId: string;
  reportVersion: number;
  ownerId: string;
  ownerName: string;
  recipientId: string;
  recipientName: string;
  permission: "VIEW" | "DOWNLOAD";
  durationHours: number;
}): any {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + params.durationHours * 60 * 60 * 1000).toISOString();

  const share = {
    id: `RPT-SHARE-${1000 + REPORT_SHARES_STORE.length + 1}`,
    report_id: params.reportId,
    report_version: params.reportVersion,
    owner_id: params.ownerId,
    owner_name: params.ownerName,
    recipient_id: params.recipientId,
    recipient_name: params.recipientName,
    permission: params.permission,
    expires_at: expiresAt,
    status: "ACTIVE",
    created_at: now.toISOString(),
  };

  REPORT_SHARES_STORE.push(share);
  return share;
}

export function getReportSharesForPatient(patientId: string): any[] {
  const clean = (patientId || "").trim().toLowerCase();
  return REPORT_SHARES_STORE.filter((s) => s.owner_id.toLowerCase() === clean);
}

export function revokeReportShare(shareId: string, ownerId: string): { success: boolean; error?: string } {
  const share = REPORT_SHARES_STORE.find((s) => s.id.toLowerCase() === shareId.trim().toLowerCase());
  if (!share) return { success: false, error: "Share record not found." };

  if (share.owner_id.toLowerCase() !== ownerId.trim().toLowerCase()) {
    return { success: false, error: "Access denied. Only the report owner can revoke access." };
  }

  share.status = "REVOKED";
  share.revoked_at = new Date().toISOString();
  return { success: true };
}

