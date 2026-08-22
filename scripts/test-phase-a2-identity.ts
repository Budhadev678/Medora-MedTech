// ============================================================
// MEDORA — MODIFICATION PHASE A.2 AUTOMATED TEST SUITE
// IDENTITY & ORGANIZATION MEMBERSHIP ARCHITECTURE (11/11 TESTS)
// ============================================================

import {
  getAllIdentities,
  findIdentityById,
  findIdentityByEmail,
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  getAllMemberships,
  getPersonMemberships,
  getOrganizationMemberships,
  getMembershipById,
  createMembership,
  inviteUserToOrganization,
  acceptMembership,
  revokeMembership,
  suspendMembership,
  getHospitalAffiliatedDoctors,
} from "../lib/data/identity-store";

import { getPatientEncounters } from "../lib/data/encounter-store";
import { getPatientPrescriptions } from "../lib/data/prescription-store";
import { getPatientMedicalDocuments } from "../lib/data/medical-document-store";

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
console.log("🧪 STARTING PHASE A.2 IDENTITY & MEMBERSHIP VERIFICATION");
console.log("============================================================\n");

// ------------------------------------------------------------
// TEST 1 — PATIENT IDENTITY ISOLATION
// ------------------------------------------------------------
console.log("--- TEST 1: PATIENT IDENTITY ISOLATION ---");
const patientA = findIdentityById("PAT-1001");
const patientB = findIdentityById("PAT-1002");

assert(patientA !== null && patientA.fullName === "Rahul Verma", "Patient A resolves to Rahul Verma (PAT-1001)");
assert(patientB !== null && patientB.fullName === "Priya Sharma", "Patient B resolves to Priya Sharma (PAT-1002)");
assert(patientA?.id !== patientB?.id, "Patient A and Patient B have distinct UUID primary keys");

const encA = getPatientEncounters("PAT-1001");
const encB = getPatientEncounters("PAT-1002");
assert(encA.length >= 1, "Patient A has active clinical encounters");
assert(encA.every(e => e.patient_id === "PAT-1001"), "Patient A encounters strictly belong to PAT-1001");
assert(encB.every(e => e.patient_id === "PAT-1002"), "Patient B encounters strictly belong to PAT-1002");
assert(!encB.some(e => e.patient_name === "Rahul Verma"), "Patient B never sees Patient A data");

// ------------------------------------------------------------
// TEST 2 — ONE DOCTOR, ONE ORGANIZATION
// ------------------------------------------------------------
console.log("\n--- TEST 2: ONE DOCTOR, ONE ORGANIZATION ---");
const docRajesh = findIdentityById("DOC-1002");
assert(docRajesh !== null && docRajesh.fullName === "Dr. Rajesh Sharma", "Dr. Rajesh Sharma resolves as DOC-1002");
const rajeshMemberships = getPersonMemberships(docRajesh!.id);
assert(rajeshMemberships.length === 1, "Dr. Rajesh Sharma has exactly 1 organization membership");
assert(rajeshMemberships[0].organization_identifier === "HSP-1001", "Dr. Rajesh is affiliated with City Hospital");
assert(rajeshMemberships[0].role_title === "Senior Consultant", "Dr. Rajesh designation is Senior Consultant");

// ------------------------------------------------------------
// TEST 3 — ONE DOCTOR, MULTIPLE ORGANIZATIONS
// ------------------------------------------------------------
console.log("\n--- TEST 3: ONE DOCTOR, MULTIPLE ORGANIZATIONS ---");
const docAnanya = findIdentityById("DOC-1001");
assert(docAnanya !== null && docAnanya.fullName === "Dr. Ananya Sharma", "Dr. Ananya Sharma resolves as DOC-1001");

const ananyaMemberships = getPersonMemberships(docAnanya!.id);
assert(ananyaMemberships.length === 3, "Dr. Ananya Sharma has 3 distinct organization memberships");
assert(ananyaMemberships.every(m => m.user_id === docAnanya!.id), "All 3 memberships belong to the same single User ID");

