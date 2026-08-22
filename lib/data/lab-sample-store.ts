// ============================================================
// MEDORA — LABORATORY SPECIMEN & CHAIN OF CUSTODY REPOSITORY (PHASE 8.2)
// Authoritative Sample Collection, Barcode & Chain of Custody Store
// ============================================================

import type {
  HealthcareLabSample,
  SampleCustodyEvent,
  CustodyEventType,
  SampleStatus,
  SampleType,
  SampleRejectionReason,
  PatientVerificationRecord,
} from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { getLabOrderById } from "@/lib/data/lab-order-store";

let SAMPLES_MEMORY_STORE: HealthcareLabSample[] = [
  {
    id: "SMP-1001",
    sample_barcode: "SMP-1001",
    lab_order_id: "LAB-ORD-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    laboratory_id: "LAB-FAC-1001",
    laboratory_name: "ABC Diagnostics — Rourkela Central Lab",
    sample_type: "WHOLE_BLOOD",
    status: "READY_FOR_TESTING",
    test_item_ids: ["LOI-CBC-01"],
    test_names: ["Complete Blood Count (CBC)"],
    collected_at: "2026-08-20T10:45:00Z",
    collected_by_id: "USR-1005",
    collected_by_name: "Technician Rahul",
    received_at: "2026-08-20T10:50:00Z",
    received_by_id: "USR-1005",
    received_by_name: "Technician Rahul",
    created_at: "2026-08-20T10:45:00Z",
    updated_at: "2026-08-20T10:50:00Z",
  },
];

let CUSTODY_EVENTS_STORE: SampleCustodyEvent[] = [
  {
    id: "CUST-1001",
    sample_id: "SMP-1001",
    lab_order_id: "LAB-ORD-1001",
    event_type: "SAMPLE_CREATED",
    actor_id: "USR-1005",
    actor_name: "Technician Rahul",
    actor_role: "LAB_TECHNICIAN",
    source_location: "Collection Room 1",
    timestamp: "2026-08-20T10:45:00Z",
  },
  {
    id: "CUST-1002",
    sample_id: "SMP-1001",
    lab_order_id: "LAB-ORD-1001",
    event_type: "SAMPLE_COLLECTED",
    actor_id: "USR-1005",
    actor_name: "Technician Rahul",
    actor_role: "LAB_TECHNICIAN",
    source_location: "Collection Room 1",
    timestamp: "2026-08-20T10:45:00Z",
  },
  {
    id: "CUST-1003",
    sample_id: "SMP-1001",
    lab_order_id: "LAB-ORD-1001",
    event_type: "SAMPLE_READY_FOR_TESTING",
    actor_id: "USR-1005",
    actor_name: "Technician Rahul",
    actor_role: "LAB_TECHNICIAN",
    destination_location: "Hematology Bench 2",
    timestamp: "2026-08-20T10:50:00Z",
  },
];

let PATIENT_VERIFICATIONS_STORE: PatientVerificationRecord[] = [];

export function getAllSamples(): HealthcareLabSample[] {
  return [...SAMPLES_MEMORY_STORE];
}

export function getSampleById(sampleId: string): HealthcareLabSample | null {
  const clean = (sampleId || "").trim().toLowerCase();
  return SAMPLES_MEMORY_STORE.find((s) => s.id.toLowerCase() === clean || s.sample_barcode.toLowerCase() === clean) || null;
}

export function getOrderSamples(labOrderId: string): HealthcareLabSample[] {
  const clean = (labOrderId || "").trim().toLowerCase();
  return SAMPLES_MEMORY_STORE.filter((s) => s.lab_order_id.toLowerCase() === clean);
}

export function getPatientSamples(patientId: string): HealthcareLabSample[] {
  const clean = (patientId || "").trim().toLowerCase();
  return SAMPLES_MEMORY_STORE.filter((s) => s.patient_id.toLowerCase() === clean);
}

export function getSampleCustodyEvents(sampleId: string): SampleCustodyEvent[] {
  const clean = (sampleId || "").trim().toLowerCase();
  return CUSTODY_EVENTS_STORE.filter((e) => e.sample_id.toLowerCase() === clean);
}

export function recordPatientVerification(params: {
  patientId: string;
  patientName: string;
  orderId: string;
  verifiedById: string;
  verifiedByName: string;
  verificationMethods: string[];
}): PatientVerificationRecord {
  const now = new Date().toISOString();
  const record: PatientVerificationRecord = {
    id: `PVR-${1000 + PATIENT_VERIFICATIONS_STORE.length + 1}`,
    patient_id: params.patientId,
    patient_name: params.patientName,
    order_id: params.orderId,
    verified_by_id: params.verifiedById,
    verified_by_name: params.verifiedByName,
    verification_methods: params.verificationMethods,
    status: "VERIFIED",
    verified_at: now,
  };

  PATIENT_VERIFICATIONS_STORE.push(record);
  return record;
}

