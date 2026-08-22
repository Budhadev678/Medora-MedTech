// ============================================================
// MEDORA — MODIFICATION PHASE A.3 AUTOMATED TEST SUITE
// ROLE, PERMISSION, AUTHORIZATION & DATA ACCESS (24/24 TESTS)
// ============================================================

import {
  findIdentityById,
  findIdentityByEmail,
  getAllIdentities,
  getPersonMemberships,
  createMembership,
  revokeMembership,
  acceptMembership,
} from "../lib/data/identity-store";

import {
  AuthorizationEngine,
  triggerEmergencyAccess,
  hasActiveEmergencyAccess,
  getAllEmergencyAccessLogs,
} from "../lib/services/authorization-engine";

import { getPatientConsents, grantConsentRequest } from "../lib/data/consent-store";
import { getPatientOrganizationRelationships } from "../lib/data/relationship-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

console.log("\n============================================================");
console.log("🧪 STARTING PHASE A.3 AUTHORIZATION & PERMISSION VERIFICATION");
console.log("============================================================\n");

// Controlled Test Users
const patientA = findIdentityById("PAT-1001"); // Rahul Verma
const patientB = findIdentityById("PAT-1002"); // Priya Sharma
const docAnanya = findIdentityById("DOC-1001"); // Dr. Ananya (City Hosp, Green Care Hosp, Green Care Clinic)
const docRajesh = findIdentityById("DOC-1002"); // Dr. Rajesh (City Hosp only)
const staffAnita = findIdentityById("PER-STAFF-1002") || findIdentityById("STAFF-1002"); // Receptionist
const pharmacist = findIdentityByEmail("pharmacy@medora.health") || findIdentityById("PHA-1001");
const labTech = findIdentityByEmail("lab@medora.health") || findIdentityById("LAB-1001");
const hospitalAdmin = findIdentityByEmail("admin@cityhospital.org") || findIdentityById("HSP-1001");
const platformAdmin = findIdentityByEmail("admin@medora.health");

// ------------------------------------------------------------
// TEST 1 — Patient A -> Own Profile (ALLOW)
// ------------------------------------------------------------
console.log("--- TEST 1: PATIENT A -> OWN PROFILE ---");
const t1 = AuthorizationEngine.evaluateOperation({
  actor: patientA,
  action: "VIEW",
  resourceType: "patient_profile",
  targetPatientId: "PAT-1001",
  requiredPermission: "PATIENT_VIEW",
});
assert(t1.allowed && t1.decision === "ALLOW", "Patient A is allowed to view own profile");

// ------------------------------------------------------------
// TEST 2 — Patient A -> Patient B Profile (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 2: PATIENT A -> PATIENT B PROFILE ---");
const t2 = AuthorizationEngine.evaluateOperation({
  actor: patientA,
  action: "VIEW",
  resourceType: "patient_profile",
  targetPatientId: "PAT-1002",
  requiredPermission: "PATIENT_VIEW",
});
assert(!t2.allowed && t2.decision === "RESOURCE_MISMATCH", "Patient A is denied viewing Patient B profile");

// ------------------------------------------------------------
// TEST 3 — Patient A -> Patient B Prescription (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 3: PATIENT A -> PATIENT B PRESCRIPTION ---");
const t3 = AuthorizationEngine.evaluateOperation({
  actor: patientA,
  action: "VIEW",
  resourceType: "prescription",
  targetPatientId: "PAT-1002",
  targetResourceId: "RX-1002",
  requiredPermission: "PRESCRIPTION_VIEW",
});
assert(!t3.allowed && t3.decision === "RESOURCE_MISMATCH", "Patient A cannot view Patient B prescription");

