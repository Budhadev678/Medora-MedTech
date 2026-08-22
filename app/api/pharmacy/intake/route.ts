import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, validateRole } from "@/lib/api/api-utils";
import { PharmacyIntakeService } from "@/lib/services/pharmacy-intake-service";

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["pharmacy_staff", "admin"])) {
    return jsonError("Only authorized pharmacists can record prescription intake.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { prescription_id, pharmacy_facility_id } = body;

    if (!prescription_id || !pharmacy_facility_id) {
      return jsonError("Prescription ID and pharmacy facility ID are required.", "INVALID_INPUT", 400);
    }

    const result = await PharmacyIntakeService.submitPrescriptionToIntake(
      prescription_id,
      pharmacy_facility_id,
      user
    );

    if (!result.success) {
      return jsonError(result.error || "Pharmacy intake failed.", "INTAKE_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.intake }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process pharmacy intake.", "INTERNAL_ERROR", 500);
  }
}
