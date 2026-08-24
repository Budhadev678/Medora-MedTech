// ============================================================
// MEDORA — PATIENT FINANCIAL SUPPORT STORE & COVERAGE ENGINE
// Server-Authoritative Insurance, Government Health Schemes & Financial Assistance
// Clearly labeled as prototype/demo reference data
// ============================================================

import { getBillById } from "@/lib/data/billing-store";
import { getPaymentsForBill } from "@/lib/data/payment-store";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { StoredIdentity } from "@/lib/data/identity-store";

export type ClaimStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PARTIALLY_APPROVED"
  | "REJECTED"
  | "SETTLED";

export type SchemeApplicationStatus =
  | "NOT_APPLIED"
  | "APPLIED"
  | "UNDER_REVIEW"
  | "ELIGIBLE"
  | "NOT_ELIGIBLE"
  | "APPROVED"
  | "REJECTED";

export interface InsurancePolicy {
  id: string; // e.g. "POL-1001"
  patient_id: string; // e.g. "PAT-1001"
  policy_number: string; // e.g. "MED-STAR-88392"
  tpa_name: string; // "MediAssist TPA"
  insurer_name: string; // "Star Health & Allied Insurance (Demo)"
  plan_name: string; // "Family Health Optima Comprehensive"
  sum_insured: number; // 500000
  cumulative_bonus: number; // 50000
  balance_sum_insured: number; // 475000
  co_pay_percentage: number; // 10
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  is_demo: boolean;
  network_type: "CASHLESS_EMPANELLED" | "REIMBURSEMENT_ONLY";
}

export interface InsuranceClaim {
  id: string; // e.g. "CLM-1001"
  claim_number: string; // e.g. "MEDORA-CLM-1001"
  policy_id: string;
  patient_id: string;
  patient_name: string;
  hospital_id: string;
  hospital_name: string;
  bill_id: string;
  claimed_amount: number;
  approved_amount: number;
  deductible_amount: number;
  co_pay_amount: number;
  patient_responsibility: number;
  status: ClaimStatus;
  remarks?: string;
  settlement_date?: string;
  created_at: string;
  updated_at: string;
  is_demo: boolean;
}

export interface GovernmentHealthScheme {
  id: string; // e.g. "SCHEME-PMJAY"
  scheme_code: "PMJAY" | "BSKY" | "ABHA_PLUS" | "RAN";
  name: string; // "Ayushman Bharat PM-JAY (Demo Reference)"
  full_name: string; // "Pradhan Mantri Jan Arogya Yojana"
  sponsor: "CENTRAL_GOVERNMENT" | "STATE_GOVERNMENT";
  annual_benefit_limit: number; // 500000
  eligible_categories: string[];
  benefits_summary: string;
  nodal_agency: string;
  is_demo: boolean;
}

export interface SchemeApplication {
  id: string; // e.g. "SCHAPP-1001"
  scheme_id: string;
  scheme_code: string;
  patient_id: string;
  patient_name: string;
  hospital_id: string;
  card_or_ration_number: string;
  status: SchemeApplicationStatus;
  authorized_amount: number;
  verified_by?: string;
  applied_at: string;
  approved_at?: string;
  is_demo: boolean;
}

export interface FinancialAssistanceGrant {
  id: string; // e.g. "CHARITY-1001"
  patient_id: string;
  bill_id: string;
  hospital_id: string;
  trust_name: string; // "City Hospital Community Relief Fund"
  amount_granted: number;
  status: "APPROVED" | "PENDING";
  approved_at: string;
}

export interface BillCoverageBreakdown {
  bill_id: string;
  gross_service_charges: number;
  hospital_adjustments: number;
  insurance_coverage: number;
  government_scheme_coverage: number;
  financial_assistance: number;
  total_coverage_applied: number;
  net_patient_responsibility: number;
  amount_paid: number;
  outstanding_amount: number;
  disputed_amount: number;
  refunded_amount: number;
}

// ------------------------------------------------------------
// CANONICAL SEED DATA
// ------------------------------------------------------------