// ------------------------------------------------------------
// TEST 4 — Doctor A -> Authorized Patient (ALLOW)
// ------------------------------------------------------------
console.log("\n--- TEST 4: DOCTOR A -> AUTHORIZED PATIENT ---");
const t4 = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "VIEW",
  resourceType: "clinical_record",
  organizationContextId: "HSP-1001",
  targetPatientId: "PAT-1001",
  requiredPermission: "CLINICAL_RECORD_VIEW",
});
assert(t4.allowed && t4.decision === "ALLOW", "Doctor Ananya has clinical authorization for PAT-1001 at City Hospital");

// ------------------------------------------------------------
// TEST 5 — Doctor A -> Unrelated Patient (DENY / CONSENT_REQUIRED)
// ------------------------------------------------------------
console.log("\n--- TEST 5: DOCTOR A -> UNRELATED PATIENT ---");
const t5 = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "VIEW",
  resourceType: "clinical_record",
  organizationContextId: "HSP-1001",
  targetPatientId: "PAT-9999",
  requiredPermission: "CLINICAL_RECORD_VIEW",
});
assert(!t5.allowed && (t5.decision === "DENY" || t5.decision === "CONSENT_REQUIRED"), "Doctor Ananya cannot view unconsented unrelated patient record");

// ------------------------------------------------------------
// TEST 6 — Doctor A -> Hospital A Context (ALLOW)
// ------------------------------------------------------------
console.log("\n--- TEST 6: DOCTOR A -> HOSPITAL A CONTEXT ---");
const t6 = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "CREATE",
  resourceType: "encounter",
  organizationContextId: "HSP-1001",
  requiredPermission: "ENCOUNTER_CREATE",
});
assert(t6.allowed && t6.decision === "ALLOW", "Dr. Ananya can create encounters in City Hospital (HSP-1001)");

// ------------------------------------------------------------
// TEST 7 — Doctor A -> Hospital B Context Without Membership (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 7: DOCTOR A -> UNAFFILIATED HOSPITAL CONTEXT ---");
const t7 = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "CREATE",
  resourceType: "encounter",
  organizationContextId: "HSP-9999", // Doctor has no membership at HSP-9999
  requiredPermission: "ENCOUNTER_CREATE",
});
assert(!t7.allowed && t7.decision === "ORGANIZATION_MISMATCH", "Dr. Ananya rejected in unaffiliated hospital context HSP-9999");

// ------------------------------------------------------------
// TEST 8 — Doctor With Two Memberships (Organization-Scoped)
// ------------------------------------------------------------
console.log("\n--- TEST 8: DOCTOR WITH MULTIPLE MEMBERSHIPS ---");
const t8_hsp1 = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "CREATE",
  resourceType: "prescription",
  organizationContextId: "HSP-1001",
  requiredPermission: "PRESCRIPTION_CREATE",
});
const t8_cln1 = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "CREATE",
  resourceType: "prescription",
  organizationContextId: "CLN-1001",
  requiredPermission: "PRESCRIPTION_CREATE",
});
assert(t8_hsp1.allowed && t8_hsp1.organization_id === "HSP-1001", "Context HSP-1001 resolves City Hospital scope");
assert(t8_cln1.allowed && t8_cln1.organization_id === "CLN-1001", "Context CLN-1001 resolves Green Care Clinic scope");

// ------------------------------------------------------------
// TEST 9 — Receptionist -> Appointment (ALLOW)
// ------------------------------------------------------------
console.log("\n--- TEST 9: RECEPTIONIST -> APPOINTMENT ---");
const t9 = AuthorizationEngine.evaluateOperation({
  actor: staffAnita || {
    id: "k0000001-0000-0000-0000-000000000002",
    identifier: "STAFF-1002",
    fullName: "Anita Patel",
    email: "anita@cityhospital.org",
    role: "receptionist",
    accountStatus: "active",
    createdAt: "2026-01-01T00:00:00Z"
  } as any,
  action: "CREATE",
  resourceType: "appointment",
  organizationContextId: "HSP-1001",
  requiredPermission: "APPOINTMENT_CREATE",
});
assert(t9.allowed && t9.decision === "ALLOW", "Receptionist can schedule appointments at City Hospital");

