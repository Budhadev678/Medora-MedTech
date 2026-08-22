import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized, validateRole } from "@/lib/api/api-utils";
import { FinancialReconciliationService } from "@/lib/services/financial-reconciliation-service";
import { getAllReconciliationRuns } from "@/lib/data/reconciliation-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["finance_staff", "admin"])) {
    return jsonError("Only finance staff can view reconciliation runs.", "FORBIDDEN", 403);
  }

  const runs = getAllReconciliationRuns();
  return jsonResponse({ success: true, data: runs });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  if (!validateRole(user, ["finance_staff", "admin"])) {
    return jsonError("Only finance staff can execute automated 3-way reconciliation runs.", "FORBIDDEN", 403);
  }

  try {
    const body = await request.json();
    const { run_date } = body;

    const targetDate = run_date || new Date().toISOString().split("T")[0];

    const result = FinancialReconciliationService.runReconciliation({
      organizationId: body.organization_id || "HSP-1001",
      facilityId: body.facility_id || "FAC-1001",
      periodStart: body.period_start || targetDate,
      periodEnd: body.period_end || targetDate,
      actor: user,
    });

    if (!result.success) {
      return jsonError(result.error || "3-way reconciliation run failed.", "RECON_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.run }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to execute reconciliation run.", "INTERNAL_ERROR", 500);
  }
}
