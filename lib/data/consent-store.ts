// ============================================================
// MEDORA — PATIENT CONSENT & PERMISSIONS STORE (PHASE 3.3 & 3.4)
// Explicit, Purpose-Bound, Time-Limited Healthcare Record Consent
// ============================================================

import { ConsentRequest, ConsentRecord, ConsentStatus, ConsentPurpose, ConsentDataScope } from "@/types/database.types";
import { logAuditEvent } from "@/lib/data/audit-store";

const REQUESTS_STORAGE_KEY = "medora_consent_requests";
const CONSENTS_STORAGE_KEY = "medora_consents";

// Seeded real-world consent requests for test personas
const SEEDED_REQUESTS: ConsentRequest[] = [
  {
    id: "REQ-1001",
    patient_id: "PAT-1001",
    requester_id: "DOC-1001",
    requester_name: "Dr. Ananya Sharma",
    requester_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital (Bhubaneswar)",
    purpose: "treatment",
    purpose_description: "Outpatient Cardiology Consultation & Medication Review",
    requested_scopes: ["medical_history", "prescriptions", "lab_reports"],
    duration_days: 7,
    status: "GRANTED",
    requested_at: "2026-08-10T10:00:00Z",
    expires_at: "2026-08-27T10:00:00Z",
    responded_at: "2026-08-10T10:30:00Z",
    is_demo: false,
  },
  {
    id: "REQ-1002",
    patient_id: "PAT-1001",
    requester_id: "LAB-1001",
    requester_name: "ABC Diagnostic Lab",
    requester_role: "Pathology Diagnostic Desk",
    organization_id: "LAB-1001",
    organization_name: "ABC Diagnostics (Saheed Nagar)",
    purpose: "diagnostic_review",
    purpose_description: "Diagnostic verification of Lipid Profile and Blood Sugar investigations",
    requested_scopes: ["lab_reports", "diagnostic_reports"],
    duration_days: 3,
    status: "PENDING",
    requested_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    is_demo: false,
  },
  {
    id: "REQ-2001",
    patient_id: "PAT-1002",
    requester_id: "CLN-1001",
    requester_name: "Green Care Day Clinic",
    requester_role: "Family Physician Desk",
    organization_id: "CLN-1001",
    organization_name: "Green Care Clinic (Cuttack)",
    purpose: "treatment",
    purpose_description: "Respiratory Assessment and Allergy Management",
    requested_scopes: ["profile", "prescriptions"],
    duration_days: 14,
    status: "PENDING",
    requested_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    is_demo: false,
  },
];

// Seeded active consent grants
const SEEDED_CONSENTS: ConsentRecord[] = [
  {
    id: "CNS-1001",
    request_id: "REQ-1001",
    patient_id: "PAT-1001",
    requester_id: "DOC-1001",
    requester_name: "Dr. Ananya Sharma",
    requester_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital (Bhubaneswar)",
    purpose: "treatment",
    purpose_description: "Outpatient Cardiology Consultation & Medication Review",
    granted_scopes: ["medical_history", "prescriptions", "lab_reports"],
    status: "GRANTED",
    granted_at: "2026-08-10T10:30:00Z",
    expires_at: "2026-08-27T10:30:00Z",
    created_at: "2026-08-10T10:30:00Z",
    is_demo: false,
  },
  {
    id: "CNS-1000-HIST",
    patient_id: "PAT-1001",
    requester_id: "PHA-1001",
    requester_name: "ABC Pharmacy Desk",
    requester_role: "Chief Pharmacist",
    organization_id: "PHA-1001",
    organization_name: "ABC Pharmacy (Bhubaneswar)",
    purpose: "treatment",
    purpose_description: "Prescription Dispensing & Medication Counseling",
    granted_scopes: ["prescriptions"],
    status: "EXPIRED",
    granted_at: "2026-07-01T09:00:00Z",
    expires_at: "2026-07-08T09:00:00Z",
    created_at: "2026-07-01T09:00:00Z",
    is_demo: false,
  },
];

export function getAllConsentRequests(): ConsentRequest[] {
  if (typeof window === "undefined") return SEEDED_REQUESTS;
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(SEEDED_REQUESTS));
      return SEEDED_REQUESTS;
    }
    return JSON.parse(raw) as ConsentRequest[];
  } catch (e) {
    return SEEDED_REQUESTS;
  }
}

export function getAllConsents(): ConsentRecord[] {
  if (typeof window === "undefined") return SEEDED_CONSENTS;
  try {
    const raw = localStorage.getItem(CONSENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CONSENTS_STORAGE_KEY, JSON.stringify(SEEDED_CONSENTS));
      return SEEDED_CONSENTS;
    }
    return JSON.parse(raw) as ConsentRecord[];
  } catch (e) {
    return SEEDED_CONSENTS;
  }
}

function saveConsentRequests(requests: ConsentRequest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new Event("medora-consent-updated"));
  } catch (e) {}
}

function saveConsents(consents: ConsentRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENTS_STORAGE_KEY, JSON.stringify(consents));
    window.dispatchEvent(new Event("medora-consent-updated"));
  } catch (e) {}
}

/**
 * Returns pending and past consent requests for a specific patient.
 */
export function getPatientConsentRequests(patientId: string): ConsentRequest[] {
  const all = getAllConsentRequests();
  return all.filter((r) => r.patient_id === patientId);
}

