import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, validateRole } from "@/lib/api/api-utils";
import { LabSampleService } from "@/lib/services/lab-sample-service";

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["lab_staff", "admin"])) {
    return jsonError("Only authorized lab technicians can collect and process samples.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { lab_order_id, sample_type } = body;

    if (!lab_order_id || !sample_type) {
      return jsonError("Lab order ID and sample type are required.", "INVALID_INPUT", 400);
    }

    const result = await LabSampleService.collectSample(
      lab_order_id,
      {
        sample_type,
        test_item_ids: body.test_item_ids || ["TI-1001"],
        test_names: body.test_names || ["Laboratory Investigation"],
        facility_id: body.facility_id || "LAB-FAC-1001",
        location: body.location || "Collection Booth 1",
      },
      user
    );

    if (!result.success) {
      return jsonError(result.error || "Sample collection failed.", "COLLECTION_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.sample }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process lab sample.", "INTERNAL_ERROR", 500);
  }
}
