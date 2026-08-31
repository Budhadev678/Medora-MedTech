import {
  Appointment,
  DoctorWorkingSession,
  ScheduleOverride,
  SessionAvailability,
  BookingRequest,
  BookingResult,
  CapacityAvailabilityStatus,
  AlternativeAppointmentOption,
  DoctorPreferenceMode,
  DiscoveryMode,
} from "@/types/database.types";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { StoredIdentity, findIdentityById } from "@/lib/data/identity-store";
import { AuditLedger } from "@/lib/data/audit-store";
import { WaitlistStore } from "@/lib/data/waitlist-store";
import { getDoctorAffiliations } from "@/lib/data/affiliation-store";
import { getFacilityById, getAllFacilities } from "@/lib/data/facility-store";
import { getDepartmentById } from "@/lib/data/department-store";
import { getServiceById, getAllDoctorServiceAssignments } from "@/lib/data/service-store";
import { Phase6ContractService } from "@/lib/services/phase6-contract-service";
import { AlternativeSearchService } from "@/lib/services/alternative-search-service";
import { isDateWithinCurrentWeek } from "@/lib/utils";

export interface FilteredSlot {
  slot_time: string; // e.g. "08:00 AM", "08:30 AM", "09:00 AM"
  scheduled_time: string; // e.g. "08:00", "08:30"
  session_id: string;
  session_name: string;
  is_available: boolean;
  status: CapacityAvailabilityStatus;
}

export interface DoctorHospitalMatch {
  doctor_id: string;
  doctor_name: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  avatar_url?: string;
  hospital_id: string;
  hospital_name: string;
  organization_identifier: string;
  facility_id: string;
  facility_name: string;
  city: string;
  department_id: string;
  department_name: string;
  opd_room: string;
  consultation_fee: number;
  session_id: string;
  session_name: string;
  slot_display_time: string;
  date: string;
  total_capacity: number;
  booked_count: number;
  remaining_capacity: number;
  status: CapacityAvailabilityStatus;
  status_reason?: string;
  slots: FilteredSlot[];
}

export interface DoctorCrossFacilityAvailability {
  doctor_id: string;
  doctor_name: string;
  specialization?: string;
  facilities: {
    facility_id: string;
    facility_code: string;
    facility_name: string;
    city: string;
    department_id: string;
    department_name: string;
    consultation_fee: number;
    opd_room: string;
    schedule_notes?: string;
    dates: {
      date: string;
      day_name: string;
      sessions: SessionAvailability[];
      is_full: boolean;
    }[];
  }[];
  total_available_sessions: number;
  is_fully_booked_today: boolean;
  recommended_alternatives?: AlternativeAppointmentOption[];
}

export class AppointmentBookingService {
  /**
   * Authoritatively evaluates doctor availability, active bookings, and remaining capacity
   * for a specific doctor, facility, and date.
   */
  public static async getDoctorAvailability(
    doctorId: string,
    orgIdentifier: string,
    facilityId: string,
    dateStr: string
  ): Promise<SessionAvailability[]> {
    // 1. Calculate Day of Week for target date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Use UTC date parts to prevent local timezone drift
    const [year, month, day] = dateStr.split("-").map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = targetDate.getUTCDay();

    // 2. Fetch all active recurring sessions for this doctor at this organization
    const sessions = AppointmentStore.getDoctorSessions(doctorId, orgIdentifier).filter(
      (s) => s.day_of_week === dayOfWeek && s.is_active
    );

    if (sessions.length === 0) {
      return [];
    }

    // 3. Check Overrides (Facility Closure, Doctor Leave, Capacity Override)
    const overrides = AppointmentStore.getOverridesForDate(dateStr, doctorId, orgIdentifier);
    const facilityClosure = overrides.find((o) => o.override_type === "FACILITY_CLOSURE" && o.is_closed);
    const doctorLeave = overrides.find((o) => o.override_type === "DOCTOR_LEAVE" && o.is_closed);

    const now = new Date();
    const isToday = dateStr === now.toISOString().split("T")[0];
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

    const results: SessionAvailability[] = [];

    for (const session of sessions) {
      // Check for date-specific capacity override
      const capOverride = overrides.find(
        (o) => o.override_type === "CAPACITY_OVERRIDE" && o.override_capacity !== undefined
      );
      const effectiveCapacity = capOverride?.override_capacity ?? session.capacity;

      // Query active bookings for this session on this date
      const activeBookings = AppointmentStore.getAppointmentsForSessionDate(session.id, dateStr);
      const bookedCount = activeBookings.length;
      const remainingCapacity = Math.max(0, effectiveCapacity - bookedCount);

      let status: CapacityAvailabilityStatus = "AVAILABLE";
      let statusReason: string | undefined;

      if (facilityClosure) {
        status = "FACILITY_CLOSURE";
        statusReason = `Facility Closed: ${facilityClosure.reason}`;
      } else if (doctorLeave) {
        status = "DOCTOR_LEAVE";
        statusReason = `Doctor Unavailable: ${doctorLeave.reason}`;
      } else if (isToday && session.end_time <= currentTimeStr) {
        status = "PAST_SESSION";
        statusReason = "Session ended for today";
      } else if (remainingCapacity === 0) {
        status = "FULL";
        statusReason = "Session is fully booked";
      } else if (remainingCapacity <= 2) {
        status = "LIMITED";
        statusReason = `Only ${remainingCapacity} appointment(s) remaining`;
      } else {
        status = "AVAILABLE";
        statusReason = `${remainingCapacity} appointments available`;
      }

      results.push({
        session_id: session.id,
        doctor_id: session.doctor_id,
        doctor_name: session.doctor_name,
        organization_id: session.organization_id,
        organization_identifier: session.organization_identifier,
        organization_name: session.organization_name,
        facility_id: session.facility_id,
        department_id: session.department_id,
        department_name: session.department_name,
        date: dateStr,
        start_time: session.start_time,
        end_time: session.end_time,
        slot_display_time: session.slot_display_time || `${session.start_time} - ${session.end_time}`,
        room_number: session.room_number,
        capacity: effectiveCapacity,
        booked_count: bookedCount,
        remaining_capacity: remainingCapacity,
        status,
        status_reason: statusReason,
      });
    }

    return results;
  }

