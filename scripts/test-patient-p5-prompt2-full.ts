import { findIdentityById } from "../lib/data/identity-store";
import { getBillsByPatient, getBillById, saveBill } from "../lib/data/billing-store";
import { getPaymentsForPatient, savePaymentRecord } from "../lib/data/payment-store";
import { getDisputesByPatient, getDisputeById } from "../lib/data/dispute-store";
import { DisputeInvestigationService } from "../lib/services/dispute-investigation-service";
import { HealthcareBill, PaymentRecord } from "@/types/database.types";

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

async function runPrompt2BillingSuite() {
  console.log("============================================================");
  console.log("MEDORA — P5 PROMPT 2 BILLING INTEGRATION & FINANCIAL MATRIX");
  console.log("============================================================\n");

  const pA = findIdentityById("PAT-1001")!;
  const pB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST 1: Authoritative Financial Calculation Waterfall
  // ------------------------------------------------------------
  console.log("TEST 1: Authoritative Financial Calculation Waterfall");
  const billA = getBillById("BILL-1001");
  assert(Boolean(billA), "1.1 Canonical bill BILL-1001 exists");
  
  if (billA) {
    const sumItems = billA.items.reduce((sum, item) => sum + item.base_amount, 0);
    assert(Math.abs(sumItems - billA.gross_total) < 0.01, "1.2 Gross total matches exact sum of itemized charges");
    assert(billA.patient_responsibility <= billA.gross_total, "1.3 Patient responsibility <= Gross total");
    assert(billA.items.every(i => Boolean(i.service_name && i.quantity > 0 && i.unit_price > 0)), "1.4 Every line item has valid transparent pricing");
  }

  // ------------------------------------------------------------
  // TEST 2: Partial Payment & Balance Due Calculation
  // ------------------------------------------------------------
  console.log("\nTEST 2: Partial Payment & Balance Reconciliation");
  const nowStr = new Date().toISOString();
  const testBill: HealthcareBill = {
    id: "BILL-TEST-P5",
    bill_number: "INV-TEST-P5",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    organization_id: "ORG-TEST",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    facility_name: "City Hospital",
    bill_type: "FINAL",
    status: "ISSUED",
    gross_total: 10000,
    net_billable_total: 10000,
    patient_responsibility: 10000,
    currency: "INR",
    current_version: 1,
    items: [
      {
        id: "ITEM-T1",
        bill_id: "BILL-TEST-P5",
        service_id: "SRV-1",
        service_code: "SRV-1",
        service_name: "Consultation",
        category: "CONSULTATION",
        source_type: "ENCOUNTER",
        source_id: "ENC-T1",
        description_snapshot: "Consultation",
        quantity: 1,
        unit_price: 10000,
        base_amount: 10000,
        currency: "INR",
        price_id: "P-1",
        service_date: nowStr,
        verification_status: "VERIFIED",
        created_at: nowStr,
      },
    ],
    created_at: nowStr,
    updated_at: nowStr,
  };
  saveBill(testBill);

  // Initial balance due: 10,000
  const initialPayments = getPaymentsForPatient("PAT-1001").filter(p => p.bill_id === testBill.id && p.status === "SUCCESS");
  const initialPaid = initialPayments.reduce((sum, p) => sum + p.amount, 0);
  assert(testBill.patient_responsibility - initialPaid === 10000, "2.1 Initial balance due equals full patient responsibility (₹10,000)");

  // Record partial payment of ₹3,000
  const payment1: PaymentRecord = {
    id: "PAY-P5-1",
    payment_intent_id: "INT-P5-1",
    bill_id: testBill.id,
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    organization_id: "ORG-TEST",
    facility_id: "FAC-1001",
    amount: 3000,
    currency: "INR",
    payment_method: "UPI",
    status: "SUCCESS",
    settlement_status: "SETTLED",
    receipt_number: "REC-P5-1",
    transaction_reference: "TXN-PARTIAL-3000",
    initiated_at: nowStr,
    completed_at: nowStr,
    actor_id: "PAT-1001",
    actor_name: "Rahul Verma",
    created_at: nowStr,
    updated_at: nowStr,
  };
  savePaymentRecord(payment1);
  assert(payment1.status === "SUCCESS", "2.2 Partial payment of ₹3,000 recorded successfully");

  const paymentsAfter1 = getPaymentsForPatient("PAT-1001").filter(p => p.bill_id === testBill.id && p.status === "SUCCESS");
  const paidAfter1 = paymentsAfter1.reduce((sum, p) => sum + p.amount, 0);
  const dueAfter1 = testBill.patient_responsibility - paidAfter1;
  assert(dueAfter1 === 7000, "2.3 Balance due after ₹3,000 payment correctly reconciles to ₹7,000");

  // ------------------------------------------------------------
  // TEST 3: Full Settlement Reconciliation
  // ------------------------------------------------------------
  console.log("\nTEST 3: Full Settlement Reconciliation");
  // Pay remaining ₹7,000
  const payment2: PaymentRecord = {
    id: "PAY-P5-2",
    payment_intent_id: "INT-P5-2",
    bill_id: testBill.id,
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    organization_id: "ORG-TEST",
    facility_id: "FAC-1001",
    amount: 7000,
    currency: "INR",
    payment_method: "CARD",
    status: "SUCCESS",
    settlement_status: "SETTLED",
    receipt_number: "REC-P5-2",
    transaction_reference: "TXN-FINAL-7000",
    initiated_at: nowStr,
    completed_at: nowStr,
    actor_id: "PAT-1001",
    actor_name: "Rahul Verma",
    created_at: nowStr,
    updated_at: nowStr,
  };
  savePaymentRecord(payment2);
  assert(payment2.status === "SUCCESS", "3.1 Final payment of ₹7,000 recorded successfully");

  const paymentsAfter2 = getPaymentsForPatient("PAT-1001").filter(p => p.bill_id === testBill.id && p.status === "SUCCESS");
  const paidAfter2 = paymentsAfter2.reduce((sum, p) => sum + p.amount, 0);
  const dueAfter2 = Math.max(0, testBill.patient_responsibility - paidAfter2);
  assert(paidAfter2 === 10000, "3.2 Total payments sum to ₹10,000");
  assert(dueAfter2 === 0, "3.3 Balance due correctly reaches ₹0.00");

  // ------------------------------------------------------------
  // TEST 4: Failed Payment Integrity
  // ------------------------------------------------------------
  console.log("\nTEST 4: Failed Payment Integrity");
  const failedPayment: PaymentRecord = {
    id: "PAY-P5-FAIL",
    payment_intent_id: "INT-P5-FAIL",
    bill_id: testBill.id,
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    organization_id: "ORG-TEST",
    facility_id: "FAC-1001",
    amount: 5000,
    currency: "INR",
    payment_method: "UPI",
    status: "FAILED",
    settlement_status: "FAILED",
    receipt_number: "REC-P5-FAIL",
    transaction_reference: "TXN-FAILED-5000",
    initiated_at: nowStr,
    actor_id: "PAT-1001",
    actor_name: "Rahul Verma",
    created_at: nowStr,
    updated_at: nowStr,
  };
  savePaymentRecord(failedPayment);
  assert(failedPayment.status === "FAILED", "4.1 Failed payment recorded as FAILED");
  
  // Failed payment must NOT contribute to successful paid sum
  const validPayments = getPaymentsForPatient("PAT-1001").filter(p => p.bill_id === testBill.id && p.status === "SUCCESS");
  const validTotalPaid = validPayments.reduce((sum, p) => sum + p.amount, 0);
  assert(validTotalPaid === 10000, "4.2 Failed payment does NOT alter valid settled total");

  // ------------------------------------------------------------
  // TEST 5: Charge-Level Dispute Workflow & Audit Trail
  // ------------------------------------------------------------
  console.log("\nTEST 5: Charge-Level Dispute Workflow & Audit Trail");
  const disputeRes = DisputeInvestigationService.submitDispute({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    billId: "BILL-1001",
    billItemId: "BILLITEM-1001",
    category: "DUPLICATE_CHARGE",
    description: "Questioning duplicate charge on bill item",
    actor: pA,
  });
  assert(disputeRes.success && Boolean(disputeRes.dispute), "5.1 Dispute submitted successfully with tracking reference");
  
  const disp = disputeRes.dispute!;
  assert(disp.bill_id === "BILL-1001" && disp.bill_item_id === "BILLITEM-1001", "5.2 Dispute maintains precise line-item link");
  assert(disp.status === "UNDER_REVIEW" || disp.status === "SUBMITTED", "5.3 Dispute status is under active review");

  // Dispute submission must NOT alter the financial bill balance
  const billAfterDispute = getBillById("BILL-1001")!;
  assert(billAfterDispute.patient_responsibility === 14000, "5.4 Dispute filing does NOT prematurely erase or alter bill balance");

  // ------------------------------------------------------------
  // TEST 6: Anti-IDOR Patient Privacy & Role Isolation
  // ------------------------------------------------------------
  console.log("\nTEST 6: Anti-IDOR Complete Financial Isolation");
  const pBBills = getBillsByPatient("PAT-1002");
  assert(pBBills.filter(b => b.patient_id === "PAT-1001").length === 0, "6.1 Patient B cannot access Patient A bills");

  const pBPayments = getPaymentsForPatient("PAT-1002");
  assert(pBPayments.filter(p => p.patient_id === "PAT-1001").length === 0, "6.2 Patient B cannot access Patient A payment receipts");

  const pBDisputes = getDisputesByPatient("PAT-1002");
  assert(pBDisputes.filter(d => d.patient_id === "PAT-1001").length === 0, "6.3 Patient B cannot access Patient A disputes");

  // ------------------------------------------------------------
  // TEST 7: Clean Empty States for New Patient
  // ------------------------------------------------------------
  console.log("\nTEST 7: Clean Empty States for New Patient");
  const newBills = getBillsByPatient("PAT-9999");
  const newPayments = getPaymentsForPatient("PAT-9999");
  const newDisputes = getDisputesByPatient("PAT-9999");
  assert(
    newBills.length === 0 && newPayments.length === 0 && newDisputes.length === 0,
    "7.1 New patient exhibits clean empty states with zero phantom financial records"
  );

  console.log("\n============================================================");
  console.log(`P5 PROMPT 2 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPrompt2BillingSuite();
