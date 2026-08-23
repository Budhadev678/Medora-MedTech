import { NextRequest, NextResponse } from "next/server";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, payload } = body;

    if (!payload || !payload.payment_intent_id) {
      return NextResponse.json({ success: false, error: "Invalid webhook payload structure" }, { status: 400 });
    }

    if (event === "payment.captured" || event === "payment.success") {
      const systemActor = {
        id: "sys-webhook",
        identifier: "SYS-WEBHOOK",
        fullName: "Automated Payment Webhook Listener",
        role: "admin" as const,
        accountStatus: "active" as const,
      };

      const result = PaymentProcessingService.executePaymentAttempt({
        intentId: payload.payment_intent_id,
        paymentMethod: payload.method || "UPI",
        transactionReference: payload.transaction_ref || `WH-${Date.now()}`,
        actor: systemActor as any,
      });

      return NextResponse.json({
        success: true,
        data: {
          received: true,
          settledRecord: result.payment?.id,
        },
      });
    }

    return NextResponse.json({ success: true, message: `Ignored unhandled event: ${event}` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}