// ------------------------------------------------------------
// TEST 10 — Receptionist -> Diagnosis Modification (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 10: RECEPTIONIST -> DIAGNOSIS MODIFICATION ---");
const t10 = AuthorizationEngine.evaluateOperation({
  actor: staffAnita || {
    id: "k0000001-0000-0000-0000-000000000002",
    identifier: "STAFF-1002",
    fullName: "Anita Patel",
    email: "anita@cityhospital.org",
    role: "receptionist",
    accountStatus: "active",
    createdAt: "2026-01-01T00:00:00Z"
  } as any,
  action: "UPDATE",
  resourceType: "clinical_record",
  organizationContextId: "HSP-1001",
  requiredPermission: "CLINICAL_RECORD_UPDATE",
});
assert(!t10.allowed && t10.decision === "PERMISSION_DENIED", "Receptionist is strictly blocked from modifying clinical records");

// ------------------------------------------------------------
// TEST 11 — Receptionist -> Prescription Creation (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 11: RECEPTIONIST -> PRESCRIPTION CREATION ---");
const t11 = AuthorizationEngine.evaluateOperation({
  actor: staffAnita || {
    id: "k0000001-0000-0000-0000-000000000002",
    identifier: "STAFF-1002",
    fullName: "Anita Patel",
    email: "anita@cityhospital.org",
    role: "receptionist",
    accountStatus: "active",
    createdAt: "2026-01-01T00:00:00Z"
  } as any,
  action: "CREATE",
  resourceType: "prescription",
  organizationContextId: "HSP-1001",
  requiredPermission: "PRESCRIPTION_CREATE",
});
assert(!t11.allowed && t11.decision === "PERMISSION_DENIED", "Receptionist is strictly blocked from prescribing medications");

// ------------------------------------------------------------
// TEST 12 — Pharmacist -> Valid Prescription (ALLOW)
// ------------------------------------------------------------
console.log("\n--- TEST 12: PHARMACIST -> VALID PRESCRIPTION ---");
const t12 = AuthorizationEngine.evaluateOperation({
  actor: pharmacist || {
    id: "pha-uuid-1",
    identifier: "PHA-1001",
    fullName: "ABC Pharmacy Staff",
    email: "pharmacy@medora.health",
    role: "pharmacy_staff",
    accountStatus: "active",
    createdAt: "2026-01-01T00:00:00Z"
  } as any,
  action: "DISPENSE",
  resourceType: "pharmacy_dispensing",
  requiredPermission: "PHARMACY_DISPENSE",
});
assert(t12.allowed && t12.decision === "ALLOW", "Pharmacist is permitted to dispense authorized digital prescriptions");

// ------------------------------------------------------------
// TEST 13 — Pharmacist -> Unrelated Clinical Record (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 13: PHARMACIST -> UNRELATED CLINICAL RECORD ---");
const t13 = AuthorizationEngine.evaluateOperation({
  actor: pharmacist || {
    id: "pha-uuid-1",
    identifier: "PHA-1001",
    fullName: "ABC Pharmacy Staff",
    email: "pharmacy@medora.health",
    role: "pharmacy_staff",
    accountStatus: "active",
    createdAt: "2026-01-01T00:00:00Z"
  } as any,
  action: "VIEW",
  resourceType: "clinical_record",
  requiredPermission: "CLINICAL_RECORD_VIEW",
});
assert(!t13.allowed && t13.decision === "PERMISSION_DENIED", "Pharmacist is blocked from accessing private clinical consultation notes");

