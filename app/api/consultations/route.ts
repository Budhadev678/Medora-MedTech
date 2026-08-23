import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, jsonForbidden, validateRole, validatePatientRecordAccess } from "@/lib/api/api-utils";
import { ConsultationService } from "@/lib/services/consultation-service";
import { getEncounterById, getPatientEncounters } from "@/lib/data/encounter-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const encounterId = searchParams.get("encounterId");
  const targetPatientId = searchParams.get("patientId") || (user.role === "patient" ? user.identifier || user.id : undefined);

  if (encounterId) {
    const enc = getEncounterById(encounterId);
    if (!enc) return jsonError("Encounter not found.", "NOT_FOUND", 404);
    if (!validatePatientRecordAccess(user, enc.patient_id)) {
      return jsonForbidden("You don't have permission to access this clinical encounter.");
    }
    return jsonResponse({ success: true, data: enc });
  }

  if (user.role === "patient") {
    const authorizedPatientId = user.identifier || user.id;
    if (targetPatientId && targetPatientId.toLowerCase() !== authorizedPatientId.toLowerCase()) {
      return jsonForbidden("You don't have permission to access another patient's clinical records.");
    }
    const list = getPatientEncounters(authorizedPatientId);
    return jsonResponse({ success: true, data: list });
  }

  const patientId = targetPatientId || "PAT-1001";
  const list = getPatientEncounters(patientId);
  return jsonResponse({ success: true, data: list });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["doctor", "admin"])) {
    return jsonError("Only authorized doctors can complete consultations.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { encounter_id, subjective, objective, assessment, clinical_notes, diagnoses } = body;

    if (!encounter_id) {
      return jsonError("Encounter ID is required.", "INVALID_INPUT", 400);
    }

    const result = await ConsultationService.completeConsultation(
      encounter_id,
      {
        clinical_notes: clinical_notes || subjective,
        assessment,
        diagnoses: diagnoses || [],
      },
      user
    );

    if (!result.success) {
      return jsonError(result.message || "Consultation finalization failed.", result.error_code || "FINALIZE_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.clinical_record });
  } catch (err: any) {
    return jsonError(err.message || "Failed to finalize consultation.", "INTERNAL_ERROR", 500);
  }
}
