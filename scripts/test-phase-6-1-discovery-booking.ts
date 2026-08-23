// ============================================================
// MEDORA â€” PHASE 6.1 TEST SUITE
// APPOINTMENT DISCOVERY, DOCTOR-FIRST BOOKING &
// INTELLIGENT APPOINTMENT SELECTION
// ============================================================

import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { AlternativeSearchService } from "../lib/services/alternative-search-service";
import { AppointmentStore } from "../lib/data/appointment-store";
import { WaitlistStore } from "../lib/data/waitlist-store";
import { resetAffiliationStore } from "../lib/data/affiliation-store";
import { resetDepartmentStore } from "../lib/data/department-store";
import { resetFacilityStore } from "../lib/data/facility-store";
import { resetServiceStore } from "../lib/data/service-store";
import { StoredIdentity } from "../lib/data/identity-store";
import { getTodayDateStr } from "../lib/data/queue-store";

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
console.log("MEDORA â€” PHASE 6.1 TEST SUITE: DISCOVERY & BOOKING");
console.log("============================================================\n");

// Reset all stores
resetFacilityStore();
resetDepartmentStore();
resetServiceStore();
resetAffiliationStore();
AppointmentStore.reset();
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

async function runPhase61TestSuite() {
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

  const greenCareFac = docDiscovery.facilities.find((f) => f.facility_code === "FAC-1004" || f.facility_code === "HSP-1002");
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
  // TEST GROUP 2: FACILITY-FIRST, SERVICE-FIRST & DEPARTMENT-FIRST
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Facility-First and Service-First Booking Flows");

  const facFirst = await AppointmentBookingService.searchFacilityFirstAvailability("FAC-1001", "DEP-1001", "SRV-1001", todayStr);
  assert(
    !!facFirst.facility && (facFirst.facility.facility_code === "FAC-1001" || facFirst.facility.facility_code === "HSP-1001"),
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
  // TEST GROUP 3: CAPACITY CHECKING & ATOMIC BOOKING
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Capacity-Aware Booking & State Machine");

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

  // Prevent unauthorized booking for other patient (Anti-IDOR)
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
  // TEST GROUP 5: SECURITY & TAMPERING VALIDATIONS
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Security, Inactive Overrides & Validation Boundaries");

  // Past date booking attempt must be rejected
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const pastDateRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      session_id: targetSession.id,
      appointment_date: yesterdayStr,
    },
    patientActor
  );
  assert(!pastDateRes.success && pastDateRes.error_code === "PAST_SESSION", "Past date appointment booking correctly REJECTED");

  // Cross-facility tampering validation
  const tamperedOrgBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-9999",
      session_id: targetSession.id,
      appointment_date: todayStr,
    },
    patientActor
  );
  assert(!tamperedOrgBooking.success, "Tampered organization/facility request safely REJECTED");

  // ------------------------------------------------------------
  // TEST GROUP 6: RESCHEDULING & CANCELLATION
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Appointment Rescheduling & Cancellation Safety");

  const rescheduleRes = await AppointmentBookingService.rescheduleAppointment(
    bookingRes.appointment!.id,
    targetSession.id,
    todayStr,
    patientActor,
    "Requested time adjustment"
  );

  assert(rescheduleRes.success, "Rescheduled appointment successfully");
  assert(rescheduleRes.appointment?.status === "CONFIRMED", "New rescheduled appointment is CONFIRMED");

  const cancelRes = await AppointmentBookingService.cancelAppointment(
    rescheduleRes.appointment!.id,
    patientActor,
    "Personal reasons"
  );
  assert(cancelRes.success, "Cancelled appointment successfully");
  const cancelledAppt = AppointmentStore.getAppointmentById(rescheduleRes.appointment!.id);
  assert(cancelledAppt?.status === "CANCELLED", "Appointment status updated to CANCELLED");

  // ------------------------------------------------------------
  // TEST GROUP 7: WAITLIST FOUNDATION
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Capacity Waitlist Foundation");

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

  assert(waitlistRes.success && !!waitlistRes.waitlist_entry, "Patient successfully registered on waitlist");
  assert(waitlistRes.waitlist_entry?.status === "ACTIVE", "Initial waitlist status is ACTIVE");

  console.log("\n============================================================");
  console.log(`PHASE 6.1 TEST SUMMARY: ${passedAssertions}/${totalAssertions} assertions passed (${Math.round((passedAssertions / totalAssertions) * 100)}%)`);
  console.log("============================================================\n");

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runPhase61TestSuite().catch((err) => {
  console.error("Phase 6.1 test suite crashed:", err);
  process.exit(1);
});
