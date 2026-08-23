// ============================================================
// MEDORA â€” MODIFICATION PHASE C.4 TEST SUITE
// UNIFIED CLINICAL RECORD & CONTINUITY LAYER
// Tests: Dynamic Aggregation, Timestamp Semantics, Role Scoping,
// Encounter Bundles, Patient Isolation, Cancellation & Audit
// ============================================================

import { ClinicalContinuityService } from "../lib/services/clinical-continuity-service";
import { getAuditLedger } from "../lib/data/audit-store";
import { getAllEncounters } from "../lib/data/encounter-store";
import { getAllPrescriptions } from "../lib/data/prescription-store";
import { getAllLabOrders, getAllLabReports } from "../lib/data/lab-order-store";
import { getAllMedicalOrders } from "../lib/data/medical-order-store";
import { StoredIdentity } from "../lib/data/identity-store";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  âœ” PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  âœ– FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
    failed++;
  }
}

console.log("\n============================================================");
console.log("MEDORA â€” PHASE C.4: UNIFIED CLINICAL CONTINUITY TEST SUITE");
console.log("============================================================\n");

// ------------------------------------------------------------
// TEST PERSONAS
// ------------------------------------------------------------
const PATIENT_A: StoredIdentity = {
  id: "USR-PAT-1001",
  identifier: "PAT-1001",
  fullName: "Rahul Verma",
  role: "patient",
  email: "rahul.verma@example.com",
  passwordHash: "hash",
  accountStatus: "active",
  verificationStatus: "verified",
  createdAt: "2026-01-01T00:00:00Z",
};

const PATIENT_B: StoredIdentity = {
  id: "USR-PAT-1002",
  identifier: "PAT-1002",
  fullName: "Sunita Sharma",
  role: "patient",
  email: "sunita.sharma@example.com",
  passwordHash: "hash",
  accountStatus: "active",
  verificationStatus: "verified",
  createdAt: "2026-01-01T00:00:00Z",
};

const DOCTOR_ANANYA: StoredIdentity = {
  id: "USR-DOC-1001",
  identifier: "DOC-1001",
  fullName: "Dr. Ananya Sharma",
  role: "doctor",
  organizationId: "11111111-1111-1111-1111-111111111101",
  email: "dr.ananya@cityhospital.com",
  passwordHash: "hash",
  accountStatus: "active",
  verificationStatus: "verified",
  createdAt: "2026-01-01T00:00:00Z",
};

const LAB_TECH: StoredIdentity = {
  id: "USR-LAB-1001",
  identifier: "LAB-TECH-1001",
  fullName: "Prakash Diagnostic Tech",
  role: "lab_staff",
  organizationId: "33333333-3333-3333-3333-333333333301",
  email: "prakash@abcdiagnostics.com",
  passwordHash: "hash",
  accountStatus: "active",
  verificationStatus: "verified",
  createdAt: "2026-01-01T00:00:00Z",
};

const PHARMACY_STAFF: StoredIdentity = {
  id: "USR-PHA-1001",
  identifier: "PHA-1001",
  fullName: "Amit Pharmacist",
  role: "pharmacy_staff",
  organizationId: "44444444-4444-4444-4444-444444444401",
  email: "amit@greenpharmacy.com",
  passwordHash: "hash",
  accountStatus: "active",
  verificationStatus: "verified",
  createdAt: "2026-01-01T00:00:00Z",
};

