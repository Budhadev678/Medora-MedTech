// ============================================================
// MEDORA — AUTOMATED TEST SUITE: MEDICAL RECORD SHARING,
// PRIVACY, CONSENT, CONSULTATION ACCESS & EMERGENCY ACCESS
// ============================================================

import {
  getConsultationSharingDecision,
  recordConsultationSharingDecision,
  requestConsultationSharing,
  hasContextualAccess,
  triggerBreakGlassEmergencyAccess,
  getAllSharingDecisions,
} from "../lib/data/consent-store";
import { ConsultationService } from "../lib/services/consultation-service";
import { getPatientAuditTimeline, getAuditLedger } from "../lib/data/audit-store";
import { TRANSLATIONS } from "../lib/localization";
import { StoredIdentity } from "../lib/data/identity-store";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (detail) console.error(`         Detail: ${detail}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log("============================================================");
  console.log("RUNNING MEDICAL RECORD SHARING & ACCESS TEST SUITE");
  console.log("============================================================\n");

  const testEncounterId = "ENC-TEST-" + Date.now();
  const testPatientId = "PAT-1001";
  const testDoctorId = "DOC-1001";
  const testOrgId = "HSP-1001";

  const doctorActor = {
    id: "user-doc-1",
    identifier: testDoctorId,
    fullName: "Dr. Ananya Sharma",
    role: "doctor",
    accountStatus: "active",
    organizationId: testOrgId,
    organizationName: "AIIMS Bhubaneswar",
    doctorData: {
      specialty: "General Medicine",
      registrationNumber: "MCI-48291",
      affiliations: [
        {
          organizationId: testOrgId,
          organizationIdentifier: testOrgId,
          organizationName: "AIIMS Bhubaneswar",
          departmentName: "General Medicine",
          status: "active",
        },
      ],
    },
  } as unknown as StoredIdentity;

  const patientActor = {
    id: "user-pat-1",
    identifier: testPatientId,
    fullName: "Priyanka Mohapatra",
    role: "patient",
    accountStatus: "active",
    patientData: {
      dob: "1994-06-15",
      gender: "female",
      bloodGroup: "O+",
      emergencyContact: { name: "Mother", phone: "9876543210" },
      allergies: ["Penicillin"],
      chronicConditions: ["Hypertension"],
    },
  } as unknown as StoredIdentity;

  const maliciousPatientActor = {
    id: "user-pat-2",
    identifier: "PAT-9999",
    fullName: "Unauthorized User",
    role: "patient",
    accountStatus: "active",
  } as unknown as StoredIdentity;

  // ------------------------------------------------------------
  // SECTION 1: DEFAULT / DON'T SHARE BEHAVIOR
  // ------------------------------------------------------------
  console.log("--- 1. Testing Don't Share Flow & Protections ---");

  // Record DONT_SHARE decision
  const dontShareRes = recordConsultationSharingDecision({
    encounterId: testEncounterId,
    patientId: testPatientId,
    patientName: "Priyanka Mohapatra",
    doctorId: testDoctorId,
    doctorName: "Dr. Ananya Sharma",
    organizationId: testOrgId,
    organizationName: "AIIMS Bhubaneswar",
    decision: "DONT_SHARE",
  });

  assert(dontShareRes.success, "recordConsultationSharingDecision returns success for DONT_SHARE");
  assert(dontShareRes.decision.decision === "DONT_SHARE", "Decision is accurately recorded as DONT_SHARE");

  // hasContextualAccess evaluation
  const hasAccessWhenDontShare = hasContextualAccess(testPatientId, testDoctorId, testOrgId, testEncounterId);
  assert(!hasAccessWhenDontShare, "hasContextualAccess evaluates to FALSE when patient selected DONT_SHARE");

  // ------------------------------------------------------------
  // SECTION 2: DOCTOR REQUESTING PATIENT DECISION
  // ------------------------------------------------------------
  console.log("\n--- 2. Testing Doctor Requesting Patient Decision ---");

  const reqRes = requestConsultationSharing({
    encounterId: testEncounterId,
    doctorId: testDoctorId,
    doctorName: "Dr. Ananya Sharma",
    patientId: testPatientId,
    organizationId: testOrgId,
  });

  assert(reqRes.success, "requestConsultationSharing returns success");
  const decisionAfterReq = getConsultationSharingDecision(testEncounterId, testPatientId);
  assert(
    decisionAfterReq?.requested_by_doctor === true,
    "Sharing decision reflects requested_by_doctor flag"
  );

  // ------------------------------------------------------------
  // SECTION 3: PATIENT SHARING PREVIOUS RECORDS (24H SCOPED)
  // ------------------------------------------------------------
  console.log("\n--- 3. Testing Share Previous Records Decision ---");

  const shareRes = recordConsultationSharingDecision({
    encounterId: testEncounterId,
    patientId: testPatientId,
    patientName: "Priyanka Mohapatra",
    doctorId: testDoctorId,
    doctorName: "Dr. Ananya Sharma",
    organizationId: testOrgId,
    organizationName: "AIIMS Bhubaneswar",
    decision: "SHARE",
  });

  assert(shareRes.success, "recordConsultationSharingDecision returns success for SHARE");
  assert(shareRes.decision.decision === "SHARE", "Decision is accurately recorded as SHARE");
  assert(
    Boolean(
      shareRes.decision.granted_scopes?.includes("prescriptions") &&
        shareRes.decision.granted_scopes?.includes("lab_reports")
    ),
    "Granted scopes include prescriptions and lab_reports"
  );
  assert(
    Boolean(
      !shareRes.decision.granted_scopes?.includes("financial_billing") &&
        !shareRes.decision.granted_scopes?.includes("administrative")
    ),
    "Financial and administrative data are strictly excluded from sharing scope"
  );

  const hasAccessWhenShared = hasContextualAccess(testPatientId, testDoctorId, testOrgId, testEncounterId);
  assert(hasAccessWhenShared, "hasContextualAccess evaluates to TRUE after patient authorizes SHARE");

  // ------------------------------------------------------------
  // SECTION 4: SECURITY & PATIENT ISOLATION
  // ------------------------------------------------------------
  console.log("\n--- 4. Testing Security Isolation & URL Tampering ---");

  // Patient Isolation
  const crossPatientContext = ConsultationService.getConsultationContext(
    "ENC-1001",
    maliciousPatientActor
  );
  assert(
    crossPatientContext === null,
    "Unauthorized Patient B cannot access Patient A's consultation encounter (returns null)"
  );

  // ------------------------------------------------------------
  // SECTION 5: BREAK-GLASS EMERGENCY OVERRIDE
  // ------------------------------------------------------------
  console.log("\n--- 5. Testing Break-Glass Emergency Medical Record Access ---");

  const emergencyRes = triggerBreakGlassEmergencyAccess({
    patientId: "PAT-1002",
    patientName: "Emergency Trauma Patient",
    actorId: testDoctorId,
    actorName: "Dr. Ananya Sharma",
    actorRole: "Emergency Physician",
    organizationId: testOrgId,
    organizationName: "AIIMS Trauma Center",
    justificationReason: "Patient unconscious with multiple trauma; critical allergy check required",
  });

  assert(emergencyRes.success, "triggerBreakGlassEmergencyAccess creates emergency authorization override");
  assert(emergencyRes.consent.purpose === "emergency_access", "Emergency purpose is recorded on consent");

  const hasEmergencyAccess = hasContextualAccess("PAT-1002", testDoctorId, testOrgId);
  assert(hasEmergencyAccess, "hasContextualAccess evaluates to TRUE for emergency override");

  // ------------------------------------------------------------
  // SECTION 6: IMMUTABLE AUDIT LOGGING
  // ------------------------------------------------------------
  console.log("\n--- 6. Testing Immutable Audit Ledger Recording ---");

  const allAudits = getAuditLedger();
  const emergencyAuditEvent = allAudits.find(
    (a) => a.event_type === "EMERGENCY_ACCESS_TRIGGERED" && a.patient_id === "PAT-1002"
  );

  assert(Boolean(emergencyAuditEvent), "Audit ledger captured EMERGENCY_ACCESS_TRIGGERED event");
  assert(
    Boolean(emergencyAuditEvent?.summary.includes("BREAK-GLASS EMERGENCY OVERRIDE")),
    "Audit summary contains mandatory emergency override statement"
  );

  // ------------------------------------------------------------
  // SECTION 7: MULTI-LANGUAGE LOCALIZATION
  // ------------------------------------------------------------
  console.log("\n--- 7. Testing English, Hindi & Odia Localization ---");

  const requiredKeys = [
    "sharing.share_previous_records",
    "sharing.dont_share",
    "sharing.confirm_share",
    "sharing.records_shared_title",
    "sharing.records_not_shared_title",
    "sharing.scope_consultations",
    "sharing.scope_prescriptions",
    "sharing.scope_lab_reports",
    "sharing.scope_excluded",
    "sharing.request_patient_decision",
    "sharing.emergency_access_title",
    "sharing.access_history_title",
  ];

  for (const key of requiredKeys) {
    assert(Boolean(TRANSLATIONS.en[key]), `English translation exists for ${key}`);
    assert(Boolean(TRANSLATIONS.hi[key]), `Hindi translation exists for ${key}`);
    assert(Boolean(TRANSLATIONS.or[key]), `Odia translation exists for ${key}`);
  }

  // ------------------------------------------------------------
  // FINAL SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("============================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
