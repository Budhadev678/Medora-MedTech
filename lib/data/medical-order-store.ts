// ============================================================
// MEDORA — MEDICAL ORDER CORE STORE (PHASE C.2)
// Authoritative Diagnostic, Radiology, Referral & Follow-up Orders
// Hierarchy: PATIENT -> ENCOUNTER -> MEDICAL ORDER
// ============================================================

import type {
  HealthcareMedicalOrder,
  MedicalOrderType,
  MedicalOrderStatus,
  MedicalOrderPriority,
  LabOrderItem,
  ImagingOrderDetails,
  ReferralOrderDetails,
  FollowUpOrderDetails,
} from "@/types/database.types";
import { getEncounterById } from "@/lib/data/encounter-store";
import { findIdentityById, StoredIdentity } from "@/lib/data/identity-store";
import { appendAuditEvent } from "@/lib/data/audit-store";

export type {
  HealthcareMedicalOrder,
  MedicalOrderType,
  MedicalOrderStatus,
  MedicalOrderPriority,
  LabOrderItem,
  ImagingOrderDetails,
  ReferralOrderDetails,
  FollowUpOrderDetails,
};

// ============================================================
// CANONICAL SEEDED MEDICAL ORDERS
// ============================================================

export const SEEDED_MEDICAL_ORDERS: HealthcareMedicalOrder[] = [
  // 1. Diagnostic Lab Order (ENC-1001)
  {
    id: "ORD-1001",
    order_reference: "ORD-1001",
    order_type: "LAB",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1001",
    ordering_provider_id: "DOC-1001",
    ordering_provider_name: "Dr. Ananya Sharma",
    ordering_provider_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    facility_name: "City Hospital",
    department_name: "Cardiology OPD",
    priority: "ROUTINE",
    status: "ORDERED",
    clinical_indication: "Evaluate baseline lipid panel & renal function post elevated BP reading.",
    instructions: "12-hour fasting required for fasting lipid panel.",
    lab_items: [
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
  // 2. Radiology / Imaging Order (ENC-1001)
  {
    id: "IMG-1001",
    order_reference: "IMG-1001",
    order_type: "IMAGING",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1001",
    ordering_provider_id: "DOC-1001",
    ordering_provider_name: "Dr. Ananya Sharma",
    ordering_provider_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    facility_name: "City Hospital",
    department_name: "Cardiology OPD",
    priority: "ROUTINE",
    status: "ORDERED",
    clinical_indication: "Assess cardiac chamber dimensions and left ventricular ejection fraction.",
    instructions: "Standard 2D Echocardiogram with Doppler.",
    imaging_details: {
      modality: "ECHO",
      body_part: "Transthoracic 2D Echo",
      with_contrast: false,
      special_instructions: "Measure LVEF and diastolic filling parameters.",
    },
    ordered_at: "2026-08-20T10:30:00Z",
    created_at: "2026-08-20T10:30:00Z",
    updated_at: "2026-08-20T10:30:00Z",
  },
  // 3. Specialty Referral Order (ENC-1002)
  {
    id: "REF-1001",
    order_reference: "REF-1001",
    order_type: "REFERRAL",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1002",
    ordering_provider_id: "DOC-1001",
    ordering_provider_name: "Dr. Ananya Sharma",
    ordering_provider_role: "Visiting Cardiologist",
    organization_id: "CLN-1001",
    organization_name: "Green Care Clinic",
    facility_id: "FAC-1003",
    facility_name: "Green Care Clinic",
    department_name: "General Medicine",
    priority: "ROUTINE",
    status: "ORDERED",
    clinical_indication: "Dietary consultation and medical nutrition therapy for stage 1 hypertension management.",
    instructions: "Schedule initial clinical nutrition session.",
    referral_details: {
      target_specialty: "Clinical Nutrition & Dietetics",
      target_organization_id: "HSP-1001",
      target_organization_name: "City Hospital",
      urgency: "ROUTINE",
      referral_reason: "DASH diet planning and lifestyle modification coaching.",
      clinical_summary: "42-year-old male with essential hypertension on Telmisartan 40mg monotherapy.",
    },
    ordered_at: "2026-08-15T16:22:00Z",
    created_at: "2026-08-15T16:22:00Z",
    updated_at: "2026-08-15T16:22:00Z",
  },
];

let inMemoryMedicalOrders: HealthcareMedicalOrder[] = [...SEEDED_MEDICAL_ORDERS];
const STORAGE_KEY = "medora_medical_orders_store_v1";

/**
 * Retrieve all medical orders with localStorage persistence.
 */
export function getAllMedicalOrders(): HealthcareMedicalOrder[] {
  if (typeof window === "undefined") {
    return inMemoryMedicalOrders;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryMedicalOrders));
      return inMemoryMedicalOrders;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryMedicalOrders;
  } catch {
    return inMemoryMedicalOrders;
  }
}

