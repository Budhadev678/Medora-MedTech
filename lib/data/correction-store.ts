// ============================================================
// MEDORA — IDENTITY CORRECTION REQUEST STORE (PHASE 3.3 & 3.4)
// Controlled Identity Rectification & Audit Tracking
// ============================================================

import { IdentityCorrectionRequest, CorrectionStatus } from "@/types/database.types";
import { logAuditEvent } from "@/lib/data/audit-store";
import { findIdentityById, saveIdentity } from "@/lib/data/identity-store";

const CORRECTIONS_STORAGE_KEY = "medora_identity_corrections";

const SEEDED_CORRECTIONS: IdentityCorrectionRequest[] = [
  {
    id: "CORR-1001",
    patient_id: "PAT-1001",
    field_name: "fullName",
    field_label: "Full Legal Name",
    current_value: "Rahul Verma",
    requested_value: "Rahul Kumar Verma",
    reason: "Addition of middle name as reflected in updated Aadhaar registry",
    status: "UNDER_REVIEW",
    submitted_at: "2026-08-18T14:20:00Z",
    admin_notes: "Aadhaar verification document attached for review",
  },
];

export function getAllCorrectionRequests(): IdentityCorrectionRequest[] {
  if (typeof window === "undefined") return SEEDED_CORRECTIONS;
  try {
    const raw = localStorage.getItem(CORRECTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CORRECTIONS_STORAGE_KEY, JSON.stringify(SEEDED_CORRECTIONS));
      return SEEDED_CORRECTIONS;
    }
    return JSON.parse(raw) as IdentityCorrectionRequest[];
  } catch (e) {
    return SEEDED_CORRECTIONS;
  }
}

function saveCorrectionRequests(requests: IdentityCorrectionRequest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CORRECTIONS_STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new Event("medora-corrections-updated"));
  } catch (e) {}
}

/**
 * Returns correction requests submitted by a specific patient.
 */
export function getPatientCorrectionRequests(patientId: string): IdentityCorrectionRequest[] {
  const all = getAllCorrectionRequests();
  return all.filter((r) => r.patient_id === patientId);
}

/**
 * Submit a request to correct a verified identity field.
 * Enforces duplicate protection and audit logging.
 */
export function submitCorrectionRequest(
  patientId: string,
  fieldName: "fullName" | "dob" | "gender" | "bloodGroup" | "aadhaarMasked" | "address",
  fieldLabel: string,
  currentValue: string,
  requestedValue: string,
  reason: string,
  patientName: string = "Patient"
): { success: boolean; error?: string; request?: IdentityCorrectionRequest } {
  const cleanRequested = requestedValue.trim();
  const cleanReason = reason.trim();

  if (!cleanRequested) {
    return { success: false, error: "Please enter the corrected value." };
  }
  if (!cleanReason || cleanReason.length < 5) {
    return { success: false, error: "Please provide a valid reason for this identity correction." };
  }
  if (cleanRequested === currentValue.trim()) {
    return { success: false, error: "Requested value is identical to the current verified value." };
  }

  const all = getAllCorrectionRequests();

  // Duplicate Check: Prevent multiple pending requests for the same field
  const activeDuplicate = all.find(
    (r) => r.patient_id === patientId && 
           r.field_name === fieldName && 
           (r.status === "PENDING" || r.status === "UNDER_REVIEW")
  );

  if (activeDuplicate) {
    return {
      success: false,
      error: `A correction request for ${fieldLabel} is already under review (${activeDuplicate.id}).`,
    };
  }

  const newRequest: IdentityCorrectionRequest = {
    id: "CORR-" + Math.floor(1000 + Math.random() * 9000),
    patient_id: patientId,
    field_name: fieldName,
    field_label: fieldLabel,
    current_value: currentValue,
    requested_value: cleanRequested,
    reason: cleanReason,
    status: "PENDING",
    submitted_at: new Date().toISOString(),
  };

  all.unshift(newRequest);
  saveCorrectionRequests(all);

  logAuditEvent({
    event_type: "IDENTITY_CORRECTION_REQUESTED",
    actor_id: patientId,
    actor_name: patientName,
    actor_role: "patient",
    patient_id: patientId,
    summary: `Correction requested for ${fieldLabel}: "${currentValue}" → "${cleanRequested}"`,
    reference_id: newRequest.id,
    metadata: {
      field_name: fieldName,
      reason: cleanReason,
    },
  });

  return { success: true, request: newRequest };
}

/**
 * Cancel a pending correction request.
 */
export function cancelCorrectionRequest(
  requestId: string,
  patientId: string,
  patientName: string = "Patient"
): { success: boolean; error?: string } {
  const all = getAllCorrectionRequests();
  const req = all.find((r) => r.id === requestId && r.patient_id === patientId);

  if (!req) {
    return { success: false, error: "Correction request not found." };
  }

  if (req.status !== "PENDING" && req.status !== "UNDER_REVIEW") {
    return { success: false, error: `Cannot cancel a request that is already ${req.status.toLowerCase()}.` };
  }

  req.status = "CANCELLED";
  saveCorrectionRequests(all);

  logAuditEvent({
    event_type: "IDENTITY_CORRECTION_CANCELLED",
    actor_id: patientId,
    actor_name: patientName,
    actor_role: "patient",
    patient_id: patientId,
    summary: `Cancelled correction request ${req.id} for ${req.field_label}`,
    reference_id: req.id,
  });

  return { success: true };
}

/**
 * Authoritative approval of a correction request (Administrative operation).
 * Updates verified identity and marks request as APPROVED.
 */
export function approveCorrectionRequest(
  requestId: string,
  adminActor: { id: string; name: string; role: string }
): { success: boolean; error?: string } {
  const all = getAllCorrectionRequests();
  const req = all.find((r) => r.id === requestId);

  if (!req) {
    return { success: false, error: "Correction request not found." };
  }

  if (req.status !== "PENDING" && req.status !== "UNDER_REVIEW") {
    return { success: false, error: `Request is already ${req.status.toLowerCase()}.` };
  }

  // Update verified identity field in persistent store
  const patient = findIdentityById(req.patient_id);
  if (patient) {
    if (req.field_name === "fullName") patient.fullName = req.requested_value;
    if (patient.patientData) {
      if (req.field_name === "dob") patient.patientData.dob = req.requested_value;
      if (req.field_name === "gender") patient.patientData.gender = req.requested_value as any;
      if (req.field_name === "bloodGroup") patient.patientData.bloodGroup = req.requested_value;
    }
    saveIdentity(patient);
  }

  req.status = "APPROVED";
  req.reviewed_at = new Date().toISOString();
  req.reviewer_role = adminActor.role;
  saveCorrectionRequests(all);

  logAuditEvent({
    event_type: "IDENTITY_CORRECTION_APPROVED",
    actor_id: adminActor.id,
    actor_name: adminActor.name,
    actor_role: adminActor.role,
    patient_id: req.patient_id,
    summary: `Approved identity correction ${req.id} for ${req.field_label}`,
    reference_id: req.id,
  });

  return { success: true };
}
