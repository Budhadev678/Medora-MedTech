// ============================================================
// MEDORA — CLINICAL ENCOUNTER & DOCTOR CONSULTATION SERVICE
// MODIFICATION PHASE C.1
// ============================================================

import {
  HealthcareEncounter,
  ClinicalRecord,
  ClinicalSymptom,
  ClinicalVitals,
  ClinicalDiagnosis,
  ClinicalFollowUpPlan,
  QueueEntry,
  Appointment,
} from "@/types/database.types";
import {
  getAllEncounters,
  getEncounterById,
  createEncounter,
  saveEncounters,
  completeEncounter as completeEncounterInStore,
  getPatientEncounters,
  getDoctorEncounters,
} from "@/lib/data/encounter-store";
import {
  getClinicalRecordByEncounterId,
  saveClinicalRecordDraft,
  completeClinicalRecord,
  amendClinicalRecord,
  getPatientClinicalRecords,
} from "@/lib/data/clinical-record-store";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { ConsultationHistoryStore } from "@/lib/data/consultation-history-store";
import { StoredIdentity, findIdentityById } from "@/lib/data/identity-store";
import { AuditLedger } from "@/lib/data/audit-store";

export interface StartConsultationResult {
  success: boolean;
  encounter?: HealthcareEncounter;
  clinical_record?: ClinicalRecord;
  queue_entry?: QueueEntry;
  appointment?: Appointment;
  error_code?: string;
  message: string;
}

export interface CompleteConsultationResult {
  success: boolean;
  encounter?: HealthcareEncounter;
  clinical_record?: ClinicalRecord;
  duration_minutes?: number;
  error_code?: string;
  message: string;
}

export interface ConsultationContext {
  encounter: HealthcareEncounter;
  clinical_record: ClinicalRecord | null;
  patient: StoredIdentity | null;
  allergies: string[];
  chronic_conditions: string[];
  recent_encounters: HealthcareEncounter[];
  linked_appointment: Appointment | null;
  linked_queue_entry: QueueEntry | null;
}

