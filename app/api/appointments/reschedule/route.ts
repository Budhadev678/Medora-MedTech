import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized } from "@/lib/api/api-utils";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  try {
    const body = await request.json();
    const { appointment_id, new_date, new_session_id } = body;

    if (!appointment_id || !new_date || !new_session_id) {
      return jsonError(
        "Missing required fields: appointment_id, new_date, and new_session_id are required.",
        "INVALID_INPUT",
        400
      );
    }

    const result = await AppointmentBookingService.rescheduleAppointment(
      appointment_id,
      new_session_id,
      new_date,
      user
    );

    if (!result.success) {
      return jsonError(
        result.message || "Failed to reschedule appointment.",
        result.error_code || "RESCHEDULE_FAILED",
        400
      );
    }

    return jsonResponse({
      success: true,
      data: result.appointment,
    });
  } catch (err: any) {
    return jsonError(
      err.message || "An unexpected error occurred during rescheduling.",
      "INTERNAL_ERROR",
      500
    );
  }
}
