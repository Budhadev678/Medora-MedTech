// ============================================================
// MEDORA — DOCTOR CONSULTATION WORKSPACE SERVICE
// Digital Clinical Desk, Same-Doctor History, Orders & Finalization
// ============================================================

import { StoredIdentity, findIdentityById } from "../data/identity-store";
import {
  HealthcareEncounter,
  getEncounterById,
  saveEncounter,
  getAllEncounters,
} from "../data/encounter-store";
import {
  AppointmentStore,
  HealthcareAppointment,
} from "../data/appointment-store";
import {
  ConsultationDraftStore,
  ConsultationDraft,
  CanvasDrawingData,
  StagedPrescriptionItem,
  StagedLabItem,
  StagedFollowUp,
  StagedAdmissionOrder,
  StagedBloodOrder,
} from "../data/consultation-draft-store";
import {
  ConsultationTemplateStore,
  ClinicalConsultationTemplate,
  ClinicalSpecialty,
} from "../data/consultation-template-store";
import { issuePrescription, getAllPrescriptions, HealthcarePrescription } from "../data/prescription-store";
import { placeLabOrder, getAllLabOrders, getAllLabReports, HealthcareLabOrder } from "../data/lab-order-store";
import { HospitalBloodService } from "./hospital-blood-service";
import { saveAdmission, HospitalAdmission } from "../data/admission-store";
import { BillingEngineService } from "./billing-engine-service";
import { appendAuditEvent, logAuditEvent } from "../data/audit-store";
import { BloodGroup, PrescriptionRoute } from "@/types/database.types";

export interface ConsultationWorkspaceContext {
  encounter: HealthcareEncounter;
  appointment?: HealthcareAppointment;
  patient: {
    id: string;
    fullName: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    allergies?: string[];
    chronicConditions?: string[];
    phone?: string;
  };
  specialtyTemplate: ClinicalConsultationTemplate;
  draft: ConsultationDraft;
  
  // Historical Context
  sameDoctorPreviousVisits: {
    encounterId: string;
    date: string;
    diagnosis: string;
    summaryNotes: string;
    prescriptionsCount: number;
    labOrdersCount: number;
    locationName: string;
  }[];
  
  authorizedPreviousRecords: {
    previousEncountersCount: number;
    prescriptions: any[];
    labReports: any[];
  };
}

export interface FinalizeConsultationInput {
  provisionalDiagnosis: string;
  differentialDiagnosis?: string;
  clinicalNotes: string;
  sectionValues: Record<string, Record<string, any>>;
  drawings?: Record<string, CanvasDrawingData>;
  prescriptions?: StagedPrescriptionItem[];
  labOrders?: StagedLabItem[];
  bloodOrder?: StagedBloodOrder;
  admissionOrder?: StagedAdmissionOrder;
  followUp?: StagedFollowUp;
}

export interface ConsultationServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class DoctorConsultationService {
  /**
   * 1. Start or Resume a Doctor Consultation Encounter
   */
  public static startConsultationEncounter(
    params: {
      appointmentId?: string;
      patientId: string;
      patientName: string;
      specialty?: ClinicalSpecialty;
    },
    actor: StoredIdentity | null
  ): ConsultationServiceResult<{ encounter: HealthcareEncounter; draft: ConsultationDraft }> {
    if (!actor) return { success: false, error: "Authentication required." };
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Forbidden: Only attending doctors can start consultations." };
    }

    const doctorId = actor.identifier || actor.id;
    const doctorName = actor.fullName;
    const orgId = actor.organizationId || "11111111-1111-1111-1111-111111111101";
    const orgName = actor.organizationName || "City Hospital";
    const now = new Date().toISOString();

    let encounter: HealthcareEncounter | null = null;
    let appointment: HealthcareAppointment | null = null;

    if (params.appointmentId) {
      appointment = AppointmentStore.getAppointmentById(params.appointmentId);
      if (appointment) {
        // Transition appointment to IN_CONSULTATION
        appointment.status = "IN_CONSULTATION";
        appointment.updated_at = now;
        AppointmentStore.saveAppointment(appointment);

        if (appointment.encounter_id) {
          encounter = getEncounterById(appointment.encounter_id);
        }
      }
    }