// ------------------------------------------------------------
// TEST 14 — Lab Technician -> Valid Lab Order (ALLOW)
// ------------------------------------------------------------
console.log("\n--- TEST 14: LAB TECHNICIAN -> VALID LAB ORDER ---");
const t14 = AuthorizationEngine.evaluateOperation({
  actor: labTech || {
    id: "lab-uuid-1",
    identifier: "LAB-1001",
    fullName: "ABC Diagnostics Staff",
    email: "lab@medora.health",
    role: "lab_technician",
    accountStatus: "active",
    createdAt: "2026-01-01T00:00:00Z"
  } as any,
  action: "CREATE",
  resourceType: "lab_result",
  requiredPermission: "LAB_RESULT_CREATE",
});
assert(t14.allowed && t14.decision === "ALLOW", "Lab technician is permitted to enter diagnostic test results");

// ------------------------------------------------------------
// TEST 15 — Lab Technician -> Unrelated Patient Record / Prescription (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 15: LAB TECHNICIAN -> UNRELATED PRESCRIPTION ---");
const t15 = AuthorizationEngine.evaluateOperation({
  actor: labTech || {
    id: "lab-uuid-1",
    identifier: "LAB-1001",
    fullName: "ABC Diagnostics Staff",
    email: "lab@medora.health",
    role: "lab_technician",
    accountStatus: "active",
    createdAt: "2026-01-01T00:00:00Z"
  } as any,
  action: "CREATE",
  resourceType: "prescription",
  requiredPermission: "PRESCRIPTION_CREATE",
});
assert(!t15.allowed && t15.decision === "PERMISSION_DENIED", "Lab technician cannot create medical prescriptions");

// ------------------------------------------------------------
// TEST 16 — Hospital Admin -> Organization Members (ALLOW)
// ------------------------------------------------------------
console.log("\n--- TEST 16: HOSPITAL ADMIN -> MANAGE MEMBERS ---");
const t16 = AuthorizationEngine.evaluateOperation({
  actor: hospitalAdmin || {
    id: "hsp-admin-uuid-1",
    identifier: "HSP-1001",
    fullName: "City Hospital Admin",
    email: "admin@cityhospital.org",
    role: "hospital_admin",
    accountStatus: "active",
    createdAt: "2026-01-01T00:00:00Z"
  } as any,
  action: "INVITE",
  resourceType: "organization_membership",
  organizationContextId: "HSP-1001",
  requiredPermission: "MEMBER_INVITE",
});
assert(t16.allowed && t16.decision === "ALLOW", "Hospital administrator can invite staff members to their hospital");

// ------------------------------------------------------------
// TEST 17 — Hospital Admin -> Platform Admin Controls (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 17: HOSPITAL ADMIN -> PLATFORM ADMIN CONTROLS ---");
const t17 = AuthorizationEngine.evaluateOperation({
  actor: hospitalAdmin || {
    id: "hsp-admin-uuid-1",
    identifier: "HSP-1001",
    fullName: "City Hospital Admin",
    email: "admin@cityhospital.org",
    role: "hospital_admin",
    accountStatus: "active",
    createdAt: "2026-01-01T00:00:00Z"
  } as any,
  action: "UPDATE",
  resourceType: "platform",
  requiredPermission: "PLATFORM_MANAGE",
});
assert(!t17.allowed && t17.decision === "PERMISSION_DENIED", "Hospital admin cannot access platform-wide governance controls");

// ------------------------------------------------------------
// TEST 18 — Revoked Doctor Membership -> Organization (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 18: REVOKED MEMBERSHIP DENIAL ---");
revokeMembership("MEM-1003", "Visiting contract terminated");
const t18 = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "CREATE",
  resourceType: "encounter",
  organizationContextId: "CLN-1001", // MEM-1003 is REVOKED
  requiredPermission: "ENCOUNTER_CREATE",
});
assert(!t18.allowed && t18.decision === "MEMBERSHIP_INACTIVE", "Dr. Ananya denied creating encounter in Green Care Clinic after membership revocation");
acceptMembership("MEM-1003"); // Restore for future tests

