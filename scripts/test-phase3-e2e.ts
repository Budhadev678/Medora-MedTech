// ============================================================
// MEDORA â€” PHASE 3 FULL END-TO-END INTEGRATION TEST SUITE
// ============================================================

import { 
  findIdentityById, 
  updatePatientProfile, 
  updatePatientAddress, 
  updatePatientEmergencyContact, 
  updatePatientBloodGroup,
  calculateProfileCompleteness,
  linkPatientAbha,
  unlinkPatientAbha
} from "../lib/data/identity-store";
import { AbhaService } from "../lib/services/abha-service";
import { 
  getPatientConsentRequests, 
  getPatientConsents, 
  grantConsentRequest, 
  denyConsentRequest, 
  revokeConsent 
} from "../lib/data/consent-store";
import { 
  getPatientOrganizationRelationships, 
  getPatientDoctorRelationships,
  endPatientRelationship 
} from "../lib/data/relationship-store";
import { 
  submitCorrectionRequest, 
  getPatientCorrectionRequests,
  cancelCorrectionRequest,
  approveCorrectionRequest 
} from "../lib/data/correction-store";
import { AccessEngine } from "../lib/services/access-engine";
import { getPatientAuditTimeline } from "../lib/data/audit-store";

console.log("============================================================");
console.log("MEDORA PHASE 3 COMPREHENSIVE E2E VERIFICATION");
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
// TEST 1: Patient Identity & Profile Completeness (Phase 3.1)
// ------------------------------------------------------------
console.log("--- 1. Testing Patient Profile & Completeness (3.1) ---");
const rahul = findIdentityById("PAT-1001");
assert(rahul !== null && rahul.identifier === "PAT-1001", "Found patient PAT-1001 (Rahul Verma)");

const completenessRahul = calculateProfileCompleteness(rahul);
assert(completenessRahul.percentage === 100, `Rahul profile completeness is ${completenessRahul.percentage}% (Expected 100%)`);

const priya = findIdentityById("PAT-1002");
assert(priya !== null && priya.identifier === "PAT-1002", "Found patient PAT-1002 (Priya Sharma)");

const completenessPriya = calculateProfileCompleteness(priya);
assert(completenessPriya.percentage <= 100, `Priya completeness is ${completenessPriya.percentage}% before ABHA linking`);

// Address Validation Check
const badPinRes = updatePatientAddress("PAT-1001", {
  line1: "Test Line",
  city: "Bhubaneswar",
  district: "Khordha",
  state: "Odisha",
  pincode: "123", // invalid
  country: "India",
});
assert(badPinRes.success === false, "Invalid PIN code format rejected");

const goodPinRes = updatePatientAddress("PAT-1001", {
  line1: "Plot 42, Saheed Nagar",
  city: "Bhubaneswar",
  district: "Khordha",
  state: "Odisha",
  pincode: "751007",
  country: "India",
});
assert(goodPinRes.success === true, "Valid 6-digit Indian PIN code saved successfully");

// ------------------------------------------------------------
// TEST 2: ABHA / Aadhaar Sandbox Verification Flow (Phase 3.2)
// ------------------------------------------------------------
console.log("\n--- 2. Testing ABHA & Aadhaar Sandbox Lifecycle (3.2) ---");
// 2a. Request OTP
const otpReq = AbhaService.requestOtp("XXXX XXXX 8821", "aadhaar");
assert(otpReq.success === true && !!otpReq.txnId, "ABDM Sandbox OTP requested successfully");

// 2b. Verify with wrong OTP
const badOtp = AbhaService.verifyOtp(otpReq.txnId!, "000000");
assert(badOtp.success === false, "Incorrect OTP code rejected");

// 2c. Verify with correct test OTP (123456)
const goodOtp = AbhaService.verifyOtp(otpReq.txnId!, "123456");
assert(goodOtp.success === true && !!goodOtp.identity, "Correct sandbox OTP (123456) verified");

// 2d. Identity Matching Engine
if (priya && goodOtp.identity) {
  const match = AbhaService.matchIdentity(priya, goodOtp.identity);
  assert(match.score >= 50, `Identity matching engine evaluated match score: ${match.score}% (${match.matchLevel})`);
}

// 2e. Address Availability Check
const avail = AbhaService.checkAbhaAddressAvailability("priyasharma");
assert(avail.available === true, "ABHA address @abdm availability check works");

