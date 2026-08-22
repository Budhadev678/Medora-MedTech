import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, jsonForbidden, validatePatientRecordAccess } from "@/lib/api/api-utils";
import { FinancialCoverageService } from "@/lib/services/financial-coverage-service";
import { getBillById } from "@/lib/data/billing-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const billId = searchParams.get("billId") || "BILL-1001";

  const bill = getBillById(billId);
  if (bill && !validatePatientRecordAccess(user, bill.patient_id)) {
    return jsonForbidden("You don't have permission to access this billing coverage waterfall.");
  }

  const waterfall = FinancialCoverageService.calculateFinancialWaterfall(billId);
  if (!waterfall) {
    return jsonError("Financial coverage waterfall not found for bill.", "NOT_FOUND", 404);
  }

  return jsonResponse({ success: true, data: waterfall });
}
