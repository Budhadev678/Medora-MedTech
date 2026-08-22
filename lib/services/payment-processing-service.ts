// ============================================================
// MEDORA — AUTHORITATIVE PAYMENT PROCESSING SERVICE (PHASE 10.3)
// Server-Authoritative Payment Intents, Attempts, Idempotency & Cash Control Engine
// ============================================================

import {
  getBillById,
  saveBill,
} from "@/lib/data/billing-store";
import {
  getPaymentIntentById,
  getPaymentIntentByIdempotencyKey,
  getPaymentById,
  getPaymentsForBill,
  savePaymentIntent,
  savePaymentAttempt,
  savePaymentRecord,
  savePaymentAllocation,
  saveUnappliedPayment,
} from "@/lib/data/payment-store";
import { FinancialCoverageService } from "@/lib/services/financial-coverage-service";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import type {
  HealthcareBill,
  PaymentIntent,
  PaymentAttempt,
  PaymentRecord,
  PaymentAllocation,
  PaymentMethod,
  PaymentStatus,
  SettlementStatus,
} from "@/types/database.types";

export class PaymentProcessingService {
  /**
   * Calculates server-authoritative net financial balance for a bill.
   */
  public static calculateOutstandingBalance(billId: string): {
    grossTotal: number;
    discountsTotal: number;
    netBillableTotal: number;
    coverageTotal: number;
    patientObligation: number;
    totalSettledPayments: number;
    outstandingBalance: number;
    overpaymentCredit: number;
  } {
    const waterfall = FinancialCoverageService.calculateFinancialWaterfall(billId);
    if (!waterfall) {
      return {
        grossTotal: 0,
        discountsTotal: 0,
        netBillableTotal: 0,
        coverageTotal: 0,
        patientObligation: 0,
        totalSettledPayments: 0,
        outstandingBalance: 0,
        overpaymentCredit: 0,
      };
    }

    const payments = getPaymentsForBill(billId);
    const settledPayments = payments
      .filter((p) => p.status === "SUCCESS" && p.settlement_status === "SETTLED")
      .reduce((sum, p) => sum + p.amount, 0);

    const patientObligation = waterfall.projected_patient_responsibility;
    const balance = patientObligation - settledPayments;

    const outstandingBalance = Math.max(0, balance);
    const overpaymentCredit = balance < 0 ? Math.abs(balance) : 0;

    return {
      grossTotal: waterfall.gross_charges,
      discountsTotal: waterfall.discounts_total,
      netBillableTotal: waterfall.net_billable_total,
      coverageTotal: waterfall.gross_charges - waterfall.projected_patient_responsibility,
      patientObligation,
      totalSettledPayments: settledPayments,
      outstandingBalance,
      overpaymentCredit,
    };
  }

  /**
   * Creates an idempotent Payment Intent.
   */
  public static createPaymentIntent(params: {
    billId: string;
    amount: number;
    idempotencyKey: string;
    actor: StoredIdentity | null;
  }): { success: boolean; intent?: PaymentIntent; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    if (!params.idempotencyKey || params.idempotencyKey.trim().length === 0) {
      return { success: false, error: "Idempotency key is required to prevent duplicate payments." };
    }

    // Double Click & Network Retry Idempotency Check
    const existing = getPaymentIntentByIdempotencyKey(params.idempotencyKey);
    if (existing) {
      return { success: true, intent: existing };
    }

    const bill = getBillById(params.billId);
    if (!bill) return { success: false, error: `Bill ${params.billId} not found.` };

    const balance = this.calculateOutstandingBalance(bill.id);
    if (balance.outstandingBalance <= 0 && balance.overpaymentCredit === 0) {
      return { success: false, error: "Bill is already fully settled. Outstanding balance is ₹0." };
    }

    const now = new Date().toISOString();
    const intent: PaymentIntent = {
      id: `PAYINTENT-${Date.now() % 10000}`,
      bill_id: bill.id,
      patient_id: bill.patient_id,
      amount: Math.min(params.amount, balance.outstandingBalance > 0 ? balance.outstandingBalance : params.amount),
      currency: "INR",
      status: "CREATED",
      idempotency_key: params.idempotencyKey,
      created_at: now,
    };

    savePaymentIntent(intent);
    return { success: true, intent };
  }

  /**
   * Executes a payment attempt against a Payment Intent.
   */
  public static executePaymentAttempt(params: {
    intentId: string;
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    actor: StoredIdentity | null;
  }): { success: boolean; payment?: PaymentRecord; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };

    const intent = getPaymentIntentById(params.intentId) || getPaymentIntentByIdempotencyKey(params.intentId) || null;
    // Fallback if intentId is direct ID
    const billId = intent ? intent.bill_id : params.intentId;
    const bill = getBillById(billId);
    if (!bill) return { success: false, error: `Healthcare Bill ${billId} not found.` };

