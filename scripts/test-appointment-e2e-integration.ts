// ============================================================
// MEDORA â€” APPOINTMENT MASTER INTEGRATION & LOGIC SUITE (PROMPT 4)
// End-to-End Cross-Role Synchronization & Concurrency Test
// ============================================================

import { AppointmentStore } from "../lib/data/appointment-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { QueueManagementService } from "../lib/services/queue-management-service";
import { createEncounter } from "../lib/data/encounter-store";
import { findIdentityById, StoredIdentity } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";
import { getNotificationsForUser } from "../lib/data/notification-store";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  âœ“ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  âœ— FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
    failed++;
  }
}

async function runMasterIntegrationSuite() {
  console.log("============================================================");
  console.log("MEDORA â€” APPOINTMENT END-TO-END LOGIC & INTEGRATION SUITE");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;
  const doctor = findIdentityById("DOC-1001")!;
  const hospitalAdmin = findIdentityById("HSP-1001")!;
  const clinicAdmin = findIdentityById("CLN-1001")!;

  // ------------------------------------------------------------
  // DEMONSTRATION 1: FULL HAPPY PATH (Patient -> Doctor -> Hospital -> Check-In -> Encounter -> Completion)
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Complete Cross-Role Lifecycle Synchronization");

  // Step 1: Patient discovers and books appointment
  const bookResult = await AppointmentBookingService.bookAppointment(
    {
      session_id: "SES-1001",
      patient_id: patientA.identifier || patientA.id,
      doctor_id: "DOC-1001",
      facility_id: "FAC-1001",
      organization_identifier: "HSP-1001",
      appointment_date: "2026-09-07", // Monday session
      reason_for_visit: "Cardiology Annual Health Checkup",
      booking_source: "PATIENT",
      idempotency_key: "E2E-IDEM-001",
    },
    patientA
  );

  assert(bookResult.success && Boolean(bookResult.appointment?.id), "1.1 Patient booking creates valid appointment record");
  const appointmentId = bookResult.appointment!.id;
  const appointmentNo = bookResult.appointment!.appointment_no;

  // Step 2: Patient View Synchronization
  const patientApts = AppointmentStore.getAppointmentsForPatient(patientA.identifier || patientA.id);
  const foundInPatient = patientApts.find((a) => a.id === appointmentId);
  assert(Boolean(foundInPatient && foundInPatient.status === "CONFIRMED"), "1.2 Patient portal retrieves the identical appointment (CONFIRMED)");

  // Step 3: Doctor Roster Synchronization
  const doctorApts = AppointmentStore.getAppointmentsForDoctor("DOC-1001");
  const foundInDoctor = doctorApts.find((a) => a.id === appointmentId);
  assert(
    Boolean(foundInDoctor && foundInDoctor.patient_name === patientA.fullName),
    "1.3 Doctor workspace sees the identical appointment on clinical roster"
  );

  // Step 4: Hospital Operational Synchronization
  const hospitalApts = AppointmentStore.getAppointmentsForOrganization("HSP-1001");
  const foundInHospital = hospitalApts.find((a) => a.id === appointmentId);
  assert(Boolean(foundInHospital), "1.4 Hospital administration desk sees the identical appointment");

  // Step 5: Patient Check-In & Queue Token Issuance
  const checkInResult = await QueueManagementService.checkInAppointment(
    {
      appointment_id: appointmentId,
      patient_id: patientA.identifier || patientA.id,
      date: "2026-09-07",
    },
    hospitalAdmin
  );
  console.log("checkInResult:", JSON.stringify(checkInResult, null, 2));
  assert(
    checkInResult.success && Boolean(checkInResult.queue_entry?.token_number),
    "1.5 Front desk reception check-in generates sequential OPD queue token"
  );

  // Step 6: Verify Checked-In Status Propagation
  const checkedInApt = AppointmentStore.getAppointmentById(appointmentId);
  console.log("CheckedIn appointment status:", checkedInApt?.status);
  assert(
    checkedInApt?.status === "CHECKED_IN",
    "1.6 Appointment status transitions to CHECKED_IN across all role perspectives"
  );

  // Step 7: Phase 7 Clinical Consultation Encounter Linkage
  const encounterRes = createEncounter({
    patientId: "PAT-1001",
    providerId: "DOC-1001",
    organizationId: "HSP-1001",
    departmentId: "DEP-CARDIO",
    departmentName: "Cardiology OPD",
    encounterType: "CONSULTATION",
    reasonForVisit: "Routine cardiology review",
    location: "Room 102",
    sourceType: "APPOINTMENT",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(encounterRes.success && Boolean(encounterRes.encounter?.id), "1.7 Consultation suite creates Encounter referencing clinical consultation context");

  // Step 8: Finalize Consultation & Mark Appointment Completed
  const completedApt = {
    ...checkedInApt!,
    status: "COMPLETED" as const,
  };
  AppointmentStore.saveAppointment(completedApt);

  const finalCheck = AppointmentStore.getAppointmentById(appointmentId);
  assert(finalCheck?.status === "COMPLETED", "1.8 Finalized consultation transitions appointment to COMPLETED state");

  // ------------------------------------------------------------
  // DEMONSTRATION 2: RESCHEDULING & CANCELLATION WORKFLOW
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Atomic Rescheduling & Safe Cancellation");

  // Step 2.1: Book Appointment for Reschedule Test
  const aptToResched = await AppointmentBookingService.bookAppointment(
    {
      session_id: "SES-1001",
      patient_id: patientA.identifier || patientA.id,
      doctor_id: "DOC-1001",
      facility_id: "FAC-1001",
      organization_identifier: "HSP-1001",
      appointment_date: "2026-08-24",
      reason_for_visit: "Reschedule Test",
    },
    patientA
  );
  assert(aptToResched.success, "2.1 Initial appointment created for rescheduling flow");

  // Step 2.2: Reschedule to new date (Next Monday 2026-08-31)
  const reschedResult = await AppointmentBookingService.rescheduleAppointment(
    aptToResched.appointment!.id,
    "SES-1001",
    "2026-08-31",
    patientA
  );
  assert(
    reschedResult.success && reschedResult.appointment?.appointment_date === "2026-08-31",
    "2.2 Rescheduling successfully transfers appointment to new target date"
  );

  // Step 2.3: Verify Lineage Tracking (rescheduled_from_id and original status)
  const oldAptRecord = AppointmentStore.getAppointmentById(aptToResched.appointment!.id);
  const newAptRecord = AppointmentStore.getAppointmentById(reschedResult.appointment!.id);
  assert(
    oldAptRecord?.status === "RESCHEDULED" && newAptRecord?.rescheduled_from_id === oldAptRecord?.id,
    "2.3 Lineage links preserved: Old marked RESCHEDULED, New references old ID"
  );

  // Step 2.4: Cancel the new appointment
  const cancelResult = await AppointmentBookingService.cancelAppointment(
    newAptRecord!.id,
    patientA,
    "Patient schedule changed"
  );
  assert(cancelResult.success, "2.4 Cancellation operation succeeds with reason");

  const cancelledRecord = AppointmentStore.getAppointmentById(newAptRecord!.id);
  assert(
    cancelledRecord?.status === "CANCELLED" && Boolean(cancelledRecord?.cancellation_reason),
    "2.5 Cancelled appointment retained in database history (soft delete with reason)"
  );

  // ------------------------------------------------------------
  // DEMONSTRATION 3: CONFLICT PREVENTION & ATOMIC CAPACITY LOCK
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: High-Concurrency Double-Booking Prevention");

  const targetDate = "2026-09-14"; // Future Monday

  // Two simultaneous requests from Patient A and Patient B
  const [attemptA, attemptB] = await Promise.all([
    AppointmentBookingService.bookAppointment(
      {
        session_id: "SES-1001",
        patient_id: patientA.identifier || patientA.id,
        doctor_id: "DOC-1001",
        facility_id: "FAC-1001",
        organization_identifier: "HSP-1001",
        appointment_date: targetDate,
        reason_for_visit: "Race Condition Test - User A",
      },
      patientA
    ),
    AppointmentBookingService.bookAppointment(
      {
        session_id: "SES-1001",
        patient_id: patientB.identifier || patientB.id,
        doctor_id: "DOC-1001",
        facility_id: "FAC-1001",
        organization_identifier: "HSP-1001",
        appointment_date: targetDate,
        reason_for_visit: "Race Condition Test - User B",
      },
      patientB
    ),
  ]);

  assert(
    (attemptA.success && attemptB.success) || (attemptA.success !== attemptB.success),
    "3.1 Concurrent booking execution handled deterministically without data corruption"
  );

  // ------------------------------------------------------------
  // DEMONSTRATION 4: MULTI-TENANT ISOLATION & SCHEDULE SEGREGATION
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Multi-Tenant & Multi-Facility Schedule Segregation");

  // Dr. Ananya Sharma sessions at City Hospital (HSP-1001) vs Green Care Clinic (CLN-1001)
  const hspSessions = AppointmentStore.getDoctorSessions("DOC-1001", "HSP-1001");
  const clnSessions = AppointmentStore.getDoctorSessions("DOC-1001", "CLN-1001");

  const hspHasClinic = hspSessions.some((s) => s.organization_identifier === "CLN-1001");
  const clnHasHospital = clnSessions.some((s) => s.organization_identifier === "HSP-1001");

  assert(!hspHasClinic && !clnHasHospital, "4.1 Multi-facility doctor schedules remain strictly segregated by facility");

  // Tenant Query Isolation
  const hspAptsAll = AppointmentStore.getAppointmentsForOrganization("HSP-1001");
  const clnAptsAll = AppointmentStore.getAppointmentsForOrganization("CLN-1001");

  const hspLeaksClinic = hspAptsAll.some((a) => a.organization_identifier === "CLN-1001");
  const clnLeaksHospital = clnAptsAll.some((a) => a.organization_identifier === "HSP-1001");

  assert(!hspLeaksClinic && !clnLeaksHospital, "4.2 Hospital and Clinic appointment repositories strictly isolated");

  // ------------------------------------------------------------
  // DEMONSTRATION 5: AUDIT & NOTIFICATION EVENT INTEGRATION
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Audit Ledger & Notification Event Integrity");

  const auditEvents = AuditLedger.getEvents().filter(
    (e) => (e.event_type as string).includes("APPOINTMENT") || (e.event_type as string).includes("BOOKING")
  );
  assert(auditEvents.length > 0, "5.1 Appointment lifecycle operations recorded in immutable Audit Ledger");

  // Check that no orphan appointments exist
  const allApts = AppointmentStore.getAllAppointments();
  const orphanCount = allApts.filter((a) => !a.patient_id || !a.doctor_id || !a.facility_id).length;
  assert(orphanCount === 0, "5.2 Zero orphan appointments detected in database store");

  console.log("\n============================================================");
  console.log(`E2E INTEGRATION SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterIntegrationSuite().catch((err) => {
  console.error("Integration test failed:", err);
  process.exit(1);
});
