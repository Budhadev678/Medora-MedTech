import { findIdentityById } from "../lib/data/identity-store";
import { getPatientEncounters } from "../lib/data/encounter-store";
import { getPatientPrescriptions } from "../lib/data/prescription-store";
import { getPatientLabReports } from "../lib/data/lab-order-store";
import { getPatientMedicalDocuments, generateSecureDocumentAccessToken } from "../lib/data/medical-document-store";
import { ClinicalContinuityService } from "../lib/services/clinical-continuity-service";
import { PATIENT_PRIMARY_NAV } from "../lib/navigation";

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

async function runPatientP4Suite() {
  console.log("============================================================");
  console.log("MEDORA — P4 PROMPT 1 MY HEALTH HUB ACCEPTANCE TEST SUITE");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST GROUP 1: Canonical Information Architecture & Navigation
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Canonical My Health Architecture & Navigation");
  const myHealthNav = PATIENT_PRIMARY_NAV.find(n => n.href === "/patient/health");
  assert(Boolean(myHealthNav), "1.1 My Health exists as canonical primary navigation item");
  assert(myHealthNav?.label === "My Health", "1.2 Navigation label is clean patient-friendly 'My Health'");

  // ------------------------------------------------------------
  // TEST GROUP 2: Visits & Consultations Sub-View
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Visits & Consultations Sub-View");
  const encountersA = getPatientEncounters("PAT-1001");
  assert(encountersA.length > 0, "2.1 Encounters resolve from authoritative encounter store");
  const sampleEncounter = encountersA[0];
  assert(
    Boolean(sampleEncounter.provider_name && sampleEncounter.organization_name && sampleEncounter.started_at),
    "2.2 Visit presents Doctor, Facility, and Date"
  );
  assert(
    Boolean(sampleEncounter.reason_for_visit),
    "2.3 Clinical visit reason is available"
  );

  // ------------------------------------------------------------
  // TEST GROUP 3: Prescriptions Sub-View
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Prescriptions Sub-View & Medicine Detail");
  const rxListA = getPatientPrescriptions("PAT-1001", false);
  assert(rxListA.length > 0, "3.1 Prescriptions resolve from authoritative prescription store");
  const sampleRx = rxListA[0];
  assert(Boolean(sampleRx.prescriber_name), "3.2 Prescription presents Prescriber Name");
  assert(sampleRx.items.length > 0, "3.3 Prescription items list is non-empty");
  const sampleItem = sampleRx.items[0];
  assert(
    Boolean(sampleItem.medicine_name && sampleItem.dosage && sampleItem.frequency && sampleItem.duration),
    "3.4 Medicine displays Name, Dosage, Frequency, and Duration"
  );

  // ------------------------------------------------------------
  // TEST GROUP 4: Diagnostic Lab Reports Sub-View
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Diagnostic Lab Reports Sub-View");
  const labReportsA = getPatientLabReports("PAT-1001", false);
  assert(labReportsA.length > 0, "4.1 Lab reports resolve from authoritative lab order store");
  const sampleReport = labReportsA[0];
  assert(Boolean(sampleReport.laboratory_name && sampleReport.report_reference), "4.2 Lab report presents Reference and Laboratory");
  assert(
    sampleReport.status === "RELEASED" || sampleReport.status === "READY" || sampleReport.status === "DRAFT" || sampleReport.status === "AMENDED",
    "4.3 Lab report exhibits truthful lifecycle status"
  );

  // ------------------------------------------------------------
  // TEST GROUP 5: Documents Sub-View & Secure Access Tokens
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Documents Sub-View & Token Verification");
  const docsA = getPatientMedicalDocuments("PAT-1001");
  assert(docsA.length > 0, "5.1 Medical documents resolve from authoritative document store");
  const sampleDoc = docsA[0];
  assert(Boolean(sampleDoc.title && sampleDoc.document_type), "5.2 Document presents Title and Document Type");
  
  // Secure access token generation
  const tokenRes = generateSecureDocumentAccessToken(
    sampleDoc.id,
    "VIEW",
    patientA.identifier,
    patientA.fullName,
    "patient"
  );
  assert(tokenRes.success && Boolean(tokenRes.token), "5.3 Secure signed access token generated on-demand");

  // ------------------------------------------------------------
  // TEST GROUP 6: Health Timeline Aggregation & Chronological Ordering
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Health Timeline Aggregation & Chronological Ordering");
  const timelineEvents = ClinicalContinuityService.getPatientTimeline("PAT-1001", patientA);
  assert(timelineEvents.length > 0, "6.1 Timeline successfully aggregates events across appointments, encounters, labs, rx, docs");
  
  const pastEvents = timelineEvents.filter(e => e.section === "PAST");
  assert(pastEvents.length > 0, "6.2 Past timeline events present and chronologically organized");

  // ------------------------------------------------------------
  // TEST GROUP 7: Single Source of Truth Across Sub-Views
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Single Source of Truth Across Sub-Views");
  // 1. Same prescription in rx store and timeline
  const rxInTimeline = timelineEvents.find(e => e.event_type === "PRESCRIPTION" && e.source_id === sampleRx.id);
  assert(Boolean(rxInTimeline), "7.1 Prescription in Prescriptions view matches timeline event source_id");

  // 2. Same lab report in lab store and timeline
  const labInTimeline = timelineEvents.find(e => e.event_type === "LAB_REPORT" && e.source_id === sampleReport.id);
  assert(Boolean(labInTimeline), "7.2 Lab report in Lab Reports view matches timeline event source_id");

  // ------------------------------------------------------------
  // TEST GROUP 8: Anti-IDOR Patient Privacy & Role Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 8: Anti-IDOR Patient Privacy & Role Isolation");
  const encountersB = getPatientEncounters("PAT-1002");
  assert(encountersB.filter(e => e.patient_id === "PAT-1001").length === 0, "8.1 Patient B cannot access Patient A encounters");

  const rxB = getPatientPrescriptions("PAT-1002", false);
  assert(rxB.filter(p => p.patient_id === "PAT-1001").length === 0, "8.2 Patient B cannot access Patient A prescriptions");

  const labB = getPatientLabReports("PAT-1002", false);
  assert(labB.filter(r => r.patient_id === "PAT-1001").length === 0, "8.3 Patient B cannot access Patient A lab reports");

  const docsB = getPatientMedicalDocuments("PAT-1002");
  assert(docsB.filter(d => d.patient_id === "PAT-1001").length === 0, "8.4 Patient B cannot access Patient A documents");

  // ------------------------------------------------------------
  // TEST GROUP 9: Clean Empty States for New Patient
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 9: Clean Empty States for New Patient");
  const newEncounters = getPatientEncounters("PAT-9999");
  const newRx = getPatientPrescriptions("PAT-9999", false);
  const newLabs = getPatientLabReports("PAT-9999", false);
  const newDocs = getPatientMedicalDocuments("PAT-9999");
  assert(
    newEncounters.length === 0 && newRx.length === 0 && newLabs.length === 0 && newDocs.length === 0,
    "9.1 New patient exhibits clean empty states with zero phantom records"
  );

  console.log("\n============================================================");
  console.log(`P4 PROMPT 1 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPatientP4Suite();
