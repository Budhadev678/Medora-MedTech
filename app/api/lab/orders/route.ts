import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, jsonForbidden, validateRole, validatePatientRecordAccess } from "@/lib/api/api-utils";
import { LabOrderService } from "@/lib/services/lab-order-service";
import { getAllLabOrders, getPatientLabOrders } from "@/lib/data/lab-order-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const targetPatientId = searchParams.get("patientId");

  if (user.role === "patient") {
    const authorizedPatientId = user.identifier || user.id;
    if (targetPatientId && targetPatientId.toLowerCase() !== authorizedPatientId.toLowerCase()) {
      return jsonForbidden("You don't have permission to access another patient's lab orders.");
    }
    const list = getPatientLabOrders(authorizedPatientId);
    return jsonResponse({ success: true, data: list });
  }

  if (targetPatientId) {
    const list = getPatientLabOrders(targetPatientId);
    return jsonResponse({ success: true, data: list });
  }

  const all = getAllLabOrders();
  return jsonResponse({ success: true, data: all });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["doctor", "admin"])) {
    return jsonError("Only authorized doctors can submit lab test orders.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { encounter_id, items, reason, priority } = body;

    if (!encounter_id || !items || !Array.isArray(items) || items.length === 0 || !reason) {
      return jsonError("Encounter ID, test items, and clinical indication reason are required.", "INVALID_INPUT", 400);
    }

    const result = await LabOrderService.finalizeLabOrder(
      encounter_id,
      { items, reason, priority: priority || "ROUTINE" },
      user
    );

    if (!result.success) {
      return jsonError(result.error || "Lab order submission failed.", "SUBMIT_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.order }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process lab order.", "INTERNAL_ERROR", 500);
  }
}
