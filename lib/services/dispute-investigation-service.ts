// ============================================================
// MEDORA — DISPUTES, ANOMALY ENGINE & INVESTIGATION SERVICE (PHASE 10.4)
// Server-Authoritative Evidence Graph, Explainable Anomaly Detection & Dispute Resolution
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
    const dispNum = 1000 + Date.now() % 9000;
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
      category: params.category,
      description: params.description,
      status: "SUBMITTED",
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
        description: `Gross Total: ₹${bill.gross_total}, Patient Responsibility: ₹${bill.patient_responsibility}`,
        timestamp: bill.created_at,
      });

      // 2. Bill Items Nodes
      bill.items.forEach((item) => {
        nodes.push({
          id: `EVID-ITEM-${item.id}`,
          source_type: "BILL_ITEM",
          source_id: item.id,
          title: `Itemized Charge: ${item.service_name}`,
          description: `Code: ${item.service_code}, Qty: ${item.quantity}, Unit Price: ₹${item.unit_price}, Status: ${item.verification_status}`,
          timestamp: item.service_date,
        });

        // Trace clinical source
        if (item.source_type === "ENCOUNTER") {
          const enc = getEncounterById(item.source_id);
          if (enc) {
            nodes.push({
              id: `EVID-ENC-${enc.id}`,
              source_type: "ENCOUNTER",
              source_id: enc.id,
              title: `Clinical Encounter: ${enc.encounter_reference || enc.id}`,
              description: `Provider: ${enc.provider_name}, Facility: ${enc.facility_name}`,
              timestamp: enc.started_at,
            });
          }
        } else if (item.source_type === "LAB_TEST") {
          const lab = getLabOrderById(item.source_id);
          if (lab) {
            nodes.push({
              id: `EVID-LAB-${lab.id}`,
              source_type: "LAB_ORDER",
              source_id: lab.id,
              title: `Diagnostic Lab Order: ${lab.order_reference}`,
              description: `Ordered By: ${lab.ordering_provider_name}, Priority: ${lab.priority}`,
              timestamp: lab.created_at,
            });
          }
        }
      });

      // 3. Payment Nodes
      const payments = getPaymentsForBill(bill.id);
      payments.forEach((pay) => {
        nodes.push({
          id: `EVID-PAY-${pay.id}`,
          source_type: "PAYMENT",
          source_id: pay.id,
          title: `Payment Received (${pay.payment_method})`,
          description: `Amount: ₹${pay.amount}, Receipt: ${pay.receipt_number}, Settlement: ${pay.settlement_status}`,
          timestamp: pay.initiated_at,
        });
      });

      // 4. Audit Trail Nodes
      const auditEvents = AuditLedger.getEvents({ resourceId: bill.id });
      auditEvents.forEach((evt) => {
        nodes.push({
          id: `EVID-AUDIT-${evt.id}`,
          source_type: "AUDIT_EVENT",
          source_id: evt.id,
          title: `Audit Action: ${evt.event_type}`,
          description: `${evt.summary} (By ${evt.actor_name})`,
          timestamp: evt.timestamp,
        });
      });
    }

    // Sort evidence chronologically
    nodes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Save or update investigation record
    let investigation = getInvestigationByDisputeId(dispute.id);
    if (!investigation) {
      investigation = {
        id: `INV-${Date.now() % 10000}`,
        dispute_id: dispute.id,
        status: "EVIDENCE_COLLECTED",
        evidence_nodes: nodes,
        financial_impact: bill ? bill.gross_total : 0,
        started_at: new Date().toISOString(),
      };
      saveInvestigation(investigation);
    } else {
      investigation.evidence_nodes = nodes;
      saveInvestigation(investigation);
    }

    return nodes;
  }

  /**
   * Deterministic, explainable rule-based anomaly detection engine.
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

  /**
   * Resolves a financial dispute with human-authorized resolution and financial correction.
   */
  public static resolveDispute(params: {
    disputeId: string;
    resolutionType: "NO_ERROR_FOUND" | "DUPLICATE_CORRECTED" | "OVERCHARGE_CORRECTED" | "PAYMENT_RECONCILED" | "REFUND_COMPLETED" | "ESCALATED";
    decisionExplanation: string;
    amountAffected: number;
    actor: StoredIdentity | null;
  }): { success: boolean; resolution?: DisputeResolution; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    if (!params.decisionExplanation || params.decisionExplanation.trim().length < 5) {
      return { success: false, error: "Decision explanation (at least 5 chars) is mandatory." };
    }

    const dispute = getDisputeById(params.disputeId);
    if (!dispute) return { success: false, error: `Dispute ${params.disputeId} not found.` };

    const now = new Date().toISOString();
    const actorId = params.actor.identifier || params.actor.id;

    dispute.status = "RESOLVED";
    dispute.resolved_at = now;
    dispute.updated_at = now;
    saveDispute(dispute);

    const resolution: DisputeResolution = {
      id: `RESOL-${Date.now() % 10000}`,
      dispute_id: dispute.id,
      resolution_type: params.resolutionType,
      amount_affected: params.amountAffected,
      decision_explanation: params.decisionExplanation,
      approved_by_id: actorId,
      approved_by_name: params.actor.fullName,
      created_at: now,
    };

    saveDisputeResolution(resolution);

    // If duplicate or overcharge confirmed, create a corrective bill version (No silent edit!)
    if (params.resolutionType === "DUPLICATE_CORRECTED" || params.resolutionType === "OVERCHARGE_CORRECTED") {
      const bill = getBillById(dispute.bill_id);
      if (bill) {
        // Filter out disputed item if duplicate
        const correctedItems = bill.items.filter((i) => i.id !== dispute.bill_item_id);
        BillingEngineService.createNewBillVersion({
          billId: bill.id,
          reason: `Corrective bill version generated following dispute resolution (${dispute.dispute_number}): ${params.decisionExplanation}`,
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
      `Resolved dispute ${dispute.dispute_number} (${params.resolutionType}): ${params.decisionExplanation}`,
      dispute.patient_id,
      dispute.organization_id,
      undefined,
      dispute.id
    );

    return { success: true, resolution };
  }
}
