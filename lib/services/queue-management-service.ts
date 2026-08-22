// ============================================================
// MEDORA — QUEUE & CHECK-IN ENGINE SERVICE
// MODIFICATION PHASE B.2
// ============================================================

import {
  QueueEntry,
  QueueStatus,
  CheckInRequest,
  CheckInResult,
  QueuePositionInfo,
  DoctorQueueSummary,
  QueueActionResult,
} from "@/types/database.types";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { ConsultationHistoryStore } from "@/lib/data/consultation-history-store";
import { StoredIdentity, findIdentityById } from "@/lib/data/identity-store";
import { AuditLedger } from "@/lib/data/audit-store";

export class QueueManagementService {
  /**
   * Executes authoritative patient check-in for a booked appointment.
   * Validates date, facility, session, and status; generates a deterministic
   * sequential token and enters the patient into the active waiting queue.
   */
  public static async checkInAppointment(
    request: CheckInRequest,
    actor: StoredIdentity | null
  ): Promise<CheckInResult> {
    const todayStr = getTodayDateStr();
    const nowIso = new Date().toISOString();

    // 1. Authorization Verification (Phase A.3)
    if (!actor) {
      return {
        success: false,
        error_code: "UNAUTHORIZED",
        message: "Authentication required to perform patient check-in.",
      };
    }

    // Patient Self Check-in verification
    if (actor.role === "patient") {
      const isSelf =
        actor.id === request.patient_id ||
        actor.identifier === request.patient_id ||
        actor.email === request.patient_id;
      if (!isSelf) {
        return {
          success: false,
          error_code: "UNAUTHORIZED",
          message: "Patients cannot check in on behalf of other accounts.",
        };
      }
    }

    // 2. Validate Appointment
    if (!request.appointment_id) {
      return {
        success: false,
        error_code: "INVALID_APPOINTMENT",
        message: "Appointment ID is required for scheduled appointment check-in.",
      };
    }

    const appointment = AppointmentStore.getAppointmentById(request.appointment_id);
    if (!appointment) {
      return {
        success: false,
        error_code: "INVALID_APPOINTMENT",
        message: "Appointment record not found in system.",
      };
    }

    if (
      actor.role === "patient" &&
      appointment.patient_id !== actor.id &&
      appointment.patient_id !== actor.identifier &&
      appointment.patient_id !== actor.email
    ) {
      return {
        success: false,
        error_code: "UNAUTHORIZED",
        message: "You cannot check in for an appointment that belongs to another patient.",
      };
    }

    // 3. Validate Status Constraints
    if (appointment.status === "CANCELLED") {
      return {
        success: false,
        error_code: "APPOINTMENT_CANCELLED",
        message: "Cancelled appointments cannot be checked in.",
      };
    }

    if (appointment.status === "COMPLETED") {
      return {
        success: false,
        error_code: "INVALID_APPOINTMENT",
        message: "This consultation has already been completed.",
      };
    }

    if (appointment.status === "NO_SHOW") {
      return {
        success: false,
        error_code: "INVALID_APPOINTMENT",
        message: "Appointment was marked as No-Show. Operational staff assistance required.",
      };
    }

    // 4. Validate Date Constraints (No wrong-day check-in)
    const checkinDate = request.date || todayStr;
    if (appointment.appointment_date !== checkinDate) {
      return {
        success: false,
        error_code: "WRONG_DATE",
        message: `This appointment is not scheduled for today (Scheduled: ${appointment.appointment_date}).`,
      };
    }

    // 5. Validate Facility & Organization Matching
    if (
      request.organization_identifier &&
      appointment.organization_identifier !== request.organization_identifier
    ) {
      return {
        success: false,
        error_code: "WRONG_FACILITY",
        message: `Appointment is registered at ${appointment.organization_name}, not ${request.organization_identifier}.`,
      };
    }

    // 6. Idempotency & Duplicate Check-in Protection
    const existingQueueEntry = QueueStore.getQueueEntryByAppointmentId(appointment.id);
    if (existingQueueEntry) {
      const activeStatuses: QueueStatus[] = ["WAITING", "CALLED", "IN_CONSULTATION"];
      if (activeStatuses.includes(existingQueueEntry.status)) {
        const positionInfo = this.getQueuePosition(existingQueueEntry.id);
        return {
          success: true,
          queue_entry: existingQueueEntry,
          position_info: positionInfo,
          message: `You are already checked in with Token #${existingQueueEntry.token_number}.`,
        };
      } else if (existingQueueEntry.status === "COMPLETED") {
        return {
          success: false,
          error_code: "INVALID_APPOINTMENT",
          message: "This consultation has already been completed.",
        };
      }
    }

    // 7. Atomic Server-Side Token Generation
    const session = AppointmentStore.getSessionById(appointment.session_id);
    const { tokenNumber, sequenceNumber } = QueueStore.getNextToken(
      appointment.organization_identifier,
      appointment.facility_id,
      appointment.department_id,
      appointment.doctor_id,
      appointment.session_id,
      checkinDate,
      appointment.doctor_name
    );

    // 8. Create Queue Entry Record
    const queueId = `q-${Math.floor(1000 + Math.random() * 9000)}`;
    const queueNo = `QUE-${1000 + QueueStore.getAllQueueEntries().length + 1}`;

    const newQueueEntry: QueueEntry = {
      id: queueId,
      queue_no: queueNo,
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      patient_name: appointment.patient_name,
      patient_phone: appointment.patient_phone,
      doctor_id: appointment.doctor_id,
      doctor_name: appointment.doctor_name,
      organization_id: appointment.organization_id,
      organization_identifier: appointment.organization_identifier,
      organization_name: appointment.organization_name,
      facility_id: appointment.facility_id,
      department_id: appointment.department_id,
      department_name: appointment.department_name,
      session_id: appointment.session_id,
      date: checkinDate,
      token_number: tokenNumber,
      token_sequence: sequenceNumber,
      source: "APPOINTMENT",
      checkin_source: request.checkin_source || (actor.role === "patient" ? "PATIENT_SELF" : "RECEPTIONIST"),
      status: "WAITING",
      room_number: session?.room_number || appointment.opd_room || "Room 102",
      priority_flag: request.priority_flag || false,
      priority_reason: request.priority_reason,
      checked_in_at: nowIso,
      created_at: nowIso,
    };

    const savedQueueEntry = QueueStore.saveQueueEntry(newQueueEntry);

    // 9. Update Parent Appointment Status to CHECKED_IN
    const updatedAppointment = {
      ...appointment,
      status: "CHECKED_IN" as const,
      token_number: tokenNumber,
      updated_at: nowIso,
    };
    AppointmentStore.saveAppointment(updatedAppointment);

    // 10. Record Immutable Audit Event
    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "CHECK_IN" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: savedQueueEntry.id,
      details: {
        token: tokenNumber,
        sequence: sequenceNumber,
        appointment_no: appointment.appointment_no,
        doctor: appointment.doctor_name,
        facility: appointment.organization_name,
        source: savedQueueEntry.checkin_source,
      },
    });

    const positionInfo = this.getQueuePosition(savedQueueEntry.id);

    return {
      success: true,
      queue_entry: savedQueueEntry,
      position_info: positionInfo,
      message: `Check-in confirmed! Token #${tokenNumber} issued for ${appointment.doctor_name}.`,
    };
  }

  /**
   * Registers a walk-in patient directly into the doctor's active queue.
   * Enforces B.1 session capacity limits (walk-ins cannot silently exceed capacity).
   */
  public static async createWalkInQueueEntry(
    request: CheckInRequest,
    actor: StoredIdentity | null
  ): Promise<CheckInResult> {
    const todayStr = getTodayDateStr();
    const nowIso = new Date().toISOString();

    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    if (!["staff", "receptionist" as any, "hospital_admin", "admin", "doctor"].includes(actor.role)) {
      return {
        success: false,
        error_code: "UNAUTHORIZED",
        message: "Only healthcare facility staff can register walk-in patients.",
      };
    }

    if (!request.session_id) {
      return { success: false, error_code: "INVALID_APPOINTMENT", message: "Doctor working session ID is required for walk-in." };
    }

    const session = AppointmentStore.getSessionById(request.session_id);
    if (!session) {
      return { success: false, error_code: "INVALID_APPOINTMENT", message: "Doctor working session not found." };
    }

    const checkinDate = request.date || todayStr;

    // Enforce B.1 Capacity Check for Walk-ins
    const existingQueue = QueueStore.getQueueForSession(request.session_id, checkinDate);
    const existingAppointments = AppointmentStore.getAppointmentsForSessionDate(request.session_id, checkinDate);
    const totalActiveCount = Math.max(existingQueue.length, existingAppointments.length);

    if (totalActiveCount >= session.capacity && !request.priority_flag) {
      return {
        success: false,
        error_code: "CAPACITY_EXCEEDED",
        message: `Doctor session capacity (${session.capacity} patients) reached for today. Walk-in registration cannot exceed configured capacity.`,
      };
    }

    const patientIdentity = findIdentityById(request.patient_id);
    const patientName = patientIdentity?.fullName || "Walk-in Patient";
    const patientPhone = patientIdentity?.phone || "+91 98765 00000";

    const { tokenNumber, sequenceNumber } = QueueStore.getNextToken(
      session.organization_identifier,
      session.facility_id,
      session.department_id,
      session.doctor_id,
      session.id,
      checkinDate,
      session.doctor_name
    );

    const queueId = `q-${Math.floor(1000 + Math.random() * 9000)}`;
    const queueNo = `QUE-${1000 + QueueStore.getAllQueueEntries().length + 1}`;

    const newQueueEntry: QueueEntry = {
      id: queueId,
      queue_no: queueNo,
      patient_id: request.patient_id,
      patient_name: patientName,
      patient_phone: patientPhone,
      doctor_id: session.doctor_id,
      doctor_name: session.doctor_name,
      organization_id: session.organization_id,
      organization_identifier: session.organization_identifier,
      organization_name: session.organization_name,
      facility_id: session.facility_id,
      department_id: session.department_id,
      department_name: session.department_name,
      session_id: session.id,
      date: checkinDate,
      token_number: tokenNumber,
      token_sequence: sequenceNumber,
      source: "WALK_IN",
      checkin_source: request.checkin_source || "RECEPTIONIST",
      status: "WAITING",
      room_number: session.room_number || "Room 102",
      priority_flag: request.priority_flag || false,
      priority_reason: request.priority_reason,
      notes: request.reason_for_visit || "Walk-in OPD Consultation",
      checked_in_at: nowIso,
      created_at: nowIso,
    };

    const saved = QueueStore.saveQueueEntry(newQueueEntry);

    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "WALK_IN_REGISTERED" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: saved.id,
      details: {
        token: tokenNumber,
        sequence: sequenceNumber,
        doctor: session.doctor_name,
        facility: session.organization_name,
      },
    });

    const posInfo = this.getQueuePosition(saved.id);

    return {
      success: true,
      queue_entry: saved,
      position_info: posInfo,
      message: `Walk-in registered. Token #${tokenNumber} issued for ${session.doctor_name}.`,
    };
  }

  /**
   * Calls the next eligible WAITING patient in sequence for a doctor session.
   * Concurrency safe: Prevents double-calling or race conditions.
   */
  public static async callNextPatient(
    queueContext: { doctor_id: string; session_id: string; date?: string },
    actor: StoredIdentity | null
  ): Promise<QueueActionResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const targetDate = queueContext.date || getTodayDateStr();
    const queue = QueueStore.getQueueForSession(queueContext.session_id, targetDate);

    // Find next eligible WAITING patient in sequential order
    const nextWaiting = queue.find((q) => q.status === "WAITING");
    if (!nextWaiting) {
      return {
        success: false,
        error_code: "NO_PATIENTS_WAITING",
        message: "No patients are currently waiting in the active queue.",
      };
    }

    const nowIso = new Date().toISOString();
    const updated: QueueEntry = {
      ...nextWaiting,
      status: "CALLED",
      called_at: nowIso,
    };

    const saved = QueueStore.saveQueueEntry(updated);

    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "CALL_PATIENT" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: saved.id,
      details: {
        token: saved.token_number,
        patient: saved.patient_name,
        doctor: saved.doctor_name,
        called_at: nowIso,
      },
    });

    return {
      success: true,
      queue_entry: saved,
      message: `Token #${saved.token_number} (${saved.patient_name}) has been called to ${saved.room_number || "OPD Room"}.`,
    };
  }

  /**
   * Calls a specific patient queue entry directly.
   */
  public static async callPatient(
    queueEntryId: string,
    actor: StoredIdentity | null
  ): Promise<QueueActionResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return { success: false, error_code: "NOT_FOUND", message: "Queue entry not found." };
    }

    const nowIso = new Date().toISOString();
    const updated: QueueEntry = {
      ...entry,
      status: "CALLED",
      called_at: nowIso,
    };

    const saved = QueueStore.saveQueueEntry(updated);

    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "CALL_PATIENT" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: saved.id,
      details: {
        token: saved.token_number,
        patient: saved.patient_name,
        doctor: saved.doctor_name,
        called_at: nowIso,
      },
    });

    return {
      success: true,
      queue_entry: saved,
      message: `Token #${saved.token_number} (${saved.patient_name}) has been called to ${saved.room_number || "OPD Room"}.`,
    };
  }

  /**
   * Recalls a previously SKIPPED or CALLED patient back to CALLED or WAITING status.
   */
  public static async recallPatient(
    queueEntryId: string,
    actor: StoredIdentity | null
  ): Promise<QueueActionResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return { success: false, error_code: "NOT_FOUND", message: "Queue entry not found." };
    }

    if (entry.status !== "SKIPPED" && entry.status !== "CALLED") {
      return {
        success: false,
        error_code: "INVALID_STATE",
        message: `Cannot recall patient in status ${entry.status}.`,
      };
    }

    const nowIso = new Date().toISOString();
    const updated: QueueEntry = {
      ...entry,
      status: "CALLED",
      called_at: nowIso,
      recalled_at: nowIso,
    };

    const saved = QueueStore.saveQueueEntry(updated);

    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "RECALL_PATIENT" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: saved.id,
      details: {
        token: saved.token_number,
        patient: saved.patient_name,
        doctor: saved.doctor_name,
      },
    });

    return {
      success: true,
      queue_entry: saved,
      message: `Token #${saved.token_number} (${saved.patient_name}) recalled to ${saved.room_number || "OPD Room"}.`,
    };
  }

  /**
   * Starts consultation for a CALLED or WAITING patient.
   * Exclusivity Constraint: Enforces that a doctor cannot have multiple active
   * patients IN_CONSULTATION simultaneously.
   */
  public static async startConsultation(
    queueEntryId: string,
    actor: StoredIdentity | null
  ): Promise<QueueActionResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return { success: false, error_code: "NOT_FOUND", message: "Queue entry not found." };
    }

    if (entry.status !== "CALLED" && entry.status !== "WAITING") {
      return {
        success: false,
        error_code: "INVALID_STATE",
        message: `Cannot start consultation for patient in status ${entry.status}.`,
      };
    }

    // Exclusivity Check: Ensure no other patient is currently IN_CONSULTATION for this doctor
    const doctorQueue = QueueStore.getQueueForDoctor(entry.doctor_id, entry.organization_identifier, entry.date);
    const activeConsultation = doctorQueue.find((q) => q.status === "IN_CONSULTATION" && q.id !== entry.id);

    if (activeConsultation) {
      return {
        success: false,
        error_code: "CONSULTATION_IN_PROGRESS",
        message: `Doctor already has an active patient (Token #${activeConsultation.token_number}) in consultation. Please complete the current session first.`,
      };
    }

    const nowIso = new Date().toISOString();
    const updated: QueueEntry = {
      ...entry,
      status: "IN_CONSULTATION",
      consultation_started_at: nowIso,
    };

    const saved = QueueStore.saveQueueEntry(updated);

    // Update linked appointment if present
    if (entry.appointment_id) {
      const apt = AppointmentStore.getAppointmentById(entry.appointment_id);
      if (apt) {
        AppointmentStore.saveAppointment({
          ...apt,
          status: "IN_CONSULTATION" as any,
          updated_at: nowIso,
        });
      }
    }

    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "START_CONSULTATION" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: saved.id,
      details: {
        token: saved.token_number,
        patient: saved.patient_name,
        doctor: saved.doctor_name,
        started_at: nowIso,
      },
    });

    return {
      success: true,
      queue_entry: saved,
      message: `Consultation started for Token #${saved.token_number} (${saved.patient_name}).`,
    };
  }

  /**
   * Completes a consultation, recording final timestamps for Phase B.3 and freeing the doctor's desk.
   */
  public static async completeConsultation(
    queueEntryId: string,
    actor: StoredIdentity | null
  ): Promise<QueueActionResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return { success: false, error_code: "NOT_FOUND", message: "Queue entry not found." };
    }

    if (entry.status !== "IN_CONSULTATION" && entry.status !== "CALLED") {
      return {
        success: false,
        error_code: "INVALID_STATE",
        message: `Cannot complete patient in status ${entry.status}.`,
      };
    }

    const nowIso = new Date().toISOString();
    const updated: QueueEntry = {
      ...entry,
      status: "COMPLETED",
      completed_at: nowIso,
    };

    const saved = QueueStore.saveQueueEntry(updated);

    // Update linked appointment if present
    if (entry.appointment_id) {
      const apt = AppointmentStore.getAppointmentById(entry.appointment_id);
      if (apt) {
        AppointmentStore.saveAppointment({
          ...apt,
          status: "COMPLETED",
          updated_at: nowIso,
        });
      }
    }

    // Record verified duration for Phase B.3 dynamic waiting time engine
    if (entry.consultation_started_at) {
      ConsultationHistoryStore.recordCompletedConsultation({
        doctor_id: entry.doctor_id,
        doctor_name: entry.doctor_name,
        organization_identifier: entry.organization_identifier,
        facility_id: entry.facility_id,
        department_id: entry.department_id,
        department_name: entry.department_name,
        date: entry.date,
        started_at: entry.consultation_started_at,
        completed_at: nowIso,
      });
    }

    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "COMPLETE_CONSULTATION" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: saved.id,
      details: {
        token: saved.token_number,
        patient: saved.patient_name,
        doctor: saved.doctor_name,
        completed_at: nowIso,
      },
    });

    const encounterId = `ENC-${saved.id.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      success: true,
      queue_entry: saved,
      encounter_id: encounterId,
      message: `Consultation completed for Token #${saved.token_number}. Patient removed from active queue.`,
    };
  }

  /**
   * Skips a called or waiting patient who does not respond when called.
   */
  public static async skipPatient(
    queueEntryId: string,
    actor: StoredIdentity | null,
    reason?: string
  ): Promise<QueueActionResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return { success: false, error_code: "NOT_FOUND", message: "Queue entry not found." };
    }

    if (entry.status !== "CALLED" && entry.status !== "WAITING") {
      return {
        success: false,
        error_code: "INVALID_STATE",
        message: `Cannot skip patient in status ${entry.status}.`,
      };
    }

    const nowIso = new Date().toISOString();
    const updated: QueueEntry = {
      ...entry,
      status: "SKIPPED",
      skipped_at: nowIso,
      notes: reason || "Patient did not respond when token called",
    };

    const saved = QueueStore.saveQueueEntry(updated);

    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "SKIP_PATIENT" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: saved.id,
      details: {
        token: saved.token_number,
        patient: saved.patient_name,
        reason: updated.notes,
      },
    });

    return {
      success: true,
      queue_entry: saved,
      message: `Token #${saved.token_number} (${saved.patient_name}) moved to skipped list.`,
    };
  }

  /**
   * Marks a patient as NO_SHOW based on operational hospital determination.
   */
  public static async markNoShow(
    queueEntryId: string,
    actor: StoredIdentity | null,
    reason?: string
  ): Promise<QueueActionResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return { success: false, error_code: "NOT_FOUND", message: "Queue entry not found." };
    }

    const nowIso = new Date().toISOString();
    const updated: QueueEntry = {
      ...entry,
      status: "NO_SHOW",
      no_show_at: nowIso,
      notes: reason || "Patient did not attend session",
    };

    const saved = QueueStore.saveQueueEntry(updated);

    if (entry.appointment_id) {
      const apt = AppointmentStore.getAppointmentById(entry.appointment_id);
      if (apt) {
        AppointmentStore.saveAppointment({
          ...apt,
          status: "NO_SHOW",
          updated_at: nowIso,
        });
      }
    }

    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "MARK_NO_SHOW" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: saved.id,
      details: {
        token: saved.token_number,
        patient: saved.patient_name,
      },
    });

    return {
      success: true,
      queue_entry: saved,
      message: `Token #${saved.token_number} marked as No-Show.`,
    };
  }

  /**
   * Cancels a checked-in queue entry before consultation begins.
   */
  public static async cancelQueueEntry(
    queueEntryId: string,
    actor: StoredIdentity | null,
    reason?: string
  ): Promise<QueueActionResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return { success: false, error_code: "NOT_FOUND", message: "Queue entry not found." };
    }

    if (entry.status === "COMPLETED" || entry.status === "IN_CONSULTATION") {
      return {
        success: false,
        error_code: "INVALID_STATE",
        message: "Cannot cancel a consultation that has already started or completed.",
      };
    }

    const nowIso = new Date().toISOString();
    const updated: QueueEntry = {
      ...entry,
      status: "CANCELLED",
      cancelled_at: nowIso,
      cancellation_reason: reason || "Cancelled by user request",
    };

    const saved = QueueStore.saveQueueEntry(updated);

    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "CANCEL_QUEUE" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: saved.id,
      details: {
        token: saved.token_number,
        patient: saved.patient_name,
        reason: updated.cancellation_reason,
      },
    });

    return {
      success: true,
      queue_entry: saved,
      message: `Queue entry for Token #${saved.token_number} has been cancelled.`,
    };
  }

  /**
   * Transfers a patient from one doctor queue to another doctor queue.
   */
  public static async transferQueueEntry(
    queueEntryId: string,
    targetDoctorId: string,
    targetSessionId: string,
    actor: StoredIdentity | null,
    reason?: string
  ): Promise<QueueActionResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return { success: false, error_code: "NOT_FOUND", message: "Original queue entry not found." };
    }

    const targetSession = AppointmentStore.getSessionById(targetSessionId);
    if (!targetSession) {
      return { success: false, error_code: "NOT_FOUND", message: "Target doctor session not found." };
    }

    const nowIso = new Date().toISOString();

    // Mark original entry as TRANSFERRED
    const updatedOriginal: QueueEntry = {
      ...entry,
      status: "TRANSFERRED",
      transferred_at: nowIso,
      transfer_from_doctor_id: entry.doctor_id,
      transfer_to_doctor_id: targetDoctorId,
      transfer_reason: reason || "Operational clinical transfer",
    };
    QueueStore.saveQueueEntry(updatedOriginal);

    // Generate new token under target doctor's queue
    const { tokenNumber, sequenceNumber } = QueueStore.getNextToken(
      targetSession.organization_identifier,
      targetSession.facility_id,
      targetSession.department_id,
      targetDoctorId,
      targetSessionId,
      entry.date,
      targetSession.doctor_name
    );

    const newQueueEntry: QueueEntry = {
      id: `q-${Math.floor(1000 + Math.random() * 9000)}`,
      queue_no: `QUE-${1000 + QueueStore.getAllQueueEntries().length + 1}`,
      appointment_id: entry.appointment_id,
      patient_id: entry.patient_id,
      patient_name: entry.patient_name,
      patient_phone: entry.patient_phone,
      doctor_id: targetDoctorId,
      doctor_name: targetSession.doctor_name,
      organization_id: targetSession.organization_id,
      organization_identifier: targetSession.organization_identifier,
      organization_name: targetSession.organization_name,
      facility_id: targetSession.facility_id,
      department_id: targetSession.department_id,
      department_name: targetSession.department_name,
      session_id: targetSession.id,
      date: entry.date,
      token_number: tokenNumber,
      token_sequence: sequenceNumber,
      source: entry.source,
      checkin_source: "STAFF",
      status: "WAITING",
      room_number: targetSession.room_number || "Room 102",
      notes: `Transferred from Dr. ${entry.doctor_name}: ${reason || ""}`,
      checked_in_at: nowIso,
      created_at: nowIso,
    };

    const savedNew = QueueStore.saveQueueEntry(newQueueEntry);

    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "TRANSFER_QUEUE" as any,
      resource_type: "QUEUE_ENTRY",
      resource_id: savedNew.id,
      details: {
        from_doctor: entry.doctor_name,
        to_doctor: targetSession.doctor_name,
        new_token: tokenNumber,
        reason: updatedOriginal.transfer_reason,
      },
    });

    return {
      success: true,
      queue_entry: savedNew,
      message: `Patient transferred to Dr. ${targetSession.doctor_name} with new Token #${tokenNumber}.`,
    };
  }

  /**
   * Calculates contextual queue position info without false minute estimation (Phase B.3 boundary).
   */
  public static getQueuePosition(queueEntryId: string): QueuePositionInfo {
    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return {
        token_number: "N/A",
        status: "NOT_CHECKED_IN",
        people_ahead: 0,
        doctor_name: "Specialist",
        department_name: "OPD",
        organization_name: "Hospital",
        checked_in_at: new Date().toISOString(),
      };
    }

    const sessionQueue = QueueStore.getQueueForSession(entry.session_id, entry.date);

    // Active people ahead: count WAITING patients with a sequence lower than this entry
    const peopleAhead = sessionQueue.filter(
      (q) => q.status === "WAITING" && q.token_sequence < entry.token_sequence
    ).length;

    // Find currently serving token (IN_CONSULTATION or CALLED)
    const serving = sessionQueue.find((q) => q.status === "IN_CONSULTATION") || sessionQueue.find((q) => q.status === "CALLED");

    return {
      token_number: entry.token_number,
      status: entry.status,
      people_ahead: peopleAhead,
      currently_serving_token: serving ? serving.token_number : undefined,
      room_number: entry.room_number,
      checked_in_at: entry.checked_in_at,
      doctor_name: entry.doctor_name,
      department_name: entry.department_name,
      organization_name: entry.organization_name,
    };
  }

  /**
   * Generates a structured operational summary for a doctor's clinical workspace.
   */
  public static getDoctorQueueSummary(
    doctorId: string,
    orgIdentifier: string,
    date?: string
  ): DoctorQueueSummary[] {
    const targetDate = date || getTodayDateStr();
    const sessions = AppointmentStore.getDoctorSessions(doctorId, orgIdentifier);

    return sessions.map((session) => {
      const queue = QueueStore.getQueueForSession(session.id, targetDate);
      const appointments = AppointmentStore.getAppointmentsForSessionDate(session.id, targetDate);

      const currentPatient = queue.find((q) => q.status === "IN_CONSULTATION") || queue.find((q) => q.status === "CALLED");
      const waitingList = queue.filter((q) => q.status === "WAITING");
      const nextPatient = waitingList[0];
      const skippedList = queue.filter((q) => q.status === "SKIPPED");
      const completedCount = queue.filter((q) => q.status === "COMPLETED").length;

      return {
        session_id: session.id,
        doctor_id: session.doctor_id,
        doctor_name: session.doctor_name,
        organization_identifier: session.organization_identifier,
        facility_id: session.facility_id,
        department_id: session.department_id,
        department_name: session.department_name,
        date: targetDate,
        session_time: session.slot_display_time || `${session.start_time} - ${session.end_time}`,
        room_number: session.room_number || "Room 102",
        total_capacity: session.capacity,
        booked_count: appointments.length,
        checked_in_count: queue.length,
        waiting_count: waitingList.length,
        current_patient: currentPatient,
        next_patient: nextPatient,
        waiting_list: waitingList,
        skipped_list: skippedList,
        completed_count: completedCount,
      };
    });
  }
}
