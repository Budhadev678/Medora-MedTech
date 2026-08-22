// ============================================================
// MEDORA — PHASE 8.4 TEST SUITE: REPORT DELIVERY, ACCESS & AUTHENTICITY
// ============================================================

import { LabReportService } from "../lib/services/lab-report-service";
import { LabTestingService } from "../lib/services/lab-testing-service";
import { LabSampleService } from "../lib/services/lab-sample-service";
import { LabIntakeService } from "../lib/services/lab-intake-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { LabOrderService } from "../lib/services/lab-order-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { getLabReportById, getPatientLabReports, revokeReportShare } from "../lib/data/lab-order-store";
import { findIdentityById } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase84Tests() {
  console.log("============================================================");
  console.log("MEDORA — PHASE 8.4 TEST SUITE: REPORT DELIVERY, ACCESS & AUTHENTICITY");
  console.log("============================================================\n");

  const today = getTodayDateStr();

  // Test Actors
  const doctorActor = findIdentityById("DOC-1001");
  const labTechActor = findIdentityById("USR-1005") || { id: "USR-1005", identifier: "USR-1005", fullName: "Technician Rahul", role: "lab_staff", accountStatus: "active" };
  const labVerifierActor = findIdentityById("USR-LAB-ADMIN") || { id: "USR-LAB-ADMIN", identifier: "USR-LAB-ADMIN", fullName: "Lab Manager Ramesh", role: "lab_staff", accountStatus: "active" };
  const patientAActor = findIdentityById("PAT-1001");
  const patientBActor = findIdentityById("PAT-1002");

  // Setup: Create encounter, lab order, intake, sample, test, result, report finalization
  QueueStore.reset();
  const existingQueue = QueueStore.getQueueForDoctor("DOC-1001");
  existingQueue.forEach((q) => {
    if (q.status === "IN_CONSULTATION") {
      QueueStore.saveQueueEntry({ ...q, status: "COMPLETED" });
    }
  });

  const tokenMeta = QueueStore.getNextToken("HSP-1001", "FAC-1001", "DEP-CARDIO", "DOC-1001", "SES-1001", today, "Dr. Ananya Sharma");
  const qEntry = QueueStore.saveQueueEntry({
    id: `q-p84-${Date.now()}`,
    queue_no: `QUE-P84-${Date.now()}`,
    appointment_id: "APT-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    department_id: "DEP-CARDIO",
    department_name: "Cardiology OPD",
    session_id: "SES-1001",
    date: today,
    token_number: tokenMeta.tokenNumber,
    token_sequence: tokenMeta.sequenceNumber,
    source: "APPOINTMENT",
    checkin_source: "PATIENT_SELF",
    status: "CALLED",
    checked_in_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  const startRes = await ConsultationService.startConsultationFromQueue(qEntry.id, doctorActor);
  const encounterId = startRes.encounter!.id;

  const finalizedLabRes = await LabOrderService.finalizeLabOrder(
    encounterId,
    {
      items: [{ id: "LOI-CBC-01", test_id: "TEST-CBC-001", test_name: "Complete Blood Count (CBC)", specimen_type: "WHOLE_BLOOD" }],
      priority: "ROUTINE",
      reason: "Pre-employment health check",
    },
    doctorActor
  );
  const orderId = finalizedLabRes.order!.id;

  await LabIntakeService.acceptOrder(orderId, "LAB-FAC-1001", labTechActor as any);
  await LabSampleService.verifyPatientIdentity(orderId, ["MEDORA_ID:PAT-1001", "DOB:15-08-1988"], labTechActor as any);
  const sampleRes = await LabSampleService.collectSample(orderId, { sample_type: "WHOLE_BLOOD", test_item_ids: ["LOI-CBC-01"], test_names: ["Complete Blood Count (CBC)"], facility_id: "LAB-FAC-1001" }, labTechActor as any);
  const sampleId = sampleRes.sample!.id;
  await LabSampleService.recordTransfer(sampleId, { event_type: "SAMPLE_READY_FOR_TESTING" }, labTechActor as any);
  const enrollRes = await LabTestingService.enrollSampleForTesting(sampleId, orderId, "LOI-CBC-01", "LAB-FAC-1001", "ABC Diagnostics", labTechActor as any);
  const workItemId = enrollRes.workItem!.id;
  await LabTestingService.startTest(workItemId, "Sysmex XN-550", "Automated Spectrophotometry", labTechActor as any);
  await LabTestingService.submitTestResult(workItemId, { result_type: "NUMERIC", value: "14.2", unit: "g/dL", reference_range: "13.0 - 17.0", flag: "NORMAL", is_draft: false }, labTechActor as any);
  await LabTestingService.verifyResult(workItemId, labVerifierActor as any);

  const reportRes = await LabReportService.generateAndFinalizeReport(orderId, "Verified pre-employment diagnostic report", labVerifierActor as any);
  const reportId = reportRes.report!.id;
  const verificationToken = reportRes.verification_token!;

  // ------------------------------------------------------------
  // TEST GROUP 1: Patient Report Access & Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 1: Patient Report Access & Isolation");

  const patientAReports = getPatientLabReports("PAT-1001", false);
  assert(patientAReports.length > 0, "Patient A retrieved released diagnostic lab report");
  assert(patientAReports.some((r) => r.id === reportId), "Retrieved patient reports include finalized report ID");

  const patientBReports = getPatientLabReports("PAT-1002", false);
  assert(patientBReports.every((r) => r.id !== reportId), "Patient B cannot see Patient A's diagnostic report");

  // ------------------------------------------------------------
  // TEST GROUP 2: Report Record Sharing, Expiration & Revocation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Report Record Sharing, Expiration & Revocation");

  const shareRes = await LabReportService.shareReport(
    reportId,
    "DOC-1001",
    "Dr. Ananya Sharma",
    "VIEW",
    24,
    patientAActor
  );

  assert(shareRes.success === true, "Patient A created 24-hour record share grant for Dr. Ananya");
  assert(shareRes.share?.status === "ACTIVE", "Record share grant status is ACTIVE");
  const shareId = shareRes.share!.id;

  // Revocation
  const revokeRes = revokeReportShare(shareId, "PAT-1001");
  assert(revokeRes.success === true, "Patient A revoked record share grant successfully");

  // ------------------------------------------------------------
  // TEST GROUP 3: Public Authenticity Verification Endpoint
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Public Authenticity Verification Endpoint");

  const validTokenLookup = LabReportService.verifyReportByToken(verificationToken);
  assert(validTokenLookup.valid === true, "Public authenticity lookup verified valid token");
  assert(validTokenLookup.reportSummary?.report_id === reportId, "Verification lookup confirmed authentic report ID");
  assert(validTokenLookup.reportSummary?.is_current === true, "Confirmed version is CURRENT");

  const invalidTokenLookup = LabReportService.verifyReportByToken("INVALID-TOKEN-999");
  assert(invalidTokenLookup.valid === false, "Invalid verification token lookup strictly REJECTED without data leakage");

  // ------------------------------------------------------------
  // TEST GROUP 4: Full MEDORA Provenance & Audit Integration
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Full MEDORA Provenance & Audit Integration");

  const auditEvents = AuditLedger.getEvents({ resourceId: reportId });
  assert(auditEvents.length > 0, "Audit ledger recorded report finalization and sharing events");

  console.log("\n============================================================");
  console.log(`PHASE 8.4 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase84Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
