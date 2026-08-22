// ============================================================
// MEDORA — PHASE 10.2 TEST SUITE: COVERAGE & FINANCIAL WATERFALL
// ============================================================

import { FinancialCoverageService } from "../lib/services/financial-coverage-service";
import { BillingEngineService } from "../lib/services/billing-engine-service";
import { getBillById } from "../lib/data/billing-store";
import { findIdentityById } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase102Tests() {
  console.log("============================================================");
  console.log("MEDORA — PHASE 10.2 TEST SUITE: COVERAGE & WATERFALL");
  console.log("============================================================\n");

  const billingOfficer = {
    id: "USR-BILLING-01",
    identifier: "USR-BILLING-01",
    fullName: "Billing Manager Suresh",
    role: "lab_staff",
    accountStatus: "active",
  };

  // Create a clean test bill for Phase 10.2 isolation
  const createBillRes = BillingEngineService.createDraftBill({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    organizationId: "11111111-1111-1111-1111-111111111101",
    organizationName: "City Hospital",
    facilityId: "FAC-1001",
    facilityName: "City Hospital — Rourkela Central",
    encounterId: "ENC-1001",
    billType: "FINAL",
    actor: billingOfficer as any,
  });

  const billId = createBillRes.bill!.id;
  BillingEngineService.addBillableItem({ billId, serviceCode: "CONS-OPD-01", sourceType: "ENCOUNTER", sourceId: `ENC-${Date.now()}`, quantity: 1, actor: billingOfficer as any });
  BillingEngineService.addBillableItem({ billId, serviceCode: "IMG-MRI-BRAIN-01", sourceType: "IMAGING", sourceId: `IMG-${Date.now()}`, quantity: 1, actor: billingOfficer as any });
  BillingEngineService.addBillableItem({ billId, serviceCode: "LAB-CBC-01", sourceType: "LAB_TEST", sourceId: `LAB-${Date.now()}`, quantity: 3, actor: billingOfficer as any });

  // Gross total = 500 + 12000 + 1500 = 14,000

  // ------------------------------------------------------------
  // TEST GROUP 1: Authorized Discount Application
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Authorized Discount Application");

  const discRes = FinancialCoverageService.applyDiscount({
    billId,
    discountType: "HOSPITAL_DISCOUNT",
    amount: 1000.00,
    reason: "Manager approved hardship discount",
    actor: billingOfficer as any,
  });

  assert(discRes.success === true, "Applied authorized hospital discount of ₹1,000");

  // ------------------------------------------------------------
  // TEST GROUP 2: Insurance Allocation (Approved vs Received)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Insurance Allocation (Approved vs Received)");

  const insRes = FinancialCoverageService.allocateInsuranceCoverage({
    billId,
    policyNumber: "STAR-HEALTH-2026-88",
    providerName: "Star Health Insurance",
    requestedAmount: 10000.00,
    approvedAmount: 8000.00,
    receivedAmount: 6000.00,
    deductibleAmount: 1000.00,
    copayAmount: 1000.00,
    actor: billingOfficer as any,
  });

  assert(insRes.success === true, "Allocated insurance coverage");
  assert(insRes.coverage?.approved_amount === 8000.00, "Insurance approved amount is ₹8,000 (not requested ₹10,000)");
  assert(insRes.coverage?.received_amount === 6000.00, "Insurance received amount is ₹6,000 (distinct from approved)");

  // ------------------------------------------------------------
  // TEST GROUP 3: Government Scheme & Hospital Relief Fund
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Government Scheme & Hospital Relief Fund");

  const govtRes = FinancialCoverageService.allocateGovernmentAssistance({
    billId,
    programName: "BSKY Biju Swasthya Kalyan Yojana",
    requestedAmount: 3000.00,
    approvedAmount: 2000.00,
    actor: billingOfficer as any,
  });
  assert(govtRes.success === true, "Linked government scheme coverage (BSKY: ₹2,000)");

  // ------------------------------------------------------------
  // TEST GROUP 4: Financial Waterfall Calculation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Financial Waterfall Calculation");

  const waterfall = FinancialCoverageService.calculateFinancialWaterfall(billId);
  assert(Boolean(waterfall), "Compiled financial waterfall summary");
  assert(waterfall?.gross_charges === 14000.00, "Gross charges: ₹14,000");
  assert(waterfall?.discounts_total === 1000.00, "Discounts total: ₹1,000");
  assert(waterfall?.net_billable_total === 13000.00, "Net billable total: ₹13,000");
  assert(waterfall?.insurance_approved_total === 8000.00, "Insurance approved total: ₹8,000");
  assert(waterfall?.govt_assistance_approved_total === 2000.00, "Government assistance approved total: ₹2,000");
  assert(waterfall?.projected_patient_responsibility === 3000.00, "Projected patient responsibility: ₹3,000 (13,000 - 10,000 support)");

  // ------------------------------------------------------------
  // TEST GROUP 5: Full MEDORA Audit Integration
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Full MEDORA Audit Integration");

  const auditEvents = AuditLedger.getEvents({ resourceId: discRes.discount!.id });
  assert(auditEvents.length > 0, "Audit ledger recorded DISCOUNT_APPLIED event");

  console.log("\n============================================================");
  console.log(`PHASE 10.2 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase102Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
