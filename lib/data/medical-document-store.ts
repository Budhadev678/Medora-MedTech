// ============================================================
// MEDORA — MEDICAL DOCUMENT DOMAIN STORE (PHASE 4.4)
// Authoritative, provenance-backed medical document management.
// ============================================================

import {
  HealthcareMedicalDocument,
  MedicalDocumentType,
  DocumentSourceType,
  MedicalDocumentStatus,
  DocumentVersionSnapshot,
} from "@/types/database.types";
import { getEncounterById } from "./encounter-store";
import { logAuditEvent } from "./audit-store";

export type {
  HealthcareMedicalDocument,
  MedicalDocumentType,
  DocumentSourceType,
  MedicalDocumentStatus,
  DocumentVersionSnapshot,
};

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 Megabytes

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// Initial Seed Documents
const INITIAL_MEDICAL_DOCUMENTS: HealthcareMedicalDocument[] = [
  {
    id: "DOC-1001",
    document_reference: "DOC-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1001",
    lab_order_id: "LAB-ORD-1001",
    document_type: "LAB_REPORT",
    title: "Complete Blood Count (CBC) Pathology Report",
    description: "NABL-certified hematology automated analyzer report with differential count.",
    source_type: "PROVIDER_GENERATED",
    source_organization_id: "LAB-1001",
    source_organization_name: "ABC Diagnostics Laboratory",
    source_professional_id: "DOC-1001",
    source_professional_name: "Dr. Ananya Sharma",
    source_professional_role: "Consultant Cardiologist",
    storage_reference: "sec-storage://patients/PAT-1001/docs/DOC-1001-cbc.pdf",
    mime_type: "application/pdf",
    file_size_bytes: 342120,
    file_hash_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "ACTIVE",
    version: 1,
    version_history: [],
    created_at: "2026-08-20T10:50:00Z",
    updated_at: "2026-08-20T10:50:00Z",
    created_by_id: "DOC-1001",
    created_by_name: "Dr. Ananya Sharma",
  },
  {
    id: "DOC-1002",
    document_reference: "DOC-1002",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1001",
    clinical_record_id: "CR-1001",
    prescription_id: "RX-1001",
    document_type: "CONSULTATION_NOTE",
    title: "Cardiology Consultation Summary & Clinical Advice",
    description: "Attending clinician evaluation, vital observations, diagnosis (I10), and treatment regimen.",
    source_type: "PROVIDER_GENERATED",
    source_organization_id: "HSP-1001",
    source_organization_name: "City Hospital",
    source_professional_id: "DOC-1001",
    source_professional_name: "Dr. Ananya Sharma",
    source_professional_role: "Consultant Cardiologist",
    storage_reference: "sec-storage://patients/PAT-1001/docs/DOC-1002-consult.pdf",
    mime_type: "application/pdf",
    file_size_bytes: 215400,
    file_hash_sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    status: "ACTIVE",
    version: 1,
    version_history: [],
    created_at: "2026-08-20T10:45:00Z",
    updated_at: "2026-08-20T10:45:00Z",
    created_by_id: "DOC-1001",
    created_by_name: "Dr. Ananya Sharma",
  },
  {
    id: "DOC-1003",
    document_reference: "DOC-1003",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    document_type: "DIAGNOSTIC_REPORT",
    title: "Previous Electrocardiogram (ECG) Tracing — Patient Upload",
    description: "Self-uploaded 12-lead ECG tracing from previous checkup outside network.",
    source_type: "PATIENT_UPLOADED",
    storage_reference: "sec-storage://patients/PAT-1001/docs/DOC-1003-ecg.png",
    mime_type: "image/png",
    file_size_bytes: 845200,
    file_hash_sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    status: "ACTIVE",
    version: 1,
    version_history: [],
    created_at: "2026-08-15T14:30:00Z",
    updated_at: "2026-08-15T14:30:00Z",
    created_by_id: "PAT-1001",
    created_by_name: "Rahul Verma",
  },
];

let medicalDocumentsStore: HealthcareMedicalDocument[] = [...INITIAL_MEDICAL_DOCUMENTS];

function generateDocId(): string {
  const count = medicalDocumentsStore.length + 1001;
  return `DOC-${count}`;
}

