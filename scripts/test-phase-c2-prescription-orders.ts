// ============================================================
// MEDORA â€” MODIFICATION PHASE C.2 VERIFICATION TEST SUITE
// PRESCRIPTION & MEDICAL ORDER ENGINE
// ============================================================

import {
  getAllMedicines,
  searchMedicines,
  getMedicineById,
} from "../lib/data/medicine-catalog-store";
import {
  savePrescriptionDraft,
  issuePrescription,
  amendPrescription,
  cancelPrescription,
  getPrescriptionById,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getEncounterPrescriptions,
  getPrescriptionForPharmacy,
} from "../lib/data/prescription-store";
import {
  createMedicalOrder,
  cancelMedicalOrder,
  getMedicalOrderById,
  getPatientMedicalOrders,
  getEncounterMedicalOrders,
} from "../lib/data/medical-order-store";
import { PrescriptionOrderService } from "../lib/services/prescription-order-service";
import { getAllEncounters } from "../lib/data/encounter-store";
import { findIdentityById, StoredIdentity } from "../lib/data/identity-store";
import { getAuditLedger } from "../lib/data/audit-store";
import type { PrescriptionItem } from "../types/database.types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32mâœ” PASS:\x1b[0m ${testName}`);
    passedCount++;
  } else {
    console.error(`  \x1b[31mâœ˜ FAIL:\x1b[0m ${testName} ${detail ? `(${detail})` : ""}`);
    failedCount++;
  }
}

