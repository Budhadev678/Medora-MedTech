// ============================================================
// MEDORA — PRIORITY 1 / PHASE 1 / PROMPT 2 E2E VERIFICATION TEST
// Automated Verification for Doctor -> Patient Consultation Flow
// ============================================================

import { AppointmentStore } from "@/lib/data/appointment-store";
import { getAllEncounters, getEncounterById, getEncounterByAppointmentId, saveEncounters } from "@/lib/data/encounter-store";
import { getAllClinicalRecords, getClinicalRecordByEncounterId, saveClinicalRecordDraft } from "@/lib/data/clinical-record-store";
import { ConsultationService } from "@/lib/services/consultation-service";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { ClinicalContinuityService } from "@/lib/services/clinical-continuity-service";
import { findIdentityById, StoredIdentity } from "@/lib/data/identity-store";
import { getRemainingCurrentWeekDates } from "@/lib/utils";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${label}`);
    failedCount++;
  }
}

async function runPhase1Prompt2Tests() {
  console.log("\n============================================================");
  console.log("MEDORA — PHASE 1 / PROMPT 2: CONSULTATION FLOW E2E VERIFICATION");
  console.log("============================================================\n");

  // Re-seed appointment store
  AppointmentStore.reset();

  // Identities
  const patientA = findIdentityById("PAT-1001") as StoredIdentity; // Rahul Verma
  const patientB = findIdentityById("PAT-1002") as StoredIdentity; // Priya Patel
  const doctorA = findIdentityById("DOC-1001") as StoredIdentity; // Dr. Ananya Sharma (Cardiologist)
  const doctorB = findIdentityById("DOC-1002") as StoredIdentity; // Dr. Rajesh Kumar (Pediatrician)

  assert(Boolean(patientA && doctorA && doctorB), "Test prerequisite: Identities exist");

  // Step 1: Patient A books appointment with Doctor A
  console.log("\n--- STEP 1: PATIENT A BOOKS REAL APPOINTMENT WITH DOCTOR A ---");
  const dates = getRemainingCurrentWeekDates();
  const targetDate = dates[0].iso;
  const doctorASessions = AppointmentStore.getDoctorSessions("DOC-1001", "HSP-1001");
  assert(doctorASessions.length > 0, "Doctor A has valid sessions");
  const session = doctorASessions[0];

  const bookRes = await AppointmentBookingService.bookAppointment(
    {
      patient_id: patientA.identifier || patientA.id,
      doctor_id: doctorA.identifier || doctorA.id,
      organization_identifier: "HSP-1001",
      facility_id: session.facility_id,
      department_id: session.department_id,
      session_id: session.id,
      appointment_date: targetDate,
      reason_for_visit: "Chest tightness and palpitations after exercise",
      booking_source: "PATIENT",
    },
    patientA
  );

  assert(bookRes.success && Boolean(bookRes.appointment), `Patient A creates appointment successfully: ${bookRes.message}`);
  const appointment = bookRes.appointment!;
  console.log(`Created Appointment: ${appointment.id} (${appointment.appointment_no}) for Doctor: ${appointment.doctor_name}`);

  // Step 2: Doctor A starts/opens consultation for the appointment
  console.log("\n--- STEP 2: DOCTOR A OPENS APPOINTMENT INTO CONSULTATION ---");
  const startRes = await ConsultationService.startOrGetConsultationForAppointment(
    appointment.id,
    doctorA
  );

  assert(startRes.success, "Doctor A successfully initiates consultation for appointment");
  assert(Boolean(startRes.encounter), "Encounter object created and returned");
  assert(startRes.encounter?.appointment_id === appointment.id, "Encounter is correctly linked to appointment_id");
  assert(
    startRes.encounter?.provider_id === doctorA.identifier || startRes.encounter?.provider_id === doctorA.id,
    "Encounter is bound to Doctor A"
  );
  assert(
    startRes.encounter?.patient_id === patientA.identifier || startRes.encounter?.patient_id === patientA.id,
    "Encounter is bound to Patient A"
  );

  const encounter = startRes.encounter!;
  console.log(`Active Encounter: ${encounter.id} (Status: ${encounter.status}, Linked Apt: ${encounter.appointment_id})`);

  // Verify appointment status updated to IN_CONSULTATION
  const updatedApt = AppointmentStore.getAppointmentById(appointment.id);
  assert(updatedApt?.status === "IN_CONSULTATION", "Appointment status transitioned to IN_CONSULTATION");

  // Step 3: Prevent duplicate encounter creation on re-open
  console.log("\n--- STEP 3: RE-OPENING APPOINTMENT PREVENTS DUPLICATE ENCOUNTER ---");
  const reOpenRes = await ConsultationService.startOrGetConsultationForAppointment(
    appointment.id,
    doctorA
  );
  assert(reOpenRes.success, "Re-opening appointment succeeds");
  assert(reOpenRes.encounter?.id === encounter.id, "Re-opening returns identical encounter ID (no duplicates)");

  // Step 4: Doctor saves draft clinical notes
  console.log("\n--- STEP 4: DOCTOR SAVES DRAFT CLINICAL NOTES ---");
  const draftRes = saveClinicalRecordDraft({
    encounterId: encounter.id,
    chiefComplaint: "Substernal chest tightness radiating to left shoulder",
    symptoms: [
      {
        id: "SYM-101",
        name: "Substernal chest discomfort",
        severity: "MODERATE",
        onset: "3 days ago",
        duration: "3 days",
      },
    ],
    vitals: {
      temperature_celsius: 36.9,
      heart_rate_bpm: 82,
      systolic_bp_mmhg: 138,
      diastolic_bp_mmhg: 88,
      respiratory_rate_bpm: 16,
      spo2_percent: 99,
      recorded_at: new Date().toISOString(),
      recorded_by: doctorA.identifier || doctorA.id,
      recorded_by_name: doctorA.fullName,
    },
    observations: "Patient is conscious, alert, mild tachycardia, normal heart sounds S1/S2.",
    clinicalNotes: "Preliminary evaluation shows stress-induced exertional discomfort. ECG normal sinus rhythm.",
    assessment: "Atypical chest pain, primary hypertension suspect.",
    diagnoses: [
      {
        id: "DX-101",
        name: "Essential (primary) hypertension",
        icd10_code: "I10",
        status: "CONFIRMED",
        category: "PRIMARY",
        recorded_by: doctorA.identifier || doctorA.id,
        recorded_by_name: doctorA.fullName,
        recorded_at: new Date().toISOString(),
      },
    ],
    treatmentPlan: "Lifestyle modification, low sodium diet, avoid strenuous exertion for 1 week.",
    followUpPlan: {
      required: true,
      instructions: "Review in 1 week with 24-hr BP monitoring log.",
    },
    actorId: doctorA.identifier || doctorA.id,
    actorName: doctorA.fullName,
    actorRole: doctorA.role,
  });

  assert(draftRes.success && Boolean(draftRes.record), "Draft saved successfully in ClinicalRecordStore");
  assert(draftRes.record?.status === "DRAFT", "Clinical record status remains DRAFT while in progress");

  // Step 5: Verify draft is NOT prematurely shown as completed to patient
  console.log("\n--- STEP 5: VERIFY DRAFT IS NOT PREMATURELY COMPLETED ---");
  const patientTimelineBefore = ClinicalContinuityService.getPatientTimeline(patientA.identifier || patientA.id, patientA);
  const completedEncountersBefore = patientTimelineBefore.filter(
    (e) => e.encounter_id === encounter.id && e.event_type === "CLINICAL_RECORD"
  );
  assert(completedEncountersBefore.length === 0, "Patient cannot see unfinalized draft consultation in clinical notes");

  // Step 6: Doctor completes the consultation
  console.log("\n--- STEP 6: DOCTOR COMPLETES THE CONSULTATION ---");
  const completeRes = await ConsultationService.completeConsultation(
    encounter.id,
    {
      chief_complaint: "Substernal chest tightness radiating to left shoulder",
      symptoms: draftRes.record?.symptoms,
      vitals: draftRes.record?.vitals,
      observations: draftRes.record?.observations,
      clinical_notes: draftRes.record?.clinical_notes,
      assessment: draftRes.record?.assessment,
      diagnoses: draftRes.record?.diagnoses,
      treatment_plan: draftRes.record?.treatment_plan,
      follow_up_plan: draftRes.record?.follow_up_plan,
    },
    doctorA
  );

  assert(completeRes.success, "ConsultationService.completeConsultation completed successfully");
  assert(completeRes.clinical_record?.status === "COMPLETED", "Clinical record status is COMPLETED");
  assert(
    completeRes.encounter?.status === "FINALIZED" || completeRes.encounter?.status === "COMPLETED",
    "Encounter status is FINALIZED/COMPLETED"
  );

  // Step 7: Verify Appointment status is synchronized to COMPLETED
  console.log("\n--- STEP 7: VERIFY APPOINTMENT STATUS IS COMPLETED ---");
  const finalizedApt = AppointmentStore.getAppointmentById(appointment.id);
  assert(finalizedApt?.status === "COMPLETED", "Linked appointment status transitioned to COMPLETED");

  // Step 8: Verify Patient A receives the completed consultation
  console.log("\n--- STEP 8: PATIENT A RECEIVES COMPLETED CONSULTATION ---");
  const patientTimelineAfter = ClinicalContinuityService.getPatientTimeline(patientA.identifier || patientA.id, patientA);
  const completedAptInTimeline = patientTimelineAfter.find((e) => e.source_id === appointment.id);
  assert(Boolean(completedAptInTimeline), "Completed consultation appointment is visible in Patient A timeline");
  assert(completedAptInTimeline?.status === "COMPLETED", "Timeline event status reflects COMPLETED");

  const patientEncounters = ClinicalContinuityService.getPatientEncounterBundles(patientA.identifier || patientA.id, patientA);
  const completedBundle = patientEncounters.find((b) => b.encounter.id === encounter.id);
  assert(Boolean(completedBundle), "Completed encounter bundle is present in Patient A visits");
  assert(completedBundle?.clinical_record?.status === "COMPLETED", "Clinical record in bundle is verified COMPLETED");
  assert(
    completedBundle?.clinical_record?.diagnoses?.[0]?.name === "Essential (primary) hypertension",
    "Clinical diagnosis correctly attached to completed patient visit"
  );

  // Step 9: Anti-IDOR & Authorization Tests
  console.log("\n--- STEP 9: ANTI-IDOR & SECURITY AUTHORIZATION ---");
  // Patient B cannot access Patient A timeline
  const patientBTimelineForA = ClinicalContinuityService.getPatientTimeline(patientA.identifier || patientA.id, patientB);
  assert(patientBTimelineForA.length === 0, "Anti-IDOR: Patient B cannot view Patient A timeline");

  // Doctor B cannot hijack Doctor A's appointment consultation
  const wrongDoctorRes = await ConsultationService.startOrGetConsultationForAppointment(
    appointment.id,
    doctorB
  );
  assert(!wrongDoctorRes.success && wrongDoctorRes.error_code === "WRONG_DOCTOR", "Anti-IDOR: Doctor B cannot conduct Doctor A's appointment");

  console.log("\n============================================================");
  console.log(`PHASE 1 / PROMPT 2 SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase1Prompt2Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
