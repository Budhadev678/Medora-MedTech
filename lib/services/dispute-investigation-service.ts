// ============================================================
// MEDORA — DISPUTES, ANOMALY ENGINE & INVESTIGATION SERVICE (PHASE 10.4 + MULTI-STAGE ESCALATION)
// Server-Authoritative Evidence Graph, Multi-Stage Dispute Resolution & Prototype External Escalation
// ============================================================

import {
  saveDispute,
  saveAnomaly,
  saveInvestigation,
  saveDisputeResolution,
  getDisputeById,
  getInvestigationByDisputeId,
} from "@/lib/data/dispute-store";
import { getBillById } from "@/lib/data/billing-store";
import { getEncounterById } from "@/lib/data/encounter-store";
import { getLabOrderById } from "@/lib/data/lab-order-store";
import { getPrescriptionById } from "@/lib/data/prescription-store";
import { getPaymentsForBill } from "@/lib/data/payment-store";
import { AuditLedger, appendAuditEvent } from "@/lib/data/audit-store";
import { BillingEngineService } from "@/lib/services/billing-engine-service";
import { StoredIdentity } from "@/lib/data/identity-store";
import { saveExternalCase, ExternalDisputeCase } from "@/lib/data/external-dispute-store";
import type {
  FinancialDispute,
  FinancialAnomaly,
  FinancialInvestigation,
  EvidenceNode,
  DisputeResolution,
  DisputeCategory,
  DisputeStatus,
} from "@/types/database.types";

export class DisputeInvestigationService {
  /**
   * Submits a formal financial dispute by patient or authorized staff.
   */
  public static submitDispute(params: {
    patientId: string;
    patientName: string;
    billId: string;
    billItemId?: string;
    serviceName?: string;
    chargedAmount?: number;
    benchmarkAmount?: number;
    differenceAmount?: number;
    referenceRateId?: string;
    category: DisputeCategory;
    description: string;
    actor: StoredIdentity | null;
  }): { success: boolean; dispute?: FinancialDispute; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    if (!params.description || params.description.trim().length < 5) {
      return { success: false, error: "Description must be at least 5 characters long." };
    }

    const bill = getBillById(params.billId);
    if (!bill) return { success: false, error: `Bill ${params.billId} not found.` };

    const now = new Date().toISOString();
    const dispNum = 1000 + (Date.now() % 9000);
    const disputeId = `DISP-${dispNum}`;

    const dispute: FinancialDispute = {
      id: disputeId,
      dispute_number: `MEDORA-DISP-${dispNum}`,
      patient_id: params.patientId,
      patient_name: params.patientName,
      organization_id: bill.organization_id,
      facility_id: bill.facility_id,
      bill_id: bill.id,
      bill_item_id: params.billItemId,
      service_name: params.serviceName,
      charged_amount: params.chargedAmount,
      benchmark_amount: params.benchmarkAmount,
      difference_amount: params.differenceAmount,
      reference_rate_id: params.referenceRateId,
      category: params.category,
      description: params.description,
      status: "HOSPITAL_REVIEW_L1",
      current_stage: "HOSPITAL_L1",
      priority: "MEDIUM",
      created_at: now,
      updated_at: now,
    };

    saveDispute(dispute);

    // Automatically trigger internal evidence timeline compilation
    this.gatherInternalEvidenceTimeline(dispute.id);

    appendAuditEvent(
      "DISPUTE_CREATED",
      params.actor.identifier || params.actor.id,
      params.actor.fullName,
      params.actor.role,
      `Submitted financial dispute ${dispute.dispute_number} for bill ${bill.id}: ${params.category}`,
      params.patientId,
      bill.organization_id,
      undefined,
      dispute.id
    );

    return { success: true, dispute };
  }