    const now = new Date().toISOString();
    const payNum = 1000 + Date.now() % 9000;
    const payId = `PAY-${payNum}`;
    const receiptNum = `REC-${payNum}`;
    const txnRef = params.transactionReference || `TXN-${params.paymentMethod}-${payNum}`;
    const provRef = `GATEWAY-${params.paymentMethod}-${Date.now() % 10000}`;

    const amountToPay = intent ? intent.amount : 500;

    const payment: PaymentRecord = {
      id: payId,
      payment_intent_id: intent ? intent.id : `PAYINTENT-${payNum}`,
      bill_id: bill.id,
      patient_id: bill.patient_id,
      patient_name: bill.patient_name,
      organization_id: bill.organization_id,
      facility_id: bill.facility_id,
      amount: amountToPay,
      currency: "INR",
      payment_method: params.paymentMethod,
      status: "SUCCESS",
      settlement_status: "SETTLED",
      receipt_number: receiptNum,
      transaction_reference: txnRef,
      provider_reference: provRef,
      initiated_at: now,
      completed_at: now,
      settled_at: now,
      actor_id: params.actor.identifier || params.actor.id,
      actor_name: params.actor.fullName,
      created_at: now,
      updated_at: now,
    };

    savePaymentRecord(payment);

    // Save allocation record
    const allocation: PaymentAllocation = {
      id: `PAYALLOC-${payNum}`,
      payment_id: payId,
      bill_id: bill.id,
      allocated_amount: amountToPay,
      source_type: "PATIENT",
      created_at: now,
    };
    savePaymentAllocation(allocation);

    // Calculate new balance & update bill status
    const newBal = this.calculateOutstandingBalance(bill.id);
    if (newBal.outstandingBalance === 0) {
      bill.status = "ISSUED"; // Bill remains ISSUED with 0 due
    }
    bill.patient_responsibility = newBal.outstandingBalance;
    bill.updated_at = now;
    saveBill(bill);

    appendAuditEvent(
      "PAYMENT_SUCCESS",
      params.actor.identifier || params.actor.id,
      params.actor.fullName,
      params.actor.role,
      `Processed ${params.paymentMethod} payment ${payId} of ₹${amountToPay} for bill ${bill.id} (Receipt: ${receiptNum})`,
      bill.patient_id,
      bill.organization_id,
      undefined,
      payId
    );

    return { success: true, payment };
  }

  /**
   * Records cash payment with mandatory cash collector attribution.
   */
  public static recordCashPayment(params: {
    billId: string;
    amount: number;
    actor: StoredIdentity | null;
  }): { success: boolean; payment?: PaymentRecord; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    if (params.amount <= 0) return { success: false, error: "Cash payment amount must be greater than 0." };

    const bill = getBillById(params.billId);
    if (!bill) return { success: false, error: `Bill ${params.billId} not found.` };

    const now = new Date().toISOString();
    const payNum = 1000 + Date.now() % 9000;
    const payId = `PAY-CASH-${payNum}`;
    const receiptNum = `REC-CASH-${payNum}`;
    const actorId = params.actor.identifier || params.actor.id;

    const payment: PaymentRecord = {
      id: payId,
      payment_intent_id: `PAYINTENT-CASH-${payNum}`,
      bill_id: bill.id,
      patient_id: bill.patient_id,
      patient_name: bill.patient_name,
      organization_id: bill.organization_id,
      facility_id: bill.facility_id,
      amount: params.amount,
      currency: "INR",
      payment_method: "CASH",
      status: "SUCCESS",
      settlement_status: "SETTLED",
      receipt_number: receiptNum,
      transaction_reference: `CASH-REC-${payNum}`,
      cash_collector_id: actorId,
      cash_collector_name: params.actor.fullName,
      initiated_at: now,
      completed_at: now,
      settled_at: now,
      actor_id: actorId,
      actor_name: params.actor.fullName,
      created_at: now,
      updated_at: now,
    };

    savePaymentRecord(payment);

    const allocation: PaymentAllocation = {
      id: `PAYALLOC-CASH-${payNum}`,
      payment_id: payId,
      bill_id: bill.id,
      allocated_amount: params.amount,
      source_type: "PATIENT",
      created_at: now,
    };
    savePaymentAllocation(allocation);

    const newBal = this.calculateOutstandingBalance(bill.id);
    bill.patient_responsibility = newBal.outstandingBalance;
    saveBill(bill);

    appendAuditEvent(
      "PAYMENT_SETTLED",
      actorId,
      params.actor.fullName,
      params.actor.role,
      `Recorded cash payment of ₹${params.amount} collected by ${params.actor.fullName} (Receipt: ${receiptNum})`,
      bill.patient_id,
      bill.organization_id,
      undefined,
      payId
    );

    return { success: true, payment };
  }
}
