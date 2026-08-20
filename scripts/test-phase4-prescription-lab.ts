// ============================================================
// MEDORA — PHASE 4.3 PRESCRIPTION & LAB ORDER TEST SUITE
// ============================================================

import {
  getAllPrescriptions,
  getPrescriptionById,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getEncounterPrescriptions,
  savePrescriptionDraft,
  issuePrescription,
  cancelPrescription,
} from "../lib/data/prescription-store";
import {
  getAllLabOrders,
  getLabOrderById,
  getPatientLabOrders,
  getDoctorLabOrders,
  getAssignedLabOrders,
  saveLabOrderDraft,
  placeLabOrder,
  cancelLabOrder,
} from "../lib/data/lab-order-store";
import { getEncounterById, cancelEncounter } from "../lib/data/encounter-store";
import { getPatientAuditTimeline } from "../lib/data/audit-store";

console.log("============================================================");
console.log("MEDORA PHASE 4.3 PRESCRIPTION & LAB ORDER VERIFICATION");
console.log("============================================================\n");

let passed = 0;
let total = 0;

function assert(condition: boolean, description: string) {
  total++;
  if (condition) {
    console.log(`✓ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${description}`);
  }
}

// ------------------------------------------------------------
// TEST 1: Initial Prescription Store & Seed Data
// ------------------------------------------------------------
console.log("--- 1. Testing Prescription Store & Seed Data ---");
const allRxs = getAllPrescriptions();
assert(allRxs.length >= 2, `Prescription store initialized with ${allRxs.length} seeded prescriptions`);

const rx1 = getPrescriptionById("RX-1001");
assert(rx1 !== null && rx1.encounter_id === "ENC-1001", "Found RX-1001 attached to encounter ENC-1001");
assert(rx1?.patient_id === "PAT-1001", "RX-1001 strictly belongs to patient PAT-1001 (Rahul Verma)");
assert(rx1?.status === "ISSUED", "RX-1001 status is ISSUED");
assert(Array.isArray(rx1?.items) && rx1!.items.length === 2, `RX-1001 contains ${rx1?.items.length} structured medicines`);
assert(rx1?.items[0].medicine_name === "Telmisartan" && rx1?.items[0].strength === "40 mg", "Medicine 1 has structured name and strength");
assert(rx1?.items[0].route === "ORAL" && rx1?.items[0].dosage === "1 tablet", "Medicine 1 has structured route and dosage");
assert(rx1?.prescriber_id === "DOC-1001" && rx1?.organization_id === "HSP-1001", "RX-1001 correctly identifies prescriber and hospital");

// ------------------------------------------------------------
// TEST 2: Strict Prescription Patient Isolation
// ------------------------------------------------------------
console.log("\n--- 2. Testing Strict Prescription Patient Isolation ---");
const rahulRxs = getPatientPrescriptions("PAT-1001", false);
const priyaRxs = getPatientPrescriptions("PAT-1002", false);

assert(
  rahulRxs.every((r) => r.patient_id === "PAT-1001" && r.status !== "DRAFT"),
  `Patient PAT-1001 portal query returns exclusively finalized prescriptions (${rahulRxs.length} records)`
);
assert(
  !rahulRxs.some((r) => r.patient_id === "PAT-1002"),
  "Zero cross-patient leakage: PAT-1001 cannot see PAT-1002 prescriptions"
);
assert(priyaRxs.length === 0, "Patient PAT-1002 currently has 0 prescriptions");

// ------------------------------------------------------------
// TEST 3: Prescription Validation & Lifecycle
// ------------------------------------------------------------
console.log("\n--- 3. Testing Prescription Validation & Lifecycle ---");

// Attempt to issue prescription with 0 medicines -> REJECTED
const emptyRxRes = issuePrescription({
  encounterId: "ENC-1003",
  items: [],
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});
assert(emptyRxRes.success === false, "Issuing empty prescription (0 medicines) correctly REJECTED");

// Attempt to create prescription on non-existent encounter -> REJECTED
const orphanRxRes = issuePrescription({
  encounterId: "ENC-9999",
  items: [{ id: "RXI-1", medicine_name: "Paracetamol", dosage: "1 tablet", route: "ORAL", frequency: "SOS", duration: "3 days" }],
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});
assert(orphanRxRes.success === false, "Creating prescription for non-existent encounter correctly REJECTED");

// Save Draft on ENC-1003 (Priya's active encounter)
const draftRxRes = savePrescriptionDraft({
  encounterId: "ENC-1003",
  items: [
    {
      id: "RXI-1",
      medicine_name: "Sumatriptan",
      strength: "50 mg",
      dosage: "1 tablet",
      route: "ORAL",
      frequency: "At migraine onset (SOS)",
      duration: "5 days",
      quantity: "5 tablets",
      instructions: "Take with water at earliest sign of migraine. Max 100mg in 24h.",
    },
  ],
  notes: "Patient advised to maintain hydration and avoid bright screen exposure.",
  refillsAllowed: 0,
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});

