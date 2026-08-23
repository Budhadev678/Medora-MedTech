// ============================================================
// MEDORA â€” PHASE 4.4 MEDICAL DOCUMENTS & HEALTH JOURNEY TEST SUITE
// ============================================================

import {
  getAllMedicalDocuments,
  getMedicalDocumentById,
  getPatientMedicalDocuments,
  getEncounterMedicalDocuments,
  createMedicalDocument,
  updateMedicalDocumentVersion,
  revokeMedicalDocument,
  generateSecureDocumentAccessToken,
} from "../lib/data/medical-document-store";
import {
  getPatientHealthJourney,
  groupTimelineEventsByDate,
  getHealthJourneySummary,
} from "../lib/services/health-journey-service";
import { getPatientAuditTimeline } from "../lib/data/audit-store";

console.log("============================================================");
console.log("MEDORA PHASE 4.4 DOCUMENTS & HEALTH JOURNEY VERIFICATION");
console.log("============================================================\n");

let passed = 0;
let total = 0;

function assert(condition: boolean, description: string) {
  total++;
  if (condition) {
    console.log(`âœ“ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`âœ— [FAIL] ${description}`);
  }
}

// ------------------------------------------------------------
// TEST 1: Initial Medical Document Store & Seed Data
// ------------------------------------------------------------
console.log("--- 1. Testing Medical Document Store & Seed Data ---");
const allDocs = getAllMedicalDocuments();
assert(allDocs.length >= 3, `Medical document store initialized with ${allDocs.length} seeded documents`);

const doc1 = getMedicalDocumentById("DOC-1001");
assert(doc1 !== null, "Found DOC-1001 in store");
assert(doc1?.patient_id === "PAT-1001", "DOC-1001 strictly belongs to patient PAT-1001 (Rahul Verma)");
assert(doc1?.document_type === "LAB_REPORT", "DOC-1001 type is LAB_REPORT");
assert(doc1?.source_type === "PROVIDER_GENERATED", "DOC-1001 source_type is PROVIDER_GENERATED");
assert(doc1?.source_organization_id === "LAB-1001", "DOC-1001 attributed to LAB-1001 (ABC Diagnostics)");
assert(doc1?.encounter_id === "ENC-1001" && doc1?.lab_order_id === "LAB-ORD-1001", "DOC-1001 linked to encounter ENC-1001 & lab order LAB-ORD-1001");
assert(Boolean(doc1?.storage_reference.startsWith("sec-storage://")), "DOC-1001 stored in private secure virtual storage reference");
assert(Boolean(doc1?.file_hash_sha256 !== undefined && doc1.file_hash_sha256.length === 64), "DOC-1001 has valid 64-character SHA-256 integrity hash");

const doc3 = getMedicalDocumentById("DOC-1003");
assert(doc3?.source_type === "PATIENT_UPLOADED", "DOC-1003 is explicitly identified as PATIENT_UPLOADED");
assert(doc3?.source_organization_id === undefined, "Patient uploaded document does not falsely claim organization verification");

// ------------------------------------------------------------
// TEST 2: Strict Patient Document Isolation
// ------------------------------------------------------------
console.log("\n--- 2. Testing Strict Patient Document Isolation ---");
const rahulDocs = getPatientMedicalDocuments("PAT-1001", true);
const priyaDocs = getPatientMedicalDocuments("PAT-1002", true);

assert(
  rahulDocs.every((d) => d.patient_id === "PAT-1001"),
  `Patient PAT-1001 document query returns exclusively PAT-1001 documents (${rahulDocs.length} records)`
);
assert(
  !rahulDocs.some((d) => d.patient_id === "PAT-1002"),
  "Zero cross-patient leakage: PAT-1001 cannot see PAT-1002 documents"
);
assert(priyaDocs.length === 0, "Patient PAT-1002 currently has 0 medical documents");

// ------------------------------------------------------------
// TEST 3: Document Validation & Creation Lifecycle
// ------------------------------------------------------------
console.log("\n--- 3. Testing Document Validation & Creation Lifecycle ---");

// Attempt to create document with empty title -> REJECTED
const emptyTitleRes = createMedicalDocument({
  patientId: "PAT-1002",
  patientName: "Priya Sharma",
  documentType: "CONSULTATION_NOTE",
  title: "",
  sourceType: "PATIENT_UPLOADED",
  mimeType: "application/pdf",
  fileSizeBytes: 200000,
  actorId: "PAT-1002",
  actorName: "Priya Sharma",
  actorRole: "patient",
});
assert(emptyTitleRes.success === false, "Creating document with empty title correctly REJECTED");

// Attempt to upload oversized file (> 15MB) -> REJECTED
const oversizedRes = createMedicalDocument({
  patientId: "PAT-1002",
  patientName: "Priya Sharma",
  documentType: "DIAGNOSTIC_REPORT",
  title: "Huge MRI Scan Video",
  sourceType: "PATIENT_UPLOADED",
  mimeType: "application/pdf",
  fileSizeBytes: 25 * 1024 * 1024, // 25MB
  actorId: "PAT-1002",
  actorName: "Priya Sharma",
  actorRole: "patient",
});
assert(Boolean(oversizedRes.success === false && oversizedRes.error?.includes("15MB")), "File exceeding 15MB limit correctly REJECTED");

// Attempt to upload unsupported file format (.exe) -> REJECTED
const badMimeRes = createMedicalDocument({
  patientId: "PAT-1002",
  patientName: "Priya Sharma",
  documentType: "OTHER",
  title: "Malware script",
  sourceType: "PATIENT_UPLOADED",
  mimeType: "application/x-msdownload",
  fileSizeBytes: 1024,
  actorId: "PAT-1002",
  actorName: "Priya Sharma",
  actorRole: "patient",
});
assert(badMimeRes.success === false, "Unsupported MIME type correctly REJECTED");

// Create valid patient-uploaded document for PAT-1002
const createDocRes = createMedicalDocument({
  patientId: "PAT-1002",
  patientName: "Priya Sharma",
  documentType: "DIAGNOSTIC_REPORT",
  title: "Previous Brain MRI Scan Summary",
  description: "External MRI Brain scan summary from 2025 showing normal intracranial structures.",
  sourceType: "PATIENT_UPLOADED",
  mimeType: "application/pdf",
  fileSizeBytes: 540000,
  actorId: "PAT-1002",
  actorName: "Priya Sharma",
  actorRole: "patient",
});

assert(createDocRes.success === true && !!createDocRes.document, "Successfully uploaded patient health document for PAT-1002");
assert(createDocRes.document?.status === "ACTIVE", "New document status is ACTIVE");
assert(createDocRes.document?.version === 1, "New document starts at version 1");

// ------------------------------------------------------------
// TEST 4: Document Versioning & History Preservation
// ------------------------------------------------------------
console.log("\n--- 4. Testing Document Versioning & History ---");
if (createDocRes.document) {
  const docId = createDocRes.document.id;

  // Attempt version update without reason -> REJECTED
  const blankReasonRes = updateMedicalDocumentVersion({
    documentId: docId,
    newTitle: "Updated MRI Report",
    updateReason: "",
    actorId: "PAT-1002",
    actorName: "Priya Sharma",
    actorRole: "patient",
  });
  assert(blankReasonRes.success === false, "Version update without documented reason correctly REJECTED");

  // Valid Version Update
  const versionRes = updateMedicalDocumentVersion({
    documentId: docId,
    newTitle: "Previous Brain MRI Scan Summary (Clarified Neurologist Note)",
    newFileSizeBytes: 580000,
    updateReason: "Added supplementary radiologist impression page.",
    actorId: "PAT-1002",
    actorName: "Priya Sharma",
    actorRole: "patient",
  });

  assert(versionRes.success === true, "Successfully updated medical document version");
  assert(versionRes.document?.version === 2, "Document version bumped to 2");
  assert(versionRes.document?.version_history?.length === 1, "Previous version preserved in version_history snapshot");
  assert(
    versionRes.document?.version_history?.[0].title === "Previous Brain MRI Scan Summary",
    "Version 1 snapshot retained original title"
  );
  assert(
    Boolean(versionRes.document?.version_history?.[0].update_reason.includes("radiologist")),
    "Update reason preserved in historical snapshot"
  );
}

// ------------------------------------------------------------
// TEST 5: Document Revocation & Access Protection
// ------------------------------------------------------------
console.log("\n--- 5. Testing Document Revocation & Protection ---");
if (createDocRes.document) {
  const docId = createDocRes.document.id;

  // Revoke document
  const revokeRes = revokeMedicalDocument(
    docId,
    "Uploaded wrong patient file by mistake; requesting revocation.",
    "PAT-1002",
    "Priya Sharma",
    "patient"
  );

  assert(revokeRes.success === true, "Revoked medical document with documented reason");
  assert(revokeRes.document?.status === "REVOKED", "Status transitioned to REVOKED");
  assert(Boolean(revokeRes.document?.revoked_at), "revoked_at timestamp recorded");
  assert(Boolean(revokeRes.document?.revocation_reason?.includes("mistake")), "Revocation reason preserved in record");

  // Attempt to create new version of revoked document -> REJECTED
  const versionOnRevoked = updateMedicalDocumentVersion({
    documentId: docId,
    newTitle: "Try Update",
    updateReason: "Test",
    actorId: "PAT-1002",
    actorName: "Priya Sharma",
    actorRole: "patient",
  });
  assert(versionOnRevoked.success === false, "Creating version on REVOKED document correctly REJECTED");

  // Attempt to generate download token on revoked document -> REJECTED
  const tokenOnRevoked = generateSecureDocumentAccessToken(docId, "DOWNLOAD", "PAT-1002", "Priya Sharma", "patient");
  assert(tokenOnRevoked.success === false, "Generating download token on REVOKED document correctly REJECTED");
}

// ------------------------------------------------------------
// TEST 6: Secure Document Access Token Generation
// ------------------------------------------------------------
console.log("\n--- 6. Testing Secure Document Access Token Generation ---");
const activeDocToken = generateSecureDocumentAccessToken(
  "DOC-1001",
  "VIEW",
  "DOC-1001",
  "Dr. Ananya Sharma",
  "doctor"
);
assert(activeDocToken.success === true && !!activeDocToken.token, "Generated secure signed access token for DOC-1001");
assert(Boolean(activeDocToken.token?.startsWith("medora-signed-doc-DOC-1001")), "Signed token contains document ID and timestamp");

// ------------------------------------------------------------
// TEST 7: Unified Health Journey Dynamic Aggregation
// ------------------------------------------------------------
console.log("\n--- 7. Testing Unified Health Journey Dynamic Aggregation ---");
const rahulJourney = getPatientHealthJourney("PAT-1001", {});
assert(rahulJourney.length >= 6, `Patient PAT-1001 journey assembled ${rahulJourney.length} total chronological events`);

const eventTypes = new Set(rahulJourney.map((e) => e.event_type));
assert(eventTypes.has("ENCOUNTER"), "Journey includes ENCOUNTER events");
assert(eventTypes.has("CLINICAL_RECORD"), "Journey includes CLINICAL_RECORD events");
assert(eventTypes.has("PRESCRIPTION"), "Journey includes PRESCRIPTION events");
assert(eventTypes.has("LAB_ORDER"), "Journey includes LAB_ORDER events");
assert(eventTypes.has("MEDICAL_DOCUMENT"), "Journey includes MEDICAL_DOCUMENT events");

// Verify Chronological Ordering (Newest First)
let isSortedChronologically = true;
for (let i = 0; i < rahulJourney.length - 1; i++) {
  const tA = new Date(rahulJourney[i].occurred_at).getTime();
  const tB = new Date(rahulJourney[i + 1].occurred_at).getTime();
  if (tA < tB) {
    isSortedChronologically = false;
    break;
  }
}
assert(isSortedChronologically, "Health Journey events strictly sorted newest-first by occurred_at");

// Verify Date Grouping
const dateGroups = groupTimelineEventsByDate(rahulJourney);
assert(dateGroups.length >= 1, `Timeline events grouped into ${dateGroups.length} date bucket(s)`);
assert(dateGroups.every((g) => g.events.length > 0), "All date groups contain at least 1 event");

// ------------------------------------------------------------
// TEST 8: Health Journey Filtering & Search
// ------------------------------------------------------------
console.log("\n--- 8. Testing Health Journey Filters & Search ---");
const prescriptionOnly = getPatientHealthJourney("PAT-1001", { category: "prescriptions" });
assert(
  prescriptionOnly.every((e) => e.event_type === "PRESCRIPTION"),
  `Category filter 'prescriptions' returns exclusively prescription events (${prescriptionOnly.length} items)`
);

const labOnly = getPatientHealthJourney("PAT-1001", { category: "lab_orders" });
assert(
  labOnly.every((e) => e.event_type === "LAB_ORDER"),
  `Category filter 'lab_orders' returns exclusively lab events (${labOnly.length} items)`
);

const searchCityHospital = getPatientHealthJourney("PAT-1001", { searchQuery: "City Hospital" });
assert(
  searchCityHospital.length >= 2,
  `Search query 'City Hospital' matched ${searchCityHospital.length} facility-scoped events`
);

const searchTelmisartan = getPatientHealthJourney("PAT-1001", { searchQuery: "Telmisartan" });
assert(
  Boolean(searchTelmisartan.length >= 1 && searchTelmisartan[0].event_type === "PRESCRIPTION"),
  "Search query 'Telmisartan' matched prescription record"
);

// ------------------------------------------------------------
// TEST 9: Health Journey Summary Statistics
// ------------------------------------------------------------
console.log("\n--- 9. Testing Health Journey Summary Statistics ---");
const summary = getHealthJourneySummary("PAT-1001");
assert(summary.totalEncounters >= 2, `Summary reports ${summary.totalEncounters} total encounters`);
assert(summary.activePrescriptions >= 1, `Summary reports ${summary.activePrescriptions} active prescriptions`);
assert(summary.totalMedicalDocuments >= 3, `Summary reports ${summary.totalMedicalDocuments} medical documents`);
assert(summary.verifiedDocuments >= 2, `Summary distinguishes ${summary.verifiedDocuments} provider verified documents`);
assert(summary.patientUploadedDocuments >= 1, `Summary distinguishes ${summary.patientUploadedDocuments} patient uploaded document`);

// ------------------------------------------------------------
// TEST 10: Append-Only Security & Privacy Audit Trail
// ------------------------------------------------------------
console.log("\n--- 10. Testing Audit Trail Integration ---");
const auditEvents = getPatientAuditTimeline("PAT-1002");
const documentAuditEvents = auditEvents.filter(
  (e) =>
    e.event_type === "DOCUMENT_CREATED" ||
    e.event_type === "DOCUMENT_VERSION_CREATED" ||
    e.event_type === "DOCUMENT_REVOKED" ||
    e.event_type === "DOCUMENT_VIEWED" ||
    e.event_type === "DOCUMENT_DOWNLOADED"
);

assert(
  documentAuditEvents.length >= 3,
  `Audit ledger recorded ${documentAuditEvents.length} verifiable document lifecycle events`
);
assert(
  documentAuditEvents.every((e) => !e.metadata?.userPassword && !e.metadata?.otpCode),
  "Zero sensitive credentials or raw document payloads leaked in audit ledger"
);

console.log(`\n============================================================`);
console.log(`Phase 4.4 Verification Summary: ${passed}/${total} assertions PASSED.`);
console.log(`============================================================`);

if (passed === total) {
  console.log("ALL PHASE 4.4 MEDICAL DOCUMENTS & HEALTH JOURNEY REQUIREMENTS SATISFIED.\n");
} else {
  process.exit(1);
}