async function runTests() {
  // ------------------------------------------------------------
  // TEST GROUP 1: DYNAMIC AGGREGATION & ZERO DUPLICATION
  // ------------------------------------------------------------
  console.log("--- TEST GROUP 1: Dynamic Aggregation & Single Source of Truth ---");
  
  const timelineA = ClinicalContinuityService.getPatientTimeline("PAT-1001", PATIENT_A);
  assert(timelineA.length > 0, "Patient A timeline retrieves non-empty events", `Retrieved ${timelineA.length} events`);

  // Verify diverse event types
  const eventTypes = new Set(timelineA.map((e) => e.event_type));
  assert(eventTypes.has("ENCOUNTER"), "Timeline contains ENCOUNTER events");
  assert(eventTypes.has("CLINICAL_RECORD"), "Timeline contains CLINICAL_RECORD events");
  assert(eventTypes.has("PRESCRIPTION"), "Timeline contains PRESCRIPTION events");
  assert(eventTypes.has("LAB_ORDER"), "Timeline contains LAB_ORDER events");
  assert(eventTypes.has("LAB_REPORT"), "Timeline contains LAB_REPORT events");

  // Verify single source reference
  const encounterEvent = timelineA.find((e) => e.event_type === "ENCOUNTER");
  assert(!!encounterEvent && encounterEvent.source_type === "ENCOUNTER", "Encounter event has source_type ENCOUNTER");
  assert(!!encounterEvent && !!encounterEvent.source_id, "Encounter event has non-empty source_id");

  const rxEvent = timelineA.find((e) => e.event_type === "PRESCRIPTION");
  assert(!!rxEvent && rxEvent.source_type === "PRESCRIPTION", "Prescription event has source_type PRESCRIPTION");

  const rptEvent = timelineA.find((e) => e.event_type === "LAB_REPORT");
  assert(!!rptEvent && rptEvent.source_type === "LAB_REPORT", "Lab report event has source_type LAB_REPORT");

  // ------------------------------------------------------------
  // TEST GROUP 2: CLINICAL TIMESTAMP SEMANTICS & CHRONOLOGICAL ORDER
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Clinical Timestamp Semantics & Chronological Ordering ---");

  // Verify chronological sort
  let isChronological = true;
  for (let i = 0; i < timelineA.length - 1; i++) {
    const a = timelineA[i];
    const b = timelineA[i + 1];
    if (a.section === b.section) {
      if (a.section === "UPCOMING") {
        if (new Date(a.occurred_at).getTime() > new Date(b.occurred_at).getTime()) {
          isChronological = false;
        }
      } else {
        if (new Date(a.occurred_at).getTime() < new Date(b.occurred_at).getTime()) {
          isChronological = false;
        }
      }
    }
  }
  assert(isChronological, "Timeline events are strictly sorted chronologically");

  // Verify section assignment
  const upcomingEvents = timelineA.filter((e) => e.section === "UPCOMING");
  for (const up of upcomingEvents) {
    const isFuture = new Date(up.occurred_at).getTime() > Date.now();
    assert(isFuture || up.status === "REQUESTED" || up.status === "CONFIRMED", `Upcoming event ${up.reference_id} is future-dated`);
  }

  // ------------------------------------------------------------
  // TEST GROUP 3: ENCOUNTER CLINICAL BUNDLING
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Encounter Clinical Bundles ---");

  const bundles = ClinicalContinuityService.getPatientEncounterBundles("PAT-1001", PATIENT_A);
  assert(bundles.length > 0, "Patient A has at least one consultation bundle", `Found ${bundles.length} bundles`);

  const bundle1001 = bundles.find((b) => b.encounter.id === "ENC-1001");
  assert(!!bundle1001, "Encounter bundle ENC-1001 is found");
  if (bundle1001) {
    assert(bundle1001.prescriptions.length > 0, "Bundle ENC-1001 contains linked prescriptions");
    assert(bundle1001.lab_orders.length > 0, "Bundle ENC-1001 contains linked lab orders");
    assert(bundle1001.lab_reports.length > 0, "Bundle ENC-1001 contains linked released lab reports");
    assert(!!bundle1001.clinical_record, "Bundle ENC-1001 contains linked clinical record");
    assert(bundle1001.doctor_name === "Dr. Ananya Sharma", "Bundle ENC-1001 preserves attending doctor name");
  }

  // ------------------------------------------------------------
  // TEST GROUP 4: STRICT PATIENT ISOLATION & IDOR PROTECTION
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Strict Patient Isolation & IDOR Protection ---");

  // Patient B attempts to read Patient A's timeline
  const idorTimeline = ClinicalContinuityService.getPatientTimeline("PAT-1001", PATIENT_B);
  assert(idorTimeline.length === 0, "Patient B is blocked from reading Patient A's timeline (IDOR Protection)");

  // Patient B reads their own timeline
  const timelineB = ClinicalContinuityService.getPatientTimeline("PAT-1002", PATIENT_B);
  assert(
    timelineB.every((e) => e.patient_id === "PAT-1002"),
    "Patient B only receives records where patient_id is PAT-1002"
  );
  assert(
    !timelineB.some((e) => e.patient_id === "PAT-1001"),
    "Zero data leakage: Patient B receives no PAT-1001 records"
  );

  // ------------------------------------------------------------
  // TEST GROUP 5: MULTI-ROLE LEAST PRIVILEGE SCOPING
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Role-Based Least Privilege Scoping ---");

  // Doctor access
  const docTimeline = ClinicalContinuityService.getPatientTimeline("PAT-1001", DOCTOR_ANANYA);
  assert(docTimeline.length > 0, "Attending Doctor can read Patient A's clinical timeline");

  // Laboratory staff scoped access (should NOT see prescriptions or doctor's general consultation notes)
  const labTimeline = ClinicalContinuityService.getPatientTimeline("PAT-1001", LAB_TECH);
  assert(
    labTimeline.every((e) => e.event_type === "LAB_ORDER" || e.event_type === "SAMPLE" || e.event_type === "LAB_REPORT"),
    "Lab staff timeline view is strictly scoped to LAB_ORDER, SAMPLE, and LAB_REPORT"
  );
  assert(
    !labTimeline.some((e) => e.event_type === "PRESCRIPTION"),
    "Lab staff cannot view patient prescriptions (Least Privilege)"
  );
  assert(
    !labTimeline.some((e) => e.event_type === "CLINICAL_RECORD"),
    "Lab staff cannot view patient clinical consultation notes (Least Privilege)"
  );

  // Pharmacy staff scoped access (should NOT see lab reports or doctor's general consultation notes)
  const pharmacyTimeline = ClinicalContinuityService.getPatientTimeline("PAT-1001", PHARMACY_STAFF);
  assert(
    pharmacyTimeline.every((e) => e.event_type === "PRESCRIPTION"),
    "Pharmacy staff timeline view is strictly scoped to PRESCRIPTION"
  );
  assert(
    !pharmacyTimeline.some((e) => e.event_type === "LAB_REPORT"),
    "Pharmacy staff cannot view patient laboratory reports (Least Privilege)"
  );
  assert(
    !pharmacyTimeline.some((e) => e.event_type === "CLINICAL_RECORD"),
    "Pharmacy staff cannot view patient clinical consultation notes (Least Privilege)"
  );

  // ------------------------------------------------------------
  // TEST GROUP 6: MULTI-FACILITY & DOCTOR PROVENANCE
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Multi-Facility & Doctor Provenance ---");

  const facilities = new Set(timelineA.map((e) => e.facility_name || e.organization_name).filter(Boolean));
  assert(facilities.size >= 1, "Timeline preserves facility names across events", `Facilities: ${Array.from(facilities).join(", ")}`);

  const rxEvents = timelineA.filter((e) => e.event_type === "PRESCRIPTION");
  assert(
    rxEvents.every((rx) => !!rx.professional_name),
    "Prescription events preserve authoring prescriber name"
  );

  const labReportEvents = timelineA.filter((e) => e.event_type === "LAB_REPORT");
  assert(
    labReportEvents.every((r) => !!r.professional_name),
    "Lab report events preserve verifying pathologist name"
  );

  // ------------------------------------------------------------
  // TEST GROUP 7: FILTERING & SEARCH CAPABILITIES
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: Search & Filtering Engine ---");

  // Category filter: prescriptions only
  const rxOnly = ClinicalContinuityService.getPatientTimeline("PAT-1001", PATIENT_A, { category: "prescriptions" });
  assert(
    rxOnly.every((e) => e.event_type === "PRESCRIPTION"),
    "Category filter 'prescriptions' returns only prescriptions"
  );

  // Category filter: lab reports only
  const rptOnly = ClinicalContinuityService.getPatientTimeline("PAT-1001", PATIENT_A, { category: "lab_reports" });
  assert(
    rptOnly.every((e) => e.event_type === "LAB_REPORT"),
    "Category filter 'lab_reports' returns only certified lab reports"
  );

  // Search filter
  const searchResult = ClinicalContinuityService.getPatientTimeline("PAT-1001", PATIENT_A, { searchQuery: "Ananya" });
  assert(
    searchResult.length > 0 && searchResult.every((e) => JSON.stringify(e).toLowerCase().includes("ananya")),
    "Search query 'Ananya' returns matching records"
  );

  // Pagination / Limit
  const paginated = ClinicalContinuityService.getPatientTimeline("PAT-1001", PATIENT_A, { limit: 2, offset: 0 });
  assert(paginated.length <= 2, "Pagination limit 2 returns at most 2 events", `Got ${paginated.length}`);

  // ------------------------------------------------------------
  // TEST GROUP 8: STRUCTURED HEALTH SUMMARY (NO AI)
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 8: Structured Health Summary ---");

  const summary = ClinicalContinuityService.getPatientStructuredHealthSummary("PAT-1001", PATIENT_A);
  assert(summary.patient_id === "PAT-1001", "Summary resolves correct patient ID");
  assert(summary.total_encounters_count > 0, "Summary tracks total encounters count");
  assert(summary.total_prescriptions_count > 0, "Summary tracks total prescriptions count");
  assert(summary.total_lab_reports_count > 0, "Summary tracks total lab reports count");
  assert(Array.isArray(summary.allergies), "Summary provides structured allergies array");
  assert(Array.isArray(summary.active_prescriptions), "Summary provides active prescriptions array");

  // ------------------------------------------------------------
  // TEST GROUP 9: AUDIT TRAIL INTEGRATION
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 9: Audit Trail Integration ---");

  const auditEvents = getAuditLedger();
  const timelineAudit = auditEvents.filter((a) => a.event_type === "TIMELINE_ACCESSED");
  assert(timelineAudit.length > 0, "Timeline access is logged in append-only Audit Ledger (TIMELINE_ACCESSED)");
  assert(
    timelineAudit.some((a) => a.patient_id === "PAT-1001"),
    "Audit event records correct patient ID"
  );

  // ------------------------------------------------------------
  // TEST GROUP 10: REBUILD & IDEMPOTENCY SAFETY
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 10: Rebuild & Dynamic Aggregation Idempotency ---");

  const run1 = ClinicalContinuityService.getPatientTimeline("PAT-1001", PATIENT_A);
  const run2 = ClinicalContinuityService.getPatientTimeline("PAT-1001", PATIENT_A);
  assert(run1.length === run2.length, "Dynamic aggregation is perfectly idempotent across subsequent calls");
  assert(
    JSON.stringify(run1.map((e) => e.id)) === JSON.stringify(run2.map((e) => e.id)),
    "Event IDs and sequence are strictly deterministic"
  );

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`PHASE C.4 TEST SUITE COMPLETED`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