assert(draftRxRes.success === true && !!draftRxRes.prescription, "Saved prescription draft for ENC-1003");
assert(draftRxRes.prescription?.status === "DRAFT", "Prescription status is DRAFT");

// Verify that DRAFT is hidden from patient portal
const priyaDraftCheck = getPatientPrescriptions("PAT-1002", false);
assert(priyaDraftCheck.length === 0, "Patient portal hides unissued DRAFT prescriptions");

// Issue Prescription
const issueRxRes = issuePrescription({
  prescriptionId: draftRxRes.prescription?.id,
  encounterId: "ENC-1003",
  items: draftRxRes.prescription!.items,
  notes: draftRxRes.prescription!.notes,
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});

assert(issueRxRes.success === true, `Successfully issued prescription ${issueRxRes.prescription?.id}`);
assert(issueRxRes.prescription?.status === "ISSUED", "Prescription transitioned to ISSUED");
assert(!!issueRxRes.prescription?.issued_at, "issued_at timestamp recorded");

// Verify now visible in patient portal
const priyaIssuedCheck = getPatientPrescriptions("PAT-1002", false);
assert(priyaIssuedCheck.length === 1, "Issued prescription is now visible in patient prescriptions portal");

// ------------------------------------------------------------
// TEST 4: Prescription Cancellation
// ------------------------------------------------------------
console.log("\n--- 4. Testing Prescription Cancellation ---");
if (issueRxRes.prescription) {
  // Attempt cancel without reason -> REJECTED
  const blankCancelRes = cancelPrescription(
    issueRxRes.prescription.id,
    "",
    "DOC-1001",
    "Dr. Ananya Sharma",
    "doctor"
  );
  assert(blankCancelRes.success === false, "Cancelling prescription without documented reason correctly REJECTED");

  // Cancel with valid reason
  const cancelRes = cancelPrescription(
    issueRxRes.prescription.id,
    "Migraine symptoms resolved; medication no longer required.",
    "DOC-1001",
    "Dr. Ananya Sharma",
    "doctor"
  );
  assert(cancelRes.success === true, "Cancelled prescription with documented reason");
  assert(cancelRes.prescription?.status === "CANCELLED", "Status transitioned to CANCELLED");
  assert(Boolean(cancelRes.prescription?.cancelled_at), "cancelled_at timestamp recorded");
  assert(Boolean(cancelRes.prescription?.cancellation_reason?.includes("resolved")), "Cancellation reason preserved in record");
}

// ------------------------------------------------------------
// TEST 5: Initial Lab Order Store & Seed Data
// ------------------------------------------------------------
console.log("\n--- 5. Testing Lab Order Store & Seed Data ---");
const allLabs = getAllLabOrders();
assert(allLabs.length >= 2, `Lab order store initialized with ${allLabs.length} seeded orders`);

const lab1 = getLabOrderById("LAB-ORD-1001");
assert(lab1 !== null && lab1.encounter_id === "ENC-1001", "Found LAB-ORD-1001 attached to encounter ENC-1001");
assert(lab1?.patient_id === "PAT-1001", "LAB-ORD-1001 strictly belongs to patient PAT-1001 (Rahul Verma)");
assert(lab1?.status === "ORDERED", "LAB-ORD-1001 status is ORDERED");
assert(Array.isArray(lab1?.items) && lab1!.items.length === 2, `LAB-ORD-1001 contains ${lab1?.items.length} diagnostic tests`);
assert(lab1?.priority === "ROUTINE", "LAB-ORD-1001 priority is ROUTINE");
assert(lab1?.ordering_provider_id === "DOC-1001" && lab1?.organization_id === "HSP-1001", "LAB-ORD-1001 identifies ordering doctor and hospital");

// ------------------------------------------------------------
// TEST 6: Strict Lab Order Isolation & Laboratory Scoping
// ------------------------------------------------------------
console.log("\n--- 6. Testing Lab Order Patient & Laboratory Isolation ---");
const rahulLabs = getPatientLabOrders("PAT-1001", false);
const priyaLabs = getPatientLabOrders("PAT-1002", false);

assert(
  rahulLabs.every((o) => o.patient_id === "PAT-1001" && o.status !== "DRAFT"),
  `Patient PAT-1001 portal returns exclusively finalized lab orders (${rahulLabs.length} records)`
);
assert(
  !rahulLabs.some((o) => o.patient_id === "PAT-1002"),
  "Zero cross-patient leakage: PAT-1001 cannot see PAT-1002 lab orders"
);