/**
 * Persist medical orders to localStorage and in-memory cache.
 */
export function saveMedicalOrders(orders: HealthcareMedicalOrder[]): void {
  inMemoryMedicalOrders = orders;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event("medora-medical-orders-updated"));
  } catch (e) {
    console.error("Failed to save medical orders:", e);
  }
}

/**
 * Retrieve a single medical order by ID or reference.
 */
export function getMedicalOrderById(id: string): HealthcareMedicalOrder | null {
  if (!id) return null;
  const all = getAllMedicalOrders();
  const cleanId = id.trim().toUpperCase();
  return (
    all.find(
      (o) =>
        (o.id && o.id.toUpperCase() === cleanId) ||
        (o.order_reference && o.order_reference.toUpperCase() === cleanId)
    ) || null
  );
}

/**
 * Retrieve medical orders for a specific patient.
 * STRICT PATIENT ISOLATION: When called in patient mode, filters out unfinalized DRAFT orders.
 */
export function getPatientMedicalOrders(
  patientIdOrIdentifier: string,
  includeDrafts: boolean = false
): HealthcareMedicalOrder[] {
  if (!patientIdOrIdentifier) return [];
  const all = getAllMedicalOrders();
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
 * Retrieve medical orders attached to a specific Encounter.
 */
export function getEncounterMedicalOrders(encounterId: string): HealthcareMedicalOrder[] {
  if (!encounterId) return [];
  const all = getAllMedicalOrders();
  const cleanId = encounterId.trim().toUpperCase();
  return all.filter((o) => o.encounter_id && o.encounter_id.toUpperCase() === cleanId);
}

export interface CreateMedicalOrderParams {
  encounterId: string;
  orderType: MedicalOrderType;
  priority?: MedicalOrderPriority;
  clinicalIndication?: string;
  instructions?: string;
  labItems?: LabOrderItem[];
  imagingDetails?: ImagingOrderDetails;
  referralDetails?: ReferralOrderDetails;
  followUpDetails?: FollowUpOrderDetails;
  actorId: string;
  actorName: string;
  actorRole: string;
  isDraft?: boolean;
}

/**
 * Create or save an authoritative Medical Order bound to an active Encounter.
 */
export function createMedicalOrder(
  params: CreateMedicalOrderParams
): { success: boolean; order?: HealthcareMedicalOrder; error?: string } {
  const {
    encounterId,
    orderType,
    priority = "ROUTINE",
    clinicalIndication,
    instructions,
    labItems,
    imagingDetails,
    referralDetails,
    followUpDetails,
    actorId,
    actorName,
    actorRole,
    isDraft = false,
  } = params;

  // 1. Validate Encounter
  const encounter = getEncounterById(encounterId);
  if (!encounter) {
    return { success: false, error: `Parent Healthcare Encounter ${encounterId} not found.` };
  }
  if (encounter.status === "CANCELLED") {
    return { success: false, error: "Cannot create a medical order for a CANCELLED encounter." };
  }

  // 2. Resolve Prescribing Clinician
  const doctor = findIdentityById(actorId);
  if (!doctor || doctor.accountStatus !== "active") {
    return { success: false, error: "Ordering doctor account is invalid or inactive." };
  }

  // Doctor authorization guard: Doctor B cannot order in Doctor A's encounter
  if (
    actorRole === "doctor" &&
    encounter.provider_id.toLowerCase() !== actorId.toLowerCase() &&
    encounter.provider_id.toLowerCase() !== doctor.identifier?.toLowerCase()
  ) {
    return { success: false, error: "Only the attending doctor for this encounter can issue medical orders." };
  }

  // Type-specific validations
  if (!isDraft) {
    if (orderType === "LAB" && (!labItems || labItems.length === 0)) {
      return { success: false, error: "Diagnostic laboratory order requires at least one test item." };
    }
    if (orderType === "IMAGING" && (!imagingDetails || !imagingDetails.body_part.trim())) {
      return { success: false, error: "Radiology/imaging order requires a target body region or examination part." };
    }
    if (orderType === "REFERRAL" && (!referralDetails || !referralDetails.target_specialty.trim())) {
      return { success: false, error: "Referral order requires a target clinical specialty." };
    }
  }

  const all = getAllMedicalOrders();
  const nextNum = all.length + 1001;
  const prefix = orderType === "LAB" ? "ORD" : orderType === "IMAGING" ? "IMG" : orderType === "REFERRAL" ? "REF" : "ORD";
  const newId = `${prefix}-${nextNum}`;
  const nowIso = new Date().toISOString();

  const newOrder: HealthcareMedicalOrder = {
    id: newId,
    order_reference: newId,
    order_type: orderType,
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
    facility_id: encounter.facility_id || "FAC-1001",
    facility_name: encounter.facility_name || encounter.organization_name,
    department_name: encounter.department_name,
    priority,
    status: isDraft ? "DRAFT" : "ORDERED",
    clinical_indication: clinicalIndication?.trim(),
    instructions: instructions?.trim(),
    lab_items: labItems,
    imaging_details: imagingDetails,
    referral_details: referralDetails,
    follow_up_details: followUpDetails,
    ordered_at: isDraft ? undefined : nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };

  all.unshift(newOrder);
  saveMedicalOrders(all);

  appendAuditEvent(
    "ORDER_CREATED",
    actorId,
    actorName,
    actorRole,
    `Created ${orderType} order ${newId} (${isDraft ? "DRAFT" : "ORDERED"}) for patient ${encounter.patient_name}`,
    encounter.patient_id,
    encounter.organization_id,
    encounter.organization_name,
    newId,
    {
      orderType,
      status: newOrder.status,
      priority,
      facilityId: newOrder.facility_id || null,
    }
  );

  return { success: true, order: newOrder };
}

/**
 * Cancel an active medical order with a documented reason.
 */
export function cancelMedicalOrder(
  orderId: string,
  cancellationReason: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; order?: HealthcareMedicalOrder; error?: string } {
  const cleanReason = cancellationReason?.trim();
  if (!cleanReason) {
    return { success: false, error: "A cancellation reason is required to cancel a medical order." };
  }

  const all = getAllMedicalOrders();
  const index = all.findIndex((o) => o.id === orderId || o.order_reference === orderId);

  if (index < 0) {
    return { success: false, error: `Medical order ${orderId} not found.` };
  }

  const order = all[index];
  const nowIso = new Date().toISOString();
  order.status = "CANCELLED";
  order.cancelled_at = nowIso;
  order.cancellation_reason = cleanReason;
  order.updated_at = nowIso;

  all[index] = order;
  saveMedicalOrders(all);

  appendAuditEvent(
    "ORDER_CANCELLED",
    actorId,
    actorName,
    actorRole,
    `Cancelled ${order.order_type} order ${order.id}: ${cleanReason}`,
    order.patient_id,
    order.organization_id,
    order.organization_name,
    order.id,
    { cancellationReason: cleanReason }
  );

  return { success: true, order };
}