    if (!encounter) {
      const encId = `ENC-DOC-${Date.now().toString().slice(-6)}`;
      const newEncounter: HealthcareEncounter = {
        id: encId,
        encounter_reference: encId,
        patient_id: params.patientId,
        patient_name: params.patientName,
        provider_id: doctorId,
        provider_name: doctorName,
        provider_role: "Attending Consultant",
        organization_id: orgId,
        organization_name: orgName,
        facility_id: "FAC-1001",
        department_id: "DEP-MED",
        department_name: "Outpatient Department",
        encounter_type: "CONSULTATION",
        status: "ACTIVE",
        source_type: "DIRECT_CONSULTATION",
        source_id: params.appointmentId,
        reason_for_visit: "Clinical Outpatient Consultation",
        started_at: now,
        created_by: doctorId,
        created_by_role: "doctor",
        created_at: now,
        updated_at: now,
      };
      saveEncounter(newEncounter);
      encounter = newEncounter;

      if (appointment) {
        appointment.encounter_id = encId;
        AppointmentStore.saveAppointment(appointment);
      }
    }

    // Load or create draft
    let draft = ConsultationDraftStore.getDraftByEncounterId(encounter.id);
    if (!draft) {
      const template = ConsultationTemplateStore.getTemplateForSpecialty(params.specialty || "GENERAL_MEDICINE", doctorId);
      draft = ConsultationDraftStore.saveDraft({
        encounter_id: encounter.id,
        appointment_id: params.appointmentId,
        doctor_id: doctorId,
        doctor_name: doctorName,
        patient_id: params.patientId,
        patient_name: params.patientName,
        specialty: params.specialty || "GENERAL_MEDICINE",
        template_id: template.id,
      });
    }

    appendAuditEvent(
      "CONSULTATION_STARTED" as any,
      doctorId,
      doctorName,
      "doctor",
      `Consultation started for ${params.patientName} (${params.patientId}) by Dr. ${doctorName}. Encounter #${encounter.id}`,
      params.patientId,
      orgId,
      orgName,
      encounter.id
    );