export function createSample(params: {
  labOrderId: string;
  sampleType: SampleType;
  testItemIds: string[];
  testNames: string[];
  collectorId: string;
  collectorName: string;
  collectorRole: string;
  facilityId: string;
  facilityName: string;
  location?: string;
  isRecollection?: boolean;
  previousSampleId?: string;
}): { success: boolean; sample?: HealthcareLabSample; error?: string } {
  const order = getLabOrderById(params.labOrderId);
  if (!order) return { success: false, error: `Lab order ${params.labOrderId} not found.` };

  if (order.status !== "ACCEPTED" && order.status !== "ORDERED" && order.status !== "FINALIZED") {
    return { success: false, error: `Cannot collect sample for lab order in status ${order.status}. Order must be ACCEPTED.` };
  }

  // Check if sample already collected for these exact test items
  const existingSamples = getOrderSamples(params.labOrderId);
  const activeDuplicate = existingSamples.find(
    (s) =>
      s.status !== "REJECTED" &&
      s.sample_type === params.sampleType &&
      s.test_item_ids.some((tid) => params.testItemIds.includes(tid))
  );

  if (activeDuplicate && !params.isRecollection) {
    return { success: true, sample: activeDuplicate };
  }

  const now = new Date().toISOString();
  const nextNum = SAMPLES_MEMORY_STORE.length + 1001;
  const newSampleId = `SMP-${nextNum}`;

  const newSample: HealthcareLabSample = {
    id: newSampleId,
    sample_barcode: newSampleId,
    lab_order_id: params.labOrderId,
    patient_id: order.patient_id,
    patient_name: order.patient_name,
    laboratory_id: params.facilityId,
    laboratory_name: params.facilityName,
    sample_type: params.sampleType,
    status: "COLLECTED",
    test_item_ids: params.testItemIds,
    test_names: params.testNames,
    collected_at: now,
    collected_by_id: params.collectorId,
    collected_by_name: params.collectorName,
    is_recollection: Boolean(params.isRecollection),
    previous_sample_id: params.previousSampleId,
    created_at: now,
    updated_at: now,
  };

  SAMPLES_MEMORY_STORE.push(newSample);

  // Record Custody Events
  recordCustodyEvent({
    sampleId: newSampleId,
    labOrderId: params.labOrderId,
    eventType: "SAMPLE_CREATED",
    actorId: params.collectorId,
    actorName: params.collectorName,
    actorRole: params.collectorRole,
    sourceLocation: params.location || "Collection Desk",
  });

  recordCustodyEvent({
    sampleId: newSampleId,
    labOrderId: params.labOrderId,
    eventType: "SAMPLE_COLLECTED",
    actorId: params.collectorId,
    actorName: params.collectorName,
    actorRole: params.collectorRole,
    sourceLocation: params.location || "Collection Desk",
  });

  appendAuditEvent(
    "LAB_SAMPLE_COLLECT",
    params.collectorId,
    params.collectorName,
    params.collectorRole,
    `Collected specimen ${newSampleId} (${params.sampleType}) for patient ${order.patient_name}`,
    order.patient_id,
    order.organization_id,
    order.organization_name,
    newSampleId
  );

  return { success: true, sample: newSample };
}

export function recordCustodyEvent(params: {
  sampleId: string;
  labOrderId: string;
  eventType: CustodyEventType;
  actorId: string;
  actorName: string;
  actorRole: string;
  sourceLocation?: string;
  destinationLocation?: string;
  notes?: string;
}): SampleCustodyEvent {
  const now = new Date().toISOString();
  const event: SampleCustodyEvent = {
    id: `CUST-${1000 + CUSTODY_EVENTS_STORE.length + 1}`,
    sample_id: params.sampleId,
    lab_order_id: params.labOrderId,
    event_type: params.eventType,
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    source_location: params.sourceLocation,
    destination_location: params.destinationLocation,
    notes: params.notes,
    timestamp: now,
  };

  CUSTODY_EVENTS_STORE.push(event);

  // Update sample status if applicable
  const sample = getSampleById(params.sampleId);
  if (sample) {
    if (params.eventType === "SAMPLE_READY_FOR_TESTING") sample.status = "READY_FOR_TESTING";
    else if (params.eventType === "SAMPLE_RECEIVED") sample.status = "SAMPLE_RECEIVED";
    else if (params.eventType === "SAMPLE_REJECTED") sample.status = "REJECTED";
    sample.updated_at = now;
  }

  return event;
}

export function rejectSample(params: {
  sampleId: string;
  reason: SampleRejectionReason;
  notes?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; sample?: HealthcareLabSample; error?: string } {
  const sampleIndex = SAMPLES_MEMORY_STORE.findIndex((s) => s.id.toLowerCase() === params.sampleId.trim().toLowerCase());
  if (sampleIndex === -1) return { success: false, error: `Sample ${params.sampleId} not found.` };

  const sample = SAMPLES_MEMORY_STORE[sampleIndex];
  const now = new Date().toISOString();

  const updated: HealthcareLabSample = {
    ...sample,
    status: "REJECTED",
    rejected_at: now,
    rejected_by_id: params.actorId,
    rejected_by_name: params.actorName,
    rejection_reason: params.reason,
    rejection_notes: params.notes,
    updated_at: now,
  };

  SAMPLES_MEMORY_STORE[sampleIndex] = updated;

  recordCustodyEvent({
    sampleId: sample.id,
    labOrderId: sample.lab_order_id,
    eventType: "SAMPLE_REJECTED",
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    notes: `Sample rejected: ${params.reason}${params.notes ? ` - ${params.notes}` : ""}`,
  });

  return { success: true, sample: updated };
}
