// ============================================================
// MEDORA â€” MODIFICATION PHASE C.3 AUTOMATED VERIFICATION SUITE
// Connected Laboratory Order -> Sample -> Report Engine
// ============================================================

import {
  resetLaboratoryStore,
  getAllLabOrders,
  getLabOrderById,
  saveLabOrders,
  getAllSamples,
  getSampleById,
  getAllTestResults,
  getAllLabReports,
  getLabReportById,
  getPatientLabReports,
} from "../lib/data/lab-order-store";
import {
  getAllLabTests,
  getLabTestById,
  searchLabTests,
} from "../lib/data/lab-test-catalog-store";
import { LaboratoryService } from "../lib/services/laboratory-service";
import { findIdentityById, type StoredIdentity } from "../lib/data/identity-store";
import { getAuditLedger } from "../lib/data/audit-store";
import type {
  HealthcareLabOrder,
  SampleType,
  ResultAbnormalFlag,
} from "../types/database.types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  âœ” PASS: ${description}`);
    passedCount++;
  } else {
    console.error(`  âŒ FAIL: ${description}`);
    failedCount++;
  }
}

async function runPhaseC3VerificationSuite() {
  console.log("\n============================================================");
  console.log("MEDORA â€” MODIFICATION PHASE C.3 AUTOMATED VERIFICATION SUITE");
  console.log("CONNECTED LABORATORY ORDER â†’ SAMPLE â†’ REPORT ENGINE");
  console.log("============================================================\n");

  resetLaboratoryStore();

  // Test Personas
  const doc1001 = findIdentityById("DOC-1001") as StoredIdentity;
  const doc1002 = findIdentityById("DOC-1002") as StoredIdentity;
  const pat1001 = findIdentityById("PAT-1001") as StoredIdentity;
  const pat1002 = findIdentityById("PAT-1002") as StoredIdentity;

  const labCollectorActor: StoredIdentity = {
    id: "LAB-COL-1001",
    identifier: "LAB-COL-1001",
    fullName: "Sunil Phlebotomist",
    role: "lab_staff",
    organizationId: "LAB-1001",
    organizationName: "ABC Diagnostics",
    email: "sunil@abcdiagnostics.com",
    passwordHash: "Password@123",
    accountStatus: "active",
    verificationStatus: "verified",
    createdAt: new Date().toISOString(),
  };

  const labTechActor: StoredIdentity = {
    id: "LAB-TECH-1001",
    identifier: "LAB-TECH-1001",
    fullName: "Prakash Technician",
    role: "lab_staff",
    organizationId: "LAB-1001",
    organizationName: "ABC Diagnostics",
    email: "prakash@abcdiagnostics.com",
    passwordHash: "Password@123",
    accountStatus: "active",
    verificationStatus: "verified",
    createdAt: new Date().toISOString(),
  };

  const labPathologistActor: StoredIdentity = {
    id: "LAB-PATH-1001",
    identifier: "LAB-PATH-1001",
    fullName: "Dr. B. Mohapatra, MD (Pathology)",
    role: "lab_staff",
    organizationId: "LAB-1001",
    organizationName: "ABC Diagnostics",
    email: "dr.mohapatra@abcdiagnostics.com",
    passwordHash: "Password@123",
    accountStatus: "active",
    verificationStatus: "verified",
    createdAt: new Date().toISOString(),
  };

  const unauthorizedPatientActor: StoredIdentity = { ...pat1001, role: "patient" };

  // ============================================================
  // TEST GROUP 1: Diagnostic Test Catalog & Parameter Models
  // ============================================================
  console.log("--- TEST GROUP 1: Diagnostic Test Catalog & Parameter Models ---");
  const catalog = getAllLabTests();
  assert(catalog.length >= 7, "Diagnostic test catalog contains realistic standard tests");

  const cbc = getLabTestById("TEST-CBC-001");
  assert(cbc !== null && cbc.test_code === "CBC-01", "Lookup CBC test by ID 'TEST-CBC-001'");
  assert(cbc?.sample_type === "WHOLE_BLOOD", "CBC requires WHOLE_BLOOD sample type");
  assert(
    cbc?.parameters ? cbc.parameters.some((p) => p.name === "Hemoglobin" && p.default_unit === "g/dL") : false,
    "CBC parameter includes Hemoglobin with explicit unit g/dL"
  );

  const kft = getLabTestById("REN-02");
  assert(kft !== null && kft.test_name.includes("Renal"), "Lookup KFT test by code 'REN-02'");
  assert(kft?.sample_type === "SERUM", "KFT requires SERUM specimen type");

  const searchResults = searchLabTests("lipid");
  assert(searchResults.length > 0 && searchResults[0].id === "TEST-LIP-001", "Search catalog by keyword 'lipid'");

  // ============================================================
  // TEST GROUP 2: Doctor Lab Order Invariants & Multi-Test
  // ============================================================
  console.log("\n--- TEST GROUP 2: Doctor Lab Order Invariants & Multi-Test ---");
  const order1001 = getLabOrderById("LAB-ORD-1001");
  assert(order1001 !== null, "Retrieve seeded lab order LAB-ORD-1001");
  assert(order1001?.patient_id === "PAT-1001", "Lab order bound to patient PAT-1001");
  assert(order1001?.encounter_id === "ENC-1001", "Lab order bound to encounter ENC-1001");
  assert(order1001?.ordering_provider_id === "DOC-1001", "Lab order bound to clinician DOC-1001");
  assert((order1001?.items.length || 0) >= 2, "Lab order contains multiple diagnostic tests (Lipid + KFT)");

  // ============================================================
  // TEST GROUP 3: Laboratory Order Intake & Acceptance Lifecycle
  // ============================================================
  console.log("\n--- TEST GROUP 3: Laboratory Order Intake & Acceptance Lifecycle ---");
  // Create a new fresh test order
  const freshOrder: HealthcareLabOrder = {
    id: "LAB-ORD-3001",
    order_reference: "LAB-ORD-3001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1001",
    ordering_provider_id: "DOC-1001",
    ordering_provider_name: "Dr. Ananya Sharma",
    ordering_provider_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    laboratory_id: "LAB-1001",
    laboratory_name: "ABC Diagnostics",
    priority: "ROUTINE",
    reason: "Screening",
    status: "ORDERED",
    items: [
      { id: "LOI-301", test_id: "TEST-CBC-001", test_name: "Complete Blood Count (CBC)", specimen_type: "WHOLE_BLOOD" },
      { id: "LOI-302", test_id: "TEST-URI-001", test_name: "Urinalysis Routine", specimen_type: "URINE" },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const allOrders = getAllLabOrders();
  allOrders.push(freshOrder);
  saveLabOrders(allOrders);

  // Unauthenticated acceptance rejection
  const unauthAccept = LaboratoryService.acceptLabOrder("LAB-ORD-3001", null);
  assert(!unauthAccept.success && unauthAccept.errorCode === "UNAUTHENTICATED", "Rejects unauthenticated order acceptance");

  // Non-lab role acceptance rejection
  const patientAccept = LaboratoryService.acceptLabOrder("LAB-ORD-3001", unauthorizedPatientActor);
  assert(!patientAccept.success && patientAccept.errorCode === "FORBIDDEN", "Rejects patient role from accepting lab order");

  // Valid lab acceptance
  const validAccept = LaboratoryService.acceptLabOrder("LAB-ORD-3001", labCollectorActor);
  assert(validAccept.success && validAccept.data?.status === "ACCEPTED", "Authorized laboratory staff accepts lab order");

  // Rejection with mandatory reason
  const noReasonReject = LaboratoryService.rejectLabOrder("LAB-ORD-3001", "", labCollectorActor);
  assert(!noReasonReject.success && noReasonReject.errorCode === "REASON_REQUIRED", "Rejects order rejection without documented reason");

  // ============================================================
  // TEST GROUP 4: Patient Verification & Sample Collection
  // ============================================================
  console.log("\n--- TEST GROUP 4: Patient Verification & Sample Collection ---");
  // Wrong patient verification mismatch
  const wrongPatientCollect = LaboratoryService.collectSample({
    orderId: "LAB-ORD-3001",
    sampleType: "WHOLE_BLOOD",
    testItemIds: ["LOI-301"],
    patientVerification: {
      patientId: "PAT-1002", // Priya Sharma arriving for Rahul's order
      patientName: "Priya Sharma",
    },
    collectorActor: labCollectorActor,
  });
  assert(
    !wrongPatientCollect.success && wrongPatientCollect.errorCode === "PATIENT_MISMATCH",
    "Wrong patient verification safely REJECTED (Prevents collecting sample under wrong patient)"
  );

  // Correct patient verification for Blood Specimen
  const bloodCollect = LaboratoryService.collectSample({
    orderId: "LAB-ORD-3001",
    sampleType: "WHOLE_BLOOD",
    testItemIds: ["LOI-301"],
    patientVerification: {
      patientId: "PAT-1001",
      patientName: "Rahul Verma",
    },
    collectorActor: labCollectorActor,
  });
  assert(Boolean(bloodCollect.success && bloodCollect.data?.id.startsWith("SMP-")), "Collected Blood specimen with unique sample ID");
  assert(bloodCollect.data?.status === "COLLECTED", "Sample status transitioned to COLLECTED");

  // Multi-sample support: Collect second sample (Urine) for same order
  const urineCollect = LaboratoryService.collectSample({
    orderId: "LAB-ORD-3001",
    sampleType: "URINE",
    testItemIds: ["LOI-302"],
    patientVerification: {
      patientId: "PAT-1001",
      patientName: "Rahul Verma",
    },
    collectorActor: labCollectorActor,
  });
  assert(
    urineCollect.success && urineCollect.data?.id !== bloodCollect.data?.id,
    "Multi-Sample support: Order contains separate Blood and Urine samples with distinct IDs"
  );

  // ============================================================
  // TEST GROUP 5: Sample Intake, Receiving & Rejection/Recollection
  // ============================================================
  console.log("\n--- TEST GROUP 5: Sample Intake, Receiving & Rejection/Recollection ---");
  const bloodSampleId = bloodCollect.data!.id;

  // Receive sample at lab
  const receiveRes = LaboratoryService.receiveSample(bloodSampleId, labCollectorActor);
  assert(receiveRes.success && receiveRes.data?.status === "RECEIVED", "Laboratory receiving staff marks sample RECEIVED");

  // Reject urine sample due to container leak
  const urineSampleId = urineCollect.data!.id;
  const rejectRes = LaboratoryService.rejectSample(
    urineSampleId,
    "CONTAINER_DAMAGED",
    "Container seal broken during transport",
    labCollectorActor
  );
  assert(rejectRes.success && rejectRes.data?.status === "REJECTED", "Sample rejection preserves status REJECTED");
  assert(rejectRes.data?.rejection_reason === "CONTAINER_DAMAGED", "Rejection reason CONTAINER_DAMAGED recorded");

  // Recollect replacement specimen
  const recollectRes = LaboratoryService.recollectSample(urineSampleId, labCollectorActor);
  assert(recollectRes.success && recollectRes.data?.is_recollection === true, "Recollection generated new replacement sample");
  assert(recollectRes.data?.previous_sample_id === urineSampleId, "New sample references rejected previous sample ID");

  // ============================================================
  // TEST GROUP 6: Technician Result Entry vs Pathologist Verification
  // ============================================================
  console.log("\n--- TEST GROUP 6: Technician Result Entry vs Pathologist Verification ---");
  // Wrong sample/order test prevention
  const wrongOrderResult = LaboratoryService.enterTestResults({
    orderId: "LAB-ORD-1001", // Mismatched order
    sampleId: bloodSampleId, // Belongs to LAB-ORD-3001
    results: [{
      testId: "TEST-CBC-001",
      testName: "CBC",
      parameterId: "param-hb",
      parameterName: "Hemoglobin",
      resultType: "NUMERIC",
      value: "14.5",
      unit: "g/dL",
      flag: "NORMAL",
    }],
    techActor: labTechActor,
  });
  assert(
    !wrongOrderResult.success && wrongOrderResult.errorCode === "SAMPLE_ORDER_MISMATCH",
    "Rejects entering results when sample does not match order (Sample-Order mismatch)"
  );

  // Technician enters valid results
  const enterRes = LaboratoryService.enterTestResults({
    orderId: "LAB-ORD-3001",
    sampleId: bloodSampleId,
    results: [
      {
        testId: "TEST-CBC-001",
        testName: "Complete Blood Count (CBC)",
        parameterId: "param-hb",
        parameterName: "Hemoglobin",
        resultType: "NUMERIC",
        value: "14.2",
        numericValue: 14.2,
        unit: "g/dL",
        referenceRange: "13.0 - 17.0 g/dL",
        flag: "NORMAL",
      },
      {
        testId: "TEST-CBC-001",
        testName: "Complete Blood Count (CBC)",
        parameterId: "param-wbc",
        parameterName: "Total Leukocyte Count (WBC)",
        resultType: "NUMERIC",
        value: "8.5",
        numericValue: 8.5,
        unit: "10^3/ÂµL",
        referenceRange: "4.0 - 11.0 10^3/ÂµL",
        flag: "NORMAL",
      },
    ],
    techActor: labTechActor,
  });
  assert(enterRes.success && (enterRes.data?.length || 0) === 2, "Technician entered 2 structured analyte results");
  assert(enterRes.data?.[0].status === "ENTERED", "Result status is ENTERED (Unverified)");

  // Pathologist verification
  const verifyRes = LaboratoryService.verifyTestResults("LAB-ORD-3001", labPathologistActor);
  assert(verifyRes.success && verifyRes.data?.[0].status === "VERIFIED", "Pathologist successfully VERIFIED test results");
  assert(verifyRes.data?.[0].verified_by_id === labPathologistActor.identifier, "Verification records pathologist identity");

  // ============================================================
  // TEST GROUP 7: Certified Report Generation, Versioning & Release
  // ============================================================
  console.log("\n--- TEST GROUP 7: Certified Report Generation, Versioning & Release ---");
  const releaseRes = LaboratoryService.generateAndReleaseReport({
    orderId: "LAB-ORD-3001",
    notes: "CBC results within normal physiological limits.",
    verifierActor: labPathologistActor,
  });
  assert(Boolean(releaseRes.success && releaseRes.data?.id.startsWith("RPT-")), "Generated certified report with unique ID RPT-xxxx");
  assert(releaseRes.data?.status === "RELEASED", "Report status is RELEASED");
  assert(releaseRes.data?.version === 1, "Initial report version is v1");

  const reportId = releaseRes.data!.id;

  // Amend released report with documented clinical reason
  const amendRes = LaboratoryService.amendReport({
    reportId,
    updatedResults: releaseRes.data!.results,
    amendmentReason: "Corrected patient clinical notes annotation.",
    verifierActor: labPathologistActor,
  });
  assert(amendRes.success && amendRes.data?.version === 2, "Amended report incremented version to v2");
  assert((amendRes.data?.version_history?.length || 0) === 1, "Immutable snapshot of Version 1 preserved in version_history");

  // ============================================================
  // TEST GROUP 8: Patient & Doctor Visibility Boundaries
  // ============================================================
  console.log("\n--- TEST GROUP 8: Patient & Doctor Visibility Boundaries ---");
  const rahulReports = getPatientLabReports("PAT-1001", false);
  assert(
    rahulReports.some((r) => r.id === reportId || r.id === "RPT-1001"),
    "Patient PAT-1001 can view released certified reports"
  );

  const priyaReports = getPatientLabReports("PAT-1002", false);
  assert(
    !priyaReports.some((r) => r.id === reportId || r.id === "RPT-1001"),
    "Cross-patient isolation: Patient PAT-1002 CANNOT see Patient PAT-1001's reports (Zero data leakage)"
  );

  // ============================================================
  // TEST GROUP 9: Multi-Facility & Cross-Lab Access Control
  // ============================================================
  console.log("\n--- TEST GROUP 9: Multi-Facility & Cross-Lab Access Control ---");
  const otherLabActor: StoredIdentity = {
    id: "LAB-STAFF-999",
    identifier: "LAB-STAFF-999",
    fullName: "Other Lab Staff",
    role: "lab_staff",
    organizationId: "LAB-9999", // Unrelated lab
    organizationName: "External Lab Ltd",
    email: "staff@externallab.com",
    passwordHash: "Pass@123",
    accountStatus: "active",
    verificationStatus: "verified",
    createdAt: new Date().toISOString(),
  };

  const crossLabAccept = LaboratoryService.acceptLabOrder("LAB-ORD-3001", otherLabActor);
  assert(
    !crossLabAccept.success && crossLabAccept.errorCode === "CROSS_LAB_DENIED",
    "Cross-Laboratory Access Denied: Lab B cannot accept Lab A's orders"
  );

  // ============================================================
  // TEST GROUP 10: Immutable Audit Ledger Logging
  // ============================================================
  console.log("\n--- TEST GROUP 10: Immutable Audit Ledger Logging ---");
  const auditLogs = getAuditLedger();
  assert(
    auditLogs.some((e) => e.event_type === "LAB_ORDER_ACCEPTED"),
    "Audit ledger records LAB_ORDER_ACCEPTED"
  );
  assert(
    auditLogs.some((e) => e.event_type === "SAMPLE_COLLECTED"),
    "Audit ledger records SAMPLE_COLLECTED"
  );
  assert(
    auditLogs.some((e) => e.event_type === "SAMPLE_RECEIVED"),
    "Audit ledger records SAMPLE_RECEIVED"
  );
  assert(
    auditLogs.some((e) => e.event_type === "RESULT_ENTERED"),
    "Audit ledger records RESULT_ENTERED"
  );
  assert(
    auditLogs.some((e) => e.event_type === "RESULT_VERIFIED"),
    "Audit ledger records RESULT_VERIFIED"
  );
  assert(
    auditLogs.some((e) => e.event_type === "REPORT_RELEASED"),
    "Audit ledger records REPORT_RELEASED"
  );
  assert(
    auditLogs.some((e) => e.event_type === "REPORT_AMENDED"),
    "Audit ledger records REPORT_AMENDED"
  );

  // Summary
  console.log("\n============================================================");
  console.log(`PHASE C.3 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhaseC3VerificationSuite().catch((err) => {
  console.error("Test Suite Execution Failed:", err);
  process.exit(1);
});
