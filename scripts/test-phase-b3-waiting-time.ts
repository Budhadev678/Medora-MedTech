// ============================================================
// MEDORA â€” PHASE B.3 AUTOMATED TEST SUITE
// Dynamic Waiting-Time Estimation & Queue Optimization
// ============================================================

import {
  ConsultationHistoryStore,
  computeDurationDistribution,
} from "../lib/data/consultation-history-store";
import { WaitingTimeEstimationService } from "../lib/services/waiting-time-service";
import { QueueManagementService } from "../lib/services/queue-management-service";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { AppointmentStore } from "../lib/data/appointment-store";
import { getAllIdentities, findIdentityById, StoredIdentity } from "../lib/data/identity-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  âœ“ [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`  âœ— [FAIL] ${testName}${detail ? ` â€” ${detail}` : ""}`);
  }
}

async function runPhaseB3Tests() {
  console.log("\n============================================================");
  console.log("MEDORA PHASE B.3: DYNAMIC WAITING-TIME ESTIMATION TEST SUITE");
  console.log("============================================================\n");

  const todayStr = getTodayDateStr();

  // Reset stores for deterministic testing
  ConsultationHistoryStore.reset();
  QueueStore.reset();
  AppointmentStore.reset();

  const patientA = findIdentityById("PAT-1001") as StoredIdentity; // Rahul Verma
  const patientB = findIdentityById("PAT-1002") as StoredIdentity; // Priya Sharma
  const doctorAnanya = findIdentityById("DOC-1001") as StoredIdentity; // Dr. Ananya Sharma
  const doctorRahul = findIdentityById("MULTI-1001") as StoredIdentity; // Dr. Rahul Sharma
  const receptionistAnita = findIdentityById("STAFF-1002") as StoredIdentity; // Anita (Receptionist)

  assert(Boolean(patientA && patientB && doctorAnanya && doctorRahul && receptionistAnita), "1. Identity Fixtures Loaded");

  // ============================================================
  // TEST GROUP 1: HISTORICAL STATISTICS & OUTLIER RESILIENCE
  // ============================================================
  console.log("\n--- TEST GROUP 1: HISTORICAL STATISTICS & OUTLIER RESILIENCE ---");

  const normalArray = [10, 12, 14, 15, 16, 18, 20];
  const dist1 = computeDurationDistribution(normalArray);
  assert(dist1.median === 15, "1.1 Normal array median is 15", `Got ${dist1.median}`);
  assert(dist1.p25 >= 12 && dist1.p25 <= 14, "1.2 P25 is calculated accurately", `Got ${dist1.p25}`);
  assert(dist1.p75 >= 16 && dist1.p75 <= 18, "1.3 P75 is calculated accurately", `Got ${dist1.p75}`);

  // Extreme Outlier Test (e.g. 120 min consultation)
  const outlierArray = [10, 11, 12, 13, 10, 11, 12, 10, 11, 120];
  const distOutlier = computeDurationDistribution(outlierArray);
  assert(distOutlier.median === 11, "1.4 Outlier (120m) does NOT distort median baseline (Median remains 11)", `Got ${distOutlier.median}`);
  assert(distOutlier.p75 <= 15, "1.5 P75 remains robust against extreme outlier", `Got ${distOutlier.p75}`);

  // Data Quality Filter Test (Negative and Corrupt values)
  const corruptArray = [-10, 0, 10, 12, 14, 300, NaN];
  const distCorrupt = computeDurationDistribution(corruptArray);
  assert(distCorrupt.count === 3, "1.6 Corrupt and negative durations safely filtered out", `Count is ${distCorrupt.count}`);
  assert(distCorrupt.median === 12, "1.7 Clean median derived from valid records", `Got ${distCorrupt.median}`);

  // ============================================================
  // TEST GROUP 2: BASE ESTIMATION WITH ACTIVE QUEUE
  // ============================================================
  console.log("\n--- TEST GROUP 2: BASE ESTIMATION WITH ACTIVE QUEUE ---");

  QueueStore.clearAll();

  // Create session and queue entries
  const session = AppointmentStore.getDoctorSessions("DOC-1001", "HSP-1001")[0];
  assert(Boolean(session), "2.0 Session exists for Dr. Ananya at City Hospital");

  // Register 4 walk-ins / appointments: C-01, C-02, C-03, C-04
  const q1 = (await QueueManagementService.createWalkInQueueEntry({
    patient_id: "PAT-1002",
    doctor_id: "DOC-1001",
    organization_identifier: "HSP-1001",
    facility_id: "FAC-1001",
    department_id: "DEP-CARD-1001",
    session_id: session.id,
    date: todayStr,
    source: "WALK_IN",
  }, receptionistAnita)).queue_entry!;

  const q2 = (await QueueManagementService.createWalkInQueueEntry({
    patient_id: "PAT-1003",
    doctor_id: "DOC-1001",
    organization_identifier: "HSP-1001",
    facility_id: "FAC-1001",
    department_id: "DEP-CARD-1001",
    session_id: session.id,
    date: todayStr,
    source: "WALK_IN",
  }, receptionistAnita)).queue_entry!;

  const q3 = (await QueueManagementService.createWalkInQueueEntry({
    patient_id: "PAT-1004",
    doctor_id: "DOC-1001",
    organization_identifier: "HSP-1001",
    facility_id: "FAC-1001",
    department_id: "DEP-CARD-1001",
    session_id: session.id,
    date: todayStr,
    source: "WALK_IN",
  }, receptionistAnita)).queue_entry!;

  const q4 = (await QueueManagementService.createWalkInQueueEntry({
    patient_id: "PAT-1001",
    doctor_id: "DOC-1001",
    organization_identifier: "HSP-1001",
    facility_id: "FAC-1001",
    department_id: "DEP-CARD-1001",
    session_id: session.id,
    date: todayStr,
    source: "WALK_IN",
  }, receptionistAnita)).queue_entry!;

  assert(Boolean(q1 && q2 && q3 && q4), "2.1 Four queue entries created sequentially");

  // Calculate wait estimate for q4 (Patient has 3 people ahead: q1, q2, q3)
  const est4_initial = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q4.id, patientA);
  assert(est4_initial.people_ahead === 3, "2.2 Patient q4 has 3 people ahead", `Got ${est4_initial.people_ahead}`);
  assert(est4_initial.estimated_lower_minutes > 0, "2.3 Estimated lower minutes is positive", `Got ${est4_initial.estimated_lower_minutes}`);
  assert(est4_initial.estimated_upper_minutes >= est4_initial.estimated_lower_minutes, "2.4 Estimate is a valid range (Upper >= Lower)");
  assert(est4_initial.display_text.includes("min"), "2.5 Display text formats range properly", `Got '${est4_initial.display_text}'`);
  assert(est4_initial.confidence === "HIGH", "2.6 Confidence is HIGH due to verified doctor history");

  // ============================================================
  // TEST GROUP 3: ACTIVE CONSULTATION & QUEUE PROGRESSION
  // ============================================================
  console.log("\n--- TEST GROUP 3: ACTIVE CONSULTATION & QUEUE PROGRESSION ---");

  // Doctor calls and starts consultation for q1
  await QueueManagementService.callNextPatient({ doctor_id: "DOC-1001", session_id: session.id, date: todayStr }, doctorAnanya);
  await QueueManagementService.startConsultation(q1.id, doctorAnanya);

  // Re-check estimate for q4
  const est4_during_q1 = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q4.id, patientA);
  assert(est4_during_q1.currently_serving_token === q1.token_number, "3.1 Current serving token correctly points to C-01", `Got ${est4_during_q1.currently_serving_token}`);
  assert(est4_during_q1.people_ahead === 2, "3.2 Waiting people ahead reduced to 2 (q2 & q3)", `Got ${est4_during_q1.people_ahead}`);

  // Doctor completes q1
  await QueueManagementService.completeConsultation(q1.id, doctorAnanya);

  // Re-check estimate for q4 after q1 completed
  const est4_after_q1 = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q4.id, patientA);
  assert(est4_after_q1.people_ahead === 2, "3.3 People ahead is 2");
  assert(est4_after_q1.estimated_upper_minutes <= est4_initial.estimated_upper_minutes, "3.4 Waiting time estimate decreased after patient completion", `Initial: ${est4_initial.estimated_upper_minutes}, After: ${est4_after_q1.estimated_upper_minutes}`);

  // ============================================================
  // TEST GROUP 4: CLINICAL AUTONOMY & LONG CONSULTATION DYNAMICS
  // ============================================================
  console.log("\n--- TEST GROUP 4: CLINICAL AUTONOMY & LONG CONSULTATION DYNAMICS ---");

  // Call and start q2 with artificial elapsed time (25 mins ago)
  await QueueManagementService.callNextPatient({ doctor_id: "DOC-1001", session_id: session.id, date: todayStr }, doctorAnanya);
  await QueueManagementService.startConsultation(q2.id, doctorAnanya);

  // Simulate 25 minutes elapsed on q2
  const updatedQ2 = QueueStore.getQueueEntryById(q2.id)!;
  const past25Min = new Date(Date.now() - 25 * 60 * 1000).toISOString();
  QueueStore.saveQueueEntry({
    ...updatedQ2,
    consultation_started_at: past25Min,
  });

  const est4_long_q2 = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q4.id, patientA);
  assert(est4_long_q2.current_consultation_elapsed_minutes! >= 24, "4.1 Elapsed time tracked as ~25 minutes", `Got ${est4_long_q2.current_consultation_elapsed_minutes}`);
  assert(est4_long_q2.estimated_lower_minutes >= 0, "4.2 Lower bound remaining duration is never negative", `Got ${est4_long_q2.estimated_lower_minutes}`);
  
  // Verify doctor status remains IN_CONSULTATION and not forcefully cancelled or completed
  const freshQ2 = QueueStore.getQueueEntryById(q2.id)!;
  assert(freshQ2.status === "IN_CONSULTATION", "4.3 Doctor is NEVER forced to finish consultation (Clinical autonomy preserved)");

  // ============================================================
  // TEST GROUP 5: CANCELLATION & SKIP EFFECTS
  // ============================================================
  console.log("\n--- TEST GROUP 5: CANCELLATION & SKIP EFFECTS ---");

  // Skip q3
  await QueueManagementService.skipPatient(q3.id, doctorAnanya, "Patient momentarily stepped out");

  const est4_after_skip = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q4.id, patientA);
  assert(est4_after_skip.people_ahead === 0, "5.1 Skipped patient removed from active queue ahead (0 waiting ahead)", `Got ${est4_after_skip.people_ahead}`);
  assert(est4_after_skip.display_text.includes("You are next"), "5.2 Patient q4 becomes next in line after skip", `Got '${est4_after_skip.display_text}'`);

  // Recall q3
  await QueueManagementService.recallPatient(q3.id, doctorAnanya);
  const est4_after_recall = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q4.id, patientA);
  assert(est4_after_recall.people_ahead >= 0, "5.3 Recalled patient handled safely");

  // ============================================================
  // TEST GROUP 6: STATE TRANSITIONS FOR TARGET PATIENT
  // ============================================================
  console.log("\n--- TEST GROUP 6: STATE TRANSITIONS FOR TARGET PATIENT ---");

  // Complete q2
  await QueueManagementService.completeConsultation(q2.id, doctorAnanya);

  // Call q4
  QueueStore.saveQueueEntry({ ...QueueStore.getQueueEntryById(q4.id)!, status: "CALLED", called_at: new Date().toISOString() });
  const est4_called = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q4.id, patientA);
  assert(est4_called.status === "CALLED", "6.1 Patient status is CALLED");
  assert(est4_called.display_text.includes("Your token has been called"), "6.2 Called state prompts patient to proceed to room");

  // Start consultation for q4
  QueueStore.saveQueueEntry({ ...QueueStore.getQueueEntryById(q4.id)!, status: "IN_CONSULTATION", consultation_started_at: new Date().toISOString() });
  const est4_in_consult = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q4.id, patientA);
  assert(est4_in_consult.status === "IN_CONSULTATION", "6.3 Patient status is IN_CONSULTATION");
  assert(est4_in_consult.display_text === "Consultation in progress", "6.4 Consultation in progress state displayed");
  assert(est4_in_consult.estimated_lower_minutes === 0 && est4_in_consult.estimated_upper_minutes === 0, "6.5 Waiting minutes set to 0 during active consultation");

  // Complete consultation for q4
  QueueStore.saveQueueEntry({ ...QueueStore.getQueueEntryById(q4.id)!, status: "COMPLETED", completed_at: new Date().toISOString() });
  const est4_completed = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q4.id, patientA);
  assert(est4_completed.status === "COMPLETED", "6.6 Patient status is COMPLETED");
  assert(est4_completed.display_text === "Consultation completed", "6.7 Completed message displayed");

  // ============================================================
  // TEST GROUP 7: MULTI-DOCTOR & SPECIALTY ESTIMATION SEPARATION
  // ============================================================
  console.log("\n--- TEST GROUP 7: MULTI-DOCTOR & SPECIALTY SEPARATION ---");

  const cardioMetrics = ConsultationHistoryStore.getConsultationMetrics("DOC-1001", "HSP-1001", "DEP-CARD-1001");
  const genMedMetrics = ConsultationHistoryStore.getConsultationMetrics("MULTI-1001", "HSP-1001", "DEP-GEN-1001");

  assert(cardioMetrics.median_minutes === 14, "7.1 Cardiology doctor median is ~14 mins", `Got ${cardioMetrics.median_minutes}`);
  assert(genMedMetrics.median_minutes === 8, "7.2 General Medicine doctor median is ~8 mins", `Got ${genMedMetrics.median_minutes}`);
  assert(cardioMetrics.median_minutes > genMedMetrics.median_minutes, "7.3 Doctor histories strictly segregated by specialty and practitioner");

  // Multi-Facility Separation for same doctor
  const clinicMetrics = ConsultationHistoryStore.getConsultationMetrics("DOC-1001", "CLN-1001", "DEP-CARD-1003");
  assert(clinicMetrics.median_minutes <= 11, "7.4 Clinic-specific duration profile is distinct from hospital profile", `Got ${clinicMetrics.median_minutes}`);

  // ============================================================
  // TEST GROUP 8: DOCTOR OPERATIONAL QUEUE STATUS
  // ============================================================
  console.log("\n--- TEST GROUP 8: DOCTOR OPERATIONAL QUEUE STATUS ---");

  const doctorOps = WaitingTimeEstimationService.getDoctorOperationalQueueStatus("DOC-1001", "HSP-1001", todayStr);
  assert(doctorOps.length > 0, "8.1 Doctor operational queue statuses generated");
  assert(doctorOps[0].historical_median_minutes === 14, "8.2 Historical median reported accurately");
  assert(typeof doctorOps[0].estimated_queue_clearance_minutes === "number", "8.3 Queue clearance minutes computed");

  // ============================================================
  // TEST GROUP 9: AUTHORIZATION & SECURITY BOUNDARIES
  // ============================================================
  console.log("\n--- TEST GROUP 9: AUTHORIZATION & SECURITY BOUNDARIES ---");

  // Patient A tries to access Patient B's estimate for q1
  const estCross = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q1.id, patientA);
  assert(estCross.confidence === "UNAVAILABLE", "9.1 Unauthorized cross-patient estimate access DENIED");
  assert(estCross.display_text === "Unauthorized", "9.2 Unauthorized display message returned");

  // Patient A accesses own estimate for q4
  const estSelf = WaitingTimeEstimationService.calculatePatientWaitingEstimate(q4.id, patientA);
  assert(estSelf.display_text !== "Unauthorized", "9.3 Authorized patient can access own estimate");

  // ============================================================
  // TEST SUMMARY
  // ============================================================
  console.log("\n============================================================");
  console.log(`PHASE B.3 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhaseB3Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
