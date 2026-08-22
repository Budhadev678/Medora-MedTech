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
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Appointment } from "@/types/database.types";
import { FrontendAppointmentService } from "@/lib/services/frontend-appointment-service";
import { AppointmentStatusBadge } from "@/components/appointment/appointment-status-badge";
import { RescheduleModal } from "@/components/appointment/reschedule-modal";
import { CancelModal } from "@/components/appointment/cancel-modal";
import { QueueManagementService } from "@/lib/services/queue-management-service";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function HospitalAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const appointmentId = params?.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState<boolean>(false);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);

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

  const handleCheckIn = async () => {
    if (!appointment || !user) return;
    setIsCheckingIn(true);
    try {
      const result = await QueueManagementService.checkInAppointment(
        {
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
        },
        user
      );
      if (result.success) {
        loadAppointment();
      } else {
        alert(result.message || "Failed to check in patient.");
      }
    } catch (err: any) {
      alert(err.message || "Check-in failed.");
    } finally {
      setIsCheckingIn(false);
    }
  };

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
          The requested appointment record does not exist in this hospital repository.
        </p>
        <Link href="/hospital/appointments">
          <Button variant="default" size="sm" className="bg-teal-700 hover:bg-teal-800 text-xs mt-2">
            Return to Appointments Desk
          </Button>
        </Link>
      </div>
    );
  }

  const isConfirmed = appointment.status === "CONFIRMED";
  const isActionable = appointment.status === "CONFIRMED" || appointment.status === "REQUESTED";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/hospital/appointments" className="hover:text-teal-700 flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          Hospital Appointments Desk
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
              Facility: {appointment.organization_name} ({appointment.facility_id})
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
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-100">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Patient Details</div>
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <User className="h-4 w-4 text-blue-700" />
                {appointment.patient_name}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                ID: {appointment.patient_id}
              </div>
              {appointment.patient_phone && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {appointment.patient_phone}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Attending Physician & OPD</div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Stethoscope className="h-4 w-4 text-teal-700" />
                {appointment.doctor_name}
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

          {/* Reason */}
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Reason for Visit</div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
              {appointment.reason_for_visit || "General Outpatient Clinical Consultation"}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
          {isConfirmed && (
            <Button
              size="sm"
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className="bg-teal-700 hover:bg-teal-800 text-xs h-9"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              {isCheckingIn ? "Checking In..." : "Check In Patient"}
            </Button>
          )}

          {isActionable && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRescheduleOpen(true)}
                className="text-xs h-9 text-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Reschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelOpen(true)}
                className="text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <RescheduleModal
        appointment={appointment}
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onSuccess={() => loadAppointment()}
      />

      <CancelModal
        appointment={appointment}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onSuccess={() => loadAppointment()}
      />
    </div>
  );
}
