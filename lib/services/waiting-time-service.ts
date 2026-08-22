// ============================================================
// MEDORA — DYNAMIC WAITING-TIME ESTIMATION ENGINE SERVICE
// MODIFICATION PHASE B.3
// ============================================================

import {
  WaitingEstimateResult,
  WaitingEstimateConfidence,
  DoctorDelayStatus,
  DoctorOperationalQueueStatus,
  HistoricalConsultationMetric,
  QueueEntry,
} from "@/types/database.types";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { ConsultationHistoryStore } from "@/lib/data/consultation-history-store";
import { StoredIdentity, findIdentityById } from "@/lib/data/identity-store";

export class WaitingTimeEstimationService {
  /**
   * Authoritative, deterministic, and real-time waiting-time estimation algorithm.
   * Considers:
   * 1. Active Queue State (current patient in consultation + people ahead).
   * 2. Elapsed Duration of current consultation.
   * 3. Robust historical consultation statistics (Median, P25, P75).
   * 4. Schedule delays and breaks.
   *
   * STRICT GUARANTEES:
   * - Never forces doctors to finish consultations.
   * - Never promises exact minutes ("Estimated 20–35 min", not "9:32 AM").
   * - Never produces negative waiting minutes.
   */
  public static calculatePatientWaitingEstimate(
    queueEntryId: string,
    actor: StoredIdentity | null
  ): WaitingEstimateResult {
    const now = new Date();
    const nowIso = now.toISOString();

    const entry = QueueStore.getQueueEntryById(queueEntryId);
    if (!entry) {
      return {
        token_number: "N/A",
        status: "NOT_CHECKED_IN",
        people_ahead: 0,
        estimated_lower_minutes: 0,
        estimated_upper_minutes: 0,
        display_text: "Queue record not found",
        confidence: "UNAVAILABLE",
        delay_status: "UNKNOWN",
        delay_minutes: 0,
        doctor_name: "Specialist",
        department_name: "OPD",
        organization_name: "Hospital",
        generated_at: nowIso,
        is_stale: false,
        algorithm_version: "B3_DETERMINISTIC_V1",
      };
    }

    // 1. Authorization Verification (Patient can see own estimate; Staff/Doctor can see facility)
    if (actor && actor.role === "patient") {
      const isSelf =
        (actor.id && actor.id.toLowerCase() === entry.patient_id?.toLowerCase()) ||
        (actor.identifier && actor.identifier.toLowerCase() === entry.patient_id?.toLowerCase()) ||
        (actor.email && actor.email.toLowerCase() === entry.patient_id?.toLowerCase());
      if (!isSelf) {
        return {
          queue_entry_id: entry.id,
          token_number: entry.token_number,
          status: entry.status,
          people_ahead: 0,
          estimated_lower_minutes: 0,
          estimated_upper_minutes: 0,
          display_text: "Unauthorized",
          confidence: "UNAVAILABLE",
          confidence_reason: "Access denied to third-party patient waiting estimate.",
          delay_status: "UNKNOWN",
          delay_minutes: 0,
          doctor_name: entry.doctor_name,
          department_name: entry.department_name,
          organization_name: entry.organization_name,
          generated_at: nowIso,
          is_stale: false,
          algorithm_version: "B3_DETERMINISTIC_V1",
        };
      }
    }

    // 2. State-Specific Immediate Transitions
    if (entry.status === "CALLED") {
      return {
        queue_entry_id: entry.id,
        token_number: entry.token_number,
        status: entry.status,
        people_ahead: 0,
        estimated_lower_minutes: 0,
        estimated_upper_minutes: 3,
        display_text: `Your token has been called — Please proceed to ${entry.room_number || "Room 102"}`,
        confidence: "HIGH",
        delay_status: "ON_TRACK",
        delay_minutes: 0,
        doctor_name: entry.doctor_name,
        department_name: entry.department_name,
        organization_name: entry.organization_name,
        room_number: entry.room_number,
        generated_at: nowIso,
        is_stale: false,
        algorithm_version: "B3_DETERMINISTIC_V1",
      };
    }

    if (entry.status === "IN_CONSULTATION") {
      return {
        queue_entry_id: entry.id,
        token_number: entry.token_number,
        status: entry.status,
        people_ahead: 0,
        estimated_lower_minutes: 0,
        estimated_upper_minutes: 0,
        display_text: "Consultation in progress",
        confidence: "HIGH",
        delay_status: "ON_TRACK",
        delay_minutes: 0,
        doctor_name: entry.doctor_name,
        department_name: entry.department_name,
        organization_name: entry.organization_name,
        room_number: entry.room_number,
        generated_at: nowIso,
        is_stale: false,
        algorithm_version: "B3_DETERMINISTIC_V1",
      };
    }

    if (entry.status === "COMPLETED") {
      return {
        queue_entry_id: entry.id,
        token_number: entry.token_number,
        status: entry.status,
        people_ahead: 0,
        estimated_lower_minutes: 0,
        estimated_upper_minutes: 0,
        display_text: "Consultation completed",
        confidence: "HIGH",
        delay_status: "ON_TRACK",
        delay_minutes: 0,
        doctor_name: entry.doctor_name,
        department_name: entry.department_name,
        organization_name: entry.organization_name,
        generated_at: nowIso,
        is_stale: false,
        algorithm_version: "B3_DETERMINISTIC_V1",
      };
    }

    if (entry.status === "SKIPPED") {
      return {
        queue_entry_id: entry.id,
        token_number: entry.token_number,
        status: entry.status,
        people_ahead: 0,
        estimated_lower_minutes: 0,
        estimated_upper_minutes: 0,
        display_text: "Your token was skipped — Please contact reception desk",
        confidence: "LOW",
        delay_status: "UNKNOWN",
        delay_minutes: 0,
        doctor_name: entry.doctor_name,
        department_name: entry.department_name,
        organization_name: entry.organization_name,
        generated_at: nowIso,
        is_stale: false,
        algorithm_version: "B3_DETERMINISTIC_V1",
      };
    }

    if (entry.status === "NO_SHOW" || entry.status === "CANCELLED" || entry.status === "TRANSFERRED") {
      return {
        queue_entry_id: entry.id,
        token_number: entry.token_number,
        status: entry.status,
        people_ahead: 0,
        estimated_lower_minutes: 0,
        estimated_upper_minutes: 0,
        display_text: `Queue entry status: ${entry.status}`,
        confidence: "UNAVAILABLE",
        delay_status: "UNKNOWN",
        delay_minutes: 0,
        doctor_name: entry.doctor_name,
        department_name: entry.department_name,
        organization_name: entry.organization_name,
        generated_at: nowIso,
        is_stale: false,
        algorithm_version: "B3_DETERMINISTIC_V1",
      };
    }

    // 3. Active Session Queue Inspection
    const sessionQueue = QueueStore.getQueueForSession(entry.session_id, entry.date);

    // Current active patient in consultation (or called)
    const currentPatient =
      sessionQueue.find((q) => q.status === "IN_CONSULTATION") ||
      sessionQueue.find((q) => q.status === "CALLED");

    // Patients strictly ahead in WAITING sequence
    const waitingAhead = sessionQueue.filter(
      (q) => q.status === "WAITING" && q.token_sequence < entry.token_sequence
    );
    const peopleAheadCount = waitingAhead.length;

    // 4. Retrieve Historical Duration Metrics (with fallback hierarchy)
    const metrics = ConsultationHistoryStore.getConsultationMetrics(
      entry.doctor_id,
      entry.organization_identifier,
      entry.department_id
    );

    const medianMin = metrics.median_minutes;
    const p25Min = metrics.p25_minutes;
    const p75Min = metrics.p75_minutes;

    // 5. Calculate Current Consultation Remaining Duration
    let currentRemainingLower = 0;
    let currentRemainingUpper = 0;
    let currentElapsedMin = 0;

    if (currentPatient) {
      if (currentPatient.status === "IN_CONSULTATION" && currentPatient.consultation_started_at) {
        const startedTime = new Date(currentPatient.consultation_started_at).getTime();
        currentElapsedMin = Math.max(0, Math.round((now.getTime() - startedTime) / 60000));

        if (currentElapsedMin < medianMin) {
          currentRemainingLower = Math.max(1, Math.round(p25Min - currentElapsedMin));
          currentRemainingUpper = Math.max(3, Math.round(p75Min - currentElapsedMin));
        } else {
          // Current consultation is running longer than median baseline!
          // We recognize the ongoing delay without interrupting the doctor.
          currentRemainingLower = 2;
          const overrunBuffer = Math.min(15, Math.round((p75Min - medianMin) + 4));
          currentRemainingUpper = Math.max(4, overrunBuffer);
        }
      } else if (currentPatient.status === "CALLED") {
        // Patient called but consultation not yet started (room transition buffer)
        currentRemainingLower = Math.max(2, p25Min);
        currentRemainingUpper = p75Min + 3;
      }
    }

    // 6. Calculate Duration for Waiting Patients Ahead
    const aheadLower = peopleAheadCount * p25Min;
    const aheadUpper = peopleAheadCount * p75Min;

    // 7. Calculate Delay / Break Adjustments
    let delayStatus: DoctorDelayStatus = "ON_TRACK";
    let delayMinutes = 0;
    let delayNotice: string | undefined = undefined;

    const session = AppointmentStore.getSessionById(entry.session_id);
    if (session && entry.date === getTodayDateStr()) {
      // Check if session start time has arrived
      const [startHour, startMin] = session.start_time.split(":").map(Number);
      const sessionStartMs = new Date().setHours(startHour, startMin, 0, 0);
      const nowMs = now.getTime();

      // If doctor hasn't started after 15 mins of session start
      if (nowMs > sessionStartMs && !currentPatient && sessionQueue.filter((q) => q.status === "COMPLETED").length === 0) {
        const delayedMin = Math.round((nowMs - sessionStartMs) / 60000);
        if (delayedMin >= 15) {
          delayStatus = "DELAYED";
          delayMinutes = delayedMin;
          delayNotice = `Doctor is running approx. ${delayedMin}m behind schedule`;
        }
      }
    }

    // 8. Total Raw Range Computation
    let rawLower = currentRemainingLower + aheadLower;
    let rawUpper = currentRemainingUpper + aheadUpper;

    // 9. Human-Friendly Display Formatting
    let displayText = "";
    let formattedLower = 0;
    let formattedUpper = 0;

    if (peopleAheadCount === 0 && !currentPatient) {
      displayText = "You are next";
      formattedLower = 0;
      formattedUpper = 5;
    } else if (peopleAheadCount === 0 && currentPatient) {
      if (rawUpper <= 5) {
        displayText = "You are next (Very short wait)";
        formattedLower = 0;
        formattedUpper = 5;
      } else {
        formattedLower = Math.max(2, Math.floor(rawLower));
        formattedUpper = Math.max(formattedLower + 3, Math.ceil(rawUpper));
        displayText = `You are next (~${formattedLower}–${formattedUpper} min)`;
      }
    } else {
      // Round to 5-minute granular range bounds
      formattedLower = Math.max(5, Math.floor(rawLower / 5) * 5);
      formattedUpper = Math.max(formattedLower + 10, Math.ceil(rawUpper / 5) * 5);
      displayText = `${formattedLower}–${formattedUpper} min`;
    }

    // 10. Confidence Level Assignment
    let confidence: WaitingEstimateConfidence = "HIGH";
    let confidenceReason = "Based on verified historical consultation performance.";

    if (metrics.source_level === "DOCTOR_FACILITY") {
      confidence = "HIGH";
    } else if (metrics.source_level === "DOCTOR_DEPARTMENT" || metrics.source_level === "DEPARTMENT") {
      confidence = "MEDIUM";
      confidenceReason = "Based on department-level consultation statistics.";
    } else {
      confidence = "LOW";
      confidenceReason = "Based on standard specialty operational baseline.";
    }

    return {
      queue_entry_id: entry.id,
      token_number: entry.token_number,
      status: entry.status,
      people_ahead: peopleAheadCount,
      estimated_lower_minutes: formattedLower,
      estimated_upper_minutes: formattedUpper,
      display_text: displayText,
      confidence,
      confidence_reason: confidenceReason,
      delay_status: delayStatus,
      delay_minutes: delayMinutes,
      delay_notice: delayNotice,
      currently_serving_token: currentPatient?.token_number,
      current_consultation_elapsed_minutes: currentElapsedMin > 0 ? currentElapsedMin : undefined,
      doctor_name: entry.doctor_name,
      department_name: entry.department_name,
      organization_name: entry.organization_name,
      room_number: entry.room_number,
      generated_at: nowIso,
      is_stale: false,
      algorithm_version: "B3_DETERMINISTIC_V1",
    };
  }

