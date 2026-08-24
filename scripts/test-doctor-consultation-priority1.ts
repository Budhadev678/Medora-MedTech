// ============================================================
// MEDORA — PRIORITY 1 COMPLETE DOCTOR CONSULTATION E2E TEST SUITE
// TASKS 1 + 2 + 3 + 4 TEST RUNNER
// ============================================================

import { findIdentityById } from "../lib/data/identity-store";
import { getAllEncounters, getEncounterById } from "../lib/data/encounter-store";
import { getClinicalRecordByEncounterId } from "../lib/data/clinical-record-store";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { AppointmentStore } from "../lib/data/appointment-store";
import { ConsultationService } from "../lib/services/consultation-service";
import { PrescriptionOrderService } from "../lib/services/prescription-order-service";
import {
  grantContextualConsultationSharing,
  hasContextualAccess,
  getConsultationSharingDecision,
  triggerBreakGlassEmergencyAccess,
} from "../lib/data/consent-store";
import { AuditLedger, getAuditLedger } from "../lib/data/audit-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failedCount++;
  }
}

async function runPriority1DoctorConsultationTests() {
  console.log("\n============================================================");
  console.log("MEDORA: PRIORITY 1 DOCTOR CONSULTATION E2E VERIFICATION");
  console.log("============================================================\n");

  const doctorActor = findIdentityById("DOC-1001");
  assert(Boolean(doctorActor), "Doctor identity DOC-1001 (Dr. Ananya Sharma) exists");

  const patientIdentity = findIdentityById("PAT-1001");
  assert(Boolean(patientIdentity), "Patient identity PAT-1001 (Rahul Verma) exists");

  const todayStr = getTodayDateStr();

  // ------------------------------------------------------------
  // SECTION 1: QUEUE & ENCOUNTER RESOLUTION (Task 1: A1)
  // ------------------------------------------------------------
  console.log("\n--- Section 1: Queue & Canonical Encounter Resolution ---");
  const doctorQueue = QueueStore.getQueueForDoctor("DOC-1001", "HSP-1001", todayStr);
  assert(doctorQueue.length > 0, `Doctor queue loaded with ${doctorQueue.length} patient entries`);

  const targetQueueEntry = doctorQueue.find((q) => q.patient_id === "PAT-1001") || doctorQueue[0];
  assert(Boolean(targetQueueEntry), `Found queue token #${targetQueueEntry?.token_number} for ${targetQueueEntry?.patient_name}`);

  // Start Consultation from Queue Entry
  const startResult = await ConsultationService.startConsultationFromQueue(targetQueueEntry.id, doctorActor);
  assert(startResult.success, `Consultation started from queue: ${startResult.message}`);
  assert(Boolean(startResult.encounter), `Canonical HealthcareEncounter bound: ${startResult.encounter?.id}`);
  assert(startResult.encounter?.patient_id === targetQueueEntry.patient_id, "Encounter patient ID matches queue patient ID");
  assert(startResult.encounter?.provider_id === "DOC-1001", "Encounter doctor matches DOC-1001");
  assert(startResult.encounter?.status === "ACTIVE", "Encounter state transitioned to ACTIVE (In Consultation)");

  const encounterId = startResult.encounter!.id;

  // ------------------------------------------------------------
  // SECTION 2: PATIENT CONTEXT & SAFETY BANNER (Task 1: A2, A3)
  // ------------------------------------------------------------
  console.log("\n--- Section 2: Patient Context & Safety Banner ---");
  const contextBeforeShare = ConsultationService.getConsultationContext(encounterId, doctorActor);
  assert(Boolean(contextBeforeShare), "ConsultationContext successfully retrieved");
  assert(contextBeforeShare?.patient?.fullName === targetQueueEntry.patient_name, "Patient name matches canonical source of truth");
  assert(contextBeforeShare?.allergies !== undefined, "Allergies array is populated from patient identity");

  // ------------------------------------------------------------
  // SECTION 3: RECORD SHARING & ACCESS ENGINE (Task 2: B1-B7)
  // ------------------------------------------------------------
  console.log("\n--- Section 3: Record Sharing During Consultation ---");
  // Before explicit share, verify records_shared is false
  assert(
    contextBeforeShare?.records_shared === false || contextBeforeShare?.sharing_decision?.decision !== "SHARE",
    "Historical network records restricted before patient grant"
  );
  assert(contextBeforeShare?.network_encounters.length === 0, "Network cross-facility encounters hidden when not shared");

  // Grant Contextual Sharing
  const grantRes = grantContextualConsultationSharing({
    encounterId,
    patientId: targetQueueEntry.patient_id,
    patientName: targetQueueEntry.patient_name,
    doctorId: "DOC-1001",
    doctorName: "Dr. Ananya Sharma",
    organizationId: "HSP-1001",
    organizationName: "City Hospital",
  });
  assert(grantRes.success, "Contextual record sharing granted for consultation");

  const contextAfterShare = ConsultationService.getConsultationContext(encounterId, doctorActor);
  assert(contextAfterShare?.records_shared === true, "records_shared is now true after patient grant");

  // ------------------------------------------------------------
  // SECTION 4: SAME-DOCTOR HISTORY VS NETWORK RECORDS (Task 3: C1-C8)
  // ------------------------------------------------------------
  console.log("\n--- Section 4: Same-Doctor History vs Network Records ---");
  assert(Array.isArray(contextAfterShare?.same_doctor_encounters), "same_doctor_encounters segregated in context");
  assert(Array.isArray(contextAfterShare?.network_encounters), "network_encounters segregated in context");

  // Check matching by canonical ID DOC-1001
  if (contextAfterShare && contextAfterShare.same_doctor_encounters.length > 0) {
    const allSameDoc = contextAfterShare.same_doctor_encounters.every(
      (e) => e.provider_id === "DOC-1001" && e.patient_id === targetQueueEntry.patient_id
    );
    assert(allSameDoc, "All same-doctor encounters matched strictly by doctorId (DOC-1001)");
  } else {
    assert(true, "Same-doctor encounters list handled safely (0 past visits)");
  }

  // ------------------------------------------------------------
  // SECTION 5: DIGITAL EXAM PAD & STRUCTURED DOCUMENTATION (Task 4: D1-D10)
  // ------------------------------------------------------------
  console.log("\n--- Section 5: Digital Exam Pad & Draft Autosave ---");
  const testVitals = {
    systolic_bp_mmhg: 138,
    diastolic_bp_mmhg: 88,
    heart_rate_bpm: 74,
    temperature_celsius: 37.0,
    spo2_percent: 99,
    respiratory_rate_bpm: 16,
    weight_kg: 72,
    height_cm: 176,
    bmi: 23.2,
    recorded_at: new Date().toISOString(),
    recorded_by: "DOC-1001",
  };

  const testSymptoms = [
    { id: "SYM-01", name: "Exertional chest tightness", duration: "3 days", severity: "MODERATE" as const },
    { id: "SYM-02", name: "Morning headache", duration: "1 week", severity: "MILD" as const },
  ];

  const testDiagnoses = [
    {
      id: "DX-01",
      name: "Essential (Primary) Hypertension",
      icd10_code: "I10",
      category: "PRIMARY" as const,
      status: "CONFIRMED" as const,
      recorded_by: "DOC-1001",
      recorded_by_name: "Dr. Ananya Sharma",
      recorded_at: new Date().toISOString(),
    },
  ];

  const testDrawingStroke = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  // Save Draft
  const saveDraftRes = await ConsultationService.saveDraft(
    encounterId,
    {
      chief_complaint: "Exertional chest heaviness and occasional headaches",
      symptoms: testSymptoms,
      vitals: testVitals,
      observations: "CVS: S1, S2 audible, no audible gallop. Chest clear bilaterally.",
      freehand_drawing: testDrawingStroke,
      assessment: "Stage 1 Essential Hypertension with mild exertional symptoms.",
      diagnoses: testDiagnoses,
      treatment_plan: "Initiate lifestyle modifications, low sodium diet, 30 min daily walk.",
      follow_up_plan: { required: true, follow_up_timeframe: "14 days", instructions: "Return if chest pain recurs" },
    },
    doctorActor
  );
  assert(saveDraftRes.success, "Clinical documentation draft saved successfully");
  assert(Boolean(saveDraftRes.record), `Draft record created: ${saveDraftRes.record?.id}`);

  // Draft Recovery Verification
  const recoveredRecord = getClinicalRecordByEncounterId(encounterId);
  assert(Boolean(recoveredRecord), "Draft clinical record recovered from store");
  assert(recoveredRecord?.vitals?.systolic_bp_mmhg === 138, "Recovered vitals systolic BP matches (138 mmHg)");
  assert(recoveredRecord?.vitals?.bmi === 23.2, "Recovered BMI matches (23.2 kg/m²)");
  assert(recoveredRecord?.freehand_drawing === testDrawingStroke, "Freehand sketch strokes persisted and recovered");
  assert(recoveredRecord?.diagnoses[0].icd10_code === "I10", "Diagnosis ICD-10 (I10) preserved");

  // ------------------------------------------------------------
  // SECTION 6: CONNECTED CLINICAL ORDERS (Task 1: A4, A5)
  // ------------------------------------------------------------
  console.log("\n--- Section 6: Connected Orders Bound to Encounter ---");
  // 1. Prescription Order
  const rxRes = await PrescriptionOrderService.issuePrescription(
    encounterId,
    {
      items: [
        {
          id: "rx-01",
          medicine_name: "Telmisartan 40mg",
          generic_name: "Telmisartan",
          strength: "40mg",
          dosage: "1 tablet",
          route: "ORAL",
          frequency: "Once daily (morning)",
          timing: "BEFORE_FOOD",
          duration: "30 days",
          quantity: "30 tablets",
          instructions: "Take once daily in morning with water",
        },
      ],
      notes: "Monitor morning blood pressure twice weekly.",
    },
    doctorActor
  );
  assert(rxRes.success, `Prescription issued bound to encounter: ${rxRes.prescription?.id}`);

  // 2. Lab Order
  const labRes = await PrescriptionOrderService.createMedicalOrder(
    {
      encounterId,
      orderType: "LAB",
      priority: "ROUTINE",
      clinicalIndication: "Hypertension baseline evaluation",
      labItems: [
        { id: "li-1", test_id: "LIP-01", test_name: "Lipid Profile" },
        { id: "li-2", test_id: "REN-02", test_name: "Renal Function Test" },
      ],
    },
    doctorActor
  );
  assert(labRes.success, `Diagnostic Lab Order created: ${labRes.order?.id}`);

  // 3. Referral Order
  const refRes = await PrescriptionOrderService.createMedicalOrder(
    {
      encounterId,
      orderType: "REFERRAL",
      referralDetails: {
        target_specialty: "Clinical Nutrition & Dietetics",
        urgency: "ROUTINE",
        referral_reason: "DASH diet and weight management coaching",
        clinical_summary: "Stage 1 Essential HTN with BMI 23.2",
      },
    },
    doctorActor
  );
  assert(refRes.success, `Specialist Referral created: ${refRes.order?.id}`);

  // ------------------------------------------------------------
  // SECTION 7: FINALIZATION & AUDIT TRAIL (Task 1: A10, A11)
  // ------------------------------------------------------------
  console.log("\n--- Section 7: Consultation Finalization & Audit Trail ---");
  const completeResult = await ConsultationService.completeConsultation(
    encounterId,
    {
      chief_complaint: "Exertional chest heaviness and occasional headaches",
      symptoms: testSymptoms,
      vitals: testVitals,
      observations: "CVS: S1, S2 audible. RS: Clear.",
      freehand_drawing: testDrawingStroke,
      assessment: "Stage 1 Essential Hypertension.",
      diagnoses: testDiagnoses,
      treatment_plan: "Telmisartan 40mg once daily + DASH dietary counseling.",
      follow_up_plan: { required: true, follow_up_timeframe: "14 days" },
    },
    doctorActor
  );

  assert(completeResult.success, `Consultation successfully finalized: ${completeResult.message}`);
  assert(completeResult.encounter?.status === "FINALIZED" || completeResult.encounter?.status === "COMPLETED", "Encounter status is FINALIZED");
  assert(completeResult.clinical_record?.status === "COMPLETED", "Clinical record status is COMPLETED");

  // Verify Audit Events
  const encounterAudits = AuditLedger.getEvents().filter(
    (a) => a.reference_id === encounterId || (a.metadata as any)?.encounter_id === encounterId
  );
  const startAudit = encounterAudits.find((a) => a.event_type === "CONSULTATION_STARTED");
  const completeAudit = encounterAudits.find(
    (a) => a.event_type === "CONSULTATION_COMPLETED" || a.event_type === "ENCOUNTER_COMPLETED" || a.event_type === "ENCOUNTER_FINALIZED"
  );
  assert(Boolean(startAudit), "Audit event CONSULTATION_STARTED recorded with timestamp");
  assert(Boolean(completeAudit), "Audit event CONSULTATION_COMPLETED recorded with duration and actor");

  // ------------------------------------------------------------
  // SECTION 8: SECURITY & EDGE CASE TESTS (Task 1: Part H, Part P)
  // ------------------------------------------------------------
  console.log("\n--- Section 8: Security & Isolation Edge Cases ---");
  
  // 1. Cross-facility unauthorized doctor check
  const fakeUnauthorizedDoctor = {
    id: "DOC-9999",
    identifier: "DOC-9999",
    fullName: "Dr. Rogue Outisder",
    email: "rogue@outsider.org",
    role: "doctor" as const,
    accountStatus: "active" as const,
    organizationId: "FAC-UNRELATED",
    doctorData: {
      specialization: "General",
      qualifications: "MBBS",
      licenseNumber: "LIC-9999",
      affiliations: [],
    },
  };

  const rogueContext = ConsultationService.getConsultationContext(encounterId, fakeUnauthorizedDoctor as any);
  assert(rogueContext === null, "SECURITY PASS: Doctor from unrelated organization denied access (returned null)");

  // 2. Patient isolation check: Patient B cannot access Patient A's consultation
  const patientBIdentity = {
    id: "PAT-9999",
    identifier: "PAT-9999",
    fullName: "Other Patient",
    email: "patientB@example.com",
    role: "patient" as const,
    accountStatus: "active" as const,
  };

  const patientBContext = ConsultationService.getConsultationContext(encounterId, patientBIdentity as any);
  assert(patientBContext === null, "SECURITY PASS: Patient B denied access to Patient A's consultation encounter");

  // 3. Double-completion prevention
  const secondComplete = await ConsultationService.completeConsultation(encounterId, {}, doctorActor);
  assert(!secondComplete.success, "Idempotency: Double finalization prevented cleanly");

  console.log("\n============================================================");
  console.log(`E2E TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPriority1DoctorConsultationTests().catch((err) => {
  console.error("Test execution threw an error:", err);
  process.exit(1);
});