  /**
   * Hospital Review Level 1 Response:
   * Reviewer explains charge, applies adjustment/refund, or escalates internally to Level 2.
   */
  public static respondHospitalLevel1(params: {
    disputeId: string;
    explanation: string;
    action: "EXPLAIN" | "ADJUST" | "REFUND" | "REJECT" | "ESCALATE_L2";
    adjustmentAmount?: number;
    actor: StoredIdentity | null;
  }): { success: boolean; dispute?: FinancialDispute; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    const dispute = getDisputeById(params.disputeId);
    if (!dispute) return { success: false, error: `Dispute ${params.disputeId} not found.` };

    const now = new Date().toISOString();
    const actorName = params.actor.fullName;

    dispute.l1_response = {
      action: params.action,
      explanation: params.explanation.trim(),
      adjustment_amount: params.adjustmentAmount,
      responder_name: actorName,
      timestamp: now,
    };
    dispute.updated_at = now;

    if (params.action === "EXPLAIN") {
      dispute.status = "HOSPITAL_RESPONSE_RECEIVED";
    } else if (params.action === "ADJUST" || params.action === "REFUND") {
      dispute.status = "RESOLVED_BY_HOSPITAL";
      dispute.current_stage = "RESOLVED";
      dispute.resolved_at = now;
    } else if (params.action === "REJECT") {
      dispute.status = "REJECTED";
    } else if (params.action === "ESCALATE_L2") {
      dispute.status = "HOSPITAL_REVIEW_L2";
      dispute.current_stage = "HOSPITAL_L2";
    }

    saveDispute(dispute);

    appendAuditEvent(
      "DISPUTE_UPDATED",
      params.actor.identifier || params.actor.id,
      actorName,
      params.actor.role,
      `Hospital Level 1 review response for dispute ${dispute.dispute_number}: Action=${params.action}. Note: ${params.explanation}`,
      dispute.patient_id,
      dispute.organization_id,
      undefined,
      dispute.id
    );

    return { success: true, dispute };
  }

  /**
   * Hospital Review Level 2 Response: Internal Escalation
   */
  public static respondHospitalLevel2(params: {
    disputeId: string;
    explanation: string;
    action: "RESOLVE" | "ESCALATE_L3";
    adjustmentAmount?: number;
    actor: StoredIdentity | null;
  }): { success: boolean; dispute?: FinancialDispute; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    const dispute = getDisputeById(params.disputeId);
    if (!dispute) return { success: false, error: `Dispute ${params.disputeId} not found.` };

    const now = new Date().toISOString();
    const actorName = params.actor.fullName;

    dispute.l2_response = {
      action: params.action,
      explanation: params.explanation.trim(),
      adjustment_amount: params.adjustmentAmount,
      reviewer_name: actorName,
      timestamp: now,
    };
    dispute.updated_at = now;

    if (params.action === "RESOLVE") {
      dispute.status = "RESOLVED_BY_HOSPITAL";
      dispute.current_stage = "RESOLVED";
      dispute.resolved_at = now;
    } else if (params.action === "ESCALATE_L3") {
      dispute.status = "FINAL_HOSPITAL_REVIEW";
      dispute.current_stage = "HOSPITAL_L3";
    }

    saveDispute(dispute);

    appendAuditEvent(
      "DISPUTE_UPDATED",
      params.actor.identifier || params.actor.id,
      actorName,
      params.actor.role,
      `Hospital Level 2 internal escalation decision for ${dispute.dispute_number}: ${params.action}. Note: ${params.explanation}`,
      dispute.patient_id,
      dispute.organization_id,
      undefined,
      dispute.id
    );

    return { success: true, dispute };
  }

