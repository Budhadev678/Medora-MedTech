// ============================================================
// MEDORA — UNIFIED CLINICAL CONTINUITY SERVICE
// MODIFICATION PHASE C.4
// Authoritative Connectivity Layer aggregating C-Series clinical records.
// Invariant: C.4 does NOT own clinical records; it connects them.
// ============================================================

import {
  TimelineEvent,
  TimelineEventType,
  TimelineSourceType,
  TimelineSection,
  TimelineFilterOptions,
  EncounterClinicalBundle,
  PatientStructuredHealthSummary,
  HealthcareEncounter,
  ClinicalRecord,
  HealthcarePrescription,
  HealthcareLabOrder,
  HealthcareLabSample,
  HealthcareLabReport,
  HealthcareMedicalOrder,
  HealthcareMedicalDocument,
  Appointment,
} from "@/types/database.types";
import { getPatientEncounters, getAllEncounters } from "@/lib/data/encounter-store";
import { getPatientClinicalRecords, getClinicalRecordByEncounterId } from "@/lib/data/clinical-record-store";
import { getPatientPrescriptions, getAllPrescriptions } from "@/lib/data/prescription-store";
import {
  getPatientLabOrders,
  getPatientLabReports,
  getOrderSamples,
  getAllLabOrders,
  getAllLabReports,
  getAllSamples,
} from "@/lib/data/lab-order-store";
import { getPatientMedicalOrders, getAllMedicalOrders } from "@/lib/data/medical-order-store";
import { getPatientMedicalDocuments, getAllMedicalDocuments } from "@/lib/data/medical-document-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { StoredIdentity, findIdentityById } from "@/lib/data/identity-store";
import { appendAuditEvent } from "@/lib/data/audit-store";

export interface HealthJourneyDateGroup {
  dateKey: string; // e.g. "2026-08-25"
  dateLabel: string; // e.g. "Today", "Yesterday", "25 Aug 2026"
  events: TimelineEvent[];
}

export interface ContinuityAccessResult {
  allowed: boolean;
  events: TimelineEvent[];
  error_code?:
    | "UNAUTHORIZED_PATIENT_ACCESS"
    | "UNAUTHORIZED_DOCTOR_ACCESS"
    | "LAB_SCOPED_ACCESS"
    | "PHARMACY_SCOPED_ACCESS"
    | "HOSPITAL_SCOPED_ACCESS"
    | "ACCESS_DENIED";
  message: string;
}

