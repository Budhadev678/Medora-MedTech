// ============================================================
// MEDORA â€” MODIFICATION PHASE A.4 AUTOMATED TEST SUITE
// DASHBOARD, WORKSPACE & NAVIGATION ARCHITECTURE (TEST MATRIX)
// ============================================================

import {
  findIdentityById,
  findIdentityByEmail,
  getAllIdentities,
  getPersonMemberships,
  getMembershipById,
  revokeMembership,
  acceptMembership,
} from "../lib/data/identity-store";

import {
  resolveWorkspace,
  PATIENT_WORKSPACE,
  DOCTOR_WORKSPACE,
  RECEPTION_WORKSPACE,
  HOSPITAL_WORKSPACE,
  CLINIC_WORKSPACE,
  LAB_WORKSPACE,
  PHARMACY_WORKSPACE,
  BLOOD_WORKSPACE,
  ADMIN_WORKSPACE,
} from "../lib/workspaces";

import {
  PATIENT_PRIMARY_NAV,
  PATIENT_MORE_NAV,
  DOCTOR_NAV,
  RECEPTION_NAV,
  HOSPITAL_NAV,
  CLINIC_NAV,
  LAB_NAV,
  PHARMACY_NAV,
  BLOOD_NAV,
  ADMIN_NAV,
} from "../lib/navigation";

import { AuthorizationEngine } from "../lib/services/authorization-engine";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  âœ… PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  âŒ FAIL: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

console.log("\n============================================================");
console.log("ðŸ§ª STARTING PHASE A.4 WORKSPACE & NAVIGATION VERIFICATION");
console.log("============================================================\n");

// Identities
const patientA = findIdentityById("PAT-1001");
const patientB = findIdentityById("PAT-1002");
const docAnanya = findIdentityById("DOC-1001");
const staffAnita = findIdentityById("PER-STAFF-1002") || findIdentityById("STAFF-1002");
const staffSunita = findIdentityById("PER-STAFF-1001") || findIdentityById("STAFF-1001");
const rahulMulti = findIdentityById("PER-MULTI-1001") || findIdentityById("m0000001-0000-0000-0000-000000000001");
const hospAdmin = findIdentityByEmail("admin@cityhospital.org") || findIdentityById("HSP-1001");
const clinicAdmin = findIdentityByEmail("clinic@medora.health") || findIdentityById("CLN-1001");
const labTech = findIdentityByEmail("lab@medora.health") || findIdentityById("LAB-1001");
const pharmacist = findIdentityByEmail("pharmacy@medora.health") || findIdentityById("PHA-1001");
const bloodStaff = findIdentityByEmail("bloodbank@medora.health") || findIdentityById("BLC-1001");
const platformAdmin = findIdentityByEmail("admin@medora.health") || findIdentityById("ADM-1001");

// ------------------------------------------------------------
// TEST 1 â€” Patient Mobile Workspace & Navigation
// ------------------------------------------------------------
console.log("--- TEST 1: PATIENT MOBILE WORKSPACE & NAVIGATION ---");
const patWs = resolveWorkspace(patientA, null, "patient");
assert(patWs?.id === "patient_mobile", "Patient A resolves patient_mobile workspace");
assert(patWs?.landingRoute === "/patient", "Patient landing route is /patient");
assert(PATIENT_PRIMARY_NAV.length === 3, "Patient primary bottom navigation has 3 core items (Home, Appointments, Health)");
const hasMoreDocuments = PATIENT_MORE_NAV.some(i => i.href === "/patient/documents");
const hasMoreInsurance = PATIENT_MORE_NAV.some(i => i.href === "/patient/insurance");
const hasMoreGovt = PATIENT_MORE_NAV.some(i => i.href === "/patient/government");
const hasMoreFinance = PATIENT_MORE_NAV.some(i => i.href === "/patient/finance");
assert(hasMoreDocuments && hasMoreInsurance && hasMoreGovt && hasMoreFinance, "Patient More drawer contains certified Documents, Insurance, Govt Schemes, and Financing");

// ------------------------------------------------------------
// TEST 2 â€” Doctor Workspace & Multi-Hospital Scoping
// ------------------------------------------------------------
console.log("\n--- TEST 2: DOCTOR WORKSPACE & MULTI-ORGANIZATION CONTEXT ---");
const ananyaMemberships = getPersonMemberships(docAnanya!.id);
assert(ananyaMemberships.length >= 3, "Dr. Ananya has at least 3 active organization memberships");

const memCityHsp = ananyaMemberships.find(m => m.organization_identifier === "HSP-1001");
const docWsCity = resolveWorkspace(docAnanya, memCityHsp, "doctor");
assert(docWsCity?.id === "doctor_clinical", "Dr. Ananya in City Hospital context resolves doctor_clinical workspace");

