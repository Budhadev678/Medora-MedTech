// ============================================================
// MEDORA — LABORATORY TESTING & WORKLIST REPOSITORY (PHASE 8.3)
// Authoritative Test Work Item Engine & Testing State Machine Store
// ============================================================

import type {
  LabTestWorkItem,
  LabTestWorkStatus,
  LabOrderPriority,
  SampleType,
} from "@/types/database.types";
import { getSampleById } from "@/lib/data/lab-sample-store";
import { getLabOrderById } from "@/lib/data/lab-order-store";
import { appendAuditEvent } from "@/lib/data/audit-store";

let WORK_ITEMS_STORE: LabTestWorkItem[] = [
  {
    id: "TEST-WORK-1001",
    lab_order_id: "LAB-ORD-1001",
    lab_order_item_id: "LOI-CBC-01",
    sample_id: "SMP-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    test_id: "TEST-CBC-001",
    test_code: "CBC-01",
    test_name: "Complete Blood Count (CBC)",
    specimen_type: "WHOLE_BLOOD",
    facility_id: "LAB-FAC-1001",
    facility_name: "ABC Diagnostics — Rourkela Central Lab",
    priority: "ROUTINE",
    status: "READY_FOR_TESTING" as any, // Map to QUEUED
    assigned_to_id: "USR-1005",
    assigned_to_name: "Technician Rahul",
    assigned_at: "2026-08-20T10:50:00Z",
    started_at: "2026-08-20T10:55:00Z",
    started_by_id: "USR-1005",
    started_by_name: "Technician Rahul",
    created_at: "2026-08-20T10:50:00Z",
    updated_at: "2026-08-20T10:55:00Z",
  },
];

export function getAllTestWorkItems(): LabTestWorkItem[] {
  return [...WORK_ITEMS_STORE];
}

export function getTestWorkItemById(id: string): LabTestWorkItem | null {
  const clean = (id || "").trim().toLowerCase();
  return WORK_ITEMS_STORE.find((w) => w.id.toLowerCase() === clean) || null;
}

export function getWorkItemsBySample(sampleId: string): LabTestWorkItem[] {
  const clean = (sampleId || "").trim().toLowerCase();
  return WORK_ITEMS_STORE.filter((w) => w.sample_id.toLowerCase() === clean);
}

export function getWorkItemsByOrder(orderId: string): LabTestWorkItem[] {
  const clean = (orderId || "").trim().toLowerCase();
  return WORK_ITEMS_STORE.filter((w) => w.lab_order_id.toLowerCase() === clean);
}

export function getFacilityWorklist(facilityId: string, filterStatus?: string): LabTestWorkItem[] {
  const cleanFac = (facilityId || "").trim().toLowerCase();
  return WORK_ITEMS_STORE.filter((w) => {
    if (w.facility_id.toLowerCase() !== cleanFac) return false;
    if (filterStatus) {
      const cleanFilter = filterStatus.trim().toUpperCase();
      if (cleanFilter === "UNASSIGNED" && w.assigned_to_id) return false;
      if (cleanFilter === "IN_PROGRESS" && w.status !== "IN_PROGRESS") return false;
      if (cleanFilter === "AWAITING_REVIEW" && w.status !== "RESULT_ENTERED" && w.status !== "UNDER_REVIEW") return false;
      if (cleanFilter === "RETURNED" && w.status !== "RETURNED_FOR_CORRECTION") return false;
      if (cleanFilter === "VERIFIED" && w.status !== "VERIFIED") return false;
    }
    return true;
  });
}

/**
 * Creates an authoritative TestWorkItem for a ready specimen.
 */
