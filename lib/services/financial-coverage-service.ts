// ============================================================
// MEDORA — FINANCIAL COVERAGE & WATERFALL SERVICE (PHASE 10.2)
// Server-Authoritative Financial Waterfall Engine & Multi-Channel Coverage Calculator
// ============================================================

import {
  getBillById,
  updateBillTotals,
} from "@/lib/data/billing-store";
import {
  getDiscountsForBill,
  getCoverageForBill,
  getAssistanceForBill,
  getFinancingForBill,
  saveDiscountAllocation,
  saveCoverageAllocation,
  saveAssistanceAllocation,
  saveFinancingAllocation,
} from "@/lib/data/financial-coverage-store";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import type {
  HealthcareBill,
  DiscountAllocation,
  CoverageAllocation,
  AssistanceAllocation,
  FinancingAllocation,
  FinancialWaterfallSummary,
} from "@/types/database.types";

export class FinancialCoverageService {
  /**
   * Calculates authoritative financial waterfall summary for a bill.
   */
  public static calculateFinancialWaterfall(billId: string): FinancialWaterfallSummary | null {
    const bill = getBillById(billId);
    if (!bill) return null;

    const discounts = getDiscountsForBill(bill.id);
    const coverageList = getCoverageForBill(bill.id);
    const assistanceList = getAssistanceForBill(bill.id);
    const financingList = getFinancingForBill(bill.id);

    const grossCharges = bill.gross_total;
    const discountsTotal = discounts.reduce((sum, d) => sum + d.amount, 0);
    const netBillableTotal = Math.max(0, grossCharges - discountsTotal);

    // Insurance aggregates
    let insuranceApprovedTotal = 0;
    let insuranceReceivedTotal = 0;
    let insurancePendingTotal = 0;

    coverageList.forEach((c) => {
      if (c.status === "APPROVED" || c.status === "SETTLED" || c.status === "SETTLEMENT_PENDING") {
        insuranceApprovedTotal += c.approved_amount;
        insuranceReceivedTotal += c.received_amount;
      } else if (c.status === "PENDING" || c.status === "REQUESTED") {
        insurancePendingTotal += c.requested_amount;
      }
    });

    // Govt & Hospital Assistance aggregates
    let govtApprovedTotal = 0;
    let govtSettledTotal = 0;
    let hospitalAssistanceTotal = 0;
    let charityAssistanceTotal = 0;

    assistanceList.forEach((a) => {
      if (a.source_type === "GOVERNMENT_ASSISTANCE") {
        if (a.status === "APPROVED" || a.status === "SETTLED" || a.status === "SETTLEMENT_PENDING") {
          govtApprovedTotal += a.approved_amount;
          govtSettledTotal += a.settled_amount;
        }
      } else if (a.source_type === "HOSPITAL_ASSISTANCE") {
        if (a.status === "APPROVED" || a.status === "SETTLED") {
          hospitalAssistanceTotal += a.approved_amount;
        }
      } else if (a.source_type === "CHARITY") {
        if (a.status === "APPROVED" || a.status === "SETTLED") {
          charityAssistanceTotal += a.approved_amount;
        }
      }
    });

    // Financing aggregates
    let financingApprovedTotal = 0;
    let financingDisbursedTotal = 0;

    financingList.forEach((f) => {
      if (f.status === "APPROVED" || f.status === "DISBURSED") {
        financingApprovedTotal += f.approved_amount;
        financingDisbursedTotal += f.disbursed_amount;
      }
    });

    // Total non-patient financial support
    const totalApprovedSupport =
      insuranceApprovedTotal +
      govtApprovedTotal +
      hospitalAssistanceTotal +
      charityAssistanceTotal +
      financingApprovedTotal;

    const projectedPatientResp = Math.max(0, netBillableTotal - totalApprovedSupport);

    const totalConfirmedSettled =
      insuranceReceivedTotal +
      govtSettledTotal +
      hospitalAssistanceTotal +
      charityAssistanceTotal +
      financingDisbursedTotal;

    const confirmedPatientResp = Math.max(0, netBillableTotal - totalConfirmedSettled);

    // Update bill patient responsibility in store
    updateBillTotals(bill.id, grossCharges, netBillableTotal, projectedPatientResp);

    return {
      bill_id: bill.id,
      gross_charges: grossCharges,
      discounts_total: discountsTotal,
      net_billable_total: netBillableTotal,
      insurance_approved_total: insuranceApprovedTotal,
      insurance_received_total: insuranceReceivedTotal,
      insurance_pending_total: insurancePendingTotal,
      govt_assistance_approved_total: govtApprovedTotal,
      govt_assistance_settled_total: govtSettledTotal,
      hospital_assistance_total: hospitalAssistanceTotal,
      charity_assistance_total: charityAssistanceTotal,
      financing_approved_total: financingApprovedTotal,
      financing_disbursed_total: financingDisbursedTotal,
      projected_patient_responsibility: projectedPatientResp,
      confirmed_patient_responsibility: confirmedPatientResp,
      breakdown: {
        insurance: coverageList,
        assistance: assistanceList,
        financing: financingList,
        discounts: discounts,
      },
    };
  }

