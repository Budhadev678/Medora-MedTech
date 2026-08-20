// ============================================================
// MEDORA — PATIENT RELATIONSHIP STORE (PHASE 3.3 & 3.4)
// Patient ↔ Organization & Patient ↔ Provider Care Relationships
// ============================================================

import { PatientOrganizationRelationship, PatientDoctorRelationship, RelationshipStatus } from "@/types/database.types";
import { logAuditEvent } from "@/lib/data/audit-store";

const ORG_RELATIONSHIPS_KEY = "medora_patient_org_relationships";
const DOC_RELATIONSHIPS_KEY = "medora_patient_doc_relationships";

const SEEDED_ORG_RELATIONSHIPS: PatientOrganizationRelationship[] = [
  {
    id: "REL-1001",
    patient_id: "PAT-1001",
    organization_id: "HSP-1001",
    organization_name: "City Hospital (Bhubaneswar Main Hub)",
    organization_type: "hospital",
    relationship_type: "care_provider",
    status: "ACTIVE",
    connected_since: "2026-01-15T09:00:00Z",
    last_interaction_at: "2026-08-10T11:00:00Z",
    notes: "Primary tertiary healthcare and cardiology care relationship",
  },
  {
    id: "REL-1002",
    patient_id: "PAT-1001",
    organization_id: "LAB-1001",
    organization_name: "ABC Diagnostics (Saheed Nagar)",
    organization_type: "diagnostic_lab",
    relationship_type: "diagnostic_lab",
    status: "ACTIVE",
    connected_since: "2026-02-10T14:30:00Z",
    last_interaction_at: "2026-08-15T16:00:00Z",
    notes: "Diagnostic pathology and routine investigation provider",
  },
  {
    id: "REL-1003",
    patient_id: "PAT-1001",
    organization_id: "CLN-1001",
    organization_name: "Green Care Day Clinic (Bhubaneswar)",
    organization_type: "clinic",
    relationship_type: "visiting_facility",
    status: "ENDED",
    connected_since: "2025-11-20T08:00:00Z",
    ended_at: "2026-06-01T12:00:00Z",
    notes: "Consultation series concluded",
  },
  {
    id: "REL-2001",
    patient_id: "PAT-1002",
    organization_id: "HSP-1001",
    organization_name: "City Hospital (Cuttack Specialty Center)",
    organization_type: "hospital",
    relationship_type: "care_provider",
    status: "ACTIVE",
    connected_since: "2026-02-10T11:30:00Z",
  },
  {
    id: "REL-3001",
    patient_id: "PAT-1003",
    organization_id: "HSP-1001",
    organization_name: "City Hospital (Bhubaneswar Main Hub)",
    organization_type: "hospital",
    relationship_type: "care_provider",
    status: "ACTIVE",
    connected_since: "2026-03-05T14:15:00Z",
  },
];

const SEEDED_DOC_RELATIONSHIPS: PatientDoctorRelationship[] = [
  {
    id: "DOC-REL-1001",
    patient_id: "PAT-1001",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    role_title: "Consultant Cardiologist",
    relationship_type: "consulting_doctor",
    status: "ACTIVE",
    connected_since: "2026-01-15T09:30:00Z",
  },
];

export function getAllOrgRelationships(): PatientOrganizationRelationship[] {
  if (typeof window === "undefined") return SEEDED_ORG_RELATIONSHIPS;
  try {
    const raw = localStorage.getItem(ORG_RELATIONSHIPS_KEY);
    if (!raw) {
      localStorage.setItem(ORG_RELATIONSHIPS_KEY, JSON.stringify(SEEDED_ORG_RELATIONSHIPS));
      return SEEDED_ORG_RELATIONSHIPS;
    }
    return JSON.parse(raw) as PatientOrganizationRelationship[];
  } catch (e) {
    return SEEDED_ORG_RELATIONSHIPS;
  }
}

export function getAllDocRelationships(): PatientDoctorRelationship[] {
  if (typeof window === "undefined") return SEEDED_DOC_RELATIONSHIPS;
  try {
    const raw = localStorage.getItem(DOC_RELATIONSHIPS_KEY);
    if (!raw) {
      localStorage.setItem(DOC_RELATIONSHIPS_KEY, JSON.stringify(SEEDED_DOC_RELATIONSHIPS));
      return SEEDED_DOC_RELATIONSHIPS;
    }
    return JSON.parse(raw) as PatientDoctorRelationship[];
  } catch (e) {
    return SEEDED_DOC_RELATIONSHIPS;
  }
}

function saveOrgRelationships(rels: PatientOrganizationRelationship[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORG_RELATIONSHIPS_KEY, JSON.stringify(rels));
    window.dispatchEvent(new Event("medora-relationships-updated"));
  } catch (e) {}
}

/**
 * Returns healthcare organizations connected to a specific patient.
 */
export function getPatientOrganizationRelationships(patientId: string): PatientOrganizationRelationship[] {
  const all = getAllOrgRelationships();
  return all.filter((r) => r.patient_id === patientId);
}

/**
 * Returns healthcare providers connected to a specific patient.
 */
export function getPatientDoctorRelationships(patientId: string): PatientDoctorRelationship[] {
  const all = getAllDocRelationships();
  return all.filter((r) => r.patient_id === patientId);
}

/**
 * Concludes a care relationship without deleting historical records.
 */
export function endPatientRelationship(
  relationshipId: string,
  patientId: string,
  patientName: string = "Patient"
): { success: boolean; error?: string } {
  const all = getAllOrgRelationships();
  const rel = all.find((r) => r.id === relationshipId && r.patient_id === patientId);

  if (!rel) {
    return { success: false, error: "Relationship record not found." };
  }

  rel.status = "ENDED";
  rel.ended_at = new Date().toISOString();
  saveOrgRelationships(all);

  logAuditEvent({
    event_type: "RELATIONSHIP_ENDED",
    actor_id: patientId,
    actor_name: patientName,
    actor_role: "patient",
    patient_id: patientId,
    organization_id: rel.organization_id,
    organization_name: rel.organization_name,
    summary: `Care relationship concluded with ${rel.organization_name}`,
    reference_id: rel.id,
  });

  return { success: true };
}
