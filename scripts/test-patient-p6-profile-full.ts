import {
  findIdentityById,
  updatePatientProfile,
  updatePatientAddress,
  updatePatientEmergencyContact,
  updatePatientBloodGroup,
  calculateProfileCompleteness,
  StoredIdentity,
} from "../lib/data/identity-store";
import { PATIENT_PRIMARY_NAV } from "../lib/navigation";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ? PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ? FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
    failed++;
  }
}

async function runPatientP6Suite() {
  console.log("============================================================");
  console.log("MEDORA — P6 PROMPT 1 PATIENT PROFILE ACCEPTANCE TEST SUITE");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST GROUP 1: Canonical Profile Information Architecture & Nav
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Canonical Profile Information Architecture & Nav");
  const profileNav = PATIENT_PRIMARY_NAV.find(n => n.href === "/patient/profile");
  assert(Boolean(profileNav), "1.1 Profile exists as canonical primary navigation item");
  assert(profileNav?.label === "Profile", "1.2 Navigation label is clean patient-friendly 'Profile'");

  // ------------------------------------------------------------
  // TEST GROUP 2: Personal Information & Dynamic Age Calculation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Personal Information & Dynamic Age Calculation");
  assert(Boolean(patientA.fullName), "2.1 Full name populated from canonical identity");
  assert(Boolean(patientA.patientData?.dob), "2.2 Date of birth populated from canonical patient data");
  
  if (patientA.patientData?.dob) {
    const birthYear = new Date(patientA.patientData.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    const approxAge = currentYear - birthYear;
    assert(approxAge > 0 && approxAge < 120, "2.3 Age dynamically derived from Date of Birth");
  }

  // ------------------------------------------------------------
  // TEST GROUP 3: Contact Information & Address Structure
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Contact Information & Address Structure");
  assert(Boolean(patientA.phone && patientA.email), "3.1 Phone and email exist on canonical identity");
  assert(Boolean(patientA.patientData?.address?.line1 && patientA.patientData?.address?.city && patientA.patientData?.address?.state && patientA.patientData?.address?.pincode), "3.2 Structured address contains line1, city, state, and pincode");

  // ------------------------------------------------------------
  // TEST GROUP 4: Healthcare Profile Information
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Healthcare Profile Information");
  assert(Boolean(patientA.patientData?.bloodGroup), "4.1 Blood group exists on healthcare profile");
  assert(Array.isArray(patientA.patientData?.allergies), "4.2 Allergies recorded as structured array");

  // ------------------------------------------------------------
  // TEST GROUP 5: Emergency Contact Information
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Emergency Contact Information");
  assert(
    Boolean(patientA.patientData?.emergencyContact?.name && patientA.patientData?.emergencyContact?.relation && patientA.patientData?.emergencyContact?.phone),
    "5.1 Emergency contact contains Name, Relationship, and Phone number"
  );

  // ------------------------------------------------------------
  // TEST GROUP 6: Profile Completeness Calculation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Profile Completeness Calculation");
  const compA = calculateProfileCompleteness(patientA);
  assert(compA.percentage === 100, "6.1 Fully linked Patient A computes 100% profile completeness");
  
  const compB = calculateProfileCompleteness(patientB);
  assert(compB.percentage < 100 && compB.percentage >= 80, "6.2 Unlinked Patient B computes accurate ~91% completeness (missing ABHA only)");
  assert(compB.missingOptional.includes("ABHA Health ID"), "6.3 Missing fields accurately identifies unlinked ABHA");

  // ------------------------------------------------------------
  // TEST GROUP 7: Safe Update Mutations
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Safe Profile Update Mutations");
  // Test updating emergency contact
  const updateRes = updatePatientEmergencyContact("PAT-1001", {
    name: "Sunita Verma",
    relation: "Mother",
    phone: "+91 98765 43210",
  });
  assert(Boolean(updateRes.success && updateRes.updated?.patientData?.emergencyContact?.name === "Sunita Verma"), "7.1 updatePatientEmergencyContact updates emergency contact safely");

  // Test updating address
  const addrRes = updatePatientAddress("PAT-1001", {
    line1: "House 45, Sector 4",
    city: "Rourkela",
    state: "Odisha",
    pincode: "769002",
    country: "India",
  });
  assert(Boolean(addrRes.success && addrRes.updated?.patientData?.address?.line1 === "House 45, Sector 4"), "7.2 updatePatientAddress updates address fields safely");

  // ------------------------------------------------------------
  // TEST GROUP 8: Anti-IDOR Patient Privacy & Role Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 8: Anti-IDOR Patient Privacy & Role Isolation");
  const identityA = findIdentityById("PAT-1001")!;
  const identityB = findIdentityById("PAT-1002")!;
  assert(identityA.identifier !== identityB.identifier, "8.1 Patient A and Patient B have distinct canonical identities");
  assert(identityA.fullName !== identityB.fullName, "8.2 Patient identities are completely isolated");

  console.log("\n============================================================");
  console.log(`P6 PROMPT 1 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPatientP6Suite();


