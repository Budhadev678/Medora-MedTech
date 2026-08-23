import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized } from "@/lib/api/api-utils";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { AppointmentStore } from "@/lib/data/appointment-store";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId") || (user.role === "patient" ? user.identifier || user.id : undefined);
  const doctorId = searchParams.get("doctorId") || (user.role === "doctor" ? user.identifier || user.id : undefined);

  if (user.role === "patient" && patientId && patientId !== user.identifier && patientId !== user.id && (user.role as string) !== "admin") {
    return jsonError("Access denied. Patient identity mismatch.", "FORBIDDEN", 403);
  }

  let appointments = AppointmentStore.getAllAppointments();

  if (patientId) {
    appointments = appointments.filter((a) => a.patient_id === patientId);
  } else if (doctorId) {
    appointments = appointments.filter((a) => a.doctor_id === doctorId);
  }

  return jsonResponse({ success: true, data: appointments });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  try {
    const body = await request.json();
    const { doctor_id, facility_id, appointment_date, time_slot, session_id, reason } = body;

    const patientId = user.role === "patient" ? user.identifier || user.id : body.patient_id || "PAT-1001";
    const patientName = user.role === "patient" ? user.fullName : body.patient_name || "Rahul Verma";

    const result = await AppointmentBookingService.bookAppointment(
      {
        session_id: session_id || "SES-1002",
        patient_id: patientId,
        doctor_id: doctor_id || "DOC-1001",
        facility_id: facility_id || "FAC-1001",
        organization_identifier: "HSP-1001",
        appointment_date: appointment_date || "2026-08-24",
        reason_for_visit: reason || "Consultation",
        booking_source: "PATIENT",
      },
      user
    );

    if (!result.success) {
      return jsonError(result.message || "Appointment booking failed.", result.error_code || "BOOKING_FAILED", 400);
    }

    return jsonResponse({ success: true, data: result.appointment }, 201);
  } catch (err: any) {
    return jsonError(err.message || "Failed to process appointment booking.", "INTERNAL_ERROR", 500);
  }
}
