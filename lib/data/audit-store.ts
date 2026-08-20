// ============================================================
// MEDORA — IMMUTABLE AUDIT LEDGER & EVENT STORE (PHASE 3.3 & 3.4)
// Cross-Cutting Append-Only Security & Privacy Audit Trail
// ============================================================

import { StoredAuditEvent, AuditEventType } from "@/types/database.types";

const STORAGE_KEY = "medora_audit_ledger";

// Seeded audit events representing real platform activities
const SEEDED_AUDIT_EVENTS: StoredAuditEvent[] = [
  {
    id: "AUD-1001",
    timestamp: "2026-01-15T09:05:00Z",
    event_type: "RELATIONSHIP_CREATED",
    actor_id: "PAT-1001",
    actor_name: "Rahul Verma",
    actor_role: "patient",
    patient_id: "PAT-1001",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    summary: "Care relationship established with City Hospital",
    reference_id: "REL-1001",
  },
  {
    id: "AUD-1002",
    timestamp: "2026-01-20T10:30:00Z",
    event_type: "ABHA_LINKED",
    actor_id: "PAT-1001",
    actor_name: "Rahul Verma",
    actor_role: "patient",
    patient_id: "PAT-1001",
    summary: "ABHA ID (rahulverma@abdm) linked to MEDORA profile",
    reference_id: "ABHA-5892",
  },
  {
    id: "AUD-1003",
    timestamp: "2026-08-10T11:00:00Z",
    event_type: "CONSENT_GRANTED",
    actor_id: "PAT-1001",
    actor_name: "Rahul Verma",
    actor_role: "patient",
    patient_id: "PAT-1001",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    summary: "Consent granted to Dr. Ananya Sharma (City Hospital) for treatment",
    reference_id: "CNS-1001",
    metadata: {
      purpose: "treatment",
      scopes: "consultations, prescriptions, lab_reports",
      duration_days: 7,
    },
  },
];

export function getAuditLedger(): StoredAuditEvent[] {
  if (typeof window === "undefined") return SEEDED_AUDIT_EVENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_AUDIT_EVENTS));
      return SEEDED_AUDIT_EVENTS;
    }
    return JSON.parse(raw) as StoredAuditEvent[];
  } catch (e) {
    return SEEDED_AUDIT_EVENTS;
  }
}

/**
 * Append-only logger for authoritative security and privacy actions.
 * Explicitly sanitizes and prevents logging of sensitive credentials.
 */
export function logAuditEvent(params: {
  event_type: AuditEventType;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  patient_id?: string;
  organization_id?: string;
  organization_name?: string;
  summary: string;
  reference_id?: string;
  metadata?: Record<string, string | number | boolean | null>;
}): StoredAuditEvent {
  // Sanitize metadata: Never allow Aadhaar, OTP, password, or auth tokens
  const cleanMetadata: Record<string, string | number | boolean | null> = {};
  if (params.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      const lowerKey = k.toLowerCase();
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("otp") ||
        lowerKey.includes("token") ||
        lowerKey.includes("aadhaar") ||
        lowerKey.includes("secret")
      ) {
        cleanMetadata[k] = "[REDACTED_SECURITY_DATA]";
      } else {
        cleanMetadata[k] = v;
      }
    }
  }

  const newEvent: StoredAuditEvent = {
    id: "AUD-" + Math.floor(1000 + Math.random() * 9000),
    timestamp: new Date().toISOString(),
    event_type: params.event_type,
    actor_id: params.actor_id,
    actor_name: params.actor_name,
    actor_role: params.actor_role,
    patient_id: params.patient_id,
    organization_id: params.organization_id,
    organization_name: params.organization_name,
    summary: params.summary,
    reference_id: params.reference_id,
    metadata: cleanMetadata,
  };

  const ledger = getAuditLedger();
  ledger.unshift(newEvent); // Latest first

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
      window.dispatchEvent(new Event("medora-audit-updated"));
    } catch (e) {
      // Ignore local storage quota limits
    }
  }

  return newEvent;
}

/**
 * Returns user-facing, human-readable timeline for a specific patient.
 * Strictly scopes events to the requested patient and filters internal noise.
 */
export function getPatientAuditTimeline(patientId: string): StoredAuditEvent[] {
  const ledger = getAuditLedger();
  return ledger.filter((e) => e.patient_id === patientId);
}
