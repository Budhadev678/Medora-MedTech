// ============================================================
// MEDORA — MODIFICATION PHASE C.1 TEST SUITE
// CLINICAL ENCOUNTER & DOCTOR CONSULTATION WORKSPACE
// ============================================================

import { ConsultationService } from "../lib/services/consultation-service";
import { QueueManagementService } from "../lib/services/queue-management-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { AppointmentStore } from "../lib/data/appointment-store";
import {
  getAllEncounters,
  getEncounterById,
  getPatientEncounters,
  getDoctorEncounters,
} from "../lib/data/encounter-store";
import {
  getClinicalRecordByEncounterId,
  getPatientClinicalRecords,
} from "../lib/data/clinical-record-store";
import { ConsultationHistoryStore } from "../lib/data/consultation-history-store";
import { findIdentityById, StoredIdentity } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";
import { QueueEntry, Appointment, HealthcareEncounter } from "../types/database.types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n============================================================");
  console.log("MEDORA — PHASE C.1 VERIFICATION TEST SUITE");
  console.log("CLINICAL ENCOUNTER & DOCTOR CONSULTATION WORKSPACE");
  console.log("============================================================\n");

  const todayStr = getTodayDateStr();

  // Test Actors
  const doctorAnanya = findIdentityById("DOC-1001")!; // Dr. Ananya Sharma
  const doctorRahul = findIdentityById("MULTI-1001") || findIdentityById("DOC-1001")!; // Other doctor
  const patientRahul = findIdentityById("PAT-1001")!; // Rahul Verma
  const patientPriya = findIdentityById("PAT-1002")!; // Priya Patel
  const receptionist: StoredIdentity = findIdentityById("STAFF-1001") || {
    id: "staff-1",
    identifier: "STAFF-1001",
    fullName: "Reception Staff",
    email: "staff@hospital.com",
    role: "staff",
    accountStatus: "active",
    verificationStatus: "verified",
    passwordHash: "seed-hash",
    createdAt: new Date().toISOString(),
  };

  // Free doctor's desk from initial seeded in-consultation session
  const activeSeed = QueueStore.getQueueEntryById("q-1002");
  if (activeSeed && activeSeed.status === "IN_CONSULTATION") {
    QueueStore.saveQueueEntry({
      ...activeSeed,
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
    });
  }

  // ------------------------------------------------------------
  // TEST 1: Invariant — Booking Appointment Does NOT Create Encounter
  // ------------------------------------------------------------
  console.log("--- TEST GROUP 1: Appointment vs Encounter Separation Invariant ---");

  const initialEncounterCount = getAllEncounters().length;

  const newApt: Appointment = {
    id: `apt-c1-test-1`,
    appointment_no: `APT-C1-001`,
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    department_id: "DEP-CARD-1001",
    department_name: "Cardiology OPD",
    session_id: "SES-1001",
    appointment_date: todayStr,
    session_start_time: "08:00",
    session_end_time: "10:00",
    slot_display_time: "08:00 AM - 10:00 AM Session",
    status: "CONFIRMED",
    booking_source: "PATIENT",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  AppointmentStore.saveAppointment(newApt);

  const encountersAfterBooking = getAllEncounters().length;
  assert(
    encountersAfterBooking === initialEncounterCount,
    "Booking an appointment must NOT create an encounter entity",
    `Expected ${initialEncounterCount}, got ${encountersAfterBooking}`
  );

  // ------------------------------------------------------------
  // TEST 2: Check-In Issues Token and Enters Queue as WAITING
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Queue Check-In & Token Issuance ---");

  const checkinRes = await QueueManagementService.checkInAppointment(
    {
      appointment_id: newApt.id,
      patient_id: "PAT-1001",
      date: todayStr,
      checkin_source: "RECEPTIONIST",
    },
    receptionist
  );

  assert(checkinRes.success === true, "Appointment check-in succeeds");
  assert(Boolean(checkinRes.queue_entry?.token_number), "Queue token number issued");
  assert(checkinRes.queue_entry?.status === "WAITING", "Queue entry status is WAITING");

  const queueEntryId = checkinRes.queue_entry!.id;

  // ------------------------------------------------------------
  // TEST 3: Doctor Authorization Check (Wrong Doctor Rejection)
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Doctor Authorization & Exclusivity ---");

  // Call patient
  const callRes = await QueueManagementService.callPatient(queueEntryId, doctorAnanya);
  assert(callRes.success === true, "Doctor calls next waiting patient");

  // Attempt start with wrong doctor
  const wrongDocActor: StoredIdentity = {
    ...doctorAnanya,
    id: "DOC-WRONG-999",
    identifier: "DOC-WRONG-999",
    fullName: "Dr. Wrong Doctor",
  };

  const wrongDocRes = await ConsultationService.startConsultationFromQueue(queueEntryId, wrongDocActor);
  assert(wrongDocRes.success === false, "Unauthorized/wrong doctor starting consultation is rejected");
  assert(wrongDocRes.error_code === "WRONG_DOCTOR", "Returns WRONG_DOCTOR error code");

  // Attempt start by non-doctor (receptionist)
  const staffStartRes = await ConsultationService.startConsultationFromQueue(queueEntryId, receptionist);
  assert(staffStartRes.success === false, "Non-doctor (staff/reception) starting consultation is rejected");
  assert(staffStartRes.error_code === "FORBIDDEN", "Returns FORBIDDEN error code for non-clinician");

  // ------------------------------------------------------------
  // TEST 4: Authorized Doctor Starts Consultation (Authoritative Encounter Created)
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Authoritative Consultation Initiation ---");

  const startRes = await ConsultationService.startConsultationFromQueue(queueEntryId, doctorAnanya);
  assert(startRes.success === true, "Authorized doctor starts consultation successfully");
  assert(Boolean(startRes.encounter), "HealthcareEncounter entity created on start");
  assert(startRes.encounter?.status === "ACTIVE", "Encounter status is ACTIVE");
  assert(Boolean(startRes.encounter?.started_at), "Encounter started_at timestamp recorded");
  assert(startRes.encounter?.patient_id === "PAT-1001", "Encounter bound to correct patient PAT-1001");
  assert(startRes.encounter?.provider_id === "DOC-1001", "Encounter bound to correct doctor DOC-1001");
  assert(startRes.encounter?.organization_id === "HSP-1001", "Encounter bound to correct organization HSP-1001");
  assert(startRes.queue_entry?.status === "IN_CONSULTATION", "Queue entry transitioned to IN_CONSULTATION");

  const updatedApt = AppointmentStore.getAppointmentById(newApt.id);
  assert(updatedApt?.status === "IN_CONSULTATION", "Linked appointment transitioned to IN_CONSULTATION");

  const encounterId = startRes.encounter!.id;

  // ------------------------------------------------------------
  // TEST 5: Doctor Exclusivity — Concurrent Consultations Guard
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Single Active Consultation Invariant ---");

  // Create second walk-in patient in queue
  const walkinRes = await QueueManagementService.createWalkInQueueEntry(
    {
      session_id: "SES-1001",
      patient_id: "PAT-1002",
      date: todayStr,
      reason_for_visit: "Acute headache",
    },
    receptionist
  );
  assert(walkinRes.success === true, "Walk-in patient registered into queue");

  // Doctor Ananya tries to start second patient while first is active
  const secondStartRes = await ConsultationService.startConsultationFromQueue(
    walkinRes.queue_entry!.id,
    doctorAnanya
  );
  assert(
    secondStartRes.success === false,
    "Doctor cannot start second active consultation while one is in progress",
    secondStartRes.message
  );
  assert(
    secondStartRes.error_code === "CONSULTATION_IN_PROGRESS",
    "Returns CONSULTATION_IN_PROGRESS error code"
  );

  // ------------------------------------------------------------
  // TEST 6: Clinical Documentation Draft Saving & Vitals Units
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Clinical Documentation & Draft Persistence ---");

  const draftData = {
    chief_complaint: "Exertional chest tightness radiating to left shoulder for 2 weeks",
    symptoms: [
      {
        id: "SYM-101",
        name: "Exertional chest tightness",
        duration: "2 weeks",
        severity: "MODERATE" as const,
      },
    ],
    vitals: {
      systolic_bp_mmhg: 144,
      diastolic_bp_mmhg: 94,
      heart_rate_bpm: 78,
      temperature_celsius: 36.9,
      spo2_percent: 98,
      weight_kg: 74,
      height_cm: 175,
      bmi: 24.2,
      recorded_at: new Date().toISOString(),
      recorded_by: "DOC-1001",
    },
    observations: "Alert, oriented. Heart sounds regular, no murmurs. Chest clear.",
    assessment: "Stage 1 Essential Hypertension with mild exertional angina symptoms",
    diagnoses: [
      {
        id: "DX-101",
        name: "Essential (primary) hypertension",
        icd10_code: "I10",
        category: "PRIMARY" as const,
        status: "CONFIRMED" as const,
        recorded_by: "DOC-1001",
        recorded_by_name: "Dr. Ananya Sharma",
        recorded_at: new Date().toISOString(),
      },
    ],
    treatment_plan: "DASH diet, daily 30m aerobic exercise, Telmisartan 40mg once daily.",
    follow_up_plan: {
      required: true,
      follow_up_timeframe: "7 days",
      instructions: "Return with 7-day home BP monitoring log.",
    },
  };

  const draftSaveRes = await ConsultationService.saveDraft(encounterId, draftData, doctorAnanya);
  assert(draftSaveRes.success === true, "Doctor saves clinical draft successfully");

  const savedRecord = getClinicalRecordByEncounterId(encounterId);
  assert(Boolean(savedRecord), "Clinical record draft retrieved from store");
  assert(savedRecord?.vitals?.systolic_bp_mmhg === 144, "Explicit systolic BP unit recorded accurately (144 mmHg)");
  assert(savedRecord?.diagnoses?.length === 1, "ICD-10 clinical diagnosis recorded");
  assert(savedRecord?.diagnoses[0].icd10_code === "I10", "ICD-10 code I10 preserved");

  // ------------------------------------------------------------
  // TEST 7: Consultation Completion & Duration Recording
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: Consultation Completion Workflow ---");

  const completeRes = await ConsultationService.completeConsultation(encounterId, draftData, doctorAnanya);
  assert(completeRes.success === true, "Consultation completed successfully");
  assert(completeRes.encounter?.status === "COMPLETED", "Encounter status transitioned to COMPLETED");
  assert(Boolean(completeRes.encounter?.completed_at), "Encounter completed_at timestamp recorded");
  assert(typeof completeRes.duration_minutes === "number", "Consultation duration in minutes computed");

  const completedQEntry = QueueStore.getQueueEntryById(queueEntryId);
  assert(completedQEntry?.status === "COMPLETED", "Queue entry status transitioned to COMPLETED");

  const finalApt = AppointmentStore.getAppointmentById(newApt.id);
  assert(finalApt?.status === "COMPLETED", "Appointment status transitioned to COMPLETED");

  // Attempt double-completion
  const doubleCompleteRes = await ConsultationService.completeConsultation(encounterId, draftData, doctorAnanya);
  assert(doubleCompleteRes.success === false, "Double-completing encounter is rejected");
  assert(doubleCompleteRes.error_code === "ALREADY_COMPLETED", "Returns ALREADY_COMPLETED error code");

  // ------------------------------------------------------------
  // TEST 8: Doctor Can Now Start Next Patient After Completion
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 8: Next Patient Initiation After Desk Freed ---");

  // Call second patient
  await QueueManagementService.callPatient(walkinRes.queue_entry!.id, doctorAnanya);
  const nextStartRes = await ConsultationService.startConsultationFromQueue(
    walkinRes.queue_entry!.id,
    doctorAnanya
  );
  assert(nextStartRes.success === true, "Doctor can start next consultation after completing previous patient");

  // ------------------------------------------------------------
  // TEST 9: Completed Record Amendment & Version History
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 9: Immutable History & Formal Amendment ---");

  const amendData = {
    ...draftData,
    treatment_plan: "DASH diet, daily 30m aerobic exercise, Telmisartan 40mg once daily. Added Vitamin D3 60k IU weekly.",
  };

  const amendRes = await ConsultationService.amendConsultation(
    encounterId,
    amendData,
    "Added Vitamin D3 supplement after lab review",
    doctorAnanya
  );

  assert(amendRes.success === true, "Completed consultation amended successfully with documented reason");
  assert(amendRes.record?.version === 2, "Record version incremented to 2");
  assert(amendRes.record?.version_history?.length === 1, "Version 1 snapshot preserved in version_history");
  assert(
    amendRes.record?.version_history[0].treatment_plan === draftData.treatment_plan,
    "Version 1 treatment plan preserved in snapshot"
  );
  assert(
    amendRes.record?.amendment_reason === "Added Vitamin D3 supplement after lab review",
    "Amendment reason stored"
  );

  // ------------------------------------------------------------
  // TEST 10: Strict Patient Isolation (PAT-1001 vs PAT-1002)
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 10: Strict Patient Isolation ---");

  const rahulEncounters = getPatientEncounters("PAT-1001");
  const priyaEncounters = getPatientEncounters("PAT-1002");

  const rahulHasPriyaData = rahulEncounters.some((e) => e.patient_id === "PAT-1002");
  const priyaHasRahulData = priyaEncounters.some((e) => e.patient_id === "PAT-1001");

  assert(!rahulHasPriyaData, "Rahul (PAT-1001) encounters contain ZERO PAT-1002 data");
  assert(!priyaHasRahulData, "Priya (PAT-1002) encounters contain ZERO PAT-1001 data");

  // Patient access to consultation context
  const rahulContext = ConsultationService.getConsultationContext(encounterId, patientRahul);
  assert(Boolean(rahulContext), "Patient PAT-1001 can access own consultation context");

  const priyaContext = ConsultationService.getConsultationContext(encounterId, patientPriya);
  assert(priyaContext === null, "Patient PAT-1002 access to PAT-1001 consultation context is DENIED");

  // ------------------------------------------------------------
  // TEST 11: Multi-Facility Doctor Practice Context Binding
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 11: Multi-Facility Doctor Practice Binding ---");

  // Create appointment at Green Care Clinic (CLN-1001) for Dr. Ananya
  const clinicApt: Appointment = {
    id: `apt-c1-clinic-1`,
    appointment_no: `APT-C1-002`,
    patient_id: "PAT-1002",
    patient_name: "Priya Patel",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111103",
    organization_identifier: "CLN-1001",
    organization_name: "Green Care Clinic",
    facility_id: "FAC-1003",
    department_id: "DEP-CARD-1002",
    department_name: "Outpatient Cardiology Suite",
    session_id: "SES-1005",
    appointment_date: todayStr,
    session_start_time: "16:00",
    session_end_time: "18:00",
    slot_display_time: "04:00 PM - 06:00 PM Session",
    status: "CONFIRMED",
    booking_source: "PATIENT",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  AppointmentStore.saveAppointment(clinicApt);

  const clinicCheckin = await QueueManagementService.checkInAppointment(
    {
      appointment_id: clinicApt.id,
      patient_id: "PAT-1002",
      date: todayStr,
      checkin_source: "RECEPTIONIST",
    },
    receptionist
  );

  // Complete walk-in first so Dr. Ananya is free
  await ConsultationService.completeConsultation(
    nextStartRes.encounter!.id,
    { chief_complaint: "Headache resolved" },
    doctorAnanya
  );

  await QueueManagementService.callPatient(clinicCheckin.queue_entry!.id, doctorAnanya);
  const clinicStartRes = await ConsultationService.startConsultationFromQueue(
    clinicCheckin.queue_entry!.id,
    doctorAnanya
  );

  assert(clinicStartRes.success === true, "Dr. Ananya starts consultation at Green Care Clinic");
  assert(
    clinicStartRes.encounter?.organization_id === "CLN-1001",
    "Clinic encounter bound to organization CLN-1001",
    `Expected CLN-1001, got ${clinicStartRes.encounter?.organization_id}`
  );
  assert(
    clinicStartRes.encounter?.facility_id === "FAC-1003",
    "Clinic encounter bound to facility FAC-1003",
    `Expected FAC-1003, got ${clinicStartRes.encounter?.facility_id}`
  );

  // Clean up
  await ConsultationService.completeConsultation(
    clinicStartRes.encounter!.id,
    { chief_complaint: "Routine checkup done" },
    doctorAnanya
  );

  // ------------------------------------------------------------
  // TEST 12: Audit Trail Event Verification
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 12: Audit Trail Event Integrity ---");

  const auditEvents = AuditLedger.getEvents();
  const startEvents = auditEvents.filter((e) => (e.event_type as string) === "CONSULTATION_STARTED");
  const completeEvents = auditEvents.filter((e) => (e.event_type as string) === "CONSULTATION_COMPLETED");
  const amendEvents = auditEvents.filter((e) => (e.event_type as string) === "ENCOUNTER_AMENDED");

  assert(startEvents.length >= 1, "CONSULTATION_STARTED audit events recorded in ledger");
  assert(completeEvents.length >= 1, "CONSULTATION_COMPLETED audit events recorded in ledger");
  assert(amendEvents.length >= 1, "ENCOUNTER_AMENDED audit events recorded in ledger");

  // Summary
  console.log("\n============================================================");
  console.log(`TOTAL PHASE C.1 TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
