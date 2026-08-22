import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, validateRole } from "@/lib/api/api-utils";
import { RefundReversalService } from "@/lib/services/refund-reversal-service";

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["hospital_admin", "finance_staff", "admin"])) {
    return jsonError("Only authorized financial staff can submit refund requests.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { payment_record_id, refund_amount, reason } = body;

    if (!payment_record_id || !refund_amount || !reason) {
      return jsonError("Payment record ID, refund amount, and reason are required.", "INVALID_INPUT", 400);
    }

    const result = RefundReversalService.requestRefund({
      paymentId: payment_record_id,
      amount: Number(refund_amount),
      reason,
      actor: user,
    });

    if (!result.success) {
      return jsonError(result.error || "Refund request failed.", "REFUND_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.refund }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process refund request.", "INTERNAL_ERROR", 500);
  }
}
