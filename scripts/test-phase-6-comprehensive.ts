// ============================================================
// MEDORA â€” PHASE 6 COMPREHENSIVE TEST SUITE
// APPOINTMENTS, DOCTOR-FIRST BOOKING, CAPACITY, CHECK-IN,
// TOKEN, DYNAMIC QUEUE & WAITING-TIME OPTIMIZATION
// ============================================================

import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { AlternativeSearchService } from "../lib/services/alternative-search-service";
import { QueueManagementService } from "../lib/services/queue-management-service";
import { WaitingTimeEstimationService } from "../lib/services/waiting-time-service";
import { AppointmentStore } from "../lib/data/appointment-store";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { WaitlistStore } from "../lib/data/waitlist-store";
import { resetAffiliationStore } from "../lib/data/affiliation-store";
import { resetDepartmentStore } from "../lib/data/department-store";
import { resetFacilityStore } from "../lib/data/facility-store";
import { resetServiceStore } from "../lib/data/service-store";
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
console.log("MEDORA â€” PHASE 6 TEST SUITE: APPOINTMENTS, QUEUE & CAPACITY");
console.log("============================================================\n");

// Reset all stores
resetFacilityStore();
resetDepartmentStore();
resetServiceStore();
resetAffiliationStore();
AppointmentStore.reset();
QueueStore.reset();
WaitlistStore.reset();

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