  /**
   * Final Hospital Review (Level 3): Final Hospital Resolution or eligibility for external escalation.
   */
  public static respondHospitalFinalLevel3(params: {
    disputeId: string;
    explanation: string;
    outcome: "FULLY_RESOLVED" | "PARTIALLY_RESOLVED" | "NOT_RESOLVED";
    adjustmentAmount?: number;
    actor: StoredIdentity | null;
  }): { success: boolean; dispute?: FinancialDispute; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    const dispute = getDisputeById(params.disputeId);
    if (!dispute) return { success: false, error: `Dispute ${params.disputeId} not found.` };

    const now = new Date().toISOString();
    const actorName = params.actor.fullName;

    dispute.l3_response = {
      outcome: params.outcome,
      explanation: params.explanation.trim(),
      adjustment_amount: params.adjustmentAmount,
      reviewer_name: actorName,
      timestamp: now,
    };
    dispute.updated_at = now;

    if (params.outcome === "FULLY_RESOLVED") {
      dispute.status = "RESOLVED_BY_HOSPITAL";
      dispute.current_stage = "RESOLVED";
      dispute.resolved_at = now;
    } else if (params.outcome === "PARTIALLY_RESOLVED") {
      dispute.status = "PARTIALLY_RESOLVED";
      dispute.current_stage = "RESOLVED";
      dispute.resolved_at = now;
    } else {
      // NOT_RESOLVED -> Case becomes eligible for external grievance escalation
      dispute.status = "ELIGIBLE_FOR_EXTERNAL_ESCALATION";
      dispute.current_stage = "HOSPITAL_L3";
    }

    saveDispute(dispute);

    appendAuditEvent(
      "DISPUTE_UPDATED",
      params.actor.identifier || params.actor.id,
      actorName,
      params.actor.role,
      `Final Hospital Review (L3) completed for ${dispute.dispute_number}: Outcome=${params.outcome}. Note: ${params.explanation}`,
      dispute.patient_id,
      dispute.organization_id,
      undefined,
      dispute.id
    );

    return { success: true, dispute };
  }

  /**
   * Prototype External / Government Escalation:
   * Packages entire dispute, hospital review rounds, clinical order, and audit trail into a structured dossier.
   */
  public static escalateToExternalGovernment(params: {
    disputeId: string;
    escalationReason: string;
    actor: StoredIdentity | null;
  }): { success: boolean; dispute?: FinancialDispute; externalCase?: ExternalDisputeCase; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    const dispute = getDisputeById(params.disputeId);
    if (!dispute) return { success: false, error: `Dispute ${params.disputeId} not found.` };

    const now = new Date().toISOString();
    const caseId = `EXT-${2026}-${1000 + (Date.now() % 9000)}`;

    const evidenceNodes = this.gatherInternalEvidenceTimeline(dispute.id);

    const disputeTimeline: { stage: string; timestamp: string; note: string }[] = [
      { stage: "Dispute Created", timestamp: dispute.created_at, note: dispute.description },
    ];
    if (dispute.l1_response) {
      disputeTimeline.push({
        stage: "Hospital Level 1 Review",
        timestamp: dispute.l1_response.timestamp,
        note: `Action: ${dispute.l1_response.action} — ${dispute.l1_response.explanation}`,
      });
    }
    if (dispute.l2_response) {
      disputeTimeline.push({
        stage: "Hospital Level 2 Escalation",
        timestamp: dispute.l2_response.timestamp,
        note: `Action: ${dispute.l2_response.action} — ${dispute.l2_response.explanation}`,
      });
    }
    if (dispute.l3_response) {
      disputeTimeline.push({
        stage: "Final Hospital Review (L3)",
        timestamp: dispute.l3_response.timestamp,
        note: `Outcome: ${dispute.l3_response.outcome} — ${dispute.l3_response.explanation}`,
      });
    }
    disputeTimeline.push({
      stage: "External Grievance Escalated",
      timestamp: now,
      note: params.escalationReason,
    });

    const externalCase: ExternalDisputeCase = {
      external_case_id: caseId,
      dispute_id: dispute.id,
      patient_id: dispute.patient_id,
      patient_name: dispute.patient_name,
      hospital_id: dispute.facility_id || dispute.organization_id,
      hospital_name: "City Hospital",
      bill_id: dispute.bill_id,
      bill_item_id: dispute.bill_item_id,
      service_name: dispute.service_name || "Disputed Service Item",
      charged_amount: dispute.charged_amount || 0,
      benchmark_amount: dispute.benchmark_amount || 0,
      difference_amount: dispute.difference_amount || 0,
      escalation_reason: params.escalationReason.trim(),
      submitted_snapshot: {
        dispute_number: dispute.dispute_number,
        patient_id: dispute.patient_id,
        patient_name: dispute.patient_name,
        hospital_name: "City Hospital",
        bill_id: dispute.bill_id,
        service_name: dispute.service_name || "Disputed Service Item",
        hospital_charge: dispute.charged_amount || 0,
        reference_rate: dispute.benchmark_amount || 0,
        difference: dispute.difference_amount || 0,
        patient_complaint: dispute.description,
        l1_explanation: dispute.l1_response?.explanation,
        l2_explanation: dispute.l2_response?.explanation,
        l3_final_outcome: dispute.l3_response?.outcome,
        adjustments_applied: dispute.l3_response?.adjustment_amount || dispute.l1_response?.adjustment_amount || 0,
        evidence_nodes: evidenceNodes,
        dispute_timeline: disputeTimeline,
      },
      status: "SUBMITTED_DEMO",
      submitted_at: now,
      updated_at: now,
      is_prototype: true,
      disclaimer: "Prototype external escalation case — no live government grievance integration.",
    };

    saveExternalCase(externalCase);

    dispute.status = "EXTERNAL_CASE_CREATED";
    dispute.current_stage = "EXTERNAL_PROTOTYPE";
    dispute.external_case_id = caseId;
    dispute.updated_at = now;
    saveDispute(dispute);

    appendAuditEvent(
      "DISPUTE_UPDATED",
      params.actor.identifier || params.actor.id,
      params.actor.fullName,
      params.actor.role,
      `Escalated dispute ${dispute.dispute_number} to prototype external grievance case ${caseId}. Reason: ${params.escalationReason}`,
      dispute.patient_id,
      dispute.organization_id,
      undefined,
      dispute.id
    );

    return { success: true, dispute, externalCase };
  }

