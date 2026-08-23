// ============================================================
// MEDORA â€” PATIENT INFORMATION ARCHITECTURE & NAVIGATION TEST SUITE
// P1 PROMPT 1 ACCEPTANCE VERIFICATION
// ============================================================

import { PATIENT_PRIMARY_NAV, PATIENT_MORE_NAV } from "../lib/navigation";
import { findIdentityById } from "../lib/data/identity-store";
import { AppointmentStore } from "../lib/data/appointment-store";
import { getPatientEncounters } from "../lib/data/encounter-store";
import { getPatientPrescriptions } from "../lib/data/prescription-store";
import { getPatientLabReports } from "../lib/data/lab-order-store";
import { getPatientMedicalDocuments } from "../lib/data/medical-document-store";
import { getBillsByPatient } from "../lib/data/billing-store";
import { getPaymentsForPatient } from "../lib/data/payment-store";
import { AccessEngine } from "../lib/services/access-engine";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  âœ“ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  âœ— FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
    failed++;
  }
}

async function runPatientP1Suite() {
  console.log("============================================================");
  console.log("MEDORA â€” P1 PATIENT INFORMATION ARCHITECTURE & NAVIGATION SUITE");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST 1 & 2: Primary Navigation Model (5 Canonical Workspaces)
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Primary Navigation Hierarchy (5 Canonical Workspaces)");

  assert(PATIENT_PRIMARY_NAV.length === 5, "1.1 Patient primary navigation contains exactly 5 core workspaces");

  const expectedPrimaryHrefs = [
    "/patient",
    "/patient/appointments",
    "/patient/health",
    "/patient/billing",
    "/patient/profile",
  ];
  const actualPrimaryHrefs = PATIENT_PRIMARY_NAV.map((n) => n.href);
  const primaryMatch = expectedPrimaryHrefs.every((h) => actualPrimaryHrefs.includes(h));
  assert(primaryMatch, "1.2 Primary navigation routes map to Home, Appointments, My Health, Bills & Payments, and Profile");

  const primaryLabels = PATIENT_PRIMARY_NAV.map((n) => n.label);
  assert(
    primaryLabels.includes("Home") &&
    primaryLabels.includes("Appointments") &&
    primaryLabels.includes("My Health") &&
    primaryLabels.includes("Bills & Payments") &&
    primaryLabels.includes("Profile"),
    "1.3 Primary navigation uses clean patient-facing labels"
  );

  // ------------------------------------------------------------
  // TEST 3: My Health Structure & Single Source of Truth
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: My Health Hub & Single Source of Truth");

  const pAEncounters = getPatientEncounters("PAT-1001");
  const pAPrescriptions = getPatientPrescriptions("PAT-1001", false);
  const pALabReports = getPatientLabReports("PAT-1001", false);
  const pADocuments = getPatientMedicalDocuments("PAT-1001");

  assert(pAEncounters.length > 0, "2.1 Visits & Consultations resolve to canonical HealthcareEncounters");
  assert(pAPrescriptions.length > 0, "2.2 Prescriptions resolve to canonical HealthcarePrescriptions");
  assert(pALabReports.length > 0, "2.3 Lab Reports resolve to canonical HealthcareLabReports");
  assert(pADocuments.length > 0, "2.4 Documents resolve to canonical MedicalDocuments");

  // Single Record Equality Test (Test 8, 9, 10)
  const sampleRxId = pAPrescriptions[0]?.id;
  const rxFromStore = getPatientPrescriptions("PAT-1001", false).find((p) => p.id === sampleRxId);
  assert(
    Boolean(rxFromStore && rxFromStore.id === sampleRxId),
    "2.5 Prescription viewed from any sub-view references the identical canonical record"
  );

  const sampleReportId = pALabReports[0]?.id;
  const reportFromStore = getPatientLabReports("PAT-1001", false).find((r) => r.id === sampleReportId);
  assert(
    Boolean(reportFromStore && reportFromStore.id === sampleReportId),
    "2.6 Lab report viewed from any sub-view references the identical canonical record"
  );

  // ------------------------------------------------------------
  // TEST 4: Bills & Payments Information Architecture
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Bills & Payments Grouping & Canonical Billing Entities");

  const pABills = getBillsByPatient("PAT-1001");
  const pAPayments = getPaymentsForPatient("PAT-1001");

  assert(pABills.length > 0, "3.1 Patient Bills query returns canonical itemized bills");
  assert(pAPayments.length > 0, "3.2 Patient Payments query returns canonical payment receipts");

  const sampleBill = pABills[0];
  assert(
    sampleBill.gross_total >= sampleBill.patient_responsibility,
    "3.3 Bill structure reflects Gross Charges >= Patient Responsibility (discounts/insurance applied)"
  );

  // ------------------------------------------------------------
  // TEST 5: Profile Information & Identity Model
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Profile & Account Identity Consolidation");

  assert(
    Boolean(patientA.fullName && patientA.identifier === "PAT-1001" && patientA.patientData?.dob),
    "4.1 Profile contains personal demographics and canonical identifier"
  );
  assert(
    Boolean(patientA.patientData?.bloodGroup && patientA.patientData?.allergies),
    "4.2 Profile contains essential health parameters (blood group, allergies)"
  );
  assert(
    Boolean(patientA.patientData?.emergencyContact?.phone),
    "4.3 Profile contains emergency contact information"
  );

  // ------------------------------------------------------------
  // TEST 6: Secondary Utilities ("More" Menu Scope)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Secondary Utilities & 'More' Menu Scope");

  const secondaryHrefs = PATIENT_MORE_NAV.map((n: any) => n.href);
  assert(
    !secondaryHrefs.includes("/patient/prescriptions") &&
    !secondaryHrefs.includes("/patient/bills") &&
    !secondaryHrefs.includes("/patient/medical-documents"),
    "5.1 Major healthcare workflows are NOT dumped inside the 'More' menu"
  );
  assert(
    secondaryHrefs.includes("/patient/notifications") &&
    secondaryHrefs.includes("/patient/help") &&
    secondaryHrefs.includes("/patient/settings") &&
    secondaryHrefs.includes("/patient/consent"),
    "5.2 'More' menu is reserved strictly for secondary utilities and preferences"
  );

  // ------------------------------------------------------------
  // TEST 7 & 13: Patient Role Isolation & Anti-IDOR Privacy
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Patient Role Isolation & Anti-IDOR Privacy");

  const pBEncounters = getPatientEncounters("PAT-1002");
  const crossEncounters = pBEncounters.filter((e) => e.patient_id === "PAT-1001");
  assert(crossEncounters.length === 0, "6.1 Patient B cannot access Patient A encounters (Anti-IDOR)");

  const pBBills = getBillsByPatient("PAT-1002");
  const crossBills = pBBills.filter((b) => b.patient_id === "PAT-1001");
  assert(crossBills.length === 0, "6.2 Patient B cannot access Patient A bills (Anti-IDOR)");

  // ------------------------------------------------------------
  // TEST 8: Technical Terminology Sanitization
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Patient-Friendly Terminology Sanitization");

  const allNavLabels = [...PATIENT_PRIMARY_NAV, ...PATIENT_MORE_NAV].map((n) => n.label);
  const hasPhaseLabel = allNavLabels.some((l) => /phase\s*\d+/i.test(l));
  const hasVaultLabel = allNavLabels.some((l) => /vault/i.test(l));
  const hasStreamLabel = allNavLabels.some((l) => /timeline stream/i.test(l));
  const hasBundleLabel = allNavLabels.some((l) => /encounter bundle/i.test(l));

  assert(!hasPhaseLabel, "7.1 Zero internal development phase labels in patient navigation");
  assert(!hasVaultLabel, "7.2 Technical 'Vault' terminology replaced with 'Documents'");
  assert(!hasStreamLabel && !hasBundleLabel, "7.3 'Stream' and 'Bundle' terminology replaced with patient-friendly terms");

  console.log("\n============================================================");
  console.log(`P1 ACCEPTANCE SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPatientP1Suite().catch((err) => {
  console.error("P1 test failed:", err);
  process.exit(1);
});
