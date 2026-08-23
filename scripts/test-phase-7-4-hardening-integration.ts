// ============================================================
// MEDORA â€” PHASE 7.4 TEST SUITE: WORKFLOW INTEGRITY & HARDENING
// ============================================================

import { ConsultationService } from "../lib/services/consultation-service";
import { PrescriptionOrderService } from "../lib/services/prescription-order-service";
import { LabOrderService } from "../lib/services/lab-order-service";
import { ReferralService } from "../lib/services/referral-service";
import { FollowUpService } from "../lib/services/followup-service";
import { ClinicalContinuityService } from "../lib/services/clinical-continuity-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
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

async function runPhase74Tests() {
  console.log("============================================================");
  console.log("MEDORA â€” PHASE 7.4 TEST SUITE: WORKFLOW INTEGRITY & HARDENING");
  console.log("============================================================\n");

  const today = getTodayDateStr();

  // Test Actors
  const doctorAActor = findIdentityById("DOC-1001");
  const doctorBActor = findIdentityById("DOC-1002");
  const patientAActor = findIdentityById("PAT-1001");
  const patientBActor = findIdentityById("PAT-1002");

  assert(Boolean(doctorAActor), "Resolved Prescribing Doctor A (DOC-1001)");
  assert(Boolean(patientAActor), "Resolved Patient A (PAT-1001)");

  // Setup: Clean queue & encounter context
  QueueStore.reset();
  const existingQueue = QueueStore.getQueueForDoctor("DOC-1001");
  existingQueue.forEach((q) => {
    if (q.status === "IN_CONSULTATION") {
      QueueStore.saveQueueEntry({ ...q, status: "COMPLETED" });
    }
  });

  const tokenMeta = QueueStore.getNextToken("HSP-1001", "FAC-1001", "DEP-CARDIO", "DOC-1001", "SES-1001", today, "Dr. Ananya Sharma");
  const queueEntry = QueueStore.saveQueueEntry({
    id: `q-h-ord-${Date.now()}`,
    queue_no: `QUE-HORD-${Date.now()}`,
    appointment_id: "APT-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    patient_phone: "+91 98765 43210",
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
    room_number: "Room 102",
    checked_in_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  const startRes = await ConsultationService.startConsultationFromQueue(queueEntry.id, doctorAActor);
  assert(startRes.success === true && Boolean(startRes.encounter), "Initiated active clinical encounter for Phase 7.4 testing");
  const encounterId = startRes.encounter!.id;

  // ------------------------------------------------------------
  // TEST GROUP 1: End-to-End Clinical Cascade
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 1: End-to-End Clinical Cascade");

  // 1. SOAP Note
  const soapRes = await ConsultationService.saveDraft(
    encounterId,
    {
      chief_complaint: "Chest heaviness and dyspnea on exertion",
      assessment: "Stage 1 Essential Hypertension with angina-equivalent symptoms",
      treatment_plan: "Low sodium DASH diet, daily BP monitoring",
    },
    doctorAActor
  );
  assert(soapRes.success === true, "Saved SOAP clinical documentation draft");

  // 2. Prescription
  const rxRes = await PrescriptionOrderService.finalizePrescription(
    encounterId,
    {
      items: [
        { id: "RXI-H1", medicine_name: "Telmisartan 40mg", generic_name: "Telmisartan", dosage: "1 tablet", route: "ORAL", frequency: "Once daily", duration: "30 days" },
      ],
      notes: "Take after breakfast",
    },
    doctorAActor
  );
  assert(rxRes.success === true, "Finalized digital prescription");

  // 3. Lab Order
  const labRes = await LabOrderService.finalizeLabOrder(
    encounterId,
    {
      items: [{ id: "LOI-H1", test_name: "Lipid Profile Panel", specimen_type: "SERUM" }],
      reason: "Cardiovascular risk stratification",
    },
    doctorAActor
  );
  assert(labRes.success === true, "Finalized diagnostic lab order");

  // 4. Referral
  const refRes = await ReferralService.finalizeReferral(
    encounterId,
    {
      destination_type: "SPECIALTY",
      destination_specialty_name: "Cardiology",
      reason: "Consider stress echocardiography evaluation",
    },
    doctorAActor
  );
  assert(refRes.success === true, "Finalized clinical referral");

  // 5. Follow-Up
  const fuRes = await FollowUpService.createRecommendation(
    encounterId,
    {
      timeframe_type: "DAYS",
      timeframe_value: 7,
      reason: "Review diagnostic lab test results",
    },
    doctorAActor
  );
  assert(fuRes.success === true, "Created follow-up recommendation");

  // ------------------------------------------------------------
  // TEST GROUP 2: Graph Integrity Verification
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Graph Integrity Verification");

  const graphCheck = ClinicalContinuityService.validateClinicalGraphIntegrity(encounterId);
  assert(graphCheck.valid === true, "Clinical graph integrity validation PASSED (No patient mismatch or orphan records)");
  assert(graphCheck.patient_id === "PAT-1001", "Graph patient_id matches authoritative patient");

  // ------------------------------------------------------------
  // TEST GROUP 3: Double-Click Idempotency & Re-Invocation Safety
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Double-Click Idempotency & Re-Invocation Safety");

  const doubleRx = await PrescriptionOrderService.finalizePrescription(
    encounterId,
    {
      prescription_id: rxRes.prescription!.id,
      items: rxRes.prescription!.items,
    },
    doctorAActor
  );
  assert(doubleRx.success === true && doubleRx.prescription?.id === rxRes.prescription!.id, "Double-click finalization returned same prescription ID");

  // ------------------------------------------------------------
  // TEST GROUP 4: Anti-IDOR Security Hardening
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Anti-IDOR Security Hardening");

  const patientBTimeline = ClinicalContinuityService.getPatientTimeline("PAT-1001", patientBActor);
  assert(patientBTimeline.length === 0, "Patient B accessing Patient A's unified timeline strictly BLOCKED");

  console.log("\n============================================================");
  console.log(`PHASE 7.4 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase74Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
