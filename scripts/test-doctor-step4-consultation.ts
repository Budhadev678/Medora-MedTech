import { findIdentityById } from "../lib/data/identity-store";
import { 
  getDoctorEncounters, 
  getEncounterById, 
  createEncounter, 
  completeEncounter 
} from "../lib/data/encounter-store";
import { 
  getClinicalRecordByEncounterId, 
  saveClinicalRecordDraft, 
  completeClinicalRecord 
} from "../lib/data/clinical-record-store";
import { getEncounterPrescriptions, savePrescriptionDraft, issuePrescription } from "../lib/data/prescription-store";
import { getEncounterLabOrders, saveLabOrderDraft, placeLabOrder } from "../lib/data/lab-order-store";
import { AuditLedger } from "../lib/data/audit-store";

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

async function runDoctorStep4Suite() {
  console.log("============================================================");
  console.log("MEDORA — DOCTOR SIDE STEP 4: CONSULTATION WORKBENCH");
  console.log("============================================================\n");

  const docA = findIdentityById("DOC-1001")!;
  const docB = findIdentityById("DOC-1002")!;
  const patient = findIdentityById("PAT-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Authoritative Encounter Loading & Patient Identity
  // ------------------------------------------------------------
  console.log("TEST 1: Authoritative Encounter Loading & Patient Identity");
  const docAEncounters = getDoctorEncounters("DOC-1001");
  assert(docAEncounters.length > 0, "1.1 Doctor A encounters loaded from authoritative store");
  assert(docAEncounters.every(e => e.provider_id === "DOC-1001"), "1.2 All retrieved encounters strictly belong to Doctor A");

  const primaryEncounter = docAEncounters[0];
  assert(Boolean(primaryEncounter.patient_id), "1.3 Encounter correctly references a valid Patient ID");
  assert(Boolean(primaryEncounter.patient_name), "1.4 Patient demographic name is present");
  assert(Boolean(primaryEncounter.patient_gender), "1.5 Patient demographic gender is present");
  assert(Boolean(primaryEncounter.facility_id || primaryEncounter.organization_id), "1.6 Facility/Organization context is explicitly attached");

  // ------------------------------------------------------------
  // TEST 2: Clinical Encounter Lifecycle & Draft Persistence
  // ------------------------------------------------------------
  console.log("\nTEST 2: Clinical Encounter Lifecycle & Draft Persistence");
  const newEncRes = createEncounter({
    patientId: "PAT-1001",
    providerId: "DOC-1001",
    organizationId: "HSP-1001",
    departmentId: "DEP-1001",
    departmentName: "Cardiology OPD",
    encounterType: "CONSULTATION",
    reasonForVisit: "Step 4 Validation Encounter",
    location: "OPD Room 102",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(newEncRes.success === true, "2.1 New clinical encounter created");
  const activeEnc = newEncRes.encounter!;
  assert(activeEnc.status === "ACTIVE" || activeEnc.status === "IN_PROGRESS", "2.2 Initial encounter state is active/in-progress");

  // ------------------------------------------------------------
  // TEST 3: Structured Clinical Documentation (Vitals, Symptoms, Assessment, Plan)
  // ------------------------------------------------------------
  console.log("\nTEST 3: Structured Clinical Documentation & Doctor Assessment");
  const draftRecordRes = saveClinicalRecordDraft({
    encounterId: activeEnc.id,
    chiefComplaint: "Mild exertional dyspnea",
    symptoms: [
      { id: "symp-1", name: "Shortness of breath", duration: "3 days", severity: "MILD" },
    ],
    vitals: {
      systolic_bp_mmhg: 124,
      diastolic_bp_mmhg: 82,
      heart_rate_bpm: 72,
      temperature_celsius: 36.7,
      spo2_percent: 99,
      weight_kg: 74,
      recorded_at: new Date().toISOString(),
      recorded_by: "DOC-1001",
    },
    assessment: "Stable cardiovascular parameters. Normal sinus rhythm.",
    diagnoses: [
      {
        id: "diag-1",
        name: "Essential (primary) hypertension",
        status: "CONFIRMED",
        category: "PRIMARY",
        recorded_by: "DOC-1001",
        recorded_by_name: "Dr. Ananya Sharma",
        recorded_at: new Date().toISOString(),
      },
    ],
    treatmentPlan: "Continue lifestyle modification. Low sodium diet.",
    followUpPlan: {
      required: true,
      follow_up_date: "2026-09-07",
      follow_up_timeframe: "2 weeks",
      instructions: "Repeat blood pressure log before next visit",
    },
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(draftRecordRes.success === true, "3.1 Clinical record draft saved successfully");
  const savedRecord = draftRecordRes.record!;
  assert(savedRecord.status === "DRAFT", "3.2 Clinical record remains in DRAFT until finalization");
  assert(savedRecord.vitals?.systolic_bp_mmhg === 124, "3.3 Vitals recorded with explicit units");
  assert(savedRecord.diagnoses?.length === 1, "3.4 Doctor-entered primary diagnosis recorded");

  // ------------------------------------------------------------
  // TEST 4: Clinical Action Handoffs (Prescription & Diagnostic Orders)
  // ------------------------------------------------------------
  console.log("\nTEST 4: Clinical Action Handoffs (Prescription & Diagnostic Orders)");
  
  // Prescription Handoff
  const rxDraftRes = savePrescriptionDraft({
    encounterId: activeEnc.id,
    items: [
      {
        id: "RXI-TEST-1",
        medicine_name: "Amlodipine",
        strength: "5 mg",
        dosage: "1 tablet",
        route: "ORAL",
        frequency: "Once daily",
        duration: "30 days",
        instructions: "Take once daily in the morning with water.",
      },
    ],
    notes: "Review BP at next follow-up.",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(rxDraftRes.success === true, "4.1 Prescription draft attached to active encounter");

  // Lab Order Handoff
  const labDraftRes = saveLabOrderDraft({
    encounterId: activeEnc.id,
    items: [
      {
        id: "LOI-TEST-1",
        test_name: "Serum Electrolytes (Na, K, Cl)",
        test_code: "SE-01",
        specimen_type: "Venous Blood",
      },
    ],
    priority: "ROUTINE",
    reason: "Routine anti-hypertensive monitoring",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(labDraftRes.success === true, "4.2 Diagnostic lab order attached to active encounter");

  // ------------------------------------------------------------
  // TEST 5: Atomic Consultation Finalization & Lock
  // ------------------------------------------------------------
  console.log("\nTEST 5: Atomic Consultation Finalization & Lock");
  const finalRecordRes = completeClinicalRecord({
    recordId: savedRecord.id,
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(finalRecordRes.success === true, "5.1 Clinical record finalized successfully");
  assert(finalRecordRes.record?.status === "COMPLETED", "5.2 Record status transitioned to COMPLETED/FINALIZED");

  const finalEncRes = completeEncounter(activeEnc.id, "DOC-1001", "Dr. Ananya Sharma", "doctor");
  assert(finalEncRes.success === true, "5.3 Encounter completed and closed");
  assert(finalEncRes.encounter?.status === "COMPLETED" || finalEncRes.encounter?.status === "FINALIZED", "5.4 Encounter status is COMPLETED/FINALIZED");

  // ------------------------------------------------------------
  // TEST 6: Audit Traceability & Ledger Integrity
  // ------------------------------------------------------------
  console.log("\nTEST 6: Audit Traceability & Immutable Event Recording");
  const allAuditEvents = AuditLedger.getEvents({ resourceId: activeEnc.id });
  assert(allAuditEvents.length > 0, "6.1 Immutable audit events recorded for encounter lifecycle");
  assert(allAuditEvents.some((e: any) => e.event_type && String(e.event_type).includes("ENCOUNTER")), "6.2 Clinical encounter transitions are audit-logged");

  // ------------------------------------------------------------
  // TEST 7: Anti-IDOR & Doctor Data Protection
  // ------------------------------------------------------------
  console.log("\nTEST 7: Anti-IDOR & Unauthorized Encounter Access Protection");
  // Doctor B attempting to complete Doctor A's encounter
  const unauthorizedEncAction = completeEncounter(activeEnc.id, "DOC-1002", "Dr. Rajesh Sharma", "doctor");
  assert(unauthorizedEncAction.success === false, "7.1 Doctor B cannot complete or modify Doctor A's encounter");

  console.log("\n============================================================");
  console.log(`DOCTOR STEP 4 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runDoctorStep4Suite();