  /**
   * Atomically books an appointment with strict server-side capacity validation.
   * Concurrency Safe: Enforces capacity locks, prevents double booking, and guarantees
   * that parallel attempts for the final remaining capacity will yield exactly one success.
   */
  public static async bookAppointment(
    request: BookingRequest,
    actor: StoredIdentity | null
  ): Promise<BookingResult> {
    const nowIso = new Date().toISOString();

    // 1. Authorization Verification (Phase A.3)
    if (!actor) {
      return {
        success: false,
        error_code: "UNAUTHORIZED",
        message: "You must be signed in to book an appointment.",
      };
    }

    // Patients may only book for themselves
    if (actor.role === "patient") {
      const patientIdMatch =
        actor.id === request.patient_id ||
        actor.identifier === request.patient_id ||
        actor.email === request.patient_id;
      if (!patientIdMatch) {
        return {
          success: false,
          error_code: "UNAUTHORIZED",
          message: "Patients cannot book appointments on behalf of other accounts.",
        };
      }
    }

    // 2. Validate Patient Identity
    const patientUser = findIdentityById(request.patient_id);
    const patientName = patientUser?.fullName || actor.fullName || "Patient";
    const patientPhone = patientUser?.phone || actor.phone || "+91 98765 00000";

    // 3. Validate Working Session
    const session = AppointmentStore.getSessionById(request.session_id);
    if (!session) {
      return {
        success: false,
        error_code: "INVALID_SESSION",
        message: "Selected doctor working session does not exist.",
      };
    }

    // 4. Validate Doctor and Organization Consistency if provided
    if (request.doctor_id && session.doctor_id !== request.doctor_id) {
      return {
        success: false,
        error_code: "DOCTOR_NOT_FOUND",
        message: "Session does not belong to the requested doctor.",
      };
    }

    if (request.organization_identifier && session.organization_identifier !== request.organization_identifier) {
      return {
        success: false,
        error_code: "ORGANIZATION_MISMATCH",
        message: "Session is not affiliated with the specified healthcare organization.",
      };
    }

    // 5. Validate Date (Strict Current Calendar Week Enforcement: Today through Sunday only)
    if (!isDateWithinCurrentWeek(request.appointment_date)) {
      return {
        success: false,
        error_code: "INVALID_BOOKING_WINDOW",
        message: "Appointments can only be booked for the remaining days of this week.",
      };
    }

    // 6. Check Overrides: Facility Closure & Doctor Leave
    const overrides = AppointmentStore.getOverridesForDate(
      request.appointment_date,
      session.doctor_id,
      session.organization_identifier
    );

    const facilityClosure = overrides.find((o) => o.override_type === "FACILITY_CLOSURE" && o.is_closed);
    if (facilityClosure) {
      return {
        success: false,
        error_code: "FACILITY_CLOSED",
        message: `Booking unavailable: ${facilityClosure.reason}`,
      };
    }

    const doctorLeave = overrides.find((o) => o.override_type === "DOCTOR_LEAVE" && o.is_closed);
    if (doctorLeave) {
      return {
        success: false,
        error_code: "DOCTOR_ON_LEAVE",
        message: `Dr. ${session.doctor_name} is on leave on ${request.appointment_date}: ${doctorLeave.reason}`,
      };
    }

    // 7. Check Duplicate Booking / Idempotency
    const existingPatientApts = AppointmentStore.getAppointmentsForPatient(request.patient_id);
    const isDuplicate = existingPatientApts.some(
      (a) =>
        a.session_id === request.session_id &&
        a.appointment_date === request.appointment_date &&
        ["CONFIRMED", "REQUESTED", "CHECKED_IN", "WAITING", "IN_CONSULTATION"].includes(a.status)
    );

    if (isDuplicate) {
      const existing = existingPatientApts.find(
        (a) =>
          a.session_id === request.session_id &&
          a.appointment_date === request.appointment_date &&
          ["CONFIRMED", "REQUESTED", "CHECKED_IN", "WAITING", "IN_CONSULTATION"].includes(a.status)
      );
      return {
        success: true, // Idempotent success returns existing appointment
        appointment: existing,
        message: "You already have a confirmed appointment for this session.",
      };
    }

    // 8. ATOMIC CAPACITY CHECK
    const capOverride = overrides.find(
      (o) => o.override_type === "CAPACITY_OVERRIDE" && o.override_capacity !== undefined
    );
    const effectiveCapacity = capOverride?.override_capacity ?? session.capacity;

    const currentBookings = AppointmentStore.getAppointmentsForSessionDate(
      request.session_id,
      request.appointment_date
    );

    if (currentBookings.length >= effectiveCapacity) {
      // Record denied capacity attempt in audit ledger
      AuditLedger.recordEvent({
        actor_id: actor.identifier || actor.id,
        actor_name: actor.fullName,
        action: "BOOKING_DENIED_CAPACITY" as any,
        resource_type: "APPOINTMENT",
        resource_id: request.session_id,
        details: {
          doctor_id: session.doctor_id,
          organization: session.organization_name,
          date: request.appointment_date,
          capacity: effectiveCapacity,
          booked_count: currentBookings.length,
          reason: "Session fully booked",
        },
      });

      return {
        success: false,
        error_code: "SESSION_FULL",
        message: "This appointment session is fully booked. Please select another date or session.",
        remaining_capacity: 0,
      };
    }

    // 9. Create New Appointment
    const allAppointments = AppointmentStore.getAllAppointments();
    let maxNum = 2000;
    for (const a of allAppointments) {
      const match = a.appointment_no?.match(/APT-(\d+)/i) || a.id?.match(/apt-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const appointmentNo = `APT-${maxNum + 1}`;
    const tokenNumber = String(currentBookings.length + 1).padStart(2, "0");

    const newAppointment: Appointment = {
      id: appointmentNo.toLowerCase(),
      appointment_no: appointmentNo,
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
      appointment_date: request.appointment_date,
      session_start_time: session.start_time,
      session_end_time: session.end_time,
      slot_display_time: session.slot_display_time || `${session.start_time} - ${session.end_time} Session`,
      scheduled_time: session.start_time,
      token_number: tokenNumber,
      status: "CONFIRMED",
      booking_source: request.booking_source || "PATIENT",
      reason_for_visit: request.reason_for_visit || "Outpatient Clinical Consultation",
      opd_room: session.room_number || "Room 102",
      idempotency_key: request.idempotency_key,
      created_at: nowIso,
    };

    const saved = AppointmentStore.saveAppointment(newAppointment);

    // If patient had an active or notified waitlist entry for this session & date, mark it BOOKED
    try {
      const patientWaitlists = WaitlistStore.getPatientActiveWaitlists(request.patient_id);
      const match = patientWaitlists.find(
        (w) => w.preferred_session_id === session.id && w.preferred_date === request.appointment_date
      );
      if (match) {
        WaitlistStore.markWaitlistBooked(match.id, saved.id);
      }
    } catch (wErr) {
      // safe fallback
    }

    // 10. Record Immutable Audit Event
    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "APPOINTMENT_CREATED" as any,
      resource_type: "APPOINTMENT",
      resource_id: saved.id,
      details: {
        appointment_no: saved.appointment_no,
        doctor: session.doctor_name,
        organization: session.organization_name,
        date: saved.appointment_date,
        session: saved.slot_display_time,
        token: saved.token_number,
        booking_source: saved.booking_source,
      },
    });

    const newRemaining = Math.max(0, effectiveCapacity - (currentBookings.length + 1));

    return {
      success: true,
      appointment: saved,
      message: `Appointment successfully booked for ${saved.slot_display_time} on ${saved.appointment_date}.`,
      remaining_capacity: newRemaining,
    };
  }

