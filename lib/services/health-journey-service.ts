// ============================================================
// MEDORA — UNIFIED PATIENT HEALTH JOURNEY SERVICE (PHASE 4.4)
// Lightweight dynamic aggregation layer referencing canonical records.
// ============================================================

import { TimelineEvent, TimelineEventType } from "@/types/database.types";
import { getPatientEncounters } from "../data/encounter-store";
import { getPatientClinicalRecords } from "../data/clinical-record-store";
import { getPatientPrescriptions } from "../data/prescription-store";
import { getPatientLabOrders } from "../data/lab-order-store";
import { getPatientMedicalDocuments } from "../data/medical-document-store";
import { logAuditEvent } from "../data/audit-store";

export interface HealthJourneyFilterOptions {
  category?: "all" | "visits" | "records" | "prescriptions" | "lab_orders" | "documents";
  dateRange?: "7_days" | "30_days" | "1_year" | "all";
  searchQuery?: string;
  organizationId?: string;
  professionalId?: string;
  includeRevokedDocs?: boolean;
}

export interface HealthJourneyDateGroup {
  dateKey: string; // e.g. "2026-08-20"
  dateLabel: string; // e.g. "Today", "Yesterday", "20 Aug 2026"
  events: TimelineEvent[];
}

export interface HealthJourneySummary {
  totalEncounters: number;
  activeEncounters: number;
  totalClinicalRecords: number;
  activePrescriptions: number;
  pendingLabOrders: number;
  totalMedicalDocuments: number;
  verifiedDocuments: number;
  patientUploadedDocuments: number;
}

export function getPatientHealthJourney(
  patientId: string,
  options: HealthJourneyFilterOptions = {}
): TimelineEvent[] {
  if (!patientId) return [];

  const rawEvents: TimelineEvent[] = [];

  // 1. Encounters (Visits)
  const encounters = getPatientEncounters(patientId);
  for (const enc of encounters) {
    // Hide cancelled encounters if needed, or display clearly labeled
    rawEvents.push({
      id: `tle-enc-${enc.id}`,
      patient_id: patientId,
      event_type: "ENCOUNTER",
      reference_id: enc.id,
      title: `${enc.encounter_type.replace(/_/g, " ")} — ${enc.department_name}`,
      summary: `Reason: "${enc.reason_for_visit}". Attending: ${enc.provider_name}.`,
      status: enc.status,
      occurred_at: enc.started_at,
      organization_name: enc.organization_name,
      organization_id: enc.organization_id,
      professional_name: enc.provider_name,
      professional_id: enc.provider_id,
      deep_link: "/patient/records",
      metadata: {
        location: enc.location,
        encounterType: enc.encounter_type,
      },
    });
  }

  // 2. Clinical Records (Locked/Finalized only, drafts hidden from patient portal)
  const clinicalRecords = getPatientClinicalRecords(patientId, false);
  for (const cr of clinicalRecords) {
    const diagnosesSummary = cr.diagnoses && cr.diagnoses.length > 0
      ? cr.diagnoses.map((d) => d.name).join(", ")
      : "General Clinical Assessment";

    const assessmentSnippet = cr.assessment
      ? `${cr.assessment.substring(0, 90)}${cr.assessment.length > 90 ? "..." : ""}`
      : "Clinical evaluation completed";

    rawEvents.push({
      id: `tle-cr-${cr.id}`,
      patient_id: patientId,
      event_type: "CLINICAL_RECORD",
      reference_id: cr.id,
      title: `Clinical Consultation Record (v${cr.version})`,
      summary: `Diagnosis: ${diagnosesSummary}. Assessment: "${assessmentSnippet}"`,
      status: cr.status,
      occurred_at: cr.created_at,
      organization_name: cr.organization_name,
      organization_id: cr.organization_id,
      professional_name: cr.author_name,
      professional_id: cr.author_id,
      deep_link: "/patient/records",
      metadata: {
        version: cr.version,
        chiefComplaint: cr.chief_complaint,
        encounterId: cr.encounter_id,
      },
    });
  }

  // 3. Prescriptions (Issued & Cancelled, drafts hidden)
  const prescriptions = getPatientPrescriptions(patientId, false);
  for (const rx of prescriptions) {
    const medicinesSummary = rx.items
      .map((i) => `${i.medicine_name}${i.strength ? ` (${i.strength})` : ""}`)
      .join(", ");

    rawEvents.push({
      id: `tle-rx-${rx.id}`,
      patient_id: patientId,
      event_type: "PRESCRIPTION",
      reference_id: rx.id,
      title: `Prescription Issued (${rx.items.length} ${rx.items.length === 1 ? "medicine" : "medicines"})`,
      summary: `Medicines: ${medicinesSummary}`,
      status: rx.status,
      occurred_at: rx.issued_at || rx.created_at,
      organization_name: rx.organization_name,
      organization_id: rx.organization_id,
      professional_name: rx.prescriber_name,
      professional_id: rx.prescriber_id,
      deep_link: "/patient/prescriptions",
      metadata: {
        itemCount: rx.items.length,
        notes: rx.notes,
        encounterId: rx.encounter_id,
      },
    });
  }

  // 4. Diagnostic Lab Orders (Ordered & Cancelled, drafts hidden)
  const labOrders = getPatientLabOrders(patientId, false);
  for (const order of labOrders) {
    const testsSummary = order.items.map((i) => i.test_name).join(", ");

    rawEvents.push({
      id: `tle-lab-${order.id}`,
      patient_id: patientId,
      event_type: "LAB_ORDER",
      reference_id: order.id,
      title: `Diagnostic Investigation Ordered (${order.priority})`,
      summary: `Tests: ${testsSummary}. Indication: "${order.reason}"`,
      status: order.status,
      occurred_at: order.ordered_at || order.created_at,
      organization_name: order.organization_name,
      organization_id: order.organization_id,
      professional_name: order.ordering_provider_name,
      professional_id: order.ordering_provider_id,
      deep_link: "/patient/reports",
      metadata: {
        priority: order.priority,
        itemCount: order.items.length,
        encounterId: order.encounter_id,
      },
    });
  }

  // 5. Medical Documents
  const documents = getPatientMedicalDocuments(patientId, options.includeRevokedDocs ?? true);
  for (const doc of documents) {
    const sourceLabel =
      doc.source_type === "PROVIDER_GENERATED"
        ? doc.source_organization_name || "Healthcare Provider"
        : "Uploaded by Patient";

    rawEvents.push({
      id: `tle-doc-${doc.id}`,
      patient_id: patientId,
      event_type: "MEDICAL_DOCUMENT",
      reference_id: doc.id,
      title: doc.title,
      summary: `Type: ${doc.document_type.replace(/_/g, " ")}. Source: ${sourceLabel} (${(doc.file_size_bytes / 1024).toFixed(0)} KB)`,
      status: doc.status,
      occurred_at: doc.created_at,
      organization_name: doc.source_organization_name,
      organization_id: doc.source_organization_id,
      professional_name: doc.source_professional_name,
      professional_id: doc.source_professional_id,
      deep_link: "/patient/documents",
      metadata: {
        documentType: doc.document_type,
        sourceType: doc.source_type,
        version: doc.version,
        mimeType: doc.mime_type,
        encounterId: doc.encounter_id,
      },
    });
  }

  // Apply Filtering
  let filtered = rawEvents;

  // Category filter
  if (options.category && options.category !== "all") {
    switch (options.category) {
      case "visits":
        filtered = filtered.filter((e) => e.event_type === "ENCOUNTER");
        break;
      case "records":
        filtered = filtered.filter((e) => e.event_type === "CLINICAL_RECORD");
        break;
      case "prescriptions":
        filtered = filtered.filter((e) => e.event_type === "PRESCRIPTION");
        break;
      case "lab_orders":
        filtered = filtered.filter((e) => e.event_type === "LAB_ORDER");
        break;
      case "documents":
        filtered = filtered.filter((e) => e.event_type === "MEDICAL_DOCUMENT");
        break;
    }
  }

  // Date range filter
  if (options.dateRange && options.dateRange !== "all") {
    const now = Date.now();
    let durationMs = 0;
    if (options.dateRange === "7_days") durationMs = 7 * 24 * 60 * 60 * 1000;
    else if (options.dateRange === "30_days") durationMs = 30 * 24 * 60 * 60 * 1000;
    else if (options.dateRange === "1_year") durationMs = 365 * 24 * 60 * 60 * 1000;

    const threshold = now - durationMs;
    filtered = filtered.filter((e) => new Date(e.occurred_at).getTime() >= threshold);
  }

  // Organization filter
  if (options.organizationId) {
    filtered = filtered.filter((e) => e.organization_id === options.organizationId);
  }

  // Professional filter
  if (options.professionalId) {
    filtered = filtered.filter((e) => e.professional_id === options.professionalId);
  }

  // Search query
  if (options.searchQuery && options.searchQuery.trim().length > 0) {
    const q = options.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.reference_id.toLowerCase().includes(q) ||
        (e.organization_name && e.organization_name.toLowerCase().includes(q)) ||
        (e.professional_name && e.professional_name.toLowerCase().includes(q))
    );
  }

  // Strict Chronological Sorting (Newest first)
  filtered.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  return filtered;
}

