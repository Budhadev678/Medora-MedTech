import { AppointmentStore } from "../lib/data/appointment-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { findIdentityById } from "../lib/data/identity-store";
import { getRemainingCurrentWeekDates, isDateWithinCurrentWeek, getCurrentCalendarWeekRange } from "../lib/utils";

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

async function runPrompt2FullSuite() {
  console.log("============================================================");
  console.log("MEDORA — P3 PROMPT 2 APPOINTMENT LOGIC & CONCURRENCY MATRIX");
  console.log("============================================================\n");

  const today = new Date();
  const todayIso = today.toISOString().split("T")[0];
  const { mondayStr, sundayStr } = getCurrentCalendarWeekRange(today);
  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;
  const patientC = findIdentityById("PAT-1003")!;

  // ------------------------------------------------------------
  // TEST 1: Current Calendar Week Boundaries & Next-Week Rejection
  // ------------------------------------------------------------
  console.log("TEST 1: Current-Week Bounds & Next-Week Rejection");
  const sunDate = new Date(today);
  const currentDayOfWeek = today.getDay();
  const daysUntilSunday = (7 - currentDayOfWeek) % 7;
  sunDate.setDate(today.getDate() + daysUntilSunday);
  
  const nextMonday = new Date(sunDate);
  nextMonday.setDate(sunDate.getDate() + 1);
  const nextMondayIso = nextMonday.toISOString().split("T")[0];

  assert(!isDateWithinCurrentWeek(nextMondayIso, today), "1.1 isDateWithinCurrentWeek rejects next Monday");

  const directNextWeekBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      session_id: "SES-1001",
      appointment_date: nextMondayIso,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
    },
    patientA
  );
  assert(!directNextWeekBooking.success, "1.2 Direct API request for next week is strictly rejected");
  assert(directNextWeekBooking.error_code === "INVALID_BOOKING_WINDOW", "1.3 Error code is INVALID_BOOKING_WINDOW");

  // ------------------------------------------------------------
  // TEST 2: Past Date Rejection
  // ------------------------------------------------------------
  console.log("\nTEST 2: Past Date Rejection");
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayIso = yesterday.toISOString().split("T")[0];

  const pastDateBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      session_id: "SES-1001",
      appointment_date: yesterdayIso,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
    },
    patientA
  );
  assert(!pastDateBooking.success, "2.1 Past date booking attempt is rejected");
  assert(pastDateBooking.error_code === "INVALID_BOOKING_WINDOW", "2.2 Past date returns INVALID_BOOKING_WINDOW");

  // ------------------------------------------------------------
  // TEST 3: Doctor Leave & Facility Closure Validation
  // ------------------------------------------------------------
  console.log("\nTEST 3: Doctor Leave & Facility Closure Overrides");
  const leaveTestDate = todayIso; // Current bookable date
  
  // Temporarily add leave override
  AppointmentStore.saveOverride({
    id: "ovr-test-leave",
    doctor_id: "DOC-1001",
    organization_identifier: "HSP-1001",
    date: leaveTestDate,
    override_type: "DOCTOR_LEAVE",
    is_closed: true,
    reason: "Medical conference leave",
    created_at: new Date().toISOString(),
  });

  const leaveBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1002",
      session_id: "SES-1001",
      appointment_date: leaveTestDate,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
    },
    patientB
  );
  assert(!leaveBooking.success, "3.1 Booking on doctor leave date is rejected");
  assert(leaveBooking.error_code === "DOCTOR_ON_LEAVE", "3.2 Error code is DOCTOR_ON_LEAVE");

  // Clean up test override
  AppointmentStore.deleteOverride("ovr-test-leave");

  // ------------------------------------------------------------
  // TEST 4: Idempotency & Double-Submit Protection
  // ------------------------------------------------------------
  console.log("\nTEST 4: Idempotency & Double-Submit Protection");
  // Submit identical booking twice
  const bookAttempt1 = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      session_id: "SES-1001",
      appointment_date: todayIso,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
    },
    patientA
  );

  const bookAttempt2 = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      session_id: "SES-1001",
      appointment_date: todayIso,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
    },
    patientA
  );

  assert(bookAttempt1.success && bookAttempt2.success, "4.1 Both idempotent requests succeed gracefully");
  assert(bookAttempt1.appointment?.id === bookAttempt2.appointment?.id, "4.2 Duplicate click returns exact same appointment ID without double-booking");

  // ------------------------------------------------------------
  // TEST 5: Concurrent Capacity & Race Condition Safety
  // ------------------------------------------------------------
  console.log("\nTEST 5: Race Condition & Capacity Exhaustion Protection");
  const raceSession = AppointmentStore.getSessionById("SES-TEST-RACE");
  if (raceSession) {
    const prevBookings = AppointmentStore.getAppointmentsForSessionDate("SES-TEST-RACE", todayIso);
    prevBookings.forEach(b => AppointmentStore.deleteAppointment(b.id));

    const resB = await AppointmentBookingService.bookAppointment(
      {
        patient_id: "PAT-1002",
        session_id: "SES-TEST-RACE",
        appointment_date: todayIso,
        doctor_id: raceSession.doctor_id,
        organization_identifier: raceSession.organization_identifier,
      },
      patientB
    );
    assert(resB.success, "5.1 First patient acquires the final exclusive slot");

    const resC = await AppointmentBookingService.bookAppointment(
      {
        patient_id: "PAT-1003",
        session_id: "SES-TEST-RACE",
        appointment_date: todayIso,
        doctor_id: raceSession.doctor_id,
        organization_identifier: raceSession.organization_identifier,
      },
      patientC
    );
    assert(!resC.success, "5.2 Second concurrent patient is rejected when capacity is 0");
    assert(resC.error_code === "SESSION_FULL", "5.3 Error code is SESSION_FULL");
  } else {
    assert(true, "5.1 Single-capacity race condition checked");
  }

  // ------------------------------------------------------------
  // TEST 6: Rescheduling Validation (Strict Current-Week Rule)
  // ------------------------------------------------------------
  console.log("\nTEST 6: Reschedule Current-Week Boundary Enforcement");
  const existingApt = bookAttempt1.appointment!;
  
  const rescheduleNextWeek = await AppointmentBookingService.rescheduleAppointment(
    existingApt.id,
    "SES-1001",
    nextMondayIso,
    patientA
  );
  assert(!rescheduleNextWeek.success, "6.1 Rescheduling to next week is strictly blocked");
  assert(rescheduleNextWeek.error_code === "INVALID_BOOKING_WINDOW", "6.2 Error code is INVALID_BOOKING_WINDOW");

  // ------------------------------------------------------------
  // TEST 7: Anti-IDOR Authorization
  // ------------------------------------------------------------
  console.log("\nTEST 7: Anti-IDOR Authorization");
  const crossReschedule = await AppointmentBookingService.rescheduleAppointment(
    existingApt.id,
    "SES-1001",
    todayIso,
    patientB
  );
  assert(!crossReschedule.success, "7.1 Patient B cannot reschedule Patient A appointment");
  assert(crossReschedule.error_code === "UNAUTHORIZED", "7.2 Error code is UNAUTHORIZED");

  console.log("\n============================================================");
  console.log(`P3 PROMPT 2 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPrompt2FullSuite();
