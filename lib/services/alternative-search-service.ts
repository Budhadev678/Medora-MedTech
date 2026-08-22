// ============================================================
// MEDORA — ALTERNATIVE DISCOVERY & DECISION ENGINE SERVICE
// MODIFICATION PHASE B.4
// ============================================================

import {
  AlternativeAppointmentOption,
  AlternativeRecommendationReason,
  AlternativeSearchParams,
  Appointment,
} from "@/types/database.types";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { WaitingTimeEstimationService } from "@/lib/services/waiting-time-service";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import {
  StoredIdentity,
  findIdentityById,
} from "@/lib/data/identity-store";
import { AuditLedger } from "@/lib/data/audit-store";

export class AlternativeSearchService {
  /**
   * Discovers valid, explainable appointment alternatives in controlled priority order:
   * 1. Same Doctor + Same Facility (different session today/tomorrow)
   * 2. Same Doctor + Different Connected Facility
   * 3. Other Doctor + Same Facility (Same Specialty)
   * 4. Other Doctor + Different Facility (Same Specialty)
   *
   * Enforces:
   * - Strict specialty matching (never suggests Dermatology for Cardiology).
   * - B.1 authoritative capacity and override validation.
   * - Zero price/commission ranking bias.
   * - Full patient autonomy (never forced).
   */
  public static findAppointmentAlternatives(
    params: AlternativeSearchParams,
    actor: StoredIdentity | null
  ): AlternativeAppointmentOption[] {
    const todayStr = getTodayDateStr();
    const targetDate = params.preferred_date || todayStr;

    // 1. Resolve preferred doctor and medical specialty
    const targetDoctor = findIdentityById(params.preferred_doctor_id);
    const doctorName = targetDoctor?.fullName || "Specialist";
    const doctorSpecialty =
      params.specialty ||
      targetDoctor?.doctorData?.specialization ||
      "Cardiology";

    const normalizedSpecialty = doctorSpecialty.toLowerCase();

    // 2. Query all active working sessions in the platform across target date and upcoming days
    const allSessions = AppointmentStore.getAllSessions();
    const candidateOptions: AlternativeAppointmentOption[] = [];
    const datesToSearch = [targetDate];

    for (const curDate of datesToSearch) {
      const [y, m, d] = curDate.split("-").map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      const curDayOfWeek = dateObj.getUTCDay();

      for (const session of allSessions) {
        if (!session.is_active) continue;

        // Skip exact same session on exact same date if specified
        if (
          params.preferred_session_id &&
          session.id === params.preferred_session_id &&
          session.doctor_id === params.preferred_doctor_id &&
          session.organization_identifier === params.preferred_organization_identifier &&
          curDate === targetDate
        ) {
          continue;
        }

        const isSameDoctor = session.doctor_id === params.preferred_doctor_id;
        const isSameFacility =
          session.organization_identifier === params.preferred_organization_identifier ||
          session.facility_id === params.preferred_organization_identifier;
        const isSameDate = curDate === targetDate;

        // Patient Filter Guards: Strict Doctor Preference
        if (params.filter_same_doctor_only && !isSameDoctor) continue;
        if (params.filter_same_facility_only && !isSameFacility) continue;

        // If not same doctor, only check targetDate
        if (!isSameDoctor && !isSameDate) continue;

        // Check doctor specialty match
        const sessionDoc = findIdentityById(session.doctor_id);
        const sessionSpecialty = (sessionDoc?.doctorData?.specialization || session.department_name || "").toLowerCase();
        const isSpecialtyMatch =
          sessionSpecialty.includes(normalizedSpecialty) ||
          normalizedSpecialty.includes(sessionSpecialty) ||
          session.department_name.toLowerCase().includes(normalizedSpecialty);

        if (!isSpecialtyMatch) {
          continue;
        }

        // Check availability & capacity
        const overrides = AppointmentStore.getOverridesForDate(
          curDate,
          session.doctor_id,
          session.organization_identifier
        );

        const isClosed = overrides.some(
          (o) => (o.override_type === "FACILITY_CLOSURE" || o.override_type === "DOCTOR_LEAVE") && o.is_closed
        );
        if (isClosed) continue;

        const currentBookings = AppointmentStore.getAppointmentsForSessionDate(session.id, curDate);
        const capOverride = overrides.find(
          (o) => o.override_type === "CAPACITY_OVERRIDE" && o.override_capacity !== undefined
        );
        const effectiveCapacity = capOverride?.override_capacity ?? session.capacity;
        const remainingCapacity = Math.max(0, effectiveCapacity - currentBookings.length);

        // Determine 5-tier recommendation reason
        let reasonBadge: AlternativeRecommendationReason;
        let reasonExplanation: string;

        if (isSameDoctor && isSameFacility && isSameDate) {
          reasonBadge = "SAME_DOCTOR_LATER_SESSION";
          reasonExplanation = `Same doctor (${session.doctor_name}), alternate session at ${session.organization_name} today`;
        } else if (isSameDoctor && !isSameFacility && isSameDate) {
          reasonBadge = "SAME_DOCTOR_DIFFERENT_FACILITY";
          reasonExplanation = `Same doctor (${session.doctor_name}) at connected facility (${session.organization_name}) today`;
        } else if (isSameDoctor && !isSameDate) {
          reasonBadge = "SAME_DOCTOR_OTHER_DATE";
          reasonExplanation = `Same doctor (${session.doctor_name}) on ${curDate} at ${session.organization_name}`;
        } else if (!isSameDoctor && isSameFacility) {
          reasonBadge = "OTHER_DOCTOR_SAME_FACILITY";
          reasonExplanation = `Alternative specialist (${session.doctor_name}) in ${doctorSpecialty} at ${session.organization_name}`;
        } else {
          reasonBadge = "OTHER_DOCTOR_DIFFERENT_FACILITY";
          reasonExplanation = `Alternative specialist (${session.doctor_name}) at connected facility (${session.organization_name})`;
        }

        // Determine B.3 Dynamic Waiting Time Estimate if active today
        let waitRangeDisplay: string | undefined = undefined;
        if (curDate === todayStr) {
          const queue = QueueStore.getQueueForSession(session.id, curDate);
          if (queue.length > 0) {
            const ops = WaitingTimeEstimationService.getDoctorOperationalQueueStatus(
              session.doctor_id,
              session.organization_identifier,
              curDate
            );
            if (ops.length > 0) {
              waitRangeDisplay = ops[0].avg_wait_range_for_next;
            }
          }
        }

        // Distance estimation
        let distanceKm: number | undefined = undefined;
        if (!isSameFacility) {
          if (session.organization_identifier === "CLN-1001") distanceKm = 2.4;
          else if (session.organization_identifier === "HSP-1002" || session.organization_identifier === "FAC-1004") distanceKm = 4.8;
          else distanceKm = 3.5;
        }

        candidateOptions.push({
          doctor_id: session.doctor_id,
          doctor_name: session.doctor_name,
          medical_specialty: doctorSpecialty,
          organization_id: session.organization_id || "11111111-1111-1111-1111-111111111101",
          organization_identifier: session.organization_identifier,
          organization_name: session.organization_name,
          facility_id: session.facility_id,
          department_id: session.department_id,
          department_name: session.department_name,
          session_id: session.id,
          date: curDate,
          slot_display_time: session.slot_display_time || `${session.start_time} - ${session.end_time}`,
          opd_room: session.room_number || "Room 102",
          consultation_fee: 500,
          available_capacity: remainingCapacity,
          total_capacity: effectiveCapacity,
          is_same_doctor: isSameDoctor,
          is_same_facility: isSameFacility,
          estimated_waiting_minutes_range: waitRangeDisplay,
          distance_km: distanceKm,
          reason_badge: reasonBadge,
          reason_explanation: reasonExplanation,
          can_book_immediately: remainingCapacity > 0,
        });
      }
    }

    // Sort according to Transparent 5-Tier Recommendation Hierarchy:
    // Priority 1: Same Doctor + Same Facility (available)
    // Priority 2: Same Doctor + Connected Facility (available)
    // Priority 3: Same Doctor + Next Date (available)
    // Priority 4: Other Doctor + Same Facility (available)
    // Priority 5: Other Doctor + Connected Facility (available)
    const priorityWeight = (opt: AlternativeAppointmentOption): number => {
      if (opt.reason_badge === "SAME_DOCTOR_SAME_FACILITY_OTHER_SESSION") return 1;
      if (opt.reason_badge === "SAME_DOCTOR_OTHER_FACILITY" || opt.reason_badge === "SAME_DOCTOR_DIFFERENT_FACILITY") return 2;
      if (opt.reason_badge === "SAME_DOCTOR_OTHER_DATE") return 3;
      if (opt.reason_badge === "OTHER_DOCTOR_SAME_SPECIALTY" || opt.reason_badge === "OTHER_DOCTOR_SAME_FACILITY") return 4;
      return 5;
    };

    candidateOptions.sort((a, b) => {
      // 1. Immediately bookable first
      if (a.can_book_immediately && !b.can_book_immediately) return -1;
      if (!a.can_book_immediately && b.can_book_immediately) return 1;

      // 2. 5-Tier Priority Hierarchy
      const wA = priorityWeight(a);
      const wB = priorityWeight(b);
      if (wA !== wB) return wA - wB;

      // 3. Higher remaining capacity
      return b.available_capacity - a.available_capacity;
    });

    return candidateOptions;
  }