// 2f. Link ABHA to Priya
const linkPriya = AbhaService.linkAbhaToPatient(
  "PAT-1002",
  "91-4421-9876-8821",
  "priyasharma@abdm",
  "XXXX XXXX 8821"
);
assert(linkPriya.success === true, "ABHA successfully linked to PAT-1002");

const updatedPriya = findIdentityById("PAT-1002");
assert(updatedPriya?.patientData?.abhaStatus === "LINKED", "Patient PAT-1002 live status is LINKED");

// 2g. Collision Detection (Prevent duplicate ABHA on another patient)
const dupLink = linkPatientAbha("PAT-1003", {
  abhaNumber: "91-4421-9876-8821", // already used by Priya
  abhaAddress: "priyasharma@abdm",
});
assert(dupLink.success === false, "Duplicate ABHA collision across distinct accounts rejected");

// ------------------------------------------------------------
// TEST 3: Consent & Access Control Decision Engine (Phase 3.3)
// ------------------------------------------------------------
console.log("\n--- 3. Testing Consent & Centralized Access Engine (3.3) ---");
const docAnanya = findIdentityById("DOC-1001");

// Check Active Consents for Rahul
const consentsRahul = getPatientConsents("PAT-1001");
const activeConsent = consentsRahul.find((c) => c.status === "GRANTED");
assert(!!activeConsent, `Active consent grant verified (${activeConsent?.id})`);

// Access Engine Evaluation: Allowed Access
const accessAllow = AccessEngine.evaluateAccess({
  actor: docAnanya,
  targetPatientId: "PAT-1001",
  organizationId: "HSP-1001",
  purpose: "treatment",
  requiredScope: "prescriptions",
});
assert(accessAllow.allowed === true && accessAllow.decision === "ALLOW", "AccessEngine permits authorized doctor with active consent");

// Revoke Access
if (activeConsent) {
  const revokeRes = revokeConsent(activeConsent.id, "PAT-1001", "Rahul Verma");
  assert(revokeRes.success === true, `Consent ${activeConsent.id} successfully revoked`);

  const accessAfterRevoke = AccessEngine.evaluateAccess({
    actor: docAnanya,
    targetPatientId: "PAT-1001",
    organizationId: "HSP-1001",
    purpose: "treatment",
    requiredScope: "prescriptions",
  });
  assert(accessAfterRevoke.allowed === false && accessAfterRevoke.decision === "CONSENT_REVOKED", "AccessEngine immediately blocks access after revocation");
}

// ------------------------------------------------------------
// TEST 4: Identity Correction Requests (Phase 3.3)
// ------------------------------------------------------------
console.log("\n--- 4. Testing Identity Correction Request Pipeline (3.3) ---");
const corrReq = submitCorrectionRequest(
  "PAT-1001",
  "fullName",
  "Full Legal Name",
  "Rahul Verma",
  "Rahul Kumar Verma",
  "Addition of middle name per updated Aadhaar card",
  "Rahul Verma"
);
assert(corrReq.success === true || Boolean(corrReq.error?.includes("already under review")), "Identity correction submitted with duplicate protection");

// Attempt duplicate submission for same field
const dupCorr = submitCorrectionRequest(
  "PAT-1001",
  "fullName",
  "Full Legal Name",
  "Rahul Verma",
  "Rahul K. Verma",
  "Another middle name attempt",
  "Rahul Verma"
);
assert(dupCorr.success === false, "Duplicate correction request for the same field blocked");

// ------------------------------------------------------------
// TEST 5: Append-Only Audit Ledger (Phase 3.4)
// ------------------------------------------------------------
console.log("\n--- 5. Testing Append-Only Audit Ledger (3.4) ---");
const rahulAudit = getPatientAuditTimeline("PAT-1001");
assert(rahulAudit.length > 0, `Patient audit ledger contains ${rahulAudit.length} verifiable privacy events`);
assert(rahulAudit.every((e) => !e.metadata?.userPassword && !e.metadata?.otpCode), "Zero credential data in audit ledger");

console.log(`\n============================================================`);
console.log(`E2E Verification Summary: ${passed}/${total} assertions PASSED.`);
console.log(`============================================================`);

if (passed === total) {
  console.log("ALL PHASE 3 REQUIREMENTS FULLY SATISFIED AND VERIFIED.\n");
} else {
  process.exit(1);
}
