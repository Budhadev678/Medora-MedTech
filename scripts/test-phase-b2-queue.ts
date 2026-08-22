// ============================================================
// MEDORA — MODIFICATION PHASE B.2 COMPREHENSIVE TEST SUITE
// CHECK-IN, TOKEN GENERATION & INTELLIGENT QUEUE MANAGEMENT
// ============================================================

import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { QueueManagementService } from "../lib/services/queue-management-service";
import { AppointmentStore } from "../lib/data/appointment-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { findIdentityById, StoredIdentity } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";
import { Appointment, QueueEntry } from "../types/database.types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ [FAIL] ${testName}`, detail !== undefined ? detail : "");
  }
}

async function runPhaseB2TestSuite() {
  console.log("\n============================================================");
  console.log("MEDORA PHASE B.2: QUEUE & CHECK-IN ENGINE VERIFICATION SUITE");
  console.log("============================================================\n");

  const todayStr = getTodayDateStr();

  // Actors
  const patientRahul = findIdentityById("PAT-1001")!;
  const patientPriya = findIdentityById("PAT-1002")!;
  const patientAmit = findIdentityById("PAT-1003")!;
  const patientPooja = findIdentityById("PAT-1004")!;
  const receptionistAnita = (findIdentityById("STAFF-1002") || findIdentityById("PER-STAFF-1002"))!;
  const doctorAnanya = (findIdentityById("DOC-1001") || findIdentityById("PER-DOC-1001"))!;
  const doctorRahul = (findIdentityById("MULTI-1001") || findIdentityById("PER-MULTI-1001"))!;

  assert(Boolean(patientRahul && receptionistAnita && doctorAnanya), "1. Identity Fixtures Loaded");

  // Reset stores for deterministic test execution
  QueueStore.reset();
  AppointmentStore.reset();

  // ------------------------------------------------------------
  // TEST GROUP 1: APPOINTMENT CHECK-IN & TOKEN GENERATION
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: APPOINTMENT CHECK-IN & TOKEN GENERATION ---");

  // 1.1 Book a fresh appointment for today
  const booking1 = await AppointmentBookingService.bookAppointment(
    {
      patient_id: patientRahul.identifier || patientRahul.id,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      appointment_date: todayStr,
      reason_for_visit: "Post-op Follow up",
    },
    patientRahul
  );
  assert(booking1.success && Boolean(booking1.appointment), "1.1 Book appointment for today succeeded");

  const apt1 = booking1.appointment!;

  // 1.2 Patient self-check-in
  const checkin1 = await QueueManagementService.checkInAppointment(
    {
      appointment_id: apt1.id,
      patient_id: apt1.patient_id,
      doctor_id: apt1.doctor_id,
      organization_identifier: apt1.organization_identifier,
      facility_id: apt1.facility_id,
      department_id: apt1.department_id,
      session_id: apt1.session_id,
      date: todayStr,
      source: "APPOINTMENT",
      checkin_source: "PATIENT_SELF",
    },
    patientRahul
  );

  assert(checkin1.success, "1.2 Patient self-check-in succeeded");
  assert(Boolean(checkin1.queue_entry), "1.3 Queue entry created");
  assert(checkin1.queue_entry?.status === "WAITING", "1.4 Initial queue status is WAITING");
  assert(checkin1.queue_entry?.source === "APPOINTMENT", "1.5 Queue source is APPOINTMENT");
  assert(checkin1.queue_entry?.checkin_source === "PATIENT_SELF", "1.6 Check-in source recorded as PATIENT_SELF");
  assert(Boolean(checkin1.queue_entry?.token_number.startsWith("C-")), "1.7 Token has Cardiology prefix C-");

  // Verify updated appointment status
  const refreshedApt1 = AppointmentStore.getAppointmentById(apt1.id)!;
  assert(refreshedApt1.status === "CHECKED_IN", "1.8 Appointment status updated to CHECKED_IN");
  assert(refreshedApt1.token_number === checkin1.queue_entry?.token_number, "1.9 Token recorded on appointment record");

  // ------------------------------------------------------------
  // TEST GROUP 2: IDEMPOTENCY & DUPLICATE CHECK-IN PROTECTION
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: IDEMPOTENCY & DUPLICATE CHECK-IN PROTECTION ---");

  const duplicateCheckin = await QueueManagementService.checkInAppointment(
    {
      appointment_id: apt1.id,
      patient_id: apt1.patient_id,
      doctor_id: apt1.doctor_id,
      organization_identifier: apt1.organization_identifier,
      facility_id: apt1.facility_id,
      department_id: apt1.department_id,
      session_id: apt1.session_id,
      date: todayStr,
      source: "APPOINTMENT",
      checkin_source: "RECEPTIONIST",
    },
    receptionistAnita
  );

  assert(duplicateCheckin.success, "2.1 Duplicate check-in handled gracefully as idempotent success");
  assert(
    duplicateCheckin.queue_entry?.token_number === checkin1.queue_entry?.token_number,
    "2.2 Duplicate check-in returned existing token without generating new number"
  );
  assert(
    duplicateCheckin.queue_entry?.id === checkin1.queue_entry?.id,
    "2.3 Duplicate check-in preserved original QueueEntry ID"
  );

  // ------------------------------------------------------------
  // TEST GROUP 3: CONSTRAINTS & REJECTIONS
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: CONSTRAINTS & REJECTIONS ---");

  // 3.1 Wrong date check-in
  const futureBooking = await AppointmentBookingService.bookAppointment(
    {
      patient_id: patientPriya.identifier || patientPriya.id,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      appointment_date: "2026-08-25",
    },
    patientPriya
  );
  assert(futureBooking.success, "3.1 Future appointment booked");

  const wrongDateCheckin = await QueueManagementService.checkInAppointment(
    {
      appointment_id: futureBooking.appointment!.id,
      patient_id: patientPriya.identifier || patientPriya.id,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      date: todayStr, // Attempting check-in today for 2026-08-25
      source: "APPOINTMENT",
    },
    patientPriya
  );
  assert(!wrongDateCheckin.success && wrongDateCheckin.error_code === "WRONG_DATE", "3.2 Wrong date check-in rejected with WRONG_DATE");

  // 3.2 Cancelled appointment check-in
  await AppointmentBookingService.cancelAppointment(futureBooking.appointment!.id, patientPriya, "Changed mind");
  const cancelledCheckin = await QueueManagementService.checkInAppointment(
    {
      appointment_id: futureBooking.appointment!.id,
      patient_id: patientPriya.identifier || patientPriya.id,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      date: "2026-08-25",
      source: "APPOINTMENT",
    },
    patientPriya
  );
  assert(!cancelledCheckin.success && cancelledCheckin.error_code === "APPOINTMENT_CANCELLED", "3.3 Cancelled appointment check-in rejected");

  // 3.3 Unauthorized cross-patient check-in
  const crossPatientCheckin = await QueueManagementService.checkInAppointment(
    {
      appointment_id: apt1.id,
      patient_id: apt1.patient_id,
      doctor_id: apt1.doctor_id,
      organization_identifier: apt1.organization_identifier,
      facility_id: apt1.facility_id,
      department_id: apt1.department_id,
      session_id: apt1.session_id,
      date: todayStr,
      source: "APPOINTMENT",
    },
    patientPriya // Patient Priya attempting to check in Patient Rahul
  );
  assert(!crossPatientCheckin.success && crossPatientCheckin.error_code === "UNAUTHORIZED", "3.4 Cross-patient unauthorized check-in rejected");

  // ------------------------------------------------------------
  // TEST GROUP 4: OPERATIONAL QUEUE STATE MACHINE
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: OPERATIONAL QUEUE STATE MACHINE ---");

  // Complete any pre-existing in-consultation session from seed data
  const existingInConsult = QueueStore.getAllQueueEntries().find(
    (q) => q.doctor_id === "DOC-1001" && q.status === "IN_CONSULTATION"
  );
  if (existingInConsult) {
    await QueueManagementService.completeConsultation(existingInConsult.id, doctorAnanya);
  }

  // Initial Queue State: Check-in a 2nd patient
  const booking2 = await AppointmentBookingService.bookAppointment(
    {
      patient_id: patientAmit.identifier || patientAmit.id,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      appointment_date: todayStr,
    },
    patientAmit
  );
  const checkin2 = await QueueManagementService.checkInAppointment(
    {
      appointment_id: booking2.appointment!.id,
      patient_id: patientAmit.identifier || patientAmit.id,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      date: todayStr,
      source: "APPOINTMENT",
    },
    receptionistAnita
  );

  const entry1 = checkin1.queue_entry!;
  const entry2 = checkin2.queue_entry!;

  // 4.1 Call Next Patient
  const callResult = await QueueManagementService.callNextPatient(
    { doctor_id: "DOC-1001", session_id: "SES-1001", date: todayStr },
    doctorAnanya
  );
  assert(callResult.success, "4.1 Doctor called next patient");
  assert(callResult.queue_entry?.status === "CALLED", "4.2 State transitioned to CALLED");
  assert(Boolean(callResult.queue_entry?.called_at), "4.3 called_at timestamp recorded");

  // 4.2 Start Consultation
  const startResult = await QueueManagementService.startConsultation(entry1.id, doctorAnanya);
  assert(startResult.success, "4.4 Consultation started successfully");
  assert(startResult.queue_entry?.status === "IN_CONSULTATION", "4.5 State transitioned to IN_CONSULTATION");
  assert(Boolean(startResult.queue_entry?.consultation_started_at), "4.6 consultation_started_at timestamp recorded");

  // 4.3 Exclusivity Constraint: Attempt to start a 2nd consultation concurrently for same doctor
  const secondStartAttempt = await QueueManagementService.startConsultation(entry2.id, doctorAnanya);
  assert(
    !secondStartAttempt.success && secondStartAttempt.error_code === "CONSULTATION_IN_PROGRESS",
    "4.7 Doctor single-active-consultation constraint enforced (cannot overlap consultations)"
  );

  // 4.4 Complete Consultation
  const completeResult = await QueueManagementService.completeConsultation(entry1.id, doctorAnanya);
  assert(completeResult.success, "4.8 Consultation completed successfully");
  assert(completeResult.queue_entry?.status === "COMPLETED", "4.9 State transitioned to COMPLETED");
  assert(Boolean(completeResult.queue_entry?.completed_at), "4.10 completed_at timestamp recorded");

  const completedApt = AppointmentStore.getAppointmentById(apt1.id)!;
  assert(completedApt.status === "COMPLETED", "4.11 Linked appointment status updated to COMPLETED");

  // ------------------------------------------------------------
  // TEST GROUP 5: SKIP & RECALL LIFECYCLE
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: SKIP & RECALL LIFECYCLE ---");

  // Call patient 2
  await QueueManagementService.callNextPatient(
    { doctor_id: "DOC-1001", session_id: "SES-1001", date: todayStr },
    doctorAnanya
  );

  // Skip patient 2 (no answer)
  const skipResult = await QueueManagementService.skipPatient(entry2.id, doctorAnanya, "No response in waiting hall");
  assert(skipResult.success, "5.1 Patient skipped successfully");
  assert(skipResult.queue_entry?.status === "SKIPPED", "5.2 State transitioned to SKIPPED");
  assert(Boolean(skipResult.queue_entry?.skipped_at), "5.3 skipped_at timestamp recorded");

  // Recall patient 2
  const recallResult = await QueueManagementService.recallPatient(entry2.id, doctorAnanya);
  assert(recallResult.success, "5.4 Patient recalled successfully");
  assert(recallResult.queue_entry?.status === "CALLED", "5.5 Recalled patient state set to CALLED");
  assert(
    recallResult.queue_entry?.token_number === entry2.token_number,
    "5.6 Recalled patient preserved original token number"
  );

  // ------------------------------------------------------------
  // TEST GROUP 6: WALK-IN REGISTRATION & CAPACITY BOUNDARY
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: WALK-IN REGISTRATION & CAPACITY BOUNDARY ---");

  const walkInResult = await QueueManagementService.createWalkInQueueEntry(
    {
      patient_id: patientPriya.identifier || patientPriya.id,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      session_id: "SES-1001",
      date: todayStr,
      source: "WALK_IN",
      reason_for_visit: "Acute palpitations",
    },
    receptionistAnita
  );

  assert(walkInResult.success, "6.1 Walk-in patient registered successfully");
  assert(walkInResult.queue_entry?.source === "WALK_IN", "6.2 Queue entry source is WALK_IN");
  assert(walkInResult.queue_entry?.status === "WAITING", "6.3 Walk-in initial status is WAITING");

  // ------------------------------------------------------------
  // TEST GROUP 7: MULTI-DOCTOR & MULTI-FACILITY QUEUE ISOLATION
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: MULTI-DOCTOR & MULTI-FACILITY QUEUE ISOLATION ---");

  // Dr. Rahul at City Hospital (HSP-1001 / SES-1005)
  const drRahulQueue = QueueStore.getQueueForDoctor("MULTI-1001", "HSP-1001", todayStr);
  assert(
    drRahulQueue.every((q) => q.doctor_id === "MULTI-1001" && q.token_number.startsWith("R-")),
    "7.1 Dr. Rahul queue strictly isolated with R- tokens"
  );

  // Dr. Ananya at Green Care Clinic (CLN-1001 / SES-1003)
  const greenCareQueue = QueueStore.getQueueForFacility("CLN-1001", todayStr);
  assert(
    greenCareQueue.every((q) => q.organization_identifier === "CLN-1001" && q.token_number.startsWith("G-")),
    "7.2 Green Care Clinic queue strictly isolated with G- tokens"
  );

  // ------------------------------------------------------------
  // TEST GROUP 8: QUEUE POSITION & PRIVACY
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 8: QUEUE POSITION & PRIVACY ---");

  const pos = QueueManagementService.getQueuePosition(walkInResult.queue_entry!.id);
  assert(typeof pos.people_ahead === "number", "8.1 Contextual people_ahead calculated");
  assert(pos.token_number === walkInResult.queue_entry?.token_number, "8.2 Position info returns patient token");
  assert((pos as any).patient_name === undefined, "8.3 Patient position info does NOT expose other patient names");

  // ------------------------------------------------------------
  // TEST GROUP 9: AUDIT LOGGING
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 9: AUDIT LOGGING ---");

  const auditEvents = AuditLedger.getEvents();
  const checkinLogs = auditEvents.filter((e) => (e.event_type as any) === "CHECK_IN" || e.summary.includes("CHECK_IN"));
  const startLogs = auditEvents.filter((e) => (e.event_type as any) === "START_CONSULTATION" || e.summary.includes("START_CONSULTATION"));
  const completeLogs = auditEvents.filter((e) => (e.event_type as any) === "COMPLETE_CONSULTATION" || e.summary.includes("COMPLETE_CONSULTATION"));

  assert(checkinLogs.length > 0, "9.1 CHECK_IN events recorded in immutable audit ledger");
  assert(startLogs.length > 0, "9.2 START_CONSULTATION events recorded in immutable audit ledger");
  assert(completeLogs.length > 0, "9.3 COMPLETE_CONSULTATION events recorded in immutable audit ledger");

  // ------------------------------------------------------------
  // TEST SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`PHASE B.2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhaseB2TestSuite().catch((err) => {
  console.error("Test Suite Execution Failed:", err);
  process.exit(1);
});
