import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, jsonForbidden, validateRole, validatePatientRecordAccess } from "@/lib/api/api-utils";
import { PrescriptionOrderService } from "@/lib/services/prescription-order-service";
import { getPatientPrescriptions, getPrescriptionById } from "@/lib/data/prescription-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const rxId = searchParams.get("id");
  const targetPatientId = searchParams.get("patientId") || (user.role === "patient" ? user.identifier || user.id : undefined);

  if (rxId) {
    const rx = getPrescriptionById(rxId);
    if (!rx) return jsonError("Prescription not found.", "NOT_FOUND", 404);
    if (!validatePatientRecordAccess(user, rx.patient_id)) {
      return jsonForbidden("You don't have permission to access this prescription.");
    }
    return jsonResponse({ success: true, data: rx });
  }

  if (user.role === "patient") {
    const authorizedPatientId = user.identifier || user.id;
    if (targetPatientId && targetPatientId.toLowerCase() !== authorizedPatientId.toLowerCase()) {
      return jsonForbidden("You don't have permission to access another patient's prescriptions.");
    }
    const list = getPatientPrescriptions(authorizedPatientId);
    return jsonResponse({ success: true, data: list });
  }

  const patientId = targetPatientId || "PAT-1001";
  const list = getPatientPrescriptions(patientId);
  return jsonResponse({ success: true, data: list });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["doctor", "admin"])) {
    return jsonError("Only authorized doctors can issue e-prescriptions.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { encounter_id, items, notes } = body;

    if (!encounter_id || !items || !Array.isArray(items) || items.length === 0) {
      return jsonError("Encounter ID and at least one prescription item are required.", "INVALID_INPUT", 400);
    }

    const result = await PrescriptionOrderService.finalizePrescription(
      encounter_id,
      { items, notes },
      user
    );

    if (!result.success) {
      return jsonError(result.error || "Prescription finalization failed.", "FINALIZE_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.prescription }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process prescription.", "INTERNAL_ERROR", 500);
  }
}
