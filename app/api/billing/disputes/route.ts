import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, jsonForbidden, validatePatientRecordAccess } from "@/lib/api/api-utils";
import { DisputeInvestigationService } from "@/lib/services/dispute-investigation-service";
import { getAllDisputes, getDisputesByPatient } from "@/lib/data/dispute-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const targetPatientId = searchParams.get("patientId") || (user.role === "patient" ? user.identifier || user.id : undefined);

  if (user.role === "patient") {
    const authorizedPatientId = user.identifier || user.id;
    if (targetPatientId && targetPatientId.toLowerCase() !== authorizedPatientId.toLowerCase()) {
      return jsonForbidden("You don't have permission to access another patient's billing disputes.");
    }
    const list = getDisputesByPatient(authorizedPatientId);
    return jsonResponse({ success: true, data: list });
  }

  if (targetPatientId) {
    const list = getDisputesByPatient(targetPatientId);
    return jsonResponse({ success: true, data: list });
  }

  const all = getAllDisputes();
  return jsonResponse({ success: true, data: all });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  try {
    const body = await request.json();
    const { bill_id, reason, bill_item_id, category } = body;

    if (!bill_id || !reason) {
      return jsonError("Bill ID and reason for dispute are required.", "INVALID_INPUT", 400);
    }

    const patientId = user.role === "patient" ? user.identifier || user.id : body.patient_id || "PAT-1001";
    const patientName = user.role === "patient" ? user.fullName : body.patient_name || "Rahul Verma";

    const result = await DisputeInvestigationService.submitDispute({
      billId: bill_id,
      billItemId: bill_item_id,
      patientId,
      patientName,
      category: category || "UNRECOGNIZED_CHARGE",
      description: reason,
      actor: user,
    });

    if (!result.success) {
      return jsonError(result.error || "Dispute submission failed.", "DISPUTE_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.dispute }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process dispute submission.", "INTERNAL_ERROR", 500);
  }
}
