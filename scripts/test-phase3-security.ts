// ============================================================
// MEDORA — PHASE 3 AUTOMATED SECURITY & ACCESS ENGINE TEST SUITE
// ============================================================

import { AccessEngine } from "../lib/services/access-engine";
import { getPatientConsents, grantConsentRequest, revokeConsent } from "../lib/data/consent-store";
import { submitCorrectionRequest, getPatientCorrectionRequests } from "../lib/data/correction-store";
import { logAuditEvent, getPatientAuditTimeline } from "../lib/data/audit-store";
import { StoredIdentity } from "../lib/data/identity-store";

console.log("Starting MEDORA Phase 3 Security & Access Engine Verification...\n");

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

// Persona Definitions
const patientRahul: StoredIdentity = {
  id: "a0000001-0000-0000-0000-000000000001",
  email: "rahul@medora.health",
  passwordHash: "Password@123",
  role: "patient",
  identifier: "PAT-1001",
  fullName: "Rahul Verma",
  accountStatus: "active",
  verificationStatus: "verified",
  createdAt: "2026-01-15T09:00:00Z",
};

const patientPriya: StoredIdentity = {
  id: "a0000001-0000-0000-0000-000000000002",
  email: "priya@medora.health",
  passwordHash: "Password@123",
  role: "patient",
  identifier: "PAT-1002",
  fullName: "Priya Sharma",
  accountStatus: "active",
  verificationStatus: "verified",
  createdAt: "2026-02-10T11:30:00Z",
};

const doctorAnanya: StoredIdentity = {
  id: "a0000002-0000-0000-0000-000000000001",
  email: "ananya@medora.health",
  passwordHash: "Password@123",
  role: "doctor",
  identifier: "DOC-1001",
  fullName: "Dr. Ananya Sharma",
  accountStatus: "active",
  verificationStatus: "verified",
  createdAt: "2026-01-10T08:00:00Z",
  doctorData: {
    medicalRegNo: "MCI-2018-88231",
    medicalCouncil: "Odisha Medical Council",
    experienceYears: 12,
    qualifications: "MBBS, MD (Cardiology)",
    specialization: "Cardiology",
    affiliations: [
      {
        organizationId: "HSP-1001",
        organizationIdentifier: "HSP-1001",
        organizationName: "City Hospital",
        roleTitle: "Consultant Cardiologist",
        consultationFee: 800,
        status: "active",
        verificationStatus: "verified",
      },
    ],
  },
};

// 1. Patient Self-Access
const selfCheck = AccessEngine.evaluateAccess({
  actor: patientRahul,
  targetPatientId: "PAT-1001",
});
assert(selfCheck.allowed === true && selfCheck.decision === "ALLOW", "Patient self-access yields ALLOW");

// 2. Cross-Patient Attempt
const crossCheck = AccessEngine.evaluateAccess({
  actor: patientRahul,
  targetPatientId: "PAT-1002",
});
assert(crossCheck.allowed === false && crossCheck.decision === "DENY", "Cross-patient access yields DENY");

// 3. Unauthenticated Attempt
const unauthCheck = AccessEngine.evaluateAccess({
  actor: null,
  targetPatientId: "PAT-1001",
});
assert(unauthCheck.allowed === false && unauthCheck.decision === "NOT_AUTHORIZED", "Unauthenticated request yields NOT_AUTHORIZED");

// 4. Doctor Access with Active Consent & Matching Scope
const docAllowedCheck = AccessEngine.evaluateAccess({
  actor: doctorAnanya,
  targetPatientId: "PAT-1001",
  organizationId: "HSP-1001",
  purpose: "treatment",
  requiredScope: "prescriptions",
});
assert(docAllowedCheck.allowed === true && docAllowedCheck.decision === "ALLOW", "Doctor with active consent & valid scope yields ALLOW");

// 5. Doctor Access with Unauthorized Scope
const scopeDeniedCheck = AccessEngine.evaluateAccess({
  actor: doctorAnanya,
  targetPatientId: "PAT-1001",
  organizationId: "HSP-1001",
  purpose: "treatment",
  requiredScope: "billing_info",
});
assert(scopeDeniedCheck.allowed === false && scopeDeniedCheck.decision === "SCOPE_NOT_ALLOWED", "Doctor requesting ungranted data scope yields SCOPE_NOT_ALLOWED");

// 6. Doctor Access without Patient Consent
const noConsentCheck = AccessEngine.evaluateAccess({
  actor: doctorAnanya,
  targetPatientId: "PAT-1002",
  organizationId: "HSP-1001",
  purpose: "treatment",
  requiredScope: "prescriptions",
});
assert(noConsentCheck.allowed === false && noConsentCheck.decision === "CONSENT_REQUIRED", "Doctor accessing patient without consent yields CONSENT_REQUIRED");

// 7. Audit Log Sensitive Data Sanitization
const loggedEvent = logAuditEvent({
  event_type: "CONSENT_GRANTED",
  actor_id: "PAT-1001",
  actor_name: "Rahul Verma",
  actor_role: "patient",
  patient_id: "PAT-1001",
  summary: "Security audit test",
  metadata: {
    aadhaarNumber: "123456789012",
    otpCode: "123456",
    userPassword: "SecretPassword123",
    safeField: "consultation",
  },
});
assert(loggedEvent.metadata?.aadhaarNumber === "[REDACTED_SECURITY_DATA]", "Aadhaar number is redacted in audit ledger");
assert(loggedEvent.metadata?.otpCode === "[REDACTED_SECURITY_DATA]", "OTP code is redacted in audit ledger");
assert(loggedEvent.metadata?.userPassword === "[REDACTED_SECURITY_DATA]", "User password is redacted in audit ledger");
assert(loggedEvent.metadata?.safeField === "consultation", "Non-sensitive metadata is safely preserved");

console.log(`\nSecurity Suite Result: ${passed}/${total} assertions passed.`);
if (passed === total) {
  console.log("ALL SECURITY ASSERTIONS VERIFIED SUCCESSFULLY.");
} else {
  process.exit(1);
}