  /**
   * Cancels an existing appointment and atomically releases future session capacity.
   */
  public static async cancelAppointment(
    appointmentId: string,
    actor: StoredIdentity | null,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    if (!actor) {
      return { success: false, message: "Authentication required to cancel an appointment." };
    }

    const appointment = AppointmentStore.getAppointmentById(appointmentId);
    if (!appointment) {
      return { success: false, message: "Appointment record not found." };
    }

    if (appointment.status === "CANCELLED") {
      return { success: true, message: "Appointment is already cancelled." };
    }

    // Permission check: Patient can cancel own; Doctor/Staff/Admin can cancel at facility
    if (actor.role === "patient") {
      const isOwner =
        actor.id === appointment.patient_id ||
        actor.identifier === appointment.patient_id ||
        actor.email === appointment.patient_id;
      if (!isOwner) {
        return { success: false, message: "Unauthorized to cancel another patient's appointment." };
      }
    }

    // Update appointment status to CANCELLED
    const updated: Appointment = {
      ...appointment,
      status: "CANCELLED",
      cancellation_reason: reason || "Cancelled by user request",
      cancelled_at: new Date().toISOString(),
    };

    AppointmentStore.saveAppointment(updated);

    // Phase B.4: Check for active waitlist entries for this session & date, and notify the earliest patient
    try {
      const waitlisted = WaitlistStore.getWaitlistsForSession(updated.session_id, updated.appointment_date);
      if (waitlisted.length > 0) {
        const firstCandidate = waitlisted[0];
        WaitlistStore.notifyWaitlistEntry(firstCandidate.id);
      }
    } catch (wErr) {
      console.warn("Waitlist notification check failed", wErr);
    }

    // Audit trail
    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "APPOINTMENT_CANCELLED" as any,
      resource_type: "APPOINTMENT",
      resource_id: updated.id,
      details: {
        appointment_no: updated.appointment_no,
        doctor: updated.doctor_name,
        date: updated.appointment_date,
        reason: updated.cancellation_reason,
      },
    });

    return {
      success: true,
      message: `Appointment ${updated.appointment_no} has been cancelled and session capacity released.`,
    };
  }

  /**
   * Reschedules an appointment: Atomically transfers capacity from old session to new session.
   */
  public static async rescheduleAppointment(
    appointmentId: string,
    newSessionId: string,
    newDate: string,
    actor: StoredIdentity | null,
    reason?: string
  ): Promise<BookingResult> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    const oldAppointment = AppointmentStore.getAppointmentById(appointmentId);
    if (!oldAppointment) {
      return { success: false, error_code: "INVALID_SESSION", message: "Original appointment not found." };
    }

    const targetSession = AppointmentStore.getSessionById(newSessionId);
    if (!targetSession) {
      return { success: false, error_code: "INVALID_SESSION", message: "Target working session not found." };
    }

    // 1. Verify and book new appointment first
    const bookingReq: BookingRequest = {
      patient_id: oldAppointment.patient_id,
      doctor_id: targetSession.doctor_id,
      organization_identifier: targetSession.organization_identifier,
      facility_id: targetSession.facility_id,
      department_id: targetSession.department_id,
      session_id: targetSession.id,
      appointment_date: newDate,
      reason_for_visit: reason || `Rescheduled from ${oldAppointment.appointment_no}: ${oldAppointment.reason_for_visit || "Consultation"}`,
      booking_source: oldAppointment.booking_source,
    };

    const newBookingResult = await this.bookAppointment(bookingReq, actor);
    if (!newBookingResult.success || !newBookingResult.appointment) {
      return newBookingResult;
    }

    // 2. Mark old appointment as RESCHEDULED to release old capacity
    const updatedOld: Appointment = {
      ...oldAppointment,
      status: "RESCHEDULED",
      rescheduled_to_id: newBookingResult.appointment.id,
      cancellation_reason: `Rescheduled to ${newBookingResult.appointment.appointment_no} on ${newDate}`,
    };
    AppointmentStore.saveAppointment(updatedOld);

    // Link new appointment to old
    const updatedNew: Appointment = {
      ...newBookingResult.appointment,
      rescheduled_from_id: oldAppointment.id,
    };
    AppointmentStore.saveAppointment(updatedNew);

    // Audit trail
    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "APPOINTMENT_RESCHEDULED" as any,
      resource_type: "APPOINTMENT",
      resource_id: updatedNew.id,
      details: {
        previous_appointment_no: oldAppointment.appointment_no,
        new_appointment_no: updatedNew.appointment_no,
        previous_date: oldAppointment.appointment_date,
        new_date: updatedNew.appointment_date,
      },
    });

    return {
      success: true,
      appointment: updatedNew,
      message: `Appointment successfully rescheduled to ${newDate} (${updatedNew.slot_display_time}).`,
      remaining_capacity: newBookingResult.remaining_capacity,
    };
  }

  /**
   * Validates schedule overlap / physical travel conflicts for a doctor across multiple hospitals.
   */
  public static detectScheduleConflicts(
    doctorId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeSessionId?: string
  ): { hasConflict: boolean; conflictingSession?: DoctorWorkingSession } {
    const existingSessions = AppointmentStore.getDoctorSessions(doctorId).filter(
      (s) => s.day_of_week === dayOfWeek && s.is_active && s.id !== excludeSessionId
    );

    for (const session of existingSessions) {
      // Overlap condition: startA < endB && endA > startB
      const hasOverlap = startTime < session.end_time && endTime > session.start_time;
      if (hasOverlap) {
        return { hasConflict: true, conflictingSession: session };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Configures or updates doctor session capacity with strict validation and conflict detection.
   */
  public static async createOrUpdateSession(
    sessionData: Partial<DoctorWorkingSession> & { id?: string },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; session?: DoctorWorkingSession; message: string; warning?: string }> {
    if (!actor) {
      return { success: false, message: "Authentication required to configure schedules." };
    }

    // Role check: Only Doctor, Hospital Admin, or Platform Admin
    if (!["doctor", "hospital_admin", "admin"].includes(actor.role)) {
      return { success: false, message: "Unauthorized: Only doctors and facility admins can configure capacity." };
    }

    if (!sessionData.doctor_id || !sessionData.start_time || !sessionData.end_time) {
      return { success: false, message: "Doctor ID, start time, and end time are required." };
    }

    if (sessionData.start_time >= sessionData.end_time) {
      return { success: false, message: "Invalid session timing: Start time must precede end time." };
    }

    if (!sessionData.capacity || sessionData.capacity <= 0 || !Number.isInteger(sessionData.capacity)) {
      return { success: false, message: "Invalid capacity: Capacity must be a positive integer." };
    }

    // Multi-facility schedule conflict check
    const conflict = this.detectScheduleConflicts(
      sessionData.doctor_id,
      sessionData.day_of_week ?? 1,
      sessionData.start_time,
      sessionData.end_time,
      sessionData.id
    );

    if (conflict.hasConflict && conflict.conflictingSession) {
      return {
        success: false,
        message: `Physical Schedule Conflict: Doctor is already scheduled at ${conflict.conflictingSession.organization_name} (${conflict.conflictingSession.start_time} - ${conflict.conflictingSession.end_time}) on this day.`,
      };
    }

    const sessionId = sessionData.id || `SES-${Math.floor(1000 + Math.random() * 9000)}`;
    const existingSession = AppointmentStore.getSessionById(sessionId);

    let warning: string | undefined;

    // Check if reducing capacity below existing bookings count
    if (existingSession && sessionData.capacity < existingSession.capacity) {
      const todayStr = new Date().toISOString().split("T")[0];
      const allApts = AppointmentStore.getAllAppointments().filter(
        (a) =>
          a.session_id === sessionId &&
          a.appointment_date >= todayStr &&
          ["CONFIRMED", "REQUESTED"].includes(a.status)
      );
      if (allApts.length > sessionData.capacity) {
        warning = `Capacity reduced to ${sessionData.capacity}, but ${allApts.length} future appointments exist. No appointments were cancelled, but session is now marked full.`;
      }
    }

    const newSession: DoctorWorkingSession = {
      id: sessionId,
      doctor_id: sessionData.doctor_id,
      doctor_name: sessionData.doctor_name || existingSession?.doctor_name || "Doctor",
      organization_id: sessionData.organization_id || existingSession?.organization_id || "11111111-1111-1111-1111-111111111101",
      organization_identifier: sessionData.organization_identifier || existingSession?.organization_identifier || "HSP-1001",
      organization_name: sessionData.organization_name || existingSession?.organization_name || "City Hospital",
      facility_id: sessionData.facility_id || existingSession?.facility_id || "FAC-1001",
      department_id: sessionData.department_id || existingSession?.department_id || "DEP-CARD-1001",
      department_name: sessionData.department_name || existingSession?.department_name || "Cardiology OPD",
      day_of_week: sessionData.day_of_week ?? existingSession?.day_of_week ?? 1,
      start_time: sessionData.start_time,
      end_time: sessionData.end_time,
      slot_display_time: `${sessionData.start_time} - ${sessionData.end_time}`,
      capacity: sessionData.capacity,
      room_number: sessionData.room_number || existingSession?.room_number || "Room 102",
      session_name: sessionData.session_name || existingSession?.session_name || "Outpatient Session",
      is_active: sessionData.is_active ?? true,
      created_at: existingSession?.created_at || new Date().toISOString(),
    };

    const saved = AppointmentStore.saveSession(newSession);

    // Audit log
    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: (existingSession ? "CAPACITY_CHANGED" : "SCHEDULE_CREATED") as any,
      resource_type: "ORGANIZATION",
      resource_id: saved.id,
      details: {
        session_id: saved.id,
        doctor: saved.doctor_name,
        organization: saved.organization_name,
        day: saved.day_of_week,
        timing: `${saved.start_time} - ${saved.end_time}`,
        capacity: saved.capacity,
      },
    });

    return {
      success: true,
      session: saved,
      message: `Doctor working session ${saved.id} (${saved.start_time}-${saved.end_time}, Capacity ${saved.capacity}) configured successfully.`,
      warning,
    };
  }

  /**
   * Adds doctor leave with automated conflict reporting for existing appointments.
   */
  public static async addDoctorLeave(
    leaveData: { doctor_id: string; date: string; reason: string; organization_identifier?: string },
    actor: StoredIdentity | null
  ): Promise<{ success: boolean; message: string; affectedAppointmentsCount: number }> {
    if (!actor) {
      return { success: false, message: "Authentication required.", affectedAppointmentsCount: 0 };
    }

    if (!leaveData.doctor_id || !leaveData.date || !leaveData.reason) {
      return { success: false, message: "Doctor ID, date, and reason are required.", affectedAppointmentsCount: 0 };
    }

    const overrideId = `LEV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLeave: ScheduleOverride = {
      id: overrideId,
      override_type: "DOCTOR_LEAVE",
      doctor_id: leaveData.doctor_id,
      organization_identifier: leaveData.organization_identifier || "HSP-1001",
      date: leaveData.date,
      reason: leaveData.reason,
      is_closed: true,
      created_at: new Date().toISOString(),
    };

    AppointmentStore.saveOverride(newLeave);

    // Find any existing confirmed appointments on this date for operational notification
    const affectedApts = AppointmentStore.getAllAppointments().filter(
      (a) =>
        a.doctor_id === leaveData.doctor_id &&
        a.appointment_date === leaveData.date &&
        ["CONFIRMED", "REQUESTED"].includes(a.status)
    );

    // Audit log
    AuditLedger.recordEvent({
      actor_id: actor.identifier || actor.id,
      actor_name: actor.fullName,
      action: "LEAVE_ADDED" as any,
      resource_type: "IDENTITY",
      resource_id: leaveData.doctor_id,
      details: {
        date: leaveData.date,
        reason: leaveData.reason,
        affected_bookings: affectedApts.length,
      },
    });

    return {
      success: true,
      message: `Doctor leave for ${leaveData.date} recorded successfully.`,
      affectedAppointmentsCount: affectedApts.length,
    };
  }

  /**
   * PHASE 6.1 — DOCTOR-FIRST DISCOVERY ENGINE
   * Discovers doctor availability across ALL affiliated facilities over target date range.
   * Enables: "I specifically want this doctor" -> searches all connected facilities and sessions.
   */
  public static async searchDoctorFirstAvailability(
    doctorId: string,
    startDateStr?: string,
    daysCount: number = 7,
    options?: {
      allowAlternatives?: boolean;
      actor?: StoredIdentity | null;
    }
  ): Promise<DoctorCrossFacilityAvailability> {
    const today = new Date();
    const start = startDateStr ? new Date(startDateStr) : today;
    const cleanDoctorId = doctorId.trim();

    // 1. Resolve Doctor Affiliations across all facilities
    const affiliations = getDoctorAffiliations(cleanDoctorId, false);
    const doctorName = affiliations[0]?.doctor_name || "Specialist";
    const specialization = affiliations[0]?.specialization;

    const facilitiesData: DoctorCrossFacilityAvailability["facilities"] = [];
    let totalAvailable = 0;
    let isFullyBookedToday = true;

    for (const aff of affiliations) {
      const fac = getFacilityById(aff.facility_id);
      if (!fac || fac.status !== "ACTIVE") continue;

      const datesData: {
        date: string;
        day_name: string;
        sessions: SessionAvailability[];
        is_full: boolean;
      }[] = [];

      for (let i = 0; i < daysCount; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = dayNames[d.getDay()];

        // Query sessions for this doctor at this facility on this date
        const sessions = await this.getDoctorAvailability(
          cleanDoctorId,
          fac.facility_code,
          fac.facility_code,
          dateStr
        );

        const hasAvailable = sessions.some((s) => s.status === "AVAILABLE" || s.status === "LIMITED");
        if (hasAvailable) {
          totalAvailable += sessions.filter((s) => s.status === "AVAILABLE" || s.status === "LIMITED").length;
          if (i === 0) {
            isFullyBookedToday = false;
          }
        }

        if (sessions.length > 0) {
          datesData.push({
            date: dateStr,
            day_name: dayName,
            sessions,
            is_full: !hasAvailable,
          });
        }
      }

      if (datesData.length > 0) {
        facilitiesData.push({
          facility_id: fac.id,
          facility_code: fac.facility_code,
          facility_name: fac.name,
          city: fac.city,
          department_id: aff.department_id || "DEP-1001",
          department_name: aff.department_name || "Specialty Unit",
          consultation_fee: aff.consultation_fee || 500,
          opd_room: aff.opd_room || "Room 102",
          schedule_notes: aff.schedule_notes,
          dates: datesData,
        });
      }
    }

    // 2. If preferred doctor is full today and alternatives requested, find alternatives
    let recommendedAlternatives: AlternativeAppointmentOption[] | undefined = undefined;
    if (options?.allowAlternatives && (isFullyBookedToday || totalAvailable === 0)) {
      const todayStr = today.toISOString().split("T")[0];
      recommendedAlternatives = AlternativeSearchService.findAppointmentAlternatives(
        {
          patient_id: options.actor?.identifier || options.actor?.id || "PAT-ANONYMOUS",
          preferred_doctor_id: cleanDoctorId,
          preferred_organization_identifier: affiliations[0]?.facility_id || "FAC-1001",
          preferred_date: todayStr,
          specialty: specialization,
        },
        options.actor || null
      );
    }

    return {
      doctor_id: cleanDoctorId,
      doctor_name: doctorName,
      specialization,
      facilities: facilitiesData,
      total_available_sessions: totalAvailable,
      is_fully_booked_today: isFullyBookedToday,
      recommended_alternatives: recommendedAlternatives,
    };
  }

  /**
   * PHASE 6.1 — FACILITY-FIRST DISCOVERY ENGINE
   * Facility -> Department -> Service -> Eligible Doctors -> Schedule Sessions
   */
  public static async searchFacilityFirstAvailability(
    facilityIdOrCode: string,
    departmentId?: string,
    serviceId?: string,
    dateStr?: string
  ): Promise<{
    facility: any;
    departments: any[];
    doctors: {
      doctor_id: string;
      doctor_name: string;
      specialization?: string;
      consultation_fee: number;
      opd_room: string;
      sessions: SessionAvailability[];
    }[];
  }> {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    const fac = getFacilityById(facilityIdOrCode);
    if (!fac || fac.status !== "ACTIVE") {
      return { facility: null, departments: [], doctors: [] };
    }

    const depts = Phase6ContractService.getDiscoverableDepartments(fac.facility_code);
    const targetDepts = departmentId
      ? depts.filter((d) => d.department_id.toLowerCase() === departmentId.toLowerCase() || d.code.toLowerCase() === departmentId.toLowerCase())
      : depts;

    let eligibleDoctors: any[] = [];
    if (serviceId) {
      eligibleDoctors = Phase6ContractService.getEligibleDoctorsForService(fac.facility_code, serviceId);
    } else {
      eligibleDoctors = getDoctorAffiliations(fac.facility_code, false).filter(
        (d) => !departmentId || d.department_id?.toLowerCase() === departmentId.toLowerCase()
      );
    }

    const doctorsWithSessions: any[] = [];
    for (const doc of eligibleDoctors) {
      const docId = doc.doctor_id;
      const sessions = await this.getDoctorAvailability(
        docId,
        fac.facility_code,
        fac.facility_code,
        targetDate
      );

      doctorsWithSessions.push({
        doctor_id: docId,
        doctor_name: doc.doctor_name,
        specialization: doc.specialization,
        consultation_fee: doc.consultation_fee || 500,
        opd_room: doc.opd_room || "Room 102",
        sessions,
      });
    }

    return {
      facility: fac,
      departments: targetDepts,
      doctors: doctorsWithSessions,
    };
  }

  /**
   * PHASE 6.1 — SERVICE-FIRST DISCOVERY ENGINE
   * Service -> Department -> Facilities -> Doctors -> Schedule Sessions
   */
  public static async searchServiceFirstAvailability(
    serviceIdOrCode: string,
    facilityIdOrCode?: string,
    dateStr?: string
  ): Promise<{
    service: any;
    facilities: {
      facility_id: string;
      facility_code: string;
      facility_name: string;
      city: string;
      doctors: {
        doctor_id: string;
        doctor_name: string;
        consultation_fee: number;
        sessions: SessionAvailability[];
      }[];
    }[];
  }> {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    const srv = getServiceById(serviceIdOrCode);
    if (!srv || srv.status !== "ACTIVE") {
      return { service: null, facilities: [] };
    }

    const allFacs = Phase6ContractService.getDiscoverableFacilities();
    const candidateFacs = facilityIdOrCode
      ? allFacs.filter((f) => f.facility_code.toLowerCase() === facilityIdOrCode.toLowerCase() || f.facility_id.toLowerCase() === facilityIdOrCode.toLowerCase())
      : allFacs;

    const facilitiesResult: any[] = [];
    for (const fac of candidateFacs) {
      const eligibleDocs = Phase6ContractService.getEligibleDoctorsForService(fac.facility_code, srv.id);
      if (eligibleDocs.length === 0) continue;

      const docsWithSessions: any[] = [];
      for (const doc of eligibleDocs) {
        const sessions = await this.getDoctorAvailability(
          doc.doctor_id,
          fac.facility_code,
          fac.facility_code,
          targetDate
        );
        docsWithSessions.push({
          doctor_id: doc.doctor_id,
          doctor_name: doc.doctor_name,
          consultation_fee: doc.consultation_fee || srv.base_price || 500,
          sessions,
        });
      }

      facilitiesResult.push({
        facility_id: fac.facility_id,
        facility_code: fac.facility_code,
        facility_name: fac.name,
        city: fac.city,
        doctors: docsWithSessions,
      });
    }

    return {
      service: srv,
      facilities: facilitiesResult,
    };
  }

  /**
   * Provides a unified cross-facility practice footprint summary for a doctor.
   */
  public static getDoctorCrossFacilityScheduleSummary(doctorId: string): {
    doctor_id: string;
    doctor_name: string;
    affiliations_count: number;
    facilities: {
      facility_code: string;
      facility_name: string;
      department_name: string;
      consultation_fee: number;
      opd_room: string;
      weekly_sessions_count: number;
    }[];
  } {
    const affiliations = getDoctorAffiliations(doctorId, false);
    const doctorName = affiliations[0]?.doctor_name || "Specialist";
    const allSessions = AppointmentStore.getDoctorSessions(doctorId);

    const facilities = affiliations.map((aff) => {
      const facSessions = allSessions.filter(
        (s) =>
          s.facility_id.toLowerCase() === aff.facility_id.toLowerCase() ||
          s.organization_identifier.toLowerCase() === aff.facility_id.toLowerCase()
      );
      return {
        facility_code: aff.facility_id,
        facility_name: aff.facility_name || "Healthcare Facility",
        department_name: aff.department_name || "Clinical Department",
        consultation_fee: aff.consultation_fee || 500,
        opd_room: aff.opd_room || "Room 102",
        weekly_sessions_count: facSessions.length,
      };
    });

    return {
      doctor_id: doctorId,
      doctor_name: doctorName,
      affiliations_count: affiliations.length,
      facilities,
    };
  }

  /**
   * Universal, backend-driven search for doctors, hospital affiliations, and real appointment slots.
   */
  public static async searchDoctorHospitalSlots(filter: {
    specialty?: string;
    location?: string;
    hospitalId?: string;
    doctorId?: string;
    date: string;
    availableOnly?: boolean;
    searchQuery?: string;
  }): Promise<DoctorHospitalMatch[]> {
    const targetDateStr = filter.date || new Date().toISOString().split("T")[0];
    const [year, month, day] = targetDateStr.split("-").map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = targetDate.getUTCDay();

    // 1. Fetch all facilities
    const facilities = getAllFacilities();
    
    // 2. Fetch all active doctor working sessions for this day of week
    const allSessions = AppointmentStore.getAllSessions().filter(
      (s) => s.is_active && s.day_of_week === dayOfWeek
    );

    const matches: DoctorHospitalMatch[] = [];

    for (const session of allSessions) {
      // Find facility by facility_id first, then fallback to organization_identifier
      const fac =
        facilities.find(
          (f) =>
            (f.facility_code || "").toLowerCase() === (session.facility_id || "").toLowerCase() ||
            (f.id || "").toLowerCase() === (session.facility_id || "").toLowerCase()
        ) ||
        facilities.find(
          (f) =>
            (f.organization_identifier || "").toLowerCase() === (session.organization_identifier || "").toLowerCase()
        );

      const doctorId = session.doctor_id;
      const doctorUser = findIdentityById(doctorId);
      const doctorData = doctorUser?.doctorData;

      const spec = doctorData?.specialization || session.department_name || "General Medicine";
      const qual = doctorData?.qualifications || "MBBS, MD";
      const exp = doctorData?.experienceYears || 8;
      const avatar = doctorUser?.avatarUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80";
      const cityName = fac?.city || (session.organization_name.includes("Cuttack") ? "Cuttack" : session.organization_name.includes("Rourkela") ? "Rourkela" : "Bhubaneswar");
      const facName = fac?.name || session.organization_name;

      // Filter by Specialty
      if (filter.specialty && filter.specialty !== "all") {
        const cleanSpec = filter.specialty.toLowerCase().replace(/_/g, " ");
        const docSpec = spec.toLowerCase();
        const deptName = (session.department_name || "").toLowerCase();
        if (!docSpec.includes(cleanSpec) && !deptName.includes(cleanSpec)) {
          continue;
        }
      }

      // Filter by Location
      if (filter.location && filter.location !== "all" && filter.location !== "All Locations") {
        const cleanLoc = filter.location.toLowerCase();
        if (!cityName.toLowerCase().includes(cleanLoc) && !(fac?.address || "").toLowerCase().includes(cleanLoc)) {
          continue;
        }
      }

      // Filter by Hospital ID / Facility
      if (filter.hospitalId && filter.hospitalId !== "all" && filter.hospitalId !== "Any Hospital") {
        const cleanHsp = filter.hospitalId.toLowerCase();
        const matchHsp =
          (session.organization_identifier || "").toLowerCase() === cleanHsp ||
          (session.facility_id || "").toLowerCase() === cleanHsp ||
          (fac?.facility_code || "").toLowerCase() === cleanHsp ||
          (fac?.id || "").toLowerCase() === cleanHsp;
        if (!matchHsp) {
          continue;
        }
      }

      // Filter by Doctor ID
      if (filter.doctorId && filter.doctorId !== "all") {
        if (session.doctor_id.toLowerCase() !== filter.doctorId.toLowerCase()) {
          continue;
        }
      }

      // Filter by Text Search Query
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.trim().toLowerCase();
        const str = `${session.doctor_name} ${facName} ${cityName} ${spec} ${session.department_name}`.toLowerCase();
        if (!str.includes(q)) {
          continue;
        }
      }

      // Check Real Availability
      const availabilityList = await this.getDoctorAvailability(
        session.doctor_id,
        session.organization_identifier,
        session.facility_id,
        targetDateStr
      );
      const avail = availabilityList.find((a) => a.session_id === session.id);

      const status: CapacityAvailabilityStatus = avail ? avail.status : "PAST_SESSION";
      const remainingCap = avail ? avail.remaining_capacity : 0;
      const bookedCount = avail ? avail.booked_count : 0;
      const totalCap = avail ? avail.capacity : session.capacity;
      const statusReason = avail?.status_reason;

      if (filter.availableOnly && (status !== "AVAILABLE" && status !== "LIMITED")) {
        continue;
      }

      // Generate Slots
      const slots: FilteredSlot[] = [];
      const [startHour, startMin] = session.start_time.split(":").map(Number);
      const [endHour, endMin] = session.end_time.split(":").map(Number);
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      const slotCount = Math.max(1, Math.min(totalCap, Math.floor(durationMinutes / 15)));
      const stepMins = Math.floor(durationMinutes / slotCount);

      const activeBookings = AppointmentStore.getAppointmentsForSessionDate(session.id, targetDateStr);

      for (let i = 0; i < slotCount; i++) {
        const totalM = startHour * 60 + startMin + i * stepMins;
        const h = Math.floor(totalM / 60);
        const m = totalM % 60;
        const time24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        const timeFormatted = `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;

        const isSlotBooked = i < bookedCount || activeBookings.some((b) => b.scheduled_time === time24);
        const isAvailable = (status === "AVAILABLE" || status === "LIMITED") && !isSlotBooked;

        slots.push({
          slot_time: timeFormatted,
          scheduled_time: time24,
          session_id: session.id,
          session_name: session.session_name || "Specialist Clinic",
          is_available: isAvailable,
          status: isAvailable ? "AVAILABLE" : isSlotBooked ? "FULL" : status,
        });
      }

      matches.push({
        doctor_id: session.doctor_id,
        doctor_name: session.doctor_name,
        specialization: spec,
        qualifications: qual,
        experience_years: exp,
        avatar_url: avatar,
        hospital_id: session.organization_identifier || "HSP-1001",
        hospital_name: facName,
        organization_identifier: session.organization_identifier,
        facility_id: session.facility_id,
        facility_name: facName,
        city: cityName,
        department_id: session.department_id,
        department_name: session.department_name,
        opd_room: session.room_number || "Room 102",
        consultation_fee: 500,
        session_id: session.id,
        session_name: session.session_name || "Specialist Clinic",
        slot_display_time: session.slot_display_time || `${session.start_time} - ${session.end_time}`,
        date: targetDateStr,
        total_capacity: totalCap,
        booked_count: bookedCount,
        remaining_capacity: remainingCap,
        status,
        status_reason: statusReason,
        slots,
      });
    }

    return matches;
  }
}
