// ============================================================
// MEDORA â€” PHASE 8.2 TEST SUITE: PATIENT VERIFICATION, SAMPLE COLLECTION & CUSTODY
// ============================================================

import { LabSampleService } from "../lib/services/lab-sample-service";
import { LabIntakeService } from "../lib/services/lab-intake-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { LabOrderService } from "../lib/services/lab-order-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { getSampleById, getSampleCustodyEvents } from "../lib/data/lab-sample-store";
import { findIdentityById } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  âœ“ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  âŒ FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase82Tests() {
  console.log("============================================================");
  console.log("MEDORA â€” PHASE 8.2 TEST SUITE: SAMPLE COLLECTION & CHAIN OF CUSTODY");
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
  const patientAActor = findIdentityById("PAT-1001");
  const patientBActor = findIdentityById("PAT-1002");

  assert(Boolean(doctorActor), "Resolved Prescribing Doctor (DOC-1001)");

  // Setup: Create encounter, lab order & intake acceptance
  QueueStore.reset();
  const existingQueue = QueueStore.getQueueForDoctor("DOC-1001");
  existingQueue.forEach((q) => {
    if (q.status === "IN_CONSULTATION") {
      QueueStore.saveQueueEntry({ ...q, status: "COMPLETED" });
    }
  });

  const tokenMeta = QueueStore.getNextToken("HSP-1001", "FAC-1001", "DEP-CARDIO", "DOC-1001", "SES-1001", today, "Dr. Ananya Sharma");
  const qEntry = QueueStore.saveQueueEntry({
    id: `q-smp-${Date.now()}`,
    queue_no: `QUE-SMP-${Date.now()}`,
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
      reason: "Baseline metabolic screening",
    },
    doctorActor
  );
  const orderId = finalizedLabRes.order!.id;

  await LabIntakeService.acceptOrder(orderId, "LAB-FAC-1001", labTechActor as any);

  // ------------------------------------------------------------
  // TEST GROUP 1: Two-Point Patient Identity Verification
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 1: Two-Point Patient Identity Verification");

  const singlePointVerify = await LabSampleService.verifyPatientIdentity(orderId, ["MEDORA_ID:PAT-1001"], labTechActor as any);
  assert(singlePointVerify.success === false, "Single-point patient verification REJECTED");

  const twoPointVerify = await LabSampleService.verifyPatientIdentity(orderId, ["MEDORA_ID:PAT-1001", "DOB:15-08-1988"], labTechActor as any);
  assert(twoPointVerify.success === true, "Two-point patient verification PASSED");
  assert(twoPointVerify.verification_record?.status === "VERIFIED", "Verification record status is VERIFIED");

  // ------------------------------------------------------------
  // TEST GROUP 2: Specimen/Sample Creation & Label Generation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Specimen/Sample Creation & Label Generation");

  const collectRes = await LabSampleService.collectSample(
    orderId,
    {
      sample_type: "WHOLE_BLOOD",
      test_item_ids: ["LOI-CBC-01"],
      test_names: ["Complete Blood Count (CBC)"],
      facility_id: "LAB-FAC-1001",
      location: "Collection Room 1",
    },
    labTechActor as any
  );

  assert(collectRes.success === true, "Collected specimen successfully");
  assert(Boolean(collectRes.sample), "Server generated authoritative sample entity");
  assert(collectRes.sample?.status === "COLLECTED", "Sample status is COLLECTED");
  assert(Boolean(collectRes.label_metadata), "Generated machine-readable barcode label metadata");
  const sampleId = collectRes.sample!.id;

  // Double-click / re-invocation collection test
  const collectRes2 = await LabSampleService.collectSample(
    orderId,
    {
      sample_type: "WHOLE_BLOOD",
      test_item_ids: ["LOI-CBC-01"],
      test_names: ["Complete Blood Count (CBC)"],
      facility_id: "LAB-FAC-1001",
    },
    labTechActor as any
  );
  assert(collectRes2.success === true && collectRes2.sample?.id === sampleId, "Re-invocation returned existing sample ID (Idempotency verified)");

  // ------------------------------------------------------------
  // TEST GROUP 3: Chain of Custody Movement Ledger
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Chain of Custody Movement Ledger");

  const transferRes = await LabSampleService.recordTransfer(
    sampleId,
    {
      event_type: "SAMPLE_READY_FOR_TESTING",
      source_location: "Collection Room 1",
      destination_location: "Hematology Bench 2",
    },
    labTechActor as any
  );

  assert(transferRes.success === true, "Recorded custody movement event");
  assert(Boolean(transferRes.phase83_handoff_event), "Emitted Phase 8.3 handoff payload (SAMPLE_READY_FOR_TESTING)");
  assert(transferRes.phase83_handoff_event.event_type === "SAMPLE_READY_FOR_TESTING", "Handoff event type matches");

  const sampleUpdated = getSampleById(sampleId);
  assert(sampleUpdated?.status === "READY_FOR_TESTING", "Sample status updated to READY_FOR_TESTING");

  // ------------------------------------------------------------
  // TEST GROUP 4: Specimen Rejection & Recollection Linkage
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Specimen Rejection & Recollection Linkage");

  const rejectRes = await LabSampleService.rejectSpecimen(
    sampleId,
    "INSUFFICIENT_SAMPLE",
    "Specimen hemolyzed during transport",
    labTechActor as any
  );
  assert(rejectRes.success === true, "Specimen rejected successfully");
  assert(rejectRes.sample?.status === "REJECTED", "Sample status updated to REJECTED");

  // Recollection
  const recollectRes = await LabSampleService.collectSample(
    orderId,
    {
      sample_type: "WHOLE_BLOOD",
      test_item_ids: ["LOI-CBC-01"],
      test_names: ["Complete Blood Count (CBC)"],
      facility_id: "LAB-FAC-1001",
      is_recollection: true,
      previous_sample_id: sampleId,
    },
    labTechActor as any
  );
  assert(recollectRes.success === true, "Recollected new specimen successfully");
  assert(recollectRes.sample?.id !== sampleId, "Generated new unique Sample ID for recollection");
  assert(recollectRes.sample?.previous_sample_id === sampleId, "New sample links back to rejected sample ID");

  // ------------------------------------------------------------
  // TEST GROUP 5: Patient Isolation & Anti-IDOR Security
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Patient Isolation & Anti-IDOR Security");

  const patientBCustody = LabSampleService.getCustodyTrail(sampleId, patientBActor);
  assert(patientBCustody.success === false, "Patient B accessing Patient A's sample custody trail strictly BLOCKED");

  console.log("\n============================================================");
  console.log(`PHASE 8.2 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase82Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