const memClinic = ananyaMemberships.find(m => m.organization_identifier === "CLN-1001");
const docWsClinic = resolveWorkspace(docAnanya, memClinic, "doctor");
assert(docWsClinic?.id === "doctor_clinical", "Dr. Ananya in Green Care Clinic context resolves doctor_clinical workspace");
assert(DOCTOR_NAV.some(i => i.href === "/doctor/consultations"), "Doctor workspace contains Consultation Workbench");
assert(!DOCTOR_NAV.some(i => i.href.includes("insurance") || i.href.includes("government")), "Doctor workspace excludes unrelated insurance/government dashboards");

// ------------------------------------------------------------
// TEST 3 â€” Receptionist Role-Specific Workspace (No Generic Staff Dashboard)
// ------------------------------------------------------------
console.log("\n--- TEST 3: RECEPTIONIST WORKSPACE (ANITA) ---");
const anitaMemberships = getPersonMemberships(staffAnita!.id);
const anitaMemCity = anitaMemberships.find(m => m.organization_identifier === "HSP-1001");
const anitaWs = resolveWorkspace(staffAnita, anitaMemCity, "staff");
assert(anitaWs?.id === "reception_workspace", "Anita with receptionist role resolves reception_workspace");
assert(anitaWs?.landingRoute === "/reception", "Receptionist landing route is /reception");
assert(RECEPTION_NAV.some(i => i.href === "/reception/checkin"), "Reception navigation includes Patient Check-in");
assert(!RECEPTION_NAV.some(i => i.href.includes("prescription") || i.href.includes("consultations")), "Reception navigation excludes clinical diagnosis and prescribing");

// ------------------------------------------------------------
// TEST 4 â€” Front-Desk Multi-Clinic Staff Workspace (Anita)
// ------------------------------------------------------------
console.log("\n--- TEST 4: MULTI-CLINIC RECEPTIONIST WORKSPACE (ANITA) ---");
const anitaMemClinic = anitaMemberships.find(m => m.organization_identifier === "CLN-1001");
const anitaWsClinic = resolveWorkspace(staffAnita, anitaMemClinic, "staff");
assert(anitaWsClinic?.id === "reception_workspace", "Anita switching to Green Care Clinic resolves reception_workspace");
assert(anitaWsClinic?.landingRoute === "/reception", "Clinic Receptionist landing route is /reception");
assert(!RECEPTION_NAV.some(i => i.href.includes("billing/create") || i.href.includes("prescription")), "Reception navigation excludes clinical diagnosis and prescribing");

// ------------------------------------------------------------
// TEST 5 â€” Multi-Role User Context Isolation (Rahul Multi-Role)
// ------------------------------------------------------------
console.log("\n--- TEST 5: MULTI-ROLE CONTEXT ISOLATION (RAHUL MULTI-ROLE) ---");
const rahulMemberships = getPersonMemberships(rahulMulti!.id);
const rahulDocMem = rahulMemberships.find(m => m.organization_identifier === "HSP-1001");
const rahulAdminMem = rahulMemberships.find(m => m.organization_identifier === "CLN-1001");

const rahulDocWs = resolveWorkspace(rahulMulti, rahulDocMem, "doctor");
const rahulAdminWs = resolveWorkspace(rahulMulti, rahulAdminMem, "hospital_admin");

assert(rahulDocWs?.id === "doctor_clinical", "Rahul in City Hospital context resolves doctor_clinical workspace");
assert(rahulAdminWs?.id === "clinic_operations", "Rahul in Green Care Clinic context resolves clinic_operations workspace");
assert(rahulDocWs?.id !== rahulAdminWs?.id, "Doctor and Clinic Admin workspaces remain completely isolated");

// ------------------------------------------------------------
// TEST 6 â€” Hospital Command Center & Clinic Operations Workspaces
// ------------------------------------------------------------
console.log("\n--- TEST 6: HOSPITAL & CLINIC WORKSPACES ---");
const hspWs = resolveWorkspace(hospAdmin, null, "hospital_admin");
assert(hspWs?.id === "hospital_command", "Hospital Admin resolves hospital_command workspace");
assert(hspWs?.landingRoute === "/hospital", "Hospital landing route is /hospital");

const clnWs = resolveWorkspace(clinicAdmin, null, "hospital_admin");
assert(clnWs?.id === "clinic_operations", "Clinic Admin resolves clinic_operations workspace");
assert(clnWs?.landingRoute === "/clinic", "Clinic landing route is /clinic");

