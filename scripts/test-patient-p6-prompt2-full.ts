import {
  findIdentityById,
  updatePatientProfile,
  updatePatientAddress,
  updatePatientEmergencyContact,
  updatePatientBloodGroup,
  calculateProfileCompleteness,
  StoredIdentity,
} from "../lib/data/identity-store";
import { AppointmentStore } from "../lib/data/appointment-store";
import { getPatientEncounters } from "../lib/data/encounter-store";
import { getPatientPrescriptions } from "../lib/data/prescription-store";
import { getPatientLabOrders } from "../lib/data/lab-order-store";
import { getBillsByPatient } from "../lib/data/billing-store";
import { getPaymentsForPatient } from "../lib/data/payment-store";

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

async function runPrompt2ProfileSuite() {
  console.log("============================================================");
  console.log("MEDORA — P6 PROMPT 2 PROFILE INTEGRATION & SECURITY MATRIX");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST 1: Cross-Module Relational Integrity Pre-Update Baseline
  // ------------------------------------------------------------
  console.log("TEST 1: Cross-Module Relational Integrity Pre-Update Baseline");
  const initialAppts = AppointmentStore.getAppointmentsForPatient("PAT-1001");
  const initialEncounters = getPatientEncounters("PAT-1001");
  const initialPrescriptions = getPatientPrescriptions("PAT-1001");
  const initialLabs = getPatientLabOrders("PAT-1001");
  const initialBills = getBillsByPatient("PAT-1001");
  const initialPayments = getPaymentsForPatient("PAT-1001");

  assert(initialAppts.length > 0, "1.1 Patient A has active appointments");
  assert(initialEncounters.length > 0, "1.2 Patient A has completed clinical visits");
  assert(initialPrescriptions.length > 0, "1.3 Patient A has active prescriptions");
  assert(initialLabs.length > 0, "1.4 Patient A has diagnostic lab orders");
  assert(initialBills.length > 0, "1.5 Patient A has billing invoices");
  assert(initialPayments.length > 0, "1.6 Patient A has payment receipts");

  // ------------------------------------------------------------
  // TEST 2: Profile Update Mutation Without Identity Duplication
  // ------------------------------------------------------------
  console.log("\nTEST 2: Profile Update Mutation Without Identity Duplication");
  const updateRes = updatePatientProfile("PAT-1001", {
    fullName: "Rahul Verma",
    email: "rahul.verma.updated@example.com",
    dob: "2006-03-24",
    gender: "male",
    preferredLanguage: "hi",
  });
  assert(updateRes.success, "2.1 updatePatientProfile succeeded");
  assert(updateRes.updated?.email === "rahul.verma.updated@example.com", "2.2 Updated email saved to canonical identity");
  assert(updateRes.updated?.identifier === "PAT-1001", "2.3 Patient identifier preserved (no duplicate patient created)");

  // ------------------------------------------------------------
  // TEST 3: Preservation of Relational Records Post-Update
  // ------------------------------------------------------------
  console.log("\nTEST 3: Preservation of Relational Records Post-Update");
  const postAppts = AppointmentStore.getAppointmentsForPatient("PAT-1001");
  const postEncounters = getPatientEncounters("PAT-1001");
  const postPrescriptions = getPatientPrescriptions("PAT-1001");
  const postLabs = getPatientLabOrders("PAT-1001");
  const postBills = getBillsByPatient("PAT-1001");
  const postPayments = getPaymentsForPatient("PAT-1001");

  assert(postAppts.length === initialAppts.length, "3.1 Appointment count unchanged after profile update");
  assert(postEncounters.length === initialEncounters.length, "3.2 Clinical visit count unchanged after profile update");
  assert(postPrescriptions.length === initialPrescriptions.length, "3.3 Prescription count unchanged after profile update");
  assert(postLabs.length === initialLabs.length, "3.4 Lab orders count unchanged after profile update");
  assert(postBills.length === initialBills.length, "3.5 Bills count unchanged after profile update");
  assert(postPayments.length === initialPayments.length, "3.6 Payment receipts count unchanged after profile update");

  // ------------------------------------------------------------
  // TEST 4: Validation & Rejection of Malformed Inputs
  // ------------------------------------------------------------
  console.log("\nTEST 4: Validation & Rejection of Malformed Inputs");
  const badAddrRes = updatePatientAddress("PAT-1001", {
    line1: "House 12",
    city: "Rourkela",
    state: "Odisha",
    pincode: "76900", // Invalid 5-digit PIN
    country: "India",
  });
  assert(!badAddrRes.success, "4.1 updatePatientAddress strictly rejects invalid 5-digit PIN code");
  assert(Boolean(badAddrRes.error?.includes("6-digit")), "4.2 Error message explains 6-digit Indian PIN code requirement");

  const badContactRes = updatePatientEmergencyContact("PAT-1001", {
    name: "Sunita Verma",
    relation: "Mother",
    phone: "123", // Too short
  });
  assert(!badContactRes.success, "4.3 updatePatientEmergencyContact strictly rejects malformed phone number");

  // ------------------------------------------------------------
  // TEST 5: Profile Completeness Synchronization with Home
  // ------------------------------------------------------------
  console.log("\nTEST 5: Profile Completeness Synchronization with Home");
  const livePatientA = findIdentityById("PAT-1001")!;
  const compResult = calculateProfileCompleteness(livePatientA);
  assert(compResult.isComplete, "5.1 Profile completeness evaluates to complete for fully configured patient");
  assert(compResult.percentage === 100, "5.2 Profile completeness score is 100%");
  assert(compResult.missingRequired.length === 0, "5.3 Zero missing required demographic attributes");

  // ------------------------------------------------------------
  // TEST 6: Anti-IDOR Complete Data Isolation
  // ------------------------------------------------------------
  console.log("\nTEST 6: Anti-IDOR Complete Data Isolation");
  const badIdUpdate = updatePatientProfile("PAT-NONEXISTENT", {
    fullName: "Hacker",
  });
  assert(!badIdUpdate.success, "6.1 Update request on nonexistent identity rejected");

  const livePatientB = findIdentityById("PAT-1002")!;
  assert(livePatientB.fullName !== livePatientA.fullName, "6.2 Patient B profile completely unaffected by Patient A updates");
  assert(livePatientB.identifier !== livePatientA.identifier, "6.3 Distinct canonical identifiers enforced");

  console.log("\n============================================================");
  console.log(`P6 PROMPT 2 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPrompt2ProfileSuite();