/**
 * Returns active and historical consent grants for a specific patient.
 * Authoritatively evaluates backend expiration.
 */
export function getPatientConsents(patientId: string): ConsentRecord[] {
  const all = getAllConsents();
  const now = Date.now();

  let mutated = false;
  const updated = all.map((c) => {
    // Check expiration
    if (c.status === "GRANTED" && new Date(c.expires_at).getTime() < now) {
      mutated = true;
      return { ...c, status: "EXPIRED" as ConsentStatus };
    }
    return c;
  });

  if (mutated) {
    saveConsents(updated);
  }

  return updated.filter((c) => c.patient_id === patientId);
}

/**
 * Grant an incoming consent request.
 * Creates an authoritative ConsentRecord and logs immutable audit.
 */
export function grantConsentRequest(
  requestId: string,
  patientId: string,
  patientName: string = "Patient"
): { success: boolean; error?: string; consent?: ConsentRecord } {
  const requests = getAllConsentRequests();
  const reqIndex = requests.findIndex((r) => r.id === requestId && r.patient_id === patientId);

  if (reqIndex < 0) {
    return { success: false, error: "Consent request not found or does not belong to this patient." };
  }

  const req = requests[reqIndex];
  if (req.status !== "PENDING") {
    return { success: false, error: `This consent request is already ${req.status.toLowerCase()}.` };
  }

  const now = new Date();
  const expires = new Date(now.getTime() + req.duration_days * 24 * 3600 * 1000);

  // Update request state
  req.status = "GRANTED";
  req.responded_at = now.toISOString();
  saveConsentRequests(requests);

  // Create active Consent Record
  const newConsent: ConsentRecord = {
    id: "CNS-" + Math.floor(1000 + Math.random() * 9000),
    request_id: req.id,
    patient_id: req.patient_id,
    requester_id: req.requester_id,
    requester_name: req.requester_name,
    requester_role: req.requester_role,
    organization_id: req.organization_id,
    organization_name: req.organization_name,
    purpose: req.purpose,
    purpose_description: req.purpose_description,
    granted_scopes: req.requested_scopes,
    status: "GRANTED",
    granted_at: now.toISOString(),
    expires_at: expires.toISOString(),
    created_at: now.toISOString(),
    is_demo: req.is_demo,
  };

  const consents = getAllConsents();
  consents.unshift(newConsent);
  saveConsents(consents);

  // Log Immutable Audit Event
  logAuditEvent({
    event_type: "CONSENT_GRANTED",
    actor_id: patientId,
    actor_name: patientName,
    actor_role: "patient",
    patient_id: patientId,
    organization_id: req.organization_id,
    organization_name: req.organization_name,
    summary: `Consent granted to ${req.requester_name} (${req.organization_name}) for ${req.purpose}`,
    reference_id: newConsent.id,
    metadata: {
      request_id: req.id,
      purpose: req.purpose,
      duration_days: req.duration_days,
      scopes: req.requested_scopes.join(", "),
    },
  });

  return { success: true, consent: newConsent };
}

/**
 * Deny an incoming consent request.
 */
export function denyConsentRequest(
  requestId: string,
  patientId: string,
  patientName: string = "Patient"
): { success: boolean; error?: string } {
  const requests = getAllConsentRequests();
  const reqIndex = requests.findIndex((r) => r.id === requestId && r.patient_id === patientId);

  if (reqIndex < 0) {
    return { success: false, error: "Consent request not found." };
  }

  const req = requests[reqIndex];
  if (req.status !== "PENDING") {
    return { success: false, error: `This consent request is already ${req.status.toLowerCase()}.` };
  }

  req.status = "DENIED";
  req.responded_at = new Date().toISOString();
  saveConsentRequests(requests);

  // Log Immutable Audit Event
  logAuditEvent({
    event_type: "CONSENT_DENIED",
    actor_id: patientId,
    actor_name: patientName,
    actor_role: "patient",
    patient_id: patientId,
    organization_id: req.organization_id,
    organization_name: req.organization_name,
    summary: `Consent request from ${req.requester_name} (${req.organization_name}) was declined`,
    reference_id: req.id,
  });

  return { success: true };
}

/**
 * Revoke an active consent grant.
 * Disables future access and marks record as REVOKED.
 */
export function revokeConsent(
  consentId: string,
  patientId: string,
  patientName: string = "Patient"
): { success: boolean; error?: string; consent?: ConsentRecord } {
  const consents = getAllConsents();
  const index = consents.findIndex((c) => c.id === consentId && c.patient_id === patientId);

  if (index < 0) {
    return { success: false, error: "Consent grant not found or does not belong to this patient." };
  }

  const consent = consents[index];
  if (consent.status !== "GRANTED") {
    return { success: false, error: `Consent is already ${consent.status.toLowerCase()}.` };
  }

  const now = new Date().toISOString();
  consent.status = "REVOKED";
  consent.revoked_at = now;
  consent.updated_at = now;
  saveConsents(consents);

  // Log Immutable Audit Event
  logAuditEvent({
    event_type: "CONSENT_REVOKED",
    actor_id: patientId,
    actor_name: patientName,
    actor_role: "patient",
    patient_id: patientId,
    organization_id: consent.organization_id,
    organization_name: consent.organization_name,
    summary: `Permission revoked for ${consent.requester_name} (${consent.organization_name})`,
    reference_id: consent.id,
  });

  return { success: true, consent };
}
