"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  User,
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlertCircle,
  Phone,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Appointment, AppointmentStatus } from "@/types/database.types";
import { FrontendAppointmentService } from "@/lib/services/frontend-appointment-service";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { ConsultationService } from "@/lib/services/consultation-service";
import { QueueManagementService } from "@/lib/services/queue-management-service";
import { AppointmentStatusBadge } from "@/components/appointment/appointment-status-badge";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export default function DoctorAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const appointmentId = params?.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActing, setIsActing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadAppointment = async () => {
    if (!appointmentId) return;
    setIsLoading(true);
    const record = await FrontendAppointmentService.getAppointmentById(appointmentId);
    setAppointment(record);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAppointment();
    const handleUpdate = () => loadAppointment();
    window.addEventListener("medora-appointments-updated", handleUpdate);
    window.addEventListener("medora-appointment-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-appointments-updated", handleUpdate);
      window.removeEventListener("medora-appointment-updated", handleUpdate);
    };
  }, [appointmentId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
        <div className="h-48 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Appointment Record Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested clinical appointment does not exist in the active roster.
        </p>
        <Link href="/doctor/appointments">
          <Button variant="default" size="sm" className="bg-teal-700 hover:bg-teal-800 text-xs mt-2">
            Return to Clinical Queue
          </Button>
        </Link>
      </div>
    );
  }

  const handleUpdateStatus = async (newStatus: AppointmentStatus) => {
    if (!appointment || isActing) return;
    setIsActing(true);
    setActionMessage(null);
    try {
      const updated = AppointmentStore.saveAppointment({
        ...appointment,
        status: newStatus,
        updated_at: new Date().toISOString(),
      });
      setAppointment(updated);
      setActionMessage({ type: "success", text: `Appointment status updated to ${newStatus}.` });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to update appointment." });
    } finally {
      setIsActing(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment || !user || isActing) return;
    const reason = window.prompt("Please enter the reason for clinical cancellation:") || "Cancelled by attending doctor";
    setIsActing(true);
    setActionMessage(null);
    try {
      const res = await AppointmentBookingService.cancelAppointment(appointment.id, user, reason);
      if (res.success) {
        setActionMessage({ type: "success", text: "Appointment has been cancelled." });
        loadAppointment();
      } else {
        setActionMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to cancel appointment." });
    } finally {
      setIsActing(false);
    }
  };

  const handleOpenConsultation = async () => {
    if (!appointment || !user || isActing) return;
    setIsActing(true);
    try {
      const res = await ConsultationService.startOrGetConsultationForAppointment(appointment.id, user);
      if (res.success && res.encounter) {
        router.push(`/doctor/consultations/${res.encounter.id}`);
        return;
      }
      router.push(`/doctor/consultations?patientId=${appointment.patient_id}&appointmentId=${appointment.id}`);
    } catch {
      router.push(`/doctor/consultations?patientId=${appointment.patient_id}&appointmentId=${appointment.id}`);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/doctor/appointments" className="hover:text-teal-700 flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          Clinical Queue & Appointments
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-800">{appointment.appointment_no}</span>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Appointment Information Card */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 font-mono font-bold text-sm">
              {appointment.token_number ? `#${appointment.token_number}` : "OPD"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  {appointment.patient_name}
                </h1>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                  {appointment.appointment_no}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Scheduled Consultation with {appointment.doctor_name}
              </p>
            </div>
          </div>

          <div>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Patient Details</div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <User className="h-4 w-4 text-slate-700" />
                {appointment.patient_name}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Patient Identifier: {appointment.patient_id}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Facility & Session</div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Building2 className="h-4 w-4 text-slate-700" />
                {appointment.organization_name}
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                {appointment.department_name} ({appointment.opd_room || "Room 102"})
              </div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
          {appointment.status === "REQUESTED" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("CONFIRMED")}
              disabled={isActing}
              className="bg-teal-700 hover:bg-teal-800 text-xs font-bold rounded-xl"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm Appointment
            </Button>
          )}

          {appointment.status === "CONFIRMED" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("CHECKED_IN")}
              disabled={isActing}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
            >
              Admit to Queue
            </Button>
          )}

          {appointment.status === "IN_CONSULTATION" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("COMPLETED")}
              disabled={isActing}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Completed
            </Button>
          )}

          {appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isActing}
              className="text-rose-700 border-rose-200 hover:bg-rose-50 text-xs font-semibold rounded-xl"
            >
              Cancel Appointment
            </Button>
          )}

          <Button 
            size="sm" 
            onClick={handleOpenConsultation}
            disabled={isActing}
            className="bg-teal-700 hover:bg-teal-800 text-xs h-9 rounded-xl font-bold gap-1.5"
          >
            {isActing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Opening Clinical Workspace...</span>
              </>
            ) : (
              <>
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Clinical Consultation Desk</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
