// ============================================================
// MEDORA — LABORATORY REPORT & AUTHENTICITY SERVICE (PHASE 8.4)
// Authoritative Report Finalization, Authenticity Token & Sharing Service
// ============================================================

import {
  getAllLabReports,
  saveLabReports,
  getLabReportById,
  getLabOrderById,
  getOrderTestResults,
  createReportVerificationToken,
  getReportVerificationToken,
  shareLabReport,
  getReportSharesForPatient,
  revokeReportShare,
} from "@/lib/data/lab-order-store";
import { getOrderSamples } from "@/lib/data/lab-sample-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import { appendAuditEvent } from "@/lib/data/audit-store";
import type { HealthcareLabReport, LabReportVersionSnapshot, HealthcareTestResult } from "@/types/database.types";

export class LabReportService {
  /**
   * Compiles and finalizes an authoritative diagnostic lab report from verified results.
   */
  public static async generateAndFinalizeReport(
    labOrderId: string,
    notes: string | undefined,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; report?: HealthcareLabReport; verification_token?: string; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const order = getLabOrderById(labOrderId);
    if (!order) return { success: false, error: `Lab order ${labOrderId} not found.` };

    const results = getOrderTestResults(labOrderId);
    if (results.length === 0) {
      return { success: false, error: "Cannot generate report: No test results exist for this order." };
    }

    // Verify that all test results are VERIFIED
    const unverified = results.filter((r) => r.status !== "VERIFIED");
    if (unverified.length > 0) {
      return {
        success: false,
        error: `Cannot finalize report: ${unverified.length} test result(s) are not yet VERIFIED (${unverified.map((u) => u.test_name).join(", ")}).`,
      };
    }

    const samples = getOrderSamples(labOrderId);
    const sampleIds = samples.map((s) => s.id);
    const allReports = getAllLabReports();
    const actorId = actor.identifier || actor.id;
    const now = new Date().toISOString();

    const existingIndex = allReports.findIndex((r) => r.lab_order_id.toLowerCase() === labOrderId.toLowerCase());
    let reportEntity: HealthcareLabReport;

    if (existingIndex >= 0) {
      const existing = allReports[existingIndex];
      const newVersion = existing.version + 1;
      const historySnapshot: LabReportVersionSnapshot = {
        version: existing.version,
        saved_at: existing.updated_at || existing.generated_at || now,
        saved_by_id: existing.verified_by_id || actorId,
        saved_by_name: existing.verified_by_name || actor.fullName,
        results: existing.results,
        amendment_reason: notes || "Report updated with verified results",
      };

      const history = [...(existing.version_history || []), historySnapshot];

      reportEntity = {
        ...existing,
        status: "RELEASED",
        version: newVersion,
        version_history: history,
        results,
        sample_ids: sampleIds,
        notes: notes || existing.notes,
        released_at: now,
        released_by_id: actorId,
        released_by_name: actor.fullName,
        updated_at: now,
      };

      allReports[existingIndex] = reportEntity;
    } else {
      const rptId = `RPT-${1000 + allReports.length + 1}`;
      reportEntity = {
        id: rptId,
        report_reference: rptId,
        lab_order_id: labOrderId,
        patient_id: order.patient_id,
        patient_name: order.patient_name,
        encounter_id: order.encounter_id,
        ordering_provider_id: order.ordering_provider_id,
        ordering_provider_name: order.ordering_provider_name,
        ordering_provider_role: order.ordering_provider_role,
        laboratory_id: order.laboratory_id || order.organization_id,
        laboratory_name: order.laboratory_name || order.organization_name,
        status: "RELEASED",
        version: 1,
        version_history: [],
        sample_ids: sampleIds,
        results,
        notes: notes || "Diagnostic report generated from verified laboratory measurements.",
        generated_at: now,
        verified_by_id: actorId,
        verified_by_name: actor.fullName,
        verified_at: now,
        released_at: now,
        released_by_id: actorId,
        released_by_name: actor.fullName,
        source_type: "MEDORA_CONNECTED_LAB",
        created_at: now,
        updated_at: now,
      };

      allReports.push(reportEntity);
    }

    saveLabReports(allReports);

    // Create Authenticity Token
    const tokObj = createReportVerificationToken(reportEntity.id, reportEntity.version);

    appendAuditEvent(
      "REPORT_FINALIZED",
      actorId,
      actor.fullName,
      actor.role,
      `Finalized diagnostic lab report ${reportEntity.id} V${reportEntity.version} for patient ${reportEntity.patient_name}`,
      reportEntity.patient_id,
      reportEntity.laboratory_id,
      reportEntity.laboratory_name,
      reportEntity.id
    );

    return { success: true, report: reportEntity, verification_token: tokObj.verification_token };
  }

  /**
   * Public verification endpoint lookup by token string.
   */
  public static verifyReportByToken(tokenString: string): {
    valid: boolean;
    reportSummary?: {
      report_id: string;
      version: number;
      status: string;
      laboratory_name: string;
      finalized_at: string;
      is_current: boolean;
    };
    error?: string;
  } {
    const tokRecord = getReportVerificationToken(tokenString);
    if (!tokRecord) {
      return { valid: false, error: "Report could not be verified. Invalid or unknown verification token." };
    }

    const report = getLabReportById(tokRecord.report_id);
    if (!report) {
      return { valid: false, error: "Report record not found." };
    }

    const isCurrent = report.version === tokRecord.report_version;

    return {
      valid: true,
      reportSummary: {
        report_id: report.id,
        version: tokRecord.report_version,
        status: isCurrent ? report.status : "SUPERSEDED",
        laboratory_name: report.laboratory_name,
        finalized_at: report.released_at || report.created_at,
        is_current: isCurrent,
      },
    };
  }

  /**
   * Shares a finalized report with an authorized recipient (Phase 15 integration).
   */
  public static async shareReport(
    reportId: string,
    recipientId: string,
    recipientName: string,
    permission: "VIEW" | "DOWNLOAD",
    durationHours: number,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; share?: any; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const report = getLabReportById(reportId);
    if (!report) return { success: false, error: `Report ${reportId} not found.` };

    const actorId = actor.identifier || actor.id;
    if (actor.role === "patient" && actorId.toLowerCase() !== report.patient_id.toLowerCase()) {
      return { success: false, error: "Access denied. You can only share your own reports." };
    }

    const share = shareLabReport({
      reportId: report.id,
      reportVersion: report.version,
      ownerId: report.patient_id,
      ownerName: report.patient_name,
      recipientId,
      recipientName,
      permission,
      durationHours: durationHours || 24,
    });

    appendAuditEvent(
      "REPORT_SHARED",
      actorId,
      actor.fullName,
      actor.role,
      `Shared report ${report.id} with ${recipientName} (${permission}) for ${durationHours}h`,
      report.patient_id,
      report.laboratory_id,
      report.laboratory_name,
      share.id
    );

    return { success: true, share };
  }
}