// Generate simple mock SHA-256 string for verification
function computeMockHash(title: string, timestamp: string): string {
  let hash = 0;
  const str = `${title}-${timestamp}-${Math.random()}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, "0");
}

export function getAllMedicalDocuments(): HealthcareMedicalDocument[] {
  return [...medicalDocumentsStore];
}

export function getMedicalDocumentById(id: string): HealthcareMedicalDocument | null {
  const doc = medicalDocumentsStore.find((d) => d.id === id || d.document_reference === id);
  return doc ? { ...doc } : null;
}

export function getPatientMedicalDocuments(
  patientId: string,
  includeRevoked: boolean = true
): HealthcareMedicalDocument[] {
  return medicalDocumentsStore
    .filter((d) => d.patient_id === patientId && (includeRevoked || d.status !== "REVOKED"))
    .map((d) => ({ ...d }));
}

export function getEncounterMedicalDocuments(encounterId: string): HealthcareMedicalDocument[] {
  return medicalDocumentsStore
    .filter((d) => d.encounter_id === encounterId)
    .map((d) => ({ ...d }));
}

export function getOrganizationMedicalDocuments(organizationId: string): HealthcareMedicalDocument[] {
  return medicalDocumentsStore
    .filter((d) => d.source_organization_id === organizationId)
    .map((d) => ({ ...d }));
}

export interface CreateDocumentParams {
  patientId: string;
  patientName: string;
  documentType: MedicalDocumentType;
  title: string;
  description?: string;
  sourceType: DocumentSourceType;
  sourceOrganizationId?: string;
  sourceOrganizationName?: string;
  sourceProfessionalId?: string;
  sourceProfessionalName?: string;
  sourceProfessionalRole?: string;
  encounterId?: string;
  clinicalRecordId?: string;
  prescriptionId?: string;
  labOrderId?: string;
  mimeType: string;
  fileSizeBytes: number;
  actorId: string;
  actorName: string;
  actorRole: string;
}

export function createMedicalDocument(params: CreateDocumentParams): {
  success: boolean;
  document?: HealthcareMedicalDocument;
  error?: string;
} {
  if (!params.title || params.title.trim().length === 0) {
    return { success: false, error: "Document title is required." };
  }

  if (!params.patientId) {
    return { success: false, error: "Document must be bound to a valid patient." };
  }

  if (params.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `File size exceeds the 15MB limit (${(params.fileSizeBytes / (1024 * 1024)).toFixed(1)}MB provided).`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(params.mimeType.toLowerCase())) {
    return {
      success: false,
      error: `Unsupported file format '${params.mimeType}'. Allowed formats: PDF, PNG, JPEG, WebP.`,
    };
  }

  // Validate Encounter provenance if provided
  if (params.encounterId) {
    const enc = getEncounterById(params.encounterId);
    if (!enc) {
      return { success: false, error: `Referenced encounter ${params.encounterId} does not exist.` };
    }
  }

  const now = new Date().toISOString();
  const id = generateDocId();
  const extension = params.mimeType.includes("pdf") ? "pdf" : "png";
  const storageRef = `sec-storage://patients/${params.patientId}/docs/${id}.${extension}`;
  const fileHash = computeMockHash(params.title, now);

  const newDoc: HealthcareMedicalDocument = {
    id,
    document_reference: id,
    patient_id: params.patientId,
    patient_name: params.patientName,
    encounter_id: params.encounterId,
    clinical_record_id: params.clinicalRecordId,
    prescription_id: params.prescriptionId,
    lab_order_id: params.labOrderId,
    document_type: params.documentType,
    title: params.title.trim(),
    description: params.description?.trim(),
    source_type: params.sourceType,
    source_organization_id: params.sourceOrganizationId,
    source_organization_name: params.sourceOrganizationName,
    source_professional_id: params.sourceProfessionalId,
    source_professional_name: params.sourceProfessionalName,
    source_professional_role: params.sourceProfessionalRole,
    storage_reference: storageRef,
    mime_type: params.mimeType,
    file_size_bytes: params.fileSizeBytes,
    file_hash_sha256: fileHash,
    status: "ACTIVE",
    version: 1,
    version_history: [],
    created_at: now,
    updated_at: now,
    created_by_id: params.actorId,
    created_by_name: params.actorName,
  };

  medicalDocumentsStore = [newDoc, ...medicalDocumentsStore];

  logAuditEvent({
    event_type: "DOCUMENT_CREATED",
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    patient_id: params.patientId,
    organization_id: params.sourceOrganizationId,
    organization_name: params.sourceOrganizationName,
    summary: `${params.actorName} created medical document ${newDoc.document_reference} (${newDoc.document_type}): "${newDoc.title}".`,
    reference_id: newDoc.id,
    metadata: {
      documentType: newDoc.document_type,
      sourceType: newDoc.source_type,
      fileSize: newDoc.file_size_bytes,
      mimeType: newDoc.mime_type,
    },
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("medora-documents-updated", { detail: { documentId: newDoc.id } }));
  }

  return { success: true, document: { ...newDoc } };
}

export interface UpdateVersionParams {
  documentId: string;
  newTitle?: string;
  newMimeType?: string;
  newFileSizeBytes?: number;
  updateReason: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}