export const SEEDED_POLICIES: InsurancePolicy[] = [
  {
    id: "POL-1001",
    patient_id: "PAT-1001",
    policy_number: "MED-STAR-88392",
    tpa_name: "MediAssist TPA (Demo)",
    insurer_name: "Star Health & Allied Insurance (Demo Benchmark)",
    plan_name: "Comprehensive Inpatient Care Gold",
    sum_insured: 500000,
    cumulative_bonus: 50000,
    balance_sum_insured: 475000,
    co_pay_percentage: 10,
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    is_active: true,
    is_demo: true,
    network_type: "CASHLESS_EMPANELLED",
  },
];

export const SEEDED_CLAIMS: InsuranceClaim[] = [
  {
    id: "CLM-1001",
    claim_number: "MEDORA-CLM-1001",
    policy_id: "POL-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    hospital_id: "FAC-1001",
    hospital_name: "City Hospital",
    bill_id: "BILL-1001",
    claimed_amount: 5800,
    approved_amount: 4500,
    deductible_amount: 0,
    co_pay_amount: 500,
    patient_responsibility: 800,
    status: "UNDER_REVIEW",
    remarks: "Pre-authorization approved for baseline diagnostic imaging.",
    created_at: "2026-08-22T10:00:00Z",
    updated_at: "2026-08-22T10:00:00Z",
    is_demo: true,
  },
];

export const SEEDED_SCHEMES: GovernmentHealthScheme[] = [
  {
    id: "SCHEME-PMJAY",
    scheme_code: "PMJAY",
    name: "Ayushman Bharat PM-JAY (Prototype Reference)",
    full_name: "Pradhan Mantri Jan Arogya Yojana",
    sponsor: "CENTRAL_GOVERNMENT",
    annual_benefit_limit: 500000,
    eligible_categories: ["SECC 2011 Beneficiary", "Antyodaya Card", "BPL Registered"],
    benefits_summary: "Cashless secondary and tertiary hospitalization cover up to ₹5 Lakh/family/year across empanelled hospitals.",
    nodal_agency: "National Health Authority (Demo Reference)",
    is_demo: true,
  },
  {
    id: "SCHEME-BSKY",
    scheme_code: "BSKY",
    name: "State Health Assurance Card (BSKY / BSKY-Plus Demo)",
    full_name: "State Health Assurance & Universal Care Scheme",
    sponsor: "STATE_GOVERNMENT",
    annual_benefit_limit: 500000,
    eligible_categories: ["State Resident Card", "Food Security Beneficiary"],
    benefits_summary: "Universal cashless healthcare coverage at government and private partner facilities.",
    nodal_agency: "State Health Assurance Society (Demo Reference)",
    is_demo: true,
  },
  {
    id: "SCHEME-RAN",
    scheme_code: "RAN",
    name: "Rashtriya Arogya Nidhi (Critical Care Fund Demo)",
    full_name: "National Illness Assistance Fund",
    sponsor: "CENTRAL_GOVERNMENT",
    annual_benefit_limit: 1500000,
    eligible_categories: ["Patients with Life-Threatening Malignancy / Trauma"],
    benefits_summary: "Financial assistance for below-poverty-line patients suffering from major life-threatening diseases.",
    nodal_agency: "Ministry of Health & Family Welfare (Demo Reference)",
    is_demo: true,
  },
];

export const SEEDED_SCHEME_APPLICATIONS: SchemeApplication[] = [
  {
    id: "SCHAPP-1001",
    scheme_id: "SCHEME-PMJAY",
    scheme_code: "PMJAY",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    hospital_id: "FAC-1001",
    card_or_ration_number: "PMJAY-9928-1029-4401",
    status: "ELIGIBLE",
    authorized_amount: 10000,
    verified_by: "City Hospital Arogya Mitra Desk",
    applied_at: "2026-08-20T09:00:00Z",
    approved_at: "2026-08-20T11:00:00Z",
    is_demo: true,
  },
];

export const SEEDED_ASSISTANCE_GRANTS: FinancialAssistanceGrant[] = [
  {
    id: "CHARITY-1001",
    patient_id: "PAT-1001",
    bill_id: "BILL-1001",
    hospital_id: "FAC-1001",
    trust_name: "City Hospital Community Compassion Grant",
    amount_granted: 1500,
    status: "APPROVED",
    approved_at: "2026-08-21T12:00:00Z",
  },
];