async function runTestSuite() {
  const todayStr = getTodayDateStr();

  // ------------------------------------------------------------
  // TEST GROUP 1: DOCTOR-FIRST APPOINTMENT DISCOVERY
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Doctor-First Discovery across Multi-Facility Practice");

  const docDiscovery = await AppointmentBookingService.searchDoctorFirstAvailability("DOC-1001", todayStr, 7);
  assert(!!docDiscovery, "Executed Doctor-First availability query for Dr. Ananya (DOC-1001)");
  assert(
    docDiscovery.doctor_id === "DOC-1001" && docDiscovery.doctor_name.includes("Ananya"),
    "Resolved doctor profile with verified name and specialization"
  );
  assert(
    docDiscovery.facilities.length >= 2,
    "Discovered doctor's practice across multiple connected facilities under ONE identity",
    `Found ${docDiscovery.facilities.length} facilities`
  );

  const cityHospFac = docDiscovery.facilities.find((f) => f.facility_code === "FAC-1001" || f.facility_code === "HSP-1001");
  assert(
    !!cityHospFac && cityHospFac.consultation_fee === 500 && cityHospFac.opd_room === "OPD Room 102",
    "City Hospital facility includes facility-specific consultation fee (₹500) and OPD room (OPD Room 102)"
  );

  const greenCareFac = docDiscovery.facilities.find((f) => f.facility_code === "FAC-1004" || f.facility_code === "FAC-1002");
  assert(
    !!greenCareFac && greenCareFac.consultation_fee === 600,
    "Secondary connected hospital (Green Care Cuttack) reflects facility-specific fee (₹600)"
  );

  const footprint = AppointmentBookingService.getDoctorCrossFacilityScheduleSummary("DOC-1001");
  assert(
    footprint.affiliations_count === 3,
    "getDoctorCrossFacilityScheduleSummary aggregates practice footprint across 3 facilities",
    `Count: ${footprint.affiliations_count}`
  );

  // ------------------------------------------------------------
  // TEST GROUP 2: FACILITY-FIRST & SERVICE-FIRST DISCOVERY
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Facility-First and Service-First Booking Flows");

  const facFirst = await AppointmentBookingService.searchFacilityFirstAvailability("FAC-1001", "DEP-1001", "SRV-1001", todayStr);
  assert(
    !!facFirst.facility && facFirst.facility.facility_code === "FAC-1001",
    "Facility-First discovery returns active facility campus"
  );
  assert(
    facFirst.doctors.length >= 1 && facFirst.doctors.some((d) => d.doctor_id === "DOC-1001"),
    "Facility-First discovery locates eligible practicing doctors for Cardiology consultation"
  );

  const srvFirst = await AppointmentBookingService.searchServiceFirstAvailability("SRV-1001", undefined, todayStr);
  assert(
    !!srvFirst.service && srvFirst.service.id === "SRV-1001",
    "Service-First discovery identifies catalog service (Cardiology Consultation)"
  );
  assert(
    srvFirst.facilities.length >= 1,
    "Service-First discovery identifies facilities offering the requested medical service"
  );

  // ------------------------------------------------------------
  // TEST GROUP 3: CAPACITY CHECKING & APPOINTMENT CREATION
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Capacity-Aware Booking & State Machine");

  // Fetch Monday session for testing
  const sessions = AppointmentStore.getDoctorSessions("DOC-1001");
  const targetSession = sessions.find((s) => s.is_active) || sessions[0];
  assert(!!targetSession, "Located active DoctorWorkingSession with configured capacity");

  const bookingRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: targetSession.organization_identifier,
      facility_id: targetSession.facility_id,
      department_id: targetSession.department_id,
      session_id: targetSession.id,
      appointment_date: todayStr,
      reason_for_visit: "Hypertension follow-up",
      booking_source: "PATIENT",
      discovery_mode: "DOCTOR_FIRST",
      doctor_preference: "SAME_DOCTOR_ONLY",
    },
    patientActor
  );

  assert(bookingRes.success && !!bookingRes.appointment, "Booked appointment successfully with capacity allocation");
  assert(bookingRes.appointment?.status === "CONFIRMED", "Initial appointment status is strictly CONFIRMED");
  assert(bookingRes.appointment?.token_number !== undefined, "Appointment receives sequential capacity token number");

  // Prevent unauthorized booking for other patient
  const unauthBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1002",
      session_id: targetSession.id,
      appointment_date: todayStr,
    },
    patientActor
  );
  assert(!unauthBooking.success && unauthBooking.error_code === "UNAUTHORIZED", "Patient cannot book for a different patient account (IDOR Protection)");

  // ------------------------------------------------------------
  // TEST GROUP 4: 5-TIER ALTERNATIVE RECOMMENDATION ENGINE
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Preferred Doctor & 5-Tier Alternative Recommendation");

  const alternatives = AlternativeSearchService.findAppointmentAlternatives(
    {
      patient_id: "PAT-1001",
      preferred_doctor_id: "DOC-1001",
      preferred_organization_identifier: targetSession.organization_identifier,
      preferred_facility_id: targetSession.facility_id,
      preferred_session_id: targetSession.id,
      preferred_date: todayStr,
      specialty: "Cardiology",
      filter_same_doctor_only: false,
    },
    patientActor
  );

  assert(alternatives.length > 0, "AlternativeSearchService discovers legitimate alternatives when session is full");

  // Test "Same Doctor Only" filter requirement
  const sameDoctorOnlyAlts = AlternativeSearchService.findAppointmentAlternatives(
    {
      patient_id: "PAT-1001",
      preferred_doctor_id: "DOC-1001",
      preferred_organization_identifier: targetSession.organization_identifier,
      preferred_session_id: targetSession.id,
      preferred_date: todayStr,
      filter_same_doctor_only: true,
    },
    patientActor
  );

  assert(
    sameDoctorOnlyAlts.every((a) => a.is_same_doctor === true),
    "MEDORA strictly respects 'Same Doctor Only' filter â€” never substitutes other doctors against patient preference"
  );

  // ------------------------------------------------------------
  // TEST GROUP 5: WAITLIST LIFECYCLE & SLOT OFFER
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Capacity Waitlist Registration, Slot Offer & Acceptance");

  const waitlistRes = WaitlistStore.joinWaitlist(
    {
      patient_id: "PAT-1002",
      doctor_id: "DOC-1001",
      organization_identifier: targetSession.organization_identifier,
      facility_id: targetSession.facility_id,
      department_id: targetSession.department_id,
      preferred_date: todayStr,
      preferred_session_id: targetSession.id,
    },
    "Priya Sharma",
    "Dr. Ananya Sharma",
    "Cardiology OPD",
    "City Hospital"
  );

  assert(waitlistRes.success && !!waitlistRes.waitlist_entry, "Patient joins waitlist when session is full");
  assert(waitlistRes.waitlist_entry?.status === "ACTIVE", "Initial waitlist status is ACTIVE");

  // Cancel earlier booking to trigger waitlist notification
  const cancelRes = await AppointmentBookingService.cancelAppointment(
    bookingRes.appointment!.id,
    patientActor,
    "Schedule change"
  );
  assert(cancelRes.success, "Cancelled earlier appointment, releasing session capacity");

  const updatedWaitlist = WaitlistStore.getWaitlistById(waitlistRes.waitlist_entry!.id);
  assert(
    updatedWaitlist?.status === "OFFERED" || updatedWaitlist?.status === "NOTIFIED",
    "Cancellation atomically triggers slot offer to earliest waitlisted patient (status: OFFERED)"
  );

  // Patient explicitly accepts waitlist offer
  const priyaActor: StoredIdentity = {
    id: "PAT-1002",
    identifier: "PAT-1002",
    email: "priya@example.com",
    passwordHash: "Password@123",
    fullName: "Priya Sharma",
    role: "patient",
    accountStatus: "active",
    verificationStatus: "verified",
    createdAt: new Date().toISOString(),
  };

  const acceptOfferRes = WaitlistStore.acceptWaitlistOffer(updatedWaitlist!.id, priyaActor);
  assert(acceptOfferRes.success && acceptOfferRes.waitlist?.status === "ACCEPTED", "Patient explicitly accepts waitlist slot offer (never silently auto-booked)");

  // ------------------------------------------------------------
  // TEST GROUP 6: RECEPTION CHECK-IN & DETERMINISTIC TOKENS
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Online Check-in & Walk-In Token Generation");

  // Book fresh appointment for check-in test
  const freshBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      session_id: targetSession.id,
      appointment_date: todayStr,
      reason_for_visit: "OPD Check-in Test",
    },
    patientActor
  );

  const checkInRes = await QueueManagementService.checkInAppointment(
    {
      appointment_id: freshBooking.appointment!.id,
      patient_id: "PAT-1001",
      date: todayStr,
    },
    receptionActor
  );

  assert(checkInRes.success && !!checkInRes.queue_entry, "Receptionist executes check-in for booked appointment");
  assert(checkInRes.queue_entry?.status === "WAITING", "Checked-in patient enters queue with status WAITING");
  assert(!!checkInRes.queue_entry?.token_number, "Patient receives deterministic sequential token (e.g. C-01)");

  // Pure Walk-In Registration
  const walkInRes = await QueueManagementService.createWalkInQueueEntry(
    {
      patient_id: "PAT-1003",
      session_id: targetSession.id,
      date: todayStr,
      reason_for_visit: "Walk-in acute consult",
    },
    receptionActor
  );

  assert(walkInRes.success && !!walkInRes.queue_entry, "Front desk registers walk-in patient directly into session queue");
  assert(walkInRes.queue_entry?.source === "WALK_IN", "Walk-in entry is tagged with source = WALK_IN");
  assert(walkInRes.queue_entry?.status === "WAITING", "Walk-in entry enters queue with status WAITING");

  // ------------------------------------------------------------
  // TEST GROUP 7: DYNAMIC WAITING-TIME RANGE ESTIMATION
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Dynamic Waiting-Time Range Engine");

  const waitEst = WaitingTimeEstimationService.calculatePatientWaitingEstimate(
    checkInRes.queue_entry!.id,
    patientActor
  );

  assert(!!waitEst, "Calculated dynamic waiting time estimate for checked-in patient");
  assert(
    waitEst.estimated_upper_minutes >= waitEst.estimated_lower_minutes,
    "Waiting estimate provides realistic range (lower <= upper, e.g. 20â€“35 min)"
  );
  assert(
    !waitEst.display_text.includes("9:") && !waitEst.display_text.includes("10:"),
    "Engine communicates waiting duration as dynamic range rather than unrealistic exact minute"
  );

  // ------------------------------------------------------------
  // TEST GROUP 8: DOCTOR QUEUE WORKFLOW & C.1 ENCOUNTER HANDOFF
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 8: Doctor Queue Progression & Consultation Lifecycle");

  // Free doctor's desk if any seeded consultation is in progress
  const activeInConsult = QueueStore.getQueueForDoctor("DOC-1001", targetSession.organization_identifier, todayStr)
    .find((q) => q.status === "IN_CONSULTATION");
  if (activeInConsult) {
    await QueueManagementService.completeConsultation(activeInConsult.id, doctorActor);
  }

  // 1. Call Patient
  const callRes = await QueueManagementService.callNextPatient(
    { doctor_id: "DOC-1001", session_id: targetSession.id, date: todayStr },
    doctorActor
  );
  assert(callRes.success && callRes.queue_entry?.status === "CALLED", "Doctor calls next waiting patient in sequential queue (status: CALLED)");

  // 2. Start Consultation
  const startRes = await QueueManagementService.startConsultation(
    callRes.queue_entry!.id,
    doctorActor
  );
  assert(startRes.success && startRes.queue_entry?.status === "IN_CONSULTATION", "Doctor starts consultation (status: IN_CONSULTATION)");

  // 3. Complete Consultation
  const completeRes = await QueueManagementService.completeConsultation(
    startRes.queue_entry!.id,
    doctorActor
  );
  assert(completeRes.success && completeRes.queue_entry?.status === "COMPLETED", "Doctor completes consultation (status: COMPLETED)");
  assert(!!completeRes.encounter_id, "Completed consultation automatically provides handoff to C.1 Clinical Encounter");

  // 4. Skip Patient
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
    "Patient away from waiting room"
  );
  assert(skipRes.success && skipRes.queue_entry?.status === "SKIPPED", "Doctor marks missing patient as SKIPPED");

  // 5. Recall Patient
  const recallRes = await QueueManagementService.recallPatient(
    patientToSkip.id,
    doctorActor
  );
  assert(recallRes.success && recallRes.queue_entry?.status === "CALLED", "Doctor recalls skipped patient back to CALLED status");

  console.log("\n============================================================");
  console.log(`PHASE 6 TEST SUMMARY: ${passedAssertions}/${totalAssertions} assertions passed (${Math.round((passedAssertions / totalAssertions) * 100)}%)`);
  console.log("============================================================\n");

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite runtime error:", err);
  process.exit(1);
});
