import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized } from "@/lib/api/api-utils";
import { QueueManagementService } from "@/lib/services/queue-management-service";

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  try {
    const body = await request.json();
    const { appointment_id } = body;

    if (!appointment_id) {
      return jsonError("Appointment ID is required for check-in.", "INVALID_INPUT", 400);
    }

    const result = await QueueManagementService.checkInAppointment(
      {
        appointment_id,
        patient_id: body.patient_id || user.identifier || user.id,
      },
      user
    );

    if (!result.success) {
      return jsonError(result.message || "Check-in failed.", result.error_code || "CHECKIN_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.queue_entry });
  } catch (err: any) {
    return jsonError(err.message || "Failed to process check-in.", "INTERNAL_ERROR", 500);
  }
}