// Lab facility scoping: LAB-1001 should only see orders assigned to LAB-1001
const lab1001Orders = getAssignedLabOrders("LAB-1001");
assert(
  lab1001Orders.every((o) => o.laboratory_id === "LAB-1001"),
  `Laboratory LAB-1001 desk strictly queries assigned orders (${lab1001Orders.length} records)`
);

// ------------------------------------------------------------
// TEST 7: Lab Order Validation & Lifecycle
// ------------------------------------------------------------
console.log("\n--- 7. Testing Lab Order Validation & Lifecycle ---");

// Attempt to place lab order with 0 tests -> REJECTED
const emptyLabRes = placeLabOrder({
  encounterId: "ENC-1003",
  items: [],
  reason: "Test indication",
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});
assert(emptyLabRes.success === false, "Placing lab order with 0 tests correctly REJECTED");

// Attempt to place lab order with empty clinical reason -> REJECTED
const noReasonLabRes = placeLabOrder({
  encounterId: "ENC-1003",
  items: [{ id: "LOI-1", test_name: "MRI Brain", specimen_type: "Imaging" }],
  reason: "",
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});
assert(noReasonLabRes.success === false, "Placing lab order with empty clinical reason correctly REJECTED");

// Place valid Lab Order on ENC-1003
const placeLabRes = placeLabOrder({
  encounterId: "ENC-1003",
  items: [
    {
      id: "LOI-1",
      test_name: "MRI Brain with Contrast",
      test_code: "RAD-MRI-01",
      specimen_type: "Neuroimaging",
      instructions: "Screen for intracranial pathology in refractory migraine.",
    },
  ],
  priority: "URGENT",
  reason: "Rule out secondary intracranial structural lesion following acute neurological symptoms.",
  instructions: "Patient has no metallic implants. Non-contrast and contrast series.",
  laboratoryId: "LAB-1001",
  laboratoryName: "ABC Diagnostics",
  actorId: "DOC-1001",
  actorName: "Dr. Ananya Sharma",
  actorRole: "doctor",
});

assert(placeLabRes.success === true && !!placeLabRes.order, "Placed diagnostic lab order for ENC-1003");
assert(placeLabRes.order?.status === "ORDERED", "Lab order status transitioned to ORDERED");
assert(placeLabRes.order?.priority === "URGENT", "Priority set to URGENT");
assert(!!placeLabRes.order?.ordered_at, "ordered_at timestamp recorded");

// Verify visible in patient lab portal
const priyaLabCheck = getPatientLabOrders("PAT-1002", false);
assert(priyaLabCheck.length === 1, "Ordered lab request is visible in patient lab reports/orders desk");

// ------------------------------------------------------------
// TEST 8: Lab Order Cancellation
// ------------------------------------------------------------
console.log("\n--- 8. Testing Lab Order Cancellation ---");
if (placeLabRes.order) {
  const cancelLabRes = cancelLabOrder(
    placeLabRes.order.id,
    "Patient symptoms completely resolved after observation; MRI no longer clinically indicated.",
    "DOC-1001",
    "Dr. Ananya Sharma",
    "doctor"
  );
  assert(cancelLabRes.success === true, "Cancelled diagnostic lab order with documented reason");
  assert(cancelLabRes.order?.status === "CANCELLED", "Lab order status transitioned to CANCELLED");
  assert(!!cancelLabRes.order?.cancelled_at, "cancelled_at timestamp recorded");
}

// ------------------------------------------------------------
// TEST 9: Append-Only Security & Privacy Audit Trail
// ------------------------------------------------------------
console.log("\n--- 9. Testing Audit Trail Integration ---");
const auditEvents = getPatientAuditTimeline("PAT-1002");
const prescriptionLabEvents = auditEvents.filter(
  (e) =>
    e.event_type === "PRESCRIPTION_CREATED" ||
    e.event_type === "PRESCRIPTION_ISSUED" ||
    e.event_type === "PRESCRIPTION_CANCELLED" ||
    e.event_type === "LAB_ORDER_CREATED" ||
    e.event_type === "LAB_ORDER_ORDERED" ||
    e.event_type === "LAB_ORDER_CANCELLED"
);

assert(
  prescriptionLabEvents.length >= 4,
  `Audit ledger recorded ${prescriptionLabEvents.length} verifiable prescription & lab order events`
);
assert(
  prescriptionLabEvents.every((e) => !e.metadata?.userPassword && !e.metadata?.otpCode),
  "Zero sensitive credential data in prescription and lab audit logs"
);

console.log(`\n============================================================`);
console.log(`Phase 4.3 Verification Summary: ${passed}/${total} assertions PASSED.`);
console.log(`============================================================`);

if (passed === total) {
  console.log("ALL PHASE 4.3 PRESCRIPTION & LAB ORDER REQUIREMENTS SATISFIED.\n");
} else {
  process.exit(1);
}
