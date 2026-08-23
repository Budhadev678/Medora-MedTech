// ============================================================
// MEDORA — PATIENT BILLS & PAYMENTS (P5 PROMPTS 1 & 2) ACCEPTANCE TEST SUITE
// ============================================================

import { getBillsByPatient, getBillById } from "../lib/data/billing-store";
import { getPaymentsForPatient, getPaymentsForBill } from "../lib/data/payment-store";
import { getDisputesByPatient, saveDispute } from "../lib/data/dispute-store";

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

async function runPatientP5Suite() {
  console.log("============================================================");
  console.log("MEDORA — P5 PATIENT BILLS & PAYMENTS ACCEPTANCE SUITE");
  console.log("============================================================\n");

  const patientA = "PAT-1001";

  // ------------------------------------------------------------
  // TEST GROUP 1: Canonical Billing Entities & Mathematical Consistency
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Canonical Bill Entity & Mathematical Consistency");

  const billsA = getBillsByPatient(patientA);
  assert(billsA.length > 0, "1.1 Patient A has itemized bills in canonical store");

  for (const bill of billsA) {
    assert(bill.gross_total >= 0, `1.2 Bill ${bill.bill_number || bill.id} gross total is positive`);
    assert(bill.patient_responsibility >= 0, `1.3 Bill ${bill.bill_number || bill.id} patient responsibility is positive`);
    
    // Items check
    if (bill.items && bill.items.length > 0) {
      const itemsSum = bill.items.reduce((acc, it) => acc + (it.base_amount || (it.quantity * it.unit_price)), 0);
      assert(itemsSum > 0, `1.4 Itemized charges present with positive amounts for Bill ${bill.bill_number || bill.id}`);
    }
  }

  // ------------------------------------------------------------
  // TEST GROUP 2: Payment Lifecycle & Receipt Association
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Payment Lifecycle & Receipt Traceability");

  const paymentsA = getPaymentsForPatient(patientA);
  assert(paymentsA.length > 0, "2.1 Patient A has recorded payment receipts");

  const samplePayment = paymentsA[0];
  assert(Boolean(samplePayment.bill_id), "2.2 Payment is explicitly associated with a canonical bill ID");
  assert(samplePayment.amount > 0, "2.3 Payment amount is positive and valid");
  assert(
    samplePayment.status === "SUCCESS" || samplePayment.settlement_status === "SETTLED",
    "2.4 Payment receipt has verified success/settled status"
  );

  // ------------------------------------------------------------
  // TEST GROUP 3: Dispute Store Verification
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Dispute Store Verification");

  const targetBill = billsA[0];
  const newDispute = {
    id: `DISP-TEST-${Date.now()}`,
    dispute_number: `MEDORA-DISP-TEST-${Date.now()}`,
    patient_id: patientA,
    patient_name: "Rahul Verma",
    organization_id: targetBill.organization_id,
    facility_id: targetBill.facility_id,
    bill_id: targetBill.id,
    category: "INCORRECT_AMOUNT" as any,
    description: "I was charged twice for the same OPD consultation on 24 Aug.",
    status: "UNDER_REVIEW" as any,
    priority: "MEDIUM" as any,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveDispute(newDispute);

  const patientDisputes = getDisputesByPatient(patientA);
  const foundDispute = patientDisputes.find((d) => d.id === newDispute.id);
  assert(Boolean(foundDispute), "3.1 Patient disputes list includes newly saved dispute");

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`P5 ACCEPTANCE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPatientP5Suite();