let IN_MEMORY_POLICIES = [...SEEDED_POLICIES];
let IN_MEMORY_CLAIMS = [...SEEDED_CLAIMS];
let IN_MEMORY_APPLICATIONS = [...SEEDED_SCHEME_APPLICATIONS];
let IN_MEMORY_GRANTS = [...SEEDED_ASSISTANCE_GRANTS];

const POLICIES_KEY = "medora_insurance_policies_v1";
const CLAIMS_KEY = "medora_insurance_claims_v1";
const SCHEME_APPS_KEY = "medora_scheme_applications_v1";

// ------------------------------------------------------------
// QUERIES
// ------------------------------------------------------------

export function getPatientPolicies(patientId: string): InsurancePolicy[] {
  const clean = (patientId || "").trim().toLowerCase();
  return IN_MEMORY_POLICIES.filter((p) => p.patient_id.toLowerCase() === clean);
}

export function getPatientClaims(patientId: string): InsuranceClaim[] {
  const clean = (patientId || "").trim().toLowerCase();
  return IN_MEMORY_CLAIMS.filter((c) => c.patient_id.toLowerCase() === clean);
}

export function getAllSchemes(): GovernmentHealthScheme[] {
  return [...SEEDED_SCHEMES];
}

export function getPatientSchemeApplications(patientId: string): SchemeApplication[] {
  const clean = (patientId || "").trim().toLowerCase();
  return IN_MEMORY_APPLICATIONS.filter((a) => a.patient_id.toLowerCase() === clean);
}

export function getPatientAssistanceGrants(patientId: string): FinancialAssistanceGrant[] {
  const clean = (patientId || "").trim().toLowerCase();
  return IN_MEMORY_GRANTS.filter((g) => g.patient_id.toLowerCase() === clean);
}

// ------------------------------------------------------------
// MUTATIONS
// ------------------------------------------------------------

export function submitInsuranceClaim(params: {
  policyId: string;
  billId: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  claimedAmount: number;
  actor: StoredIdentity | null;
}): { success: boolean; claim?: InsuranceClaim; error?: string } {
  if (!params.actor) return { success: false, error: "Authentication required." };
  const policy = IN_MEMORY_POLICIES.find((p) => p.id === params.policyId);
  if (!policy) return { success: false, error: "Insurance policy not found." };

  const now = new Date().toISOString();
  const claimId = `CLM-${1000 + IN_MEMORY_CLAIMS.length + 1}`;
  const coPay = Math.round(params.claimedAmount * (policy.co_pay_percentage / 100));
  const approved = Math.max(0, params.claimedAmount - coPay);

  const newClaim: InsuranceClaim = {
    id: claimId,
    claim_number: `MEDORA-CLM-${1000 + IN_MEMORY_CLAIMS.length + 1}`,
    policy_id: params.policyId,
    patient_id: params.patientId,
    patient_name: params.patientName,
    hospital_id: params.hospitalId,
    hospital_name: params.hospitalName,
    bill_id: params.billId,
    claimed_amount: params.claimedAmount,
    approved_amount: approved,
    deductible_amount: 0,
    co_pay_amount: coPay,
    patient_responsibility: coPay,
    status: "SUBMITTED",
    remarks: "Demo pre-authorization claim submitted via Medora patient portal.",
    created_at: now,
    updated_at: now,
    is_demo: true,
  };

  IN_MEMORY_CLAIMS.unshift(newClaim);

  appendAuditEvent(
    "INSURANCE_APPROVAL_RECORDED",
    params.actor.identifier || params.actor.id,
    params.actor.fullName,
    params.actor.role,
    `Submitted insurance claim ${newClaim.claim_number} for ₹${params.claimedAmount.toFixed(2)} against bill ${params.billId}`,
    params.patientId,
    params.hospitalId,
    undefined,
    newClaim.id
  );

  return { success: true, claim: newClaim };
}

