import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, validateRole } from "@/lib/api/api-utils";
import { PharmacyInventoryService } from "@/lib/services/pharmacy-inventory-service";
import { getFacilityInventory } from "@/lib/data/pharmacy-inventory-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const facilityId = searchParams.get("facilityId") || "FAC-1001";

  const items = getFacilityInventory(facilityId);
  return jsonResponse({ success: true, data: items });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["pharmacy_staff", "admin"])) {
    return jsonError("Only authorized pharmacists can evaluate inventory availability.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { prescription_id, pharmacy_facility_id } = body;

    if (!prescription_id || !pharmacy_facility_id) {
      return jsonError("Prescription ID and pharmacy facility ID are required.", "INVALID_INPUT", 400);
    }

    const evaluation = PharmacyInventoryService.evaluatePharmacyAvailability(
      prescription_id,
      pharmacy_facility_id
    );

    return jsonResponse({ success: true, data: evaluation });
  } catch (err: any) {
    return jsonError(err.message || "Failed to evaluate pharmacy inventory.", "INTERNAL_ERROR", 500);
  }
}
