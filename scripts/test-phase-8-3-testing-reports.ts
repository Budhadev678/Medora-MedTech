// ============================================================
// MEDORA — PHASE 8.3 TEST SUITE: TESTING, RESULT ENTRY & REPORT GENERATION
// ============================================================

import { LabTestingService } from "../lib/services/lab-testing-service";
import { LabReportService } from "../lib/services/lab-report-service";
import { LabSampleService } from "../lib/services/lab-sample-service";
import { LabIntakeService } from "../lib/services/lab-intake-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { LabOrderService } from "../lib/services/lab-order-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { getTestWorkItemById } from "../lib/data/lab-testing-store";
import { getOrderTestResults, getLabReportById } from "../lib/data/lab-order-store";
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

async function runPhase83Tests() {
  console.log("============================================================");
  console.log("MEDORA — PHASE 8.3 TEST SUITE: TESTING, RESULT ENTRY & REPORT GENERATION");
  console.log("============================================================\n");

  const today = getTodayDateStr();

  // Test Actors
  const doctorActor = findIdentityById("DOC-1001");
  const labTechActor = findIdentityById("USR-1005") || {
    id: "USR-1005",
    identifier: "USR-1005",
    fullName: "Technician Rahul",
    role: "lab_staff",
    accountStatus: "active",
  };
  const labVerifierActor = findIdentityById("USR-LAB-ADMIN") || {
    id: "USR-LAB-ADMIN",
    identifier: "USR-LAB-ADMIN",
    fullName: "Lab Manager Ramesh",
    role: "lab_staff",
    accountStatus: "active",
  };

  assert(Boolean(doctorActor), "Resolved Prescribing Doctor (DOC-1001)");

  // Setup: Create encounter, lab order, intake acceptance, sample collection & custody transfer
  QueueStore.reset();
  const existingQueue = QueueStore.getQueueForDoctor("DOC-1001");
  existingQueue.forEach((q) => {
    if (q.status === "IN_CONSULTATION") {
      QueueStore.saveQueueEntry({ ...q, status: "COMPLETED" });
    }
  });

  const tokenMeta = QueueStore.getNextToken("HSP-1001", "FAC-1001", "DEP-CARDIO", "DOC-1001", "SES-1001", today, "Dr. Ananya Sharma");
  const qEntry = QueueStore.saveQueueEntry({
    id: `q-p83-${Date.now()}`,
    queue_no: `QUE-P83-${Date.now()}`,
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
      reason: "Post-op blood count verification",
    },
    doctorActor
  );
  const orderId = finalizedLabRes.order!.id;

  await LabIntakeService.acceptOrder(orderId, "LAB-FAC-1001", labTechActor as any);
  await LabSampleService.verifyPatientIdentity(orderId, ["MEDORA_ID:PAT-1001", "DOB:15-08-1988"], labTechActor as any);
  const sampleRes = await LabSampleService.collectSample(
    orderId,
    {
      sample_type: "WHOLE_BLOOD",
      test_item_ids: ["LOI-CBC-01"],
      test_names: ["Complete Blood Count (CBC)"],
      facility_id: "LAB-FAC-1001",
    },
    labTechActor as any
  );
  const sampleId = sampleRes.sample!.id;
  await LabSampleService.recordTransfer(sampleId, { event_type: "SAMPLE_READY_FOR_TESTING" }, labTechActor as any);

  // ------------------------------------------------------------
  // TEST GROUP 1: Test Work Item Creation & Worklist Enrollment
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 1: Test Work Item Creation & Worklist Enrollment");

  const enrollRes = await LabTestingService.enrollSampleForTesting(
    sampleId,
    orderId,
    "LOI-CBC-01",
    "LAB-FAC-1001",
    "ABC Diagnostics — Rourkela Central Lab",
    labTechActor as any
  );
  assert(enrollRes.success === true, "Enrolled ready sample into test worklist");
  assert(Boolean(enrollRes.workItem), "Server created authoritative TestWorkItem entity");
  const workItemId = enrollRes.workItem!.id;

  // ------------------------------------------------------------
  // TEST GROUP 2: Test Start Processing & Idempotency
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Test Start Processing & Idempotency");

  const startTestRes = await LabTestingService.startTest(workItemId, "Sysmex XN-550", "Automated Spectrophotometry", labTechActor as any);
  assert(startTestRes.success === true, "Technician started test processing");
  assert(startTestRes.workItem?.status === "IN_PROGRESS", "Work item status updated to IN_PROGRESS");

  // Idempotent re-invocation test
  const startTestRes2 = await LabTestingService.startTest(workItemId, "Sysmex XN-550", "Automated Spectrophotometry", labTechActor as any);
  assert(startTestRes2.success === true && startTestRes2.workItem?.status === "IN_PROGRESS", "Double-click start test returned same in-progress work item");

  // ------------------------------------------------------------
  // TEST GROUP 3: Result Entry & Server Validation Rules
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Result Entry & Server Validation Rules");

  // Invalid numeric value validation block test
  const invalidNumericRes = await LabTestingService.submitTestResult(
    workItemId,
    {
      result_type: "NUMERIC",
      value: "abc_invalid",
      unit: "g/dL",
      is_draft: false,
    },
    labTechActor as any
  );
  assert(invalidNumericRes.success === false, "Invalid non-numeric input for NUMERIC test strictly BLOCKED");

  // Valid numeric result submission
  const validResultRes = await LabTestingService.submitTestResult(
    workItemId,
    {
      result_type: "NUMERIC",
      value: "14.2",
      unit: "g/dL",
      reference_range: "13.0 - 17.0",
      flag: "NORMAL",
      is_draft: false,
    },
    labTechActor as any
  );
  assert(validResultRes.success === true, "Valid result submitted successfully");
  assert(validResultRes.result?.status === "ENTERED", "Result status is ENTERED (Unverified)");

  // ------------------------------------------------------------
  // TEST GROUP 4: Result Versioning & Controlled Correction
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Result Versioning & Controlled Correction");

  const correctionRes = await LabTestingService.submitTestResult(
    workItemId,
    {
      result_type: "NUMERIC",
      value: "14.5",
      unit: "g/dL",
      reference_range: "13.0 - 17.0",
      flag: "NORMAL",
      is_draft: false,
      correction_reason: "Analyzer recalibration correction",
    },
    labTechActor as any
  );

  assert(correctionRes.success === true, "Corrected result value submitted");
  assert(correctionRes.result?.version === 2, "Result version incremented to V2");
  assert(correctionRes.result?.version_history?.length === 1, "Preserved original V1 in version history log");

  // ------------------------------------------------------------
  // TEST GROUP 5: Authorized Verification & Self-Approval Prevention
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Authorized Verification & Self-Approval Prevention");

  // Self-verification block test
  const selfVerifyRes = await LabTestingService.verifyResult(workItemId, labTechActor as any);
  assert(selfVerifyRes.success === false, "Technician self-verifying own result strictly BLOCKED");

  // Verifier approval test
  const verifierRes = await LabTestingService.verifyResult(workItemId, labVerifierActor as any);
  assert(verifierRes.success === true, "Authorized verifier verified result");
  assert(verifierRes.result?.status === "VERIFIED", "Result status updated to VERIFIED");

  // ------------------------------------------------------------
  // TEST GROUP 6: Diagnostic Report Finalization
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Diagnostic Report Finalization");

  const reportRes = await LabReportService.generateAndFinalizeReport(orderId, "Normal baseline blood count", labVerifierActor as any);
  assert(reportRes.success === true, "Compiled & finalized diagnostic lab report from verified results");
  assert(Boolean(reportRes.report), "Generated authoritative HealthcareLabReport entity");
  assert(reportRes.report?.status === "RELEASED", "Report status is RELEASED / FINALIZED");
  assert(Boolean(reportRes.verification_token), "Emitted report authenticity token");

  console.log("\n============================================================");
  console.log(`PHASE 8.3 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase83Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
