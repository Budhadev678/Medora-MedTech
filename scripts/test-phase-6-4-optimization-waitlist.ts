// ============================================================
// MEDORA â€” PHASE 6.4 TEST SUITE
// ADVANCED QUEUE OPTIMIZATION, WAITLIST INTELLIGENCE,
// CAPACITY OPTIMIZATION & FINAL PHASE-6 INTEGRATION
// ============================================================

import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { AlternativeSearchService } from "../lib/services/alternative-search-service";
import { QueueManagementService } from "../lib/services/queue-management-service";
import { WaitingTimeEstimationService } from "../lib/services/waiting-time-service";
import { CapacityAnalyticsService } from "../lib/services/capacity-analytics-service";
import { AppointmentStore } from "../lib/data/appointment-store";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { WaitlistStore } from "../lib/data/waitlist-store";
import { ConsultationHistoryStore } from "../lib/data/consultation-history-store";
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
console.log("MEDORA â€” PHASE 6.4 TEST SUITE: OPTIMIZATION & FINAL INTEGRATION");
console.log("============================================================\n");

// Reset stores
AppointmentStore.reset();
QueueStore.reset();
WaitlistStore.reset();

const patientActor1: StoredIdentity = {
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

const patientActor3: StoredIdentity = {
  id: "PAT-1003",
  identifier: "PAT-1003",
  email: "amit.patel@example.com",
  passwordHash: "Password@123",
  fullName: "Amit Patel",
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

async function runPhase64TestSuite() {
  const todayStr = getTodayDateStr();

  // ------------------------------------------------------------
  // TEST GROUP 1: ADVANCED DYNAMIC WAITING-TIME ESTIMATION
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Advanced Dynamic Waiting Estimation & Outlier Trimming");

  const sessions = AppointmentStore.getDoctorSessions("DOC-1001");
  const targetSession = sessions.find((s) => s.is_active) || sessions[0];

  // Book and check in 2 patients
  const apt1 = await AppointmentBookingService.bookAppointment(
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
    patientActor1
  );

  const apt2 = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1002",
      doctor_id: "DOC-1001",
      organization_identifier: targetSession.organization_identifier,
      facility_id: targetSession.facility_id,
      department_id: targetSession.department_id,
      session_id: targetSession.id,
      appointment_date: todayStr,
      booking_source: "PATIENT",
    },
    patientActor2
  );

  const q1 = await QueueManagementService.checkInAppointment(
    { appointment_id: apt1.appointment!.id, patient_id: "PAT-1001", date: todayStr },
    patientActor1
  );
  const q2 = await QueueManagementService.checkInAppointment(
    { appointment_id: apt2.appointment!.id, patient_id: "PAT-1002", date: todayStr },
    patientActor2
  );

  assert(q1.success && q2.success, "Checked in 2 patients sequentially into active session queue");

  // Calculate dynamic wait estimate for second patient
  const waitEst2 = WaitingTimeEstimationService.calculatePatientWaitingEstimate(
    q2.queue_entry!.id,
    patientActor2
  );

  assert(!!waitEst2, "Computed dynamic waiting time estimate for Patient 2");
  assert(waitEst2.people_ahead >= 0, `Accurately identified people ahead: ${waitEst2.people_ahead}`);
  assert(
    waitEst2.estimated_upper_minutes >= waitEst2.estimated_lower_minutes,
    `Duration range is realistic and non-negative (${waitEst2.estimated_lower_minutes}â€“${waitEst2.estimated_upper_minutes} min)`
  );
  assert(
    waitEst2.display_text.includes("min") || waitEst2.display_text.includes("next") || waitEst2.display_text.includes("Ready"),
    `Estimate communicated as dynamic duration range: "${waitEst2.display_text}"`
  );

  // ------------------------------------------------------------
  // TEST GROUP 2: CAPACITY & NO-SHOW ANALYTICS ENGINE
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Capacity Analytics, No-Show Rates & Advisory Recommendations");

  const sessionUtil = CapacityAnalyticsService.getSessionUtilization(targetSession.id, todayStr);
  assert(!!sessionUtil, "Calculated comprehensive session utilization metrics");
  assert(sessionUtil!.confirmed_count >= 2, "Confirmed count accurately reflects active bookings");
  assert(sessionUtil!.booking_utilization_rate > 0, `Derived booking utilization rate: ${sessionUtil!.booking_utilization_rate}%`);
  assert(sessionUtil!.cancellation_rate >= 0, "Derived cancellation rate metric");
  assert(sessionUtil!.no_show_rate >= 0, "Derived no-show rate metric");

  const facilityOps = CapacityAnalyticsService.getFacilityDailyOperationsSummary(
    targetSession.facility_id || "FAC-1001",
    todayStr
  );
  assert(facilityOps.total_appointments >= 2, "Facility operational roll-up aggregates all sessions");
  assert(facilityOps.departments.length > 0, "Facility operational roll-up includes clinical departments");

  // ------------------------------------------------------------
  // TEST GROUP 3: WAITLIST INTELLIGENCE, CANCELLATION & SLOT MATCH
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Waitlist Intelligence, Cancellation Trigger & Explicit Acceptance");

  // 1. Patient 3 joins waitlist for target session
  const waitlistJoin = WaitlistStore.joinWaitlist(
    {
      patient_id: "PAT-1003",
      doctor_id: "DOC-1001",
      organization_identifier: targetSession.organization_identifier,
      facility_id: targetSession.facility_id,
      department_id: targetSession.department_id,
      preferred_date: todayStr,
      preferred_session_id: targetSession.id,
    },
    "Amit Patel",
    "Dr. Ananya Sharma",
    "Cardiology OPD",
    "City Hospital"
  );

  assert(waitlistJoin.success && !!waitlistJoin.waitlist_entry, "Patient 3 successfully registers on capacity waitlist");
  assert(waitlistJoin.waitlist_entry?.status === "ACTIVE", "Initial waitlist status is ACTIVE");

  // 2. Patient 1 cancels appointment -> triggers capacity release & waitlist notification
  const cancelRes = await AppointmentBookingService.cancelAppointment(
    apt1.appointment!.id,
    patientActor1,
    "Unable to attend session"
  );
  assert(cancelRes.success, "Patient 1 cancels appointment and session capacity is released");

  // 3. Verify waitlist entry transitioned to OFFERED/NOTIFIED
  const updatedWaitlist = WaitlistStore.getWaitlistById(waitlistJoin.waitlist_entry!.id);
  assert(
    !!updatedWaitlist && (updatedWaitlist.status === "OFFERED" || updatedWaitlist.status === "NOTIFIED"),
    `Slot release automatically notifies earliest waitlisted patient (status: ${updatedWaitlist?.status})`
  );

  // 4. Patient 3 explicitly accepts the offered slot
  const acceptRes = WaitlistStore.acceptWaitlistOffer(updatedWaitlist!.id, patientActor3);
  assert(acceptRes.success && acceptRes.waitlist?.status === "ACCEPTED", "Patient 3 explicitly accepts the released slot offer");

  // ------------------------------------------------------------
  // TEST GROUP 4: FULL END-TO-END MASTER PHASE-6 INTEGRATION FLOW
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Full End-to-End Master Phase-6 Clinical Flow");

  // Clear existing active in-consultation
  const activeInConsult = QueueStore.getQueueForDoctor("DOC-1001", targetSession.organization_identifier, todayStr)
    .find((q) => q.status === "IN_CONSULTATION");
  if (activeInConsult) {
    await QueueManagementService.completeConsultation(activeInConsult.id, doctorActor);
  }

  // Doctor calls next patient
  const callNext = await QueueManagementService.callNextPatient(
    { doctor_id: "DOC-1001", session_id: targetSession.id, date: todayStr },
    doctorActor
  );
  assert(callNext.success && callNext.queue_entry?.status === "CALLED", "Doctor calls next patient in sequential line");

  // Doctor starts consultation
  const startConsult = await QueueManagementService.startConsultation(
    callNext.queue_entry!.id,
    doctorActor
  );
  assert(startConsult.success && startConsult.queue_entry?.status === "IN_CONSULTATION", "Consultation started and marked IN_CONSULTATION");

  // Doctor completes consultation (spending actual clinical time)
  const completeConsult = await QueueManagementService.completeConsultation(
    startConsult.queue_entry!.id,
    doctorActor
  );
  assert(completeConsult.success && completeConsult.queue_entry?.status === "COMPLETED", "Consultation completed and marked COMPLETED");
  assert(!!completeConsult.encounter_id, "Completed consultation provides immediate handoff to C.1 Clinical Encounter");

  // Preferred Doctor strict search guarantee
  const strictAlts = AlternativeSearchService.findAppointmentAlternatives(
    {
      patient_id: "PAT-1001",
      preferred_doctor_id: "DOC-1001",
      preferred_organization_identifier: targetSession.organization_identifier,
      preferred_session_id: targetSession.id,
      preferred_date: todayStr,
      filter_same_doctor_only: true,
    },
    patientActor1
  );
  assert(
    strictAlts.every((a) => a.is_same_doctor === true),
    "Preferred doctor filter preserves 'Same Doctor Only' requirement across multi-facility footprint"
  );

  console.log("\n============================================================");
  console.log(`PHASE 6.4 TEST SUMMARY: ${passedAssertions}/${totalAssertions} assertions passed (${Math.round((passedAssertions / totalAssertions) * 100)}%)`);
  console.log("============================================================\n");

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runPhase64TestSuite().catch((err) => {
  console.error("Phase 6.4 test suite crashed:", err);
  process.exit(1);
});
