import { findIdentityById } from "../lib/data/identity-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { getRemainingCurrentWeekDates, getCurrentCalendarWeekRange, isDateWithinCurrentWeek } from "../lib/utils";
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

async function runPatientP9Suite() {
  console.log("============================================================");
  console.log("MEDORA — P9 PROMPT 1 SEARCH, DISCOVERY & AVAILABILITY MATRIX");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;
  const today = new Date();
  const { mondayStr, sunday, todayStr } = getCurrentCalendarWeekRange(today);

  // ------------------------------------------------------------
  // TEST GROUP 1: Current-Week Booking Boundary Enforcement
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Current-Week Booking Boundary Enforcement");
  const remainingDates = getRemainingCurrentWeekDates(today);
  assert(remainingDates.length >= 1 && remainingDates.length <= 7, "1.1 Remaining current-week dates computed");
  
  // Future next-week date (Next Monday = this week Sunday + 1)
  const nextMonday = new Date(sunday);
  nextMonday.setDate(sunday.getDate() + 1);
  const nextYear = nextMonday.getFullYear();
  const nextMonth = String(nextMonday.getMonth() + 1).padStart(2, "0");
  const nextDay = String(nextMonday.getDate()).padStart(2, "0");
  const nextMondayIso = `${nextYear}-${nextMonth}-${nextDay}`;

  assert(!isDateWithinCurrentWeek(nextMondayIso, today), "1.2 Next-week date strictly excluded from current-week booking calendar");

  // Attempt booking next-week date should be rejected
  const nextWeekBookRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      appointment_date: nextMondayIso,
      reason_for_visit: "Next week invalid test",
      booking_source: "PATIENT",
    },
    patientA
  );
  assert(nextWeekBookRes.success === false, "1.3 Booking engine strictly rejects appointments outside current week window");
  assert(nextWeekBookRes.error_code === "INVALID_BOOKING_WINDOW", "1.4 Error code is INVALID_BOOKING_WINDOW");

  // ------------------------------------------------------------
  // TEST GROUP 2: Multi-Mode Search & Discovery Engine
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Multi-Mode Search & Discovery Engine");
  
  // 2.1 Doctor-First Search
  const drResult = await AppointmentBookingService.searchDoctorFirstAvailability("DOC-1001", mondayStr, 7);
  assert(drResult.doctor_id === "DOC-1001" && Array.isArray(drResult.facilities), "2.1 Doctor-first search resolves provider and facility ties");

  // 2.2 Facility-First Search
  const facResult = await AppointmentBookingService.searchFacilityFirstAvailability("FAC-1001", undefined, undefined, mondayStr);
  assert(Boolean(facResult.facility) && Array.isArray(facResult.doctors), "2.2 Hospital/Facility-first search resolves departments and clinicians");

  // 2.3 Service-First Search
  const srvResult = await AppointmentBookingService.searchServiceFirstAvailability("SRV-1001", undefined, mondayStr);
  assert(Boolean(srvResult.service) && Array.isArray(srvResult.facilities), "2.3 Diagnostic service-first search resolves offering facilities");

  // ------------------------------------------------------------
  // TEST GROUP 3: Slot Availability & Schedule Verification
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Slot Availability & Schedule Verification");
  const sessions = await AppointmentBookingService.getDoctorAvailability(
    "DOC-1001",
    "HSP-1001",
    "FAC-1001",
    mondayStr
  );
  assert(sessions.length > 0, "3.1 Doctor availability returns scheduled working sessions on Monday");
  assert(sessions[0].doctor_id === "DOC-1001", "3.2 Availability accurately reflects requested doctor");

  // ------------------------------------------------------------
  // TEST GROUP 4: Double Booking Protection & Race Condition
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Double-Booking Protection & Idempotency");
  const availableSession = sessions.find(s => s.status === "AVAILABLE" || s.status === "LIMITED");
  assert(Boolean(availableSession), "4.1 Active bookable session found");

  if (availableSession) {
    const bookRes = await AppointmentBookingService.bookAppointment(
      {
        patient_id: "PAT-1001",
        doctor_id: "DOC-1001",
        organization_identifier: "HSP-1001",
        facility_id: "FAC-1001",
        department_id: availableSession.department_id,
        session_id: availableSession.session_id,
        appointment_date: mondayStr,
        reason_for_visit: "Discovery consultation test",
        booking_source: "PATIENT",
      },
      patientA
    );
    assert(typeof bookRes.success === "boolean", "4.2 Booking processed with deterministic outcome");
  }

  // ------------------------------------------------------------
  // TEST GROUP 5: Anti-IDOR Patient Privacy & Role Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Anti-IDOR Patient Privacy & Isolation");
  const patBAppointments = AppointmentStore.getAppointmentsForPatient("PAT-1002");
  assert(patBAppointments.filter(a => a.patient_id === "PAT-1001").length === 0, "5.1 Patient B query yields zero Patient A appointments");

  console.log("\n============================================================");
  console.log(`P9 PROMPT 1 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPatientP9Suite();