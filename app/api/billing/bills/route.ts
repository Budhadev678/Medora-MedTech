import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, jsonForbidden, validateRole, validatePatientRecordAccess } from "@/lib/api/api-utils";
import { BillingEngineService } from "@/lib/services/billing-engine-service";
import { getAllBills, getBillById, getBillsByPatient } from "@/lib/data/billing-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const billId = searchParams.get("billId");
  const targetPatientId = searchParams.get("patientId") || (user.role === "patient" ? user.identifier || user.id : undefined);

  if (billId) {
    const bill = getBillById(billId);
    if (!bill) return jsonError("Healthcare bill not found.", "NOT_FOUND", 404);
    if (!validatePatientRecordAccess(user, bill.patient_id)) {
      return jsonForbidden("You don't have permission to access this bill.");
    }
    return jsonResponse({ success: true, data: bill });
  }

  if (user.role === "patient") {
    const authorizedPatientId = user.identifier || user.id;
    if (targetPatientId && targetPatientId.toLowerCase() !== authorizedPatientId.toLowerCase()) {
      return jsonForbidden("You don't have permission to access another patient's billing records.");
    }
    const list = getBillsByPatient(authorizedPatientId);
    return jsonResponse({ success: true, data: list });
  }

  if (targetPatientId) {
    const list = getBillsByPatient(targetPatientId);
    return jsonResponse({ success: true, data: list });
  }

  const all = getAllBills();
  return jsonResponse({ success: true, data: all });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["hospital_admin", "finance_staff", "admin"])) {
    return jsonError("Only authorized billing staff can create healthcare bills.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { patient_id, encounter_id, facility_id } = body;

    if (!patient_id) {
      return jsonError("Patient ID is required.", "INVALID_INPUT", 400);
    }

    const result = BillingEngineService.createDraftBill({
      patientId: patient_id,
      patientName: body.patient_name || "Rahul Verma",
      organizationId: "HSP-1001",
      organizationName: "City Hospital Group",
      facilityId: facility_id || "FAC-1001",
      facilityName: "Main Campus Campus",
      encounterId: encounter_id || "ENC-1001",
      billType: "FINAL",
      actor: user,
    });

    if (!result.success) {
      return jsonError(result.error || "Bill creation failed.", "BILL_CREATION_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.bill }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process healthcare bill.", "INTERNAL_ERROR", 500);
  }
}
