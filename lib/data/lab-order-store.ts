// ============================================================
// MEDORA — LABORATORY ORDER CORE STORE (PHASE 4.3)
// Authoritative Clinician-Requested Diagnostic Test Orders
// Hierarchy: PATIENT -> ENCOUNTER -> CLINICAL RECORD -> LAB ORDER
// ============================================================

import type {
  HealthcareLabOrder,
  LabOrderItem,
  LabOrderPriority,
  LabOrderStatus,
} from "@/types/database.types";
import { getEncounterById } from "@/lib/data/encounter-store";
import { findIdentityById } from "@/lib/data/identity-store";
import { appendAuditEvent } from "@/lib/data/audit-store";

export type { HealthcareLabOrder, LabOrderItem, LabOrderPriority, LabOrderStatus };

// ============================================================
// CANONICAL SEEDED LAB ORDERS
// ============================================================

export const SEEDED_LAB_ORDERS: HealthcareLabOrder[] = [
  // 1. Lab Order for ENC-1001 (Rahul Verma at City Hospital - Ordered)
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
    department_name: "Cardiology OPD",
    laboratory_id: "LAB-1001",
    laboratory_name: "ABC Diagnostics",
    priority: "ROUTINE",
    reason: "Evaluate baseline renal parameters and lipid profile following elevated blood pressure reading.",
    instructions: "12-hour overnight fasting required for fasting lipid panel.",
    status: "ORDERED",
    items: [
      {
        id: "LOI-1",
        test_name: "Lipid Profile (Total Chol, HDL, LDL, VLDL, Triglycerides)",
        test_code: "LIP-01",
        specimen_type: "Serum",
        instructions: "Fasting sample required (12 hours)",
      },
      {
        id: "LOI-2",
        test_name: "Serum Creatinine & Blood Urea Nitrogen (BUN)",
        test_code: "REN-02",
        specimen_type: "Serum",
        instructions: "Standard venipuncture",
      },
    ],
    ordered_at: "2026-08-20T10:28:00Z",
    created_at: "2026-08-20T10:26:00Z",
    updated_at: "2026-08-20T10:28:00Z",
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
    priority: "ROUTINE",
    reason: "Routine HbA1c screening for metabolic risk assessment.",
    instructions: "Standard blood collection. Non-fasting random sample.",
    status: "ORDERED",
    items: [
      {
        id: "LOI-1",
        test_name: "Glycated Hemoglobin (HbA1c)",
        test_code: "DIA-01",
        specimen_type: "Whole Blood (EDTA)",
        instructions: "Random sample (non-fasting)",
      },
    ],
    ordered_at: "2026-08-15T16:20:00Z",
    created_at: "2026-08-15T16:20:00Z",
    updated_at: "2026-08-15T16:20:00Z",
  },
];

const STORAGE_KEY = "medora_lab_orders_store_v1";

// Cache for double-click debounce
const recentLabOrderSubmissions = new Map<string, number>();

/**
 * Retrieve all lab orders with localStorage persistence.
 */
export function getAllLabOrders(): HealthcareLabOrder[] {
  if (typeof window === "undefined") {
    return SEEDED_LAB_ORDERS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_LAB_ORDERS));
      return SEEDED_LAB_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEEDED_LAB_ORDERS;
  } catch {
    return SEEDED_LAB_ORDERS;
  }
}

/**
 * Persist lab orders to localStorage and dispatch update event.
 */
function saveLabOrders(orders: HealthcareLabOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event("medora-lab-orders-updated"));
  } catch (e) {
    console.error("Failed to save lab orders:", e);
  }
}

/**
 * Retrieve a single lab order by ID or reference.
 */
export function getLabOrderById(id: string): HealthcareLabOrder | null {
  const all = getAllLabOrders();
  const cleanId = id.trim();
  return all.find((o) => o.id === cleanId || o.order_reference === cleanId) || null;
}

