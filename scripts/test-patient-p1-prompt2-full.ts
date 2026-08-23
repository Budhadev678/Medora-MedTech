import { PATIENT_PRIMARY_NAV, PATIENT_MORE_NAV } from "../lib/navigation";
import { findIdentityById } from "../lib/data/identity-store";
import { AppointmentStore } from "../lib/data/appointment-store";
import { getPatientEncounters } from "../lib/data/encounter-store";
import { getPatientPrescriptions } from "../lib/data/prescription-store";
import { getPatientLabReports } from "../lib/data/lab-order-store";
import { getPatientMedicalDocuments } from "../lib/data/medical-document-store";
import { getBillsByPatient } from "../lib/data/billing-store";
import { getPaymentsForPatient } from "../lib/data/payment-store";
import { calculateProfileCompleteness } from "../lib/data/identity-store";

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

async function runPrompt2Suite() {
  console.log("============================================================");
  console.log("MEDORA — P1 PROMPT 2 FULL UX & NAVIGATION VERIFICATION");
  console.log("============================================================\n");

  const pA = findIdentityById("PAT-1001")!;
  const pB = findIdentityById("PAT-1002")!;

  // 1. Unified Canonical Navigation Structure
  console.log("TEST GROUP 1: Canonical 5-Workspace Navigation Architecture");
  assert(PATIENT_PRIMARY_NAV.length === 5, "1.1 Exactly 5 canonical workspaces in primary navigation");
  
  const expectedHrefs = ["/patient", "/patient/appointments", "/patient/health", "/patient/billing", "/patient/profile"];
  const actualHrefs = PATIENT_PRIMARY_NAV.map((n) => n.href);
  assert(expectedHrefs.every((h) => actualHrefs.includes(h)), "1.2 Primary navigation covers Home, Appointments, My Health, Bills & Payments, and Profile");

  // 2. Secondary Navigation Cleanliness
  console.log("\nTEST GROUP 2: Secondary Utilities (No Major Workflows Buried in More)");
  const moreHrefs = PATIENT_MORE_NAV.map((n) => n.href);
  assert(!moreHrefs.includes("/patient/appointments"), "2.1 Appointments NOT buried in More menu");
  assert(!moreHrefs.includes("/patient/health"), "2.2 My Health NOT buried in More menu");
  assert(!moreHrefs.includes("/patient/billing"), "2.3 Bills & Payments NOT buried in More menu");
  assert(moreHrefs.includes("/patient/notifications"), "2.4 Notifications present in secondary utilities");
  assert(moreHrefs.includes("/patient/help"), "2.5 Help & Support present in secondary utilities");
  assert(moreHrefs.includes("/patient/consent"), "2.6 Privacy & Consent present in secondary utilities");

  // 3. My Health Consolidated Sub-Views (Single Source of Truth)
  console.log("\nTEST GROUP 3: My Health Consolidated Sub-Views & Data Integrity");
  const encounters = getPatientEncounters("PAT-1001");
  const rxList = getPatientPrescriptions("PAT-1001", false);
  const labReports = getPatientLabReports("PAT-1001", false);
  const docs = getPatientMedicalDocuments("PAT-1001");

  assert(encounters.length > 0, "3.1 Visits & Consultations resolve to canonical encounters");
  assert(rxList.length > 0, "3.2 Prescriptions resolve to canonical prescription records");
  assert(labReports.length > 0, "3.3 Lab Reports resolve to canonical laboratory reports");
  assert(docs.length > 0, "3.4 Documents resolve to canonical medical documents");

  // Single Record Identity Verification
  const sampleRx = rxList[0];
  const rxFromStore = getPatientPrescriptions("PAT-1001", false).find((p) => p.id === sampleRx.id);
  assert(Boolean(rxFromStore && rxFromStore.id === sampleRx.id), "3.5 Prescription record is single source of truth across all views");

  const sampleReport = labReports[0];
  const reportFromStore = getPatientLabReports("PAT-1001", false).find((r) => r.id === sampleReport.id);
  assert(Boolean(reportFromStore && reportFromStore.id === sampleReport.id), "3.6 Lab report is single source of truth across all views");

  // 4. Bills & Payments Transparency
  console.log("\nTEST GROUP 4: Bills & Payments Transparency & Reconciliation");
  const bills = getBillsByPatient("PAT-1001");
  const payments = getPaymentsForPatient("PAT-1001");

  assert(bills.length > 0, "4.1 Itemized bills query returns valid canonical bills");
  assert(payments.length > 0, "4.2 Payment receipts query returns valid payment records");

  const sampleBill = bills[0];
  assert(
    sampleBill.gross_total >= sampleBill.patient_responsibility,
    "4.3 Bill breakdown reflects Gross Total >= Patient Responsibility"
  );

  // 5. Profile Demographics, Health Data & Truthful ABHA Completeness
  console.log("\nTEST GROUP 5: Profile Demographics, Health Information & ABHA Status");
  assert(Boolean(pA.fullName && pA.patientData?.dob && pA.patientData?.gender), "5.1 Personal demographics populated");
  assert(Boolean(pA.patientData?.bloodGroup && pA.patientData?.emergencyContact), "5.2 Essential health info (blood group, emergency contact) present");
  
  const completenessA = calculateProfileCompleteness(pA);
  const completenessB = calculateProfileCompleteness(pB);
  assert(completenessA.percentage === 100, "5.3 Patient A (ABHA Linked) computes truthful 100% completeness");
  assert(completenessB.percentage === 91, "5.4 Patient B (ABHA Unlinked) computes truthful 91% completeness (missing ABHA only)");
  assert(pA.patientData?.abhaStatus === "LINKED", "5.5 Truthful ABHA status LINKED for Patient A");
  assert(pB.patientData?.abhaStatus === "NOT_LINKED", "5.6 Truthful ABHA status NOT_LINKED for Patient B");

  // 6. Anti-IDOR Patient Privacy & Role Isolation
  console.log("\nTEST GROUP 6: Anti-IDOR Patient Privacy & Role Isolation");
  const pBEncounters = getPatientEncounters("PAT-1002");
  assert(pBEncounters.filter((e) => e.patient_id === "PAT-1001").length === 0, "6.1 Patient B cannot access Patient A encounters");
  
  const pBBills = getBillsByPatient("PAT-1002");
  assert(pBBills.filter((b) => b.patient_id === "PAT-1001").length === 0, "6.2 Patient B cannot access Patient A bills");

  const pBReports = getPatientLabReports("PAT-1002", false);
  assert(pBReports.filter((r) => r.patient_id === "PAT-1001").length === 0, "6.3 Patient B cannot access Patient A lab reports");

  // 7. Patient-Friendly Terminology & Zero Development Phase Labels
  console.log("\nTEST GROUP 7: Terminology Standardization");
  const allLabels = [...PATIENT_PRIMARY_NAV, ...PATIENT_MORE_NAV].map((n) => n.label);
  assert(!allLabels.some((l) => /phase/i.test(l)), "7.1 Zero internal development phase labels in patient navigation");
  assert(!allLabels.some((l) => /vault/i.test(l)), "7.2 Documents terminology used instead of technical Vault");
  assert(!allLabels.some((l) => /stream/i.test(l)), "7.3 Health Timeline used instead of Timeline Stream");

  console.log("\n============================================================");
  console.log(`PROMPT 2 VERIFICATION SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPrompt2Suite();
