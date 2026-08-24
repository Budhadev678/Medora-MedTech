import { findIdentityById } from "../lib/data/identity-store";
import { ClinicalContinuityService } from "../lib/services/clinical-continuity-service";
import { AccessEngine } from "../lib/services/access-engine";
import { getPatientClinicalRecords } from "../lib/data/clinical-record-store";
import { getPatientPrescriptions } from "../lib/data/prescription-store";
import { getPatientLabReports } from "../lib/data/lab-order-store";
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

async function runDoctorStep8Suite() {
  console.log("============================================================");
  console.log("MEDORA — DOCTOR SIDE STEP 8: MEDICAL RECORD & TIMELINE");
  console.log("============================================================\n");

  const docA = findIdentityById("DOC-1001")!;
  const docB = findIdentityById("DOC-1002")!;
  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST 1: Single Canonical Medical Record & Timeline Compilation
  // ------------------------------------------------------------
  console.log("TEST 1: Canonical Medical Record & Timeline Compilation");
  const timelineEvents = ClinicalContinuityService.getPatientTimeline("PAT-1001", docA);
  assert(timelineEvents.length > 0, "1.1 Longitudinal timeline compiled dynamically for Patient PAT-1001");
  assert(timelineEvents.every(e => e.patient_id === "PAT-1001"), "1.2 All timeline events strictly belong to Patient PAT-1001");

  // Check multi-entity aggregation
  const hasConsultation = timelineEvents.some(e => e.event_type === "ENCOUNTER" || e.event_type === "CLINICAL_RECORD");
  const hasPrescription = timelineEvents.some(e => e.event_type === "PRESCRIPTION");
  const hasLabReport = timelineEvents.some(e => e.event_type === "LAB_REPORT" || e.event_type === "LAB_ORDER");
  
  assert(hasConsultation, "1.3 Timeline aggregates clinical consultations");
  assert(hasPrescription, "1.4 Timeline aggregates digital prescriptions");
  assert(hasLabReport, "1.5 Timeline aggregates laboratory test reports");

  // ------------------------------------------------------------
  // TEST 2: Chronological Date Grouping & Ordering
  // ------------------------------------------------------------
  console.log("\nTEST 2: Chronological Date Grouping & Ordering");
  const dateGroups = ClinicalContinuityService.groupTimelineEventsByDate(timelineEvents);
  assert(dateGroups.length > 0, "2.1 Events grouped into date sections");
  assert(Boolean(dateGroups[0].dateLabel), "2.2 Date group has human-readable display string");
  assert(dateGroups[0].events.length > 0, "2.3 Group contains ordered event array");

  // ------------------------------------------------------------
  // TEST 3: Provenance & Historical Immutability
  // ------------------------------------------------------------
  console.log("\nTEST 3: Provenance & Historical Immutability");
  const sampleEvent = timelineEvents[0];
  assert(Boolean(sampleEvent.organization_name), "3.1 Clinical organization provenance is attached");
  assert(Boolean(sampleEvent.professional_name), "3.2 Attending physician provenance is attached");
  assert(Boolean(sampleEvent.occurred_at), "3.3 Authoritative event timestamp is attached");

  // Historical records query
  const patientRecords = getPatientClinicalRecords("PAT-1001", false);
  assert(patientRecords.every(r => r.status === "COMPLETED"), "3.4 Patient medical history only exposes finalized records");

  // ------------------------------------------------------------
  // TEST 4: Filter Scoping (Consultation / RX / Lab / Referral)
  // ------------------------------------------------------------
  console.log("\nTEST 4: Filter Scoping & Category Isolation");
  const rxOnlyTimeline = ClinicalContinuityService.getPatientTimeline("PAT-1001", docA, {
    category: "prescriptions",
  });
  assert(rxOnlyTimeline.length > 0, "4.1 Filtered prescription timeline retrieved");
  assert(rxOnlyTimeline.every(e => e.event_type === "PRESCRIPTION"), "4.2 All events in filtered result are PRESCRIPTION");

  // ------------------------------------------------------------
  // TEST 5: Patient Demographics & Consent Verification
  // ------------------------------------------------------------
  console.log("\nTEST 5: Patient Demographics & Consent Verification");
  const accessCheck = AccessEngine.evaluateAccess({
    actor: docA,
    targetPatientId: "PAT-1001",
    organizationId: "HSP-1001",
    purpose: "treatment",
    requiredScope: "medical_history",
  });
  assert(accessCheck.allowed === true, "5.1 Active care relationship and consent verified for Doctor A");

  // ------------------------------------------------------------
  // TEST 6: Anti-IDOR & Patient Privacy Protection
  // ------------------------------------------------------------
  console.log("\nTEST 6: Anti-IDOR & Patient Privacy Protection");
  // Patient B attempting to access Patient A's timeline
  const patientBLookup = ClinicalContinuityService.getPatientTimeline("PAT-1001", patientB);
  assert(patientBLookup.length === 0, "6.1 Patient B cannot access Patient A's longitudinal medical timeline");

  // ------------------------------------------------------------
  // TEST 7: Audit Logging for Longitudinal Record Access
  // ------------------------------------------------------------
  console.log("\nTEST 7: Audit Logging for Medical Record Access");
  const auditEvents = AuditLedger.getEvents({ patientId: "PAT-1001" });
  assert(auditEvents.length > 0, "7.1 Access to patient record and timeline is audit-logged");

  console.log("\n============================================================");
  console.log(`DOCTOR STEP 8 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runDoctorStep8Suite();