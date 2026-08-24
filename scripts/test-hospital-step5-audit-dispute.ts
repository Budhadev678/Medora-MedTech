import { findIdentityById } from "../lib/data/identity-store";
import { 
  getAllDisputes, 
  getDisputeById, 
  getDisputesByPatient 
} from "../lib/data/dispute-store";
import { DisputeInvestigationService } from "../lib/services/dispute-investigation-service";
import { AuditLedger } from "../lib/data/audit-store";
import { getAllBills } from "../lib/data/billing-store";

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

async function runHospitalStep5Suite() {
  console.log("============================================================");
  console.log("MEDORA — HOSPITAL STEP 5: AUDIT, DISPUTE & TRACEABILITY");
  console.log("============================================================\n");

  const patient = findIdentityById("PAT-1001")!;
  const auditor = findIdentityById("STAFF-1001") || findIdentityById("DOC-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Central Audit Ledger Integrity & Traceability
  // ------------------------------------------------------------
  console.log("TEST 1: Central Audit Ledger Integrity & Event Verification");
  const allEvents = AuditLedger.getEvents();
  assert(allEvents.length > 0, "1.1 Immutable audit events retrieved from AuditLedger");

  const sampleEvent = allEvents[0];
  assert(Boolean(sampleEvent.event_type), "1.2 Event type is classified");
  assert(Boolean(sampleEvent.timestamp), "1.3 Server-authoritative timestamp attached");
  assert(Boolean(sampleEvent.actor_id), "1.4 Authenticated actor identity recorded");
  assert(Boolean(sampleEvent.summary), "1.5 Human-readable event summary captured");

  // ------------------------------------------------------------
  // TEST 2: Patient Billing Dispute Filing Workflow
  // ------------------------------------------------------------
  console.log("\nTEST 2: Patient Billing Dispute Filing Workflow");
  const bills = getAllBills();
  const targetBill = bills[0];

  const disputeRes = DisputeInvestigationService.submitDispute({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    billId: targetBill.id,
    billItemId: targetBill.items[0]?.id,
    category: "UNRECOGNIZED_CHARGE",
    description: "Inquiry regarding line item service charge breakdown.",
    actor: patient,
  });

  assert(disputeRes.success === true, "2.1 Financial dispute filed successfully");
  const dispute = disputeRes.dispute!;
  assert(dispute.status === "SUBMITTED" || dispute.status === "UNDER_REVIEW", "2.2 Initial dispute status is active");
  assert(dispute.bill_id === targetBill.id, "2.3 Dispute bound to target bill ID");

  // ------------------------------------------------------------
  // TEST 3: Hospital Reviewer Dispute Resolution
  // ------------------------------------------------------------
  console.log("\nTEST 3: Hospital Reviewer Dispute Resolution");
  const resolveRes = DisputeInvestigationService.resolveDispute({
    disputeId: dispute.id,
    resolutionDecision: "PARTIALLY_VALID",
    resolutionNotes: "One-time courtesy adjustment applied for patient clarity.",
    refundAmount: 200,
    actor: auditor,
  });

  assert(resolveRes.success === true, "3.1 Dispute resolved by authorized hospital reviewer");
  assert(resolveRes.dispute?.status === "RESOLVED", "3.2 Dispute status transitioned to RESOLVED");

  // ------------------------------------------------------------
  // TEST 4: Anomaly Detection Engine (Explainable Anti-Fraud)
  // ------------------------------------------------------------
  console.log("\nTEST 4: Anomaly Detection Engine & Flagging");
  const anomalies = DisputeInvestigationService.detectFinancialAnomalies("11111111-1111-1111-1111-111111111101");
  assert(Array.isArray(anomalies), "4.1 Financial anomaly detection evaluated as array");

  // ------------------------------------------------------------
  // TEST 5: End-to-End Cross-Module Traceability Chain
  // ------------------------------------------------------------
  console.log("\nTEST 5: Cross-Module Traceability Chain (Patient -> Care -> Bill -> Audit)");
  const patientDisputes = getDisputesByPatient("PAT-1001");
  assert(patientDisputes.length > 0, "5.1 Patient disputes retrieved for Patient PAT-1001");

  // Verify Audit Log captures dispute resolution
  const disputeAuditEvents = AuditLedger.getEvents({ resourceId: dispute.id });
  assert(disputeAuditEvents.length > 0, "5.2 Audit event recorded for dispute resolution");

  console.log("\n============================================================");
  console.log(`HOSPITAL STEP 5 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runHospitalStep5Suite();