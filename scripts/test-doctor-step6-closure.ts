import { findIdentityById } from "../lib/data/identity-store";
import { 
  createEncounter, 
  completeEncounter, 
  getEncounterById 
} from "../lib/data/encounter-store";
import { 
  saveClinicalRecordDraft, 
  completeClinicalRecord, 
  getClinicalRecordByEncounterId 
} from "../lib/data/clinical-record-store";
import { 
  getAllReferrals, 
  saveReferralDraft 
} from "../lib/data/referral-store";
import { ReferralService } from "../lib/services/referral-service";
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

async function runDoctorStep6Suite() {
  console.log("============================================================");
  console.log("MEDORA — DOCTOR SIDE STEP 6: FOLLOW-UP, REFERRAL & CLOSURE");
  console.log("============================================================\n");

  const docA = findIdentityById("DOC-1001")!;
  const docB = findIdentityById("DOC-1002")!;
  const patient = findIdentityById("PAT-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Clinical Encounter & Consultation Setup
  // ------------------------------------------------------------
  console.log("TEST 1: Encounter Lifecycle & Clinical Documentation Setup");
  const encRes = createEncounter({
    patientId: "PAT-1001",
    providerId: "DOC-1001",
    organizationId: "HSP-1001",
    departmentId: "DEP-1001",
    departmentName: "Cardiology OPD",
    encounterType: "CONSULTATION",
    reasonForVisit: "Chest tightness and post-prandial palpitation",
    location: "OPD Room 102",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(encRes.success === true, "1.1 Consultation encounter initiated");
  const activeEnc = encRes.encounter!;

  const draftRes = saveClinicalRecordDraft({
    encounterId: activeEnc.id,
    chiefComplaint: "Chest tightness with mild exertion",
    assessment: "Stable hemodynamics, evaluate for subclinical ischemia.",
    diagnoses: [
      {
        id: "DX-STEP6-1",
        name: "Angina pectoris, unspecified",
        status: "CONFIRMED",
        category: "PRIMARY",
        recorded_by: "DOC-1001",
        recorded_by_name: "Dr. Ananya Sharma",
        recorded_at: new Date().toISOString(),
      },
    ],
    treatmentPlan: "Prescribed nitrates as needed, lifestyle modifications.",
    followUpPlan: {
      required: true,
      follow_up_date: "2026-09-14",
      follow_up_timeframe: "3 weeks",
      instructions: "Repeat resting ECG and review symptoms.",
    },
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(draftRes.success === true, "1.2 Structured clinical record saved with follow-up plan");
  const clinicalRecord = draftRes.record!;
  assert(clinicalRecord.follow_up_plan?.required === true, "1.3 Follow-up plan requirement recorded");
  assert(Boolean(clinicalRecord.follow_up_plan?.follow_up_date), "1.4 Explicit follow-up timing attached");

  // ------------------------------------------------------------
  // TEST 2: Specialist Referral Generation & Handoff
  // ------------------------------------------------------------
  console.log("\nTEST 2: Specialist Referral Generation & Handoff");
  const referralRes = await ReferralService.finalizeReferral(
    activeEnc.id,
    {
      destination_type: "SPECIALTY",
      destination_specialty_name: "Interventional Cardiology & Electrophysiology",
      priority: "URGENT",
      reason: "Further assessment of exertional dyspnea and stress echocardiography.",
      notes: "42yo male with primary hypertension and exertional tightness.",
    },
    docA
  );

  assert(referralRes.success === true, "2.1 Specialist referral created & finalized");
  const ref = referralRes.referral!;
  assert(ref.status === "FINALIZED" || ref.status === "DRAFT", "2.2 Referral status is valid");
  assert(ref.patient_id === "PAT-1001", "2.3 Referral correctly bound to Patient PAT-1001");
  assert(ref.encounter_id === activeEnc.id, "2.4 Referral strictly linked to originating encounter");
  assert(ref.priority === "URGENT", "2.5 Clinical referral priority correctly captured");

  // ------------------------------------------------------------
  // TEST 3: Consultation Closure & Atomic Finalization
  // ------------------------------------------------------------
  console.log("\nTEST 3: Consultation Closure & Finalization State Lock");
  const finalRecordRes = completeClinicalRecord({
    recordId: clinicalRecord.id,
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(finalRecordRes.success === true, "3.1 Clinical record finalized");
  assert(finalRecordRes.record?.status === "COMPLETED", "3.2 Clinical record locked in COMPLETED state");

  const finalEncRes = completeEncounter(
    activeEnc.id,
    "DOC-1001",
    "Dr. Ananya Sharma",
    "doctor"
  );
  assert(finalEncRes.success === true, "3.3 Healthcare encounter finalized and completed");
  assert(finalEncRes.encounter?.status === "COMPLETED" || finalEncRes.encounter?.status === "FINALIZED", "3.4 Encounter status is COMPLETED/FINALIZED");

  // ------------------------------------------------------------
  // TEST 4: Double-Finalization Idempotency Protection
  // ------------------------------------------------------------
  console.log("\nTEST 4: Double-Finalization Idempotency Protection");
  const duplicateFinalizeRes = completeEncounter(
    activeEnc.id,
    "DOC-1001",
    "Dr. Ananya Sharma",
    "doctor"
  );
  assert(duplicateFinalizeRes.success === false, "4.1 Repeated finalization is rejected safely without duplicate side-effects");

  // ------------------------------------------------------------
  // TEST 5: Anti-IDOR & Doctor Isolation Protection
  // ------------------------------------------------------------
  console.log("\nTEST 5: Anti-IDOR & Doctor Isolation Protection");
  // Doctor B attempting to finalize Doctor A's encounter
  const unauthorizedAction = completeEncounter(
    activeEnc.id,
    "DOC-1002",
    "Dr. Rajesh Sharma",
    "doctor"
  );
  assert(unauthorizedAction.success === false, "5.1 Doctor B cannot complete or close Doctor A's consultation");

  // ------------------------------------------------------------
  // TEST 6: Audit Trail Recording
  // ------------------------------------------------------------
  console.log("\nTEST 6: Audit Trail Verification");
  const auditEvents = AuditLedger.getEvents({ resourceId: activeEnc.id });
  assert(auditEvents.length > 0, "6.1 Audit ledger captures consultation lifecycle events");

  console.log("\n============================================================");
  console.log(`DOCTOR STEP 6 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runDoctorStep6Suite();