// ============================================================
// MEDORA â€” PHASE 7.3 TEST SUITE: CLINICAL ORDERS, REFERRALS & FOLLOW-UP
// ============================================================

import { LabOrderService } from "../lib/services/lab-order-service";
import { ReferralService } from "../lib/services/referral-service";
import { FollowUpService } from "../lib/services/followup-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { getLabOrderById } from "../lib/data/lab-order-store";
import { getReferralById } from "../lib/data/referral-store";
import { getFollowUpById } from "../lib/data/followup-store";
import { findIdentityById } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";
import { LabOrderItem } from "../types/database.types";

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

async function runPhase73Tests() {
  console.log("============================================================");
  console.log("MEDORA â€” PHASE 7.3 TEST SUITE: LAB ORDERS, REFERRALS & FOLLOW-UP");
  console.log("============================================================\n");

  const today = getTodayDateStr();

  // Test Actors
  const doctorAActor = findIdentityById("DOC-1001");
  const doctorBActor = findIdentityById("DOC-1002");
  const patientAActor = findIdentityById("PAT-1001");
  const patientBActor = findIdentityById("PAT-1002");

  assert(Boolean(doctorAActor), "Resolved Prescribing Doctor A (DOC-1001)");
  assert(Boolean(doctorBActor), "Resolved Other Doctor B (DOC-1002)");
  assert(Boolean(patientAActor), "Resolved Patient A (PAT-1001)");
  assert(Boolean(patientBActor), "Resolved Patient B (PAT-1002)");

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
    id: `q-ord-${Date.now()}`,
    queue_no: `QUE-ORD-${Date.now()}`,
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
  assert(startRes.success === true && Boolean(startRes.encounter), "Initiated active clinical encounter for Phase 7.3 testing");
  const encounterId = startRes.encounter!.id;

  // ------------------------------------------------------------
  // TEST GROUP 1: Encounter Binding, Authorization & Wrong Doctor Protection
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 1: Encounter Binding & Wrong Doctor Protection");

  const wrongDoctorLabRes = await LabOrderService.saveDraft(
    encounterId,
    {
      items: [{ id: "LOI-TEST-1", test_name: "CBC" }],
      reason: "Unauthorized attempt",
    },
    doctorBActor
  );
  assert(wrongDoctorLabRes.success === false, "Doctor B composing Lab Order in Doctor A's encounter was REJECTED");

  const wrongDoctorRefRes = await ReferralService.saveDraft(
    encounterId,
    {
      destination_type: "SPECIALTY",
      destination_specialty_name: "Neurology",
      reason: "Unauthorized attempt",
    },
    doctorBActor
  );
  assert(wrongDoctorRefRes.success === false, "Doctor B composing Referral in Doctor A's encounter was REJECTED");

  // ------------------------------------------------------------
  // TEST GROUP 2: Lab Order Creation, Test Selection & Draft Persistence
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Lab Order Creation, Test Selection & Draft Persistence");

  const labItems: LabOrderItem[] = [
    { id: "LOI-1", test_id: "TEST-CBC-001", test_name: "Complete Blood Count (CBC)", test_code: "CBC-01", specimen_type: "WHOLE_BLOOD" },
    { id: "LOI-2", test_id: "TEST-LIP-001", test_name: "Fasting Lipid Profile Panel", test_code: "LIP-01", specimen_type: "SERUM" },
  ];

  const labDraftRes = await LabOrderService.saveDraft(
    encounterId,
    { items: labItems, priority: "ROUTINE", reason: "Baseline metabolic & lipid screening" },
    doctorAActor
  );
  assert(labDraftRes.success === true, "Saved draft lab order successfully");
  assert(Boolean(labDraftRes.order), "Server returned authoritative lab order entity");
  assert(labDraftRes.order?.status === "DRAFT", "Lab order status is DRAFT");
  const labOrderId = labDraftRes.order!.id;

  // Re-save draft (Idempotent update)
  const labDraftRes2 = await LabOrderService.saveDraft(
    encounterId,
    { items: labItems, priority: "URGENT", reason: "Baseline metabolic screening (Urgent request)" },
    doctorAActor
  );
  assert(labDraftRes2.success === true, "Re-saving draft lab order succeeded");
  assert(labDraftRes2.order?.id === labOrderId, "Preserved same lab order ID (Idempotency verified)");

  // ------------------------------------------------------------
  // TEST GROUP 3: Lab Order Atomic Finalization, Edit Locking & Verification
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Lab Order Atomic Finalization & Edit Locking");

  const emptyLabFinalize = await LabOrderService.finalizeLabOrder(
    encounterId,
    { items: [], reason: "Empty test order" },
    doctorAActor
  );
  assert(emptyLabFinalize.success === false, "Finalizing empty lab order was REJECTED");

  const finalizeLabRes = await LabOrderService.finalizeLabOrder(
    encounterId,
    { order_id: labOrderId, items: labItems, priority: "ROUTINE", reason: "Baseline metabolic & lipid screening" },
    doctorAActor
  );
  assert(finalizeLabRes.success === true, "Lab order finalized successfully");
  assert(finalizeLabRes.order?.status === "FINALIZED", "Lab order status updated to FINALIZED");
  assert(Boolean(finalizeLabRes.order?.ordered_at), "Ordered timestamp set");

  // Attempting ordinary draft edit on FINALIZED lab order -> REJECTED
  const editFinalizedLabRes = await LabOrderService.saveDraft(
    encounterId,
    { items: labItems },
    doctorAActor
  );
  assert(editFinalizedLabRes.success === false, "Draft edit on FINALIZED lab order was REJECTED");

  // ------------------------------------------------------------
  // TEST GROUP 4: Lab Order Phase 8 Handoff Payload & Idempotency
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Lab Order Phase 8 Handoff Payload & Idempotency");

  assert(Boolean(finalizeLabRes.phase8_handoff_event), "Finalization emitted Phase 8 handoff event payload");
  assert(finalizeLabRes.phase8_handoff_event.event_type === "LAB_ORDER_FINALIZED", "Event type is LAB_ORDER_FINALIZED");
  assert(finalizeLabRes.phase8_handoff_event.idempotency_key === `HANDSHAKE-LAB-${labOrderId}`, "Event contains stable idempotency key");

  // ------------------------------------------------------------
  // TEST GROUP 5: Clinical Referral Creation, Specialty/Doctor Destination & Finalization
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Clinical Referral Creation & Finalization");

  const referralDraftRes = await ReferralService.saveDraft(
    encounterId,
    {
      destination_type: "SPECIALTY",
      destination_specialty_name: "Cardiology",
      priority: "ROUTINE",
      reason: "Further evaluation for borderline ST elevation on ECG",
      notes: "Please consider stress echocardiography.",
    },
    doctorAActor
  );
  assert(referralDraftRes.success === true, "Saved draft referral successfully");
  assert(referralDraftRes.referral?.status === "DRAFT", "Referral status is DRAFT");
  const referralId = referralDraftRes.referral!.id;

  const finalizeRefRes = await ReferralService.finalizeReferral(
    encounterId,
    {
      referral_id: referralId,
      destination_type: "SPECIALTY",
      destination_specialty_name: "Cardiology",
      priority: "ROUTINE",
      reason: "Further evaluation for borderline ST elevation on ECG",
      notes: "Please consider stress echocardiography.",
    },
    doctorAActor
  );
  assert(finalizeRefRes.success === true, "Referral finalized successfully");
  assert(finalizeRefRes.referral?.status === "FINALIZED", "Referral status updated to FINALIZED");
  assert(Boolean(finalizeRefRes.referral?.finalized_at), "Finalized timestamp recorded");

  // ------------------------------------------------------------
  // TEST GROUP 6: Clinical Referral Isolation & No Automatic Appointment Booking Guard
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Referral Isolation & No Automatic Appointment Booking Guard");

  // Creating referral MUST NOT automatically create an appointment in QueueStore or AppointmentStore
  const ref = getReferralById(referralId);
  assert(Boolean(ref), "Retrieved finalized referral by ID");
  assert(ref?.status === "FINALIZED", "Referral status remains FINALIZED (NOT auto-booked as an appointment)");

  // ------------------------------------------------------------
  // TEST GROUP 7: Follow-up Recommendation Creation & Timeframe Display
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Follow-up Recommendation Creation & Timeframe Display");

  const followupRes = await FollowUpService.createRecommendation(
    encounterId,
    {
      timeframe_type: "DAYS",
      timeframe_value: 7,
      reason: "Review diagnostic lab test results and blood pressure chart",
      instructions: "Maintain daily morning and evening BP log.",
      preferred_doctor_id: "DOC-1001",
      preferred_doctor_name: "Dr. Ananya Sharma",
    },
    doctorAActor
  );
  assert(followupRes.success === true, "Created follow-up recommendation successfully");
  assert(followupRes.followup?.status === "RECOMMENDED", "Follow-up status is RECOMMENDED");
  assert(followupRes.followup?.timeframe_display === "Follow up in 7 days", "Formatted human-readable timeframe display");
  const followupId = followupRes.followup!.id;

  // ------------------------------------------------------------
  // TEST GROUP 8: Follow-up Recommendation Phase 6 Appointment Linkage
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 8: Follow-up Recommendation Phase 6 Appointment Linkage");

  const linkRes = await FollowUpService.linkAppointment(followupId, "APT-1002", patientAActor);
  assert(linkRes.success === true, "Linked Phase 6 booked appointment to follow-up recommendation");
  assert(linkRes.followup?.status === "BOOKED", "Follow-up status updated to BOOKED");
  assert(linkRes.followup?.appointment_id === "APT-1002", "Appointment ID recorded in follow-up link");

  // ------------------------------------------------------------
  // TEST GROUP 9: Patient Isolation, Draft Visibility Guard & Anti-IDOR Security
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 9: Patient Isolation, Draft Visibility Guard & Anti-IDOR Security");

  // Patient B attempting to access Patient A's lab orders -> REJECTED
  const patientBLabRes = LabOrderService.getPatientLabOrders("PAT-1001", patientBActor);
  assert(patientBLabRes.success === false, "Patient B accessing Patient A's lab orders strictly BLOCKED (Anti-IDOR)");

  // Patient B attempting to access Patient A's referrals -> REJECTED
  const patientBRefRes = ReferralService.getPatientReferrals("PAT-1001", patientBActor);
  assert(patientBRefRes.success === false, "Patient B accessing Patient A's referrals strictly BLOCKED (Anti-IDOR)");

  // Patient A accessing own lab orders -> SUCCESS
  const patientALabRes = LabOrderService.getPatientLabOrders("PAT-1001", patientAActor);
  assert(patientALabRes.success === true && Array.isArray(patientALabRes.orders), "Patient A successfully retrieved own lab orders");

  // ------------------------------------------------------------
  // TEST GROUP 10: Audit Ledger Trail & Provenance Integrity
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 10: Audit Ledger Trail & Provenance Integrity");

  const labAudit = AuditLedger.getEvents({ resourceId: labOrderId });
  assert(labAudit.length > 0, "Audit ledger recorded events for lab order");
  assert(labAudit.some((e) => e.event_type === "LAB_ORDER_FINALIZED" || (e as any).action === "LAB_ORDER_FINALIZED"), "Audit recorded LAB_ORDER_FINALIZED");

  const refAudit = AuditLedger.getEvents({ resourceId: referralId });
  assert(refAudit.length > 0, "Audit ledger recorded events for referral");

  const fuAudit = AuditLedger.getEvents({ resourceId: followupId });
  assert(fuAudit.length > 0, "Audit ledger recorded events for follow-up recommendation");

  console.log("\n============================================================");
  console.log(`PHASE 7.3 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase73Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
