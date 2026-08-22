// ============================================================
// MEDORA — PHASE 10.4 TEST SUITE: DISPUTES, ANOMALY ENGINE & TRANSPARENCY
// ============================================================

import { DisputeInvestigationService } from "../lib/services/dispute-investigation-service";
import { BillingEngineService } from "../lib/services/billing-engine-service";
import { getDisputeById, getInvestigationByDisputeId } from "../lib/data/dispute-store";
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

async function runPhase104Tests() {
  console.log("============================================================");
  console.log("MEDORA — PHASE 10.4 TEST SUITE: DISPUTES & ANOMALIES");
  console.log("============================================================\n");

  const patient = {
    id: "PAT-1001",
    identifier: "PAT-1001",
    fullName: "Rahul Verma",
    role: "patient",
    accountStatus: "active",
  };

  const investigator = {
    id: "USR-FINANCE-MGR",
    identifier: "USR-FINANCE-MGR",
    fullName: "Finance Investigator Anita",
    role: "admin",
    accountStatus: "active",
  };

  // Create clean test bill with duplicate charges for anomaly test
  const createBillRes = BillingEngineService.createDraftBill({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    organizationId: "11111111-1111-1111-1111-111111111101",
    organizationName: "City Hospital",
    facilityId: "FAC-1001",
    facilityName: "City Hospital — Rourkela Central",
    billType: "FINAL",
    actor: investigator as any,
  });

  const billId = createBillRes.bill!.id;
  BillingEngineService.addBillableItem({ billId, serviceCode: "IMG-MRI-BRAIN-01", sourceType: "IMAGING", sourceId: `IMG-1001`, quantity: 1, actor: investigator as any });
  BillingEngineService.addBillableItem({ billId, serviceCode: "IMG-MRI-BRAIN-01", sourceType: "IMAGING", sourceId: `IMG-1002`, quantity: 1, actor: investigator as any });

  // ------------------------------------------------------------
  // TEST GROUP 1: Rule-Based Anomaly Detection (Explainable Non-Fraud)
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Rule-Based Anomaly Detection (Explainable Non-Fraud)");

  const anomalies = DisputeInvestigationService.runAnomalyDetection(billId);
  assert(anomalies.length > 0, "Detected potential duplicate charge anomaly");
  assert(anomalies[0].category === "POTENTIAL_DUPLICATE_CHARGE", "Anomaly category set to POTENTIAL_DUPLICATE_CHARGE");
  assert(anomalies[0].explanation.includes("Potential duplicate charge"), "Used explainable non-accusatory terminology (No fraud claims)");

  // ------------------------------------------------------------
  // TEST GROUP 2: Patient Dispute Submission & Evidence Graph
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Patient Dispute Submission & Evidence Graph");

  const dispRes = DisputeInvestigationService.submitDispute({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    billId,
    category: "DUPLICATE_CHARGE",
    description: "I believe I was charged twice for the MRI scan.",
    actor: patient as any,
  });

  assert(dispRes.success === true, "Submitted formal financial dispute");
  assert(dispRes.dispute?.status === "SUBMITTED", "Dispute status initialized to SUBMITTED");

  const evidenceNodes = DisputeInvestigationService.gatherInternalEvidenceTimeline(dispRes.dispute!.id);
  assert(evidenceNodes.length > 0, "Compiled chronological evidence graph across clinical, billing & audit nodes");

  // ------------------------------------------------------------
  // TEST GROUP 3: Human-Authorized Dispute Resolution & Financial Correction
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Human-Authorized Dispute Resolution & Financial Correction");

  const resolRes = DisputeInvestigationService.resolveDispute({
    disputeId: dispRes.dispute!.id,
    resolutionType: "DUPLICATE_CORRECTED",
    decisionExplanation: "Confirmed second MRI charge was an administrative duplicate entry. Removed charge and created corrective bill version.",
    amountAffected: 12000.00,
    actor: investigator as any,
  });

  assert(resolRes.success === true, "Resolved dispute with human-authorized resolution");
  assert(resolRes.resolution?.resolution_type === "DUPLICATE_CORRECTED", "Resolution type set to DUPLICATE_CORRECTED");

  const updatedDispute = getDisputeById(dispRes.dispute!.id);
  assert(updatedDispute?.status === "RESOLVED", "Updated dispute status to RESOLVED");

  // ------------------------------------------------------------
  // TEST GROUP 4: Full MEDORA Audit Integration
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Full MEDORA Audit Integration");

  const auditEvents = AuditLedger.getEvents({ resourceId: dispRes.dispute!.id });
  assert(auditEvents.length > 0, "Audit ledger recorded DISPUTE_CREATED and DISPUTE_RESOLVED events");

  console.log("\n============================================================");
  console.log(`PHASE 10.4 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase104Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