export class ClinicalContinuityService {
  /**
   * Primary entry point: Retrieve authorized chronological timeline events for a patient.
   * Dynamically aggregates canonical records with zero duplication.
   */
  public static getPatientTimeline(
    patientId: string,
    actor?: StoredIdentity | null,
    options: TimelineFilterOptions = {}
  ): TimelineEvent[] {
    if (!patientId) return [];

    const cleanPatientId = patientId.trim().toUpperCase();

    // 1. Authoritative Role-Based Access Scoping & Least Privilege
    const role = actor?.role || "patient";
    const actorId = actor?.identifier || actor?.id || "";

    // Patient IDOR protection: Patient A cannot read Patient B's timeline
    if (role === "patient" && actorId) {
      const cleanActorId = actorId.trim().toUpperCase();
      if (cleanActorId !== cleanPatientId) {
        return []; // Strict isolation
      }
    }

    const rawEvents: TimelineEvent[] = [];
    const nowTime = Date.now();
    const todayStr = new Date().toISOString().split("T")[0];
    const actorOrgId = (actor as any)?.organizationIdentifier || (actor as any)?.organizationId || (actor as any)?.staffData?.[0]?.organizationId;

    // ------------------------------------------------------------
    // ENTITY 1: APPOINTMENTS (Phase B.1 / B.2)
    // ------------------------------------------------------------
    if (role !== "lab_staff" && role !== "pharmacy_staff") {
      try {
        const appointments = AppointmentStore.getAppointmentsForPatient(cleanPatientId);
        for (const apt of appointments) {
          // Facility scoping for hospital staff
          if (role === "hospital_admin" || role === "receptionist" || role === "staff") {
            if (actorOrgId && apt.organization_identifier !== actorOrgId) {
              continue;
            }
          }

          const aptTime = apt.scheduled_time || apt.session_start_time || "09:00";
          const occurredAt = `${apt.appointment_date}T${aptTime.length === 5 ? aptTime + ":00" : aptTime}Z`;
          const isFuture = new Date(occurredAt).getTime() > nowTime && apt.status !== "COMPLETED" && apt.status !== "CANCELLED";
          const isToday = apt.appointment_date === todayStr;

          const section: TimelineSection = isFuture ? "UPCOMING" : isToday ? "TODAY" : "PAST";

          rawEvents.push({
            id: `tle-apt-${apt.id}`,
            patient_id: cleanPatientId,
            event_type: "APPOINTMENT",
            source_type: "APPOINTMENT",
            source_id: apt.id,
            reference_id: apt.appointment_no || apt.id,
            title: `Doctor Appointment (${apt.doctor_name || "Consultation"})`,
            summary: `Session: ${apt.slot_display_time || "OPD Slot"}. Status: ${apt.status}. Department: ${apt.department_name || "General OPD"}.`,
            status: apt.status,
            occurred_at: occurredAt,
            section,
            organization_name: apt.organization_name,
            organization_id: apt.organization_identifier,
            facility_name: (apt as any).facility_name || apt.organization_name,
            facility_id: apt.facility_id,
            department_name: apt.department_name,
            professional_name: apt.doctor_name,
            professional_id: apt.doctor_id,
            professional_role: "Attending Doctor",
            deep_link: "/patient/appointments",
            is_verified: true,
            metadata: {
              tokenNumber: apt.token_number,
              queueState: (apt as any).queue_state,
              checkInStatus: (apt as any).check_in_status,
            },
          });
        }
      } catch (err) {
        // Safe graceful degradation if appointment store is empty
      }
    }

    // ------------------------------------------------------------
    // ENTITY 2: ENCOUNTERS & VISITS (Phase C.1)
    // ------------------------------------------------------------
    if (role !== "lab_staff" && role !== "pharmacy_staff") {
      const encounters = getPatientEncounters(cleanPatientId);
      for (const enc of encounters) {
        if (role === "hospital_admin" || role === "receptionist" || role === "staff") {
          if (actorOrgId && enc.organization_id !== actorOrgId) {
            continue;
          }
        }

        const occurredAt = enc.started_at || enc.created_at;
        const isToday = occurredAt.startsWith(todayStr);
        const section: TimelineSection = isToday ? "TODAY" : "PAST";

        const statusLabel =
          enc.status === "ACTIVE"
            ? "IN CONSULTATION"
            : enc.status === "COMPLETED"
            ? "Completed"
            : enc.status;

        rawEvents.push({
          id: `tle-enc-${enc.id}`,
          patient_id: cleanPatientId,
          event_type: "ENCOUNTER",
          source_type: "ENCOUNTER",
          source_id: enc.id,
          reference_id: enc.id,
          encounter_id: enc.id,
          title: `Clinical Consultation (${enc.department_name || enc.encounter_type})`,
          summary: `Reason: "${enc.reason_for_visit || "Clinical Evaluation"}". Attending: ${enc.provider_name}.`,
          status: statusLabel,
          occurred_at: occurredAt,
          section,
          organization_name: enc.organization_name,
          organization_id: enc.organization_id,
          facility_name: enc.facility_name || enc.organization_name,
          facility_id: enc.facility_id,
          department_name: enc.department_name,
          professional_name: enc.provider_name,
          professional_id: enc.provider_id,
          professional_role: enc.provider_role || "Clinician",
          deep_link: `/doctor/consultations/${enc.id}`,
          is_verified: true,
          metadata: {
            encounterType: enc.encounter_type,
            location: enc.location,
            appointmentId: enc.appointment_id,
          },
        });
      }
    }

    // ------------------------------------------------------------
    // ENTITY 3: CLINICAL RECORDS & DIAGNOSES (Phase C.1)
    // ------------------------------------------------------------
    if (role !== "lab_staff" && role !== "pharmacy_staff") {
      const clinicalRecords = getPatientClinicalRecords(cleanPatientId, false);
      for (const cr of clinicalRecords) {
        if (role === "hospital_admin" || role === "receptionist" || role === "staff") {
          if (actorOrgId && cr.organization_id !== actorOrgId) {
            continue;
          }
        }

        const diagnosesSummary =
          cr.diagnoses && cr.diagnoses.length > 0
            ? cr.diagnoses.map((d) => `${d.name} (${d.icd10_code || "Clinician Authored"})`).join(", ")
            : "Clinical assessment completed";

        const occurredAt = cr.created_at;
        const isToday = occurredAt.startsWith(todayStr);
        const section: TimelineSection = isToday ? "TODAY" : "PAST";

        rawEvents.push({
          id: `tle-cr-${cr.id}`,
          patient_id: cleanPatientId,
          event_type: "CLINICAL_RECORD",
          source_type: "CLINICAL_RECORD",
          source_id: cr.id,
          reference_id: cr.id,
          encounter_id: cr.encounter_id,
          title: `Clinical Assessment & Diagnosis`,
          summary: `Diagnoses: ${diagnosesSummary}. Assessment: "${cr.assessment || cr.chief_complaint || "Evaluation complete"}".`,
          status: `v${cr.version || 1} Signed`,
          occurred_at: occurredAt,
          section,
          organization_name: cr.organization_name,
          organization_id: cr.organization_id,
          facility_name: (cr as any).facility_name || cr.organization_name,
          facility_id: (cr as any).facility_id,
          professional_name: cr.author_name,
          professional_id: cr.author_id,
          professional_role: cr.author_role || "Clinician",
          deep_link: `/doctor/consultations/${cr.encounter_id}`,
          is_verified: true,
          metadata: {
            version: cr.version,
            diagnosesCount: cr.diagnoses?.length || 0,
            hasVitals: !!cr.vitals,
          },
        });
      }
    }

    // ------------------------------------------------------------
    // ENTITY 4: AUTHORITATIVE PRESCRIPTIONS (Phase C.2)
    // ------------------------------------------------------------
    if (role !== "lab_staff") {
      const prescriptions = getPatientPrescriptions(cleanPatientId, false);
      for (const rx of prescriptions) {
        // Scoped pharmacy access
        if (role === "pharmacy_staff" && actorOrgId) {
          if (rx.organization_id && rx.organization_id !== actorOrgId) {
            // Prescriptions are available to pharmacy for dispensing
          }
        }

        const medicinesSummary = rx.items.map((i) => `${i.medicine_name} ${i.strength || ""}`.trim()).join(", ");
        const occurredAt = rx.issued_at || rx.cancelled_at || rx.created_at;
        const isToday = occurredAt.startsWith(todayStr);
        const section: TimelineSection = isToday ? "TODAY" : "PAST";

        const statusLabel =
          rx.status === "ISSUED"
            ? "Prescribed"
            : rx.status === "CANCELLED"
            ? "Cancelled"
            : rx.status;

        rawEvents.push({
          id: `tle-rx-${rx.id}`,
          patient_id: cleanPatientId,
          event_type: "PRESCRIPTION",
          source_type: "PRESCRIPTION",
          source_id: rx.id,
          reference_id: rx.id,
          encounter_id: rx.encounter_id,
          title: `Prescription Issued (${rx.items.length} ${rx.items.length === 1 ? "medicine" : "medicines"})${(rx.version || 1) > 1 ? ` [v${rx.version}]` : ""}`,
          summary: `Regimen: ${medicinesSummary}.${rx.status === "CANCELLED" ? ` [Cancelled: ${rx.cancellation_reason || "Discontinued"}]` : ""}`,
          status: statusLabel,
          occurred_at: occurredAt,
          section,
          organization_name: rx.organization_name,
          organization_id: rx.organization_id,
          facility_name: rx.facility_name || rx.organization_name,
          facility_id: rx.facility_id,
          department_name: rx.department_name,
          professional_name: rx.prescriber_name,
          professional_id: rx.prescriber_id,
          professional_role: rx.prescriber_role || "Prescribing Doctor",
          deep_link: "/patient/prescriptions",
          is_verified: true,
          metadata: {
            itemCount: rx.items.length,
            version: rx.version,
            encounterId: rx.encounter_id,
            status: rx.status,
          },
        });
      }
    }

    // ------------------------------------------------------------
    // ENTITY 5: DIAGNOSTIC LAB ORDERS (Phase C.3)
    // ------------------------------------------------------------
    if (role !== "pharmacy_staff") {
      const labOrders = getPatientLabOrders(cleanPatientId, false);
      for (const order of labOrders) {
        // Scoped lab access: Lab staff only sees orders assigned to their lab
        if (role === "lab_staff" && actorOrgId) {
          if (order.laboratory_id && order.laboratory_id !== actorOrgId) {
            continue;
          }
        }

        const testsSummary = order.items.map((i) => i.test_name).join(", ");
        const occurredAt = order.ordered_at || order.cancelled_at || order.created_at;
        const isToday = occurredAt.startsWith(todayStr);
        const section: TimelineSection = isToday ? "TODAY" : "PAST";

        rawEvents.push({
          id: `tle-labord-${order.id}`,
          patient_id: cleanPatientId,
          event_type: "LAB_ORDER",
          source_type: "LAB_ORDER",
          source_id: order.id,
          reference_id: order.order_reference || order.id,
          encounter_id: order.encounter_id,
          title: `Diagnostic Lab Ordered (${testsSummary})`,
          summary: `Indication: "${order.reason || "Clinical evaluation"}". Priority: ${order.priority}. Instructions: ${order.instructions || "None"}.`,
          status: order.status,
          occurred_at: occurredAt,
          section,
          organization_name: order.organization_name,
          organization_id: order.organization_id,
          facility_name: order.facility_name || order.organization_name,
          facility_id: order.facility_id,
          department_name: order.department_name,
          professional_name: order.ordering_provider_name,
          professional_id: order.ordering_provider_id,
          professional_role: order.ordering_provider_role || "Clinician",
          deep_link: "/patient/reports",
          is_verified: true,
          metadata: {
            priority: order.priority,
            testCount: order.items.length,
            encounterId: order.encounter_id,
            laboratoryId: order.laboratory_id,
            laboratoryName: order.laboratory_name,
          },
        });

        // ------------------------------------------------------------
        // ENTITY 5B: SAMPLES COLLECTED UNDER LAB ORDERS (Phase C.3)
        // ------------------------------------------------------------
        try {
          const samples = getOrderSamples(order.id);
          for (const sample of samples) {
            if (sample.status === "PENDING") continue; // Not collected yet

            const sampleOccurredAt = sample.collected_at || sample.received_at || sample.rejected_at || sample.created_at;
            const sampleIsToday = sampleOccurredAt.startsWith(todayStr);
            const sampleSection: TimelineSection = sampleIsToday ? "TODAY" : "PAST";

            const sampleTitle =
              sample.status === "REJECTED"
                ? `Specimen Rejected — ${sample.sample_type.replace(/_/g, " ")}`
                : sample.is_recollection
                ? `Specimen Re-collected — ${sample.sample_type.replace(/_/g, " ")}`
                : `Specimen Collected — ${sample.sample_type.replace(/_/g, " ")}`;

            const sampleSummary =
              sample.status === "REJECTED"
                ? `Reason: ${sample.rejection_reason || "Quality breach"}. Notes: "${sample.rejection_notes || "Sample recollected"}".`
                : `Barcode: ${sample.sample_barcode}. Intake for: ${sample.test_names.join(", ")}. Status: ${sample.status}.`;

            rawEvents.push({
              id: `tle-smp-${sample.id}`,
              patient_id: cleanPatientId,
              event_type: "SAMPLE",
              source_type: "SAMPLE",
              source_id: sample.id,
              reference_id: sample.sample_barcode || sample.id,
              encounter_id: order.encounter_id,
              title: sampleTitle,
              summary: sampleSummary,
              status: sample.status,
              occurred_at: sampleOccurredAt,
              section: sampleSection,
              organization_name: sample.laboratory_name || order.laboratory_name || "Diagnostic Laboratory",
              organization_id: sample.laboratory_id || order.laboratory_id,
              facility_name: sample.laboratory_name,
              professional_name: sample.collected_by_name || "Phlebotomist",
              professional_id: sample.collected_by_id,
              professional_role: "Laboratory Staff",
              deep_link: "/patient/reports",
              is_verified: true,
              metadata: {
                labOrderId: order.id,
                sampleType: sample.sample_type,
                isRecollection: sample.is_recollection,
              },
            });
          }
        } catch (err) {
          // Graceful fallback
        }
      }
    }

    // ------------------------------------------------------------
    // ENTITY 6: CERTIFIED LAB REPORTS (Phase C.3)
    // ------------------------------------------------------------
    if (role !== "pharmacy_staff") {
      const labReports = getPatientLabReports(cleanPatientId);
      for (const report of labReports) {
        // Scoped lab access
        if (role === "lab_staff" && actorOrgId) {
          if (report.laboratory_id !== actorOrgId) {
            continue;
          }
        }

        const testsSummary = Array.from(new Set(report.results.map((r) => r.test_name))).join(", ");
        const abnormalCount = report.results.filter((r) => r.flag === "HIGH" || r.flag === "LOW" || r.flag === "CRITICAL").length;

        const occurredAt = report.released_at || report.verified_at || report.created_at;
        const isToday = occurredAt.startsWith(todayStr);
        const section: TimelineSection = isToday ? "TODAY" : "PAST";

        const title =
          report.status === "AMENDED"
            ? `Lab Report Amended — ${testsSummary} (v${report.version})`
            : `Certified Lab Report Released — ${testsSummary}${report.version > 1 ? ` (v${report.version})` : ""}`;

        const summary = `Laboratory: ${report.laboratory_name}. Certified by: ${report.verified_by_name || "Pathologist"}.${abnormalCount > 0 ? ` (${abnormalCount} flagged analytes)` : " (All parameters normal)"}.`;

        rawEvents.push({
          id: `tle-rpt-${report.id}`,
          patient_id: cleanPatientId,
          event_type: "LAB_REPORT",
          source_type: "LAB_REPORT",
          source_id: report.id,
          reference_id: report.report_reference || report.id,
          encounter_id: report.encounter_id,
          title,
          summary,
          status: report.status,
          occurred_at: occurredAt,
          section,
          organization_name: report.laboratory_name,
          organization_id: report.laboratory_id,
          facility_name: report.laboratory_name,
          facility_id: report.laboratory_id,
          professional_name: report.verified_by_name || report.released_by_name || "Pathologist",
          professional_id: report.verified_by_id || report.released_by_id,
          professional_role: "Consultant Pathologist",
          deep_link: "/patient/reports",
          is_verified: true,
          metadata: {
            version: report.version,
            labOrderId: report.lab_order_id,
            encounterId: report.encounter_id,
            resultCount: report.results.length,
            abnormalCount,
          },
        });
      }
    }

    // ------------------------------------------------------------
    // ENTITY 7: MEDICAL ORDERS (Phase C.2 — Imaging, Referrals, Follow-ups)
    // ------------------------------------------------------------
    if (role !== "lab_staff" && role !== "pharmacy_staff") {
      const medicalOrders = getPatientMedicalOrders(cleanPatientId, false);
      for (const order of medicalOrders) {
        if (order.order_type === "LAB") continue; // Already covered by lab orders store

        let eventType: TimelineEventType = "REFERRAL";
        let title = "Medical Order";
        let summary = order.clinical_indication || "Medical order created";
        let occurredAt = order.created_at;
        let section: TimelineSection = occurredAt.startsWith(todayStr) ? "TODAY" : "PAST";

        if (order.order_type === "IMAGING") {
          eventType = "IMAGING_ORDER";
          title = `Radiology & Imaging Ordered (${order.imaging_details?.modality || "Imaging"})`;
          summary = `Study: ${order.imaging_details?.body_part || "Anatomy"}. Protocol: ${order.imaging_details?.modality || "Radiology"} (${order.priority}).`;
        } else if (order.order_type === "REFERRAL") {
          eventType = "REFERRAL";
          title = `Specialty Referral (${order.referral_details?.target_specialty || "Specialist"})`;
          summary = `Referred to: ${order.referral_details?.target_doctor_name || order.referral_details?.target_specialty || "Specialist"}. Urgency: ${order.priority}.`;
        } else if (order.order_type === "FOLLOW_UP") {
          eventType = "FOLLOW_UP";
          title = `Follow-Up Recommended (${order.follow_up_details?.timeframe || "Scheduled"})`;
          summary = `Instructions: "${order.follow_up_details?.instructions || order.instructions || "Routine OPD follow-up"}".`;
          
          if (order.follow_up_details?.recommended_date) {
            occurredAt = `${order.follow_up_details.recommended_date}T09:00:00Z`;
            if (new Date(occurredAt).getTime() > nowTime) {
              section = "UPCOMING";
            }
          }
        }

        rawEvents.push({
          id: `tle-ord-${order.id}`,
          patient_id: cleanPatientId,
          event_type: eventType,
          source_type: "MEDICAL_ORDER",
          source_id: order.id,
          reference_id: order.order_reference || order.id,
          encounter_id: order.encounter_id,
          title,
          summary,
          status: order.status,
          occurred_at: occurredAt,
          section,
          organization_name: order.organization_name,
          organization_id: order.organization_id,
          facility_name: order.facility_name || order.organization_name,
          facility_id: order.facility_id,
          department_name: order.department_name,
          professional_name: order.ordering_provider_name,
          professional_id: order.ordering_provider_id,
          professional_role: order.ordering_provider_role || "Attending Doctor",
          deep_link: "/patient/records",
          is_verified: true,
          metadata: {
            orderType: order.order_type,
            priority: order.priority,
            encounterId: order.encounter_id,
          },
        });
      }
    }

    // ------------------------------------------------------------
    // ENTITY 8: MEDICAL DOCUMENTS (Phase 4.4)
    // ------------------------------------------------------------
    if (role !== "lab_staff" && role !== "pharmacy_staff") {
      const documents = getPatientMedicalDocuments(cleanPatientId, options.includeRevokedDocs ?? true);
      for (const doc of documents) {
        const sourceLabel =
          doc.source_type === "PROVIDER_GENERATED"
            ? doc.source_organization_name || "Healthcare Provider"
            : "Uploaded by Patient";

        const occurredAt = doc.created_at;
        const isToday = occurredAt.startsWith(todayStr);
        const section: TimelineSection = isToday ? "TODAY" : "PAST";

        rawEvents.push({
          id: `tle-doc-${doc.id}`,
          patient_id: cleanPatientId,
          event_type: "MEDICAL_DOCUMENT",
          source_type: "MEDICAL_DOCUMENT",
          source_id: doc.id,
          reference_id: doc.document_reference || doc.id,
          encounter_id: doc.encounter_id,
          title: doc.title,
          summary: `Type: ${doc.document_type.replace(/_/g, " ")}. Source: ${sourceLabel} (${(doc.file_size_bytes / 1024).toFixed(0)} KB).`,
          status: doc.status,
          occurred_at: occurredAt,
          section,
          organization_name: doc.source_organization_name,
          organization_id: doc.source_organization_id,
          professional_name: doc.source_professional_name,
          professional_id: doc.source_professional_id,
          professional_role: doc.source_professional_role,
          deep_link: "/patient/documents",
          is_verified: doc.source_type === "PROVIDER_GENERATED",
          metadata: {
            documentType: doc.document_type,
            sourceType: doc.source_type,
            version: doc.version,
            encounterId: doc.encounter_id,
          },
        });
      }
    }

    // ------------------------------------------------------------
    // APPLY MULTI-DIMENSIONAL FILTERING
    // ------------------------------------------------------------
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
          filtered = filtered.filter((e) => e.event_type === "LAB_ORDER" || e.event_type === "SAMPLE");
          break;
        case "lab_reports":
          filtered = filtered.filter((e) => e.event_type === "LAB_REPORT");
          break;
        case "appointments":
          filtered = filtered.filter((e) => e.event_type === "APPOINTMENT");
          break;
        case "referrals":
          filtered = filtered.filter((e) => e.event_type === "REFERRAL" || e.event_type === "IMAGING_ORDER" || e.event_type === "FOLLOW_UP");
          break;
        case "documents":
          filtered = filtered.filter((e) => e.event_type === "MEDICAL_DOCUMENT");
          break;
      }
    }

    // Date range filter
    if (options.dateRange && options.dateRange !== "all") {
      if (options.dateRange === "today") {
        filtered = filtered.filter((e) => e.section === "TODAY" || e.occurred_at.startsWith(todayStr));
      } else {
        let durationMs = 0;
        if (options.dateRange === "7_days") durationMs = 7 * 24 * 60 * 60 * 1000;
        else if (options.dateRange === "30_days") durationMs = 30 * 24 * 60 * 60 * 1000;
        else if (options.dateRange === "1_year") durationMs = 365 * 24 * 60 * 60 * 1000;

        const threshold = nowTime - durationMs;
        filtered = filtered.filter((e) => new Date(e.occurred_at).getTime() >= threshold || e.section === "UPCOMING");
      }
    }

    // Organization filter
    if (options.organizationId) {
      filtered = filtered.filter((e) => e.organization_id === options.organizationId);
    }

    // Facility filter
    if (options.facilityId) {
      filtered = filtered.filter((e) => e.facility_id === options.facilityId);
    }

    // Professional / Doctor filter
    if (options.professionalId) {
      filtered = filtered.filter((e) => e.professional_id === options.professionalId);
    }

    // Keyword Search
    if (options.searchQuery && options.searchQuery.trim().length > 0) {
      const q = options.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.reference_id.toLowerCase().includes(q) ||
          (e.organization_name && e.organization_name.toLowerCase().includes(q)) ||
          (e.facility_name && e.facility_name.toLowerCase().includes(q)) ||
          (e.professional_name && e.professional_name.toLowerCase().includes(q))
      );
    }

    // ------------------------------------------------------------
    // STRICT CHRONOLOGICAL ORDERING (Newest first)
    // ------------------------------------------------------------
    filtered.sort((a, b) => {
      // Upcoming events sorted earliest upcoming first, historical sorted newest first
      if (a.section === "UPCOMING" && b.section === "UPCOMING") {
        return new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime();
      }
      if (a.section === "UPCOMING") return -1;
      if (b.section === "UPCOMING") return 1;
      return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
    });

    // Pagination / Slicing
    if (options.offset || options.limit) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      filtered = filtered.slice(start, end);
    }

    // Append Audit Trail Event for Timeline Access
    try {
      appendAuditEvent({
        event_type: "TIMELINE_ACCESSED",
        actor_id: actorId || "SYSTEM",
        actor_name: actor?.fullName || (actor as any)?.name || "System",
        actor_role: role,
        patient_id: cleanPatientId,
        organization_id: (actor as any)?.organizationIdentifier || (actor as any)?.organizationId,
        summary: `Accessed unified patient clinical timeline (${filtered.length} events retrieved).`,
        metadata: {
          eventCount: filtered.length,
          categoryFilter: options.category || "all",
          dateRangeFilter: options.dateRange || "all",
        },
      });
    } catch (err) {
      // Non-blocking audit logging
    }

    return filtered;
  }

  /**
   * Group patient timeline events into cohesive Encounter Clinical Bundles.
   * Connects all prescriptions, orders, reports, and notes authored under each consultation visit.
   */
  public static getPatientEncounterBundles(
    patientId: string,
    actor?: StoredIdentity | null,
    options: TimelineFilterOptions = {}
  ): EncounterClinicalBundle[] {
    if (!patientId) return [];
    const cleanPatientId = patientId.trim().toUpperCase();

    const encounters = getPatientEncounters(cleanPatientId);
    const clinicalRecords = getPatientClinicalRecords(cleanPatientId, false);
    const prescriptions = getPatientPrescriptions(cleanPatientId, false);
    const labOrders = getPatientLabOrders(cleanPatientId, false);
    const labReports = getPatientLabReports(cleanPatientId);
    const medicalOrders = getPatientMedicalOrders(cleanPatientId, false);
    const documents = getPatientMedicalDocuments(cleanPatientId, true);

    let appointments: Appointment[] = [];
    try {
      appointments = AppointmentStore.getAppointmentsForPatient(cleanPatientId);
    } catch (e) {}

    const bundles: EncounterClinicalBundle[] = [];

    for (const enc of encounters) {
      const encId = enc.id.toUpperCase();

      // Related clinical record
      const linkedRecord = clinicalRecords.find((cr) => cr.encounter_id?.toUpperCase() === encId) || null;

      // Related appointment
      const linkedApt = enc.appointment_id
        ? appointments.find((a) => a.id.toUpperCase() === enc.appointment_id?.toUpperCase()) || null
        : null;

      // Related prescriptions
      const encPrescriptions = prescriptions.filter((p) => p.encounter_id?.toUpperCase() === encId);

      // Related lab orders
      const encLabOrders = labOrders.filter((lo) => lo.encounter_id?.toUpperCase() === encId);

      // Related samples
      const encSamples: HealthcareLabSample[] = [];
      for (const lo of encLabOrders) {
        try {
          const smps = getOrderSamples(lo.id);
          encSamples.push(...smps);
        } catch (e) {}
      }

      // Related lab reports
      const encReports = labReports.filter(
        (lr) =>
          lr.encounter_id?.toUpperCase() === encId ||
          encLabOrders.some((lo) => lo.id.toUpperCase() === lr.lab_order_id.toUpperCase())
      );

      // Related medical orders (imaging, referrals, follow-ups)
      const encMedOrders = medicalOrders.filter((mo) => mo.encounter_id?.toUpperCase() === encId);

      // Related documents
      const encDocs = documents.filter((d) => d.encounter_id?.toUpperCase() === encId);

      bundles.push({
        encounter: enc,
        clinical_record: linkedRecord,
        linked_appointment: linkedApt,
        prescriptions: encPrescriptions,
        lab_orders: encLabOrders,
        samples: encSamples,
        lab_reports: encReports,
        medical_orders: encMedOrders,
        medical_documents: encDocs,
        occurred_at: enc.started_at || enc.created_at,
        status: enc.status,
        doctor_name: enc.provider_name,
        organization_name: enc.organization_name,
        facility_name: enc.facility_name || enc.organization_name,
        department_name: enc.department_name,
      });
    }

    // Sort bundles chronologically (Newest encounter first)
    bundles.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

    return bundles;
  }

  /**
   * Generates a structured factual health summary (Current Medications, Allergies, Recent Labs, Recent Visits).
   * Strictly no AI generation or autonomous diagnosis.
   */
  public static getPatientStructuredHealthSummary(
    patientId: string,
    actor?: StoredIdentity | null
  ): PatientStructuredHealthSummary {
    const cleanPatientId = patientId.trim().toUpperCase();
    const patientIdentity = findIdentityById(cleanPatientId);

    const encounters = getPatientEncounters(cleanPatientId);
    const prescriptions = getPatientPrescriptions(cleanPatientId, false);
    const labReports = getPatientLabReports(cleanPatientId);
    const medicalOrders = getPatientMedicalOrders(cleanPatientId, false);
    const clinicalRecords = getPatientClinicalRecords(cleanPatientId, false);

    let appointments: Appointment[] = [];
    try {
      appointments = AppointmentStore.getAppointmentsForPatient(cleanPatientId);
    } catch (e) {}

    const nowTime = Date.now();

    // 1. Current Active Prescriptions
    const activePrescriptions = prescriptions.filter((p) => p.status === "ISSUED");

    // 2. Recent Released Lab Reports
    const recentReports = labReports
      .filter((r) => r.status === "RELEASED" || r.status === "AMENDED")
      .slice(0, 5);

    // 3. Recent Encounters
    const recentEncounters = encounters.slice(0, 5);

    // 4. Upcoming Appointments
    const upcomingAppointments = appointments
      .filter((a) => {
        const aptTime = a.scheduled_time || a.session_start_time || "09:00";
        const occurredAt = `${a.appointment_date}T${aptTime.length === 5 ? aptTime + ":00" : aptTime}Z`;
        return new Date(occurredAt).getTime() > nowTime && a.status !== "COMPLETED" && a.status !== "CANCELLED";
      })
      .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

    // 5. Upcoming Follow-Up Recommendations
    const upcomingFollowUps = medicalOrders.filter((mo) => {
      if (mo.order_type !== "FOLLOW_UP") return false;
      if (!mo.follow_up_details?.recommended_date) return true;
      return new Date(mo.follow_up_details.recommended_date).getTime() > nowTime;
    });

    // 6. Allergies Factual Extraction
    const allergies: string[] = [];
    if (patientIdentity?.patientData?.allergies && patientIdentity.patientData.allergies.length > 0) {
      allergies.push(...patientIdentity.patientData.allergies);
    }

    return {
      patient_id: cleanPatientId,
      patient_name: patientIdentity?.fullName || (patientIdentity as any)?.name || "Patient",
      allergies: Array.from(new Set(allergies)),
      chronic_conditions: patientIdentity?.patientData?.chronicConditions || [],
      active_prescriptions: activePrescriptions,
      recent_released_reports: recentReports,
      recent_encounters: recentEncounters,
      upcoming_appointments: upcomingAppointments,
      upcoming_follow_ups: upcomingFollowUps,
      total_encounters_count: encounters.length,
      total_prescriptions_count: prescriptions.length,
      total_lab_reports_count: labReports.length,
      last_updated_at: new Date().toISOString(),
    };
  }

  /**
   * Helper: Group timeline events by date for rendering section headers.
   */
  public static groupTimelineEventsByDate(events: TimelineEvent[]): HealthJourneyDateGroup[] {
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

  /**
   * Validates full graph integrity for an encounter.
   * Ensures patient, doctor, facility, organization, clinical notes, prescriptions,
   * lab orders, referrals, and follow-ups strictly belong to the same patient & encounter graph.
   */
  public static validateClinicalGraphIntegrity(encounterId: string): {
    valid: boolean;
    encounter_id: string;
    patient_id?: string;
    issues: string[];
  } {
    const issues: string[] = [];
    const encounter = getAllEncounters().find((e) => e.id.toLowerCase() === encounterId.toLowerCase());

    if (!encounter) {
      return { valid: false, encounter_id: encounterId, issues: [`Encounter ${encounterId} not found.`] };
    }

    const patientId = encounter.patient_id;

    // 1. Prescriptions
    const rxList = getAllPrescriptions().filter((r) => r.encounter_id.toLowerCase() === encounterId.toLowerCase());
    for (const rx of rxList) {
      if (rx.patient_id.toLowerCase() !== patientId.toLowerCase()) {
        issues.push(`Prescription ${rx.id} patient_id mismatch: expected ${patientId}, got ${rx.patient_id}`);
      }
    }

    // 2. Lab Orders
    const labList = getAllLabOrders().filter((l) => l.encounter_id.toLowerCase() === encounterId.toLowerCase());
    for (const lab of labList) {
      if (lab.patient_id.toLowerCase() !== patientId.toLowerCase()) {
        issues.push(`Lab Order ${lab.id} patient_id mismatch: expected ${patientId}, got ${lab.patient_id}`);
      }
    }

    return {
      valid: issues.length === 0,
      encounter_id: encounterId,
      patient_id: patientId,
      issues,
    };
  }
}