  /**
   * Compiles complete chronological evidence graph across clinical, billing, payment, and audit events.
   */
  public static gatherInternalEvidenceTimeline(disputeId: string): EvidenceNode[] {
    const dispute = getDisputeById(disputeId);
    if (!dispute) return [];

    const nodes: EvidenceNode[] = [];
    const bill = getBillById(dispute.bill_id);

    if (bill) {
      // 1. Bill Node
      nodes.push({
        id: `EVID-BILL-${bill.id}`,
        source_type: "BILL",
        source_id: bill.id,
        title: `Healthcare Bill Created (${bill.bill_number})`,
        description: `Generated bill with total gross amount ₹${bill.gross_total.toFixed(2)}, net patient responsibility ₹${(bill.patient_responsibility ?? bill.gross_total).toFixed(2)}.`,
        timestamp: bill.created_at,
        metadata: { bill_status: bill.status, items_count: bill.items.length },
      });

      // 2. Specific Line Item Node if applicable
      if (dispute.bill_item_id) {
        const item = bill.items.find((i) => i.id === dispute.bill_item_id);
        if (item) {
          nodes.push({
            id: `EVID-ITEM-${item.id}`,
            source_type: "BILL_ITEM",
            source_id: item.id,
            title: `Itemized Charge: ${item.service_name}`,
            description: `Charged ₹${(item.base_amount ?? item.unit_price * item.quantity).toFixed(2)} (Qty: ${item.quantity} × Rate: ₹${item.unit_price.toFixed(2)}) for category ${item.category}. Verified from source ${item.source_type || "N/A"} (${item.source_id || "N/A"}).`,
            timestamp: bill.created_at,
            metadata: {
              service_code: item.service_code,
              verification_status: item.verification_status,
              source_id: item.source_id,
            },
          });

          // Link Encounter source if present
          if (item.source_id && item.source_type === "ENCOUNTER") {
            const enc = getEncounterById(item.source_id);
            if (enc) {
              nodes.push({
                id: `EVID-ENC-${enc.id}`,
                source_type: "ENCOUNTER",
                source_id: enc.id,
                title: `Clinical Encounter Started (${enc.encounter_type})`,
                description: `Encounter conducted by ${enc.provider_name} in ${enc.department_name}. Reason: ${enc.reason_for_visit}`,
                timestamp: enc.started_at,
                metadata: { doctor_id: enc.provider_id, location: enc.location },
              });
            }
          }

          // Link Lab Order if present
          if (item.source_id && item.source_type === "LAB_TEST") {
            const lab = getLabOrderById(item.source_id);
            if (lab) {
              nodes.push({
                id: `EVID-LAB-${lab.id}`,
                source_type: "LAB_ORDER",
                source_id: lab.id,
                title: `Diagnostic Lab Order Placed (${lab.id})`,
                description: `Diagnostic order priority: ${lab.priority}. Status: ${lab.status}`,
                timestamp: lab.created_at,
                metadata: { priority: lab.priority, status: lab.status },
              });
            }
          }
        }
      }

      // 3. Payment Nodes
      const payments = getPaymentsForBill(bill.id);
      payments.forEach((p) => {
        nodes.push({
          id: `EVID-PAY-${p.id}`,
          source_type: "PAYMENT",
          source_id: p.id,
          title: `Payment Received: ₹${p.amount.toFixed(2)} (${p.payment_method})`,
          description: `Receipt: ${p.receipt_number}, Transaction: ${p.transaction_reference}, Settlement: ${p.settlement_status}`,
          timestamp: p.initiated_at,
          metadata: { status: p.status },
        });
      });
    }

    // 4. Relevant Audit Ledger Events
    const audits = AuditLedger.getEvents({ resourceId: dispute.bill_id });
    audits.slice(0, 5).forEach((a) => {
      nodes.push({
        id: `EVID-AUDIT-${a.id}`,
        source_type: "AUDIT_EVENT",
        source_id: a.id,
        title: `Audit Log: ${a.event_type}`,
        description: `${a.summary} (Actor: ${a.actor_name}, Role: ${a.actor_role})`,
        timestamp: a.timestamp,
      });
    });

    // Sort chronologically
    nodes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    saveInvestigation({
      id: `INV-${dispute.id}`,
      dispute_id: dispute.id,
      anomaly_id: undefined,
      evidence_nodes: nodes,
      assigned_to_id: "DOC-1001",
      assigned_to_name: "Dr. Ananya Sharma",
      status: "UNDER_REVIEW",
      financial_impact: dispute.difference_amount || 0,
      started_at: new Date().toISOString(),
    });

    return nodes;
  }

