import { findIdentityById } from "../lib/data/identity-store";
import { compareChargeWithBenchmark, findReferenceRate, getAllReferenceRates } from "../lib/data/reference-rate-store";
import { DisputeInvestigationService } from "../lib/services/dispute-investigation-service";
import { getDisputeById } from "../lib/data/dispute-store";
import { getAllExternalCases, getExternalCaseById } from "../lib/data/external-dispute-store";
import {
  getPatientPolicies,
  getPatientClaims,
  submitInsuranceClaim,
  getAllSchemes,
  applyForGovernmentScheme,
  calculateBillCoverageBreakdown,
} from "../lib/data/patient-financial-support-store";
import { AuditLedger } from "../lib/data/audit-store";

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

async function runFinancialTransparencyAndDisputeSuite() {
  console.log("============================================================");
  console.log("MEDORA — FINAL BILL TRANSPARENCY, DISPUTE ESCALATION & SCHEMES");
  console.log("============================================================\n");

  const patient = findIdentityById("PAT-1001")!;
  const doctor = findIdentityById("DOC-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Benchmark Rate Comparison Engine
  // ------------------------------------------------------------
  console.log("TEST 1: Benchmark Rate Comparison Engine");
  const allRates = getAllReferenceRates();
  assert(allRates.length > 0, "1.1 Canonical benchmark reference catalog loaded");
  assert(allRates.every((r) => r.is_prototype === true), "1.2 All rates clearly tagged as prototype reference");

  // A. Compare MRI Brain: Hospital Charge ₹5,800 vs Benchmark ₹4,900
  const mriComp = compareChargeWithBenchmark("MRI Brain", 5800);
  assert(mriComp.has_reference === true, "1.3 Found reference benchmark for MRI Brain");
  assert(mriComp.benchmark_amount === 4900, "1.4 Benchmark rate for MRI is ₹4,900");
  assert(mriComp.difference_amount === 900, "1.5 Difference calculated as +₹900");
  assert(Math.abs(mriComp.percentage_difference - 18.4) < 0.2, "1.6 Percentage difference calculated ≈ +18.4%");
  assert(mriComp.is_above_reference === true, "1.7 Correctly flagged as above reference rate");
  assert(
    mriComp.disclaimer.includes("transparency and demo benchmark comparison"),
    "1.8 Non-accusatory disclaimer included in comparison payload"
  );

  // B. Compare Consultation: Hospital Charge ₹700 vs Benchmark ₹750
  const consComp = compareChargeWithBenchmark("Cardiology Specialist OPD Consultation", 700);
  assert(consComp.has_reference === true, "1.9 Found reference benchmark for Consultation");
  assert(consComp.is_above_reference === false, "1.10 Charge within reference range is not flagged as above");

  // C. Uncataloged Service
  const unknownComp = compareChargeWithBenchmark("Rare Gene Therapy XYZ", 50000);
  assert(unknownComp.has_reference === false, "1.11 Uncataloged service safely flagged as REFERENCE_UNAVAILABLE");

  // ------------------------------------------------------------
  // TEST 2: Smart Dispute Entry
  // ------------------------------------------------------------
  console.log("\nTEST 2: Smart Dispute Creation with Benchmark Lineage");
  const dispRes = DisputeInvestigationService.submitDispute({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    billId: "BILL-1001",
    billItemId: "BILLITEM-1002",
    serviceName: "MRI Brain (Plain / Contrast Standard)",
    chargedAmount: 5800,
    benchmarkAmount: 4900,
    differenceAmount: 900,
    referenceRateId: "REF-MRI-01",
    category: "INCORRECT_AMOUNT",
    description: "Hospital charged ₹5,800 which is ₹900 above the regional reference benchmark rate of ₹4,900. Requesting tariff verification.",
    actor: patient,
  });

  assert(dispRes.success === true && Boolean(dispRes.dispute), "2.1 Smart dispute created referencing exact line item");
  const dispute = dispRes.dispute!;
  assert(dispute.current_stage === "HOSPITAL_L1", "2.2 Initial dispute stage is HOSPITAL_L1");
  assert(dispute.status === "HOSPITAL_REVIEW_L1", "2.3 Status is HOSPITAL_REVIEW_L1");
  assert(dispute.difference_amount === 900, "2.4 Disputed difference ₹900 preserved in canonical record");

  // ------------------------------------------------------------
  // TEST 3: Multi-Stage Hospital Review (Level 1 -> Level 2 -> Level 3)
  // ------------------------------------------------------------
  console.log("\nTEST 3: Multi-Stage Hospital Dispute Review Workflow");
  
  // A. Level 1 Hospital Review -> Escalate to Level 2
  const l1Res = DisputeInvestigationService.respondHospitalLevel1({
    disputeId: dispute.id,
    explanation: "Standard 3T MRI neuro-imaging protocol with 24h rapid radiologist turnaround applied. Escalating to internal billing committee.",
    action: "ESCALATE_L2",
    actor: doctor,
  });
  assert(l1Res.success === true, "3.1 Hospital Level 1 review processed");
  assert(l1Res.dispute?.status === "HOSPITAL_REVIEW_L2", "3.2 Status transitioned to HOSPITAL_REVIEW_L2");
  assert(l1Res.dispute?.l1_response?.action === "ESCALATE_L2", "3.3 Level 1 response note preserved");

  // B. Level 2 Internal Escalation Review -> Escalate to Level 3
  const l2Res = DisputeInvestigationService.respondHospitalLevel2({
    disputeId: dispute.id,
    explanation: "Internal billing committee reviewed specialized contrast agent surcharge. Tariff adjustment not approved. Forwarding to Final Review.",
    action: "ESCALATE_L3",
    actor: doctor,
  });
  assert(l2Res.success === true, "3.4 Level 2 internal escalation processed");
  assert(l2Res.dispute?.status === "FINAL_HOSPITAL_REVIEW", "3.5 Status transitioned to FINAL_HOSPITAL_REVIEW");

  // C. Level 3 Final Hospital Review -> Mark NOT_RESOLVED -> Eligible for External Escalation
  const l3Res = DisputeInvestigationService.respondHospitalFinalLevel3({
    disputeId: dispute.id,
    explanation: "Hospital administration finalized institutional rate schedule. Dispute remains contested without mutual consensus.",
    outcome: "NOT_RESOLVED",
    actor: doctor,
  });
  assert(l3Res.success === true, "3.6 Final Hospital Review (Level 3) completed");
  assert(
    l3Res.dispute?.status === "ELIGIBLE_FOR_EXTERNAL_ESCALATION",
    "3.7 Case transitioned to ELIGIBLE_FOR_EXTERNAL_ESCALATION"
  );

  // ------------------------------------------------------------
  // TEST 4: Prototype External / Government Escalation Dossier
  // ------------------------------------------------------------
  console.log("\nTEST 4: Prototype External / Government Escalation Dossier");
  const extRes = DisputeInvestigationService.escalateToExternalGovernment({
    disputeId: dispute.id,
    escalationReason: "Hospital Level 3 final review did not resolve the ₹900 variance against the reference benchmark.",
    actor: patient,
  });

  assert(extRes.success === true && Boolean(extRes.externalCase), "4.1 External grievance dossier created");
  const extCase = extRes.externalCase!;
  assert(extCase.is_prototype === true, "4.2 Clearly identified as prototype external case");
  assert(extCase.status === "SUBMITTED_DEMO", "4.3 External case status is SUBMITTED_DEMO");
  assert(
    Boolean(extCase.submitted_snapshot.l1_explanation && extCase.submitted_snapshot.l2_explanation && extCase.submitted_snapshot.l3_final_outcome),
    "4.4 Complete history across all 3 review levels auto-packaged into snapshot"
  );
  assert(
    extCase.submitted_snapshot.evidence_nodes.length > 0,
    "4.5 Clinical orders, billing items, and audit events attached to dossier"
  );

  // Verify Audit Log
  const audits = AuditLedger.getEvents({ resourceId: dispute.id });
  assert(audits.length > 0, "4.6 Complete multi-stage lifecycle audited in AuditLedger");

  // ------------------------------------------------------------
  // TEST 5: Patient Financial Support (Insurance + Schemes + Waterfall)
  // ------------------------------------------------------------
  console.log("\nTEST 5: Patient Insurance & Government Scheme Integration");
  
  // A. Insurance Claim
  const policies = getPatientPolicies("PAT-1001");
  assert(policies.length > 0, "5.1 Retrieved patient active health insurance policies");

  const claimRes = submitInsuranceClaim({
    policyId: policies[0].id,
    billId: "BILL-1001",
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    hospitalId: "FAC-1001",
    hospitalName: "City Hospital",
    claimedAmount: 5800,
    actor: patient,
  });
  assert(claimRes.success === true, "5.2 Insurance pre-authorization claim submitted against bill");

  // B. Government Scheme Application
  const schemes = getAllSchemes();
  assert(schemes.length > 0, "5.3 Loaded government benefit schemes (PM-JAY, BSKY, RAN)");

  const schemeAppRes = applyForGovernmentScheme({
    schemeId: "SCHEME-PMJAY",
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    hospitalId: "FAC-1001",
    cardNumber: "PMJAY-9928-1029-4401",
    actor: patient,
  });
  assert(schemeAppRes.success === true, "5.4 Government health scheme applied with beneficiary card");

  // C. Unified Waterfall Coverage Calculation
  const breakdown = calculateBillCoverageBreakdown("BILL-1001");
  assert(breakdown.gross_service_charges > 0, "5.5 Gross charges calculated from canonical bill");
  assert(breakdown.insurance_coverage > 0, "5.6 Insurance coverage applied to bill liability");
  assert(
    breakdown.net_patient_responsibility === Math.max(0, breakdown.gross_service_charges - breakdown.total_coverage_applied),
    "5.7 Patient responsibility accurately derived from Gross - Coverage"
  );

  console.log("\n============================================================");
  console.log(`FINANCIAL TRANSPARENCY SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runFinancialTransparencyAndDisputeSuite();
