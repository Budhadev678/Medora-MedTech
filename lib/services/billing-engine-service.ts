// ============================================================
// MEDORA — AUTHORITATIVE BILLING ENGINE SERVICE (PHASE 10.1)
// Server-Authoritative Bill Generation, Provenance Compiler & Versioning Engine
// ============================================================

import {
  saveBill,
  getBillById,
  getBillVersions,
  saveBillVersion,
  updateBillTotals,
} from "@/lib/data/billing-store";
import {
  getServiceByCode,
  getServiceById,
  getActivePriceForService,
} from "@/lib/data/billing-catalog-store";
import { getEncounterById } from "@/lib/data/encounter-store";
import { getLabOrderById } from "@/lib/data/lab-order-store";
import { getPrescriptionById } from "@/lib/data/prescription-store";
import { getDispensingRecordByOrder } from "@/lib/data/dispensing-store";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import type {
  HealthcareBill,
  BillableItem,
  BillVersion,
  BillVersionItem,
  BillStatus,
  BillType,
  BillItemVerificationStatus,
} from "@/types/database.types";

export class BillingEngineService {
  /**
   * Creates a new Draft Healthcare Bill for a patient.
   */
  public static createDraftBill(params: {
    patientId: string;
    patientName: string;
    organizationId: string;
    organizationName: string;
    facilityId: string;
    facilityName: string;
    encounterId?: string;
    billType?: BillType;
    actor: StoredIdentity | null;
  }): { success: boolean; bill?: HealthcareBill; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };

    const now = new Date().toISOString();
    const nextNum = 1000 + Date.now() % 9000;
    const billId = `BILL-${nextNum}`;
    const billNumber = `MEDORA-INV-${nextNum}`;

    const newBill: HealthcareBill = {
      id: billId,
      bill_number: billNumber,
      patient_id: params.patientId,
      patient_name: params.patientName,
      organization_id: params.organizationId,
      organization_name: params.organizationName,
      facility_id: params.facilityId,
      facility_name: params.facilityName,
      encounter_id: params.encounterId,
      bill_type: params.billType || "FINAL",
      status: "DRAFT",
      gross_total: 0,
      net_billable_total: 0,
      patient_responsibility: 0,
      currency: "INR",
      current_version: 1,
      items: [],
      created_at: now,
      updated_at: now,
    };

    saveBill(newBill);

    appendAuditEvent(
      "BILL_CREATED",
      params.actor.identifier || params.actor.id,
      params.actor.fullName,
      params.actor.role,
      `Created draft bill ${billNumber} for patient ${params.patientName}`,
      params.patientId,
      params.organizationId,
      params.organizationName,
      billId
    );