export function applyForGovernmentScheme(params: {
  schemeId: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  cardNumber: string;
  actor: StoredIdentity | null;
}): { success: boolean; application?: SchemeApplication; error?: string } {
  if (!params.actor) return { success: false, error: "Authentication required." };
  const scheme = SEEDED_SCHEMES.find((s) => s.id === params.schemeId);
  if (!scheme) return { success: false, error: "Government scheme not found." };

  const now = new Date().toISOString();
  const appId = `SCHAPP-${1000 + IN_MEMORY_APPLICATIONS.length + 1}`;

  const newApp: SchemeApplication = {
    id: appId,
    scheme_id: params.schemeId,
    scheme_code: scheme.scheme_code,
    patient_id: params.patientId,
    patient_name: params.patientName,
    hospital_id: params.hospitalId,
    card_or_ration_number: params.cardNumber.trim(),
    status: "ELIGIBLE",
    authorized_amount: 25000,
    verified_by: "Hospital Ayushman Mitra Desk (Prototype)",
    applied_at: now,
    approved_at: now,
    is_demo: true,
  };

  IN_MEMORY_APPLICATIONS.unshift(newApp);

  appendAuditEvent(
    "INSURANCE_ALLOCATION_CREATED",
    params.actor.identifier || params.actor.id,
    params.actor.fullName,
    params.actor.role,
    `Submitted application for government scheme ${scheme.name} (Card: ${params.cardNumber})`,
    params.patientId,
    params.hospitalId,
    undefined,
    newApp.id
  );

  return { success: true, application: newApp };
}

// ------------------------------------------------------------
// AUTHORITATIVE COVERAGE CALCULATION ENGINE
// ------------------------------------------------------------

export function calculateBillCoverageBreakdown(billId: string): BillCoverageBreakdown {
  const bill = getBillById(billId);
  if (!bill) {
    return {
      bill_id: billId,
      gross_service_charges: 0,
      hospital_adjustments: 0,
      insurance_coverage: 0,
      government_scheme_coverage: 0,
      financial_assistance: 0,
      total_coverage_applied: 0,
      net_patient_responsibility: 0,
      amount_paid: 0,
      outstanding_amount: 0,
      disputed_amount: 0,
      refunded_amount: 0,
    };
  }

  const pId = bill.patient_id;
  const claims = IN_MEMORY_CLAIMS.filter(
    (c) => c.bill_id.toLowerCase() === billId.toLowerCase() && (c.status === "APPROVED" || c.status === "UNDER_REVIEW" || c.status === "SUBMITTED")
  );
  const insuranceCoverage = claims.reduce((sum, c) => sum + c.approved_amount, 0);

  const schemeApps = IN_MEMORY_APPLICATIONS.filter(
    (a) => a.patient_id.toLowerCase() === pId.toLowerCase() && (a.status === "ELIGIBLE" || a.status === "APPROVED")
  );
  // Scheme covers remaining diagnostic/inpatient services up to authorized demo pool (capped to bill)
  const schemeCap = schemeApps.reduce((sum, a) => sum + a.authorized_amount, 0);
  const schemeCoverage = Math.min(Math.max(0, bill.gross_total - insuranceCoverage), schemeCap > 0 ? 1000 : 0);

  const grants = IN_MEMORY_GRANTS.filter((g) => g.bill_id.toLowerCase() === billId.toLowerCase());
  const financialAssistance = grants.reduce((sum, g) => sum + g.amount_granted, 0);

  const hospitalAdjustments = Math.max(0, bill.gross_total - bill.net_billable_total);
  const totalCoverage = hospitalAdjustments + insuranceCoverage + schemeCoverage + financialAssistance;
  const netLiability = Math.max(0, bill.gross_total - totalCoverage);

  const billPayments = getPaymentsForBill(bill.id);
  const paidAmount = billPayments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);

  return {
    bill_id: bill.id,
    gross_service_charges: bill.gross_total,
    hospital_adjustments: hospitalAdjustments,
    insurance_coverage: insuranceCoverage,
    government_scheme_coverage: schemeCoverage,
    financial_assistance: financialAssistance,
    total_coverage_applied: totalCoverage,
    net_patient_responsibility: netLiability,
    amount_paid: paidAmount,
    outstanding_amount: Math.max(0, netLiability - paidAmount),
    disputed_amount: 0,
    refunded_amount: 0,
  };
}
