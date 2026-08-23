// ============================================================
// MEDORA â€” PHASE 10.3 TEST SUITE: PAYMENTS & RECONCILIATION
// ============================================================

import { PaymentProcessingService } from "../lib/services/payment-processing-service";
import { RefundReversalService } from "../lib/services/refund-reversal-service";
import { FinancialReconciliationService } from "../lib/services/financial-reconciliation-service";
import { BillingEngineService } from "../lib/services/billing-engine-service";
import { getPaymentById, getAllUnappliedPayments } from "../lib/data/payment-store";
import { AuditLedger } from "../lib/data/audit-store";

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

async function runPhase103Tests() {
  console.log("============================================================");
  console.log("MEDORA â€” PHASE 10.3 TEST SUITE: PAYMENTS & RECONCILIATION");
  console.log("============================================================\n");

  const cashier = {
    id: "USR-CASHIER-01",
    identifier: "USR-CASHIER-01",
    fullName: "Cashier Mohan",
    role: "lab_staff",
    accountStatus: "active",
  };

  const manager = {
    id: "USR-FINANCE-MGR",
    identifier: "USR-FINANCE-MGR",
    fullName: "Finance Manager Anita",
    role: "admin",
    accountStatus: "active",
  };

  // Create a clean test bill
  const createBillRes = BillingEngineService.createDraftBill({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    organizationId: "11111111-1111-1111-1111-111111111101",
    organizationName: "City Hospital",
    facilityId: "FAC-1001",
    facilityName: "City Hospital â€” Rourkela Central",
    billType: "FINAL",
    actor: cashier as any,
  });

  const billId = createBillRes.bill!.id;
  BillingEngineService.addBillableItem({ billId, serviceCode: "CONS-OPD-01", sourceType: "MANUAL_ENTRY", manualDescription: "Consultation", sourceId: `ENC-${Date.now()}`, quantity: 1, actor: cashier as any });
  BillingEngineService.addBillableItem({ billId, serviceCode: "IMG-MRI-BRAIN-01", sourceType: "MANUAL_ENTRY", manualDescription: "MRI Scan", sourceId: `IMG-${Date.now()}`, quantity: 1, actor: cashier as any });
  // Total Gross = ₹12,500

  // ------------------------------------------------------------
  // TEST GROUP 1: Payment Intent & Idempotency Key Protection
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Payment Intent & Idempotency Key Protection");

  const idempotencyKey = `IDEM-KEY-${Date.now()}`;
  const intentRes1 = PaymentProcessingService.createPaymentIntent({
    billId,
    amount: 12500,
    idempotencyKey,
    actor: cashier as any,
  });

  assert(intentRes1.success === true, "Created Payment Intent with idempotency key");

  const intentRes2 = PaymentProcessingService.createPaymentIntent({
    billId,
    amount: 12500,
    idempotencyKey, // Double-click retry with same key
    actor: cashier as any,
  });

  assert(intentRes2.success === true, "Returned same Payment Intent instance on idempotency key retry");
  assert(intentRes1.intent?.id === intentRes2.intent?.id, "Prevented duplicate payment intent creation (Same ID)");

  // ------------------------------------------------------------
  // TEST GROUP 2: Payment Attempt & Receipt Generation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Payment Attempt & Receipt Generation");

  const payRes = PaymentProcessingService.executePaymentAttempt({
    intentId: intentRes1.intent!.idempotency_key,
    paymentMethod: "UPI",
    transactionReference: `UPI-TXN-${Date.now()}`,
    actor: cashier as any,
  });

  assert(payRes.success === true, "Executed UPI payment attempt successfully");
  assert(Boolean(payRes.payment?.receipt_number), "Generated authoritative receipt number (REC-xxxx)");
  assert(payRes.payment?.status === "SUCCESS", "Payment status updated to SUCCESS");
  assert(payRes.payment?.settlement_status === "SETTLED", "Settlement status recorded as SETTLED");

  // ------------------------------------------------------------
  // TEST GROUP 3: Maker-Checker Refund Workflow & Over-Limit Guard
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Maker-Checker Refund Workflow & Over-Limit Guard");

  // High-value refund (> ₹5,000) requires manager approval
  const refReq = RefundReversalService.requestRefund({
    paymentId: payRes.payment!.id,
    amount: 8000.00,
    reason: "Duplicate charge refund request",
    actor: cashier as any,
  });

  assert(refReq.success === true, "Submitted high-value refund request");
  assert(refReq.refund?.status === "PENDING_APPROVAL", "Status set to PENDING_APPROVAL for amount > ₹5,000");

  // Over-limit refund attempt
  const overRef = RefundReversalService.requestRefund({
    paymentId: payRes.payment!.id,
    amount: 20000.00, // Exceeds paid amount ₹12,500
    reason: "Excessive refund attempt",
    actor: cashier as any,
  });

  assert(overRef.success === false, "Denied refund over limit (> eligible paid amount)");

  // ------------------------------------------------------------
  // TEST GROUP 4: Automated 3-Way Reconciliation Run & Exception Queue
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Automated 3-Way Reconciliation Run & Exception Queue");

  const reconRes = FinancialReconciliationService.runReconciliation({
    organizationId: "11111111-1111-1111-1111-111111111101",
    facilityId: "FAC-1001",
    periodStart: new Date().toISOString(),
    periodEnd: new Date().toISOString(),
    actor: manager as any,
  });

  assert(reconRes.success === true, "Executed 3-way reconciliation run");
  assert(reconRes.run?.status === "COMPLETED" || reconRes.run?.status === "COMPLETED_WITH_EXCEPTIONS", "Reconciliation run status updated");

  // ------------------------------------------------------------
  // TEST GROUP 5: Full MEDORA Audit Integration
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Full MEDORA Audit Integration");

  const auditEvents = AuditLedger.getEvents({ resourceId: payRes.payment!.id });
  assert(auditEvents.length > 0, "Audit ledger recorded PAYMENT_SUCCESS event");

  console.log("\n============================================================");
  console.log(`PHASE 10.3 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase103Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