export class ConsultationService {
  /**
   * Starts a clinical consultation from an active queue entry (token).
   * Transforms Appointment/Queue interaction into an authoritative HealthcareEncounter.
   *
   * Flow:
   * Patient (PAT-1001) -> Appointment (APT-1001) -> Token (C-01)
   * -> Doctor calls -> Doctor clicks START CONSULTATION
   * -> Creates/Activates Encounter (ENC-xxxx) with started_at timestamp
   * -> Connects to actual facility and department
   * -> Prevents concurrent active consultations per doctor
   */
  public static async startConsultationFromQueue(
    queueEntryId: string,
    actor: StoredIdentity | null
  ): Promise<StartConsultationResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    if (actor.role !== "doctor" && actor.role !== "admin") {
      return {
        success: false,
        error_code: "FORBIDDEN",
        message: "Only authorized medical doctors can initiate a clinical consultation.",
      };
    }

    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return { success: false, error_code: "NOT_FOUND", message: "Queue entry not found." };
    }

    // Doctor authorization validation: Actor must match the queue's doctor (or be a verified admin)
    const actorId = actor.identifier || actor.id;
    if (actor.role === "doctor" && entry.doctor_id !== actorId && entry.doctor_id !== actor.id) {
      return {
        success: false,
        error_code: "WRONG_DOCTOR",
        message: `Doctor mismatch: You are signed in as ${actor.fullName}, but this token is assigned to ${entry.doctor_name}.`,
      };
    }

    // Queue state validation: Must be CALLED or WAITING (or already in IN_CONSULTATION for idempotency)
    if (entry.status !== "CALLED" && entry.status !== "WAITING") {
      const allEncounters = getAllEncounters();
      const existingEncounter = allEncounters.find(
        (e) => e.queue_entry_id === entry.id || (entry.appointment_id && e.appointment_id === entry.appointment_id)
      );

      if (existingEncounter && entry.status === "IN_CONSULTATION") {
        const clinicalRecord = getClinicalRecordByEncounterId(existingEncounter.id);
        return {
          success: true,
          encounter: existingEncounter,
          clinical_record: clinicalRecord || undefined,
          queue_entry: entry,
          message: `Consultation already active for ${entry.patient_name} (Token #${entry.token_number}).`,
        };
      }

      return {
        success: false,
        error_code: "INVALID_STATE",
        message: `Cannot start consultation for patient in status ${entry.status}.`,
      };
    }

    // Doctor Exclusivity Guard: Doctor cannot have multiple active consultations simultaneously
    const doctorQueue = QueueStore.getQueueForDoctor(entry.doctor_id, entry.organization_identifier, entry.date);
    const activeConsultation = doctorQueue.find((q) => q.status === "IN_CONSULTATION" && q.id !== entry.id);

    if (activeConsultation) {
      return {
        success: false,
        error_code: "CONSULTATION_IN_PROGRESS",
        message: `You already have an active patient (Token #${activeConsultation.token_number} - ${activeConsultation.patient_name}) in consultation. Please complete or hold that session first.`,
      };
    }

    const nowIso = new Date().toISOString();

    // 1. Check if an active encounter already exists for this appointment to prevent duplicate creation
    const allEncounters = getAllEncounters();
    let existingEncounter = allEncounters.find(
      (e) => e.queue_entry_id === entry.id || (entry.appointment_id && e.appointment_id === entry.appointment_id)
    );

    let encounter: HealthcareEncounter;

    if (existingEncounter) {
      encounter = existingEncounter;
      if (encounter.status !== "ACTIVE") {
        encounter.status = "ACTIVE";
        encounter.started_at = encounter.started_at || nowIso;
        encounter.updated_at = nowIso;
      }
    } else {
      // 2. Create authoritative HealthcareEncounter
      const nextNum = allEncounters.length + 1001;
      const newEncounterId = `ENC-${nextNum}`;

      const patientIdentity = findIdentityById(entry.patient_id);
      const doctorIdentity = findIdentityById(entry.doctor_id) || actor;

      encounter = {
        id: newEncounterId,
        encounter_reference: newEncounterId,
        patient_id: entry.patient_id,
        patient_name: entry.patient_name,
        patient_gender: patientIdentity?.patientData?.gender,
        patient_dob: patientIdentity?.patientData?.dob,
        patient_blood_group: patientIdentity?.patientData?.bloodGroup,
        provider_id: entry.doctor_id,
        provider_name: entry.doctor_name,
        provider_role: doctorIdentity.doctorData?.specialization
          ? `Consultant (${doctorIdentity.doctorData.specialization})`
          : "Attending Doctor",
        organization_id: entry.organization_identifier,
        organization_name: entry.organization_name,
        facility_id: entry.facility_id,
        facility_name: entry.organization_name,
        department_id: entry.department_id,
        department_name: entry.department_name,
        encounter_type: entry.source === "WALK_IN" ? "OUTPATIENT" : "CONSULTATION",
        status: "ACTIVE",
        source_type: entry.source === "WALK_IN" ? "DIRECT_CONSULTATION" : "APPOINTMENT",
        reason_for_visit: entry.notes || "Clinical Consultation",
        location: entry.room_number || "OPD Room",
        appointment_id: entry.appointment_id,
        queue_entry_id: entry.id,
        token_number: entry.token_number,
        started_at: nowIso,
        created_by: actorId,
        created_by_role: actor.role,
        created_at: nowIso,
        updated_at: nowIso,
      };

      allEncounters.unshift(encounter);
      saveEncounters(allEncounters);
    }

    // 3. Update Queue Entry state to IN_CONSULTATION
    const updatedQueueEntry: QueueEntry = {
      ...entry,
      status: "IN_CONSULTATION",
      encounter_id: encounter.id,
      consultation_started_at: nowIso,
    };
    QueueStore.saveQueueEntry(updatedQueueEntry);

    // 4. Update Appointment state to IN_CONSULTATION if linked
    let linkedAppointment: Appointment | undefined = undefined;
    if (entry.appointment_id) {
      const apt = AppointmentStore.getAppointmentById(entry.appointment_id);
      if (apt) {
        linkedAppointment = AppointmentStore.saveAppointment({
          ...apt,
          status: "IN_CONSULTATION" as any,
          updated_at: nowIso,
        });
      }
    }

    // 5. Initialize or retrieve draft ClinicalRecord
    let clinicalRecord = getClinicalRecordByEncounterId(encounter.id);
    if (!clinicalRecord) {
      const initDraftRes = saveClinicalRecordDraft({
        encounterId: encounter.id,
        chiefComplaint: entry.notes || "Consultation regarding health symptoms",
        symptoms: [],
        vitals: {
          recorded_at: nowIso,
          recorded_by: actorId,
          recorded_by_name: actor.fullName,
        },
        observations: "",
        clinicalNotes: "",
        assessment: "",
        diagnoses: [],
        treatmentPlan: "",
        followUpPlan: { required: false },
        actorId,
        actorName: actor.fullName,
        actorRole: actor.role,
      });
      if (initDraftRes.success && initDraftRes.record) {
        clinicalRecord = initDraftRes.record;
      }
    }

    // 6. Record Immutable Audit Event
    AuditLedger.recordEvent({
      actor_id: actorId,
      actor_name: actor.fullName,
      action: "CONSULTATION_STARTED",
      resource_type: "HEALTHCARE_ENCOUNTER",
      resource_id: encounter.id,
      details: {
        patient_id: encounter.patient_id,
        organization_id: encounter.organization_id,
        token: entry.token_number,
        appointment_id: entry.appointment_id || null,
        facility: entry.organization_name,
        department: entry.department_name,
        started_at: nowIso,
      },
    });

    return {
      success: true,
      encounter,
      clinical_record: clinicalRecord || undefined,
      queue_entry: updatedQueueEntry,
      appointment: linkedAppointment,
      message: `Consultation started with ${entry.patient_name} (Token #${entry.token_number}).`,
    };
  }

  /**
   * Saves or auto-saves a clinical documentation draft.
   * Does NOT complete the encounter.
   */
  public static async saveDraft(
    encounterId: string,
    draftData: {
      chief_complaint?: string;
      symptoms?: ClinicalSymptom[];
      vitals?: ClinicalVitals;
      observations?: string;
      clinical_notes?: string;
      assessment?: string;
      diagnoses?: ClinicalDiagnosis[];
      treatment_plan?: string;
      follow_up_plan?: ClinicalFollowUpPlan;
    },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; record?: ClinicalRecord; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) {
      return { success: false, error: "Encounter not found." };
    }

    if (encounter.status === "COMPLETED") {
      return {
        success: false,
        error: "This consultation has already been COMPLETED. Modifications must be made via amendment.",
      };
    }

    const actorId = actor.identifier || actor.id;

    // Validate Doctor Authorization
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized clinicians may edit clinical records." };
    }

    const result = saveClinicalRecordDraft({
      encounterId,
      chiefComplaint: draftData.chief_complaint || encounter.reason_for_visit,
      symptoms: draftData.symptoms,
      vitals: draftData.vitals,
      observations: draftData.observations,
      clinicalNotes: draftData.clinical_notes,
      assessment: draftData.assessment,
      diagnoses: draftData.diagnoses,
      treatmentPlan: draftData.treatment_plan,
      followUpPlan: draftData.follow_up_plan,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });

    if (result.success) {
      AuditLedger.recordEvent({
        actor_id: actorId,
        actor_name: actor.fullName,
        action: "DRAFT_SAVED",
        resource_type: "CLINICAL_RECORD",
        resource_id: result.record?.id,
        details: {
          encounter_id: encounter.id,
          patient_id: encounter.patient_id,
          organization_id: encounter.organization_id,
          has_diagnoses: Boolean(draftData.diagnoses && draftData.diagnoses.length > 0),
          has_vitals: Boolean(draftData.vitals && draftData.vitals.systolic_bp_mmhg),
        },
      });
    }

    return result;
  }

  /**
   * Completes an active consultation with final clinical documentation.
   * Transitions Encounter, Clinical Record, Queue Entry, and Appointment to COMPLETED.
   * Does NOT auto-start the next patient, preserving complete doctor autonomy.
   */
  public static async completeConsultation(
    encounterId: string,
    finalDocumentation: {
      chief_complaint?: string;
      symptoms?: ClinicalSymptom[];
      vitals?: ClinicalVitals;
      observations?: string;
      clinical_notes?: string;
      assessment?: string;
      diagnoses?: ClinicalDiagnosis[];
      treatment_plan?: string;
      follow_up_plan?: ClinicalFollowUpPlan;
    },
    actor: StoredIdentity | null
  ): Promise<CompleteConsultationResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) {
      return { success: false, error_code: "NOT_FOUND", message: "Encounter not found." };
    }

    if (encounter.status === "COMPLETED") {
      return {
        success: false,
        error_code: "ALREADY_COMPLETED",
        message: "This consultation has already been completed.",
      };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return {
        success: false,
        error_code: "FORBIDDEN",
        message: "Only authorized medical doctors can complete clinical consultations.",
      };
    }

    const nowIso = new Date().toISOString();

    // 1. Ensure latest clinical record draft is updated
    saveClinicalRecordDraft({
      encounterId,
      chiefComplaint: finalDocumentation.chief_complaint || encounter.reason_for_visit,
      symptoms: finalDocumentation.symptoms,
      vitals: finalDocumentation.vitals,
      observations: finalDocumentation.observations,
      clinicalNotes: finalDocumentation.clinical_notes,
      assessment: finalDocumentation.assessment,
      diagnoses: finalDocumentation.diagnoses,
      treatmentPlan: finalDocumentation.treatment_plan,
      followUpPlan: finalDocumentation.follow_up_plan,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });

    const targetRecord = getClinicalRecordByEncounterId(encounterId);
    if (!targetRecord) {
      return {
        success: false,
        error_code: "RECORD_NOT_FOUND",
        message: "Clinical record not found for this encounter.",
      };
    }

    // 2. Finalize Clinical Record
    const completeRecordRes = completeClinicalRecord({
      recordId: targetRecord.id,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });

    if (!completeRecordRes.success) {
      return {
        success: false,
        error_code: "RECORD_COMPLETION_FAILED",
        message: completeRecordRes.error || "Failed to finalize clinical documentation.",
      };
    }

    // 3. Complete Encounter in Store
    const completeEncRes = completeEncounterInStore(encounterId, actorId, actor.fullName, actor.role);
    const updatedEncounter = completeEncRes.encounter || encounter;
    updatedEncounter.status = "COMPLETED";
    updatedEncounter.completed_at = nowIso;
    updatedEncounter.ended_at = nowIso;

    // 4. Complete linked Queue Entry if present
    if (encounter.queue_entry_id) {
      const qEntry = QueueStore.getQueueEntryById(encounter.queue_entry_id);
      if (qEntry && qEntry.status !== "COMPLETED") {
        QueueStore.saveQueueEntry({
          ...qEntry,
          status: "COMPLETED",
          completed_at: nowIso,
        });
      }
    }

    // 5. Complete linked Appointment if present
    if (encounter.appointment_id) {
      const apt = AppointmentStore.getAppointmentById(encounter.appointment_id);
      if (apt && apt.status !== "COMPLETED") {
        AppointmentStore.saveAppointment({
          ...apt,
          status: "COMPLETED",
          updated_at: nowIso,
        });
      }
    }

    // Compute duration in minutes
    const startTimeMs = new Date(encounter.started_at).getTime();
    const endTimeMs = new Date(nowIso).getTime();
    const durationMinutes = Math.max(1, Math.round((endTimeMs - startTimeMs) / 60000));

    // Record verified duration for Phase B.3 dynamic waiting time engine
    ConsultationHistoryStore.recordCompletedConsultation({
      doctor_id: encounter.provider_id,
      doctor_name: encounter.provider_name,
      organization_identifier: encounter.organization_id,
      facility_id: encounter.facility_id || "FAC-1001",
      department_id: encounter.department_id || "DEP-CARD-1001",
      department_name: encounter.department_name || "Cardiology OPD",
      date: encounter.started_at.split("T")[0],
      started_at: encounter.started_at,
      completed_at: nowIso,
    });

    // 6. Record Immutable Audit Event
    AuditLedger.recordEvent({
      actor_id: actorId,
      actor_name: actor.fullName,
      action: "CONSULTATION_COMPLETED",
      resource_type: "HEALTHCARE_ENCOUNTER",
      resource_id: encounter.id,
      details: {
        encounter_id: encounter.id,
        patient_id: encounter.patient_id,
        organization_id: encounter.organization_id,
        doctor_id: encounter.provider_id,
        duration_minutes: durationMinutes,
        diagnoses_count: finalDocumentation.diagnoses?.length || 0,
        completed_at: nowIso,
      },
    });

    return {
      success: true,
      encounter: updatedEncounter,
      clinical_record: completeRecordRes.record,
      duration_minutes: durationMinutes,
      message: `Consultation completed successfully for ${encounter.patient_name} (${durationMinutes} min).`,
    };
  }

  /**
   * Amends a completed clinical record with documented reason and version history snapshot.
   */
  public static async amendConsultation(
    encounterId: string,
    amendmentData: {
      chief_complaint?: string;
      symptoms?: ClinicalSymptom[];
      vitals?: ClinicalVitals;
      observations?: string;
      clinical_notes?: string;
      assessment?: string;
      diagnoses?: ClinicalDiagnosis[];
      treatment_plan?: string;
      follow_up_plan?: ClinicalFollowUpPlan;
    },
    reason: string,
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; record?: ClinicalRecord; error?: string }> {
    if (!actor) {
      return { success: false, error: "Authentication required." };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A clinical reason for amendment is required." };
    }

    const actorId = actor.identifier || actor.id;
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Only authorized medical doctors can amend clinical records." };
    }

    const targetRecord = getClinicalRecordByEncounterId(encounterId);
    if (!targetRecord) {
      return { success: false, error: "Clinical record not found for this encounter." };
    }

    const result = amendClinicalRecord({
      recordId: targetRecord.id,
      amendmentReason: reason.trim(),
      chiefComplaint: amendmentData.chief_complaint,
      symptoms: amendmentData.symptoms,
      vitals: amendmentData.vitals,
      observations: amendmentData.observations,
      clinicalNotes: amendmentData.clinical_notes,
      assessment: amendmentData.assessment,
      diagnoses: amendmentData.diagnoses,
      treatmentPlan: amendmentData.treatment_plan,
      followUpPlan: amendmentData.follow_up_plan,
      actorId,
      actorName: actor.fullName,
      actorRole: actor.role,
    });

    if (result.success) {
      AuditLedger.recordEvent({
        actor_id: actorId,
        actor_name: actor.fullName,
        action: "ENCOUNTER_AMENDED",
        resource_type: "CLINICAL_RECORD",
        resource_id: result.record?.id,
        details: {
          encounter_id: encounterId,
          patient_id: result.record?.patient_id,
          organization_id: result.record?.organization_id,
          version: result.record?.version,
          amendment_reason: reason.trim(),
        },
      });
    }

    return result;
  }

  /**
   * Retrieves complete contextual clinical data for a consultation.
   * Enforces patient isolation and authorized clinician context.
   */
  public static getConsultationContext(
    encounterId: string,
    actor: StoredIdentity | null
  ): ConsultationContext | null {
    const encounter = getEncounterById(encounterId);
    if (!encounter) return null;

    // Authorization & Patient Isolation Check
    if (actor && actor.role === "patient") {
      const patientId = actor.identifier || actor.id;
      if (encounter.patient_id !== patientId && encounter.patient_id !== actor.id) {
        return null; // Strict Patient Isolation: Access denied to other patient records
      }
    }

    const clinicalRecord = getClinicalRecordByEncounterId(encounter.id);
    const patient = findIdentityById(encounter.patient_id);
    const allergies = patient?.patientData?.allergies || [];
    const chronicConditions = patient?.patientData?.chronicConditions || [];
    const recentEncounters = getPatientEncounters(encounter.patient_id).filter((e) => e.id !== encounter.id);

    const linkedAppointment = encounter.appointment_id
      ? AppointmentStore.getAppointmentById(encounter.appointment_id) || null
      : null;

    const linkedQueueEntry = encounter.queue_entry_id
      ? QueueStore.getQueueEntryById(encounter.queue_entry_id) || null
      : null;

    // Audit Record Access (Requirement 87 & 88)
    if (actor) {
      const actorId = actor.identifier || actor.id;
      AuditLedger.recordEvent({
        actor_id: actorId,
        actor_name: actor.fullName,
        action: "RECORD_VIEWED",
        resource_type: "HEALTHCARE_ENCOUNTER",
        resource_id: encounter.id,
        details: {
          patient_id: encounter.patient_id,
          organization_id: encounter.organization_id,
          encounter_id: encounter.id,
        },
      });
    }

    return {
      encounter,
      clinical_record: clinicalRecord,
      patient,
      allergies,
      chronic_conditions: chronicConditions,
      recent_encounters: recentEncounters.slice(0, 5), // Recent 5 encounters
      linked_appointment: linkedAppointment,
      linked_queue_entry: linkedQueueEntry,
    };
  }
}