async function runPhaseC2Tests() {
  console.log("\n============================================================");
  console.log("MEDORA â€” MODIFICATION PHASE C.2 AUTOMATED VERIFICATION SUITE");
  console.log("PRESCRIPTION & MEDICAL ORDER ENGINE");
  console.log("============================================================\n");

  // Load identities
  const doc1001 = findIdentityById("DOC-1001") as StoredIdentity;
  const doc1002 = findIdentityById("DOC-1002") as StoredIdentity;
  const pat1001 = findIdentityById("PAT-1001") as StoredIdentity;
  const pat1002 = findIdentityById("PAT-1002") as StoredIdentity;
  const pharmIdentity: StoredIdentity = {
    id: "PHARM-1001",
    identifier: "PHARM-1001",
    fullName: "Sanjay Chemist",
    role: "pharmacy_staff",
    email: "sanjay@apollopharmacy.com",
    passwordHash: "Password@123",
    accountStatus: "active",
    verificationStatus: "verified",
    createdAt: new Date().toISOString(),
  };

  // ------------------------------------------------------------
  // TEST GROUP 1: MEDICINE CATALOG & SEARCH
  // ------------------------------------------------------------
  console.log("--- TEST GROUP 1: Medicine Catalog & Autocomplete Search ---");

  const allMeds = getAllMedicines();
  assert(allMeds.length >= 10, "Medicine catalog initialized with realistic medications", `Found ${allMeds.length}`);

  const paracetamolSearch = searchMedicines("paracetamol");
  assert(
    paracetamolSearch.some((m) => m.brand_name === "Dolo 650" || m.generic_name.includes("Paracetamol")),
    "Search matches generic name 'paracetamol' -> finds Dolo 650"
  );

  const brandSearch = searchMedicines("telma");
  assert(
    brandSearch.some((m) => m.generic_name === "Telmisartan"),
    "Search matches brand name 'telma' -> finds Telmisartan"
  );

  const medById = getMedicineById("MED-1001");
  assert(medById !== null && medById.generic_name === "Telmisartan", "Retrieve medicine by ID 'MED-1001'");

  // ------------------------------------------------------------
  // TEST GROUP 2: STRUCTURED PRESCRIPTION MODEL & VALIDATION
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Structured Medicine Model & Validation ---");

  // Empty items validation
  const emptyRes = await PrescriptionOrderService.issuePrescription("ENC-1001", { items: [] }, doc1001);
  assert(!emptyRes.success, "Rejects issuing prescription with 0 medicine items");

  // Missing dosage validation
  const missingDoseRes = await PrescriptionOrderService.issuePrescription(
    "ENC-1001",
    {
      items: [
        {
          id: "PRI-X",
          medicine_name: "Metformin",
          dosage: "",
          route: "ORAL",
          frequency: "Twice daily",
          duration: "30 days",
        },
      ],
    },
    doc1001
  );
  assert(!missingDoseRes.success, "Rejects medicine item with missing dosage");

  // Duplicate medicine detection helper
  const duplicateItems: PrescriptionItem[] = [
    {
      id: "PRI-1",
      medicine_name: "Telmisartan (Telma 40)",
      generic_name: "Telmisartan",
      dosage: "1 tablet",
      route: "ORAL",
      frequency: "Once daily",
      duration: "30 days",
    },
    {
      id: "PRI-2",
      medicine_name: "Telmisartan (Telmikem 40)",
      generic_name: "Telmisartan",
      dosage: "1 tablet",
      route: "ORAL",
      frequency: "Once daily",
      duration: "30 days",
    },
  ];
  const duplicatesDetected = PrescriptionOrderService.detectDuplicateMedicines(duplicateItems);
  assert(duplicatesDetected.length > 0, "Detects duplicate generic medicine in single prescription");

  // ------------------------------------------------------------
  // TEST GROUP 3: ENCOUNTER MANDATORY BINDING & DOCTOR AUTHORIZATION
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Encounter Binding & Doctor Authorization ---");

  // Missing encounter rejection
  const invalidEncRes = await PrescriptionOrderService.saveDraft(
    "ENC-NONEXISTENT",
    { items: duplicateItems.slice(0, 1) },
    doc1001
  );
  assert(!invalidEncRes.success, "Rejects creating prescription for non-existent encounter");

  // Patient attempting to prescribe
  const patientPrescribeRes = await PrescriptionOrderService.saveDraft(
    "ENC-1001",
    { items: duplicateItems.slice(0, 1) },
    pat1001
  );
  assert(!patientPrescribeRes.success, "Rejects patient role from authoring prescriptions");

  // Wrong doctor protection: Doctor B attempting to prescribe inside Doctor A's encounter
  // ENC-1001 belongs to DOC-1001
  const wrongDocRes = await PrescriptionOrderService.saveDraft(
    "ENC-1001",
    { items: duplicateItems.slice(0, 1) },
    doc1002
  );
  assert(!wrongDocRes.success, "Wrong doctor (Doctor B) rejected from prescribing in Doctor A's encounter");

  // ------------------------------------------------------------
  // TEST GROUP 4: DRAFT CREATION & PATIENT PRIVACY ISOLATION
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Draft Lifecycle & Patient Isolation ---");

  const validDraftItems: PrescriptionItem[] = [
    {
      id: "PRI-101",
      medicine_id: "MED-1008",
      medicine_name: "Metformin Hydrochloride (Glycomet 500)",
      generic_name: "Metformin Hydrochloride",
      brand_name: "Glycomet 500",
      strength: "500 mg",
      strength_value: 500,
      strength_unit: "mg",
      dosage: "1 tablet",
      dosage_quantity: 1,
      dosage_form: "tablet",
      route: "ORAL",
      frequency: "Twice daily (morning, night)",
      timing: "AFTER_FOOD",
      duration: "30 days",
      quantity: "60 tablets",
      instructions: "Take after meals with water.",
      is_prn: false,
    },
  ];

  const draftRes = await PrescriptionOrderService.saveDraft(
    "ENC-1001",
    {
      items: validDraftItems,
      notes: "Monitor fasting blood glucose weekly.",
      refills_allowed: 1,
    },
    doc1001
  );

  assert(draftRes.success && draftRes.prescription?.status === "DRAFT", "Save draft prescription successfully");

  // Verify patient portal excludes unissued drafts
  const patientRxView = PrescriptionOrderService.getPatientPrescriptions("PAT-1001", pat1001);
  const containsDraft = patientRxView.some((rx) => rx.status === "DRAFT");
  assert(!containsDraft, "Patient portal strictly hides unfinalized DRAFT prescriptions");

  // Cross-patient isolation: Patient 2 cannot see Patient 1's prescriptions
  const pat2RxView = PrescriptionOrderService.getPatientPrescriptions("PAT-1001", pat1002);
  assert(pat2RxView.length === 0, "Patient 2 cannot access Patient 1's prescriptions (Cross-patient isolation)");

  // ------------------------------------------------------------
  // TEST GROUP 5: AUTHORITATIVE ISSUANCE & IMMUTABILITY
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Authoritative Issuance & Double-Issue Prevention ---");

  const issueRes = await PrescriptionOrderService.issuePrescription(
    "ENC-1001",
    {
      items: validDraftItems,
      notes: "Strict dietary control and 30 min daily brisk walk.",
      refills_allowed: 2,
    },
    doc1001
  );

  assert(
    issueRes.success && issueRes.prescription?.status === "ISSUED",
    `Issued authoritative digital prescription (${issueRes.prescription?.id})`
  );

  const issuedRxId = issueRes.prescription!.id;

  // Double-issue prevention without amendment
  const doubleIssueRes = await PrescriptionOrderService.issuePrescription(
    "ENC-1001",
    {
      prescription_id: issuedRxId,
      items: validDraftItems,
    },
    doc1001
  );
  assert(!doubleIssueRes.success, "Rejects direct re-issue of already ISSUED prescription");

  // Verify patient portal now shows the issued prescription
  const updatedPatRxView = PrescriptionOrderService.getPatientPrescriptions("PAT-1001", pat1001);
  assert(
    updatedPatRxView.some((rx) => rx.id === issuedRxId && rx.status === "ISSUED"),
    "Patient portal now displays newly ISSUED prescription"
  );

  // ------------------------------------------------------------
  // TEST GROUP 6: FORMAL AMENDMENT & VERSION HISTORY ($V_1 \rightarrow V_2$)
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Formal Amendment & Immutable Version Snapshotting ---");

  const amendedItems: PrescriptionItem[] = [
    ...validDraftItems,
    {
      id: "PRI-102",
      medicine_id: "MED-1012",
      medicine_name: "Pantoprazole (Pan 40)",
      generic_name: "Pantoprazole",
      brand_name: "Pan 40",
      strength: "40 mg",
      strength_value: 40,
      strength_unit: "mg",
      dosage: "1 tablet",
      route: "ORAL",
      frequency: "Once daily (morning)",
      timing: "EMPTY_STOMACH",
      duration: "14 days",
      quantity: "14 tablets",
      instructions: "Take 30 minutes before breakfast.",
    },
  ];

  // Rejects amendment without clinical reason
  const noReasonAmend = await PrescriptionOrderService.amendPrescription(
    issuedRxId,
    { items: amendedItems },
    "",
    doc1001
  );
  assert(!noReasonAmend.success, "Rejects amendment without documented clinical reason");

  // Valid amendment
  const amendRes = await PrescriptionOrderService.amendPrescription(
    issuedRxId,
    { items: amendedItems },
    "Added proton pump inhibitor for dyspeptic symptoms reported during review.",
    doc1001
  );

  assert(
    amendRes.success && amendRes.prescription?.version === 2,
    "Amended prescription incremented version to v2"
  );

  assert(
    amendRes.prescription?.version_history?.length === 1 &&
      amendRes.prescription?.version_history[0].version === 1,
    "Immutable snapshot of Version 1 preserved in version_history"
  );

  // ------------------------------------------------------------
  // TEST GROUP 7: PRESCRIPTION CANCELLATION
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: Prescription Cancellation ---");

  // Rejects cancellation without reason
  const noReasonCancel = await PrescriptionOrderService.cancelPrescription(issuedRxId, "", doc1001);
  assert(!noReasonCancel.success, "Rejects cancellation without documented reason");

  // Valid cancellation
  const cancelRes = await PrescriptionOrderService.cancelPrescription(
    issuedRxId,
    "Adverse drug reaction reported; switching regimen.",
    doc1001
  );
  assert(
    cancelRes.success && cancelRes.prescription?.status === "CANCELLED",
    "Prescription marked CANCELLED with documented reason"
  );

  // ------------------------------------------------------------
  // TEST GROUP 8: MEDICAL ORDER DOMAIN ENGINE (LAB, IMAGING, REFERRAL)
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 8: Medical Orders Engine (Lab, Imaging, Referral) ---");

  // 1. Lab Order
  const labOrderRes = await PrescriptionOrderService.createMedicalOrder(
    {
      encounterId: "ENC-1001",
      orderType: "LAB",
      priority: "ROUTINE",
      clinicalIndication: "Evaluate lipid profile & HbA1c",
      labItems: [
        {
          id: "LOI-101",
          test_name: "Lipid Profile",
          test_code: "LIP-01",
          specimen_type: "Serum",
        },
      ],
    },
    doc1001
  );
  assert(
    labOrderRes.success && labOrderRes.order?.order_type === "LAB" && labOrderRes.order?.status === "ORDERED",
    `Created structured diagnostic LAB order (${labOrderRes.order?.id})`
  );

  // 2. Imaging Order
  const imgOrderRes = await PrescriptionOrderService.createMedicalOrder(
    {
      encounterId: "ENC-1001",
      orderType: "IMAGING",
      priority: "ROUTINE",
      clinicalIndication: "Chest PA View to evaluate cardiomegaly",
      imagingDetails: {
        modality: "XRAY",
        body_part: "Chest PA View",
        with_contrast: false,
      },
    },
    doc1001
  );
  assert(
    imgOrderRes.success && imgOrderRes.order?.order_type === "IMAGING",
    `Created structured IMAGING order (${imgOrderRes.order?.id})`
  );

  // 3. Specialty Referral Order
  const refOrderRes = await PrescriptionOrderService.createMedicalOrder(
    {
      encounterId: "ENC-1001",
      orderType: "REFERRAL",
      priority: "ROUTINE",
      referralDetails: {
        target_specialty: "Nephrology",
        urgency: "ROUTINE",
        referral_reason: "Evaluate microalbuminuria",
        clinical_summary: "Patient with stage 1 hypertension and borderline proteinuria.",
      },
    },
    doc1001
  );
  assert(
    refOrderRes.success && refOrderRes.order?.order_type === "REFERRAL",
    `Created structured REFERRAL order (${refOrderRes.order?.id})`
  );

  // 4. Follow-Up Order
  const followUpOrderRes = await PrescriptionOrderService.createMedicalOrder(
    {
      encounterId: "ENC-1001",
      orderType: "FOLLOW_UP",
      priority: "ROUTINE",
      followUpDetails: {
        timeframe: "2 weeks",
        instructions: "Bring home BP measurement logbook.",
      },
    },
    doc1001
  );
  assert(
    followUpOrderRes.success && followUpOrderRes.order?.order_type === "FOLLOW_UP",
    `Created structured FOLLOW_UP order (${followUpOrderRes.order?.id})`
  );

  // 5. Cancel medical order
  const cancelOrderRes = await PrescriptionOrderService.cancelMedicalOrder(
    refOrderRes.order!.id,
    "Patient requested consultation at alternate center.",
    doc1001
  );
  assert(
    cancelOrderRes.success && cancelOrderRes.order?.status === "CANCELLED",
    "Cancelled medical order with reason preservation"
  );

  // ------------------------------------------------------------
  // TEST GROUP 9: MULTI-FACILITY DOCTOR PRACTICE BINDING
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 9: Multi-Facility Doctor Practice Scoping ---");

  // ENC-1001 is at City Hospital (HSP-1001 / FAC-1001)
  const enc1001Rx = getEncounterPrescriptions("ENC-1001");
  assert(
    enc1001Rx.length > 0 && enc1001Rx[0].organization_id === "HSP-1001",
    "Prescription for ENC-1001 bound to City Hospital organization (HSP-1001)"
  );

  // ENC-1002 is at Green Care Clinic (CLN-1001 / FAC-1003)
  const enc1002Rx = getEncounterPrescriptions("ENC-1002");
  assert(
    enc1002Rx.length > 0 && enc1002Rx[0].organization_id === "CLN-1001",
    "Prescription for ENC-1002 bound to Green Care Clinic organization (CLN-1001)"
  );

  // Doctor prescriptions filtered by organization
  const docHspRx = getDoctorPrescriptions("DOC-1001", "HSP-1001");
  const docClnRx = getDoctorPrescriptions("DOC-1001", "CLN-1001");
  assert(docHspRx.every((rx) => rx.organization_id === "HSP-1001"), "Doctor prescriptions correctly filtered for HSP-1001");
  assert(docClnRx.every((rx) => rx.organization_id === "CLN-1001"), "Doctor prescriptions correctly filtered for CLN-1001");

  // ------------------------------------------------------------
  // TEST GROUP 10: PHARMACY READ BOUNDARY & SECURITY
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 10: Pharmacy Read Boundary & Least Privilege ---");

  // Rejects unauthenticated request
  const unauthPharm = PrescriptionOrderService.getPrescriptionForPharmacy("PRX-1001", null);
  assert(!unauthPharm.success, "Rejects unauthenticated pharmacy request");

  // Valid pharmacy dispensing access on PRX-1001 (Issued)
  const validPharm = PrescriptionOrderService.getPrescriptionForPharmacy("PRX-1001", pharmIdentity);
  assert(validPharm.success && validPharm.data !== undefined, "Authorized pharmacy receives dispensing payload");

  assert(
    validPharm.data?.items.length !== undefined && validPharm.data?.patient_name === "Rahul Verma",
    "Pharmacy payload includes structured medicine items and patient identity"
  );

  // Pharmacy cannot access CANCELLED prescription
  const cancelledPharm = PrescriptionOrderService.getPrescriptionForPharmacy(issuedRxId, pharmIdentity);
  assert(!cancelledPharm.success, "Pharmacy endpoint blocks dispensing CANCELLED prescription");

  // ------------------------------------------------------------
  // TEST GROUP 11: AUDIT TRAIL LOGGING
  // ------------------------------------------------------------
  console.log("\n--- TEST GROUP 11: Immutable Audit Logging ---");

  const auditEvents = getAuditLedger();
  const rxCreatedLog = auditEvents.some((e) => e.event_type.includes("PRESCRIPTION_CREATED") || e.event_type.includes("PRESCRIPTION_UPDATED"));
  const rxIssuedLog = auditEvents.some((e) => e.event_type.includes("PRESCRIPTION_ISSUED"));
  const rxAmendedLog = auditEvents.some((e) => e.event_type.includes("PRESCRIPTION_AMENDED"));
  const rxCancelledLog = auditEvents.some((e) => e.event_type.includes("PRESCRIPTION_CANCELLED"));
  const orderCreatedLog = auditEvents.some((e) => e.event_type.includes("ORDER_CREATED"));

  assert(rxCreatedLog, "Audit ledger records PRESCRIPTION_CREATED / DRAFT_SAVED");
  assert(rxIssuedLog, "Audit ledger records PRESCRIPTION_ISSUED");
  assert(rxAmendedLog, "Audit ledger records PRESCRIPTION_AMENDED");
  assert(rxCancelledLog, "Audit ledger records PRESCRIPTION_CANCELLED");
  assert(orderCreatedLog, "Audit ledger records ORDER_CREATED");

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`PHASE C.2 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhaseC2Tests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
