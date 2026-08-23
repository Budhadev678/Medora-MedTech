// ============================================================
// MEDORA â€” MODIFICATION PHASE B.1 AUTOMATED TEST SUITE
// DOCTOR AVAILABILITY, CAPACITY & INTELLIGENT APPOINTMENT BOOKING
// ============================================================

import { AppointmentStore } from "../lib/data/appointment-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { findIdentityById, findIdentityByEmail } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  âœ… PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  âŒ FAIL: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

async function runTests() {
  console.log("\n============================================================");
  console.log("ðŸ§ª STARTING PHASE B.1 DOCTOR AVAILABILITY & CAPACITY TESTS");
  console.log("============================================================\n");

  // Reset store to known state
  AppointmentStore.reset();

  const patientA = findIdentityById("PAT-1001");
  const patientB = findIdentityById("PAT-1002");
  const docAnanya = findIdentityById("DOC-1001");
  const staffAnita = findIdentityById("PER-STAFF-1002") || findIdentityById("STAFF-1002");
  const hospAdmin = findIdentityByEmail("admin@cityhospital.org") || findIdentityById("HSP-1001");

  // ------------------------------------------------------------
  // TEST 1 â€” Capacity 3, Bookings 0 -> 3 Remaining
  // ------------------------------------------------------------
  console.log("--- TEST 1: CAPACITY & REMAINING CALCULATION (0 BOOKINGS) ---");
  const availT1 = await AppointmentBookingService.getDoctorAvailability(
    "DOC-TEST-99",
    "HSP-TEST-99",
    "FAC-TEST-99",
    "2026-08-31" // Monday
  );
  assert(availT1.length > 0, "Test doctor has active working session on Monday");
  const sessT1 = availT1[0];
  assert(sessT1.capacity === 3, "Configured capacity is 3");
  assert(sessT1.booked_count === 0, "Current booked count is 0");
  assert(sessT1.remaining_capacity === 3, "Remaining capacity is 3");
  assert(sessT1.status === "AVAILABLE", "Session status is AVAILABLE");

  // ------------------------------------------------------------
  // TEST 2 â€” Capacity 3, Bookings 1 -> 2 Remaining
  // ------------------------------------------------------------
  console.log("\n--- TEST 2: SINGLE APPOINTMENT BOOKING & CAPACITY DECREMENT ---");
  const bookRes1 = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-TEST-99",
      organization_identifier: "HSP-TEST-99",
      facility_id: "FAC-TEST-99",
      department_id: "DEP-TEST-99",
      session_id: sessT1.session_id,
      appointment_date: "2026-08-31",
      reason_for_visit: "Test Consultation 1",
    },
    patientA
  );
  assert(bookRes1.success, "Patient A successfully booked appointment #1");
  assert(bookRes1.appointment?.appointment_no.startsWith("APT-") ?? false, "Valid appointment ID issued");

  const availT2 = await AppointmentBookingService.getDoctorAvailability(
    "DOC-TEST-99",
    "HSP-TEST-99",
    "FAC-TEST-99",
    "2026-08-31"
  );
  assert(availT2[0].booked_count === 1, "Booked count incremented to 1");
  assert(availT2[0].remaining_capacity === 2, "Remaining capacity decremented to 2");
  assert(availT2[0].status === "LIMITED", "Session status transitioned to LIMITED (<=2)");

  // ------------------------------------------------------------
  // TEST 3 â€” Capacity 3, Bookings 3 -> FULL, 4th Booking Denied
  // ------------------------------------------------------------
  console.log("\n--- TEST 3: CAPACITY EXHAUSTION & OVERBOOKING PREVENTION ---");
  // Book 2nd patient
  const bookRes2 = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1002",
      doctor_id: "DOC-TEST-99",
      organization_identifier: "HSP-TEST-99",
      facility_id: "FAC-TEST-99",
      department_id: "DEP-TEST-99",
      session_id: sessT1.session_id,
      appointment_date: "2026-08-31",
      reason_for_visit: "Test Consultation 2",
    },
    patientB
  );
  assert(bookRes2.success, "Patient B successfully booked appointment #2");

  // Book 3rd patient
  const bookRes3 = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1003",
      doctor_id: "DOC-TEST-99",
      organization_identifier: "HSP-TEST-99",
      facility_id: "FAC-TEST-99",
      department_id: "DEP-TEST-99",
      session_id: sessT1.session_id,
      appointment_date: "2026-08-31",
      reason_for_visit: "Test Consultation 3",
    },
    { id: "PAT-1003", identifier: "PAT-1003", fullName: "Patient 3", role: "patient", email: "p3@test.com" } as any
  );
  assert(bookRes3.success, "Patient 3 successfully booked appointment #3 (Cap reached)");

  const availT3 = await AppointmentBookingService.getDoctorAvailability(
    "DOC-TEST-99",
    "HSP-TEST-99",
    "FAC-TEST-99",
    "2026-08-31"
  );
  assert(availT3[0].booked_count === 3, "Booked count is 3/3");
  assert(availT3[0].remaining_capacity === 0, "Remaining capacity is 0");
  assert(availT3[0].status === "FULL", "Session status is marked FULL");

  // Attempt 4th booking (Must be DENIED)
  const bookRes4 = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1004",
      doctor_id: "DOC-TEST-99",
      organization_identifier: "HSP-TEST-99",
      facility_id: "FAC-TEST-99",
      department_id: "DEP-TEST-99",
      session_id: sessT1.session_id,
      appointment_date: "2026-08-31",
      reason_for_visit: "Test Consultation 4 (Should Fail)",
    },
    { id: "PAT-1004", identifier: "PAT-1004", fullName: "Patient 4", role: "patient", email: "p4@test.com" } as any
  );
  assert(!bookRes4.success, "4th booking attempt correctly REJECTED");
  assert(bookRes4.error_code === "SESSION_FULL", "Error code is SESSION_FULL");

  // ------------------------------------------------------------
  // TEST 4 â€” Cancellation Reopening & Capacity Recovery
  // ------------------------------------------------------------
  console.log("\n--- TEST 4: CANCELLATION & CAPACITY RECOVERY ---");
  const cancelRes = await AppointmentBookingService.cancelAppointment(
    bookRes2.appointment!.id,
    patientB,
    "Patient had personal conflict"
  );
  assert(cancelRes.success, "Patient B appointment successfully cancelled");

  const availT4 = await AppointmentBookingService.getDoctorAvailability(
    "DOC-TEST-99",
    "HSP-TEST-99",
    "FAC-TEST-99",
    "2026-08-31"
  );
  assert(availT4[0].booked_count === 2, "Active bookings count decreased from 3 to 2");
  assert(availT4[0].remaining_capacity === 1, "Remaining capacity recovered to 1");
  assert(availT4[0].status === "LIMITED", "Session reopened from FULL to LIMITED");

  // ------------------------------------------------------------
  // TEST 5 â€” Strict Patient Data Isolation (Zero Cross-Account Leakage)
  // ------------------------------------------------------------
  console.log("\n--- TEST 5: PATIENT ISOLATION & ACCESS CONTROL ---");
  const patientAAppointments = AppointmentStore.getAppointmentsForPatient("PAT-1001");
  const patientBAppointments = AppointmentStore.getAppointmentsForPatient("PAT-1002");

  assert(
    patientAAppointments.every((a) => a.patient_id === "PAT-1001"),
    "Patient A query returns exclusively Patient A appointments"
  );
  assert(
    !patientBAppointments.some((a) => a.patient_id === "PAT-1001"),
    "Patient B cannot see Patient A appointments (Zero Leakage)"
  );

  // ------------------------------------------------------------
  // TEST 6 â€” Multi-Hospital Doctor Availability (Dr. Ananya DOC-1001)
  // ------------------------------------------------------------
  console.log("\n--- TEST 6: MULTI-HOSPITAL DOCTOR AVAILABILITY ---");
  // City Hospital (Monday)
  const cityAvail = await AppointmentBookingService.getDoctorAvailability(
    "DOC-1001",
    "HSP-1001",
    "FAC-1001",
    "2026-08-31" // Monday
  );
  assert(cityAvail.length === 2, "Dr. Ananya has 2 sessions at City Hospital on Monday (Morning & Evening)");
  assert(cityAvail[0].capacity === 12, "Morning session capacity is 12");
  assert(cityAvail[1].capacity === 8, "Evening session capacity is 8");

  // Green Care Clinic (Tuesday)
  const clinicAvail = await AppointmentBookingService.getDoctorAvailability(
    "DOC-1001",
    "CLN-1001",
    "FAC-1003",
    "2026-09-01" // Tuesday
  );
  assert(clinicAvail.length === 1, "Dr. Ananya has 1 session at Green Care Clinic on Tuesday");
  assert(clinicAvail[0].capacity === 10, "Clinic session capacity is 10");

  // Green Care Hospital (Saturday)
  const hosp2Avail = await AppointmentBookingService.getDoctorAvailability(
    "DOC-1001",
    "HSP-1002",
    "FAC-1002",
    "2026-09-05" // Saturday
  );
  assert(hosp2Avail.length === 1, "Dr. Ananya has 1 session at Green Care Hospital on Saturday");
  assert(hosp2Avail[0].capacity === 15, "Green Care Hospital session capacity is 15");

  // ------------------------------------------------------------
  // TEST 7 â€” Doctor Leave Blocking
  // ------------------------------------------------------------
  console.log("\n--- TEST 7: DOCTOR LEAVE OVERRIDE BLOCKING ---");
  const leaveAvail = await AppointmentBookingService.getDoctorAvailability(
    "DOC-1001",
    "HSP-1001",
    "FAC-1001",
    "2026-08-28" // Friday (Leave recorded in seed)
  );
  assert(leaveAvail.length === 1, "Session resolved on leave date");
  assert(leaveAvail[0].status === "DOCTOR_LEAVE", "Session is blocked with status DOCTOR_LEAVE");
  assert(leaveAvail[0].status_reason?.includes("Cardiology Symposium") ?? false, "Leave reason is preserved");

  // Booking attempt on leave date must fail
  const leaveBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1004",
      appointment_date: "2026-08-28",
    },
    patientA
  );
  assert(!leaveBooking.success, "Booking during doctor leave correctly REJECTED");
  assert(leaveBooking.error_code === "DOCTOR_ON_LEAVE", "Error code is DOCTOR_ON_LEAVE");

  // ------------------------------------------------------------
  // TEST 8 â€” Facility Closure Blocking
  // ------------------------------------------------------------
  console.log("\n--- TEST 8: FACILITY CLOSURE BLOCKING ---");
  const closureAvail = await AppointmentBookingService.getDoctorAvailability(
    "DOC-1001",
    "HSP-1001",
    "FAC-1001",
    "2026-10-02" // Friday (Facility closed in seed)
  );
  assert(closureAvail.length === 1, "Session resolved on facility closure date");
  assert(closureAvail[0].status === "FACILITY_CLOSURE", "Session status is FACILITY_CLOSURE");

  // Booking attempt on closed date
  const closureBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1004",
      appointment_date: "2026-10-02",
    },
    patientA
  );
  assert(!closureBooking.success, "Booking during facility closure correctly REJECTED");
  assert(closureBooking.error_code === "FACILITY_CLOSED", "Error code is FACILITY_CLOSED");

  // ------------------------------------------------------------
  // TEST 9 â€” Concurrent Race Condition Protection (Capacity = 1)
  // ------------------------------------------------------------
  console.log("\n--- TEST 9: CONCURRENCY & RACE CONDITION TEST (CAPACITY = 1) ---");
  // 2 simultaneous booking attempts for SES-9902 (Capacity: 1) on 2026-09-01
  const concurrentP1 = { id: "CON-PAT-1", identifier: "CON-PAT-1", fullName: "Concurrent P1", role: "patient" } as any;
  const concurrentP2 = { id: "CON-PAT-2", identifier: "CON-PAT-2", fullName: "Concurrent P2", role: "patient" } as any;

  const [resA, resB] = await Promise.all([
    AppointmentBookingService.bookAppointment(
      {
        patient_id: "CON-PAT-1",
        doctor_id: "DOC-TEST-99",
        organization_identifier: "HSP-TEST-99",
        facility_id: "FAC-TEST-99",
        department_id: "DEP-TEST-99",
        session_id: "SES-9902",
        appointment_date: "2026-09-01",
      },
      concurrentP1
    ),
    AppointmentBookingService.bookAppointment(
      {
        patient_id: "CON-PAT-2",
        doctor_id: "DOC-TEST-99",
        organization_identifier: "HSP-TEST-99",
        facility_id: "FAC-TEST-99",
        department_id: "DEP-TEST-99",
        session_id: "SES-9902",
        appointment_date: "2026-09-01",
      },
      concurrentP2
    ),
  ]);

  const successes = [resA, resB].filter((r) => r.success);
  const failures = [resA, resB].filter((r) => !r.success);

  assert(successes.length === 1, "Exactly ONE concurrent booking succeeded for single-slot session");
  assert(failures.length === 1, "The second concurrent booking was safely rejected");
  assert(failures[0].error_code === "SESSION_FULL", "Rejected request received SESSION_FULL");

  // ------------------------------------------------------------
  // TEST 10 â€” Idempotency & Duplicate Booking Prevention
  // ------------------------------------------------------------
  console.log("\n--- TEST 10: IDEMPOTENCY & DUPLICATE BOOKING PREVENTION ---");
  const dupBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "CON-PAT-1",
      doctor_id: "DOC-TEST-99",
      organization_identifier: "HSP-TEST-99",
      facility_id: "FAC-TEST-99",
      department_id: "DEP-TEST-99",
      session_id: "SES-9902",
      appointment_date: "2026-09-01",
    },
    concurrentP1
  );
  assert(dupBooking.success, "Duplicate submission handled idempotently");
  assert(dupBooking.appointment?.patient_id === "CON-PAT-1", "Returned existing confirmed appointment");

  // ------------------------------------------------------------
  // TEST 11 â€” Rescheduling Atomicity (Capacity Handover)
  // ------------------------------------------------------------
  console.log("\n--- TEST 11: RESCHEDULING CAPACITY HANDOVER ---");
  // Patient A has seeded appointment APT-1001 on 2026-08-24 (SES-1001). Reschedule to 2026-08-31 (SES-1002)
  const initialApt = AppointmentStore.getAppointmentById("apt-1001")!;
  const rescheduleRes = await AppointmentBookingService.rescheduleAppointment(
    initialApt.id,
    "SES-1002",
    "2026-08-31",
    patientA,
    "Rescheduled for afternoon convenience"
  );
  assert(rescheduleRes.success, "Appointment successfully rescheduled");
  const oldAptState = AppointmentStore.getAppointmentById(initialApt.id);
  assert(oldAptState?.status === "RESCHEDULED", "Original appointment marked RESCHEDULED");
  assert(rescheduleRes.appointment?.status === "CONFIRMED", "New appointment is CONFIRMED");
  assert(rescheduleRes.appointment?.session_id === "SES-1002", "New appointment assigned to new session");

  // ------------------------------------------------------------
  // TEST 12 â€” Schedule Overlap & Physical Conflict Detection
  // ------------------------------------------------------------
  console.log("\n--- TEST 12: SCHEDULE OVERLAP CONFLICT DETECTION ---");
  // Dr. Ananya is already scheduled at City Hospital on Monday 08:00-10:00.
  // Attempt to schedule her at Green Care Clinic on Monday 09:00-11:00 (Overlapping!)
  const conflictRes = await AppointmentBookingService.createOrUpdateSession(
    {
      doctor_id: "DOC-1001",
      organization_identifier: "CLN-1001",
      organization_name: "Green Care Clinic",
      day_of_week: 1, // Monday
      start_time: "09:00",
      end_time: "11:00",
      capacity: 10,
    },
    docAnanya
  );
  assert(!conflictRes.success, "Physical schedule conflict across multiple hospitals correctly DETECTED and BLOCKED");
  assert(conflictRes.message.includes("Physical Schedule Conflict"), "Conflict error message returned");

  // ------------------------------------------------------------
  // TEST 13 â€” Authorization Boundaries & Security
  // ------------------------------------------------------------
  console.log("\n--- TEST 13: SECURITY & AUTHORIZATION BOUNDARIES ---");
  // Patient attempting to modify doctor capacity
  const patientModifyCap = await AppointmentBookingService.createOrUpdateSession(
    {
      id: "SES-1001",
      capacity: 50,
      start_time: "08:00",
      end_time: "10:00",
      doctor_id: "DOC-1001",
    },
    patientA
  );
  assert(!patientModifyCap.success, "Patient unauthorized capacity edit correctly DENIED");

  // Client forging different patient ID
  const forgedPatientBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1002", // Forging Priya's ID while signed in as Rahul
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      appointment_date: "2026-08-31",
    },
    patientA
  );
  assert(!forgedPatientBooking.success, "Cross-account patient booking forgery correctly DENIED");

  // Receptionist booking through unified engine
  const receptionBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1002",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      appointment_date: "2026-08-31",
      booking_source: "RECEPTION",
    },
    staffAnita
  );
  assert(receptionBooking.success, "Front-desk receptionist successfully booked appointment via unified engine");
  assert(receptionBooking.appointment?.booking_source === "RECEPTION", "Booking source recorded as RECEPTION");

  // ------------------------------------------------------------
  // TEST 14 â€” Date-Specific Capacity Override
  // ------------------------------------------------------------
  console.log("\n--- TEST 14: DATE-SPECIFIC CAPACITY OVERRIDE ---");
  // 2026-08-24 has override capacity 6 (Normal 12)
  const overrideAvail = await AppointmentBookingService.getDoctorAvailability(
    "DOC-1001",
    "HSP-1001",
    "FAC-1001",
    "2026-08-24"
  );
  assert(overrideAvail[0].capacity === 6, "Date override takes precedence: Capacity is 6 (overridden from 12)");

  // ------------------------------------------------------------
  // TEST 15 â€” Past Date Validation
  // ------------------------------------------------------------
  console.log("\n--- TEST 15: PAST DATE BOOKING REJECTION ---");
  const pastBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      appointment_date: "2020-01-01",
    },
    patientA
  );
  assert(!pastBooking.success, "Past date appointment booking correctly REJECTED");
  assert(pastBooking.error_code === "PAST_SESSION", "Error code is PAST_SESSION");

  // ------------------------------------------------------------
  // TEST 16 â€” Audit Ledger Integration
  // ------------------------------------------------------------
  console.log("\n--- TEST 16: IMMUTABLE AUDIT LEDGER INTEGRATION ---");
  const allEvents = AuditLedger.getEvents();
  const aptEvents = allEvents.filter(
    (e: any) =>
      e.event_type === "APPOINTMENT_CREATED" ||
      e.event_type === "APPOINTMENT_CANCELLED" ||
      e.event_type === "APPOINTMENT_RESCHEDULED" ||
      e.event_type === "BOOKING_DENIED_CAPACITY" ||
      e.event_type === "CAPACITY_CHANGED" ||
      e.action === "APPOINTMENT_CREATED" ||
      e.action === "APPOINTMENT_CANCELLED" ||
      e.action === "APPOINTMENT_RESCHEDULED" ||
      e.action === "BOOKING_DENIED_CAPACITY" ||
      e.action === "CAPACITY_CHANGED"
  );
  assert(aptEvents.length >= 5, "Audit ledger recorded appointment lifecycle and capacity events");

  console.log("\n============================================================");
  console.log(`ðŸ“Š PHASE B.1 TEST RESULTS: ${passedCount} PASSED / ${failedCount} FAILED`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test execution error:", err);
  process.exit(1);
});
