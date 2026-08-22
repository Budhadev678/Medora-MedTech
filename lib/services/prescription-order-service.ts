// ============================================================
// MEDORA — PRESCRIPTION & MEDICAL ORDER SERVICE (PHASE C.2)
// Authoritative Coordinator for Prescriptions & Medical Orders
// ============================================================

import type {
  HealthcarePrescription,
  PrescriptionItem,
  HealthcareMedicalOrder,
  MedicalOrderType,
  MedicalOrderPriority,
  LabOrderItem,
  ImagingOrderDetails,
  ReferralOrderDetails,
  FollowUpOrderDetails,
} from "@/types/database.types";
import {
  savePrescriptionDraft as savePrescriptionDraftInStore,
  issuePrescription as issuePrescriptionInStore,
  finalizePrescription as finalizePrescriptionInStore,
  voidPrescription as voidPrescriptionInStore,
  correctPrescription as correctPrescriptionInStore,
  amendPrescription as amendPrescriptionInStore,
  cancelPrescription as cancelPrescriptionInStore,
  getPrescriptionById,
  getPrescriptionByVerificationToken as getPrescriptionByVerificationTokenInStore,
  getEncounterPrescriptions as getEncounterPrescriptionsInStore,
  getPatientPrescriptions as getPatientPrescriptionsInStore,
  getPrescriptionForPharmacy as getPrescriptionForPharmacyInStore,
  PharmacyPrescriptionPayload,
} from "@/lib/data/prescription-store";
import {
  createMedicalOrder as createMedicalOrderInStore,
  cancelMedicalOrder as cancelMedicalOrderInStore,
  getMedicalOrderById,
  getEncounterMedicalOrders as getEncounterMedicalOrdersInStore,
  getPatientMedicalOrders as getPatientMedicalOrdersInStore,
} from "@/lib/data/medical-order-store";
import { getEncounterById } from "@/lib/data/encounter-store";
import { StoredIdentity, findIdentityById } from "@/lib/data/identity-store";
import { AuditLedger } from "@/lib/data/audit-store";

export class PrescriptionOrderService {
  /**
   * Detects duplicate medicines in a list of prescription items.
   * Returns a list of duplicate medicine names if found.
   */
  public static detectDuplicateMedicines(items: PrescriptionItem[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const item of items) {
      const key = (item.generic_name || item.medicine_name || "").trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        duplicates.add(item.medicine_name);
      } else {
        seen.add(key);
      }
    }