  /**
   * Applies an authorized discount to a bill.
   */
  public static applyDiscount(params: {
    billId: string;
    discountType: DiscountAllocation["discount_type"];
    amount: number;
    reason: string;
    actor: StoredIdentity | null;
  }): { success: boolean; discount?: DiscountAllocation; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    if (params.amount <= 0) return { success: false, error: "Discount amount must be positive." };

    const bill = getBillById(params.billId);
    if (!bill) return { success: false, error: `Bill ${params.billId} not found.` };

    const actorId = params.actor.identifier || params.actor.id;
    const discount: DiscountAllocation = {
      id: `DISC-${1000 + Date.now() % 9000}`,
      bill_id: bill.id,
      discount_type: params.discountType,
      amount: params.amount,
      reason: params.reason,
      authorized_by_id: actorId,
      authorized_by_name: params.actor.fullName,
      created_at: new Date().toISOString(),
    };

    saveDiscountAllocation(discount);
    this.calculateFinancialWaterfall(bill.id);

    appendAuditEvent(
      "DISCOUNT_APPLIED",
      actorId,
      params.actor.fullName,
      params.actor.role,
      `Applied ${params.discountType} of ₹${params.amount} to bill ${bill.id}`,
      bill.patient_id,
      bill.organization_id,
      undefined,
      discount.id
    );

    return { success: true, discount };
  }

  /**
   * Allocates insurance coverage to a bill.
   */
  public static allocateInsuranceCoverage(params: {
    billId: string;
    policyNumber: string;
    providerName: string;
    requestedAmount: number;
    approvedAmount: number;
    receivedAmount?: number;
    deductibleAmount?: number;
    copayAmount?: number;
    actor: StoredIdentity | null;
  }): { success: boolean; coverage?: CoverageAllocation; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };

    const bill = getBillById(params.billId);
    if (!bill) return { success: false, error: `Bill ${params.billId} not found.` };

    const now = new Date().toISOString();
    const coverage: CoverageAllocation = {
      id: `COVERAGE-${1000 + Date.now() % 9000}`,
      bill_id: bill.id,
      policy_id: `POL-${params.policyNumber}`,
      policy_number: params.policyNumber,
      provider_name: params.providerName,
      requested_amount: params.requestedAmount,
      eligible_amount: params.requestedAmount,
      approved_amount: params.approvedAmount,
      allocated_amount: params.approvedAmount,
      received_amount: params.receivedAmount || 0,
      deductible_amount: params.deductibleAmount || 0,
      copay_amount: params.copayAmount || 0,
      status: "APPROVED",
      created_at: now,
      updated_at: now,
    };

    saveCoverageAllocation(coverage);
    this.calculateFinancialWaterfall(bill.id);

    appendAuditEvent(
      "INSURANCE_APPROVAL_RECORDED",
      params.actor.identifier || params.actor.id,
      params.actor.fullName,
      params.actor.role,
      `Recorded insurance coverage approval of ₹${params.approvedAmount} for policy ${params.policyNumber}`,
      bill.patient_id,
      bill.organization_id,
      undefined,
      coverage.id
    );

    return { success: true, coverage };
  }

  /**
   * Links government assistance scheme (e.g. BSKY, PM-JAY) to a bill.
   */
  public static allocateGovernmentAssistance(params: {
    billId: string;
    programName: string;
    requestedAmount: number;
    approvedAmount: number;
    actor: StoredIdentity | null;
  }): { success: boolean; assistance?: AssistanceAllocation; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };

    const bill = getBillById(params.billId);
    if (!bill) return { success: false, error: `Bill ${params.billId} not found.` };

    const now = new Date().toISOString();
    const assistance: AssistanceAllocation = {
      id: `GOVT-${1000 + Date.now() % 9000}`,
      bill_id: bill.id,
      source_type: "GOVERNMENT_ASSISTANCE",
      program_name: params.programName,
      program_id: `SCHEME-${Date.now() % 1000}`,
      requested_amount: params.requestedAmount,
      approved_amount: params.approvedAmount,
      allocated_amount: params.approvedAmount,
      settled_amount: 0,
      status: "APPROVED",
      reason: "Universal public health assistance scheme",
      authorized_by_id: params.actor.identifier || params.actor.id,
      authorized_by_name: params.actor.fullName,
      created_at: now,
      updated_at: now,
    };

    saveAssistanceAllocation(assistance);
    this.calculateFinancialWaterfall(bill.id);

    appendAuditEvent(
      "ASSISTANCE_APPROVED",
      params.actor.identifier || params.actor.id,
      params.actor.fullName,
      params.actor.role,
      `Approved government scheme allocation of ₹${params.approvedAmount} under ${params.programName}`,
      bill.patient_id,
      bill.organization_id,
      undefined,
      assistance.id
    );

    return { success: true, assistance };
  }

  /**
   * Tracks partner financing (e.g. MEDORA CarePay Micro-Financing).
   */
  public static allocateFinancing(params: {
    billId: string;
    partnerName: string;
    approvedAmount: number;
    disbursedAmount: number;
    actor: StoredIdentity | null;
  }): { success: boolean; financing?: FinancingAllocation; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };

    const bill = getBillById(params.billId);
    if (!bill) return { success: false, error: `Bill ${params.billId} not found.` };

    const now = new Date().toISOString();
    const financing: FinancingAllocation = {
      id: `FIN-${1000 + Date.now() % 9000}`,
      bill_id: bill.id,
      partner_name: params.partnerName,
      requested_amount: params.approvedAmount,
      approved_amount: params.approvedAmount,
      disbursed_amount: params.disbursedAmount,
      status: params.disbursedAmount > 0 ? "DISBURSED" : "APPROVED",
      repayment_reference: `CAREPAY-LOAN-${Date.now() % 10000}`,
      created_at: now,
      updated_at: now,
    };

    saveFinancingAllocation(financing);
    this.calculateFinancialWaterfall(bill.id);

    appendAuditEvent(
      "FINANCING_APPROVED",
      params.actor.identifier || params.actor.id,
      params.actor.fullName,
      params.actor.role,
      `Approved partner financing of ₹${params.approvedAmount} with ${params.partnerName}`,
      bill.patient_id,
      bill.organization_id,
      undefined,
      financing.id
    );

    return { success: true, financing };
  }
}