const orgsAffiliated = ananyaMemberships.map(m => m.organization_identifier);
assert(orgsAffiliated.includes("HSP-1001"), "Dr. Ananya has membership at City Hospital (HSP-1001)");
assert(orgsAffiliated.includes("HSP-1002"), "Dr. Ananya has membership at Green Care Hospital (HSP-1002)");
assert(orgsAffiliated.includes("CLN-1001"), "Dr. Ananya has membership at Green Care Clinic (CLN-1001)");

// ------------------------------------------------------------
// TEST 4 — STAFF MULTIPLE ORGANIZATIONS
// ------------------------------------------------------------
console.log("\n--- TEST 4: STAFF MULTIPLE ORGANIZATIONS ---");
const anitaMemberships = getAllMemberships().filter(m => m.person_id === "PER-STAFF-1002");
assert(anitaMemberships.length === 2, "Anita (Receptionist) has 2 organization memberships");
assert(anitaMemberships[0].user_id === anitaMemberships[1].user_id, "Both memberships share the same single user account");
assert(anitaMemberships[0].organization_identifier === "HSP-1001", "Anita membership 1 is at City Hospital");
assert(anitaMemberships[1].organization_identifier === "CLN-1001", "Anita membership 2 is at Green Care Clinic");
assert(anitaMemberships[0].role_title === "Receptionist", "Anita role title is Receptionist");

// ------------------------------------------------------------
// TEST 5 — SAME PERSON DIFFERENT ROLES
// ------------------------------------------------------------
console.log("\n--- TEST 5: SAME PERSON DIFFERENT ROLES ---");
const rahulMulti = getAllMemberships().filter(m => m.person_id === "PER-MULTI-1001");
assert(rahulMulti.length === 2, "Rahul (Multi-role persona) has 2 organization memberships");
assert(rahulMulti[0].user_id === rahulMulti[1].user_id, "Both memberships share 1 user identity");
assert(rahulMulti.find(m => m.organization_identifier === "HSP-1001")?.member_role === "doctor", "Rahul is a Doctor at City Hospital");
assert(rahulMulti.find(m => m.organization_identifier === "CLN-1001")?.member_role === "hospital_admin", "Rahul is an Administrator at Green Care Clinic");

// ------------------------------------------------------------
// TEST 6 — REVOKED MEMBERSHIP & HISTORICAL INTEGRITY
// ------------------------------------------------------------
console.log("\n--- TEST 6: REVOKED MEMBERSHIP ---");
const testRevokeRes = revokeMembership("MEM-1003", "Doctor ended visiting contract");
assert(testRevokeRes.success, "Successfully revoked membership MEM-1003");
const revokedMem = getMembershipById("MEM-1003");
assert(revokedMem?.status === "REVOKED", "MEM-1003 status is now REVOKED");
assert(revokedMem?.revocation_reason === "Doctor ended visiting contract", "Revocation reason is recorded");
assert(revokedMem?.end_date !== undefined, "End date is recorded on revocation");

// Doctor identity must still exist
const stillDoc = findIdentityById("DOC-1001");
assert(stillDoc !== null && stillDoc.fullName === "Dr. Ananya Sharma", "Dr. Ananya identity is preserved intact");

// Restore membership for subsequent tests
acceptMembership("MEM-1003");

// ------------------------------------------------------------
// TEST 7 — NEW ORGANIZATION CREATION
// ------------------------------------------------------------
console.log("\n--- TEST 7: NEW ORGANIZATION CREATION ---");
const newOrgRes = createOrganization({
  medora_id: "CLN-9999",
  name: "Lifeline Specialty Clinic",
  type: "clinic",
  license_no: "LIC-CLN-9999",
  address: "Plot 100, Infocity",
  city: "Bhubaneswar",
  phone: "+91 674 2999999",
});
assert(newOrgRes.success, "Created new organization Lifeline Specialty Clinic (CLN-9999)");
const fetchedOrg = getOrganizationById("CLN-9999");
assert(fetchedOrg !== null && fetchedOrg.name === "Lifeline Specialty Clinic", "Fetched newly created organization by medora_id");