    return Array.from(duplicates);
  }

  /**
   * Saves or auto-saves a draft prescription for an active encounter.
   * Does NOT issue the prescription to the patient portal.
   */
  public static async saveDraft(
    encounterId: string,
    data: {
      items: PrescriptionItem[];
      notes?: string;
      refills_allowed?: number;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; prescription?: HealthcarePrescription; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) {
      return { success: false, error: "Healthcare Encounter not found." };
    }

    if (encounter.status === "CANCELLED") {
      return { success: false, error: "Cannot prescribe for a CANCELLED encounter." };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can compose prescriptions." };
    }

    // Wrong Doctor Protection: Doctor B cannot edit inside Doctor A's encounter
    if (
      actor.role === "doctor" &&
      (encounter.provider_id || "").toLowerCase() !== (actor.identifier || "").toLowerCase() &&
      (encounter.provider_id || "").toLowerCase() !== (actor.id || "").toLowerCase()
    ) {
      return { success: false, error: "Access denied. Only the attending doctor for this encounter can compose prescriptions." };
    }

    const result = savePrescriptionDraftInStore({
      encounterId,
      items: data.items,
      notes: data.notes,
      refillsAllowed: data.refills_allowed || 0,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });

    if (result.success && result.prescription) {
      AuditLedger.recordEvent({
        actor_id: actorId,
        actor_name: actor.fullName,
        action: "PRESCRIPTION_DRAFT_SAVED",
        resource_type: "HEALTHCARE_PRESCRIPTION",
        resource_id: result.prescription.id,
        details: {
          encounter_id: encounterId,
          patient_id: encounter.patient_id,
          organization_id: encounter.organization_id,
          items_count: data.items.length,
        },
      });
    }

    return result;
  }

  /**
   * Authoritatively issues a digital prescription.
   * Enforces doctor exclusivity, validates structured medicines, transitions to ISSUED,
   * and publishes to patient mobile portal.
   */
  public static async issuePrescription(
    encounterId: string,
    data: {
      prescription_id?: string;
      items: PrescriptionItem[];
      notes?: string;
      refills_allowed?: number;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; prescription?: HealthcarePrescription; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) {
      return { success: false, error: "Healthcare Encounter not found." };
    }

    if (encounter.status === "CANCELLED") {
      return { success: false, error: "Cannot issue a prescription for a CANCELLED encounter." };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can issue prescriptions." };
    }

    // Wrong Doctor Protection
    if (
      actor.role === "doctor" &&
      (encounter.provider_id || "").toLowerCase() !== (actor.identifier || "").toLowerCase() &&
      (encounter.provider_id || "").toLowerCase() !== (actor.id || "").toLowerCase()
    ) {
      return { success: false, error: "Access denied. Only the attending doctor for this encounter can issue prescriptions." };
    }

    // Validation: At least one medicine item
    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Please add at least one medication item before issuing." };
    }

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.medicine_name || !item.medicine_name.trim()) {
        return { success: false, error: `Medicine item #${i + 1} requires a valid medicine name.` };
      }
      if (!item.dosage || !item.dosage.trim()) {
        return { success: false, error: `Medicine "${item.medicine_name}" requires a dosage quantity & form (e.g. 1 tablet).` };
      }
      if (!item.frequency || !item.frequency.trim()) {
        return { success: false, error: `Medicine "${item.medicine_name}" requires an administration frequency.` };
      }
    }

    const result = issuePrescriptionInStore({
      prescriptionId: data.prescription_id,
      encounterId,
      items: data.items,
      notes: data.notes,
      refillsAllowed: data.refills_allowed || 0,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });

    if (result.success && result.prescription) {
      AuditLedger.recordEvent({
        actor_id: actorId,
        actor_name: actor.fullName,
        action: "PRESCRIPTION_ISSUED",
        resource_type: "HEALTHCARE_PRESCRIPTION",
        resource_id: result.prescription.id,
        details: {
          encounter_id: encounterId,
          patient_id: encounter.patient_id,
          organization_id: encounter.organization_id,
          facility_id: result.prescription.facility_id,
          items_count: data.items.length,
          issued_at: result.prescription.issued_at,
        },
      });
    }

    return result;
  }

  /**
   * Authoritatively finalizes a digital prescription.
   * Validates attending doctor, non-empty items, sets status to FINALIZED,
   * generates digital signature, locks record, and emits Phase 9 handoff event.
   */
  public static async finalizePrescription(
    encounterId: string,
    data: {
      prescription_id?: string;
      items: PrescriptionItem[];
      notes?: string;
      refills_allowed?: number;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; prescription?: HealthcarePrescription; phase9_handoff_event?: any; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) {
      return { success: false, error: "Healthcare Encounter not found." };
    }

    if (encounter.status === "CANCELLED") {
      return { success: false, error: "Cannot finalize a prescription for a CANCELLED encounter." };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can finalize prescriptions." };
    }

    // Wrong Doctor Protection: Doctor B cannot finalize Doctor A's encounter
    if (
      actor.role === "doctor" &&
      (encounter.provider_id || "").toLowerCase() !== (actor.identifier || "").toLowerCase() &&
      (encounter.provider_id || "").toLowerCase() !== (actor.id || "").toLowerCase()
    ) {
      return { success: false, error: "Access denied. Only the attending doctor for this encounter can finalize prescriptions." };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Please add at least one medication item before finalization." };
    }

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.medicine_name || !item.medicine_name.trim()) {
        return { success: false, error: `Medicine item #${i + 1} requires a valid medicine name.` };
      }
      if (!item.dosage || !item.dosage.trim()) {
        return { success: false, error: `Medicine "${item.medicine_name}" requires a dosage & form (e.g. 1 tablet).` };
      }
      if (!item.frequency || !item.frequency.trim()) {
        return { success: false, error: `Medicine "${item.medicine_name}" requires an administration frequency.` };
      }
    }

    const result = finalizePrescriptionInStore({
      prescriptionId: data.prescription_id,
      encounterId,
      items: data.items,
      notes: data.notes,
      refillsAllowed: data.refills_allowed || 0,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });

    if (result.success && result.prescription) {
      AuditLedger.recordEvent({
        actor_id: actorId,
        actor_name: actor.fullName,
        action: "PRESCRIPTION_FINALIZED",
        resource_type: "HEALTHCARE_PRESCRIPTION",
        resource_id: result.prescription.id,
        details: {
          encounter_id: encounterId,
          patient_id: encounter.patient_id,
          organization_id: encounter.organization_id,
          facility_id: result.prescription.facility_id,
          items_count: data.items.length,
          finalized_at: result.prescription.finalized_at,
          digital_signature_hash: result.prescription.digital_signature_hash,
        },
      });

      // Construct Phase 9 Pharmacy Handoff Integration Event Payload (Idempotent Key)
      const phase9HandoffEvent = {
        event_type: "PRESCRIPTION_FINALIZED",
        idempotency_key: `HANDSHAKE-${result.prescription.id}-${result.prescription.version || 1}`,
        timestamp: result.prescription.finalized_at || new Date().toISOString(),
        prescription: {
          id: result.prescription.id,
          prescription_reference: result.prescription.prescription_reference,
          patient_id: result.prescription.patient_id,
          patient_name: result.prescription.patient_name,
          prescriber_id: result.prescription.prescriber_id,
          prescriber_name: result.prescription.prescriber_name,
          organization_id: result.prescription.organization_id,
          facility_id: result.prescription.facility_id,
          status: result.prescription.status,
          verification_token: result.prescription.verification_token,
          digital_signature_hash: result.prescription.digital_signature_hash,
          items: result.prescription.items.map((i) => ({
            id: i.id,
            medicine_name: i.medicine_name,
            generic_name: i.generic_name,
            brand_name: i.brand_name,
            strength: i.strength,
            dosage: i.dosage,
            frequency: i.frequency,
            timing: i.timing,
            duration: i.duration,
            quantity: i.quantity,
            instructions: i.instructions,
          })),
        },
      };

      return {
        success: true,
        prescription: result.prescription,
        phase9_handoff_event: phase9HandoffEvent,
      };
    }

    return result;
  }

  /**
   * Voids a prescription with a mandatory documented reason.
   */
  public static async voidPrescription(
    prescriptionId: string,
    voidReason: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; prescription?: HealthcarePrescription; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    if (!voidReason || !voidReason.trim()) {
      return { success: false, error: "A documented void reason is required to void a prescription." };
    }

    const rx = getPrescriptionById(prescriptionId);
    if (!rx) {
      return { success: false, error: `Prescription ${prescriptionId} not found.` };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors or administrators can void prescriptions." };
    }

    if (
      actor.role === "doctor" &&
      rx.prescriber_id.toLowerCase() !== actorId.toLowerCase() &&
      rx.prescriber_id.toLowerCase() !== actor.identifier?.toLowerCase()
    ) {
      return { success: false, error: "Only the original prescribing doctor can void this prescription." };
    }

    return voidPrescriptionInStore(prescriptionId, voidReason.trim(), actorId, actor.fullName, actor.role);
  }

  /**
   * Corrects/supersedes a finalized prescription.
   */
  public static async correctPrescription(
    prescriptionId: string,
    data: {
      items: PrescriptionItem[];
      notes?: string;
      refills_allowed?: number;
    },
    correctionReason: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; prescription?: HealthcarePrescription; original_prescription?: HealthcarePrescription; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    if (!correctionReason || !correctionReason.trim()) {
      return { success: false, error: "A documented correction reason is required to correct/supersede a prescription." };
    }

    const rx = getPrescriptionById(prescriptionId);
    if (!rx) {
      return { success: false, error: `Prescription ${prescriptionId} not found.` };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can correct prescriptions." };
    }

    if (
      actor.role === "doctor" &&
      rx.prescriber_id.toLowerCase() !== actorId.toLowerCase() &&
      rx.prescriber_id.toLowerCase() !== actor.identifier?.toLowerCase()
    ) {
      return { success: false, error: "Only the original prescribing doctor can correct this prescription." };
    }

    return correctPrescriptionInStore({
      prescriptionId,
      amendmentReason: correctionReason.trim(),
      items: data.items,
      notes: data.notes,
      refillsAllowed: data.refills_allowed,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Verifies authenticity of a digital prescription using verification token or ID.
   */
  public static verifyPrescriptionAuthenticity(tokenOrId: string) {
    return getPrescriptionByVerificationTokenInStore(tokenOrId);
  }

  /**
   * Formally amends an issued prescription.
   * Creates an immutable snapshot of Version 1 in version_history,
   * increments version to 2, and logs reason.
   */
  public static async amendPrescription(
    prescriptionId: string,
    data: {
      items: PrescriptionItem[];
      notes?: string;
      refills_allowed?: number;
    },
    reason: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; prescription?: HealthcarePrescription; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A documented clinical reason is required to amend an issued prescription." };
    }

    const rx = getPrescriptionById(prescriptionId);
    if (!rx) {
      return { success: false, error: `Prescription ${prescriptionId} not found.` };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can amend prescriptions." };
    }

    // Prescriber authorization check
    if (
      actor.role === "doctor" &&
      rx.prescriber_id.toLowerCase() !== actorId.toLowerCase() &&
      rx.prescriber_id.toLowerCase() !== actor.identifier?.toLowerCase()
    ) {
      return { success: false, error: "Only the original prescribing doctor can amend this prescription." };
    }

    const result = amendPrescriptionInStore({
      prescriptionId,
      amendmentReason: reason.trim(),
      items: data.items,
      notes: data.notes,
      refillsAllowed: data.refills_allowed,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });

    if (result.success && result.prescription) {
      AuditLedger.recordEvent({
        actor_id: actorId,
        actor_name: actor.fullName,
        action: "PRESCRIPTION_AMENDED",
        resource_type: "HEALTHCARE_PRESCRIPTION",
        resource_id: result.prescription.id,
        details: {
          prescription_id: prescriptionId,
          patient_id: rx.patient_id,
          organization_id: rx.organization_id,
          new_version: result.prescription.version,
          amendment_reason: reason.trim(),
        },
      });
    }

    return result;
  }

  /**
   * Cancels an issued prescription with a documented reason.
   */
  public static async cancelPrescription(
    prescriptionId: string,
    reason: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; prescription?: HealthcarePrescription; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A cancellation reason is required." };
    }

    const rx = getPrescriptionById(prescriptionId);
    if (!rx) {
      return { success: false, error: `Prescription ${prescriptionId} not found.` };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can cancel prescriptions." };
    }

    const result = cancelPrescriptionInStore(
      prescriptionId,
      reason.trim(),
      actorId,
      actor.fullName,
      actor.role
    );

    if (result.success) {
      AuditLedger.recordEvent({
        actor_id: actorId,
        actor_name: actor.fullName,
        action: "PRESCRIPTION_CANCELLED",
        resource_type: "HEALTHCARE_PRESCRIPTION",
        resource_id: prescriptionId,
        details: {
          prescription_id: prescriptionId,
          patient_id: rx.patient_id,
          organization_id: rx.organization_id,
          cancellation_reason: reason.trim(),
        },
      });
    }

    return result;
  }

  /**
   * Creates a structured medical order (LAB, IMAGING, REFERRAL, FOLLOW_UP).
   */
  public static async createMedicalOrder(
    params: {
      encounterId: string;
      orderType: MedicalOrderType;
      priority?: MedicalOrderPriority;
      clinicalIndication?: string;
      instructions?: string;
      labItems?: LabOrderItem[];
      imagingDetails?: ImagingOrderDetails;
      referralDetails?: ReferralOrderDetails;
      followUpDetails?: FollowUpOrderDetails;
      isDraft?: boolean;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; order?: HealthcareMedicalOrder; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const encounter = getEncounterById(params.encounterId);
    if (!encounter) {
      return { success: false, error: "Healthcare Encounter not found." };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized clinicians can issue medical orders." };
    }

    // Wrong Doctor Protection
    if (
      actor.role === "doctor" &&
      (encounter.provider_id || "").toLowerCase() !== (actor.identifier || "").toLowerCase() &&
      (encounter.provider_id || "").toLowerCase() !== (actor.id || "").toLowerCase()
    ) {
      return { success: false, error: "Only the attending doctor for this encounter can issue medical orders." };
    }

    const result = createMedicalOrderInStore({
      encounterId: params.encounterId,
      orderType: params.orderType,
      priority: params.priority,
      clinicalIndication: params.clinicalIndication,
      instructions: params.instructions,
      labItems: params.labItems,
      imagingDetails: params.imagingDetails,
      referralDetails: params.referralDetails,
      followUpDetails: params.followUpDetails,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
      isDraft: params.isDraft,
    });

    if (result.success && result.order) {
      AuditLedger.recordEvent({
        actor_id: actorId,
        actor_name: actor.fullName,
        action: "ORDER_CREATED",
        resource_type: "HEALTHCARE_MEDICAL_ORDER",
        resource_id: result.order.id,
        details: {
          encounter_id: params.encounterId,
          patient_id: encounter.patient_id,
          organization_id: encounter.organization_id,
          order_type: params.orderType,
          status: result.order.status,
        },
      });
    }

    return result;
  }

  /**
   * Cancels an active medical order with a documented reason.
   */
  public static async cancelMedicalOrder(
    orderId: string,
    reason: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; order?: HealthcareMedicalOrder; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A cancellation reason is required." };
    }

    const order = getMedicalOrderById(orderId);
    if (!order) {
      return { success: false, error: `Medical order ${orderId} not found.` };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can cancel medical orders." };
    }

    const result = cancelMedicalOrderInStore(
      orderId,
      reason.trim(),
      actorId,
      actor.fullName,
      actor.role
    );

    if (result.success) {
      AuditLedger.recordEvent({
        actor_id: actorId,
        actor_name: actor.fullName,
        action: "ORDER_CANCELLED",
        resource_type: "HEALTHCARE_MEDICAL_ORDER",
        resource_id: orderId,
        details: {
          order_id: orderId,
          patient_id: order.patient_id,
          organization_id: order.organization_id,
          cancellation_reason: reason.trim(),
        },
      });
    }

    return result;
  }

  /**
   * Retrieves pharmacy dispensing payload enforcing least privilege.
   */
  public static getPrescriptionForPharmacy(
    prescriptionId: string,
    pharmacyActor: StoredIdentity | null
  ): { success: boolean; data?: PharmacyPrescriptionPayload; error?: string } {
    return getPrescriptionForPharmacyInStore(prescriptionId, pharmacyActor);
  }

  /**
   * Retrieves prescriptions attached to an encounter with security check.
   */
  public static getEncounterPrescriptions(
    encounterId: string,
    actor: StoredIdentity | null
  ): HealthcarePrescription[] {
    if (!actor) return [];
    return getEncounterPrescriptionsInStore(encounterId);
  }

  /**
   * Retrieves medical orders attached to an encounter with security check.
   */
  public static getEncounterMedicalOrders(
    encounterId: string,
    actor: StoredIdentity | null
  ): HealthcareMedicalOrder[] {
    if (!actor) return [];
    return getEncounterMedicalOrdersInStore(encounterId);
  }

  /**
   * Retrieves prescriptions for patient portal view (hiding unfinalized drafts).
   */
  public static getPatientPrescriptions(
    patientId: string,
    actor: StoredIdentity | null
  ): HealthcarePrescription[] {
    if (!actor) return [];
    const actorId = actor.identifier || actor.id;
    if (actor.role === "patient" && actorId.toLowerCase() !== patientId.toLowerCase() && actor.id.toLowerCase() !== patientId.toLowerCase()) {
      return [];
    }
    return getPatientPrescriptionsInStore(patientId, false);
  }

  /**
   * Retrieves medical orders for patient portal view.
   */
  public static getPatientMedicalOrders(
    patientId: string,
    actor: StoredIdentity | null
  ): HealthcareMedicalOrder[] {
    if (!actor) return [];
    const actorId = actor.identifier || actor.id;
    if (actor.role === "patient" && actorId.toLowerCase() !== patientId.toLowerCase() && actor.id.toLowerCase() !== patientId.toLowerCase()) {
      return [];
    }
    return getPatientMedicalOrdersInStore(patientId, false);
  }
}
