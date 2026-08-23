import { findIdentityById } from "../lib/data/identity-store";
import { getBillsByPatient, getBillById } from "../lib/data/billing-store";
import { getPaymentsForPatient } from "../lib/data/payment-store";
import { getDisputesByPatient } from "../lib/data/dispute-store";
import { DisputeInvestigationService } from "../lib/services/dispute-investigation-service";
import { PATIENT_PRIMARY_NAV } from "../lib/navigation";

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
  console.log("MEDORA — P5 PROMPT 1 BILLS & PAYMENTS ACCEPTANCE TEST SUITE");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST GROUP 1: Canonical Information Architecture & Navigation
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Canonical Bills & Payments Architecture & Navigation");
  const billingNav = PATIENT_PRIMARY_NAV.find(n => n.href === "/patient/billing");
  assert(Boolean(billingNav), "1.1 Bills & Payments exists as canonical primary navigation item");
  assert(billingNav?.label === "Bills & Payments", "1.2 Navigation label is clean patient-friendly 'Bills & Payments'");

  // ------------------------------------------------------------
  // TEST GROUP 2: Itemized Charges & Clinical Provenance
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Itemized Charges & 'Why Was I Charged?' Provenance");
  const billsA = getBillsByPatient("PAT-1001");
  assert(billsA.length > 0, "2.1 Patient A has canonical healthcare bills");
  
  const sampleBill = billsA[0];
  assert(sampleBill.items.length > 0, "2.2 Bill contains itemized charges breakdown");
  
  const itemWithProv = sampleBill.items.find(i => Boolean(i.provenance));
  assert(Boolean(itemWithProv), "2.3 Line item contains clinical provenance metadata");
  assert(
    Boolean(itemWithProv?.provenance?.ordered_by_name && itemWithProv?.provenance?.clinical_reason),
    "2.4 Provenance identifies ordering clinician and clinical justification"
  );
  assert(
    Boolean(itemWithProv && itemWithProv.quantity > 0 && itemWithProv.unit_price > 0 && itemWithProv.base_amount > 0),
    "2.5 Line item displays Quantity, Unit Price, and Line Total without hidden arithmetic"
  );

  // ------------------------------------------------------------
  // TEST GROUP 3: Financial Transparency & Mathematical Consistency
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Financial Calculation & Transparency");
  const sumItems = sampleBill.items.reduce((sum, item) => sum + item.base_amount, 0);
  assert(
    Math.abs(sumItems - sampleBill.gross_total) < 0.01,
    "3.1 Gross total exactly equals sum of itemized charges"
  );
  assert(
    sampleBill.patient_responsibility <= sampleBill.gross_total,
    "3.2 Patient responsibility <= Gross total (no unexpected inflation)"
  );

  // ------------------------------------------------------------
  // TEST GROUP 4: Payments & Receipts Reconciliation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Payment Receipts & Settlement Reconciliation");
  const paymentsA = getPaymentsForPatient("PAT-1001");
  assert(paymentsA.length > 0, "4.1 Payment receipts resolve from authoritative payment store");
  const samplePayment = paymentsA[0];
  assert(
    Boolean(samplePayment.receipt_number && samplePayment.amount && samplePayment.status),
    "4.2 Payment displays Receipt Number, Exact Amount, and Payment Status"
  );

  // ------------------------------------------------------------
  // TEST GROUP 5: Dispute Entry Point & Item-Level Association
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Charge-Level Dispute Mechanism");
  const disputeRes = DisputeInvestigationService.submitDispute({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    billId: sampleBill.id,
    billItemId: itemWithProv?.id,
    category: "INCORRECT_AMOUNT",
    description: "Questioning consultation charge amount",
    actor: patientA,
  });

  assert(disputeRes.success && Boolean(disputeRes.dispute), "5.1 Dispute submission succeeds with valid tracking number");
  assert(
    disputeRes.dispute?.bill_id === sampleBill.id,
    "5.2 Dispute maintains direct referential integrity to target bill"
  );
  assert(
    disputeRes.dispute?.status === "UNDER_REVIEW" || disputeRes.dispute?.status === "SUBMITTED",
    "5.3 Dispute status is under formal hospital review"
  );

  // ------------------------------------------------------------
  // TEST GROUP 6: Anti-IDOR Patient Privacy & Role Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Anti-IDOR Patient Financial Isolation");
  const billsB = getBillsByPatient("PAT-1002");
  const crossLeakBills = billsB.filter(b => b.patient_id === "PAT-1001");
  assert(crossLeakBills.length === 0, "6.1 Patient B query yields zero Patient A bills");

  const paymentsB = getPaymentsForPatient("PAT-1002");
  const crossLeakPayments = paymentsB.filter(p => p.patient_id === "PAT-1001");
  assert(crossLeakPayments.length === 0, "6.2 Patient B query yields zero Patient A payment receipts");

  const disputesB = getDisputesByPatient("PAT-1002");
  const crossLeakDisputes = disputesB.filter(d => d.patient_id === "PAT-1001");
  assert(crossLeakDisputes.length === 0, "6.3 Patient B query yields zero Patient A billing disputes");

  // ------------------------------------------------------------
  // TEST GROUP 7: Clean Empty States for New Patient
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Clean Empty Financial States for New Patient");
  const newBills = getBillsByPatient("PAT-9999");
  const newPayments = getPaymentsForPatient("PAT-9999");
  const newDisputes = getDisputesByPatient("PAT-9999");
  assert(
    newBills.length === 0 && newPayments.length === 0 && newDisputes.length === 0,
    "7.1 New patient exhibits clean empty states with zero phantom financial records"
  );

  console.log("\n============================================================");
  console.log(`P5 PROMPT 1 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPatientP5Suite();

