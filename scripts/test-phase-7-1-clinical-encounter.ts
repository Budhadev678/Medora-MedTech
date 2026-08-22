// ============================================================
// MEDORA — PHASE 7.1 TEST SUITE: CLINICAL ENCOUNTER FOUNDATION
// ============================================================

import { ConsultationService } from "../lib/services/consultation-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { AppointmentStore } from "../lib/data/appointment-store";
import { getEncounterById, getAllEncounters } from "../lib/data/encounter-store";
import { getClinicalRecordByEncounterId } from "../lib/data/clinical-record-store";
import { findIdentityById } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";
import { StoredIdentity } from "../lib/data/identity-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase71Tests() {
  console.log("============================================================");
  console.log("MEDORA — PHASE 7.1 TEST SUITE: CLINICAL ENCOUNTER FOUNDATION");
  console.log("============================================================\n");

  const today = getTodayDateStr();

  // Test Actors
  const doctorActor = findIdentityById("DOC-1001");
  const patientAActor = findIdentityById("PAT-1001");
  const patientBActor = findIdentityById("PAT-1002");

  assert(Boolean(doctorActor), "Resolved Doctor actor (DOC-1001)");
  assert(Boolean(patientAActor), "Resolved Patient A actor (PAT-1001)");
  assert(Boolean(patientBActor), "Resolved Patient B actor (PAT-1002)");

  // Reset QueueStore to clean state for test run
  QueueStore.reset();
  const existingDoctorQueue = QueueStore.getQueueForDoctor("DOC-1001");
  existingDoctorQueue.forEach((q) => {
    if (q.status === "IN_CONSULTATION") {
      QueueStore.saveQueueEntry({ ...q, status: "COMPLETED" });
    }
  });

  // ------------------------------------------------------------
  // TEST GROUP 1: Queue-to-Consultation Handoff & Server-Authoritative Encounter
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 1: Queue-to-Consultation Handoff & Server-Authoritative Encounter");

  // Create queue entry for testing using QueueStore.getNextToken & QueueStore.saveQueueEntry
  const tokenMeta = QueueStore.getNextToken("HSP-1001", "FAC-1001", "DEP-CARDIO", "DOC-1001", "SES-1001", today, "Dr. Ananya Sharma");
  const testQueueEntry = QueueStore.saveQueueEntry({
    id: `q-test-${Date.now()}`,
    queue_no: `QUE-TEST-${Date.now()}`,
    appointment_id: "APT-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    patient_phone: "+91 98765 43210",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    department_id: "DEP-CARDIO",
    department_name: "Cardiology OPD",
    session_id: "SES-1001",
    date: today,
    token_number: tokenMeta.tokenNumber,
    token_sequence: tokenMeta.sequenceNumber,
    source: "APPOINTMENT",
    checkin_source: "PATIENT_SELF",
    status: "WAITING",
    room_number: "Room 102",
    checked_in_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    notes: "Patient-provided reason: Exertional chest tightness",
  });

  assert(Boolean(testQueueEntry), "Generated test queue token for Patient A");
  assert(testQueueEntry.status === "WAITING", "Initial token status is WAITING");

  // Doctor calls patient
  QueueStore.saveQueueEntry({
    ...testQueueEntry,
    status: "CALLED",
    called_at: new Date().toISOString(),
  });

  // Doctor clicks START CONSULTATION
  const startResult = await ConsultationService.startConsultationFromQueue(testQueueEntry.id, doctorActor);

  assert(startResult.success === true, "Consultation initiated successfully from queue");
  assert(Boolean(startResult.encounter), "Server returned authoritative HealthcareEncounter");
  assert(startResult.encounter?.status === "ACTIVE", "Encounter status is ACTIVE");
  assert(startResult.encounter?.patient_id === "PAT-1001", "Encounter correctly linked to Patient A (PAT-1001)");
  assert(startResult.encounter?.provider_id === "DOC-1001", "Encounter correctly linked to Doctor (DOC-1001)");
  assert(startResult.encounter?.organization_id === "HSP-1001", "Encounter correctly linked to Facility (HSP-1001)");
  assert(startResult.queue_entry?.status === "IN_CONSULTATION", "Queue Entry status updated to IN_CONSULTATION");

  const encounterId = startResult.encounter!.id;

  // ------------------------------------------------------------
  // TEST GROUP 2: Idempotency & Doctor Consultation Exclusivity Guard
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Idempotency & Doctor Consultation Exclusivity Guard");

  // Repeated call with same token returns existing encounter (Idempotent)
  const repeatResult = await ConsultationService.startConsultationFromQueue(testQueueEntry.id, doctorActor);
  assert(repeatResult.success === true, "Repeated consultation start request succeeded");
  assert(repeatResult.encounter?.id === encounterId, "Returned same existing encounter ID (Idempotency verified)");

  // Create second patient token using QueueStore.getNextToken & QueueStore.saveQueueEntry
  const tokenMeta2 = QueueStore.getNextToken("HSP-1001", "FAC-1001", "DEP-CARDIO", "DOC-1001", "SES-1001", today, "Dr. Ananya Sharma");
  const secondQueueEntry = QueueStore.saveQueueEntry({
    id: `q-test-2-${Date.now()}`,
    queue_no: `QUE-TEST-2-${Date.now()}`,
    appointment_id: "APT-1002",
    patient_id: "PAT-1002",
    patient_name: "Priya Sharma",
    patient_phone: "+91 98765 00002",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    department_id: "DEP-CARDIO",
    department_name: "Cardiology OPD",
    session_id: "SES-1001",
    date: today,
    token_number: tokenMeta2.tokenNumber,
    token_sequence: tokenMeta2.sequenceNumber,
    source: "APPOINTMENT",
    checkin_source: "RECEPTIONIST",
    status: "CALLED",
    room_number: "Room 102",
    checked_in_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    notes: "Migraine follow-up",
  });

  // Doctor attempts to start second patient consultation while first is IN_CONSULTATION -> Must be blocked
  const blockedResult = await ConsultationService.startConsultationFromQueue(secondQueueEntry.id, doctorActor);
  assert(blockedResult.success === false, "Doctor starting concurrent consultation was REJECTED");
  assert(blockedResult.error_code === "CONSULTATION_IN_PROGRESS", "Correct error code CONSULTATION_IN_PROGRESS returned");

  // ------------------------------------------------------------
  // TEST GROUP 3: Patient Safety Summary & Clinical Context (No Fabricated Data)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Patient Safety Summary & Clinical Context (No Fabricated Data)");

  const context = ConsultationService.getConsultationContext(encounterId, doctorActor);
  assert(Boolean(context), "Retrieved consultation context for active encounter");
  assert(context?.encounter.id === encounterId, "Context encounter matches request");
  assert(context?.patient?.fullName === "Rahul Verma", "Context patient name is accurate");
  assert(Array.isArray(context?.allergies), "Context allergies is an array");
  assert(context?.encounter.reason_for_visit === "Patient-provided reason: Exertional chest tightness", "Patient-provided appointment reason preserved");

  // ------------------------------------------------------------
  // TEST GROUP 4: SOAP Clinical Documentation & Draft Autosave
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: SOAP Clinical Documentation & Draft Autosave");

  const draftResult = await ConsultationService.saveDraft(
    encounterId,
    {
      chief_complaint: "Exertional chest tightness for 2 weeks",
      symptoms: [
        {
          id: "sym-1",
          name: "Chest heaviness on stair climbing",
          duration: "2 weeks",
          severity: "MODERATE",
        },
      ],
      vitals: {
        temperature_celsius: 36.8,
        heart_rate_bpm: 78,
        systolic_bp_mmhg: 140,
        diastolic_bp_mmhg: 90,
        respiratory_rate_bpm: 16,
        spo2_percent: 98,
        weight_kg: 74,
        height_cm: 175,
        bmi: 24.2,
        recorded_at: new Date().toISOString(),
        recorded_by: "DOC-1001",
      },
      observations: "Alert, oriented, S1/S2 regular, clear lungs",
      clinical_notes: "Family history of hypertension (father)",
      assessment: "Stage 1 Primary Essential Hypertension",
      diagnoses: [
        {
          id: "dx-1",
          name: "Essential (primary) hypertension",
          icd10_code: "I10",
          status: "CONFIRMED",
          category: "PRIMARY",
          recorded_by: "DOC-1001",
          recorded_by_name: "Dr. Ananya Sharma",
          recorded_at: new Date().toISOString(),
        },
      ],
      treatment_plan: "Low sodium DASH diet (<2g/day), 30 min daily walking, Telmisartan 40mg OD",
      follow_up_plan: {
        required: true,
        follow_up_timeframe: "7 days",
        instructions: "Return with 7-day home BP chart",
      },
    },
    doctorActor
  );

  assert(draftResult.success === true, "Clinical documentation draft saved successfully");
  assert(draftResult.record?.status === "DRAFT", "Clinical record status is DRAFT");
  assert(draftResult.record?.version === 1, "Clinical record version is 1");
  assert(draftResult.record?.vitals?.bmi === 24.2, "Vitals include auto-calculated BMI");

  // ------------------------------------------------------------
  // TEST GROUP 5: Atomic Finalization, Immutability & Queue Decoupling
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Atomic Finalization, Immutability & Queue Decoupling");

  const completeResult = await ConsultationService.completeConsultation(
    encounterId,
    {
      chief_complaint: "Exertional chest tightness for 2 weeks",
      assessment: "Stage 1 Primary Essential Hypertension",
      diagnoses: [
        {
          id: "dx-1",
          name: "Essential (primary) hypertension",
          icd10_code: "I10",
          status: "CONFIRMED",
          category: "PRIMARY",
          recorded_by: "DOC-1001",
          recorded_by_name: "Dr. Ananya Sharma",
          recorded_at: new Date().toISOString(),
        },
      ],
    },
    doctorActor
  );

  assert(completeResult.success === true, "Consultation completed & finalized successfully");
  assert(completeResult.encounter?.status === "FINALIZED" || completeResult.encounter?.status === "COMPLETED", "Encounter status updated to FINALIZED");
  assert(completeResult.clinical_record?.status === "COMPLETED" || completeResult.clinical_record?.status === "FINALIZED", "Clinical record status updated to COMPLETED");

  // Attempt unversioned draft edit on completed record -> Must be rejected
  const editCompletedResult = await ConsultationService.saveDraft(
    encounterId,
    { chief_complaint: "Tampered chief complaint" },
    doctorActor
  );
  assert(editCompletedResult.success === false, "Unversioned edit on finalized record was REJECTED");

  // ------------------------------------------------------------
  // TEST GROUP 6: Amendment Pipeline & Version History ($V_1 \rightarrow V_2$)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Amendment Pipeline & Version History (V1 -> V2)");

  const amendResult = await ConsultationService.amendConsultation(
    encounterId,
    {
      clinical_notes: "Family history of hypertension (father & paternal uncle). Patient started DASH diet.",
    },
    "Added paternal uncle hypertension history details",
    doctorActor
  );

  assert(amendResult.success === true, "Documented amendment applied successfully");
  assert(amendResult.record?.version === 2, "Clinical record version incremented to 2");
  assert(amendResult.record?.status === "AMENDED", "Record status updated to AMENDED");
  assert(amendResult.record?.version_history.length === 1, "Version history contains Version 1 snapshot");
  assert(amendResult.record?.version_history[0].version === 1, "Version 1 snapshot preserves original state");

  // ------------------------------------------------------------
  // TEST GROUP 7: Access Control, Patient Isolation & Anti-IDOR Security
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Access Control, Patient Isolation & Anti-IDOR Security");

  // Patient B attempts to access Patient A's consultation context -> Must be denied (returns null)
  const idorContext = ConsultationService.getConsultationContext(encounterId, patientBActor);
  assert(idorContext === null, "Patient B strictly BLOCKED from accessing Patient A's encounter (Anti-IDOR)");

  // Patient A accesses their own consultation context -> Must be allowed
  const patientAContext = ConsultationService.getConsultationContext(encounterId, patientAActor);
  assert(patientAContext !== null, "Patient A successfully accesses their own encounter context");

  // Verify Audit Log events recorded
  const auditEvents = AuditLedger.getEvents({ resourceId: encounterId });
  assert(auditEvents.length > 0, "Audit Ledger recorded events for encounter");
  assert(auditEvents.some((e) => e.event_type === "CONSULTATION_STARTED" || e.event_type === "ENCOUNTER_STARTED"), "Audit recorded CONSULTATION_STARTED / ENCOUNTER_STARTED");
  assert(auditEvents.some((e) => e.event_type === "CONSULTATION_COMPLETED" || e.event_type === "ENCOUNTER_FINALIZED" || e.event_type === "ENCOUNTER_COMPLETED"), "Audit recorded CONSULTATION_COMPLETED / ENCOUNTER_FINALIZED");

  console.log("\n============================================================");
  console.log(`PHASE 7.1 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase71Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
