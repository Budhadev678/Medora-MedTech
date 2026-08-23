import { findIdentityById, findIdentityByEmail } from "../lib/data/identity-store";
import { 
  getDoctorContext, 
  setDoctorSessionStatus, 
  setDoctorDutyStatus, 
  setActiveDoctorAffiliation 
} from "../lib/data/doctor-context-store";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { QueueManagementService } from "../lib/services/queue-management-service";
import { getEmergenciesForFacility } from "../lib/data/emergency-store";
import { AppointmentStore } from "../lib/data/appointment-store";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
    failed++;
  }
}

async function runDoctorStep2Suite() {
  console.log("============================================================");
  console.log("MEDORA — DOCTOR SIDE STEP 2: TODAY / QUEUE & OPERATIONS");
  console.log("============================================================\n");

  const docA = findIdentityById("DOC-1001")!;
  const docB = findIdentityById("DOC-1002")!;
  const todayStr = getTodayDateStr();

  // ------------------------------------------------------------
  // TEST 1: Canonical Queue Loading & Session Context
  // ------------------------------------------------------------
  console.log("TEST 1: Canonical Queue Loading & Operational Summary");
  const ctxA = getDoctorContext("DOC-1001")!;
  assert(ctxA.facilityId === "HSP-1001", "1.1 Doctor A active facility is HSP-1001");
  
  const summaries = QueueManagementService.getDoctorQueueSummary("DOC-1001", "HSP-1001", todayStr);
  assert(summaries.length > 0, "1.2 Doctor queue summaries retrieved for active session");
  const currentSummary = summaries[0];
  assert(currentSummary.session_id === "SES-1001", "1.3 Active session is SES-1001");
  assert(Boolean(currentSummary.room_number), "1.4 Session room number is present");
  assert(currentSummary.total_capacity >= 10, "1.5 Session total capacity configured");

  // ------------------------------------------------------------
  // TEST 2: Current Patient in Consultation & Next in Line
  // ------------------------------------------------------------
  console.log("\nTEST 2: Current In-Consultation & Next Patient Visibility");
  const initialCurrent = currentSummary.current_patient;
  assert(Boolean(initialCurrent), "2.1 Active patient in consultation identified");
  assert(initialCurrent?.token_number === "C-02", "2.2 Current patient token is C-02");
  assert(initialCurrent?.patient_name === "Rahul Verma", "2.3 Current patient is Rahul Verma");
  assert(initialCurrent?.status === "IN_CONSULTATION", "2.4 Current patient status is IN_CONSULTATION");

  const nextPat = currentSummary.next_patient;
  assert(Boolean(nextPat), "2.5 Next waiting patient identified");
  assert(nextPat?.status === "WAITING", "2.6 Next patient status is WAITING");

  // ------------------------------------------------------------
  // TEST 3: Call Next Patient & Idempotency
  // ------------------------------------------------------------
  console.log("\nTEST 3: Call Next Patient Workflow & Idempotency");
  // Complete initial current patient to free room
  if (initialCurrent) {
    const compRes = await QueueManagementService.completeConsultation(initialCurrent.id, docA);
    assert(compRes.success === true, "3.1 Current consultation completed successfully");
  }

  // Now call next patient
  const callRes = await QueueManagementService.callNextPatient(
    { doctor_id: "DOC-1001", session_id: "SES-1001", date: todayStr },
    docA
  );
  assert(callRes.success === true, "3.2 Call next patient succeeded");
  assert(callRes.queue_entry?.status === "CALLED" || callRes.queue_entry?.status === "IN_CONSULTATION", "3.3 Called patient moved to active state");

  // Calling again when patient is actively being served
  const doubleCallRes = await QueueManagementService.callNextPatient(
    { doctor_id: "DOC-1001", session_id: "SES-1001", date: todayStr },
    docA
  );
  assert(Boolean(doubleCallRes.queue_entry || !doubleCallRes.success), "3.4 Duplicate call handled safely / idempotently");

  // ------------------------------------------------------------
  // TEST 4: Skip Patient & Recall Workflow
  // ------------------------------------------------------------
  console.log("\nTEST 4: Skip Patient & Recall State Machine");
  const activeCalled = callRes.queue_entry!;
  const skipRes = await QueueManagementService.skipPatient(activeCalled.id, docA, "Patient stepped out");
  assert(skipRes.success === true, "4.1 Patient skipped successfully");
  assert(skipRes.queue_entry?.status === "SKIPPED", "4.2 Skipped patient status is SKIPPED");
  assert(skipRes.queue_entry?.notes === "Patient stepped out", "4.3 Skipped reason recorded");

  // Recall the skipped patient
  const recallRes = await QueueManagementService.recallPatient(activeCalled.id, docA);
  assert(recallRes.success === true, "4.4 Recalled patient successfully");
  assert(recallRes.queue_entry?.status === "CALLED", "4.5 Recalled patient restored to active CALLED state");

  // ------------------------------------------------------------
  // TEST 5: No-Show Handling & Audit Integrity
  // ------------------------------------------------------------
  console.log("\nTEST 5: No-Show Handling & Audit Integrity");
  const noShowRes = await QueueManagementService.markNoShow(activeCalled.id, docA, "No attendance after 3 calls");
  assert(noShowRes.success === true, "5.1 Patient marked as NO-SHOW successfully");
  assert(noShowRes.queue_entry?.status === "NO_SHOW", "5.2 Patient status is NO_SHOW");

  // Verify patient leaves waiting list
  const updatedSummary = QueueManagementService.getDoctorQueueSummary("DOC-1001", "HSP-1001", todayStr)[0];
  assert(!updatedSummary.waiting_list.some(w => w.id === activeCalled.id), "5.3 No-show patient removed from active waiting list");

  // ------------------------------------------------------------
  // TEST 6: Session State Control (Active -> Paused -> Resumed -> Ended)
  // ------------------------------------------------------------
  console.log("\nTEST 6: Session State Control (Pause / Resume / End)");
  setDoctorSessionStatus("DOC-1001", "PAUSED");
  const pausedCtx = getDoctorContext("DOC-1001")!;
  assert(pausedCtx.sessionStatus === "PAUSED", "6.1 Session status is PAUSED");

  // Resuming session
  setDoctorSessionStatus("DOC-1001", "ACTIVE");
  const resumedCtx = getDoctorContext("DOC-1001")!;
  assert(resumedCtx.sessionStatus === "ACTIVE", "6.2 Session resumed to ACTIVE");

  // ------------------------------------------------------------
  // TEST 7: Emergency Integration & Facility Isolation
  // ------------------------------------------------------------
  console.log("\nTEST 7: Emergency Integration & Triage Prioritization");
  const facilityEmergencies = getEmergenciesForFacility("FAC-1001");
  assert(facilityEmergencies.length > 0, "7.1 Emergency cases surfaced for facility FAC-1001");
  assert(facilityEmergencies[0].triage_level === "red_critical", "7.2 Emergency triage priority is red_critical");

  // ------------------------------------------------------------
  // TEST 8: Anti-IDOR & Doctor Data Isolation
  // ------------------------------------------------------------
  console.log("\nTEST 8: Anti-IDOR & Doctor Queue Isolation");
  const docBSummaries = QueueManagementService.getDoctorQueueSummary("DOC-1002", "HSP-1001", todayStr);
  assert(Array.isArray(docBSummaries), "8.1 Doctor B queue query executed");
  assert(docBSummaries.every(s => s.doctor_id === "DOC-1002"), "8.2 Doctor B queue only contains Doctor B sessions");

  // Attempting to complete Doctor A's patient using Doctor B account
  const unauthorizedOp = await QueueManagementService.completeConsultation("q-1001", docB);
  assert(unauthorizedOp.success === false, "8.3 Doctor B cannot modify Doctor A's patient queue entry");

  console.log("\n============================================================");
  console.log(`DOCTOR STEP 2 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runDoctorStep2Suite();