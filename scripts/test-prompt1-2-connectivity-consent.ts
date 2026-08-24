import { findIdentityById } from "../lib/data/identity-store";
import {
  hasContextualAccess,
  grantContextualConsultationSharing,
  triggerBreakGlassEmergencyAccess,
  getPatientConsents,
} from "../lib/data/consent-store";
import { ClinicalContinuityService } from "../lib/services/clinical-continuity-service";
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

async function runPrompt1And2TestSuite() {
  console.log("============================================================");
  console.log("MEDORA — PLATFORM INTEGRATION PROMPT 1 & 2: CONNECTIVITY & CONTEXTUAL SHARING");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;
  const doctor = findIdentityById("DOC-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Cross-Patient Isolation & Zero Data Leakage
  // ------------------------------------------------------------
  console.log("TEST 1: Cross-Patient Isolation & IDOR Protection");
  const patientATimelineForB = ClinicalContinuityService.getPatientTimeline(
    "PAT-1001",
    patientB
  );
  assert(patientATimelineForB.length === 0, "1.1 Patient B is strictly blocked from accessing Patient A timeline");

  const patientATimelineSelf = ClinicalContinuityService.getPatientTimeline(
    "PAT-1001",
    patientA
  );
  assert(patientATimelineSelf.length > 0, "1.2 Patient A can access their own longitudinal timeline");

  // ------------------------------------------------------------
  // TEST 2: Contextual Medical Record Sharing During Consultation
  // ------------------------------------------------------------
  console.log("\nTEST 2: Contextual Consultation Record Sharing");
  const shareRes = grantContextualConsultationSharing({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    doctorId: "DOC-1001",
    doctorName: "Dr. Ananya Sharma",
    organizationId: "HSP-1001",
    organizationName: "City Hospital",
    encounterId: "ENC-1001",
  });

  assert(shareRes.success === true, "2.1 Contextual consultation consent grant created");
  assert(shareRes.consent.status === "GRANTED", "2.2 Consent record is active (GRANTED)");
  assert(
    hasContextualAccess("PAT-1001", "DOC-1001", "HSP-1001") === true,
    "2.3 Doctor has active contextual access to patient records"
  );

  // ------------------------------------------------------------
  // TEST 3: Clinical Continuity & Longitudinal Timeline Delivery
  // ------------------------------------------------------------
  console.log("\nTEST 3: Doctor Longitudinal Timeline Access");
  const doctorTimeline = ClinicalContinuityService.getPatientTimeline(
    "PAT-1001",
    doctor
  );
  assert(doctorTimeline.length > 0, "3.1 Doctor successfully retrieves authorized timeline");
  assert(
    doctorTimeline.every((e) => e.patient_id === "PAT-1001"),
    "3.2 All returned events strictly belong to the consulted patient"
  );

  // ------------------------------------------------------------
  // TEST 4: Emergency Break-Glass Access & Mandatory Audit Logging
  // ------------------------------------------------------------
  console.log("\nTEST 4: Emergency Break-Glass Access Override");
  const breakGlassRes = triggerBreakGlassEmergencyAccess({
    patientId: "PAT-1002",
    patientName: "Priya Sharma",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
    organizationId: "FAC-1001",
    organizationName: "City Hospital Trauma Care",
    justificationReason: "Acute hemorrhagic shock in trauma bay; patient unresponsive",
    emergencyCaseId: "EMR-2001",
  });

  assert(breakGlassRes.success === true, "4.1 Emergency break-glass override executed");
  assert(breakGlassRes.consent.purpose === "emergency_access", "4.2 Purpose tagged as emergency_access");

  // Verify Audit Log
  const breakGlassAudit = AuditLedger.getEvents().filter(
    (e) => e.event_type === "EMERGENCY_ACCESS_TRIGGERED"
  );
  assert(breakGlassAudit.length > 0, "4.3 Break-glass override logged to central immutable audit ledger");
  assert(
    breakGlassAudit[0].summary.includes("BREAK-GLASS EMERGENCY OVERRIDE"),
    "4.4 Audit event summary clearly flags break-glass action"
  );

  console.log("\n============================================================");
  console.log(`PROMPT 1 & 2 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPrompt1And2TestSuite();
