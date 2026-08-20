// ============================================================
// MEDORA — PHASE 4.1 HEALTHCARE ENCOUNTER CORE TEST SUITE
// ============================================================

import { 
  getAllEncounters, 
  getPatientEncounters, 
  getDoctorEncounters, 
  getOrganizationEncounters,
  getEncounterById,
  createEncounter,
  completeEncounter,
  cancelEncounter
} from "../lib/data/encounter-store";
import { findIdentityById } from "../lib/data/identity-store";
import { getPatientAuditTimeline } from "../lib/data/audit-store";

console.log("============================================================");
console.log("MEDORA PHASE 4.1 HEALTHCARE ENCOUNTER CORE VERIFICATION");
console.log("============================================================\n");

let passed = 0;
let total = 0;

function assert(condition: boolean, description: string) {
  total++;
  if (condition) {
    console.log(`✓ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${description}`);
  }
}

// ------------------------------------------------------------
// TEST 1: Initial Encounter Store & Seeding
// ------------------------------------------------------------
console.log("--- 1. Testing Initial Encounters & Seeding ---");
const all = getAllEncounters();
assert(all.length >= 3, `Encounter store initialized with ${all.length} seeded clinical records`);

const enc1 = getEncounterById("ENC-1001");
assert(enc1 !== null && enc1.patient_id === "PAT-1001", "Found ENC-1001 belonging to PAT-1001");
assert(enc1?.status === "COMPLETED", "ENC-1001 is in COMPLETED state with ended_at timestamp");

// ------------------------------------------------------------
// TEST 2: Strict Patient Isolation
// ------------------------------------------------------------
console.log("\n--- 2. Testing Strict Patient Isolation ---");
const rahulEncounters = getPatientEncounters("PAT-1001");
const priyaEncounters = getPatientEncounters("PAT-1002");

assert(
  rahulEncounters.every((e) => e.patient_id === "PAT-1001"),
  `Patient PAT-1001 query returns exclusively PAT-1001 encounters (${rahulEncounters.length} records)`
);
assert(
  priyaEncounters.every((e) => e.patient_id === "PAT-1002"),
  `Patient PAT-1002 query returns exclusively PAT-1002 encounters (${priyaEncounters.length} records)`
);
assert(
  !rahulEncounters.some((e) => e.patient_id === "PAT-1002"),
  "Zero cross-patient leakage: PAT-1001 cannot see PAT-1002 encounters"
);

// ------------------------------------------------------------
// TEST 3: Doctor Multi-Hospital Scoping
// ------------------------------------------------------------
console.log("\n--- 3. Testing Doctor Multi-Hospital Context Scoping ---");
const docEncountersCity = getDoctorEncounters("DOC-1001", "HSP-1001");
const docEncountersClinic = getDoctorEncounters("DOC-1001", "CLN-1001");

assert(
  docEncountersCity.every((e) => e.organization_id === "HSP-1001"),
  `Doctor encounters scoped to City Hospital (HSP-1001): ${docEncountersCity.length} records`
);
assert(
  docEncountersClinic.every((e) => e.organization_id === "CLN-1001"),
  `Doctor encounters scoped to Green Care Clinic (CLN-1001): ${docEncountersClinic.length} records`
);

// Verify unaffiliated hospital encounter creation rejection
const unaffiliatedRes = createEncounter({
  patientId: "PAT-1001",
  providerId: "DOC-1001",
  organizationId: "HSP-9999", // Doctor has no affiliation here
  encounterType: "CONSULTATION",
  reasonForVisit: "Unauthorized hospital attempt",
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});
assert(unaffiliatedRes.success === false, "Encounter creation at unaffiliated hospital correctly REJECTED");

// ------------------------------------------------------------
// TEST 4: Encounter Creation Lifecycle
// ------------------------------------------------------------
console.log("\n--- 4. Testing Encounter Creation Lifecycle & Idempotency ---");
const createRes = createEncounter({
  patientId: "PAT-1001",
  providerId: "DOC-1001",
  organizationId: "HSP-1001",
  departmentName: "Cardiology OPD",
  encounterType: "CONSULTATION",
  reasonForVisit: "Follow-up evaluation for blood pressure stability",
  location: "OPD Suite 102",
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});

assert(createRes.success === true && !!createRes.encounter, `Successfully created new active encounter: ${createRes.encounter?.id}`);
assert(createRes.encounter?.status === "ACTIVE", "New encounter status is ACTIVE");
assert(!!createRes.encounter?.started_at, "New encounter has valid ISO started_at timestamp");

// Test Double-Click Idempotency (Immediate duplicate call within debounce window)
const doubleClickRes = createEncounter({
  patientId: "PAT-1001",
  providerId: "DOC-1001",
  organizationId: "HSP-1001",
  encounterType: "CONSULTATION",
  reasonForVisit: "Duplicate rapid submission",
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});
assert(doubleClickRes.success === false, "Rapid duplicate/double-click encounter submission blocked");

// ------------------------------------------------------------
// TEST 5: Encounter Completion & Immutability Protection
// ------------------------------------------------------------
console.log("\n--- 5. Testing Encounter Completion & Protection ---");
if (createRes.encounter) {
  const completeRes = completeEncounter(
    createRes.encounter.id,
    "DOC-1001",
    "Dr. Ananya Sharma",
    "doctor"
  );
  assert(completeRes.success === true, `Completed active encounter ${createRes.encounter.id}`);
  assert(completeRes.encounter?.status === "COMPLETED", "Status transitioned to COMPLETED");
  assert(!!completeRes.encounter?.ended_at, "Encounter ended_at timestamp recorded");

  // Attempt to complete an already completed encounter
  const reCompleteRes = completeEncounter(
    createRes.encounter.id,
    "DOC-1001",
    "Dr. Ananya Sharma",
    "doctor"
  );
  assert(reCompleteRes.success === false, "Cannot re-complete an already completed encounter");

  // Attempt to cancel a completed encounter
  const cancelCompletedRes = cancelEncounter(
    createRes.encounter.id,
    "Patient requested cancellation",
    "DOC-1001",
    "Dr. Ananya Sharma",
    "doctor"
  );
  assert(cancelCompletedRes.success === false, "Cannot cancel a completed clinical encounter (historical record protected)");
}

// ------------------------------------------------------------
// TEST 6: Append-Only Audit Trail for Encounters
// ------------------------------------------------------------
console.log("\n--- 6. Testing Append-Only Audit Trail Integration ---");
const auditEvents = getPatientAuditTimeline("PAT-1001");
const encounterEvents = auditEvents.filter((e) => 
  e.event_type === "ENCOUNTER_STARTED" || e.event_type === "ENCOUNTER_COMPLETED"
);
assert(encounterEvents.length >= 2, `Audit ledger recorded ${encounterEvents.length} verifiable encounter events`);
assert(encounterEvents.every((e) => !e.metadata?.userPassword && !e.metadata?.otpCode), "Zero credential data in encounter audit logs");

console.log(`\n============================================================`);
console.log(`Phase 4.1 Verification Summary: ${passed}/${total} assertions PASSED.`);
console.log(`============================================================`);

if (passed === total) {
  console.log("ALL PHASE 4.1 HEALTHCARE ENCOUNTER REQUIREMENTS SATISFIED.\n");
} else {
  process.exit(1);
}
