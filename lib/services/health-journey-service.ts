// ============================================================
// MEDORA — UNIFIED PATIENT HEALTH JOURNEY SERVICE (PHASE 4.4 & C.4)
// Lightweight dynamic aggregation layer referencing canonical records.
// ============================================================

import { TimelineEvent, TimelineEventType, TimelineFilterOptions } from "@/types/database.types";
import { getPatientEncounters } from "../data/encounter-store";
import { getPatientClinicalRecords } from "../data/clinical-record-store";
import { getPatientPrescriptions } from "../data/prescription-store";
import { getPatientLabOrders, getPatientLabReports } from "../data/lab-order-store";
import { getPatientMedicalDocuments } from "../data/medical-document-store";
import { ClinicalContinuityService } from "./clinical-continuity-service";

export interface HealthJourneyFilterOptions extends TimelineFilterOptions {}

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
  totalLabReports: number;
  totalMedicalDocuments: number;
  verifiedDocuments: number;
  patientUploadedDocuments: number;
}

export function getPatientHealthJourney(
  patientId: string,
  options: HealthJourneyFilterOptions = {}
): TimelineEvent[] {
  return ClinicalContinuityService.getPatientTimeline(patientId, null, options);
}

export function groupTimelineEventsByDate(events: TimelineEvent[]): HealthJourneyDateGroup[] {
  return ClinicalContinuityService.groupTimelineEventsByDate(events);
}

export function getHealthJourneySummary(patientId: string): HealthJourneySummary {
  const encounters = getPatientEncounters(patientId);
  const clinicalRecords = getPatientClinicalRecords(patientId, false);
  const prescriptions = getPatientPrescriptions(patientId, false);
  const labOrders = getPatientLabOrders(patientId, false);
  const labReports = getPatientLabReports(patientId);
  const documents = getPatientMedicalDocuments(patientId, true);

  return {
    totalEncounters: encounters.length,
    activeEncounters: encounters.filter((e) => e.status === "ACTIVE").length,
    totalClinicalRecords: clinicalRecords.length,
    activePrescriptions: prescriptions.filter((p) => p.status === "ISSUED").length,
    pendingLabOrders: labOrders.filter((o) => o.status === "ORDERED").length,
    totalLabReports: labReports.length,
    totalMedicalDocuments: documents.length,
    verifiedDocuments: documents.filter((d) => d.source_type === "PROVIDER_GENERATED").length,
    patientUploadedDocuments: documents.filter((d) => d.source_type === "PATIENT_UPLOADED").length,
  };
}