  /**
   * Deterministic rule-based anomaly detection engine.
   */
  public static runAnomalyDetection(billId: string): FinancialAnomaly[] {
    const bill = getBillById(billId);
    if (!bill) return [];

    const anomalies: FinancialAnomaly[] = [];
    const now = new Date().toISOString();

    // Rule 1: Duplicate Charge Detection (Same service code & amount in same bill)
    const codeCounts: Record<string, number> = {};
    bill.items.forEach((item) => {
      codeCounts[item.service_code] = (codeCounts[item.service_code] || 0) + 1;
    });

    Object.entries(codeCounts).forEach(([code, count]) => {
      if (count > 1) {
        const anomaly: FinancialAnomaly = {
          id: `ANOM-${Date.now() % 10000}-${code}`,
          rule_id: "RULE-DUPLICATE-CHARGE-01",
          rule_version: "v1.0",
          category: "POTENTIAL_DUPLICATE_CHARGE",
          severity: "MEDIUM",
          explanation: `Potential duplicate charge: Service ${code} appears ${count} times in bill ${bill.bill_number}. Requires review.`,
          status: "OPEN",
          target_resource_id: bill.id,
          created_at: now,
        };
        saveAnomaly(anomaly);
        anomalies.push(anomaly);
      }
    });

    // Rule 2: Unvalidated Source Event (BILLING_EXCEPTION)
    const exceptions = bill.items.filter((i) => i.verification_status === "BILLING_EXCEPTION");
    if (exceptions.length > 0) {
      const anomaly: FinancialAnomaly = {
        id: `ANOM-${Date.now() % 10000}-EXC`,
        rule_id: "RULE-UNVALIDATED-SOURCE-01",
        rule_version: "v1.0",
        category: "UNVALIDATED_SOURCE_EVENT",
        severity: "HIGH",
        explanation: `${exceptions.length} line item(s) have unvalidated source relationships (BILLING_EXCEPTION). Requires verification.`,
        status: "OPEN",
        target_resource_id: bill.id,
        created_at: now,
      };
      saveAnomaly(anomaly);
      anomalies.push(anomaly);
    }

    return anomalies;
  }

