// ============================================================
// MEDORA — FINANCIAL COVERAGE & ASSISTANCE REPOSITORY (PHASE 10.2)
// Authoritative Discounts, Insurance, Govt Assistance, Charity & Financing Store
// ============================================================

import type {
  DiscountAllocation,
  CoverageAllocation,
  AssistanceAllocation,
  FinancingAllocation,
} from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";

let DISCOUNTS_STORE: DiscountAllocation[] = [
  {
    id: "DISC-1001",
    bill_id: "BILL-1001",
    discount_type: "HOSPITAL_DISCOUNT",
    amount: 1000.00,
    reason: "Hospital anniversary hardship discount approved by billing manager",
    authorized_by_id: "USR-BILLING-01",
    authorized_by_name: "Billing Manager Suresh",
    created_at: "2026-08-20T12:10:00Z",
  },
];

let COVERAGE_STORE: CoverageAllocation[] = [
  {
    id: "COVERAGE-1001",
    bill_id: "BILL-1001",
    policy_id: "POL-INS-9901",
    policy_number: "STAR-HEALTH-2026-88",
    provider_name: "Star Health & Allied Insurance",
    requested_amount: 10000.00,
    eligible_amount: 10000.00,
    approved_amount: 8000.00,
    allocated_amount: 8000.00,
    received_amount: 6000.00,
    deductible_amount: 1000.00,
    copay_amount: 1000.00,
    status: "APPROVED",
    preauth_reference: "PREAUTH-INS-771",
    created_at: "2026-08-20T12:15:00Z",
    updated_at: "2026-08-20T12:15:00Z",
  },
];

let ASSISTANCE_STORE: AssistanceAllocation[] = [
  {
    id: "GOVT-1001",
    bill_id: "BILL-1001",
    source_type: "GOVERNMENT_ASSISTANCE",
    program_name: "BSKY Biju Swasthya Kalyan Yojana",
    program_id: "SCHEME-BSKY-01",
    requested_amount: 3000.00,
    approved_amount: 2000.00,
    allocated_amount: 2000.00,
    settled_amount: 0.00,
    status: "APPROVED",
    reason: "State universal healthcare coverage scheme",
    authorized_by_id: "GOVT-SYS-01",
    authorized_by_name: "BSKY Auto-Eligibility Engine",
    created_at: "2026-08-20T12:20:00Z",
    updated_at: "2026-08-20T12:20:00Z",
  },
  {
    id: "HOSP-ASSIST-1001",
    bill_id: "BILL-1001",
    source_type: "HOSPITAL_ASSISTANCE",
    program_name: "City Hospital Patient Relief Fund",
    program_id: "HOSP-RELIEF-01",
    requested_amount: 1000.00,
    approved_amount: 1000.00,
    allocated_amount: 1000.00,
    settled_amount: 1000.00,
    status: "SETTLED",
    reason: "Internal hospital hardship subsidy",
    authorized_by_id: "USR-BILLING-01",
    authorized_by_name: "Billing Manager Suresh",
    created_at: "2026-08-20T12:25:00Z",
    updated_at: "2026-08-20T12:25:00Z",
  },
];

let FINANCING_STORE: FinancingAllocation[] = [
  {
    id: "FIN-1001",
    bill_id: "BILL-1001",
    partner_name: "MEDORA CarePay Micro-Financing",
    requested_amount: 2000.00,
    approved_amount: 2000.00,
    disbursed_amount: 2000.00,
    status: "DISBURSED",
    repayment_reference: "CAREPAY-LOAN-8891",
    created_at: "2026-08-20T12:30:00Z",
    updated_at: "2026-08-20T12:30:00Z",
  },
];

// ============================================================
// QUERIES
// ============================================================

export function getDiscountsForBill(billId: string): DiscountAllocation[] {
  const clean = (billId || "").trim().toLowerCase();
  return DISCOUNTS_STORE.filter((d) => d.bill_id.toLowerCase() === clean);
}

export function getCoverageForBill(billId: string): CoverageAllocation[] {
  const clean = (billId || "").trim().toLowerCase();
  return COVERAGE_STORE.filter((c) => c.bill_id.toLowerCase() === clean);
}

export function getAssistanceForBill(billId: string): AssistanceAllocation[] {
  const clean = (billId || "").trim().toLowerCase();
  return ASSISTANCE_STORE.filter((a) => a.bill_id.toLowerCase() === clean);
}

export function getFinancingForBill(billId: string): FinancingAllocation[] {
  const clean = (billId || "").trim().toLowerCase();
  return FINANCING_STORE.filter((f) => f.bill_id.toLowerCase() === clean);
}

// ============================================================
// MUTATIONS
// ============================================================

export function saveDiscountAllocation(discount: DiscountAllocation): void {
  DISCOUNTS_STORE.push(discount);
}

export function saveCoverageAllocation(coverage: CoverageAllocation): void {
  const idx = COVERAGE_STORE.findIndex((c) => c.id === coverage.id);
  if (idx >= 0) COVERAGE_STORE[idx] = coverage;
  else COVERAGE_STORE.push(coverage);
}

export function saveAssistanceAllocation(assistance: AssistanceAllocation): void {
  const idx = ASSISTANCE_STORE.findIndex((a) => a.id === assistance.id);
  if (idx >= 0) ASSISTANCE_STORE[idx] = assistance;
  else ASSISTANCE_STORE.push(assistance);
}

export function saveFinancingAllocation(financing: FinancingAllocation): void {
  const idx = FINANCING_STORE.findIndex((f) => f.id === financing.id);
  if (idx >= 0) FINANCING_STORE[idx] = financing;
  else FINANCING_STORE.push(financing);
}
