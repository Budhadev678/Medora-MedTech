// ============================================================
// MEDORA â€” PHASE 7.2 TEST SUITE: DIGITAL PRESCRIPTION WORKFLOW
// ============================================================

import { PrescriptionOrderService } from "../lib/services/prescription-order-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { getPrescriptionById, getPatientPrescriptions } from "../lib/data/prescription-store";
import { findIdentityById } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";
import { PrescriptionItem } from "../types/database.types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  âœ“ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  âŒ FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase72Tests() {
  console.log("============================================================");
  console.log("MEDORA â€” PHASE 7.2 TEST SUITE: DIGITAL PRESCRIPTION WORKFLOW");
  console.log("============================================================\n");

  const today = getTodayDateStr();

  // Test Actors
  const doctorAActor = findIdentityById("DOC-1001");
  const doctorBActor = findIdentityById("DOC-1002");
  const patientAActor = findIdentityById("PAT-1001");
  const patientBActor = findIdentityById("PAT-1002");
  const pharmacyActor = findIdentityById("PHA-1001") || {
    id: "PHA-1001",
    identifier: "PHA-1001",
    fullName: "City Pharmacy Desk",
    role: "pharmacist",
    email: "pharmacy@cityhospital.org",
    accountStatus: "active",
  };

  assert(Boolean(doctorAActor), "Resolved Prescribing Doctor A (DOC-1001)");
  assert(Boolean(doctorBActor), "Resolved Other Doctor B (DOC-1002)");
  assert(Boolean(patientAActor), "Resolved Patient A (PAT-1001)");
  assert(Boolean(patientBActor), "Resolved Patient B (PAT-1002)");

  // Setup: Clean queue & encounter context
  QueueStore.reset();
  const existingQueue = QueueStore.getQueueForDoctor("DOC-1001");
  existingQueue.forEach((q) => {
    if (q.status === "IN_CONSULTATION") {
      QueueStore.saveQueueEntry({ ...q, status: "COMPLETED" });
    }
  });

  const tokenMeta = QueueStore.getNextToken("HSP-1001", "FAC-1001", "DEP-CARDIO", "DOC-1001", "SES-1001", today, "Dr. Ananya Sharma");
  const queueEntry = QueueStore.saveQueueEntry({
    id: `q-rx-${Date.now()}`,
    queue_no: `QUE-RX-${Date.now()}`,
    appointment_id: "APT-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    patient_phone: "+91 98765 43210",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    department_id: "DEP-CARDIO",
    department_name: "Cardiology OPD",
    session_id: "SES-1001",
    date: today,
    token_number: tokenMeta.tokenNumber,
    token_sequence: tokenMeta.sequenceNumber,
    source: "APPOINTMENT",
    checkin_source: "PATIENT_SELF",
    status: "CALLED",
    room_number: "Room 102",
    checked_in_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  const startRes = await ConsultationService.startConsultationFromQueue(queueEntry.id, doctorAActor);
  assert(startRes.success === true && Boolean(startRes.encounter), "Initiated active clinical encounter for prescription testing");
  const encounterId = startRes.encounter!.id;

  // ------------------------------------------------------------
  // TEST GROUP 1: Encounter Binding, Prescriber Authorization & Wrong Doctor Protection
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 1: Encounter Binding & Prescriber Authorization");

  // Doctor B attempts to compose prescription in Doctor A's encounter -> REJECTED
  const wrongDoctorRes = await PrescriptionOrderService.saveDraft(
    encounterId,
    {
      items: [
        {
          id: "PRI-X",
          medicine_name: "Unauthorized Drug",
          dosage: "1 tablet",
          route: "ORAL",
          frequency: "Once daily",
          duration: "5 days",
        },
      ],
    },
    doctorBActor
  );
  assert(wrongDoctorRes.success === false, "Doctor B composing prescription in Doctor A's encounter was REJECTED");

  // ------------------------------------------------------------
  // TEST GROUP 2: Authoritative Draft Creation & Idempotency
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Authoritative Draft Creation & Idempotency");

  const sampleItems: PrescriptionItem[] = [
    {
      id: "RXI-1",
      medicine_name: "Telmisartan (Telma 40)",
      generic_name: "Telmisartan",
      brand_name: "Telma 40",
      strength: "40 mg",
      dosage: "1 tablet",
      route: "ORAL",
      frequency: "Once daily (morning)",
      timing: "AFTER_FOOD",
      duration: "30 days",
      quantity: "30 tablets",
      instructions: "Take after breakfast with water.",
    },
  ];

  const draftRes1 = await PrescriptionOrderService.saveDraft(
    encounterId,
    { items: sampleItems, notes: "Low sodium diet advised" },
    doctorAActor
  );

  assert(draftRes1.success === true, "Saved draft prescription successfully");
  assert(Boolean(draftRes1.prescription), "Server returned authoritative prescription entity");
  assert(draftRes1.prescription?.status === "DRAFT", "Prescription status is DRAFT");
  const prescriptionId = draftRes1.prescription!.id;

  // Re-save draft (Idempotent update to same draft)
  const draftRes2 = await PrescriptionOrderService.saveDraft(
    encounterId,
    { items: sampleItems, notes: "Low sodium DASH diet (<2g/day) advised" },
    doctorAActor
  );
  assert(draftRes2.success === true, "Re-saving draft prescription succeeded");
  assert(draftRes2.prescription?.id === prescriptionId, "Same prescription ID preserved (Idempotency verified)");

  // ------------------------------------------------------------
  // TEST GROUP 3: Structured Medication Items & Field Preservation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Structured Medication Items & Field Preservation");

  const retrievedDraft = getPrescriptionById(prescriptionId);
  assert(Boolean(retrievedDraft), "Retrieved draft prescription by ID");
  assert(retrievedDraft?.items.length === 1, "Prescription contains 1 item");
  assert(retrievedDraft?.items[0].medicine_name === "Telmisartan (Telma 40)", "Preserved medicine name");
  assert(retrievedDraft?.items[0].strength === "40 mg", "Preserved strength");
  assert(retrievedDraft?.items[0].route === "ORAL", "Preserved administration route");
  assert(retrievedDraft?.items[0].instructions === "Take after breakfast with water.", "Preserved doctor instructions");

  // ------------------------------------------------------------
  // TEST GROUP 4: Duplicate Medicine Detection & Warnings
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Duplicate Medicine Detection & Warnings");

  const itemsWithDuplicate: PrescriptionItem[] = [
    ...sampleItems,
    {
      id: "RXI-2",
      medicine_name: "Telmisartan 80mg",
      generic_name: "Telmisartan",
      dosage: "1 tablet",
      route: "ORAL",
      frequency: "Once daily",
      duration: "30 days",
    },
  ];

  const duplicates = PrescriptionOrderService.detectDuplicateMedicines(itemsWithDuplicate);
  assert(duplicates.length > 0, "Detected duplicate generic medicine (Telmisartan)");
  assert(duplicates.includes("Telmisartan 80mg"), "Correct duplicate medicine identified in warning list");

  // ------------------------------------------------------------
  // TEST GROUP 5: Patient Isolation & Unfinalized Draft Visibility Guard
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Patient Isolation & Unfinalized Draft Visibility Guard");

  // Patient portal fetch without drafts option -> DRAFT prescription must NOT be returned
  const patientPrescriptions = getPatientPrescriptions("PAT-1001", false);
  assert(
    !patientPrescriptions.some((p) => p.id === prescriptionId),
    "Unfinalized DRAFT prescription strictly HIDDEN from patient portal"
  );

  // ------------------------------------------------------------
  // TEST GROUP 6: Atomic Finalization & Edit Locking
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Atomic Finalization & Edit Locking");

  // Finalize empty items -> REJECTED
  const emptyFinalize = await PrescriptionOrderService.finalizePrescription(
    encounterId,
    { items: [] },
    doctorAActor
  );
  assert(emptyFinalize.success === false, "Finalizing empty prescription was REJECTED");

  // Finalize valid prescription
  const finalizeRes = await PrescriptionOrderService.finalizePrescription(
    encounterId,
    {
      prescription_id: prescriptionId,
      items: [
        ...sampleItems,
        {
          id: "RXI-2",
          medicine_name: "Aspirin (Ecosprin 75)",
          generic_name: "Aspirin",
          strength: "75 mg",
          dosage: "1 tablet",
          route: "ORAL",
          frequency: "Once daily (night)",
          timing: "AFTER_FOOD",
          duration: "30 days",
          quantity: "30 tablets",
          instructions: "Take after dinner.",
        },
      ],
      notes: "Continue DASH diet & daily home BP chart",
    },
    doctorAActor
  );

  assert(finalizeRes.success === true, "Prescription finalized successfully");
  assert(finalizeRes.prescription?.status === "FINALIZED", "Prescription status updated to FINALIZED");
  assert(Boolean(finalizeRes.prescription?.finalized_at), "Finalized timestamp set");
  assert(Boolean(finalizeRes.prescription?.verification_token), "Verification token generated");
  assert(Boolean(finalizeRes.prescription?.digital_signature_hash), "SHA-256 digital signature hash generated");

  // Attempt ordinary draft edit on FINALIZED prescription -> REJECTED
  const editFinalizedRes = await PrescriptionOrderService.saveDraft(
    encounterId,
    { items: sampleItems },
    doctorAActor
  );
  // Ordinary draft save on finalized encounter creates a warning or is rejected/ignored
  const reCheckRx = getPrescriptionById(prescriptionId);
  assert(reCheckRx?.status === "FINALIZED", "Finalized prescription locked against unversioned overwrite");

  // ------------------------------------------------------------
  // TEST GROUP 7: Correction & Superseding Pipeline (V1 -> V2)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Correction & Superseding Pipeline (V1 -> V2)");

  const correctRes = await PrescriptionOrderService.correctPrescription(
    prescriptionId,
    {
      items: [
        {
          id: "RXI-1-CORRECTED",
          medicine_name: "Telmisartan 80mg (Telma 80)",
          generic_name: "Telmisartan",
          strength: "80 mg",
          dosage: "1 tablet",
          route: "ORAL",
          frequency: "Once daily (morning)",
          timing: "AFTER_FOOD",
          duration: "30 days",
          quantity: "30 tablets",
        },
      ],
      notes: "Increased Telmisartan dose to 80mg due to elevated BP reading.",
    },
    "Adjusted dosage due to suboptimal blood pressure control",
    doctorAActor
  );

  assert(correctRes.success === true, "Prescription corrected/superseded successfully");
  assert(correctRes.original_prescription?.status === "SUPERSEDED", "Original prescription status updated to SUPERSEDED");
  assert(correctRes.original_prescription?.superseded_by_prescription_id === correctRes.prescription?.id, "Original linked to replacement ID");
  assert(correctRes.prescription?.status === "FINALIZED", "Replacement prescription is FINALIZED");
  assert(correctRes.prescription?.supersedes_prescription_id === prescriptionId, "Replacement links back to original ID");
  assert(correctRes.prescription?.version === 2, "Replacement version incremented to 2");

  const newPrescriptionId = correctRes.prescription!.id;

  // ------------------------------------------------------------
  // TEST GROUP 8: Voiding Pipeline
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 8: Voiding Pipeline");

  const voidRes = await PrescriptionOrderService.voidPrescription(
    newPrescriptionId,
    "Prescribed in error due to patient medication allergy report",
    doctorAActor
  );

  assert(voidRes.success === true, "Prescription voided successfully");
  assert(voidRes.prescription?.status === "VOIDED", "Prescription status updated to VOIDED");
  assert(voidRes.prescription?.void_reason === "Prescribed in error due to patient medication allergy report", "Void reason recorded");

  // ------------------------------------------------------------
  // TEST GROUP 9: Phase 9 Pharmacy Handoff Foundation & Data Boundary
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 9: Phase 9 Pharmacy Handoff Foundation & Minimum Necessary Data Boundary");

  assert(Boolean(finalizeRes.phase9_handoff_event), "Finalization emitted Phase 9 handoff event payload");
  assert(finalizeRes.phase9_handoff_event.event_type === "PRESCRIPTION_FINALIZED", "Event type is PRESCRIPTION_FINALIZED");
  assert(Boolean(finalizeRes.phase9_handoff_event.idempotency_key), "Event includes stable idempotency key");

  // Pharmacy minimum necessary data payload lookup
  const pharmacyPayload = await PrescriptionOrderService.getPrescriptionForPharmacy(prescriptionId, pharmacyActor as any);
  assert(pharmacyPayload.success === true, "Pharmacy accessed minimum necessary dispensing payload");
  assert(pharmacyPayload.data?.prescription_id === prescriptionId, "Payload contains prescription reference");
  assert(Array.isArray(pharmacyPayload.data?.items), "Payload contains structured medication items");

  // ------------------------------------------------------------
  // TEST GROUP 10: Public Authenticity Verification Endpoint & Audit Trail
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 10: Public Authenticity Verification Endpoint & Audit Trail");

  const token = finalizeRes.prescription!.verification_token!;
  const verification = PrescriptionOrderService.verifyPrescriptionAuthenticity(token);
  assert(verification.found === true, "Public verification found prescription record");
  assert(verification.prescription_reference === prescriptionId, "Verification reference matches");
  assert(verification.prescriber_name === "Dr. Ananya Sharma", "Verification identifies prescriber");

  // Voided token verification
  const voidedVerification = PrescriptionOrderService.verifyPrescriptionAuthenticity(`VRF-${newPrescriptionId}`);
  assert(voidedVerification.is_valid === false, "Public verification accurately identifies VOIDED status");
  assert(voidedVerification.status === "VOIDED", "Verification status returned as VOIDED");

  // Audit Events
  const auditEvents = AuditLedger.getEvents({ resourceId: prescriptionId });
  assert(auditEvents.length > 0, "Audit ledger recorded events for prescription");
  assert(auditEvents.some((e) => e.event_type === "PRESCRIPTION_FINALIZED" || (e as any).action === "PRESCRIPTION_FINALIZED"), "Audit recorded PRESCRIPTION_FINALIZED");

  console.log("\n============================================================");
  console.log(`PHASE 7.2 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase72Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
