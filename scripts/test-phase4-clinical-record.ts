// ============================================================
// MEDORA â€” PHASE 4.2 CLINICAL RECORD CORE TEST SUITE
// ============================================================

import { 
  getAllClinicalRecords, 
  getClinicalRecordById, 
  getClinicalRecordByEncounterId,
  getPatientClinicalRecords,
  getDoctorClinicalRecords,
  getOrganizationClinicalRecords,
  saveClinicalRecordDraft,
  completeClinicalRecord,
  amendClinicalRecord
} from "../lib/data/clinical-record-store";
import { getEncounterById, cancelEncounter } from "../lib/data/encounter-store";
import { getPatientAuditTimeline } from "../lib/data/audit-store";

console.log("============================================================");
console.log("MEDORA PHASE 4.2 CLINICAL RECORD CORE VERIFICATION");
console.log("============================================================\n");

let passed = 0;
let total = 0;

function assert(condition: boolean, description: string) {
  total++;
  if (condition) {
    console.log(`âœ“ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`âœ— [FAIL] ${description}`);
  }
}

// ------------------------------------------------------------
// TEST 1: Initial Clinical Record Store & Seed Records
// ------------------------------------------------------------
console.log("--- 1. Testing Clinical Record Store & Seed Data ---");
const all = getAllClinicalRecords();
assert(all.length >= 3, `Clinical record store initialized with ${all.length} seeded records`);

const cr1 = getClinicalRecordById("CR-1001");
assert(cr1 !== null && cr1.encounter_id === "ENC-1001", "Found CR-1001 attached to parent encounter ENC-1001");
assert(cr1?.patient_id === "PAT-1001", "CR-1001 strictly belongs to patient PAT-1001");
assert(cr1?.status === "COMPLETED", "CR-1001 is in COMPLETED state");
assert(Array.isArray(cr1?.symptoms) && cr1!.symptoms.length >= 2, `CR-1001 contains ${cr1?.symptoms.length} structured symptoms`);
assert(!!cr1?.vitals && cr1!.vitals.systolic_bp_mmhg === 142, "CR-1001 contains structured vitals (BP 142/92 mmHg)");
assert(Array.isArray(cr1?.diagnoses) && cr1!.diagnoses[0].name.includes("hypertension"), "CR-1001 contains clinician-entered diagnosis (ICD-10 I10)");

// ------------------------------------------------------------
// TEST 2: Strict Encounter â†” Patient Hierarchy & Isolation
// ------------------------------------------------------------
console.log("\n--- 2. Testing Strict Hierarchy & Patient Isolation ---");
const enc1 = getEncounterById("ENC-1001");
assert(cr1?.patient_id === enc1?.patient_id, "Clinical Record patient_id matches parent Encounter patient_id (PAT-1001)");

const rahulRecords = getPatientClinicalRecords("PAT-1001", false);
const priyaRecords = getPatientClinicalRecords("PAT-1002", false);

assert(
  rahulRecords.every((r) => r.patient_id === "PAT-1001" && r.status !== "DRAFT"),
  `Patient PAT-1001 portal query returns exclusively finalized records (${rahulRecords.length} records)`
);
assert(
  !rahulRecords.some((r) => r.patient_id === "PAT-1002"),
  "Zero cross-patient leakage: PAT-1001 cannot see PAT-1002 clinical records"
);

// Priya's CR-1003 is currently DRAFT -> should be hidden from patient portal view
assert(priyaRecords.length === 0, "Patient PAT-1002 portal hides unfinalized DRAFT clinical records");

// ------------------------------------------------------------
// TEST 3: Doctor Scoping & Affiliation Enforcement
// ------------------------------------------------------------
console.log("\n--- 3. Testing Doctor Scoping & Affiliation Verification ---");
const docRecords = getDoctorClinicalRecords("DOC-1001", "HSP-1001");
assert(
  docRecords.every((r) => r.organization_id === "HSP-1001"),
  `Doctor records scoped to City Hospital (HSP-1001): ${docRecords.length} records`
);

// Attempt to create draft for a non-existent encounter
const orphanRes = saveClinicalRecordDraft({
  encounterId: "ENC-9999",
  chiefComplaint: "Orphan record attempt",
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});
assert(orphanRes.success === false, "Creating clinical record for non-existent encounter correctly REJECTED");

// ------------------------------------------------------------
// TEST 4: Clinical Record Draft Lifecycle & Validation
// ------------------------------------------------------------
console.log("\n--- 4. Testing Clinical Record Draft Lifecycle ---");
// Create a new draft on ENC-1003 (Priya's active encounter)
const draftRes = saveClinicalRecordDraft({
  encounterId: "ENC-1003",
  chiefComplaint: "Severe throbbing migraine and persistent nausea",
  symptoms: [
    { id: "SYM-1", name: "Unilateral throbbing headache", duration: "3 days", severity: "SEVERE" },
    { id: "SYM-2", name: "Nausea & photophobia", duration: "2 days", severity: "MODERATE" },
  ],
  vitals: {
    temperature_celsius: 37.1,
    heart_rate_bpm: 84,
    systolic_bp_mmhg: 122,
    diastolic_bp_mmhg: 78,
    spo2_percent: 99,
    recorded_at: new Date().toISOString(),
    recorded_by: "DOC-1001",
  },
  assessment: "Acute migraine with nausea. Low neurological risk.",
  diagnoses: [
    {
      id: "DX-1",
      name: "Migraine without aura",
      icd10_code: "G43.0",
      status: "CONFIRMED",
      category: "PRIMARY",
      recorded_by: "DOC-1001",
      recorded_by_name: "Dr. Ananya Sharma",
      recorded_at: new Date().toISOString(),
    },
  ],
  treatmentPlan: "Dark room rest, hydration, Sumatriptan 50mg SOS at onset.",
  followUpPlan: {
    required: true,
    follow_up_timeframe: "5 days",
    instructions: "Review if headaches do not subside.",
  },
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});

assert(draftRes.success === true && !!draftRes.record, "Saved draft clinical record for ENC-1003");
assert(draftRes.record?.status === "DRAFT", "Draft record status is DRAFT");
assert(draftRes.record?.symptoms.length === 2, "Structured symptoms saved correctly");

// ------------------------------------------------------------
// TEST 5: Record Completion & Protection Against Silent Overwrites
// ------------------------------------------------------------
console.log("\n--- 5. Testing Completion & Protection ---");
if (draftRes.record) {
  const completeRes = completeClinicalRecord({
    recordId: draftRes.record.id,
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(completeRes.success === true, `Completed clinical record ${draftRes.record.id}`);
  assert(completeRes.record?.status === "COMPLETED", "Record transitioned to COMPLETED");
  assert(!!completeRes.record?.completed_at, "completed_at timestamp recorded");

  // Verify that completed record is now visible in patient portal
  const priyaVisible = getPatientClinicalRecords("PAT-1002", false);
  assert(priyaVisible.length >= 1, "Completed clinical record is now published to patient medical records");

  // Attempt silent overwrite via saveDraft on completed record
  const silentOverwriteRes = saveClinicalRecordDraft({
    encounterId: "ENC-1003",
    chiefComplaint: "Silent overwrite attempt",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(silentOverwriteRes.success === false, "Silent modification of COMPLETED record blocked (requires amendment)");
}

// ------------------------------------------------------------
// TEST 6: Documented Clinical Amendment & Version History
// ------------------------------------------------------------
console.log("\n--- 6. Testing Amendment & Version History ---");
if (draftRes.record) {
  const amendRes = amendClinicalRecord({
    recordId: draftRes.record.id,
    amendmentReason: "Corrected diagnosis notes and adjusted follow-up instructions to 7 days.",
    treatmentPlan: "Dark room rest, hydration, Sumatriptan 50mg SOS at onset. Maintain headache diary.",
    followUpPlan: {
      required: true,
      follow_up_timeframe: "7 days",
      instructions: "Review with 7-day headache frequency log.",
    },
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(amendRes.success === true, "Amended clinical record with documented reason");
  assert(amendRes.record?.status === "AMENDED", "Record transitioned to AMENDED");
  assert(amendRes.record?.version === 2, "Record version bumped to 2");
  assert(amendRes.record?.version_history.length === 1, "Previous version preserved in version_history snapshot");
  assert(amendRes.record?.version_history[0].version === 1, "Version 1 snapshot retained original state");
}

// ------------------------------------------------------------
// TEST 7: Append-Only Security & Privacy Audit Trail
// ------------------------------------------------------------
console.log("\n--- 7. Testing Audit Trail Integration ---");
const auditEvents = getPatientAuditTimeline("PAT-1002");
const clinicalEvents = auditEvents.filter((e) =>
  e.event_type === "CLINICAL_RECORD_CREATED" ||
  e.event_type === "CLINICAL_RECORD_COMPLETED" ||
  e.event_type === "CLINICAL_RECORD_AMENDED"
);

assert(clinicalEvents.length >= 2, `Audit ledger recorded ${clinicalEvents.length} verifiable clinical record events`);
assert(
  clinicalEvents.every((e) => !e.metadata?.userPassword && !e.metadata?.otpCode),
  "Zero sensitive credential data in clinical audit logs"
);

console.log(`\n============================================================`);
console.log(`Phase 4.2 Verification Summary: ${passed}/${total} assertions PASSED.`);
console.log(`============================================================`);

if (passed === total) {
  console.log("ALL PHASE 4.2 CLINICAL RECORD CORE REQUIREMENTS SATISFIED.\n");
} else {
  process.exit(1);
}
