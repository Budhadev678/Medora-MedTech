import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized } from "@/lib/api/api-utils";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  try {
    const body = await request.json();
    const { bill_id, amount, payment_method, idempotency_key } = body;

    if (!bill_id || !amount || !payment_method || !idempotency_key) {
      return jsonError("Bill ID, amount, payment method, and idempotency key are required.", "INVALID_INPUT", 400);
    }

    // 1. Create intent
    const intentRes = PaymentProcessingService.createPaymentIntent({
      billId: bill_id,
      amount,
      idempotencyKey: idempotency_key,
      actor: user,
    });

    if (!intentRes.success || !intentRes.intent) {
      return jsonError(intentRes.error || "Payment intent creation failed.", "INTENT_FAILED", 400);
    }

    // 2. Execute attempt
    const attemptRes = PaymentProcessingService.executePaymentAttempt({
      intentId: intentRes.intent.idempotency_key,
      paymentMethod: payment_method,
      transactionReference: `REF-${Date.now()}`,
      actor: user,
    });

    if (!attemptRes.success || !attemptRes.payment) {
      return jsonError(attemptRes.error || "Payment attempt execution failed.", "PAYMENT_FAILED", 400);
    }

    return jsonResponse({
      success: true,
      data: {
        paymentRecord: attemptRes.payment,
        receiptNumber: attemptRes.payment.receipt_number,
      },
    }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process payment transaction.", "INTERNAL_ERROR", 500);
  }
}