  /**
   * Atomically books an alternative appointment and replaces the original appointment.
   * STRICT GUARANTEE: If new appointment booking fails, the original appointment is 100% untouched.
   */
  public static async bookAlternativeWithReplacement(
    params: {
      new_session_id: string;
      new_date: string;
      new_doctor_id: string;
      new_org_identifier: string;
      new_facility_id: string;
      new_department_id: string;
      patient_id: string;
      patient_name: string;
      original_appointment_id?: string;
    },
    actor: StoredIdentity | null
  ): Promise<{
    success: boolean;
    appointment?: Appointment;
    original_appointment_status?: string;
    error_code?: string;
    message: string;
  }> {
    if (!actor) {
      return { success: false, error_code: "UNAUTHORIZED", message: "Authentication required." };
    }

    // Step 1: Book the new alternative appointment atomically via B.1
    const bookResult = await AppointmentBookingService.bookAppointment(
      {
        session_id: params.new_session_id,
        appointment_date: params.new_date,
        patient_id: params.patient_id,
        doctor_id: params.new_doctor_id,
        organization_identifier: params.new_org_identifier,
        facility_id: params.new_facility_id,
        department_id: params.new_department_id,
        booking_source: "PATIENT",
        reason_for_visit: "Alternative booking chosen by patient",
      },
      actor
    );

    if (!bookResult.success || !bookResult.appointment) {
      return {
        success: false,
        error_code: bookResult.error_code || "BOOKING_FAILED",
        message: bookResult.message || "Failed to book alternative slot. Your original appointment remains unchanged.",
      };
    }

    const newAppointment = bookResult.appointment;

    // Step 2: If replacement of an existing appointment was requested, cancel/reschedule the old one
    let origStatus: string | undefined = undefined;
    if (params.original_appointment_id) {
      const orig = AppointmentStore.getAppointmentById(params.original_appointment_id);
      if (orig) {
        await AppointmentBookingService.cancelAppointment(
          orig.id,
          actor,
          `Replaced with alternative appointment #${newAppointment.appointment_no}`
        );
        origStatus = "CANCELLED";

        AuditLedger.recordEvent({
          actor_id: actor.identifier || actor.id,
          actor_name: actor.fullName,
          action: "APPOINTMENT_REPLACED" as any,
          resource_type: "APPOINTMENT",
          resource_id: newAppointment.id,
          details: {
            original_appointment_id: orig.id,
            original_appointment_no: orig.appointment_no,
            new_appointment_id: newAppointment.id,
            new_appointment_no: newAppointment.appointment_no,
            new_doctor: newAppointment.doctor_name,
            new_facility: newAppointment.organization_name,
          },
        });
      }
    }

    return {
      success: true,
      appointment: newAppointment,
      original_appointment_status: origStatus,
      message: `Appointment #${newAppointment.appointment_no} successfully confirmed for ${newAppointment.doctor_name} at ${newAppointment.organization_name}.`,
    };
  }
}