export function createTestWorkItem(params: {
  labOrderId: string;
  labOrderItemId: string;
  sampleId: string;
  testId: string;
  testCode?: string;
  testName: string;
  specimenType: SampleType;
  facilityId: string;
  facilityName: string;
  priority?: LabOrderPriority;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; workItem?: LabTestWorkItem; error?: string } {
  const sample = getSampleById(params.sampleId);
  if (!sample) return { success: false, error: `Sample ${params.sampleId} not found.` };

  if (sample.status !== "READY_FOR_TESTING" && sample.status !== "COLLECTED" && sample.status !== "SAMPLE_RECEIVED") {
    return { success: false, error: `Cannot create test work item. Sample is in status ${sample.status}, must be READY_FOR_TESTING.` };
  }

  const order = getLabOrderById(params.labOrderId);
  if (!order) return { success: false, error: `Lab order ${params.labOrderId} not found.` };

  // Check for existing work item for same sample & test item
  const existing = WORK_ITEMS_STORE.find(
    (w) => w.sample_id.toLowerCase() === params.sampleId.toLowerCase() && w.lab_order_item_id.toLowerCase() === params.labOrderItemId.toLowerCase()
  );

  if (existing) {
    return { success: true, workItem: existing };
  }

  const now = new Date().toISOString();
  const nextNum = 1000 + WORK_ITEMS_STORE.length + 1;
  const newWorkItem: LabTestWorkItem = {
    id: `TEST-WORK-${nextNum}`,
    lab_order_id: params.labOrderId,
    lab_order_item_id: params.labOrderItemId,
    sample_id: params.sampleId,
    patient_id: order.patient_id,
    patient_name: order.patient_name,
    test_id: params.testId,
    test_code: params.testCode,
    test_name: params.testName,
    specimen_type: params.specimenType,
    facility_id: params.facilityId,
    facility_name: params.facilityName,
    priority: params.priority || order.priority || "ROUTINE",
    status: "QUEUED",
    created_at: now,
    updated_at: now,
  };

  WORK_ITEMS_STORE.push(newWorkItem);

  appendAuditEvent(
    "TEST_ASSIGNED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Created test work item ${newWorkItem.id} (${params.testName}) for sample ${params.sampleId}`,
    order.patient_id,
    order.organization_id,
    order.organization_name,
    newWorkItem.id
  );

  return { success: true, workItem: newWorkItem };
}

/**
 * Assigns a technician to a test work item.
 */
export function assignTestWorkItem(params: {
  workItemId: string;
  technicianId: string;
  technicianName: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; workItem?: LabTestWorkItem; error?: string } {
  const index = WORK_ITEMS_STORE.findIndex((w) => w.id.toLowerCase() === params.workItemId.trim().toLowerCase());
  if (index === -1) return { success: false, error: `Test work item ${params.workItemId} not found.` };

  const existing = WORK_ITEMS_STORE[index];
  const now = new Date().toISOString();

  const updated: LabTestWorkItem = {
    ...existing,
    assigned_to_id: params.technicianId,
    assigned_to_name: params.technicianName,
    assigned_at: now,
    updated_at: now,
  };

  WORK_ITEMS_STORE[index] = updated;
  return { success: true, workItem: updated };
}

/**
 * Starts processing a test work item (QUEUED -> IN_PROGRESS).
 */
export function startTestProcessing(params: {
  workItemId: string;
  instrumentName?: string;
  method?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; workItem?: LabTestWorkItem; error?: string } {
  const index = WORK_ITEMS_STORE.findIndex((w) => w.id.toLowerCase() === params.workItemId.trim().toLowerCase());
  if (index === -1) return { success: false, error: `Test work item ${params.workItemId} not found.` };

  const existing = WORK_ITEMS_STORE[index];

  // Idempotent start check
  if (existing.status === "IN_PROGRESS") {
    return { success: true, workItem: existing };
  }

  if (existing.status === "VERIFIED" || existing.status === "REJECTED") {
    return { success: false, error: `Cannot start testing on work item in terminal status ${existing.status}.` };
  }

  const now = new Date().toISOString();
  const updated: LabTestWorkItem = {
    ...existing,
    status: "IN_PROGRESS",
    started_at: existing.started_at || now,
    started_by_id: params.actorId,
    started_by_name: params.actorName,
    assigned_to_id: existing.assigned_to_id || params.actorId,
    assigned_to_name: existing.assigned_to_name || params.actorName,
    instrument_name: params.instrumentName || existing.instrument_name,
    method: params.method || existing.method,
    updated_at: now,
  };

  WORK_ITEMS_STORE[index] = updated;

  appendAuditEvent(
    "TEST_STARTED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Started testing processing for ${existing.id} (${existing.test_name})`,
    existing.patient_id,
    existing.facility_id,
    existing.facility_name,
    existing.id
  );

  return { success: true, workItem: updated };
}

/**
 * Updates status of a test work item in state machine.
 */
export function updateTestWorkStatus(
  workItemId: string,
  newStatus: LabTestWorkStatus,
  returnReason?: string
): { success: boolean; workItem?: LabTestWorkItem; error?: string } {
  const index = WORK_ITEMS_STORE.findIndex((w) => w.id.toLowerCase() === workItemId.trim().toLowerCase());
  if (index === -1) return { success: false, error: `Test work item ${workItemId} not found.` };

  const existing = WORK_ITEMS_STORE[index];
  const now = new Date().toISOString();

  const updated: LabTestWorkItem = {
    ...existing,
    status: newStatus,
    return_reason: returnReason || existing.return_reason,
    completed_at: newStatus === "VERIFIED" ? now : existing.completed_at,
    updated_at: now,
  };

  WORK_ITEMS_STORE[index] = updated;
  return { success: true, workItem: updated };
}
