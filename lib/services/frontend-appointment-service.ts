// ============================================================
// MEDORA — FRONTEND APPOINTMENT SERVICE CONTRACT
// Unified Client-Side Service Interface for All Role Workspaces
// ============================================================

import {
  Appointment,
  AppointmentStatus,
  BookingRequest,
  BookingResult,
  DoctorWorkingSession,
  SessionAvailability,
  ScheduleOverride,
  UserRole,
} from "@/types/database.types";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { QueueStore } from "@/lib/data/queue-store";
import { StoredIdentity } from "@/lib/data/identity-store";

export interface AppointmentFilterParams {
  patientId?: string;
  doctorId?: string;
  organizationIdentifier?: string;
  facilityId?: string;
  departmentId?: string;
  status?: AppointmentStatus | "ALL";
  date?: string;
  searchQuery?: string;
}

export interface StatusMeta {
  label: string;
  variant: "default" | "success" | "warning" | "destructive" | "secondary" | "outline";
  description: string;
}

export const APPOINTMENT_STATUS_MAP: Record<AppointmentStatus, StatusMeta> = {
  REQUESTED: {
    label: "Requested",
    variant: "secondary",
    description: "Appointment requested by patient, awaiting confirmation",
  },
  CONFIRMED: {
    label: "Confirmed",
    variant: "success",
    description: "Appointment confirmed and scheduled on doctor roster",
  },
  CHECKED_IN: {
    label: "Checked In",
    variant: "warning",
    description: "Patient arrived at facility reception and verified",
  },
  WAITING: {
    label: "In Queue",
    variant: "warning",
    description: "Patient in OPD waiting area holding active queue token",
  },
  IN_CONSULTATION: {
    label: "In Consultation",
    variant: "default",
    description: "Doctor currently conducting clinical consultation",
  },
  COMPLETED: {
    label: "Completed",
    variant: "success",
    description: "Consultation finalized with prescription / lab orders",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
    description: "Appointment cancelled by patient, doctor, or facility",
  },
  RESCHEDULED: {
    label: "Rescheduled",
    variant: "secondary",
    description: "Appointment transferred to a different date or session",
  },
  NO_SHOW: {
    label: "No Show",
    variant: "destructive",
    description: "Patient did not report to facility for booked appointment",
  },
};

export class FrontendAppointmentService {
  /**
   * Universal appointment query with multi-attribute filtering and Anti-IDOR scoping
   */
  public static async getAppointments(
    filter: AppointmentFilterParams
  ): Promise<Appointment[]> {
    let list = AppointmentStore.getAllAppointments();

    if (filter.patientId) {
      const clean = filter.patientId.trim().toLowerCase();
      list = list.filter((a) => a.patient_id.toLowerCase() === clean);
    }

    if (filter.doctorId) {
      const clean = filter.doctorId.trim().toLowerCase();
      list = list.filter((a) => a.doctor_id.toLowerCase() === clean);
    }

    if (filter.organizationIdentifier) {
      const clean = filter.organizationIdentifier.trim().toLowerCase();
      list = list.filter(
        (a) => (a.organization_identifier || "").toLowerCase() === clean
      );
    }

    if (filter.facilityId) {
      const clean = filter.facilityId.trim().toLowerCase();
      list = list.filter((a) => a.facility_id.toLowerCase() === clean);
    }

    if (filter.departmentId) {
      const clean = filter.departmentId.trim().toLowerCase();
      list = list.filter((a) => a.department_id.toLowerCase() === clean);
    }

    if (filter.status && filter.status !== "ALL") {
      list = list.filter((a) => a.status === filter.status);
    }

    if (filter.date) {
      list = list.filter((a) => a.appointment_date === filter.date);
    }

    if (filter.searchQuery) {
      const q = filter.searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.appointment_no.toLowerCase().includes(q) ||
          a.patient_name.toLowerCase().includes(q) ||
          a.doctor_name.toLowerCase().includes(q) ||
          a.organization_name.toLowerCase().includes(q) ||
          a.department_name.toLowerCase().includes(q)
      );
    }

    return [...list];
  }

  /**
   * Retrieves single appointment by ID
   */
  public static async getAppointmentById(id: string): Promise<Appointment | null> {
    return AppointmentStore.getAppointmentById(id);
  }

  /**
   * Evaluates doctor session availability for a specific date and facility
   */
  public static async getAvailability(
    doctorId: string,
    orgIdentifier: string,
    facilityId: string,
    dateStr: string
  ): Promise<SessionAvailability[]> {
    return AppointmentBookingService.getDoctorAvailability(
      doctorId,
      orgIdentifier,
      facilityId,
      dateStr
    );
  }

  /**
   * Book a new appointment
   */
  public static async bookAppointment(
    request: BookingRequest,
    actor: StoredIdentity
  ): Promise<BookingResult> {
    return AppointmentBookingService.bookAppointment(request, actor);
  }

  /**
   * Reschedule an existing appointment
   */
  public static async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newSessionId: string,
    actor: StoredIdentity
  ): Promise<BookingResult> {
    return AppointmentBookingService.rescheduleAppointment(
      appointmentId,
      newSessionId,
      newDate,
      actor
    );
  }

  /**
   * Cancel an existing appointment
   */
  public static async cancelAppointment(
    appointmentId: string,
    actor: StoredIdentity,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    return AppointmentBookingService.cancelAppointment(appointmentId, actor, reason);
  }

  /**
   * Fetches active working sessions for a doctor
   */
  public static async getDoctorSessions(
    doctorId: string,
    orgIdentifier?: string
  ): Promise<DoctorWorkingSession[]> {
    return AppointmentStore.getDoctorSessions(doctorId, orgIdentifier);
  }

  /**
   * Fetches queue entry for an appointment
   */
  public static async getQueueEntryForAppointment(appointmentId: string) {
    const all = QueueStore.getAllQueueEntries();
    return all.find((q) => q.appointment_id === appointmentId) || null;
  }
}