export function updateMedicalDocumentVersion(params: UpdateVersionParams): {
  success: boolean;
  document?: HealthcareMedicalDocument;
  error?: string;
} {
  const index = medicalDocumentsStore.findIndex((d) => d.id === params.documentId);
  if (index === -1) {
    return { success: false, error: `Document ${params.documentId} not found.` };
  }

  const existing = medicalDocumentsStore[index];

  if (existing.status === "REVOKED") {
    return { success: false, error: "Cannot create a new version of a revoked medical document." };
  }

  if (!params.updateReason || params.updateReason.trim().length === 0) {
    return { success: false, error: "Document amendment requires a mandatory documented reason." };
  }

  if (params.newFileSizeBytes && params.newFileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "New file size exceeds the 15MB limit." };
  }

  const now = new Date().toISOString();

  // Snapshot current version
  const snapshot: DocumentVersionSnapshot = {
    version: existing.version,
    title: existing.title,
    storage_reference: existing.storage_reference,
    mime_type: existing.mime_type,
    file_size_bytes: existing.file_size_bytes,
    file_hash_sha256: existing.file_hash_sha256,
    updated_at: now,
    updated_by_id: params.actorId,
    updated_by_name: params.actorName,
    update_reason: params.updateReason.trim(),
  };

  const newVersionNumber = existing.version + 1;
  const newHash = computeMockHash(params.newTitle || existing.title, now);

  const updatedDoc: HealthcareMedicalDocument = {
    ...existing,
    title: params.newTitle ? params.newTitle.trim() : existing.title,
    mime_type: params.newMimeType || existing.mime_type,
    file_size_bytes: params.newFileSizeBytes || existing.file_size_bytes,
    file_hash_sha256: newHash,
    version: newVersionNumber,
    version_history: [...(existing.version_history || []), snapshot],
    updated_at: now,
  };

  medicalDocumentsStore[index] = updatedDoc;

  logAuditEvent({
    event_type: "DOCUMENT_VERSION_CREATED",
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    patient_id: updatedDoc.patient_id,
    organization_id: updatedDoc.source_organization_id,
    summary: `${params.actorName} created version ${newVersionNumber} for document ${updatedDoc.document_reference}. Reason: "${params.updateReason}".`,
    reference_id: updatedDoc.id,
    metadata: {
      previousVersion: existing.version,
      newVersion: newVersionNumber,
      updateReason: params.updateReason,
    },
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("medora-documents-updated", { detail: { documentId: updatedDoc.id } }));
  }

  return { success: true, document: { ...updatedDoc } };
}

export function revokeMedicalDocument(
  documentId: string,
  reason: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; document?: HealthcareMedicalDocument; error?: string } {
  const index = medicalDocumentsStore.findIndex((d) => d.id === documentId);
  if (index === -1) {
    return { success: false, error: `Document ${documentId} not found.` };
  }

  const existing = medicalDocumentsStore[index];
  if (existing.status === "REVOKED") {
    return { success: false, error: "Medical document is already revoked." };
  }

  if (!reason || reason.trim().length === 0) {
    return { success: false, error: "Document revocation requires a mandatory documented reason." };
  }

  const now = new Date().toISOString();

  const revokedDoc: HealthcareMedicalDocument = {
    ...existing,
    status: "REVOKED",
    revocation_reason: reason.trim(),
    revoked_at: now,
    updated_at: now,
  };

  medicalDocumentsStore[index] = revokedDoc;

  logAuditEvent({
    event_type: "DOCUMENT_REVOKED",
    actor_id: actorId,
    actor_name: actorName,
    actor_role: actorRole,
    patient_id: revokedDoc.patient_id,
    organization_id: revokedDoc.source_organization_id,
    summary: `${actorName} revoked document ${revokedDoc.document_reference}. Reason: "${reason}".`,
    reference_id: revokedDoc.id,
    metadata: {
      revocationReason: reason,
    },
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("medora-documents-updated", { detail: { documentId: revokedDoc.id } }));
  }

  return { success: true, document: { ...revokedDoc } };
}

export function generateSecureDocumentAccessToken(
  documentId: string,
  action: "VIEW" | "DOWNLOAD",
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; token?: string; expires_at?: string; error?: string } {
  const doc = getMedicalDocumentById(documentId);
  if (!doc) {
    return { success: false, error: "Document not found." };
  }

  if (doc.status === "REVOKED") {
    return { success: false, error: "This medical document has been revoked and is unavailable." };
  }

  // Anti-IDOR Authorization Check: If caller is a patient, they may only access their own documents
  if (actorRole === "patient") {
    const cleanActorId = actorId.toLowerCase();
    const cleanDocPatientId = doc.patient_id.toLowerCase();
    if (cleanDocPatientId !== cleanActorId) {
      return { success: false, error: "You are not authorized to access this medical document." };
    }
  }

  const timestamp = Date.now();
  const token = `medora-signed-doc-${documentId}-${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
  const expires_at = new Date(timestamp + 3600000).toISOString(); // 1 hour expiration

  logAuditEvent({
    event_type: action === "DOWNLOAD" ? "DOCUMENT_DOWNLOADED" : "DOCUMENT_VIEWED",
    actor_id: actorId,
    actor_name: actorName,
    actor_role: actorRole,
    patient_id: doc.patient_id,
    organization_id: doc.source_organization_id,
    summary: `${actorName} ${action === "DOWNLOAD" ? "downloaded" : "viewed"} document ${doc.document_reference} (${doc.title}).`,
    reference_id: doc.id,
    metadata: {
      action,
      documentType: doc.document_type,
    },
  });

  return { success: true, token, expires_at };
}
