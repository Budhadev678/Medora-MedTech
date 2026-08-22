"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  User,
  ArrowRight,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Layers,
  MapPin,
} from "lucide-react";
import { Appointment } from "@/types/database.types";
import { AppointmentStatusBadge } from "./appointment-status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: Appointment;
  role: "patient" | "doctor" | "hospital" | "staff";
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onCheckIn?: (appointment: Appointment) => void;
  onCallNext?: (appointment: Appointment) => void;
  showActions?: boolean;
}

export function AppointmentCard({
  appointment,
  role,
  onReschedule,
  onCancel,
  onCheckIn,
  onCallNext,
  showActions = true,
}: AppointmentCardProps) {
  const isActionable =
    appointment.status === "CONFIRMED" || appointment.status === "REQUESTED";
  const isCheckedIn = appointment.status === "CHECKED_IN" || appointment.status === "WAITING";

  const getDetailHref = () => {
    switch (role) {
      case "patient":
        return `/patient/appointments/${appointment.id}`;
      case "doctor":
        return `/doctor/appointments/${appointment.id}`;
      case "hospital":
      case "staff":
        return `/hospital/appointments/${appointment.id}`;
      default:
        return `/patient/appointments/${appointment.id}`;
    }
  };

  return (
    <article
      aria-label={`Appointment ${appointment.appointment_no} with ${appointment.doctor_name}`}
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-500/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
    >
      {/* Header: ID + Status + Queue Token Badge */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
              {appointment.appointment_no}
            </span>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          {appointment.token_number && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-md w-fit">
              <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" aria-hidden="true" />
              OPD Queue Token: #{appointment.token_number}
            </div>
          )}
        </div>

        <Link
          href={getDetailHref()}
          className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group py-1 px-2 rounded-lg hover:bg-teal-50 transition-colors"
          aria-label={`View details for appointment ${appointment.appointment_no}`}
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
      </div>

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        {/* Clinician / Patient Information */}
        <div className="space-y-2">
          {role !== "doctor" && (
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Attending Doctor</div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Stethoscope className="h-4 w-4 text-teal-700 shrink-0" aria-hidden="true" />
                <span className="truncate">{appointment.doctor_name}</span>
              </div>
            </div>
          )}
          {role !== "patient" && (
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Patient</div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <User className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
                <span className="truncate">{appointment.patient_name}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-600">
            <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="truncate font-medium">{appointment.department_name}</span>
          </div>
        </div>

        {/* Location & Schedule Context */}
        <div className="space-y-2">
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Hospital or Clinic</div>
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-hidden="true" />
              <span className="truncate">{appointment.organization_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Calendar className="h-3.5 w-3.5 text-teal-700 shrink-0" aria-hidden="true" />
            <span>{formatDate(appointment.appointment_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Clock className="h-3.5 w-3.5 text-teal-700 shrink-0" aria-hidden="true" />
            <span>{appointment.slot_display_time || appointment.scheduled_time}</span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      {showActions && (
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
          {/* Patient Actions */}
          {role === "patient" && isActionable && (
            <>
              {onReschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReschedule(appointment)}
                  className="text-xs h-9 min-w-[100px] text-slate-700 hover:bg-slate-50 rounded-xl"
                  aria-label={`Reschedule appointment ${appointment.appointment_no}`}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-500" aria-hidden="true" />
                  Reschedule
                </Button>
              )}
              {onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancel(appointment)}
                  className="text-xs h-9 min-w-[90px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl"
                  aria-label={`Cancel appointment ${appointment.appointment_no}`}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" aria-hidden="true" />
                  Cancel
                </Button>
              )}
            </>
          )}

          {/* Hospital / Staff Check-in Action */}
          {(role === "hospital" || role === "staff") && appointment.status === "CONFIRMED" && onCheckIn && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onCheckIn(appointment)}
              className="text-xs h-9 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Check In Patient
            </Button>
          )}

          {/* Doctor Consultation Action */}
          {role === "doctor" && isCheckedIn && onCallNext && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onCallNext(appointment)}
              className="text-xs h-9 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-xs"
            >
              <Stethoscope className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Call into Consultation
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
