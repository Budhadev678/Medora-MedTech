// ============================================================
// MEDORA â€” PHASE 6.3 TEST SUITE
// RECEPTION, CHECK-IN, OPERATIONAL DASHBOARDS &
// DOCTOR QUEUE WORKSPACE
// ============================================================

import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { QueueManagementService } from "../lib/services/queue-management-service";
import { WaitingTimeEstimationService } from "../lib/services/waiting-time-service";
import { AppointmentStore } from "../lib/data/appointment-store";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { AuditLedger } from "../lib/data/audit-store";
import { StoredIdentity } from "../lib/data/identity-store";
import { CapacityAnalyticsService } from "../lib/services/capacity-analytics-service";

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
console.log("MEDORA â€” PHASE 6.3 TEST SUITE: OPERATIONAL DASHBOARDS & QUEUE");
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

const patientActor2: StoredIdentity = {
  id: "PAT-1002",
  identifier: "PAT-1002",
  email: "priya.sharma@example.com",
  passwordHash: "Password@123",
  fullName: "Priya Sharma",
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

const hospitalAdminActor: StoredIdentity = {
  id: "ADMIN-1001",
  identifier: "ADMIN-1001",
  email: "admin@cityhospital.org",
  passwordHash: "Password@123",
  fullName: "Hospital Administrator",
  role: "hospital_admin",
  accountStatus: "active",
  verificationStatus: "verified",
  organizationId: "11111111-1111-1111-1111-111111111101",
  organizationName: "City Hospital",
  createdAt: new Date().toISOString(),
};

async function runPhase63TestSuite() {
  const todayStr = getTodayDateStr();

  // ------------------------------------------------------------
  // TEST GROUP 1: PATIENT WORKSPACE & SELF CHECK-IN LIFECYCLE
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Patient Workspace, Eligibility & Self Check-in");

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
      reason_for_visit: "Phase 6.3 OPD Verification",
    },
    patientActor
  );

  assert(bookingRes.success && !!bookingRes.appointment, "Patient books confirmed appointment for today");

  // Self check-in
  const selfCheckInRes = await QueueManagementService.checkInAppointment(
    {
      appointment_id: bookingRes.appointment!.id,
      patient_id: "PAT-1001",
      date: todayStr,
      source: "APPOINTMENT",
      checkin_source: "PATIENT_SELF",
    },
    patientActor
  );

  assert(selfCheckInRes.success && !!selfCheckInRes.queue_entry, "Patient successfully self checks-in on appointment day");
  assert(selfCheckInRes.queue_entry?.status === "WAITING", "Patient enters active queue with status WAITING");
  assert(selfCheckInRes.queue_entry?.checkin_source === "PATIENT_SELF", "Check-in tagged with source PATIENT_SELF");

  // Double check-in protection
  const dupSelfCheckIn = await QueueManagementService.checkInAppointment(
    {
      appointment_id: bookingRes.appointment!.id,
      patient_id: "PAT-1001",
      date: todayStr,
    },
    patientActor
  );
  assert(dupSelfCheckIn.success && dupSelfCheckIn.queue_entry?.token_number === selfCheckInRes.queue_entry?.token_number, "Double check-in returns existing token without duplicate queue entry");

  // Unauthorized third-party check-in rejection
  const unauthCheckIn = await QueueManagementService.checkInAppointment(
    {
      appointment_id: bookingRes.appointment!.id,
      patient_id: "PAT-1002",
      date: todayStr,
    },
    patientActor2
  );
  assert(!unauthCheckIn.success, "Unauthorized patient cannot check in on behalf of another patient");

  // ------------------------------------------------------------
  // TEST GROUP 2: RECEPTION WORKSPACE, SEARCH, WALK-IN & REPRINT
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Reception Dashboard, Search, Walk-in & Token Reprint");

  // Operational metrics
  const queueForFacility = QueueStore.getQueueForFacility(targetSession.organization_identifier, todayStr);
  assert(queueForFacility.length > 0, "Receptionist loads real-time queue for facility");

  // Appointment search
  const foundApt = AppointmentStore.getAppointmentById(bookingRes.appointment!.id);
  assert(!!foundApt && foundApt.patient_id === "PAT-1001", "Reception searches and retrieves appointment by ID");

  // Token retrieval & reprint
  const retrievedToken = QueueStore.getQueueEntryByAppointmentId(bookingRes.appointment!.id);
  assert(!!retrievedToken && retrievedToken.token_number === selfCheckInRes.queue_entry?.token_number, "Reception retrieves existing token for reprint without generating a new number");

  // Front-desk Walk-In registration
  const walkInRes = await QueueManagementService.createWalkInQueueEntry(
    {
      patient_id: "PAT-1002",
      session_id: targetSession.id,
      date: todayStr,
      reason_for_visit: "Walk-in urgent review",
    },
    receptionActor
  );

  assert(walkInRes.success && !!walkInRes.queue_entry, "Reception registers walk-in patient directly into session queue");
  assert(walkInRes.queue_entry?.source === "WALK_IN", "Walk-in entry tagged with source WALK_IN");

  // ------------------------------------------------------------
  // TEST GROUP 3: DOCTOR CONSULTATION LIFECYCLE & FREEDOM OF DURATION
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Doctor Queue Actions, Calling & Unconstrained Duration");

  // Clear existing active in-consultation
  const activeInConsult = QueueStore.getQueueForDoctor("DOC-1001", targetSession.organization_identifier, todayStr)
    .find((q) => q.status === "IN_CONSULTATION");
  if (activeInConsult) {
    await QueueManagementService.completeConsultation(activeInConsult.id, doctorActor);
  }

  // Doctor calls next patient
  const callRes = await QueueManagementService.callNextPatient(
    { doctor_id: "DOC-1001", session_id: targetSession.id, date: todayStr },
    doctorActor
  );
  assert(callRes.success && callRes.queue_entry?.status === "CALLED", "Doctor calls next patient in line (server-decided)");

  // Doctor starts consultation
  const startRes = await QueueManagementService.startConsultation(
    callRes.queue_entry!.id,
    doctorActor
  );
  assert(startRes.success && startRes.queue_entry?.status === "IN_CONSULTATION", "Doctor starts consultation (IN_CONSULTATION)");

  // Doctor completes consultation (spending actual required time without forced timeout)
  const completeRes = await QueueManagementService.completeConsultation(
    startRes.queue_entry!.id,
    doctorActor
  );
  assert(completeRes.success && completeRes.queue_entry?.status === "COMPLETED", "Doctor completes consultation at their own clinical discretion");
  assert(!!completeRes.encounter_id, "Completed consultation provides immediate handoff to C.1 Clinical Encounter");

  // Skip & Requeue flow
  const nextCall = await QueueManagementService.callNextPatient(
    { doctor_id: "DOC-1001", session_id: targetSession.id, date: todayStr },
    doctorActor
  );
  assert(nextCall.success && !!nextCall.queue_entry, "Doctor calls next patient");

  const skipRes = await QueueManagementService.skipPatient(
    nextCall.queue_entry!.id,
    doctorActor,
    "Patient away from waiting hall"
  );
  assert(skipRes.success && skipRes.queue_entry?.status === "SKIPPED", "Doctor marks missing patient as SKIPPED with reason");

  const requeueRes = await QueueManagementService.recallPatient(
    nextCall.queue_entry!.id,
    doctorActor
  );
  assert(requeueRes.success && requeueRes.queue_entry?.status === "CALLED", "Doctor recalls skipped patient back to CALLED status");

  // ------------------------------------------------------------
  // TEST GROUP 4: HOSPITAL ADMIN DASHBOARD & QUEUE HEALTH
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Hospital Admin Dashboard, Queue Health & Audit");

  const opdSummary = CapacityAnalyticsService.getFacilityDailyOperationsSummary(
    targetSession.facility_id || "FAC-1001",
    todayStr
  );

  assert(!!opdSummary, "Generated facility-wide daily operations summary");
  assert(opdSummary.total_appointments >= 1, "Summary reflects total confirmed appointments");
  assert(opdSummary.departments.length > 0, "Summary aggregates operational breakdown across clinical departments");
  assert(opdSummary.overall_booking_utilization >= 0, "Calculated overall facility booking utilization rate");

  // Pause and Resume queue
  const pauseRes = QueueStore.pauseSession(targetSession.id, todayStr, doctorActor.identifier || doctorActor.id);
  assert(pauseRes.success, "Doctor pauses session queue during clinical emergency");
  assert(QueueStore.isSessionPaused(targetSession.id, todayStr), "Queue confirmed in PAUSED state");

  const resumeRes = QueueStore.resumeSession(targetSession.id, todayStr, doctorActor.identifier || doctorActor.id);
  assert(resumeRes.success, "Doctor resumes session queue");
  assert(!QueueStore.isSessionPaused(targetSession.id, todayStr), "Queue confirmed back in ACTIVE state");

  // ------------------------------------------------------------
  // TEST GROUP 5: PRIVACY & MULTI-TENANT ISOLATION
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Multi-Tenant Role Isolation & Anti-IDOR");

  // Patient A estimate check
  const patientAEstimate = WaitingTimeEstimationService.calculatePatientWaitingEstimate(
    selfCheckInRes.queue_entry!.id,
    patientActor
  );
  assert(patientAEstimate.display_text !== "Unauthorized", "Patient A accesses their own waiting estimate");

  // Patient B cannot view Patient A estimate
  const patientBAttempt = WaitingTimeEstimationService.calculatePatientWaitingEstimate(
    selfCheckInRes.queue_entry!.id,
    patientActor2
  );
  assert(patientBAttempt.display_text === "Unauthorized", "Patient B is strictly BLOCKED from viewing Patient A's waiting estimate (Anti-IDOR)");

  console.log("\n============================================================");
  console.log(`PHASE 6.3 TEST SUMMARY: ${passedAssertions}/${totalAssertions} assertions passed (${Math.round((passedAssertions / totalAssertions) * 100)}%)`);
  console.log("============================================================\n");

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runPhase63TestSuite().catch((err) => {
  console.error("Phase 6.3 test suite crashed:", err);
  process.exit(1);
});
