import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, validateRole } from "@/lib/api/api-utils";
import { PharmacyFulfillmentService } from "@/lib/services/pharmacy-fulfillment-service";

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["pharmacy_staff", "admin"])) {
    return jsonError("Only authorized pharmacists can dispense prescriptions.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { order_id, otp_code } = body;

    if (!order_id || !otp_code) {
      return jsonError("Pharmacy order ID and patient 6-digit verification OTP code are required.", "INVALID_INPUT", 400);
    }

    const result = await PharmacyFulfillmentService.dispenseOrder(
      order_id,
      otp_code,
      user
    );

    if (!result.success) {
      return jsonError(result.error || "Dispensing transaction failed.", "DISPENSE_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.dispensing }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process medicine dispensing.", "INTERNAL_ERROR", 500);
  }
}