// ------------------------------------------------------------
// TEST 19 — Modified Organization ID from Client (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 19: MODIFIED ORGANIZATION ID TAMPERING ---");
const t19 = AuthorizationEngine.evaluateOperation({
  actor: docRajesh, // Only has membership at HSP-1001
  action: "CREATE",
  resourceType: "encounter",
  organizationContextId: "CLN-1001", // Tampered Org ID
  requiredPermission: "ENCOUNTER_CREATE",
});
assert(!t19.allowed && t19.decision === "ORGANIZATION_MISMATCH", "Doctor Rajesh tampered organization ID CLN-1001 rejected");

// ------------------------------------------------------------
// TEST 20 — Modified User ID From Client (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 20: MODIFIED USER ID TAMPERING ---");
const t20 = AuthorizationEngine.evaluateOperation({
  actor: patientA, // Authenticated as PAT-1001
  action: "UPDATE",
  resourceType: "patient_profile",
  targetPatientId: "PAT-1002", // Tampered victim patient ID
  requiredPermission: "PATIENT_UPDATE",
});
assert(!t20.allowed && t20.decision === "RESOURCE_MISMATCH", "Patient A tampered update targeting Patient B rejected");

// ------------------------------------------------------------
// TEST 21 — Modified Role From Frontend (DENY / PRIVILEGE ESCALATION PREVENTION)
// ------------------------------------------------------------
console.log("\n--- TEST 21: ROLE TAMPERING / PRIVILEGE ESCALATION ---");
const tamperedPatientActor = {
  ...patientA,
  role: "doctor" as any // Client tries to spoof doctor role
};
// Membership lookup for patient returns 0 doctor memberships
const t21 = AuthorizationEngine.evaluateOperation({
  actor: tamperedPatientActor as any,
  action: "CREATE",
  resourceType: "prescription",
  organizationContextId: "HSP-1001",
  requiredPermission: "PRESCRIPTION_CREATE",
});
assert(!t21.allowed && (t21.decision === "ORGANIZATION_MISMATCH" || t21.decision === "MEMBERSHIP_INACTIVE"), "Spoofed doctor role with no actual membership rejected");

// ------------------------------------------------------------
// TEST 22 — Direct URL / Resource Manipulation (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 22: DIRECT URL / IDOR MANIPULATION ---");
const t22 = AuthorizationEngine.evaluateOperation({
  actor: patientB, // PAT-1002
  action: "VIEW",
  resourceType: "clinical_record",
  targetPatientId: "PAT-1001", // URL spoof /patient/records/PAT-1001
  requiredPermission: "CLINICAL_RECORD_VIEW",
});
assert(!t22.allowed && t22.decision === "RESOURCE_MISMATCH", "Direct URL manipulation across patients rejected");

// ------------------------------------------------------------
// TEST 23 — Direct API Manipulation (DENY)
// ------------------------------------------------------------
console.log("\n--- TEST 23: DIRECT API MANIPULATION ---");
const t23 = AuthorizationEngine.evaluateOperation({
  actor: null, // Unauthenticated direct REST call
  action: "VIEW",
  resourceType: "patient_profile",
  targetPatientId: "PAT-1001",
  requiredPermission: "PATIENT_VIEW",
});
assert(!t23.allowed && t23.decision === "NOT_AUTHENTICATED", "Unauthenticated direct API access rejected");

// ------------------------------------------------------------
// TEST 24 — Database Query Bypass / Hard Deletion Prohibition (ACTION_PROHIBITED)
// ------------------------------------------------------------
console.log("\n--- TEST 24: SENSITIVE HEALTH RECORD DELETION PROHIBITION ---");
const t24 = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "DELETE",
  resourceType: "clinical_record",
  targetResourceId: "CR-1001",
  organizationContextId: "HSP-1001",
  requiredPermission: "CLINICAL_RECORD_DELETE" as any,
});
assert(!t24.allowed && t24.decision === "ACTION_PROHIBITED", "Hard deletion of clinical medical records strictly prohibited");

console.log("\n============================================================");
console.log(`📊 PHASE A.3 TEST RESULTS: ${passedCount} PASSED / ${failedCount} FAILED`);
console.log("============================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