  public static detectFinancialAnomalies(orgOrBillId: string): FinancialAnomaly[] {
    const anomalies = this.runAnomalyDetection(orgOrBillId);
    if (anomalies.length > 0) return anomalies;
    return [
      {
        id: `ANOM-${Date.now() % 10000}`,
        rule_id: "RULE-SYSTEM-AUDIT-01",
        rule_version: "v1.0",
        category: "POTENTIAL_DUPLICATE_CHARGE",
        severity: "LOW",
        explanation: "Routine financial anomaly scan completed with clean record.",
        status: "RESOLVED",
        target_resource_id: orgOrBillId,
        created_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * Resolves a financial dispute with human-authorized resolution and financial correction.
   */
  public static resolveDispute(params: {
    disputeId: string;
    resolutionType?: string;
    resolutionDecision?: string;
    resolutionNotes?: string;
    refundAmount?: number;
    decisionExplanation?: string;
    amountAffected?: number;
    actor: StoredIdentity | null;
  }): { success: boolean; dispute?: FinancialDispute; resolution?: DisputeResolution; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    const explanation = params.decisionExplanation || params.resolutionNotes || "Dispute resolved by authorized hospital reviewer";
    if (explanation.trim().length < 5) {
      return { success: false, error: "Decision explanation (at least 5 chars) is mandatory." };
    }

    const dispute = getDisputeById(params.disputeId);
    if (!dispute) return { success: false, error: `Dispute ${params.disputeId} not found.` };

    const now = new Date().toISOString();
    const actorId = params.actor.identifier || params.actor.id;
    const resType = (params.resolutionType || (params.refundAmount ? "REFUND_COMPLETED" : "NO_ERROR_FOUND")) as any;
    const affected = params.amountAffected ?? params.refundAmount ?? 0;

    dispute.status = "RESOLVED";
    dispute.current_stage = "RESOLVED";
    dispute.resolved_at = now;
    dispute.updated_at = now;
    saveDispute(dispute);

    const resolution: DisputeResolution = {
      id: `RESOL-${Date.now() % 10000}`,
      dispute_id: dispute.id,
      resolution_type: resType,
      amount_affected: affected,
      decision_explanation: explanation,
      approved_by_id: actorId,
      approved_by_name: params.actor.fullName,
      created_at: now,
    };

    saveDisputeResolution(resolution);

    // If duplicate or overcharge confirmed, create a corrective bill version (No silent edit!)
    if (resType === "DUPLICATE_CORRECTED" || resType === "OVERCHARGE_CORRECTED") {
      const bill = getBillById(dispute.bill_id);
      if (bill) {
        // Filter out disputed item if duplicate
        const correctedItems = bill.items.filter((i) => i.id !== dispute.bill_item_id);
        BillingEngineService.createNewBillVersion({
          billId: bill.id,
          reason: `Corrective bill version generated following dispute resolution (${dispute.dispute_number}): ${explanation}`,
          newItems: correctedItems,
          actor: params.actor,
        });
      }
    }

    appendAuditEvent(
      "DISPUTE_RESOLVED",
      actorId,
      params.actor.fullName,
      params.actor.role,
      `Resolved dispute ${dispute.dispute_number} (${resType}): ${explanation}`,
      dispute.patient_id,
      dispute.organization_id,
      undefined,
      dispute.id
    );

    return { success: true, dispute, resolution };
  }
}
