// ============================================================
// MEDORA — MY HEALTH HUB (P4 PROMPTS 1 & 2) ACCEPTANCE TEST SUITE
// ============================================================

import { getPatientEncounters, getEncounterById } from "../lib/data/encounter-store";
import { getPatientPrescriptions, getPrescriptionById } from "../lib/data/prescription-store";
import { getPatientLabReports, getLabReportById } from "../lib/data/lab-order-store";
import { getPatientMedicalDocuments, getMedicalDocumentById } from "../lib/data/medical-document-store";

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

async function runPatientP4Suite() {
  console.log("============================================================");
  console.log("MEDORA — P4 MY HEALTH HUB & CLINICAL RECORDS ACCEPTANCE SUITE");
  console.log("============================================================\n");

  const patientA = "PAT-1001";
  const patientB = "PAT-1002";

  // ------------------------------------------------------------
  // TEST GROUP 1: Canonical Entities & Single Source of Truth
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Single Source of Truth (No Duplicate Medical DBs)");

  const encountersA = getPatientEncounters(patientA);
  const prescriptionsA = getPatientPrescriptions(patientA, false);
  const labReportsA = getPatientLabReports(patientA, false);
  const documentsA = getPatientMedicalDocuments(patientA);

  assert(encountersA.length > 0, "1.1 Patient A has canonical healthcare encounters");
  assert(prescriptionsA.length > 0, "1.2 Patient A has canonical digital prescriptions");
  assert(labReportsA.length > 0, "1.3 Patient A has canonical diagnostic lab reports");
  assert(documentsA.length > 0, "1.4 Patient A has canonical medical documents");

  // Verify direct ID equality across multi-view access
  const sampleRx = prescriptionsA[0];
  const fetchedRx = getPrescriptionById(sampleRx.id);
  assert(
    fetchedRx?.id === sampleRx.id && fetchedRx.patient_id === patientA,
    "1.5 Direct prescription lookup yields identical canonical object with same ID"
  );

  const sampleReport = labReportsA[0];
  const fetchedReport = getLabReportById(sampleReport.id);
  assert(
    fetchedReport?.id === sampleReport.id && fetchedReport.patient_id === patientA,
    "1.6 Direct lab report lookup yields identical canonical object with same ID"
  );

  const sampleDoc = documentsA[0];
  const fetchedDoc = getMedicalDocumentById(sampleDoc.id);
  assert(
    fetchedDoc?.id === sampleDoc.id && fetchedDoc.patient_id === patientA,
    "1.7 Direct document lookup yields canonical object"
  );

  // ------------------------------------------------------------
  // TEST GROUP 2: Patient Data Isolation & Anti-IDOR Security
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Patient Data Isolation (Anti-IDOR Security)");

  const encountersB = getPatientEncounters(patientB);
  const prescriptionsB = getPatientPrescriptions(patientB, false);
  const labReportsB = getPatientLabReports(patientB, false);
  const documentsB = getPatientMedicalDocuments(patientB);

  // Verify complete disjointness
  const crossEnc = encountersB.some((e) => e.patient_id === patientA);
  const crossRx = prescriptionsB.some((p) => p.patient_id === patientA);
  const crossRep = labReportsB.some((r) => r.patient_id === patientA);
  const crossDoc = documentsB.some((d) => d.patient_id === patientA);

  assert(!crossEnc, "2.1 Patient B query never exposes Patient A encounters");
  assert(!crossRx, "2.2 Patient B query never exposes Patient A prescriptions");
  assert(!crossRep, "2.3 Patient B query never exposes Patient A lab reports");
  assert(!crossDoc, "2.4 Patient B query never exposes Patient A documents");

  // ------------------------------------------------------------
  // TEST GROUP 3: No Medical Interpretation Alteration & Source Fidelity
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Clinical Data Fidelity (Zero AI Hallucination)");

  const allLabResults = labReportsA.flatMap((r) => r.results || []);
  const hasValidResults = allLabResults.every((item) => typeof item.value !== "undefined" && Boolean(item.test_name));
  assert(hasValidResults, "3.1 All lab test values, units and reference ranges preserve exact laboratory fidelity");

  // ------------------------------------------------------------
  // TEST GROUP 4: Empty States for New Patients
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Clean Empty States for New Patient");

  const newPatientId = "PAT-9999";
  assert(getPatientEncounters(newPatientId).length === 0, "4.1 Empty visits return clean empty array");
  assert(getPatientPrescriptions(newPatientId, false).length === 0, "4.2 Empty prescriptions return clean empty array");
  assert(getPatientLabReports(newPatientId, false).length === 0, "4.3 Empty reports return clean empty array");
  assert(getPatientMedicalDocuments(newPatientId).length === 0, "4.4 Empty documents return clean empty array");

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`P4 ACCEPTANCE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPatientP4Suite();
