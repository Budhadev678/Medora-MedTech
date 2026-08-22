// ============================================================
// MEDORA — LABORATORY TESTING & RESULT ENTRY SERVICE (PHASE 8.3)
// Server-Authoritative Test Processing, Result Validation & Verification Service
// ============================================================

import {
  createTestWorkItem,
  assignTestWorkItem,
  startTestProcessing,
  updateTestWorkStatus,
  getTestWorkItemById,
  getFacilityWorklist,
} from "@/lib/data/lab-testing-store";
import {
  getAllTestResults,
  saveTestResults,
  getResultById,
  getOrderTestResults,
  getLabOrderById,
} from "@/lib/data/lab-order-store";
import { getMasterTestById } from "@/lib/data/lab-capability-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import { appendAuditEvent } from "@/lib/data/audit-store";
import type {
  HealthcareTestResult,
  TestResultType,
  ResultAbnormalFlag,
  TestResultStatus,
  TestResultVersionSnapshot,
  LabTestWorkItem,
} from "@/types/database.types";

export class LabTestingService {
  /**
   * Enrolls a specimen into testing by creating an authoritative TestWorkItem.
   */
  public static async enrollSampleForTesting(
    sampleId: string,
    labOrderId: string,
    testItemId: string,
    facilityId: string,
    facilityName: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; workItem?: LabTestWorkItem; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const order = getLabOrderById(labOrderId);
    if (!order) return { success: false, error: `Lab order ${labOrderId} not found.` };

    const item = order.items.find((i) => i.id === testItemId || i.test_id === testItemId);
    if (!item) return { success: false, error: `Lab order item ${testItemId} not found in order ${labOrderId}.` };

    const actorId = actor.identifier || actor.id;
    return createTestWorkItem({
      labOrderId,
      labOrderItemId: item.id,
      sampleId,
      testId: item.test_id || item.id,
      testCode: item.test_code,
      testName: item.test_name,
      specimenType: (item.specimen_type as any) || "WHOLE_BLOOD",
      facilityId,
      facilityName,
      priority: order.priority,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Starts processing a test work item.
   */
  public static async startTest(
    workItemId: string,
    instrumentName: string | undefined,
    method: string | undefined,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; workItem?: LabTestWorkItem; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const actorId = actor.identifier || actor.id;
    return startTestProcessing({
      workItemId,
      instrumentName,
      method,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Saves or submits a test result with mandatory data validation.
   */
  public static async submitTestResult(
    workItemId: string,
    data: {
      parameter_id?: string;
      parameter_name?: string;
      result_type: TestResultType;
      value: string;
      unit?: string;
      reference_range?: string;
      flag?: ResultAbnormalFlag;
      is_draft?: boolean;
      correction_reason?: string;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; result?: HealthcareTestResult; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const workItem = getTestWorkItemById(workItemId);
    if (!workItem) return { success: false, error: `Test work item ${workItemId} not found.` };

    if (!data.value || !data.value.trim()) {
      return { success: false, error: "Result value is required." };
    }

    // Server-Side Data Validation for NUMERIC type
    let numericVal: number | undefined = undefined;
    if (data.result_type === "NUMERIC") {
      const parsed = parseFloat(data.value.trim());
      if (isNaN(parsed)) {
        return { success: false, error: `Invalid numeric value "${data.value}". Expected a valid number.` };
      }
      numericVal = parsed;
    }

    const allResults = getAllTestResults();
    const actorId = actor.identifier || actor.id;
    const now = new Date().toISOString();

    const existingIndex = allResults.findIndex(
      (r) => r.lab_order_id.toLowerCase() === workItem.lab_order_id.toLowerCase() && r.test_id.toLowerCase() === workItem.test_id.toLowerCase()
    );

    let resultEntity: HealthcareTestResult;

    if (existingIndex >= 0) {
      const existing = allResults[existingIndex];
      const newVersion = existing.version + 1;
      const historySnapshot: TestResultVersionSnapshot = {
        version: existing.version,
        saved_at: existing.entered_at,
        saved_by_id: existing.entered_by_id,
        saved_by_name: existing.entered_by_name,
        value: existing.value,
        flag: existing.flag,
        amendment_reason: data.correction_reason || "Updated result value",
      };

      const history = [...(existing.version_history || []), historySnapshot];

      resultEntity = {
        ...existing,
        result_type: data.result_type,
        value: data.value.trim(),
        numeric_value: numericVal,
        unit: data.unit || existing.unit,
        reference_range: data.reference_range || existing.reference_range,
        flag: data.flag || "NORMAL",
        status: data.is_draft ? "ENTERED" : "ENTERED",
        entered_by_id: actorId,
        entered_by_name: actor.fullName,
        entered_at: now,
        version: newVersion,
        version_history: history,
        amendment_reason: data.correction_reason,
      };

      allResults[existingIndex] = resultEntity;
    } else {
      const resId = `RES-${1000 + allResults.length + 1}`;
      resultEntity = {
        id: resId,
        lab_order_id: workItem.lab_order_id,
        lab_order_item_id: workItem.lab_order_item_id,
        sample_id: workItem.sample_id,
        patient_id: workItem.patient_id,
        test_id: workItem.test_id,
        test_name: workItem.test_name,
        parameter_id: data.parameter_id || "PARAM-MAIN",
        parameter_name: data.parameter_name || workItem.test_name,
        result_type: data.result_type,
        value: data.value.trim(),
        numeric_value: numericVal,
        unit: data.unit || "g/dL",
        reference_range: data.reference_range || "12.0 - 16.0",
        flag: data.flag || "NORMAL",
        status: "ENTERED",
        entered_by_id: actorId,
        entered_by_name: actor.fullName,
        entered_at: now,
        version: 1,
        version_history: [],
      };

      allResults.push(resultEntity);
    }

    saveTestResults(allResults);

    // Update Test Work Item status
    const newStatus = data.is_draft ? "IN_PROGRESS" : "RESULT_ENTERED";
    updateTestWorkStatus(workItem.id, newStatus);

    appendAuditEvent(
      data.is_draft ? "RESULT_DRAFT_SAVED" : "RESULT_SUBMITTED",
      actorId,
      actor.fullName,
      actor.role,
      `Submitted test result for ${workItem.test_name}: ${data.value} ${data.unit || ""}`,
      workItem.patient_id,
      workItem.facility_id,
      workItem.facility_name,
      resultEntity.id
    );

    return { success: true, result: resultEntity };
  }

  /**
   * Verifies a test result (LAB_VERIFIER or LAB_ADMIN).
   * Enforces self-verification prevention guard.
   */
  public static async verifyResult(
    workItemId: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; result?: HealthcareTestResult; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const actorRole = (actor.role || "").toLowerCase();
    if (actorRole !== "lab_staff" && actorRole !== "admin" && actorRole !== "doctor") {
      return { success: false, error: "Access denied. Only authorized laboratory verifiers or doctors may verify results." };
    }

    const workItem = getTestWorkItemById(workItemId);
    if (!workItem) return { success: false, error: `Test work item ${workItemId} not found.` };

    const results = getOrderTestResults(workItem.lab_order_id);
    const result = results.find((r) => r.test_id.toLowerCase() === workItem.test_id.toLowerCase());
    if (!result) return { success: false, error: `No result entered for test ${workItem.test_name}. Submit result first.` };

    const actorId = actor.identifier || actor.id;

    // Self-Verification Guard: Technician cannot verify their own result unless admin
    if (result.entered_by_id.toLowerCase() === actorId.toLowerCase() && actorRole !== "admin") {
      return { success: false, error: "Self-verification blocked. The technician who entered the result cannot verify it." };
    }

    const allResults = getAllTestResults();
    const index = allResults.findIndex((r) => r.id === result.id);
    const now = new Date().toISOString();

    const verifiedResult: HealthcareTestResult = {
      ...result,
      status: "VERIFIED",
      verified_by_id: actorId,
      verified_by_name: actor.fullName,
      verified_at: now,
    };

    allResults[index] = verifiedResult;
    saveTestResults(allResults);

    // Update work item status to VERIFIED
    updateTestWorkStatus(workItem.id, "VERIFIED");

    appendAuditEvent(
      "RESULT_VERIFIED",
      actorId,
      actor.fullName,
      actor.role,
      `Verified diagnostic result ${result.id} (${result.test_name})`,
      result.patient_id,
      workItem.facility_id,
      workItem.facility_name,
      result.id
    );

    return { success: true, result: verifiedResult };
  }

  /**
   * Returns a result for correction with documented reason.
   */
  public static async returnForCorrection(
    workItemId: string,
    reason: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; workItem?: LabTestWorkItem; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };
    if (!reason || !reason.trim()) return { success: false, error: "Documented return reason is mandatory." };

    const workItem = getTestWorkItemById(workItemId);
    if (!workItem) return { success: false, error: `Test work item ${workItemId} not found.` };

    updateTestWorkStatus(workItem.id, "RETURNED_FOR_CORRECTION", reason.trim());
    const actorId = actor.identifier || actor.id;

    appendAuditEvent(
      "RESULT_RETURNED",
      actorId,
      actor.fullName,
      actor.role,
      `Returned test result for ${workItem.test_name} for correction: ${reason.trim()}`,
      workItem.patient_id,
      workItem.facility_id,
      workItem.facility_name,
      workItem.id
    );

    return { success: true, workItem: getTestWorkItemById(workItemId)! };
  }
}