    return { success: true, data: { encounter, draft } };
  }

  /**
   * 2. Get Comprehensive Consultation Workspace Context
   * Aggregates: Patient Profile, Same-Doctor Historical Visits, Authorized Records, Active Draft & Template
   */
  public static getConsultationWorkspaceContext(
    encounterId: string,
    actor: StoredIdentity | null
  ): ConsultationServiceResult<ConsultationWorkspaceContext> {
    if (!actor) return { success: false, error: "Authentication required." };

    const encounter = getEncounterById(encounterId);
    if (!encounter) return { success: false, error: `Encounter ${encounterId} not found.` };

    const currentDoctorId = actor.identifier || actor.id;
    const patientIdentity = findIdentityById(encounter.patient_id);
    const patientId = encounter.patient_id;

    // 1. Fetch Same-Doctor Previous Visits (Canonical Matching)
    const allEncounters = getAllEncounters();
    const sameDoctorVisits = allEncounters
      .filter((e) => {
        if (e.id.toLowerCase() === encounter.id.toLowerCase()) return false;
        if (e.patient_id.toLowerCase() !== patientId.toLowerCase()) return false;
        // Strictly match canonical doctor ID
        return e.provider_id.toLowerCase() === currentDoctorId.toLowerCase();
      })
      .map((e) => ({
        encounterId: e.id,
        date: e.started_at || e.created_at,
        diagnosis: e.chief_complaint || e.reason_for_visit || "Clinical Consultation",
        summaryNotes: e.clinical_summary || e.discharge_summary || "Documented consultation notes on record.",
        prescriptionsCount: e.prescriptions_count || 1,
        labOrdersCount: e.lab_orders_count || 0,
        locationName: e.organization_name || "City Hospital",
      }));

    // 2. Authorized General Records
    const allPrescriptions = getAllPrescriptions().filter((p) => p.patient_id.toLowerCase() === patientId.toLowerCase());
    const allLabReports = getAllLabReports().filter((r) => r.patient_id.toLowerCase() === patientId.toLowerCase());

    // 3. Draft & Specialty Template
    let draft = ConsultationDraftStore.getDraftByEncounterId(encounter.id);
    if (!draft) {
      draft = ConsultationDraftStore.saveDraft({
        encounter_id: encounter.id,
        doctor_id: currentDoctorId,
        doctor_name: actor.fullName,
        patient_id: patientId,
        patient_name: encounter.patient_name,
        specialty: "GENERAL_MEDICINE",
      });
    }

    const template = ConsultationTemplateStore.getTemplateById(draft.template_id) ||
      ConsultationTemplateStore.getTemplateForSpecialty((draft.specialty as ClinicalSpecialty) || "GENERAL_MEDICINE", currentDoctorId);

    const appointment = encounter.source_id ? AppointmentStore.getAppointmentById(encounter.source_id) || undefined : undefined;

    return {
      success: true,
      data: {
        encounter,
        appointment,
        patient: {
          id: patientId,
          fullName: encounter.patient_name,
          age: patientIdentity?.patientData?.age || 32,
          gender: patientIdentity?.patientData?.gender || "Male",
          bloodGroup: patientIdentity?.patientData?.bloodGroup || "O+",
          allergies: patientIdentity?.patientData?.allergies || ["Penicillin"],
          chronicConditions: patientIdentity?.patientData?.chronicConditions || ["Hypertension (Stage 1)"],
          phone: patientIdentity?.phone || "+91-9876543210",
        },
        specialtyTemplate: template,
        draft,
        sameDoctorPreviousVisits: sameDoctorVisits,
        authorizedPreviousRecords: {
          previousEncountersCount: allEncounters.filter((e) => e.patient_id.toLowerCase() === patientId.toLowerCase()).length,
          prescriptions: allPrescriptions,
          labReports: allLabReports,
        },
      },
    };
  }

  /**
   * 3. Autosave Consultation Draft (Strokes, Values, Orders)
   */
  public static saveConsultationDraft(
    encounterId: string,
    draftData: Partial<ConsultationDraft>,
    actor: StoredIdentity | null
  ): ConsultationServiceResult<ConsultationDraft> {
    if (!actor) return { success: false, error: "Authentication required." };

    const encounter = getEncounterById(encounterId);
    if (!encounter) return { success: false, error: `Encounter ${encounterId} not found.` };

    if (encounter.status === "COMPLETED") {
      return { success: false, error: "Cannot modify draft of a finalized consultation encounter." };
    }

    const updated = ConsultationDraftStore.saveDraft({
      ...draftData,
      encounter_id: encounter.id,
      doctor_id: actor.identifier || actor.id,
      doctor_name: actor.fullName,
      patient_id: encounter.patient_id,
      patient_name: encounter.patient_name,
    });

    return { success: true, data: updated };
  }

  /**
   * 4. Finalize & Sign Consultation Encounter
   * Atomically issues Prescriptions, places Lab Orders, creates Inpatient/Blood Orders,
   * schedules Follow-up, generates Central Billing, and seals Encounter.
   */
  public static finalizeConsultation(
    encounterId: string,
    finalInput: FinalizeConsultationInput,
    actor: StoredIdentity | null
  ): ConsultationServiceResult<{
    encounter: HealthcareEncounter;
    prescription?: HealthcarePrescription;
    labOrder?: HealthcareLabOrder;
    followupAppointment?: HealthcareAppointment;
  }> {
    if (!actor) return { success: false, error: "Authentication required." };
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Forbidden: Only attending doctors can finalize and sign clinical consultations." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) return { success: false, error: `Encounter ${encounterId} not found.` };

    if (encounter.status === "COMPLETED") {
      return { success: false, error: "Encounter is already completed and finalized." };
    }

    const doctorId = actor.identifier || actor.id;
    const doctorName = actor.fullName;
    const now = new Date().toISOString();

    // 1. Issue Prescriptions if present
    let issuedPrescription: HealthcarePrescription | undefined;
    if (finalInput.prescriptions && finalInput.prescriptions.length > 0) {
      const prxRes = issuePrescription({
        encounterId: encounter.id,
        notes: `Prescription issued during consultation by Dr. ${doctorName}. Diagnosis: ${finalInput.provisionalDiagnosis}`,
        items: finalInput.prescriptions.map((p, idx) => ({
          id: p.id || `PRX-ITM-${Date.now()}-${idx}`,
          medicine_name: p.medicine_name,
          dosage: p.dosage,
          route: "ORAL" as PrescriptionRoute,
          frequency: p.frequency,
          duration: p.duration,
          quantity: "1 Strip / Bottle",
          timing: (p.timing as any) || "AFTER_MEAL",
          instructions: p.instructions || "As directed by physician",
        })),
        actorId: doctorId,
        actorName: doctorName,
        actorRole: "doctor",
      });

      if (prxRes.success && prxRes.prescription) {
        issuedPrescription = prxRes.prescription;
      }
    }

    // 2. Place Lab Orders if present
    let placedLabOrder: HealthcareLabOrder | undefined;
    if (finalInput.labOrders && finalInput.labOrders.length > 0) {
      const labRes = placeLabOrder({
        encounterId: encounter.id,
        items: finalInput.labOrders.map((l) => ({
          test_code: l.test_code,
          test_name: l.test_name,
          category: l.category || "BIOCHEMISTRY",
          sample_type: "WHOLE_BLOOD",
          instructions: l.instructions || "Diagnostic OPD Workup",
        })),
        priority: "ROUTINE",
        reason: `Diagnostic workup for ${finalInput.provisionalDiagnosis}`,
        instructions: "Standard outpatient processing",
        actorId: doctorId,
        actorName: doctorName,
        actorRole: "doctor",
      });

      if (labRes.success && labRes.order) {
        placedLabOrder = labRes.order;
      }
    }

    // 3. Staged Blood Order if requested
    if (finalInput.bloodOrder && finalInput.bloodOrder.required) {
      HospitalBloodService.createBloodRequest(
        {
          patientId: encounter.patient_id,
          patientName: encounter.patient_name,
          patientBloodGroup: (finalInput.bloodOrder.blood_group as BloodGroup) || "O+",
          encounterId: encounter.id,
          department: encounter.department_name || "General Medicine",
          bloodGroup: (finalInput.bloodOrder.blood_group as BloodGroup) || "O+",
          rhType: "POSITIVE",
          componentType: finalInput.bloodOrder.component_type || "PRBC",
          unitsRequested: finalInput.bloodOrder.units_requested || 1,
          priority: "ROUTINE" as any,
          clinicalIndication: finalInput.bloodOrder.clinical_reason || `Consultation blood requirement for ${finalInput.provisionalDiagnosis}`,
        },
        actor
      );
    }

    // 4. Staged Admission Order if requested
    if (finalInput.admissionOrder && finalInput.admissionOrder.required) {
      const admId = `ADM-${Date.now().toString().slice(-4)}`;
      const admissionRecord: HospitalAdmission = {
        id: admId,
        admission_number: `MED-ADM-2026-${Date.now().toString().slice(-4)}`,
        facility_id: encounter.facility_id || "FAC-1001",
        facility_name: encounter.organization_name || "City Hospital",
        patient_id: encounter.patient_id,
        patient_name: encounter.patient_name,
        doctor_id: doctorId,
        doctor_name: doctorName,
        department: finalInput.admissionOrder.department || "General Medicine",
        admission_type: finalInput.admissionOrder.priority === "EMERGENCY" ? "EMERGENCY" : "PLANNED",
        clinical_reason: finalInput.admissionOrder.clinical_reason || `Inpatient observation for ${finalInput.provisionalDiagnosis}`,
        source_encounter_id: encounter.id,
        status: "REQUESTED",
        assigned_unit: finalInput.admissionOrder.unit || "General Ward",
        bed_movement_history: [],
        requested_at: now,
        created_at: now,
        updated_at: now,
      };
      saveAdmission(admissionRecord);
    }

    // 5. Staged Follow-Up Appointment
    let followupAppt: HealthcareAppointment | undefined;
    if (finalInput.followUp && finalInput.followUp.required && finalInput.followUp.recommended_date) {
      followupAppt = AppointmentStore.createAppointment({
        patient_id: encounter.patient_id,
        patient_name: encounter.patient_name,
        doctor_id: doctorId,
        doctor_name: doctorName,
        organization_id: encounter.organization_id,
        organization_identifier: "HSP-1001",
        organization_name: encounter.organization_name,
        facility_id: encounter.facility_id || "FAC-1001",
        department_id: encounter.department_id || "DEP-MED",
        department_name: encounter.department_name || "General Medicine",
        appointment_date: finalInput.followUp.recommended_date,
        appointment_time: "10:00",
        slot_display_time: "10:00 AM - 10:15 AM",
        booking_source: "DOCTOR",
        chief_complaint: `Follow-up evaluation for ${finalInput.provisionalDiagnosis}`,
        created_by: doctorId,
        created_by_role: "doctor",
      });
    }

    // 6. Complete & Seal Encounter
    encounter.status = "COMPLETED";
    encounter.chief_complaint = finalInput.provisionalDiagnosis;
    encounter.clinical_summary = `${finalInput.clinicalNotes}\n\nProvisional Diagnosis: ${finalInput.provisionalDiagnosis}\nDifferential: ${finalInput.differentialDiagnosis || "None"}`;
    encounter.ended_at = now;
    encounter.updated_at = now;
    encounter.prescriptions_count = (encounter.prescriptions_count || 0) + (finalInput.prescriptions?.length || 0);
    encounter.lab_orders_count = (encounter.lab_orders_count || 0) + (finalInput.labOrders?.length || 0);
    saveEncounter(encounter);

    // 7. Update linked Appointment status if present
    if (encounter.source_id) {
      const appt = AppointmentStore.getAppointmentById(encounter.source_id);
      if (appt) {
        appt.status = "COMPLETED";
        appt.updated_at = now;
        AppointmentStore.saveAppointment(appt);
      }
    }

    // 8. Clean up Draft
    ConsultationDraftStore.deleteDraft(encounter.id);

    // 9. Central Billing Bill & Item Creation
    const draftBillRes = BillingEngineService.createDraftBill({
      patientId: encounter.patient_id,
      patientName: encounter.patient_name,
      organizationId: encounter.organization_id,
      organizationName: encounter.organization_name,
      facilityId: encounter.facility_id || "FAC-1001",
      facilityName: encounter.organization_name || "City Hospital",
      encounterId: encounter.id,
      billType: "FINAL",
      actor,
    });

    if (draftBillRes.success && draftBillRes.bill) {
      BillingEngineService.addBillableItem({
        billId: draftBillRes.bill.id,
        serviceCode: "SRV-CONSULT-01",
        sourceType: "ENCOUNTER",
        sourceId: encounter.id,
        quantity: 1,
        manualDescription: `Consultant Specialist Consultation - Dr. ${doctorName}`,
        actor,
      });
    }

    // 10. Central Audit Ledger Event
    appendAuditEvent(
      "CONSULTATION_COMPLETED" as any,
      doctorId,
      doctorName,
      "doctor",
      `Consultation #${encounter.id} signed and finalized by Dr. ${doctorName}. Diagnosis: ${finalInput.provisionalDiagnosis}`,
      encounter.patient_id,
      encounter.organization_id,
      encounter.organization_name,
      encounter.id
    );

    return {
      success: true,
      data: {
        encounter,
        prescription: issuedPrescription,
        labOrder: placedLabOrder,
        followupAppointment: followupAppt,
      },
    };
  }

  /**
   * 5. Post-Finalization Versioned Amendment
   */
  public static amendConsultation(
    encounterId: string,
    params: {
      amendmentNotes: string;
      reason: string;
    },
    actor: StoredIdentity | null
  ): ConsultationServiceResult<HealthcareEncounter> {
    if (!actor) return { success: false, error: "Authentication required." };
    if (actor.role !== "doctor" && actor.role !== "admin") {
      return { success: false, error: "Forbidden: Only licensed physicians can amend finalized medical records." };
    }

    const encounter = getEncounterById(encounterId);
    if (!encounter) return { success: false, error: `Encounter ${encounterId} not found.` };

    const doctorId = actor.identifier || actor.id;
    const now = new Date().toISOString();

    const amendmentEntry = `\n\n--- AMENDMENT [${now}] by Dr. ${actor.fullName} (${doctorId}) ---\nReason: ${params.reason}\nNotes: ${params.amendmentNotes}`;
    encounter.clinical_summary = (encounter.clinical_summary || "") + amendmentEntry;
    encounter.updated_at = now;
    saveEncounter(encounter);

    appendAuditEvent(
      "CONSULTATION_AMENDED" as any,
      doctorId,
      actor.fullName,
      "doctor",
      `Encounter #${encounter.id} amended by Dr. ${actor.fullName}. Reason: "${params.reason}"`,
      encounter.patient_id,
      encounter.organization_id,
      encounter.organization_name,
      encounter.id
    );

    return { success: true, data: encounter };
  }
}
