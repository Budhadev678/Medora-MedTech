import { findIdentityById } from "../lib/data/identity-store";
import { 
  getDoctorPrescriptions, 
  getPatientPrescriptions, 
  getPrescriptionById, 
  savePrescriptionDraft, 
  issuePrescription, 
  amendPrescription, 
  cancelPrescription 
} from "../lib/data/prescription-store";
import { searchMedicines, getAllMedicines } from "../lib/data/medicine-catalog-store";
import { createEncounter } from "../lib/data/encounter-store";
import { AuditLedger } from "../lib/data/audit-store";

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

async function runDoctorStep5Suite() {
  console.log("============================================================");
  console.log("MEDORA — DOCTOR SIDE STEP 5: DIGITAL PRESCRIPTION WORKFLOW");
  console.log("============================================================\n");

  const docA = findIdentityById("DOC-1001")!;
  const docB = findIdentityById("DOC-1002")!;
  const patient = findIdentityById("PAT-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Canonical Prescription Retrieval & Scoping
  // ------------------------------------------------------------
  console.log("TEST 1: Canonical Prescription Retrieval & Facility Scoping");
  const docAPrescriptions = getDoctorPrescriptions("DOC-1001");
  assert(docAPrescriptions.length > 0, "1.1 Doctor A prescriptions loaded from authoritative store");
  assert(docAPrescriptions.every(p => p.prescriber_id === "DOC-1001"), "1.2 All prescriptions strictly belong to Doctor A");

  const primaryRx = docAPrescriptions[0];
  assert(primaryRx.patient_id === "PAT-1001", "1.3 Prescription correctly references Patient PAT-1001");
  assert(Boolean(primaryRx.prescription_reference), "1.4 Prescription reference format is present");
  assert(Boolean(primaryRx.facility_id || primaryRx.organization_id), "1.5 Facility context attached to prescription");

  // ------------------------------------------------------------
  // TEST 2: Medicine Catalog Search & Selection
  // ------------------------------------------------------------
  console.log("\nTEST 2: Medicine Catalog Search & Selection");
  const allMeds = getAllMedicines();
  assert(allMeds.length >= 10, "2.1 Medicine catalog populated with standard pharmaceutical entities");
  
  const searchResults = searchMedicines("telmi");
  assert(searchResults.length > 0, "2.2 Controlled search resolves generic name 'Telmisartan'");
  assert(searchResults[0].generic_name === "Telmisartan", "2.3 Correct medicine catalog item matched");
  assert(Boolean(searchResults[0].default_strength), "2.4 Default strength present in catalog item");

  // ------------------------------------------------------------
  // TEST 3: Prescription Draft Creation & In-Place Update
  // ------------------------------------------------------------
  console.log("\nTEST 3: Prescription Draft Creation & In-Place Update");
  // Create a parent encounter first
  const encRes = createEncounter({
    patientId: "PAT-1001",
    providerId: "DOC-1001",
    organizationId: "HSP-1001",
    departmentId: "DEP-1001",
    departmentName: "Cardiology OPD",
    encounterType: "CONSULTATION",
    reasonForVisit: "Hypertension medication review",
    location: "OPD Room 102",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  const encId = encRes.encounter!.id;

  const draftRes = savePrescriptionDraft({
    encounterId: encId,
    items: [
      {
        id: "RXI-STEP5-1",
        medicine_name: "Telmisartan",
        strength: "40 mg",
        dosage: "1 tablet",
        route: "ORAL",
        frequency: "Once daily (morning)",
        duration: "30 days",
        instructions: "Take after breakfast with water.",
      },
    ],
    notes: "Follow low sodium diet.",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(draftRes.success === true, "3.1 Draft prescription created successfully");
  const draftRx = draftRes.prescription!;
  assert(draftRx.status === "DRAFT", "3.2 Initial prescription status is DRAFT");
  assert(draftRx.version === 1, "3.3 Initial version number is 1");

  // Re-save draft with an additional item (in-place update)
  const updateDraftRes = savePrescriptionDraft({
    encounterId: encId,
    items: [
      ...draftRx.items,
      {
        id: "RXI-STEP5-2",
        medicine_name: "Atorvastatin",
        strength: "10 mg",
        dosage: "1 tablet",
        route: "ORAL",
        frequency: "Once daily (night)",
        duration: "30 days",
        instructions: "Take after dinner.",
      },
    ],
    notes: "Follow low sodium diet & lipid monitoring.",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(updateDraftRes.success === true, "3.4 Draft updated in-place");
  assert(updateDraftRes.prescription?.id === draftRx.id, "3.5 In-place draft update preserves ID without creating duplicate records");
  assert(updateDraftRes.prescription?.items.length === 2, "3.6 Items array reflects updated medications");

  // ------------------------------------------------------------
  // TEST 4: Prescription Validation & Authoritative Issuance
  // ------------------------------------------------------------
  console.log("\nTEST 4: Prescription Validation & Authoritative Issuance");
  // Empty items validation
  const emptyIssueRes = issuePrescription({
    encounterId: encId,
    items: [],
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(emptyIssueRes.success === false, "4.1 Issuing empty prescription is rejected");

  // Valid issuance
  const validIssueRes = issuePrescription({
    prescriptionId: draftRx.id,
    encounterId: encId,
    items: updateDraftRes.prescription!.items,
    notes: "Review BP in 4 weeks.",
    refillsAllowed: 1,
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(validIssueRes.success === true, "4.2 Valid prescription issued successfully");
  const issuedRx = validIssueRes.prescription!;
  assert(issuedRx.status === "ISSUED", "4.3 Prescription status transitioned to ISSUED");
  assert(Boolean(issuedRx.issued_at), "4.4 Authoritative issued timestamp recorded");

  // ------------------------------------------------------------
  // TEST 5: Prescription Versioning & Amendment (v1 -> v2)
  // ------------------------------------------------------------
  console.log("\nTEST 5: Prescription Versioning & Amendment");
  const amendRes = amendPrescription({
    prescriptionId: issuedRx.id,
    amendmentReason: "Dosage adjustment based on blood pressure response",
    items: [
      {
        id: "RXI-STEP5-1",
        medicine_name: "Telmisartan",
        strength: "80 mg",
        dosage: "1 tablet",
        route: "ORAL",
        frequency: "Once daily (morning)",
        duration: "30 days",
        instructions: "Increased to 80mg daily after breakfast.",
      },
    ],
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(amendRes.success === true, "5.1 Issued prescription amended successfully");
  const version2Rx = amendRes.prescription!;
  assert(version2Rx.version === 2, "5.2 Version number incremented to 2");
  assert(Boolean(version2Rx.version_history && version2Rx.version_history.length >= 1), "5.3 Version 1 snapshot archived in version_history");
  assert(Boolean(version2Rx.version_history && version2Rx.version_history[0]?.version === 1), "5.4 Archived snapshot preserves Version 1 state");

  // ------------------------------------------------------------
  // TEST 6: Prescription Cancellation Workflow
  // ------------------------------------------------------------
  console.log("\nTEST 6: Prescription Cancellation & Non-Destructive Archival");
  const cancelRes = cancelPrescription(
    version2Rx.id,
    "Patient reported mild allergic rash",
    "DOC-1001",
    "Dr. Ananya Sharma",
    "doctor"
  );

  assert(cancelRes.success === true, "6.1 Prescription cancelled successfully");
  assert(cancelRes.prescription?.status === "CANCELLED", "6.2 Prescription status transitioned to CANCELLED");
  assert(cancelRes.prescription?.cancellation_reason === "Patient reported mild allergic rash", "6.3 Cancellation reason recorded");
  
  // Ensure record is not deleted
  const queriedRx = getPrescriptionById(version2Rx.id);
  assert(Boolean(queriedRx), "6.4 Cancelled prescription remains traceable in database");

  // ------------------------------------------------------------
  // TEST 7: Patient Portal View & Privacy Visibility
  // ------------------------------------------------------------
  console.log("\nTEST 7: Patient Portal View & Privacy Visibility");
  const patientPrescriptions = getPatientPrescriptions("PAT-1001", false);
  assert(Array.isArray(patientPrescriptions), "7.1 Patient prescriptions retrieved");
  assert(!patientPrescriptions.some(p => p.status === "DRAFT"), "7.2 Unissued DRAFT prescriptions are hidden from patient portal");

  // ------------------------------------------------------------
  // TEST 8: Anti-IDOR & Doctor Isolation Protection
  // ------------------------------------------------------------
  console.log("\nTEST 8: Anti-IDOR & Doctor Isolation Protection");
  // Doctor B attempting to issue a prescription inside Doctor A's encounter
  const unauthorizedIssue = issuePrescription({
    encounterId: encId,
    items: [
      {
        id: "RXI-ATTACK",
        medicine_name: "Illegal Prescription",
        dosage: "1 tablet",
        frequency: "Once daily",
        route: "ORAL",
        duration: "7 days",
      },
    ],
    actorId: "DOC-1002",
    actorName: "Dr. Rajesh Sharma",
    actorRole: "doctor",
  });

  assert(unauthorizedIssue.success === false, "8.1 Doctor B cannot issue prescription for Doctor A's encounter");

  // ------------------------------------------------------------
  // TEST 9: Audit Trail Recording
  // ------------------------------------------------------------
  console.log("\nTEST 9: Audit Trail Recording");
  const rxAuditEvents = AuditLedger.getEvents({ resourceId: version2Rx.id });
  assert(rxAuditEvents.length > 0, "9.1 Audit events recorded for prescription lifecycle");

  console.log("\n============================================================");
  console.log(`DOCTOR STEP 5 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runDoctorStep5Suite();