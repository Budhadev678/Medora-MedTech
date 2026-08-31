/**
 * ============================================================
 * MEDORA — PHASE 1 / PROMPT 1: APPOINTMENT DATA FLOW E2E TEST
 * 
 * Verifies genuine connected appointment data flow:
 * Patient -> Shared Database -> Doctor Workspace -> Real-Time Sync
 * ============================================================
 */

import { AppointmentStore } from "../lib/data/appointment-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { findIdentityById } from "../lib/data/identity-store";
import { getRemainingCurrentWeekDates } from "../lib/utils";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    process.exit(1);
  } else {
    console.log(`  ✓ PASS: ${msg}`);
  }
}

async function runTest() {
  console.log("============================================================");
  console.log("MEDORA: APPOINTMENT DATA FLOW & DOCTOR CONNECTIVITY TEST");
  console.log("============================================================\n");

  // Step 1: Verify Identities
  const patientA = findIdentityById("PAT-1001"); // Rahul Verma
  const patientB = findIdentityById("PAT-1002"); // Priya Sharma
  const doctorA = findIdentityById("DOC-1001");  // Dr. Ananya Sharma
  const doctorB = findIdentityById("DOC-1002");  // Dr. Rajesh Kumar

  assert(Boolean(patientA), "Patient A (PAT-1001 - Rahul Verma) exists");
  assert(Boolean(patientB), "Patient B (PAT-1002 - Priya Sharma) exists");
  assert(Boolean(doctorA), "Doctor A (DOC-1001 - Dr. Ananya Sharma) exists");
  assert(Boolean(doctorB), "Doctor B (DOC-1002 - Dr. Rajesh Kumar) exists");

  // Step 2: Test Clean State / Reset Capability
  console.log("\n--- Section 1: Clean State & Reset Capability ---");
  AppointmentStore.clearAppointments();
  assert(AppointmentStore.getAllAppointments().length === 0, "AppointmentStore.clearAppointments() leaves empty state");
  
  // Re-seed for tests
  AppointmentStore.reset();
  const initialApts = AppointmentStore.getAllAppointments();
  assert(initialApts.length > 0, `AppointmentStore.reset() restores baseline appointments (${initialApts.length} records)`);

  // Step 3: Patient A selects valid slot & Books Appointment with Doctor A
  console.log("\n--- Section 2: Patient A Books Appointment with Doctor A ---");
  const dates = getRemainingCurrentWeekDates();
  assert(dates.length > 0, "Active calendar week has valid available dates");
  const targetDate = dates[0].iso;

  const doctorASessions = AppointmentStore.getDoctorSessions("DOC-1001", "HSP-1001");
  assert(doctorASessions.length > 0, `Found ${doctorASessions.length} active working sessions for Doctor A at City Hospital`);
  const session = doctorASessions[0];

  const bookingRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: session.facility_id,
      department_id: session.department_id,
      session_id: session.id,
      appointment_date: targetDate,
      reason_for_visit: "Phase 1 Data Flow E2E Cardiac Evaluation",
      booking_source: "PATIENT",
    },
    patientA!
  );

  assert(bookingRes.success, `Patient A successfully booked appointment: ${bookingRes.message}`);
  assert(Boolean(bookingRes.appointment), "Returned booking result contains appointment entity");
  const createdApt = bookingRes.appointment!;
  assert(createdApt.patient_id === "PAT-1001", `Appointment patient_id matches Patient A (${createdApt.patient_id})`);
  assert(createdApt.doctor_id === "DOC-1001", `Appointment doctor_id matches Doctor A (${createdApt.doctor_id})`);
  assert(createdApt.organization_identifier === "HSP-1001", `Appointment organization matches HSP-1001`);
  assert(createdApt.status === "CONFIRMED", `Initial appointment status is CONFIRMED`);

  // Step 4: Verify Patient A query contains the newly booked appointment
  console.log("\n--- Section 3: Patient A Appointment Query ---");
  const patientApts = AppointmentStore.getAppointmentsForPatient("PAT-1001");
  const foundInPatient = patientApts.find((a) => a.id === createdApt.id);
  assert(Boolean(foundInPatient), `Patient A appointment query finds newly created appointment ${createdApt.appointment_no}`);

  // Step 5: Verify Doctor A query automatically contains the exact same appointment entity
  console.log("\n--- Section 4: Doctor A Query Scoping & Single Source of Truth ---");
  const doctorAApts = AppointmentStore.getAppointmentsForDoctor("DOC-1001");
  const foundInDoctorA = doctorAApts.find((a) => a.id === createdApt.id);
  assert(Boolean(foundInDoctorA), `Doctor A appointment query receives exact same entity (${foundInDoctorA?.appointment_no})`);
  assert(foundInDoctorA?.patient_name === patientA?.fullName, `Doctor A query sees accurate patient name (${foundInDoctorA?.patient_name})`);
  assert(foundInDoctorA?.reason_for_visit === "Phase 1 Data Flow E2E Cardiac Evaluation", "Doctor A query sees accurate clinical reason");

  // Step 6: Verify Doctor B does NOT see Doctor A's appointment
  console.log("\n--- Section 5: Doctor Isolation & Role Scoping ---");
  const doctorBApts = AppointmentStore.getAppointmentsForDoctor("DOC-1002");
  const foundInDoctorB = doctorBApts.find((a) => a.id === createdApt.id);
  assert(!foundInDoctorB, "Doctor B (DOC-1002) CANNOT see Doctor A's appointment");

  // Step 7: Doctor A updates appointment status (e.g. CHECKED_IN -> IN_CONSULTATION -> COMPLETED)
  console.log("\n--- Section 6: Status Lifecycle & Bi-Directional Synchronization ---");
  const updatedByDoctor = AppointmentStore.saveAppointment({
    ...foundInDoctorA!,
    status: "IN_CONSULTATION",
    updated_at: new Date().toISOString(),
  });
  assert(updatedByDoctor.status === "IN_CONSULTATION", "Doctor A successfully transitioned status to IN_CONSULTATION");

  // Check Patient A perspective on the same record
  const refreshedPatientApt = AppointmentStore.getAppointmentById(createdApt.id);
  assert(refreshedPatientApt?.status === "IN_CONSULTATION", `Patient A immediately sees updated status (${refreshedPatientApt?.status})`);

  // Patient A cancels another appointment
  const cancelBookingRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: session.facility_id,
      department_id: session.department_id,
      session_id: "SES-1002",
      appointment_date: targetDate,
      reason_for_visit: "To be cancelled by patient",
      booking_source: "PATIENT",
    },
    patientA!
  );
  assert(cancelBookingRes.success, "Created second appointment for cancellation test");
  const aptToCancel = cancelBookingRes.appointment!;

  const cancelRes = await AppointmentBookingService.cancelAppointment(
    aptToCancel.id,
    patientA!,
    "Personal conflict on appointment time"
  );
  assert(cancelRes.success, `Patient A cancelled appointment: ${cancelRes.message}`);

  // Doctor A checks cancelled appointment
  const docCheckCancelled = AppointmentStore.getAppointmentById(aptToCancel.id);
  assert(docCheckCancelled?.status === "CANCELLED", "Doctor A sees status updated to CANCELLED on the shared record");

  // Step 8: Concurrency & Duplicate Prevention Edge Cases
  console.log("\n--- Section 7: Concurrency, Idempotency & Edge Cases ---");
  // Double booking attempt
  const dupRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1001",
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: session.facility_id,
      department_id: session.department_id,
      session_id: session.id,
      appointment_date: targetDate,
      reason_for_visit: "Duplicate attempt",
      booking_source: "PATIENT",
    },
    patientA!
  );
  assert(dupRes.success && dupRes.appointment?.id === createdApt.id, "Duplicate booking handled idempotently without duplicate records");

  // Patient booking on behalf of someone else without authorization
  const unauthorizedRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: "PAT-1003", // Different patient
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: session.facility_id,
      department_id: session.department_id,
      session_id: session.id,
      appointment_date: targetDate,
      reason_for_visit: "Spoofed booking",
      booking_source: "PATIENT",
    },
    patientA! // Logged in as Patient A
  );
  assert(!unauthorizedRes.success && unauthorizedRes.error_code === "UNAUTHORIZED", "Unauthorized cross-patient booking rejected");

  console.log("\n============================================================");
  console.log("PHASE 1 E2E APPOINTMENT TEST SUMMARY: ALL ASSERTIONS PASSED!");
  console.log("============================================================\n");
}

runTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
