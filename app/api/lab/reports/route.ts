import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, jsonForbidden, validateRole, validatePatientRecordAccess } from "@/lib/api/api-utils";
import { LabReportService } from "@/lib/services/lab-report-service";
import { getPatientLabReports } from "@/lib/data/lab-order-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const targetPatientId = searchParams.get("patientId") || (user.role === "patient" ? user.identifier || user.id : undefined);

  if (user.role === "patient") {
    const authorizedPatientId = user.identifier || user.id;
    if (targetPatientId && targetPatientId.toLowerCase() !== authorizedPatientId.toLowerCase()) {
      return jsonForbidden("You don't have permission to access another patient's lab reports.");
    }
    const reports = getPatientLabReports(authorizedPatientId, false);
    return jsonResponse({ success: true, data: reports });
  }

  const patientId = targetPatientId || "PAT-1001";
  const reports = getPatientLabReports(patientId, false);
  return jsonResponse({ success: true, data: reports });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["lab_staff", "admin"])) {
    return jsonError("Only authorized pathologists and lab staff can release certified lab reports.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { lab_order_id, clinical_impression } = body;

    if (!lab_order_id) {
      return jsonError("Lab order ID is required.", "INVALID_INPUT", 400);
    }

    const result = await LabReportService.generateAndFinalizeReport(
      lab_order_id,
      clinical_impression,
      user
    );

    if (!result.success) {
      return jsonError(result.error || "Report release failed.", "RELEASE_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.report }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to release certified lab report.", "INTERNAL_ERROR", 500);
  }
}
