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
} from "lucide-react";
import { Appointment } from "@/types/database.types";
import { FrontendAppointmentService } from "@/lib/services/frontend-appointment-service";
import { AppointmentStatusBadge } from "@/components/appointment/appointment-status-badge";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function DoctorAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAppointment = async () => {
    if (!appointmentId) return;
    setIsLoading(true);
    const record = await FrontendAppointmentService.getAppointmentById(appointmentId);
    setAppointment(record);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAppointment();
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

  const isCheckedIn = appointment.status === "CHECKED_IN" || appointment.status === "WAITING";

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

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-600 bg-slate-200/70 px-2.5 py-0.5 rounded-md">
                {appointment.appointment_no}
              </span>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <div className="text-xs text-slate-500">
              Source: {appointment.booking_source || "PATIENT"} | Registered Date: {formatDate(appointment.created_at || appointment.appointment_date)}
            </div>
          </div>

          {appointment.token_number && (
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">OPD Token</div>
              <div className="text-2xl font-mono font-bold text-teal-800">#{appointment.token_number}</div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Patient Details & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-100">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Patient Demographics</div>
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <User className="h-4 w-4 text-blue-700" />
                {appointment.patient_name}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Patient Identifier: {appointment.patient_id}
              </div>
              {appointment.patient_phone && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {appointment.patient_phone}
                </div>
              )}
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
              <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {formatDate(appointment.appointment_date)} at {appointment.slot_display_time || appointment.scheduled_time}
              </div>
            </div>
          </div>

          {/* Clinical Reason */}
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Presenting Complaint / Reason</div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
              {appointment.reason_for_visit || "General Outpatient Clinical Consultation"}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
          {isCheckedIn && (
            <Link href={`/doctor/consultations?patientId=${appointment.patient_id}&appointmentId=${appointment.id}`}>
              <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-xs h-9">
                <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                Start SOAP Consultation
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
