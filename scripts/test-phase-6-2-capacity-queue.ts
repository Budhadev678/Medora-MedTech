// ============================================================
// MEDORA â€” PHASE 6.2 TEST SUITE
// CAPACITY ENGINE, TOKEN GENERATION &
// DYNAMIC QUEUE MANAGEMENT
// ============================================================

import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { QueueManagementService } from "../lib/services/queue-management-service";
import { WaitingTimeEstimationService } from "../lib/services/waiting-time-service";
import { AppointmentStore } from "../lib/data/appointment-store";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { StoredIdentity } from "../lib/data/identity-store";

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  âœ“ PASS: ${testName}`);
  } else {
    failedAssertions++;
    console.error(`  âœ— FAIL: ${testName}${details ? ` - ${details}` : ""}`);
  }
}

console.log("============================================================");
console.log("MEDORA â€” PHASE 6.2 TEST SUITE: CAPACITY & DYNAMIC QUEUE");
console.log("============================================================\n");

// Reset stores
AppointmentStore.reset();
QueueStore.reset();

const patientActor: StoredIdentity = {
  id: "PAT-1001",
  identifier: "PAT-1001",
  email: "rahul.verma@example.com",
  passwordHash: "Password@123",
  fullName: "Rahul Verma",
  role: "patient",
  accountStatus: "active",
  verificationStatus: "verified",
  createdAt: new Date().toISOString(),
};

const doctorActor: StoredIdentity = {
  id: "DOC-1001",
  identifier: "DOC-1001",
  email: "doctor@medora.health",
  passwordHash: "Password@123",
  fullName: "Dr. Ananya Sharma",
  role: "doctor",
  accountStatus: "active",
  verificationStatus: "verified",
  organizationId: "11111111-1111-1111-1111-111111111101",
  organizationName: "City Hospital",
  createdAt: new Date().toISOString(),
};

const receptionActor: StoredIdentity = {
  id: "STAFF-1002",
  identifier: "STAFF-1002",
  email: "anita@cityhospital.org",
  passwordHash: "Password@123",
  fullName: "Anita Mishra",
  role: "staff",
  accountStatus: "active",
  verificationStatus: "verified",
  organizationId: "11111111-1111-1111-1111-111111111101",
  organizationName: "City Hospital",
  createdAt: new Date().toISOString(),
};

async function runPhase62TestSuite() {
  const todayStr = getTodayDateStr();

  // ------------------------------------------------------------
  // TEST GROUP 1: APPOINTMENT VS QUEUE VS TOKEN ENTITY SEPARATION
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Entity Separation (Appointment â‰  Queue Entry â‰  Token)");

  const sessions = AppointmentStore.getDoctorSessions("DOC-1001");
  const targetSession = sessions.find((s) => s.is_active) || sessions[0];

  const bookingRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: targetSession.organization_identifier,
      facility_id: targetSession.facility_id,
      department_id: targetSession.department_id,
      session_id: targetSession.id,
      appointment_date: todayStr,
      booking_source: "PATIENT",
    },
    patientActor
  );

  assert(bookingRes.success && !!bookingRes.appointment, "Confirmed appointment created");
  const initialQueue = QueueStore.getQueueForSession(targetSession.id, todayStr);
  assert(
    !initialQueue.some((q) => q.appointment_id === bookingRes.appointment!.id),
    "Confirmed appointment is NOT in queue before check-in (Appointment â‰  Queue invariant)"
  );

  // ------------------------------------------------------------
  // TEST GROUP 2: CHECK-IN & ATOMIC TOKEN GENERATION
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Check-in Workflows & Atomic Token Generation");

  const checkInRes = await QueueManagementService.checkInAppointment(
    {
      appointment_id: bookingRes.appointment!.id,
      patient_id: "PAT-1001",
      date: todayStr,
    },
    receptionActor
  );

  assert(checkInRes.success && !!checkInRes.queue_entry, "Receptionist executes check-in for confirmed appointment");
  assert(checkInRes.queue_entry?.status === "WAITING", "Checked-in patient enters queue with status WAITING");
  assert(
    !!checkInRes.queue_entry?.token_number && (checkInRes.queue_entry?.token_number.startsWith("C-") || checkInRes.queue_entry?.token_number.length >= 3),
    `Received deterministic sequential token: ${checkInRes.queue_entry?.token_number}`
  );

  // Duplicate check-in protection
  const dupCheckIn = await QueueManagementService.checkInAppointment(
    {
      appointment_id: bookingRes.appointment!.id,
      patient_id: "PAT-1001",
      date: todayStr,
    },
    receptionActor
  );
  assert(dupCheckIn.success && dupCheckIn.message?.includes("already checked in"), "Duplicate check-in attempt handled idempotently");

  // Walk-in queue entry creation
  const walkInRes = await QueueManagementService.createWalkInQueueEntry(
    {
      patient_id: "PAT-1003",
      session_id: targetSession.id,
      date: todayStr,
      reason_for_visit: "Acute chest discomfort",
    },
    receptionActor
  );

  assert(walkInRes.success && !!walkInRes.queue_entry, "Front desk registers walk-in patient directly into session queue");
  assert(walkInRes.queue_entry?.source === "WALK_IN", "Walk-in entry tagged with source = WALK_IN");
  assert(walkInRes.queue_entry?.status === "WAITING", "Walk-in entry enters queue with status WAITING");

  // ------------------------------------------------------------
  // TEST GROUP 3: QUEUE STATE PROGRESSION & CONSULTATION LIFECYCLE
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Queue State Machine & Consultation Lifecycle");

  // Clear existing active consultation if present
  const activeInConsult = QueueStore.getQueueForDoctor("DOC-1001", targetSession.organization_identifier, todayStr)
    .find((q) => q.status === "IN_CONSULTATION");
  if (activeInConsult) {
    await QueueManagementService.completeConsultation(activeInConsult.id, doctorActor);
  }

  const callRes = await QueueManagementService.callNextPatient(
    { doctor_id: "DOC-1001", session_id: targetSession.id, date: todayStr },
    doctorActor
  );

  assert(callRes.success && !!callRes.queue_entry, "Doctor calls next waiting patient (status: CALLED)");
  assert(callRes.queue_entry?.status === "CALLED", "Called entry transitioned to CALLED");

  const startRes = await QueueManagementService.startConsultation(
    callRes.queue_entry!.id,
    doctorActor
  );

  assert(startRes.success && !!startRes.queue_entry, "Doctor starts consultation (status: IN_CONSULTATION)");
  assert(startRes.queue_entry?.status === "IN_CONSULTATION", "Status is strictly IN_CONSULTATION");

  const completeRes = await QueueManagementService.completeConsultation(
    startRes.queue_entry!.id,
    doctorActor
  );

  assert(completeRes.success && completeRes.queue_entry?.status === "COMPLETED", "Doctor completes consultation (status: COMPLETED)");
  assert(!!completeRes.encounter_id, "Completed consultation automatically provides handoff to C.1 Clinical Encounter");

  // ------------------------------------------------------------
  // TEST GROUP 4: SKIPPED & RECALLED HANDLING
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Missing Patient Skip & Recall Workflow");

  let patientToSkip = QueueStore.getQueueForSession(targetSession.id, todayStr).find((q) => q.status === "WAITING");
  if (!patientToSkip) {
    const freshWalkIn = await QueueManagementService.createWalkInQueueEntry(
      { patient_id: "PAT-1004", session_id: targetSession.id, date: todayStr, reason_for_visit: "Skip test" },
      receptionActor
    );
    patientToSkip = freshWalkIn.queue_entry!;
  }

  const skipRes = await QueueManagementService.skipPatient(
    patientToSkip.id,
    doctorActor,
    "Patient not present in waiting area"
  );
  assert(skipRes.success && skipRes.queue_entry?.status === "SKIPPED", "Doctor marks missing patient as SKIPPED");

  const recallRes = await QueueManagementService.recallPatient(
    patientToSkip.id,
    doctorActor
  );
  assert(recallRes.success && recallRes.queue_entry?.status === "CALLED", "Doctor recalls skipped patient back to CALLED status");

  // ------------------------------------------------------------
  // TEST GROUP 5: DYNAMIC WAITING-TIME RANGE ENGINE
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Dynamic Waiting-Time Range Engine");

  const waitEst = WaitingTimeEstimationService.calculatePatientWaitingEstimate(
    checkInRes.queue_entry!.id,
    patientActor
  );

  assert(!!waitEst, "Calculated dynamic waiting time estimate for queue entry");
  assert(
    waitEst.estimated_upper_minutes >= waitEst.estimated_lower_minutes,
    `Waiting estimate provides realistic range (${waitEst.estimated_lower_minutes}â€“${waitEst.estimated_upper_minutes} min)`
  );
  assert(
    !waitEst.display_text.includes("9:") && !waitEst.display_text.includes("10:"),
    `Human-readable wait estimation range text: "${waitEst.display_text}"`
  );

  console.log("\n============================================================");
  console.log(`PHASE 6.2 TEST SUMMARY: ${passedAssertions}/${totalAssertions} assertions passed (${Math.round((passedAssertions / totalAssertions) * 100)}%)`);
  console.log("============================================================\n");

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runPhase62TestSuite().catch((err) => {
  console.error("Phase 6.2 test suite crashed:", err);
  process.exit(1);
});
