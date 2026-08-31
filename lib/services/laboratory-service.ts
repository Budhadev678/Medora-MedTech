// ============================================================
// MEDORA — CONNECTED LABORATORY SERVICE (PHASE C.3)
// Authoritative Business Logic & Transaction Coordinator
// ============================================================

import type {
  HealthcareLabOrder,
  LabOrderItem,
  HealthcareLabSample,
  SampleType,
  SampleRejectionReason,
  HealthcareTestResult,
  HealthcareLabReport,
  ResultAbnormalFlag,
} from "@/types/database.types";
import type { StoredIdentity } from "@/lib/data/identity-store";
import {
  getAllLabOrders,
  saveLabOrders,
  getLabOrderById,
  getAllSamples,
  saveSamples,
  getSampleById,
  getOrderSamples,
  getAllTestResults,
  saveTestResults,
  getOrderTestResults,
  getAllLabReports,
  saveLabReports,
  getLabReportById,
  getPatientLabReports,
  selectLaboratoryForOrder,
  getLaboratoryLabOrders,
} from "@/lib/data/lab-order-store";
import { getLabTestById } from "@/lib/data/lab-test-catalog-store";
import { appendAuditEvent } from "@/lib/data/audit-store";

export interface LaboratoryServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export class LaboratoryService {
  /**
   * 1. Accept an incoming Lab Order at the Laboratory.
   */
  static acceptLabOrder(
    orderId: string,
    labActor: StoredIdentity | null
  ): LaboratoryServiceResponse<HealthcareLabOrder> {
    if (!labActor) {
      return { success: false, error: "Laboratory authentication required.", errorCode: "UNAUTHENTICATED" };
    }

    const allowedRoles = ["lab_staff", "admin", "doctor"];
    if (!allowedRoles.includes(labActor.role)) {
      return { success: false, error: "Unauthorized. Lab personnel credentials required.", errorCode: "FORBIDDEN" };
    }

    const orders = getAllLabOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId.trim());
    if (orderIndex === -1) {
      return { success: false, error: `Lab order ${orderId} not found.`, errorCode: "NOT_FOUND" };
    }

    const order = orders[orderIndex];

    if (order.status === "CANCELLED") {
      return { success: false, error: "Cannot accept a cancelled lab order.", errorCode: "ORDER_CANCELLED" };
    }

    // Organization / Lab Scoping: If order is assigned to Lab A, Lab B cannot accept it
    if (
      order.laboratory_id &&
      labActor.organizationId &&
      order.laboratory_id !== labActor.organizationId &&
      labActor.role !== "admin"
    ) {
      return { success: false, error: "Cross-laboratory access denied. This order is assigned to another diagnostic center.", errorCode: "CROSS_LAB_DENIED" };
    }

    const updatedOrder: HealthcareLabOrder = {
      ...order,
      status: "ACCEPTED",
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orders[orderIndex] = updatedOrder;
    saveLabOrders(orders);

    appendAuditEvent(
      "LAB_ORDER_ACCEPTED",
      labActor.identifier || labActor.id,
      labActor.fullName,
      labActor.role,
      `Accepted lab order ${order.id} for patient ${order.patient_name}`,
      order.patient_id,
      labActor.organizationId || order.organization_id,
      labActor.organizationName || order.organization_name,
      order.id,
      { status: "ACCEPTED" }
    );

    return { success: true, data: updatedOrder };
  }

  /**
   * 2. Reject an incoming Lab Order with a documented reason.
   */
  static rejectLabOrder(
    orderId: string,
    reason: string,
    labActor: StoredIdentity | null
  ): LaboratoryServiceResponse<HealthcareLabOrder> {
    if (!labActor) {
      return { success: false, error: "Laboratory authentication required.", errorCode: "UNAUTHENTICATED" };
    }

    const cleanReason = (reason || "").trim();
    if (!cleanReason) {
      return { success: false, error: "A documented rejection reason is mandatory.", errorCode: "REASON_REQUIRED" };
    }

    const orders = getAllLabOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId.trim());
    if (orderIndex === -1) {
      return { success: false, error: `Lab order ${orderId} not found.`, errorCode: "NOT_FOUND" };
    }

