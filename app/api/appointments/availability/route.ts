import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized } from "@/lib/api/api-utils";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId");
  const orgIdentifier = searchParams.get("orgIdentifier") || "HSP-1001";
  const facilityId = searchParams.get("facilityId") || "FAC-1001";
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!doctorId) {
    return jsonError("Missing required query param: doctorId", "INVALID_INPUT", 400);
  }

  try {
    const availability = await AppointmentBookingService.getDoctorAvailability(
      doctorId,
      orgIdentifier,
      facilityId,
      dateStr
    );

    return jsonResponse({
      success: true,
      data: availability,
    });
  } catch (err: any) {
    return jsonError(
      err.message || "Failed to evaluate doctor availability.",
      "INTERNAL_ERROR",
      500
    );
  }
}
