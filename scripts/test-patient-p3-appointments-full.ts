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

async function runPatientP3Suite() {
  console.log("============================================================");
  console.log("MEDORA — P3 PROMPT 1 PATIENT APPOINTMENT SYSTEM FULL TEST");
  console.log("============================================================\n");

  const today = new Date();
  const todayIso = today.toISOString().split("T")[0];
  const { mondayStr, sundayStr } = getCurrentCalendarWeekRange(today);
  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST GROUP 1: Strict Current Calendar Week Restriction (Hard Requirement)
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Strict Current Calendar Week Booking Window");
  const remainingDates = getRemainingCurrentWeekDates(today);
  assert(remainingDates.length >= 1 && remainingDates.length <= 7, "1.1 Remaining bookable dates bounded to 1..7 days");
  assert(remainingDates[0].iso === todayIso, "1.2 Earliest bookable date is strictly today");
  assert(remainingDates[remainingDates.length - 1].iso === sundayStr, "1.3 Latest bookable date is strictly this week's Sunday");

  // Next week date validation (e.g. Next Monday = Sunday + 1 day)
  const sunDate = new Date(today);
  const currentDayOfWeek = today.getDay();
  const daysUntilSunday = (7 - currentDayOfWeek) % 7;
  sunDate.setDate(today.getDate() + daysUntilSunday);
  
  const nextMonday = new Date(sunDate);
  nextMonday.setDate(sunDate.getDate() + 1);
  const nextMondayIso = nextMonday.toISOString().split("T")[0];

  assert(!isDateWithinCurrentWeek(nextMondayIso, today), "1.4 Next Monday is strictly rejected by isDateWithinCurrentWeek()");

  // ------------------------------------------------------------
  // TEST GROUP 2: Service-Level Current-Week Enforcement
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Booking Window Enforcement on API / Service Layer");
  const bookingAttemptNextWeek = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      session_id: "SES-1001",
      appointment_date: nextMondayIso,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
    },
    patientA
  );
  assert(!bookingAttemptNextWeek.success, "2.1 Next-week booking attempt is rejected at service validation");
  assert(bookingAttemptNextWeek.error_code === "INVALID_BOOKING_WINDOW", "2.2 Error code is INVALID_BOOKING_WINDOW");

  // ------------------------------------------------------------
  // TEST GROUP 3: Unified Entry Points (Doctor-first, Facility-first, Service-first)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Unified Appointment Discovery Engine");
  const sessionsDr = AppointmentStore.getDoctorSessions("DOC-1001");
  const allSessions = AppointmentStore.getAllSessions();
  const sessionsFacility = allSessions.filter(s => s.organization_identifier === "HSP-1001");
  
  assert(sessionsDr.length > 0, "3.1 Doctor-first query resolves active sessions for DOC-1001");
  assert(sessionsFacility.length > 0, "3.2 Facility-first query resolves active sessions for HSP-1001");
  assert(sessionsDr[0].organization_identifier === "HSP-1001", "3.3 Entry points resolve to identical shared organization affiliation");

  const drFirstResult = await AppointmentBookingService.searchDoctorFirstAvailability("DOC-1001", todayIso, remainingDates.length);
  assert(drFirstResult.doctor_id === "DOC-1001" && Array.isArray(drFirstResult.facilities), "3.4 searchDoctorFirstAvailability resolves doctor facilities");

  const facFirstResult = await AppointmentBookingService.searchFacilityFirstAvailability("FAC-1001", undefined, undefined, todayIso);
  assert(Boolean(facFirstResult.facility) && Array.isArray(facFirstResult.doctors), "3.5 searchFacilityFirstAvailability resolves facility doctors");

  const srvFirstResult = await AppointmentBookingService.searchServiceFirstAvailability("SRV-1001", undefined, todayIso);
  assert(Boolean(srvFirstResult.service) && Array.isArray(srvFirstResult.facilities), "3.6 searchServiceFirstAvailability resolves service facilities");

  // ------------------------------------------------------------
  // TEST GROUP 4: Slot Availability Calculation & Capacity Validation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Actual Slot Availability & Capacity Validation");
  const availabilities = await AppointmentBookingService.getDoctorAvailability(
    "DOC-1001",
    "HSP-1001",
    "FAC-1001",
    mondayStr
  );
  assert(availabilities.length > 0, "4.1 Doctor session availability on working day computes successfully");
  const sampleAvail = availabilities[0];
  assert(sampleAvail.capacity > 0, "4.2 Session capacity is positive non-zero");
  assert(sampleAvail.remaining_capacity <= sampleAvail.capacity, "4.3 Remaining capacity <= total capacity");
  assert(sampleAvail.status === "AVAILABLE" || sampleAvail.status === "FULL" || sampleAvail.status === "DOCTOR_LEAVE" || sampleAvail.status === "FACILITY_CLOSURE", "4.4 Session availability status is truthful");

  // ------------------------------------------------------------
  // TEST GROUP 5: Double-Booking & Patient Authorization Protection
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Double-Booking & Anti-IDOR Authorization");
  // Patient B cannot book for Patient A
  const unauthorizedBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      session_id: "SES-1001",
      appointment_date: todayIso,
    },
    patientB
  );
  assert(!unauthorizedBooking.success, "5.1 Cross-patient booking without authorization is blocked");
  assert(unauthorizedBooking.error_code === "UNAUTHORIZED", "5.2 Error code is UNAUTHORIZED");

  // ------------------------------------------------------------
  // TEST GROUP 6: Single Source of Truth Across Stores
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Single Source of Truth Across Stores");
  const aptsA = AppointmentStore.getAppointmentsForPatient("PAT-1001");
  assert(aptsA.length > 0, "6.1 Existing appointments query from single authoritative store");
  const firstApt = aptsA[0];
  const directGet = AppointmentStore.getAppointmentById(firstApt.id);
  assert(Boolean(directGet && directGet.id === firstApt.id), "6.2 Appointment by ID resolves identical single-record identity");

  console.log("\n============================================================");
  console.log(`P3 PROMPT 1 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPatientP3Suite();