    const order = orders[orderIndex];
    const updatedOrder: HealthcareLabOrder = {
      ...order,
      status: "REJECTED",
      rejected_at: new Date().toISOString(),
      rejection_reason: cleanReason,
      updated_at: new Date().toISOString(),
    };

    orders[orderIndex] = updatedOrder;
    saveLabOrders(orders);

    appendAuditEvent(
      "LAB_ORDER_REJECTED",
      labActor.identifier || labActor.id,
      labActor.fullName,
      labActor.role,
      `Rejected lab order ${order.id}: ${cleanReason}`,
      order.patient_id,
      labActor.organizationId || order.organization_id,
      labActor.organizationName || order.organization_name,
      order.id,
      { reason: cleanReason }
    );

    return { success: true, data: updatedOrder };
  }

  /**
   * 3. Collect Biological Specimen / Sample with Patient Verification.
   */
  static collectSample(params: {
    orderId: string;
    sampleType: SampleType;
    testItemIds: string[];
    patientVerification: {
      patientId: string;
      patientName: string;
    };
    collectorActor: StoredIdentity | null;
  }): LaboratoryServiceResponse<HealthcareLabSample> {
    const { orderId, sampleType, testItemIds, patientVerification, collectorActor } = params;

    if (!collectorActor) {
      return { success: false, error: "Authentication required for specimen collection.", errorCode: "UNAUTHENTICATED" };
    }

    const allowedRoles = ["lab_staff", "admin", "doctor", "receptionist", "staff"];
    if (!allowedRoles.includes(collectorActor.role)) {
      return { success: false, error: "Unauthorized. Specimen collection staff credentials required.", errorCode: "FORBIDDEN" };
    }

    const order = getLabOrderById(orderId);
    if (!order) {
      return { success: false, error: `Lab order ${orderId} not found.`, errorCode: "NOT_FOUND" };
    }

    if (order.status === "CANCELLED" || order.status === "REJECTED") {
      return { success: false, error: `Cannot collect sample for ${order.status} order.`, errorCode: "INVALID_ORDER_STATUS" };
    }

    // Wrong Patient Verification Guard
    if (order.patient_id.toUpperCase() !== patientVerification.patientId.toUpperCase()) {
      return {
        success: false,
        error: `Patient verification mismatch: Order belongs to ${order.patient_name} (${order.patient_id}), but specimen collection attempted for ${patientVerification.patientName} (${patientVerification.patientId}).`,
        errorCode: "PATIENT_MISMATCH",
      };
    }

    // Resolve test names from order items
    const selectedItems = order.items.filter((i) => testItemIds.includes(i.id));
    const testNames = selectedItems.length > 0 ? selectedItems.map((i) => i.test_name) : order.items.map((i) => i.test_name);

    const samples = getAllSamples();
    const newId = `SMP-${1000 + samples.length + 1}`;
    const now = new Date().toISOString();

    const newSample: HealthcareLabSample = {
      id: newId,
      sample_barcode: newId,
      lab_order_id: order.id,
      patient_id: order.patient_id,
      patient_name: order.patient_name,
      laboratory_id: order.laboratory_id || collectorActor.organizationId || "LAB-1001",
      laboratory_name: order.laboratory_name || collectorActor.organizationName || "ABC Diagnostics",
      sample_type: sampleType,
      status: "COLLECTED",
      test_item_ids: testItemIds,
      test_names: testNames,
      collected_at: now,
      collected_by_id: collectorActor.identifier || collectorActor.id,
      collected_by_name: collectorActor.fullName,
      created_at: now,
      updated_at: now,
    };

    samples.push(newSample);
    saveSamples(samples);

    // Update order status to SAMPLE_COLLECTED
    const orders = getAllLabOrders();
    const orderIndex = orders.findIndex((o) => o.id === order.id);
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: "SAMPLE_COLLECTED",
        updated_at: now,
      };
      saveLabOrders(orders);
    }

    appendAuditEvent(
      "SAMPLE_COLLECTED",
      collectorActor.identifier || collectorActor.id,
      collectorActor.fullName,
      collectorActor.role,
      `Collected ${sampleType} specimen (${newId}) for patient ${order.patient_name}`,
      order.patient_id,
      collectorActor.organizationId || order.organization_id,
      collectorActor.organizationName || order.organization_name,
      order.id,
      { sampleId: newId, sampleType, testNames: testNames.join(", ") }
    );

    return { success: true, data: newSample };
  }

  /**
   * 4. Receive Specimen / Sample at Laboratory Intake.
   */
  static receiveSample(
    sampleId: string,
    receiverActor: StoredIdentity | null
  ): LaboratoryServiceResponse<HealthcareLabSample> {
    if (!receiverActor) {
      return { success: false, error: "Authentication required for specimen intake.", errorCode: "UNAUTHENTICATED" };
    }

    const samples = getAllSamples();
    const index = samples.findIndex((s) => s.id === sampleId.trim());
    if (index === -1) {
      return { success: false, error: `Sample ${sampleId} not found.`, errorCode: "NOT_FOUND" };
    }

    const sample = samples[index];
    if (sample.status === "REJECTED") {
      return { success: false, error: "Cannot receive a rejected sample.", errorCode: "SAMPLE_REJECTED" };
    }

    const now = new Date().toISOString();
    const updatedSample: HealthcareLabSample = {
      ...sample,
      status: "RECEIVED",
      received_at: now,
      received_by_id: receiverActor.identifier || receiverActor.id,
      received_by_name: receiverActor.fullName,
      updated_at: now,
    };

    samples[index] = updatedSample;
    saveSamples(samples);

    // Update parent order to SAMPLE_RECEIVED
    const orders = getAllLabOrders();
    const orderIndex = orders.findIndex((o) => o.id === sample.lab_order_id);
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: "SAMPLE_RECEIVED",
        updated_at: now,
      };
      saveLabOrders(orders);
    }

    appendAuditEvent(
      "SAMPLE_RECEIVED",
      receiverActor.identifier || receiverActor.id,
      receiverActor.fullName,
      receiverActor.role,
      `Received ${sample.sample_type} specimen ${sample.id} at diagnostic laboratory`,
      sample.patient_id,
      receiverActor.organizationId || sample.laboratory_id,
      receiverActor.organizationName || sample.laboratory_name,
      sample.lab_order_id,
      { sampleId: sample.id, sampleType: sample.sample_type }
    );

    return { success: true, data: updatedSample };
  }

  /**
   * 5. Reject a Specimen / Sample with documented reason.
   */
  static rejectSample(
    sampleId: string,
    reason: SampleRejectionReason,
    notes: string,
    actor: StoredIdentity | null
  ): LaboratoryServiceResponse<HealthcareLabSample> {
    if (!actor) {
      return { success: false, error: "Authentication required.", errorCode: "UNAUTHENTICATED" };
    }

    const samples = getAllSamples();
    const index = samples.findIndex((s) => s.id === sampleId.trim());
    if (index === -1) {
      return { success: false, error: `Sample ${sampleId} not found.`, errorCode: "NOT_FOUND" };
    }

    const sample = samples[index];
    const now = new Date().toISOString();

    const updatedSample: HealthcareLabSample = {
      ...sample,
      status: "REJECTED",
      rejected_at: now,
      rejected_by_id: actor.identifier || actor.id,
      rejected_by_name: actor.fullName,
      rejection_reason: reason,
      rejection_notes: notes || undefined,
      updated_at: now,
    };

    samples[index] = updatedSample;
    saveSamples(samples);

    appendAuditEvent(
      "SAMPLE_REJECTED",
      actor.identifier || actor.id,
      actor.fullName,
      actor.role,
      `Rejected specimen ${sample.id} due to ${reason}: ${notes}`,
      sample.patient_id,
      actor.organizationId || sample.laboratory_id,
      actor.organizationName || sample.laboratory_name,
      sample.lab_order_id,
      { sampleId: sample.id, reason, notes }
    );

    return { success: true, data: updatedSample };
  }

  /**
   * 6. Recollect a replacement sample following rejection.
   */
  static recollectSample(
    rejectedSampleId: string,
    collectorActor: StoredIdentity | null
  ): LaboratoryServiceResponse<HealthcareLabSample> {
    const rejectedSample = getSampleById(rejectedSampleId);
    if (!rejectedSample) {
      return { success: false, error: `Sample ${rejectedSampleId} not found.`, errorCode: "NOT_FOUND" };
    }

    if (rejectedSample.status !== "REJECTED") {
      return { success: false, error: "Recollection is only applicable for rejected samples.", errorCode: "NOT_REJECTED" };
    }

    const order = getLabOrderById(rejectedSample.lab_order_id);
    if (!order) {
      return { success: false, error: "Parent lab order not found.", errorCode: "ORDER_NOT_FOUND" };
    }

    const samples = getAllSamples();
    const newId = `SMP-${1000 + samples.length + 1}`;
    const now = new Date().toISOString();

    const newSample: HealthcareLabSample = {
      id: newId,
      sample_barcode: newId,
      lab_order_id: rejectedSample.lab_order_id,
      patient_id: rejectedSample.patient_id,
      patient_name: rejectedSample.patient_name,
      laboratory_id: rejectedSample.laboratory_id,
      laboratory_name: rejectedSample.laboratory_name,
      sample_type: rejectedSample.sample_type,
      status: "COLLECTED",
      test_item_ids: rejectedSample.test_item_ids,
      test_names: rejectedSample.test_names,
      collected_at: now,
      collected_by_id: collectorActor?.identifier || collectorActor?.id || "LAB-STAFF-1",
      collected_by_name: collectorActor?.fullName || "Laboratory Staff",
      is_recollection: true,
      previous_sample_id: rejectedSample.id,
      created_at: now,
      updated_at: now,
    };

    samples.push(newSample);
    saveSamples(samples);

    appendAuditEvent(
      "SAMPLE_COLLECTED",
      collectorActor?.identifier || "SYSTEM",
      collectorActor?.fullName || "System",
      collectorActor?.role || "lab_staff",
      `Recollected specimen ${newId} replacing rejected ${rejectedSample.id} for patient ${rejectedSample.patient_name}`,
      rejectedSample.patient_id,
      rejectedSample.laboratory_id,
      rejectedSample.laboratory_name,
      rejectedSample.lab_order_id,
      { newSampleId: newId, replacedSampleId: rejectedSample.id }
    );

    return { success: true, data: newSample };
  }

  /**
   * 7. Enter Structured Diagnostic Test Results by Technician.
   */
  static enterTestResults(params: {
    orderId: string;
    sampleId: string;
    results: {
      testId: string;
      testName: string;
      parameterId: string;
      parameterName: string;
      resultType: "NUMERIC" | "TEXT" | "QUALITATIVE" | "BOOLEAN";
      value: string;
      numericValue?: number;
      unit?: string;
      referenceRange?: string;
      flag: ResultAbnormalFlag;
    }[];
    techActor: StoredIdentity | null;
  }): LaboratoryServiceResponse<HealthcareTestResult[]> {
    const { orderId, sampleId, results, techActor } = params;

    if (!techActor) {
      return { success: false, error: "Laboratory technician authentication required.", errorCode: "UNAUTHENTICATED" };
    }

    const allowedRoles = ["lab_staff", "admin", "doctor"];
    if (!allowedRoles.includes(techActor.role)) {
      return { success: false, error: "Unauthorized. Lab technician credentials required.", errorCode: "FORBIDDEN" };
    }

    const order = getLabOrderById(orderId);
    if (!order) {
      return { success: false, error: `Lab order ${orderId} not found.`, errorCode: "NOT_FOUND" };
    }

    const sample = getSampleById(sampleId);
    if (!sample) {
      return { success: false, error: `Sample ${sampleId} not found.`, errorCode: "SAMPLE_NOT_FOUND" };
    }

    // Wrong sample / order integrity check
    if (sample.lab_order_id !== order.id) {
      return {
        success: false,
        error: `Sample mismatch: Specimen ${sample.id} is bound to order ${sample.lab_order_id}, not order ${order.id}.`,
        errorCode: "SAMPLE_ORDER_MISMATCH",
      };
    }

    // Wrong patient integrity check
    if (sample.patient_id.toUpperCase() !== order.patient_id.toUpperCase()) {
      return {
        success: false,
        error: `Patient mismatch: Specimen belongs to ${sample.patient_name} (${sample.patient_id}), but order belongs to ${order.patient_name} (${order.patient_id}).`,
        errorCode: "PATIENT_MISMATCH",
      };
    }

    if (results.length === 0) {
      return { success: false, error: "Cannot submit empty test results.", errorCode: "EMPTY_RESULTS" };
    }

    const allResults = getAllTestResults();
    const savedResults: HealthcareTestResult[] = [];
    const now = new Date().toISOString();

    for (const item of results) {
      const newId = `RES-${1000 + allResults.length + 1}`;
      const newResult: HealthcareTestResult = {
        id: newId,
        lab_order_id: order.id,
        lab_order_item_id: order.items[0]?.id || "LOI-1",
        sample_id: sample.id,
        patient_id: order.patient_id,
        test_id: item.testId,
        test_name: item.testName,
        parameter_id: item.parameterId,
        parameter_name: item.parameterName,
        result_type: item.resultType,
        value: item.value,
        numeric_value: item.numericValue,
        unit: item.unit,
        reference_range: item.referenceRange,
        flag: item.flag,
        status: "ENTERED",
        entered_by_id: techActor.identifier || techActor.id,
        entered_by_name: techActor.fullName,
        entered_at: now,
        version: 1,
      };

      allResults.push(newResult);
      savedResults.push(newResult);
    }

    saveTestResults(allResults);

    // Update order status to RESULT_PENDING / VERIFICATION_PENDING
    const orders = getAllLabOrders();
    const orderIndex = orders.findIndex((o) => o.id === order.id);
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: "VERIFICATION_PENDING",
        updated_at: now,
      };
      saveLabOrders(orders);
    }

    appendAuditEvent(
      "RESULT_ENTERED",
      techActor.identifier || techActor.id,
      techActor.fullName,
      techActor.role,
      `Entered ${results.length} diagnostic test results for order ${order.id} (${order.patient_name})`,
      order.patient_id,
      techActor.organizationId || order.organization_id,
      techActor.organizationName || order.organization_name,
      order.id,
      { count: results.length, sampleId: sample.id }
    );

    return { success: true, data: savedResults };
  }

  /**
   * 8. Verify Test Results by Pathologist / Authorized Verifier.
   */
  static verifyTestResults(
    orderId: string,
    verifierActor: StoredIdentity | null
  ): LaboratoryServiceResponse<HealthcareTestResult[]> {
    if (!verifierActor) {
      return { success: false, error: "Verifier authentication required.", errorCode: "UNAUTHENTICATED" };
    }

    // Strict verifier role enforcement
    const allowedRoles = ["lab_staff", "admin", "doctor"];
    if (!allowedRoles.includes(verifierActor.role)) {
      return { success: false, error: "Access denied. Only certified pathologists or authorized laboratory verifiers can verify test results.", errorCode: "VERIFIER_FORBIDDEN" };
    }

    const allResults = getAllTestResults();
    const orderResults = allResults.filter((r) => r.lab_order_id === orderId.trim());

    if (orderResults.length === 0) {
      return { success: false, error: `No test results found for order ${orderId}.`, errorCode: "NO_RESULTS" };
    }

    const now = new Date().toISOString();
    for (const r of orderResults) {
      r.status = "VERIFIED";
      r.verified_by_id = verifierActor.identifier || verifierActor.id;
      r.verified_by_name = verifierActor.fullName;
      r.verified_at = now;
    }

    saveTestResults(allResults);

    // Update order status to REPORT_READY
    const orders = getAllLabOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId.trim());
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: "REPORT_READY",
        updated_at: now,
      };
      saveLabOrders(orders);
    }

    appendAuditEvent(
      "RESULT_VERIFIED",
      verifierActor.identifier || verifierActor.id,
      verifierActor.fullName,
      verifierActor.role,
      `Verified ${orderResults.length} test results for order ${orderId}`,
      orderResults[0]?.patient_id,
      verifierActor.organizationId,
      verifierActor.organizationName,
      orderId,
      { count: orderResults.length }
    );

    return { success: true, data: orderResults };
  }

  /**
   * 9. Generate and Release Certified Laboratory Report.
   */
  static generateAndReleaseReport(
    paramOrOrderId: string | { orderId: string; results?: any[]; notes?: string; verifierActor: StoredIdentity | null },
    resultsArg?: any[],
    actorArg?: StoredIdentity | null
  ): LaboratoryServiceResponse<HealthcareLabReport> {
    let orderId: string;
    let explicitResults: any[] | undefined;
    let notes: string | undefined;
    let verifierActor: StoredIdentity | null;

    if (typeof paramOrOrderId === "object") {
      orderId = paramOrOrderId.orderId;
      explicitResults = paramOrOrderId.results;
      notes = paramOrOrderId.notes;
      verifierActor = paramOrOrderId.verifierActor;
    } else {
      orderId = paramOrOrderId;
      explicitResults = resultsArg;
      verifierActor = actorArg || null;
    }

    if (!verifierActor) {
      return { success: false, error: "Authentication required to release laboratory report.", errorCode: "UNAUTHENTICATED" };
    }

    const allowedRoles = ["lab_staff", "admin", "doctor", "staff", "nurse"];
    if (!allowedRoles.includes(verifierActor.role)) {
      return { success: false, error: "Unauthorized. Pathologist / Verifier credentials required.", errorCode: "FORBIDDEN" };
    }

    const order = getLabOrderById(orderId);
    if (!order) {
      return { success: false, error: `Lab order ${orderId} not found.`, errorCode: "NOT_FOUND" };
    }

    let results = explicitResults && explicitResults.length > 0 ? explicitResults : getOrderTestResults(order.id);
    if (results.length === 0) {
      return { success: false, error: "Cannot generate report with zero test results.", errorCode: "NO_RESULTS" };
    }

    const samples = getOrderSamples(order.id);
    const sampleIds = samples.map((s) => s.id);

    const reports = getAllLabReports();
    const newId = `RPT-${1000 + reports.length + 1}`;
    const now = new Date().toISOString();

    const newReport: HealthcareLabReport = {
      id: newId,
      report_reference: newId,
      lab_order_id: order.id,
      patient_id: order.patient_id,
      patient_name: order.patient_name,
      encounter_id: order.encounter_id,
      ordering_provider_id: order.ordering_provider_id,
      ordering_provider_name: order.ordering_provider_name,
      ordering_provider_role: order.ordering_provider_role,
      laboratory_id: order.selected_lab_id || order.laboratory_id || verifierActor.organizationId || "LAB-FAC-1001",
      laboratory_name: order.selected_lab_name || order.laboratory_name || verifierActor.organizationName || "ABC Diagnostics — Rourkela Central Lab",
      status: "RELEASED",
      version: 1,
      sample_ids: sampleIds,
      results: [...results],
      notes: notes || "Results verified and certified according to standard clinical laboratory protocols.",
      generated_at: now,
      verified_by_id: verifierActor.identifier || verifierActor.id,
      verified_by_name: verifierActor.fullName,
      verified_at: now,
      released_at: now,
      released_by_id: verifierActor.identifier || verifierActor.id,
      released_by_name: verifierActor.fullName,
      source_type: "MEDORA_CONNECTED_LAB",
      created_at: now,
      updated_at: now,
    };

    reports.push(newReport);
    saveLabReports(reports);

    // Update parent order to COMPLETED / RELEASED
    const orders = getAllLabOrders();
    const orderIndex = orders.findIndex((o) => o.id === order.id);
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: "RELEASED",
        completed_at: now,
        updated_at: now,
      };
      saveLabOrders(orders);
    }

    appendAuditEvent(
      "REPORT_RELEASED",
      verifierActor.identifier || verifierActor.id,
      verifierActor.fullName,
      verifierActor.role,
      `Generated and released certified diagnostic report ${newId} for patient ${order.patient_name}`,
      order.patient_id,
      verifierActor.organizationId || order.organization_id,
      verifierActor.organizationName || order.organization_name,
      order.id,
      { reportId: newId, resultsCount: results.length }
    );

    return { success: true, data: newReport };
  }

  /**
   * 10. Amend a Released Laboratory Report with Documented Clinical Reason.
   */
  static amendReport(params: {
    reportId: string;
    updatedResults: HealthcareTestResult[];
    amendmentReason: string;
    verifierActor: StoredIdentity | null;
  }): LaboratoryServiceResponse<HealthcareLabReport> {
    const { reportId, updatedResults, amendmentReason, verifierActor } = params;

    if (!verifierActor) {
      return { success: false, error: "Authentication required for report amendment.", errorCode: "UNAUTHENTICATED" };
    }

    const cleanReason = (amendmentReason || "").trim();
    if (!cleanReason) {
      return { success: false, error: "A documented clinical amendment reason is mandatory.", errorCode: "AMENDMENT_REASON_REQUIRED" };
    }

    const reports = getAllLabReports();
    const index = reports.findIndex((r) => r.id === reportId.trim());
    if (index === -1) {
      return { success: false, error: `Report ${reportId} not found.`, errorCode: "NOT_FOUND" };
    }

    const report = reports[index];
    const now = new Date().toISOString();

    // Preserve snapshot of previous version in version_history
    const previousSnapshot = {
      version: report.version,
      saved_at: report.updated_at || report.released_at || now,
      saved_by_id: report.released_by_id || "SYSTEM",
      saved_by_name: report.released_by_name || "Verifier",
      results: JSON.parse(JSON.stringify(report.results)),
      amendment_reason: report.amendment_reason,
    };

    const newVersionHistory = [...(report.version_history || []), previousSnapshot];
    const nextVersion = (report.version || 1) + 1;

    const updatedReport: HealthcareLabReport = {
      ...report,
      version: nextVersion,
      version_history: newVersionHistory,
      status: "AMENDED",
      results: updatedResults,
      amendment_reason: cleanReason,
      updated_at: now,
    };

    reports[index] = updatedReport;
    saveLabReports(reports);

    appendAuditEvent(
      "REPORT_AMENDED",
      verifierActor.identifier || verifierActor.id,
      verifierActor.fullName,
      verifierActor.role,
      `Amended laboratory report ${report.id} to version ${nextVersion}: ${cleanReason}`,
      report.patient_id,
      verifierActor.organizationId || report.laboratory_id,
      verifierActor.organizationName || report.laboratory_name,
      report.lab_order_id,
      { reportId: report.id, version: nextVersion, reason: cleanReason }
    );

    return { success: true, data: updatedReport };
  }

  /**
   * 11. Patient selects an authorized laboratory for testing.
   */
  static selectLaboratory(
    orderId: string,
    laboratoryId: string,
    laboratoryName: string,
    patientActor: StoredIdentity | null
  ): LaboratoryServiceResponse<HealthcareLabOrder> {
    if (!patientActor) {
      return { success: false, error: "Authentication required.", errorCode: "UNAUTHENTICATED" };
    }

    const actorId = patientActor.identifier || patientActor.id;
    const res = selectLaboratoryForOrder({
      orderId,
      laboratoryId,
      laboratoryName,
      actorId,
      actorName: patientActor.fullName,
      actorRole: patientActor.role,
    });

    if (!res.success) {
      return { success: false, error: res.error, errorCode: "SELECTION_FAILED" };
    }

    return { success: true, data: res.order };
  }

  /**
   * 12. Retrieve orders assigned to a specific laboratory facility.
   */
  static getLaboratoryOrders(
    laboratoryId: string,
    actor?: StoredIdentity | null
  ): HealthcareLabOrder[] {
    return getLaboratoryLabOrders(laboratoryId);
  }
}

