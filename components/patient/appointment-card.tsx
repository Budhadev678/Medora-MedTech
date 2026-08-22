"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Stethoscope, 
  ChevronRight, 
  AlertCircle, 
  XCircle, 
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Appointment } from "@/types/database.types";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { QueueManagementService } from "@/lib/services/queue-management-service";
import { getTodayDateStr, QueueStore } from "@/lib/data/queue-store";
import { useAuth } from "@/lib/auth/auth-context";

export interface AppointmentCardProps {
  appointment: Appointment;
  onRefresh?: () => void;
}

export function AppointmentCard({ appointment, onRefresh }: AppointmentCardProps) {
  const { user } = useAuth();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);

  const todayStr = getTodayDateStr();
  const isToday = appointment.appointment_date === todayStr;
  const existingQueue = QueueStore.getQueueEntryByAppointmentId(appointment.id);
  const isCheckedIn = appointment.status === "CHECKED_IN" || Boolean(existingQueue);

  const getStatusBadge = () => {
    switch (appointment.status) {
      case "CONFIRMED":
        return <Badge variant="teal" className="text-[10px]">● Confirmed</Badge>;
      case "COMPLETED":
        return <Badge variant="success" className="text-[10px]">● Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive" className="text-[10px]">● Cancelled</Badge>;
      case "RESCHEDULED":
        return <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200">● Rescheduled</Badge>;
      case "CHECKED_IN":
        return <Badge variant="warning" className="text-[10px]">● Checked In</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">● {appointment.status}</Badge>;
    }
  };

  const handleSelfCheckIn = async () => {
    if (!user) return;
    setIsCheckingIn(true);
    setActionMessage(null);
    try {
      const res = await QueueManagementService.checkInAppointment(
        {
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          organization_identifier: appointment.organization_identifier,
          facility_id: appointment.facility_id,
          department_id: appointment.department_id,
          session_id: appointment.session_id,
          date: appointment.appointment_date,
          source: "APPOINTMENT",
          checkin_source: "PATIENT_SELF",
        },
        user
      );

      if (res.success) {
        setCheckInSuccess(res.message);
        if (onRefresh) onRefresh();
      } else {
        setActionMessage(res.message);
      }
    } catch (err: any) {
      setActionMessage(err.message || "Failed to complete check-in.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setActionMessage(null);
    try {
      const res = await AppointmentBookingService.cancelAppointment(
        appointment.id,
        user,
        cancelReason || "Patient requested cancellation"
      );
      if (res.success) {
        setShowCancelModal(false);
        if (onRefresh) onRefresh();
      } else {
        setActionMessage(res.message);
      }
    } catch (err: any) {
      setActionMessage(err.message || "Failed to cancel appointment.");
    } finally {
      setIsCancelling(false);
    }
  };

  const isUpcoming = appointment.status === "CONFIRMED" || appointment.status === "REQUESTED";

  return (
    <Card className="bg-white border-slate-200 hover:border-teal-300 transition-all shadow-xs rounded-2xl">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg font-mono">
            {appointment.appointment_no}
          </span>
          {getStatusBadge()}
        </div>

        <div className="flex items-start gap-3 mt-2">
          <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-bold text-slate-900 truncate">
              {appointment.doctor_name}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium truncate">
              {appointment.department_name} • {appointment.organization_name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-2.5 text-xs text-slate-600">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            <span>{appointment.appointment_date}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{appointment.slot_display_time}</span>
          </div>
        </div>

        {appointment.reason_for_visit && (
          <p className="text-[11px] text-slate-500 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
            "{appointment.reason_for_visit}"
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-1 truncate max-w-[200px]">
            <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{appointment.organization_name} ({appointment.opd_room || "OPD Room"})</span>
          </div>
          {(appointment.token_number || existingQueue?.token_number) && (
            <span className="font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md font-mono">
              Token #{appointment.token_number || existingQueue?.token_number}
            </span>
          )}
        </div>

        {/* Check-in Success Banner */}
        {checkInSuccess && (
          <div className="rounded-xl bg-teal-50 border border-teal-200 p-2.5 text-xs text-teal-800 font-medium flex items-center gap-2 animate-in fade-in-50">
            <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
            <span>{checkInSuccess}</span>
          </div>
        )}

        {/* Error Alert */}
        {actionMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Cancellation Reason if Cancelled */}
        {appointment.status === "CANCELLED" && appointment.cancellation_reason && (
          <div className="rounded-lg bg-red-50/80 border border-red-200 p-2 text-[11px] text-red-700">
            <strong className="font-semibold">Cancellation Note:</strong> {appointment.cancellation_reason}
          </div>
        )}

        {/* Action Bar for Active Appointments */}
        {isUpcoming && !isCheckedIn && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            {isToday ? (
              <Button
                size="sm"
                onClick={handleSelfCheckIn}
                disabled={isCheckingIn}
                className="h-8 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                {isCheckingIn ? "Checking in..." : "Check In for Today's Visit"}
              </Button>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium italic">
                Check-in opens on {appointment.appointment_date}
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="h-8 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          </div>
        )}

        {/* Action Bar if Already Checked-In */}
        {isCheckedIn && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
              Checked In • Waiting for Call
            </span>
            <Link href="/patient">
              <Button size="sm" variant="outline" className="h-8 text-xs font-semibold rounded-xl text-teal-700 border-teal-200">
                <span>View in Live Queue</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cancel Appointment?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to cancel your session with {appointment.doctor_name}? Your slot will be released back to other patients.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">Reason for Cancellation (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Schedule conflict, feeling better"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-teal-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-xl h-9 text-xs font-semibold"
                disabled={isCancelling}
              >
                Keep Appointment
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 rounded-xl h-9 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