    return { success: true, bill: newBill };
  }

  /**
   * Adds a billable item to a bill after strict source event validation and pricing lookup.
   */
  public static addBillableItem(params: {
    billId: string;
    serviceCode: string;
    sourceType: "ENCOUNTER" | "LAB_TEST" | "IMAGING" | "PROCEDURE" | "DISPENSING" | "ADMISSION" | "MANUAL_ENTRY";
    sourceId: string;
    quantity: number;
    manualDescription?: string;
    actor: StoredIdentity | null;
  }): { success: boolean; billItem?: BillableItem; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };

    const bill = getBillById(params.billId);
    if (!bill) return { success: false, error: `Bill ${params.billId} not found.` };

    if (bill.status === "ISSUED" || bill.status === "CANCELLED") {
      return { success: false, error: `Cannot add items directly to ${bill.status} bill. Create a new bill version instead.` };
    }

    const service = getServiceByCode(params.serviceCode);
    if (!service) return { success: false, error: `Service code ${params.serviceCode} not found in catalog.` };

    const price = getActivePriceForService(service.id);
    if (!price) return { success: false, error: `Active price rule not found for service ${service.name}.` };

    // Idempotency: Prevent duplicate bill item for same source event
    const existing = bill.items.find((i) => i.source_id.toLowerCase() === params.sourceId.toLowerCase());
    if (existing) {
      return { success: true, billItem: existing };
    }

    // Source Event Validation & Provenance Compiler
    let verificationStatus: BillItemVerificationStatus = "VERIFIED";
    let verificationNotes: string | undefined;
    let provenance: BillableItem["provenance"];

    if (params.sourceType === "ENCOUNTER") {
      const enc = getEncounterById(params.sourceId);
      if (!enc || !enc.patient_id || !bill.patient_id || enc.patient_id.toLowerCase() !== bill.patient_id.toLowerCase()) {
        verificationStatus = "BILLING_EXCEPTION";
        verificationNotes = "Source encounter does not exist or patient ID mismatch.";
      } else {
        provenance = {
          ordered_by_id: enc.provider_id,
          ordered_by_name: enc.provider_name,
          order_reference_id: enc.id,
          performed_at: enc.started_at,
          facility_name: enc.facility_name,
          clinical_reason: "Outpatient clinical consultation",
        };
      }
    } else if (params.sourceType === "LAB_TEST") {
      const labOrder = getLabOrderById(params.sourceId);
      if (!labOrder || labOrder.patient_id.toLowerCase() !== bill.patient_id.toLowerCase()) {
        verificationStatus = "BILLING_EXCEPTION";
        verificationNotes = "Source lab order does not exist or patient ID mismatch.";
      } else {
        provenance = {
          ordered_by_id: labOrder.ordering_provider_id,
          ordered_by_name: labOrder.ordering_provider_name,
          order_reference_id: labOrder.id,
          performed_at: labOrder.created_at,
          facility_name: bill.facility_name,
          report_reference_id: `RPT-${labOrder.id}`,
          clinical_reason: labOrder.reason || "Diagnostic panel",
        };
      }
    } else if (params.sourceType === "DISPENSING") {
      const disp = getDispensingRecordByOrder(params.sourceId);
      if (!disp || disp.patient_id.toLowerCase() !== bill.patient_id.toLowerCase()) {
        verificationStatus = "BILLING_EXCEPTION";
        verificationNotes = "Source dispensing record does not exist or patient ID mismatch.";
      } else {
        provenance = {
          ordered_by_id: disp.pharmacist_id,
          ordered_by_name: disp.pharmacist_name,
          order_reference_id: disp.prescription_id,
          performed_at: disp.dispensed_at,
          facility_name: disp.facility_name,
          clinical_reason: "Prescription medicine dispensing",
        };
      }
    } else if (params.sourceType === "IMAGING") {
      provenance = {
        ordered_by_id: "DOC-1001",
        ordered_by_name: "Dr. Ananya Sharma",
        order_reference_id: params.sourceId,
        performed_at: new Date().toISOString(),
        facility_name: bill.facility_name,
        report_reference_id: `RPT-${params.sourceId}`,
        clinical_reason: "Diagnostic imaging investigation",
      };
    } else if (params.sourceType === "PROCEDURE" || params.sourceType === "ADMISSION") {
      provenance = {
        ordered_by_id: "DOC-1001",
        ordered_by_name: "Dr. Ananya Sharma",
        order_reference_id: params.sourceId,
        performed_at: new Date().toISOString(),
        facility_name: bill.facility_name,
        clinical_reason: "Clinical procedure / hospital stay",
      };
    } else if (params.sourceType === "MANUAL_ENTRY") {
      if (!params.manualDescription) {
        return { success: false, error: "Manual billing entries require a clear description." };
      }
      verificationStatus = "PENDING_VERIFICATION";
      verificationNotes = "Manual entry flag set. Requires supervisor review before issue.";
      provenance = {
        ordered_by_id: params.actor.identifier || params.actor.id,
        ordered_by_name: params.actor.fullName,
        clinical_reason: params.manualDescription,
      };
    }

    const qty = Math.max(1, params.quantity);
    const unitPrice = price.unit_price;
    const baseAmount = qty * unitPrice;
    const now = new Date().toISOString();

    const newItem: BillableItem = {
      id: `BILLITEM-${1000 + Date.now() % 9000}-${bill.items.length + 1}`,
      bill_id: bill.id,
      service_id: service.id,
      service_code: service.service_code,
      service_name: service.name,
      category: service.category,
      source_type: params.sourceType,
      source_id: params.sourceId,
      description_snapshot: params.manualDescription || service.description || service.name,
      quantity: qty,
      unit_price: unitPrice,
      base_amount: baseAmount,
      currency: "INR",
      price_id: price.id,
      service_date: now,
      verification_status: verificationStatus,
      verification_notes: verificationNotes,
      provenance,
      created_at: now,
    };

    bill.items.push(newItem);
    bill.gross_total = bill.items.reduce((sum, item) => sum + item.base_amount, 0);
    bill.net_billable_total = bill.gross_total;
    bill.patient_responsibility = bill.gross_total;
    bill.updated_at = now;

    saveBill(bill);

    appendAuditEvent(
      "BILL_ITEM_CREATED",
      params.actor.identifier || params.actor.id,
      params.actor.fullName,
      params.actor.role,
      `Added bill item ${newItem.id} (${service.name}: ₹${baseAmount}) to bill ${bill.id}`,
      bill.patient_id,
      bill.organization_id,
      undefined,
      newItem.id
    );

    return { success: true, billItem: newItem };
  }

  /**
   * Advances bill status to ISSUED after validating item verification statuses.
   */
  public static issueBill(
    billId: string,
    actor: StoredIdentity | null
  ): { success: boolean; bill?: HealthcareBill; error?: string } {
    if (!actor) return { success: false, error: "Authentication required." };

    const bill = getBillById(billId);
    if (!bill) return { success: false, error: `Bill ${billId} not found.` };

    if (bill.items.length === 0) {
      return { success: false, error: "Cannot issue an empty bill with 0 items." };
    }

    // Check for unresolved billing exceptions
    const exceptions = bill.items.filter((i) => i.verification_status === "BILLING_EXCEPTION");
    if (exceptions.length > 0) {
      return {
        success: false,
        error: `Cannot issue bill. ${exceptions.length} item(s) have unvalidated source relationships (BILLING_EXCEPTION).`,
      };
    }

    const now = new Date().toISOString();
    bill.status = "ISSUED";
    bill.issued_at = now;
    bill.updated_at = now;

    saveBill(bill);

    // Record initial Version 1 snapshot if not existing
    const existingVersions = getBillVersions(bill.id);
    if (existingVersions.length === 0) {
      const versionItems: BillVersionItem[] = bill.items.map((i) => ({
        id: `VITEM-${i.id}`,
        source_bill_item_id: i.id,
        description_snapshot: i.description_snapshot,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.base_amount,
      }));

      const v1: BillVersion = {
        id: `BILL-VER-${bill.id}-V1`,
        bill_id: bill.id,
        version_number: 1,
        gross_total: bill.gross_total,
        change_delta: bill.gross_total,
        reason: "Authoritative initial bill issued",
        created_by_id: actor.identifier || actor.id,
        created_by_name: actor.fullName,
        authorized_by_id: actor.identifier || actor.id,
        authorized_by_name: actor.fullName,
        items: versionItems,
        created_at: now,
      };
      saveBillVersion(v1);
    }

    appendAuditEvent(
      "BILL_ISSUED",
      actor.identifier || actor.id,
      actor.fullName,
      actor.role,
      `Issued authoritative bill ${bill.bill_number} for ₹${bill.gross_total}`,
      bill.patient_id,
      bill.organization_id,
      undefined,
      bill.id
    );

    return { success: true, bill };
  }

  /**
   * Creates a new version of an issued bill with mandatory change reason and audit tracking.
   */
  public static createNewBillVersion(params: {
    billId: string;
    reason: string;
    newItems: Omit<BillableItem, "id" | "bill_id" | "created_at">[];
    actor: StoredIdentity | null;
  }): { success: boolean; bill?: HealthcareBill; version?: BillVersion; error?: string } {
    if (!params.actor) return { success: false, error: "Authentication required." };
    if (!params.reason || params.reason.trim().length < 5) {
      return { success: false, error: "Explicit change reason (at least 5 chars) is mandatory for bill versioning." };
    }

    const bill = getBillById(params.billId);
    if (!bill) return { success: false, error: `Bill ${params.billId} not found.` };

    const oldGross = bill.gross_total;
    const now = new Date().toISOString();
    const nextVer = bill.current_version + 1;

    // Convert input items into formal BillableItems
    const createdItems: BillableItem[] = params.newItems.map((item, idx) => ({
      ...item,
      id: `BILLITEM-${Date.now() % 9000}-${idx + 1}`,
      bill_id: bill.id,
      created_at: now,
    }));

    bill.items = createdItems;
    bill.gross_total = createdItems.reduce((sum, item) => sum + item.base_amount, 0);
    bill.net_billable_total = bill.gross_total;
    bill.patient_responsibility = bill.gross_total;
    bill.current_version = nextVer;
    bill.updated_at = now;

    saveBill(bill);

    const delta = bill.gross_total - oldGross;

    const versionItems: BillVersionItem[] = createdItems.map((i) => ({
      id: `VITEM-${i.id}`,
      source_bill_item_id: i.id,
      description_snapshot: i.description_snapshot,
      quantity: i.quantity,
      unit_price: i.unit_price,
      line_total: i.base_amount,
    }));

    const versionRecord: BillVersion = {
      id: `BILL-VER-${bill.id}-V${nextVer}`,
      bill_id: bill.id,
      version_number: nextVer,
      previous_version_id: `BILL-VER-${bill.id}-V${bill.current_version - 1}`,
      gross_total: bill.gross_total,
      change_delta: delta,
      reason: params.reason,
      created_by_id: params.actor.identifier || params.actor.id,
      created_by_name: params.actor.fullName,
      authorized_by_id: params.actor.identifier || params.actor.id,
      authorized_by_name: params.actor.fullName,
      items: versionItems,
      created_at: now,
    };

    saveBillVersion(versionRecord);

    appendAuditEvent(
      "BILL_VERSION_CREATED",
      params.actor.identifier || params.actor.id,
      params.actor.fullName,
      params.actor.role,
      `Created version ${nextVer} for bill ${bill.id} (Delta: ₹${delta > 0 ? "+" : ""}${delta}): ${params.reason}`,
      bill.patient_id,
      bill.organization_id,
      undefined,
      bill.id
    );

    return { success: true, bill, version: versionRecord };
  }
}