/**
 * Retrieve lab orders for a specific patient.
 * STRICT PATIENT ISOLATION: Hides unfinalized DRAFT orders from patient portal.
 */
export function getPatientLabOrders(
  patientIdOrIdentifier: string,
  includeDrafts: boolean = false
): HealthcareLabOrder[] {
  const all = getAllLabOrders();
  const targetId = patientIdOrIdentifier.trim().toLowerCase();

  return all
    .filter((o) => {
      const matchPatient = o.patient_id.toLowerCase() === targetId;
      if (!matchPatient) return false;
      if (!includeDrafts && o.status === "DRAFT") return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Retrieve lab orders for a doctor with optional organization scoping.
 */
export function getDoctorLabOrders(
  doctorIdOrIdentifier: string,
  organizationId?: string
): HealthcareLabOrder[] {
  const all = getAllLabOrders();
  const targetDoc = doctorIdOrIdentifier.trim();

  return all
    .filter((o) => {
      const matchDoc = o.ordering_provider_id === targetDoc;
      if (!matchDoc) return false;
      if (organizationId && o.organization_id !== organizationId.trim()) return false;
      return true;
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

/**
 * Retrieve lab orders assigned to a specific Laboratory facility.
 */
export function getAssignedLabOrders(laboratoryId: string): HealthcareLabOrder[] {
  const all = getAllLabOrders();
  const cleanLab = laboratoryId.trim();
  return all.filter((o) => o.laboratory_id === cleanLab && o.status !== "DRAFT");
}

/**
 * Retrieve lab orders attached to a specific Encounter.
 */
export function getEncounterLabOrders(encounterId: string): HealthcareLabOrder[] {
  const all = getAllLabOrders();
  const cleanId = encounterId.trim();
  return all.filter((o) => o.encounter_id === cleanId);
}

export interface SaveLabOrderDraftParams {
  encounterId: string;
  items: LabOrderItem[];
  priority?: LabOrderPriority;
  reason: string;
  instructions?: string;
  laboratoryId?: string;
  laboratoryName?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}

/**
 * Save or update a Lab Order Draft for an active Encounter.
 */
export function saveLabOrderDraft(
  params: SaveLabOrderDraftParams
): { success: boolean; order?: HealthcareLabOrder; error?: string } {
  const {
    encounterId,
    items,
    priority = "ROUTINE",
    reason,
    instructions,
    laboratoryId,
    laboratoryName,
    actorId,
    actorName,
    actorRole,
  } = params;

  // 1. Debounce protection (2s lock)
  const debounceKey = `lab_draft_${encounterId}_${actorId}`;
  const lastTime = recentLabOrderSubmissions.get(debounceKey) || 0;
  if (Date.now() - lastTime < 2000) {
    return { success: false, error: "A lab order save operation is in progress. Please wait." };
  }
  recentLabOrderSubmissions.set(debounceKey, Date.now());

  // 2. Validate Encounter
  const encounter = getEncounterById(encounterId);
  if (!encounter) {
    return { success: false, error: `Encounter ${encounterId} not found.` };
  }
  if (encounter.status === "CANCELLED") {
    return { success: false, error: "Cannot create a lab order for a CANCELLED encounter." };
  }

  // 3. Resolve & Verify Ordering Provider
  const doctor = findIdentityById(actorId);
  if (!doctor || doctor.accountStatus !== "active") {
    return { success: false, error: "Ordering provider account is invalid or inactive." };
  }

  if (doctor.doctorData && actorRole === "doctor") {
    const activeAffiliation = doctor.doctorData.affiliations.find(
      (a) =>
        (a.organizationId === encounter.organization_id || a.organizationIdentifier === encounter.organization_id) &&
        a.status === "active"
    );
    if (!activeAffiliation) {
      return {
        success: false,
        error: `Doctor ${doctor.fullName} is not actively affiliated with ${encounter.organization_name}.`,
      };
    }
  }

  const all = getAllLabOrders();
  const existingDraftIndex = all.findIndex(
    (o) => o.encounter_id === encounterId && o.status === "DRAFT"
  );
  const nowIso = new Date().toISOString();

  if (existingDraftIndex >= 0) {
    const existing = all[existingDraftIndex];
    existing.items = items;
    existing.priority = priority;
    existing.reason = reason;
    existing.instructions = instructions;
    existing.laboratory_id = laboratoryId;
    existing.laboratory_name = laboratoryName;
    existing.updated_at = nowIso;

    all[existingDraftIndex] = existing;
    saveLabOrders(all);

    appendAuditEvent(
      "LAB_ORDER_UPDATED",
      actorId,
      actorName,
      actorRole,
      `Updated draft lab order ${existing.id} for encounter ${encounterId}`,
      existing.patient_id,
      existing.organization_id,
      existing.organization_name,
      existing.id,
      { itemsCount: items.length }
    );

    return { success: true, order: existing };
  }

  // Create New Draft Lab Order
  const nextNum = all.length + 1001;
  const newId = `LAB-ORD-${nextNum}`;

  const newOrder: HealthcareLabOrder = {
    id: newId,
    order_reference: newId,
    patient_id: encounter.patient_id,
    patient_name: encounter.patient_name,
    encounter_id: encounterId,
    ordering_provider_id: actorId,
    ordering_provider_name: doctor.fullName,
    ordering_provider_role: doctor.doctorData?.qualifications
      ? `Consultant (${doctor.doctorData.specialization})`
      : "Attending Doctor",
    organization_id: encounter.organization_id,
    organization_name: encounter.organization_name,
    department_name: encounter.department_name,
    laboratory_id: laboratoryId,
    laboratory_name: laboratoryName,
    priority,
    reason,
    instructions,
    status: "DRAFT",
    items,
    created_at: nowIso,
    updated_at: nowIso,
  };

  all.unshift(newOrder);
  saveLabOrders(all);

  appendAuditEvent(
    "LAB_ORDER_CREATED",
    actorId,
    actorName,
    actorRole,
    `Created draft lab order ${newId} for encounter ${encounterId}`,
    encounter.patient_id,
    encounter.organization_id,
    encounter.organization_name,
    newId,
    { itemsCount: items.length }
  );

  return { success: true, order: newOrder };
}

export interface PlaceLabOrderParams {
  orderId?: string;
  encounterId: string;
  items: LabOrderItem[];
  priority?: LabOrderPriority;
  reason: string;
  instructions?: string;
  laboratoryId?: string;
  laboratoryName?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}

/**
 * Place an authoritative Diagnostic Lab Order.
 * Validates at least 1 test item, non-empty reason, transitions to ORDERED, and locks.
 */
export function placeLabOrder(
  params: PlaceLabOrderParams
): { success: boolean; order?: HealthcareLabOrder; error?: string } {
  const {
    orderId,
    encounterId,
    items,
    priority = "ROUTINE",
    reason,
    instructions,
    laboratoryId,
    laboratoryName,
    actorId,
    actorName,
    actorRole,
  } = params;

  // 1. Validation
  if (!items || items.length === 0) {
    return { success: false, error: "Please select at least one diagnostic test to place a lab order." };
  }
  if (!reason || !reason.trim()) {
    return { success: false, error: "Please enter a valid clinical indication / reason for this diagnostic order." };
  }

  for (let i = 0; i < items.length; i++) {
    if (!items[i].test_name?.trim()) {
      return { success: false, error: `Test item #${i + 1} requires a valid test name.` };
    }
  }

  // 2. Validate Encounter
  const encounter = getEncounterById(encounterId);
  if (!encounter) {
    return { success: false, error: `Encounter ${encounterId} not found.` };
  }
  if (encounter.status === "CANCELLED") {
    return { success: false, error: "Cannot place a lab order for a CANCELLED encounter." };
  }

  // 3. Resolve & Verify Doctor
  const doctor = findIdentityById(actorId);
  if (!doctor || doctor.accountStatus !== "active") {
    return { success: false, error: "Ordering provider account is invalid or inactive." };
  }

  const all = getAllLabOrders();
  const nowIso = new Date().toISOString();

  let targetIndex = -1;
  if (orderId) {
    targetIndex = all.findIndex((o) => o.id === orderId || o.order_reference === orderId);
  } else {
    targetIndex = all.findIndex((o) => o.encounter_id === encounterId && o.status === "DRAFT");
  }

  let finalOrder: HealthcareLabOrder;

  if (targetIndex >= 0) {
    finalOrder = all[targetIndex];
    if (finalOrder.status === "ORDERED") {
      return { success: false, error: "This lab order is already ORDERED and cannot be re-ordered." };
    }
    finalOrder.items = items;
    finalOrder.priority = priority;
    finalOrder.reason = reason.trim();
    finalOrder.instructions = instructions;
    finalOrder.laboratory_id = laboratoryId;
    finalOrder.laboratory_name = laboratoryName;
    finalOrder.status = "ORDERED";
    finalOrder.ordered_at = nowIso;
    finalOrder.updated_at = nowIso;
    all[targetIndex] = finalOrder;
  } else {
    const nextNum = all.length + 1001;
    const newId = `LAB-ORD-${nextNum}`;

    finalOrder = {
      id: newId,
      order_reference: newId,
      patient_id: encounter.patient_id,
      patient_name: encounter.patient_name,
      encounter_id: encounterId,
      ordering_provider_id: actorId,
      ordering_provider_name: doctor.fullName,
      ordering_provider_role: doctor.doctorData?.qualifications
        ? `Consultant (${doctor.doctorData.specialization})`
        : "Attending Doctor",
      organization_id: encounter.organization_id,
      organization_name: encounter.organization_name,
      department_name: encounter.department_name,
      laboratory_id: laboratoryId,
      laboratory_name: laboratoryName,
      priority,
      reason: reason.trim(),
      instructions,
      status: "ORDERED",
      items,
      ordered_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };
    all.unshift(finalOrder);
  }

  saveLabOrders(all);

  appendAuditEvent(
    "LAB_ORDER_ORDERED",
    actorId,
    actorName,
    actorRole,
    `Placed diagnostic lab order ${finalOrder.id} (${items.length} tests, priority: ${priority}) for patient ${encounter.patient_name}`,
    encounter.patient_id,
    encounter.organization_id,
    encounter.organization_name,
    finalOrder.id,
    {
      itemsCount: items.length,
      priority,
      orderedAt: nowIso,
    }
  );

  return { success: true, order: finalOrder };
}

/**
 * Cancel a placed lab order with a mandatory documented reason.
 */
export function cancelLabOrder(
  orderId: string,
  cancellationReason: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; order?: HealthcareLabOrder; error?: string } {
  const cleanReason = cancellationReason?.trim();
  if (!cleanReason) {
    return { success: false, error: "A cancellation reason is required to cancel a lab order." };
  }

  const all = getAllLabOrders();
  const index = all.findIndex((o) => o.id === orderId || o.order_reference === orderId);

  if (index < 0) {
    return { success: false, error: `Lab order ${orderId} not found.` };
  }

  const order = all[index];
  const nowIso = new Date().toISOString();
  order.status = "CANCELLED";
  order.cancelled_at = nowIso;
  order.cancellation_reason = cleanReason;
  order.updated_at = nowIso;

  all[index] = order;
  saveLabOrders(all);

  appendAuditEvent(
    "LAB_ORDER_CANCELLED",
    actorId,
    actorName,
    actorRole,
    `Cancelled lab order ${order.id}: ${cleanReason}`,
    order.patient_id,
    order.organization_id,
    order.organization_name,
    order.id,
    { cancellationReason: cleanReason }
  );

  return { success: true, order };
}
