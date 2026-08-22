import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, jsonError, jsonUnauthorized } from "@/lib/api/api-utils";
import { AppointmentStore } from "@/lib/data/appointment-store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return jsonUnauthorized();

  const appointmentId = params.id;
  const appointment = AppointmentStore.getAppointmentById(appointmentId);

  if (!appointment) {
    return jsonError("Appointment not found.", "APPOINTMENT_NOT_FOUND", 404);
  }

  // Authorization Check (Anti-IDOR)
  if (user.role === "patient") {
    const userPatientId = user.identifier || user.id;
    if (appointment.patient_id.toLowerCase() !== userPatientId.toLowerCase() && (user.role as string) !== "admin") {
      return jsonError("Access denied to patient appointment.", "FORBIDDEN", 403);
    }
  } else if (user.role === "doctor") {
    const userDoctorId = user.identifier || user.id;
    if (appointment.doctor_id.toLowerCase() !== userDoctorId.toLowerCase() && (user.role as string) !== "admin") {
      return jsonError("Access denied to doctor appointment.", "FORBIDDEN", 403);
    }
  }

  return jsonResponse({ success: true, data: appointment });
}