// ------------------------------------------------------------
// TEST 7 â€” Diagnostic Laboratory & Pharmacy Workspaces
// ------------------------------------------------------------
console.log("\n--- TEST 7: LABORATORY & PHARMACY WORKSPACES ---");
const labWs = resolveWorkspace(labTech, null, "lab_staff");
assert(labWs?.id === "laboratory_workbench", "Lab Tech resolves laboratory_workbench workspace");
assert(labWs?.landingRoute === "/lab", "Lab landing route is /lab");

const pharmWs = resolveWorkspace(pharmacist, null, "pharmacy_staff");
assert(pharmWs?.id === "pharmacy_operations", "Pharmacist resolves pharmacy_operations workspace");
assert(pharmWs?.landingRoute === "/pharmacy", "Pharmacy landing route is /pharmacy");

// ------------------------------------------------------------
// TEST 8 â€” Blood Centre & Platform Admin Workspaces
// ------------------------------------------------------------
console.log("\n--- TEST 8: BLOOD CENTRE & PLATFORM ADMIN WORKSPACES ---");
const bloodWs = resolveWorkspace(bloodStaff, null, "blood_staff");
assert(bloodWs?.id === "blood_coordination", "Blood staff resolves blood_coordination workspace");

const adminWs = resolveWorkspace(platformAdmin, null, "admin");
assert(adminWs?.id === "platform_admin", "Platform admin resolves platform_admin governance workspace");
assert(adminWs?.landingRoute === "/admin", "Admin landing route is /admin");

// ------------------------------------------------------------
// TEST 9 â€” Security Boundary & Direct Route Manipulation Checks
// ------------------------------------------------------------
console.log("\n--- TEST 9: SECURITY BOUNDARY CHECKS ---");
// Patient trying to access doctor clinical actions
const sec1 = AuthorizationEngine.evaluateOperation({
  actor: patientA,
  action: "CREATE",
  resourceType: "clinical_record",
  requiredPermission: "CLINICAL_RECORD_CREATE",
});
assert(!sec1.allowed && sec1.decision === "PERMISSION_DENIED", "Patient blocked from doctor clinical creation");

// Receptionist trying to create prescription
const sec2 = AuthorizationEngine.evaluateOperation({
  actor: staffAnita,
  action: "CREATE",
  resourceType: "prescription",
  organizationContextId: "HSP-1001",
  requiredPermission: "PRESCRIPTION_CREATE",
});
assert(!sec2.allowed && sec2.decision === "PERMISSION_DENIED", "Receptionist blocked from prescribing medications");

// Hospital Admin trying to access platform governance
const sec3 = AuthorizationEngine.evaluateOperation({
  actor: hospAdmin,
  action: "UPDATE",
  resourceType: "platform",
  requiredPermission: "PLATFORM_MANAGE",
});
assert(!sec3.allowed && sec3.decision === "PERMISSION_DENIED", "Hospital Admin blocked from platform admin governance");

// ------------------------------------------------------------
// TEST 10 â€” Multi-Organization Context Switch Authorization Check
// ------------------------------------------------------------
console.log("\n--- TEST 10: MULTI-ORG CONTEXT SWITCH AUTHORIZATION ---");
// Dr. Ananya switching to authorized Green Care Clinic
const switchOk = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "CREATE",
  resourceType: "encounter",
  organizationContextId: "CLN-1001",
  requiredPermission: "ENCOUNTER_CREATE",
});
assert(switchOk.allowed && switchOk.organization_id === "CLN-1001", "Dr. Ananya authorized in Green Care Clinic (CLN-1001)");

// Dr. Ananya switching to unauthorized hospital HSP-9999
const switchBad = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "CREATE",
  resourceType: "encounter",
  organizationContextId: "HSP-9999",
  requiredPermission: "ENCOUNTER_CREATE",
});
assert(!switchBad.allowed && switchBad.decision === "ORGANIZATION_MISMATCH", "Dr. Ananya blocked from unauthorized hospital context HSP-9999");

// Revoked membership switch test
revokeMembership("MEM-1003", "Visiting contract expired");
const switchRevoked = AuthorizationEngine.evaluateOperation({
  actor: docAnanya,
  action: "CREATE",
  resourceType: "encounter",
  organizationContextId: "CLN-1001",
  requiredPermission: "ENCOUNTER_CREATE",
});
assert(!switchRevoked.allowed && switchRevoked.decision === "MEMBERSHIP_INACTIVE", "Dr. Ananya blocked when switching to revoked membership context");
acceptMembership("MEM-1003"); // Restore

console.log("\n============================================================");
console.log(`ðŸ“Š PHASE A.4 TEST RESULTS: ${passedCount} PASSED / ${failedCount} FAILED`);
console.log("============================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
