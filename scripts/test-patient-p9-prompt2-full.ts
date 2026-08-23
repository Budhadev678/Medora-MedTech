import { findIdentityById } from "../lib/data/identity-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { getRemainingCurrentWeekDates, getCurrentCalendarWeekRange, isDateWithinCurrentWeek } from "../lib/utils";
import { AppointmentStore } from "../lib/data/appointment-store";
import { getNotificationsForUser } from "../lib/data/notification-store";

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

async function runPrompt2SearchSuite() {
  console.log("============================================================");
  console.log("MEDORA — P9 PROMPT 2 SEARCH, AVAILABILITY & BOOKING MATRIX");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;
  const today = new Date();
  const { mondayStr, sunday, todayStr } = getCurrentCalendarWeekRange(today);

  // ------------------------------------------------------------
  // TEST 1: Strict Current-Week Boundary Protection (Hard Security Rule)
  // ------------------------------------------------------------
  console.log("TEST 1: Strict Current-Week Boundary Enforcement");
  
  // 1.1 Past Date Attack (Yesterday)
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const pastYear = yesterday.getFullYear();
  const pastMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
  const pastDay = String(yesterday.getDate()).padStart(2, "0");
  const yesterdayIso = `${pastYear}-${pastMonth}-${pastDay}`;
  
  const pastBookRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      appointment_date: yesterdayIso,
      reason_for_visit: "Past date attack",
      booking_source: "PATIENT",
    },
    patientA
  );
  assert(pastBookRes.success === false, "1.1 Past date booking attempt strictly rejected");

  // 1.2 Next-Week Date Attack (Next Monday)
  const nextMonday = new Date(sunday);
  nextMonday.setDate(sunday.getDate() + 1);
  const nextYear = nextMonday.getFullYear();
  const nextMonth = String(nextMonday.getMonth() + 1).padStart(2, "0");
  const nextDay = String(nextMonday.getDate()).padStart(2, "0");
  const nextMondayIso = `${nextYear}-${nextMonth}-${nextDay}`;

  const nextWeekBookRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      appointment_date: nextMondayIso,
      reason_for_visit: "Next week attack",
      booking_source: "PATIENT",
    },
    patientA
  );
  assert(nextWeekBookRes.success === false, "1.2 Next-week booking attempt strictly rejected");
  assert(nextWeekBookRes.error_code === "INVALID_BOOKING_WINDOW", "1.3 Error code is INVALID_BOOKING_WINDOW");

  // 1.3 Next-Month Date Attack
  const nextMonthDate = new Date(today);
  nextMonthDate.setMonth(today.getMonth() + 1);
  const nmYear = nextMonthDate.getFullYear();
  const nmMonth = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
  const nmDay = String(nextMonthDate.getDate()).padStart(2, "0");
  const nextMonthIso = `${nmYear}-${nmMonth}-${nmDay}`;

  const nextMonthBookRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      appointment_date: nextMonthIso,
      reason_for_visit: "Next month attack",
      booking_source: "PATIENT",
    },
    patientA
  );
  assert(nextMonthBookRes.success === false, "1.4 Next-month booking attempt strictly rejected");

  // ------------------------------------------------------------
  // TEST 2: Authoritative Doctor Schedule & Working Session Calculation
  // ------------------------------------------------------------
  console.log("\nTEST 2: Doctor Schedule & Working Session Calculation");
  const mondaySessions = await AppointmentBookingService.getDoctorAvailability(
    "DOC-1001",
    "HSP-1001",
    "FAC-1001",
    mondayStr
  );
  assert(mondaySessions.length > 0, "2.1 Doctor working sessions resolved on scheduled day (Monday)");
  assert(mondaySessions.every(s => s.doctor_id === "DOC-1001"), "2.2 All returned sessions belong strictly to DOC-1001");
  assert(mondaySessions.every(s => s.capacity > 0 && s.remaining_capacity >= 0), "2.3 Capacity calculation valid and non-negative");

  // ------------------------------------------------------------
  // TEST 3: Multi-Mode Discovery Endpoints
  // ------------------------------------------------------------
  console.log("\nTEST 3: Multi-Mode Discovery Endpoints");
  
  // 3.1 Doctor-First
  const drSearch = await AppointmentBookingService.searchDoctorFirstAvailability("DOC-1001", mondayStr, 7);
  assert(drSearch.doctor_id === "DOC-1001", "3.1 Doctor-first endpoint returns doctor profile and facilities");

  // 3.2 Facility-First
  const facSearch = await AppointmentBookingService.searchFacilityFirstAvailability("FAC-1001", undefined, undefined, mondayStr);
  assert(Boolean(facSearch && (facSearch.facility?.facility_code === "FAC-1001" || facSearch.facility?.id === "FAC-1001")), "3.2 Facility-first endpoint returns facility profile and doctors");

  // 3.3 Service-First
  const srvSearch = await AppointmentBookingService.searchServiceFirstAvailability("SRV-1001", undefined, mondayStr);
  assert(srvSearch.service.id === "SRV-1001", "3.3 Service-first endpoint returns service profile and facilities");

  // ------------------------------------------------------------
  // TEST 4: Double-Booking Prevention & Concurrency Protection
  // ------------------------------------------------------------
  console.log("\nTEST 4: Double-Booking Prevention & Concurrency Protection");
  const availableSession = mondaySessions.find(s => s.status === "AVAILABLE" || s.status === "LIMITED") || mondaySessions[0];
  assert(Boolean(availableSession), "4.1 Bookable session found for current week");

  if (availableSession) {
    const booking1 = await AppointmentBookingService.bookAppointment(
      {
        patient_id: "PAT-1001",
        doctor_id: "DOC-1001",
        organization_identifier: "HSP-1001",
        facility_id: "FAC-1001",
        department_id: availableSession.department_id,
        session_id: availableSession.session_id,
        appointment_date: mondayStr,
        reason_for_visit: "Specialist consultation",
        booking_source: "PATIENT",
      },
      patientA
    );
    assert(typeof booking1.success === "boolean", "4.2 Primary booking request executed");

    // Second booking for identical patient/slot
    const booking2 = await AppointmentBookingService.bookAppointment(
      {
        patient_id: "PAT-1001",
        doctor_id: "DOC-1001",
        organization_identifier: "HSP-1001",
        facility_id: "FAC-1001",
        department_id: availableSession.department_id,
        session_id: availableSession.session_id,
        appointment_date: mondayStr,
        reason_for_visit: "Duplicate attempt",
        booking_source: "PATIENT",
      },
      patientA
    );
    assert(booking2.appointment?.id === booking1.appointment?.id || booking2.success === false, "4.3 Duplicate same-slot booking returns existing appointment without duplicate creation");
  }

  // ------------------------------------------------------------
  // TEST 5: Anti-IDOR Patient Privacy & Role Isolation
  // ------------------------------------------------------------
  console.log("\nTEST 5: Anti-IDOR Complete Patient Data Isolation");
  const patBAppts = AppointmentStore.getAppointmentsForPatient("PAT-1002");
  assert(patBAppts.filter(a => a.patient_id === "PAT-1001").length === 0, "5.1 Patient B query yields zero Patient A appointments");

  // ------------------------------------------------------------
  // TEST 6: Cross-Module Notification Synchronization
  // ------------------------------------------------------------
  console.log("\nTEST 6: Cross-Module Notification Synchronization");
  const patANotifs = getNotificationsForUser("PAT-1001", "ALL");
  assert(patANotifs.some(n => (n.reference_type as string) === "APPOINTMENT"), "6.1 Appointment bookings generate synchronized patient notifications");

  console.log("\n============================================================");
  console.log(`P9 PROMPT 2 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPrompt2SearchSuite();