export function groupTimelineEventsByDate(events: TimelineEvent[]): HealthJourneyDateGroup[] {
  const groupsMap = new Map<string, TimelineEvent[]>();

  for (const event of events) {
    const date = new Date(event.occurred_at);
    const dateKey = !isNaN(date.getTime())
      ? date.toISOString().split("T")[0]
      : "Unknown Date";

    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, []);
    }
    groupsMap.get(dateKey)!.push(event);
  }

  const result: HealthJourneyDateGroup[] = [];
  const todayKey = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];

  groupsMap.forEach((groupEvents, dateKey) => {
    let dateLabel = dateKey;
    if (dateKey === todayKey) {
      dateLabel = "Today";
    } else if (dateKey === yesterdayKey) {
      dateLabel = "Yesterday";
    } else if (dateKey !== "Unknown Date") {
      const d = new Date(dateKey);
      dateLabel = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    result.push({
      dateKey,
      dateLabel,
      events: groupEvents,
    });
  });

  return result;
}

export function getHealthJourneySummary(patientId: string): HealthJourneySummary {
  const encounters = getPatientEncounters(patientId);
  const clinicalRecords = getPatientClinicalRecords(patientId, false);
  const prescriptions = getPatientPrescriptions(patientId, false);
  const labOrders = getPatientLabOrders(patientId, false);
  const documents = getPatientMedicalDocuments(patientId, true);

  return {
    totalEncounters: encounters.length,
    activeEncounters: encounters.filter((e) => e.status === "ACTIVE").length,
    totalClinicalRecords: clinicalRecords.length,
    activePrescriptions: prescriptions.filter((p) => p.status === "ISSUED").length,
    pendingLabOrders: labOrders.filter((o) => o.status === "ORDERED").length,
    totalMedicalDocuments: documents.length,
    verifiedDocuments: documents.filter((d) => d.source_type === "PROVIDER_GENERATED").length,
    patientUploadedDocuments: documents.filter((d) => d.source_type === "PATIENT_UPLOADED").length,
  };
}
