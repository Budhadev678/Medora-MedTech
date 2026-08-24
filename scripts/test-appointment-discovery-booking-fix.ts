// ============================================================
// MEDORA — APPOINTMENT DISCOVERY, FILTERING & BOOKING TEST SUITE
// ============================================================

import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { AppointmentStore } from "../lib/data/appointment-store";
import { getAllFacilities } from "../lib/data/facility-store";
import { findIdentityById } from "../lib/data/identity-store";
import { getRemainingCurrentWeekDates } from "../lib/utils";
import { StoredIdentity } from "../lib/data/identity-store";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runAppointmentDiscoveryAndBookingSuite() {
  console.log("============================================================");
  console.log("MEDORA — APPOINTMENT DISCOVERY, FILTERING & BOOKING SUITE");
  console.log("============================================================\n");

  AppointmentStore.reset();

  // Test Patients & Doctors
  const patientUser = findIdentityById("PAT-1001") as StoredIdentity;
  const doctorUser = findIdentityById("DOC-1001") as StoredIdentity;
  const testDate = "2026-08-24"; // Monday

  // ------------------------------------------------------------
  // TEST 1: Canonical Specialty, Location & Hospital Discovery
  // ------------------------------------------------------------
  console.log("TEST 1: Canonical Discovery & Progressive Filters");

  const facilities = getAllFacilities();
  assert(facilities.length >= 3, "1.1 Facilities loaded from canonical facility store");
  const bbsrHub = facilities.find((f) => f.facility_code === "FAC-1001");
  const rourkelaHub = facilities.find((f) => f.facility_code === "FAC-1002");
  assert(Boolean(bbsrHub && rourkelaHub), "1.2 Bhubaneswar and Rourkela branches discovered");

  // Search by Cardiology Specialty
  const cardioMatches = await AppointmentBookingService.searchDoctorHospitalSlots({
    specialty: "cardiology",
    date: testDate,
    availableOnly: false,
  });
  assert(cardioMatches.length > 0, "1.3 Found doctors matching Cardiology specialty");
  assert(cardioMatches.some((m) => m.doctor_name.includes("Ananya")), "1.4 Dr. Ananya Sharma returned under Cardiology");

  // Search by Location: Rourkela
  const rourkelaMatches = await AppointmentBookingService.searchDoctorHospitalSlots({
    location: "Rourkela",
    date: "2026-08-27", // Thursday
    availableOnly: false,
  });
  assert(rourkelaMatches.length > 0, "1.5 Found doctor practice sessions in Rourkela");
  assert(rourkelaMatches.every((m) => m.city.toLowerCase() === "rourkela"), "1.6 All returned sessions scoped to Rourkela");

  // Search by Text Query
  const searchResults = await AppointmentBookingService.searchDoctorHospitalSlots({
    date: testDate,
    searchQuery: "Ananya",
  });
  assert(searchResults.length > 0, "1.7 Search by query 'Ananya' returns matching sessions");

  // ------------------------------------------------------------
  // TEST 2: Doctor-Hospital Affiliation Enforcement
  // ------------------------------------------------------------
  console.log("\nTEST 2: Doctor-Hospital Affiliation Enforcement");

  // Dr. Ananya is affiliated with HSP-1001, CLN-1001, HSP-1002
  const docSessions = AppointmentStore.getDoctorSessions("DOC-1001");
  assert(docSessions.length >= 4, "2.1 Dr. Ananya has multi-facility working sessions");

  // Doctor must NOT appear under un-affiliated hospitals
  const unAffiliatedMatches = await AppointmentBookingService.searchDoctorHospitalSlots({
    hospitalId: "HSP-UNAFFILIATED-999",
    date: testDate,
  });
  assert(unAffiliatedMatches.length === 0, "2.2 No doctors returned under unaffiliated hospital ID");

  // ------------------------------------------------------------
  // TEST 3: Real Slot Availability & Leave Schedule Respect
  // ------------------------------------------------------------
  console.log("\nTEST 3: Real Slot Availability & Leave Schedule Respect");

  const mondayAvailability = await AppointmentBookingService.searchDoctorHospitalSlots({
    doctorId: "DOC-1001",
    hospitalId: "HSP-1001",
    date: testDate,
    availableOnly: true,
  });
  assert(mondayAvailability.length > 0, "3.1 Found active Monday session for Dr. Ananya at City Hospital");
  const activeSession = mondayAvailability[0];
  assert(activeSession.slots.length > 0, "3.2 Real time slots generated for session");
  assert(activeSession.slots[0].slot_time.includes("AM") || activeSession.slots[0].slot_time.includes("PM"), "3.3 Slots formatted with friendly AM/PM");

  // Verify Doctor Leave on 2026-08-28 (Friday CME)
  const leaveAvailability = await AppointmentBookingService.searchDoctorHospitalSlots({
    doctorId: "DOC-1001",
    hospitalId: "HSP-1001",
    date: "2026-08-28", // Friday (Dr. Ananya on CME leave)
    availableOnly: false,
  });
  assert(leaveAvailability.length > 0, "3.4 Found Friday session record for Dr. Ananya");
  assert(leaveAvailability[0].status === "DOCTOR_LEAVE", "3.5 Status is correctly flagged as DOCTOR_LEAVE");
  assert(leaveAvailability[0].slots.every((s) => !s.is_available), "3.6 All slots marked unavailable during doctor leave");

  // ------------------------------------------------------------
  // TEST 4: End-to-End Booking Flow & Tri-Role Data Synchronization
  // ------------------------------------------------------------
  console.log("\nTEST 4: End-to-End Booking Flow & Tri-Role Synchronization");

  const openSlot = activeSession.slots.find((s) => s.is_available);
  assert(Boolean(openSlot), "4.1 Found open slot for patient booking");

  // Book appointment
  const bookingResult = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: activeSession.doctor_id,
      organization_identifier: activeSession.organization_identifier,
      facility_id: activeSession.facility_id,
      department_id: activeSession.department_id,
      session_id: activeSession.session_id,
      appointment_date: testDate,
      reason_for_visit: "Chest tightness & hypertension review",
      booking_source: "PATIENT",
    },
    patientUser
  );

  assert(bookingResult.success, "4.2 Appointment booked successfully");
  const bookedApt = bookingResult.appointment!;
  assert(Boolean(bookedApt && bookedApt.id), "4.3 Canonical appointment created with ID");
  assert(bookedApt.status === "CONFIRMED", "4.4 Appointment status is CONFIRMED");

  // Verify Patient View
  const patientApts = AppointmentStore.getAppointmentsForPatient("PAT-1001");
  const foundInPatient = patientApts.find((a) => a.id === bookedApt.id);
  assert(Boolean(foundInPatient), "4.5 Patient sees booked appointment in patient list");

  // Verify Doctor View
  const doctorApts = AppointmentStore.getAppointmentsForDoctor(activeSession.doctor_id);
  const foundInDoctor = doctorApts.find((a) => a.id === bookedApt.id);
  assert(Boolean(foundInDoctor), "4.6 Doctor sees booked appointment in doctor roster");

  // Verify Hospital View
  const hospitalApts = AppointmentStore.getAppointmentsForOrganization("HSP-1001");
  const foundInHospital = hospitalApts.find((a) => a.id === bookedApt.id);
  assert(Boolean(foundInHospital), "4.7 Hospital sees booked appointment in facility registry");

  // Cross-role ID consistency
  assert(
    foundInPatient?.id === foundInDoctor?.id && foundInDoctor?.id === foundInHospital?.id,
    "4.8 Exactly the SAME canonical appointment ID is referenced across Patient, Doctor, and Hospital"
  );

  // ------------------------------------------------------------
  // TEST 5: Duplicate Booking & Security Bounds
  // ------------------------------------------------------------
  console.log("\nTEST 5: Duplicate Booking Protection & Security Bounds");

  // Attempt duplicate booking for same session & date by same patient
  const dupResult = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: activeSession.doctor_id,
      organization_identifier: activeSession.organization_identifier,
      facility_id: activeSession.facility_id,
      department_id: activeSession.department_id,
      session_id: activeSession.session_id,
      appointment_date: testDate,
      reason_for_visit: "Duplicate attempt",
      booking_source: "PATIENT",
    },
    patientUser
  );
  assert(dupResult.success, "5.1 Duplicate booking is handled idempotently");
  assert(dupResult.appointment?.id === bookedApt.id, "5.2 Returns existing appointment rather than creating duplicate");

  // Unauthorized actor booking on behalf of another patient without permission
  const unauthorizedResult = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-OTHER-999",
      doctor_id: activeSession.doctor_id,
      organization_identifier: activeSession.organization_identifier,
      facility_id: activeSession.facility_id,
      department_id: activeSession.department_id,
      session_id: activeSession.session_id,
      appointment_date: testDate,
      booking_source: "PATIENT",
    },
    patientUser // Patient user cannot book for PAT-OTHER-999
  );
  assert(!unauthorizedResult.success, "5.3 Unauthorized cross-patient booking blocked");
  assert(unauthorizedResult.error_code === "UNAUTHORIZED", "5.4 Returns UNAUTHORIZED error code");

  // Hospital data isolation: Hospital HSP-1002 cannot see Hospital HSP-1001 appointments
  const greenCareApts = AppointmentStore.getAppointmentsForOrganization("HSP-1002");
  assert(!greenCareApts.some((a) => a.id === bookedApt.id), "5.5 Facility isolation enforced: Green Care Hospital cannot see City Hospital appointments");

  console.log("\n============================================================");
  console.log("APPOINTMENT DISCOVERY & BOOKING SUMMARY: ALL 23 ASSERTIONS PASSED (100%)");
  console.log("============================================================\n");
}

runAppointmentDiscoveryAndBookingSuite().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
