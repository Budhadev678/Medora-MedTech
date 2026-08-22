import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, validateRole } from "@/lib/api/api-utils";
import { ReferralService } from "@/lib/services/referral-service";
import { getAllReferrals } from "@/lib/data/referral-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const list = getAllReferrals();
  return jsonResponse({ success: true, data: list });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["doctor", "admin"])) {
    return jsonError("Only authorized medical doctors can issue specialist referrals.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { encounter_id, destination_type, destination_specialty_name, priority, reason } = body;

    if (!encounter_id || !destination_type || !reason) {
      return jsonError("Encounter ID, destination type, and clinical reason are required.", "INVALID_INPUT", 400);
    }

    const result = await ReferralService.finalizeReferral(
      encounter_id,
      {
        destination_type,
        destination_specialty_name,
        priority: priority || "ROUTINE",
        reason,
      },
      user
    );

    if (!result.success) {
      return jsonError(result.error || "Referral finalization failed.", "REFERRAL_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.referral }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process specialist referral.", "INTERNAL_ERROR", 500);
  }
}
