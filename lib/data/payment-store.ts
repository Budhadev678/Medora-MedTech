// ============================================================
// MEDORA — AUTHORITATIVE PAYMENT REPOSITORY (PHASE 10.3)
// Payment Intents, Attempts, Payments, Allocations, Receipts, Refunds & Unapplied Cash
// ============================================================

import type {
  PaymentIntent,
  PaymentAttempt,
  PaymentRecord,
  PaymentAllocation,
  RefundRecord,
  UnappliedPayment,
} from "@/types/database.types";

let INTENTS_STORE: PaymentIntent[] = [];
let ATTEMPTS_STORE: PaymentAttempt[] = [];
let PAYMENTS_STORE: PaymentRecord[] = [
  {
    id: "PAY-1001",
    payment_intent_id: "PAYINTENT-1001",
    bill_id: "BILL-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    amount: 14000.00,
    currency: "INR",
    payment_method: "UPI",
    status: "SUCCESS",
    settlement_status: "SETTLED",
    receipt_number: "REC-1001",
    transaction_reference: "UPI-TXN-998822",
    provider_reference: "RAZORPAY-PAY-77112",
    initiated_at: "2026-08-20T12:00:00Z",
    completed_at: "2026-08-20T12:01:00Z",
    settled_at: "2026-08-20T12:05:00Z",
    actor_id: "PAT-1001",
    actor_name: "Rahul Verma",
    created_at: "2026-08-20T12:00:00Z",
    updated_at: "2026-08-20T12:05:00Z",
  },
];

let ALLOCATIONS_STORE: PaymentAllocation[] = [
  {
    id: "PAYALLOC-1001",
    payment_id: "PAY-1001",
    bill_id: "BILL-1001",
    allocated_amount: 14000.00,
    source_type: "PATIENT",
    created_at: "2026-08-20T12:01:00Z",
  },
];

let REFUNDS_STORE: RefundRecord[] = [];
let UNAPPLIED_STORE: UnappliedPayment[] = [
  {
    id: "UNAPPLIED-1001",
    amount: 5000.00,
    currency: "INR",
    payment_method: "BANK_TRANSFER",
    reference: "UTR-BANK-8822-UNCLAIMED",
    source_name: "Direct NEFT Credit (Unidentified)",
    status: "UNMATCHED",
    received_at: "2026-08-21T09:00:00Z",
    created_at: "2026-08-21T09:00:00Z",
  },
];

// ============================================================
// QUERIES
// ============================================================

export function getPaymentIntentById(id: string): PaymentIntent | null {
  const clean = (id || "").trim().toLowerCase();
  return INTENTS_STORE.find((i) => i.id.toLowerCase() === clean) || null;
}

export function getPaymentIntentByIdempotencyKey(key: string): PaymentIntent | null {
  const clean = (key || "").trim().toLowerCase();
  return INTENTS_STORE.find((i) => i.idempotency_key.toLowerCase() === clean) || null;
}

export function getPaymentById(id: string): PaymentRecord | null {
  const clean = (id || "").trim().toLowerCase();
  return PAYMENTS_STORE.find((p) => p.id.toLowerCase() === clean || p.receipt_number.toLowerCase() === clean) || null;
}

export function getPaymentsForBill(billId: string): PaymentRecord[] {
  const clean = (billId || "").trim().toLowerCase();
  return PAYMENTS_STORE.filter((p) => p.bill_id.toLowerCase() === clean);
}

export function getPaymentsForPatient(patientId: string): PaymentRecord[] {
  const clean = (patientId || "").trim().toLowerCase();
  return PAYMENTS_STORE.filter((p) => p.patient_id.toLowerCase() === clean);
}

export function getAllocationsForBill(billId: string): PaymentAllocation[] {
  const clean = (billId || "").trim().toLowerCase();
  return ALLOCATIONS_STORE.filter((a) => a.bill_id.toLowerCase() === clean);
}

export function getRefundsForPayment(paymentId: string): RefundRecord[] {
  const clean = (paymentId || "").trim().toLowerCase();
  return REFUNDS_STORE.filter((r) => r.payment_id.toLowerCase() === clean);
}

export function getAllPayments(): PaymentRecord[] {
  return [...PAYMENTS_STORE];
}

export function getAllUnappliedPayments(): UnappliedPayment[] {
  return [...UNAPPLIED_STORE];
}

// ============================================================
// MUTATIONS
// ============================================================

export function savePaymentIntent(intent: PaymentIntent): void {
  const idx = INTENTS_STORE.findIndex((i) => i.id === intent.id);
  if (idx >= 0) INTENTS_STORE[idx] = intent;
  else INTENTS_STORE.push(intent);
}

export function savePaymentAttempt(attempt: PaymentAttempt): void {
  ATTEMPTS_STORE.push(attempt);
}

export function savePaymentRecord(payment: PaymentRecord): void {
  const idx = PAYMENTS_STORE.findIndex((p) => p.id === payment.id);
  if (idx >= 0) PAYMENTS_STORE[idx] = payment;
  else PAYMENTS_STORE.push(payment);
}

export function savePaymentAllocation(allocation: PaymentAllocation): void {
  ALLOCATIONS_STORE.push(allocation);
}

export function saveRefundRecord(refund: RefundRecord): void {
  const idx = REFUNDS_STORE.findIndex((r) => r.id === refund.id);
  if (idx >= 0) REFUNDS_STORE[idx] = refund;
  else REFUNDS_STORE.push(refund);
}

export function saveUnappliedPayment(unapplied: UnappliedPayment): void {
  const idx = UNAPPLIED_STORE.findIndex((u) => u.id === unapplied.id);
  if (idx >= 0) UNAPPLIED_STORE[idx] = unapplied;
  else UNAPPLIED_STORE.push(unapplied);
}
