// ============================================================
// MEDORA — SPECIMEN & CHAIN OF CUSTODY DOMAIN SERVICE (PHASE 8.2)
// Server-Authoritative Patient Verification, Specimen Collection & Custody Service
// ============================================================

import {
  createSample,
  recordCustodyEvent,
  rejectSample,
  recordPatientVerification,
  getSampleById,
  getOrderSamples,
  getSampleCustodyEvents,
} from "@/lib/data/lab-sample-store";
import { getLabOrderById } from "@/lib/data/lab-order-store";
import { getLabFacilityById } from "@/lib/data/lab-organization-store";
import { StoredIdentity } from "@/lib/data/identity-store";
import type { HealthcareLabSample, SampleCustodyEvent, SampleType, SampleRejectionReason } from "@/types/database.types";

export class LabSampleService {
  /**
   * Performs two-point patient identity verification before sample collection.
   */
  public static async verifyPatientIdentity(
    orderId: string,
    verificationMethods: string[],
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; verification_record?: any; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const order = getLabOrderById(orderId);
    if (!order) return { success: false, error: `Lab order ${orderId} not found.` };

    if (!verificationMethods || verificationMethods.length < 2) {
      return { success: false, error: "Two-point patient identity verification is required before sample collection (e.g. MEDORA ID + Date of Birth)." };
    }

    const actorId = actor.identifier || actor.id;
    const record = recordPatientVerification({
      patientId: order.patient_id,
      patientName: order.patient_name,
      orderId: order.id,
      verifiedById: actorId,
      verifiedByName: actor.fullName,
      verificationMethods,
    });

    return { success: true, verification_record: record };
  }

  /**
   * Collects and registers a physical specimen for a lab order.
   * Generates server-authoritative Sample ID (SMP-xxxx) and barcode metadata.
   */
  public static async collectSample(
    orderId: string,
    data: {
      sample_type: SampleType;
      test_item_ids: string[];
      test_names: string[];
      facility_id: string;
      location?: string;
      is_recollection?: boolean;
      previous_sample_id?: string;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; sample?: HealthcareLabSample; label_metadata?: any; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const order = getLabOrderById(orderId);
    if (!order) return { success: false, error: `Lab order ${orderId} not found.` };

    if (order.status !== "ACCEPTED" && order.status !== "ORDERED" && order.status !== "FINALIZED") {
      return { success: false, error: `Cannot collect sample for order in status ${order.status}. Order must be ACCEPTED.` };
    }

    const facility = getLabFacilityById(data.facility_id);
    if (!facility) return { success: false, error: `Laboratory facility ${data.facility_id} not found.` };

    const actorId = actor.identifier || actor.id;
    const res = createSample({
      labOrderId: orderId,
      sampleType: data.sample_type,
      testItemIds: data.test_item_ids,
      testNames: data.test_names,
      collectorId: actorId,
      collectorName: actor.fullName,
      collectorRole: actor.role,
      facilityId: facility.id,
      facilityName: facility.name,
      location: data.location,
      isRecollection: data.is_recollection,
      previousSampleId: data.previous_sample_id,
    });

    if (!res.success || !res.sample) {
      return res;
    }

    const sample = res.sample;
    const labelMetadata = {
      sample_id: sample.id,
      barcode: sample.sample_barcode,
      patient_id: sample.patient_id,
      patient_name: sample.patient_name,
      sample_type: sample.sample_type,
      collected_at: sample.collected_at,
      facility_name: sample.laboratory_name,
    };

    return { success: true, sample, label_metadata: labelMetadata };
  }

  /**
   * Tracks specimen movement along the chain of custody.
   */
  public static async recordTransfer(
    sampleId: string,
    data: {
      event_type: "SAMPLE_TRANSFERRED" | "SAMPLE_RECEIVED" | "SAMPLE_READY_FOR_TESTING";
      source_location?: string;
      destination_location?: string;
      notes?: string;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; event?: SampleCustodyEvent; phase83_handoff_event?: any; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const sample = getSampleById(sampleId);
    if (!sample) return { success: false, error: `Sample ${sampleId} not found.` };

    const actorId = actor.identifier || actor.id;
    const event = recordCustodyEvent({
      sampleId: sample.id,
      labOrderId: sample.lab_order_id,
      eventType: data.event_type,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
      sourceLocation: data.source_location,
      destinationLocation: data.destination_location,
      notes: data.notes,
    });

    let phase83Handoff = null;
    if (data.event_type === "SAMPLE_READY_FOR_TESTING") {
      phase83Handoff = {
        event_type: "SAMPLE_READY_FOR_TESTING",
        idempotency_key: `HANDSHAKE-SMP-READY-${sample.id}`,
        timestamp: event.timestamp,
        sample: {
          id: sample.id,
          lab_order_id: sample.lab_order_id,
          patient_id: sample.patient_id,
          sample_type: sample.sample_type,
          test_item_ids: sample.test_item_ids,
          test_names: sample.test_names,
          facility_id: sample.laboratory_id,
          status: "READY_FOR_TESTING",
        },
      };
    }

    return { success: true, event, phase83_handoff_event: phase83Handoff };
  }

  /**
   * Rejects an unsuitable specimen with documented reason.
   */
  public static async rejectSpecimen(
    sampleId: string,
    reason: SampleRejectionReason,
    notes: string | undefined,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; sample?: HealthcareLabSample; error?: string }> {
    if (!actor) return { success: false, error: "Authentication required." };

    const actorId = actor.identifier || actor.id;
    return rejectSample({
      sampleId,
      reason,
      notes,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });
  }

  /**
   * Retrieves custody events for a sample with anti-IDOR protection.
   */
  public static getCustodyTrail(
    sampleId: string,
    actor: StoredIdentity | null
  ): { success: boolean; events?: SampleCustodyEvent[]; error?: string } {
    if (!actor) return { success: false, error: "Authentication required." };

    const sample = getSampleById(sampleId);
    if (!sample) return { success: false, error: `Sample ${sampleId} not found.` };

    const actorId = actor.identifier || actor.id;
    if (actor.role === "patient" && actorId.toLowerCase() !== sample.patient_id.toLowerCase()) {
      return { success: false, error: "Access denied. You can only view custody trails for your own samples." };
    }

    const events = getSampleCustodyEvents(sampleId);
    return { success: true, events };
  }
}