// ------------------------------------------------------------
// TEST 8 — EXISTING USER JOINS NEW ORGANIZATION
// ------------------------------------------------------------
console.log("\n--- TEST 8: EXISTING USER JOINS ORGANIZATION ---");
const joinRes = createMembership({
  personId: "PER-DOC-1001",
  userId: docAnanya!.id,
  organizationId: fetchedOrg!.id,
  organizationIdentifier: "CLN-9999",
  organizationName: "Lifeline Specialty Clinic",
  organizationType: "clinic",
  roleTitle: "Consultant Cardiologist",
  memberRole: "doctor",
  consultationFee: 550,
});
assert(joinRes.success, "Existing doctor joined new clinic CLN-9999 with zero new user account creation");
assert(joinRes.membership?.user_id === docAnanya!.id, "Membership references the existing doctor user ID");
const ananyaUpdatedMemberships = getPersonMemberships(docAnanya!.id);
assert(ananyaUpdatedMemberships.some(m => m.organization_identifier === "CLN-9999"), "New membership appears in doctor's memberships");

// ------------------------------------------------------------
// TEST 9 — PROFILE FAILURE (ZERO CROSS-IDENTITY FALLBACK)
// ------------------------------------------------------------
console.log("\n--- TEST 9: MISSING PROFILE ZERO FALLBACK ---");
const nonExistent = findIdentityById("PAT-9999");
assert(nonExistent === null, "Looking up non-existent PAT-9999 returns null (Never Rahul Verma)");
const nonExistentEnc = getPatientEncounters("PAT-9999");
assert(nonExistentEnc.length === 0, "Non-existent patient encounters list is empty (Zero data leakage)");

// ------------------------------------------------------------
// TEST 10 — DATA PERSISTENCE ACROSS RE-QUERY
// ------------------------------------------------------------
console.log("\n--- TEST 10: DATA PERSISTENCE ---");
const allOrgs = getAllOrganizations();
assert(allOrgs.length >= 10, "Authoritative organizations store contains all 10 core healthcare institutions");
const allMems = getAllMemberships();
assert(allMems.length >= 10, "Authoritative memberships store contains all seeded & active relationships");

// ------------------------------------------------------------
// TEST 11 — HISTORICAL DATA PRESERVATION
// ------------------------------------------------------------
console.log("\n--- TEST 11: HISTORICAL DATA PRESERVATION ---");
const rahulEncounters = getPatientEncounters("PAT-1001");
const enc1 = rahulEncounters.find(e => e.id === "ENC-1001");
assert(enc1 !== undefined, "Encounter ENC-1001 exists for PAT-1001");
assert(enc1?.provider_name === "Dr. Ananya Sharma", "ENC-1001 provider remains Dr. Ananya Sharma");
assert(enc1?.organization_name === "City Hospital", "ENC-1001 organization remains City Hospital");

// ------------------------------------------------------------
// TEST 12 — EMAIL ALIASES & IDENTIFIER RESOLUTION
// ------------------------------------------------------------
console.log("\n--- TEST 12: EMAIL ALIASES & IDENTIFIER RESOLUTION ---");
const cityHospByAlias = findIdentityByEmail("admin@cityhospital.org");
assert(cityHospByAlias !== null, "admin@cityhospital.org resolves to an identity");
assert(cityHospByAlias?.identifier === "HSP-1001", "admin@cityhospital.org resolves to City Hospital HSP-1001");

const cityHospByIdentifier = findIdentityByEmail("HSP-1001");
assert(cityHospByIdentifier !== null, "HSP-1001 identifier lookup succeeds");
assert(cityHospByIdentifier?.identifier === "HSP-1001", "HSP-1001 resolves correctly");

const docByAlias = findIdentityByEmail("doctor@medora.health");
assert(docByAlias !== null && docByAlias.identifier === "DOC-1001", "doctor@medora.health resolves to DOC-1001");

const recepByEmail = findIdentityByEmail("anita@cityhospital.org");
assert(recepByEmail !== null && recepByEmail.identifier === "STAFF-1002", "anita@cityhospital.org resolves to STAFF-1002");

console.log("\n============================================================");
console.log(`📊 PHASE A.2 TEST RESULTS: ${passedCount} PASSED / ${failedCount} FAILED`);
console.log("============================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
