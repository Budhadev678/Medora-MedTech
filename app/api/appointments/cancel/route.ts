import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized } from "@/lib/api/api-utils";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  try {
    const body = await request.json();
    const { appointment_id, reason } = body;

    if (!appointment_id) {
      return jsonError("Missing required field: appointment_id is required.", "INVALID_INPUT", 400);
    }

    const result = await AppointmentBookingService.cancelAppointment(
      appointment_id,
      user,
      reason || "Cancelled by user"
    );

    if (!result.success) {
      return jsonError(result.message || "Failed to cancel appointment.", "CANCELLATION_FAILED", 400);
    }

    return jsonResponse({
      success: true,
      data: { message: result.message },
    });
  } catch (err: any) {
    return jsonError(
      err.message || "An unexpected error occurred during cancellation.",
      "INTERNAL_ERROR",
      500
    );
  }
}