  /**
   * Generates a structured operational queue status for provider consoles and reception desks.
   */
  public static getDoctorOperationalQueueStatus(
    doctorId: string,
    orgIdentifier: string,
    date?: string
  ): DoctorOperationalQueueStatus[] {
    const targetDate = date || getTodayDateStr();
    const sessions = AppointmentStore.getDoctorSessions(doctorId, orgIdentifier);
    const now = new Date();

    return sessions.map((session) => {
      const queue = QueueStore.getQueueForSession(session.id, targetDate);
      const metrics = ConsultationHistoryStore.getConsultationMetrics(
        session.doctor_id,
        session.organization_identifier,
        session.department_id
      );

      const currentPatient =
        queue.find((q) => q.status === "IN_CONSULTATION") ||
        queue.find((q) => q.status === "CALLED");
      const waitingList = queue.filter((q) => q.status === "WAITING");
      const completedList = queue.filter((q) => q.status === "COMPLETED");
      const skippedList = queue.filter((q) => q.status === "SKIPPED");

      let elapsedMin = 0;
      if (currentPatient?.consultation_started_at) {
        const startMs = new Date(currentPatient.consultation_started_at).getTime();
        elapsedMin = Math.max(0, Math.round((now.getTime() - startMs) / 60000));
      }

      // Delay status
      let delayStatus: DoctorDelayStatus = "ON_TRACK";
      let delayMin = 0;
      let delayNotice: string | undefined = undefined;

      const [startHour, startMin] = session.start_time.split(":").map(Number);
      const sessionStartMs = new Date().setHours(startHour, startMin, 0, 0);

      if (now.getTime() > sessionStartMs && !currentPatient && completedList.length === 0 && waitingList.length > 0) {
        const diff = Math.round((now.getTime() - sessionStartMs) / 60000);
        if (diff >= 15) {
          delayStatus = "DELAYED";
          delayMin = diff;
          delayNotice = `Started ${diff}m past scheduled session opening`;
        }
      }

      const totalWaitingMinutes = waitingList.length * metrics.median_minutes;
      const nextWaitRange =
        waitingList.length > 0
          ? `${Math.max(5, Math.floor(metrics.p25_minutes))}–${Math.ceil(metrics.p75_minutes)} min`
          : "Ready for Next";

      return {
        session_id: session.id,
        doctor_id: session.doctor_id,
        doctor_name: session.doctor_name,
        organization_identifier: session.organization_identifier,
        organization_name: session.organization_name,
        facility_id: session.facility_id,
        department_id: session.department_id,
        department_name: session.department_name,
        date: targetDate,
        session_time: session.slot_display_time || `${session.start_time} - ${session.end_time}`,
        status: currentPatient ? "IN_CONSULTATION" : "AVAILABLE",
        delay_status: delayStatus,
        delay_minutes: delayMin,
        delay_notice: delayNotice,
        active_patient: currentPatient
          ? {
              token_number: currentPatient.token_number,
              patient_name: currentPatient.patient_name,
              elapsed_minutes: elapsedMin,
              started_at: currentPatient.consultation_started_at || currentPatient.called_at || new Date().toISOString(),
            }
          : undefined,
        waiting_count: waitingList.length,
        completed_count: completedList.length,
        skipped_count: skippedList.length,
        historical_median_minutes: metrics.median_minutes,
        estimated_queue_clearance_minutes: totalWaitingMinutes,
        avg_wait_range_for_next: nextWaitRange,
      };
    });
  }
}
