"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Stethoscope,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowLeft,
  XCircle,
  RefreshCw,
  Sparkles,
  Phone,
  Printer,
  Share2,
  Navigation,
  FileText,
  UserCheck,
  Receipt
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { QueueManagementService } from "@/lib/services/queue-management-service";
import { Appointment, QueueEntry } from "@/types/database.types";
import { getRemainingCurrentWeekDates } from "@/lib/utils";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const appointmentId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [queueEntry, setQueueEntry] = useState<QueueEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Action Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newSessionId, setNewSessionId] = useState("");
  const [availableRescheduleSessions, setAvailableRescheduleSessions] = useState<any[]>([]);

  const loadData = () => {
    if (!appointmentId) return;
    setIsLoading(true);
    const appt = AppointmentStore.getAppointmentById(appointmentId);
    if (appt) {
      setAppointment(appt);
      const q = QueueStore.getQueueEntryByAppointmentId(appt.id);
      setQueueEntry(q);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("medora-appointment-updated", handleUpdate);
    window.addEventListener("medora-queue-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-appointment-updated", handleUpdate);
      window.removeEventListener("medora-queue-updated", handleUpdate);
    };
  }, [appointmentId]);

  const todayStr = getTodayDateStr();
  const isToday = appointment?.appointment_date === todayStr;
  const isCheckedIn = appointment?.status === "CHECKED_IN" || Boolean(queueEntry);
  const isUpcoming = appointment?.status === "CONFIRMED" || appointment?.status === "REQUESTED";

  // Self Check-in
  const handleCheckIn = async () => {
    if (!appointment || !user) return;
    setIsProcessing(true);
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
        setActionMessage({ type: "success", text: res.message || "Checked in successfully! Your queue token is generated." });
        loadData();
      } else {
        setActionMessage({ type: "error", text: res.message || "Failed to check in." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Unexpected check-in error." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel Appointment
  const handleCancel = async () => {
    if (!appointment || !user) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await AppointmentBookingService.cancelAppointment(
        appointment.id,
        user,
        cancelReason || "Patient requested cancellation"
      );
      if (res.success) {
        setShowCancelModal(false);
        setActionMessage({ type: "success", text: "Appointment cancelled successfully." });
        loadData();
      } else {
        setActionMessage({ type: "error", text: res.message || "Failed to cancel appointment." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Unexpected error during cancellation." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Load Reschedule Slots
  const handleOpenReschedule = async () => {
    if (!appointment) return;
    const remainingDates = getRemainingCurrentWeekDates();
    const defaultDate = remainingDates.find(d => d.iso !== appointment.appointment_date)?.iso || remainingDates[0]?.iso;
    setNewDate(defaultDate);
    setShowRescheduleModal(true);

    if (defaultDate) {
      try {
        const sessions = await AppointmentBookingService.getDoctorAvailability(
          appointment.doctor_id,
          appointment.organization_identifier,
          appointment.facility_id,
          defaultDate
        );
        setAvailableRescheduleSessions(sessions);
        const avail = sessions.find(s => s.status === "AVAILABLE" || s.status === "LIMITED");
        if (avail) setNewSessionId(avail.session_id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDateChangeForReschedule = async (dt: string) => {
    if (!appointment) return;
    setNewDate(dt);
    try {
      const sessions = await AppointmentBookingService.getDoctorAvailability(
        appointment.doctor_id,
        appointment.organization_identifier,
        appointment.facility_id,
        dt
      );
      setAvailableRescheduleSessions(sessions);
      const avail = sessions.find(s => s.status === "AVAILABLE" || s.status === "LIMITED");
      if (avail) setNewSessionId(avail.session_id);
      else setNewSessionId("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!appointment || !user || !newDate || !newSessionId) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await AppointmentBookingService.rescheduleAppointment(
        appointment.id,
        newDate,
        newSessionId,
        user,
        "Patient requested date/session reschedule"
      );
      if (res.success) {
        setShowRescheduleModal(false);
        setActionMessage({ type: "success", text: "Appointment rescheduled successfully!" });
        loadData();
      } else {
        setActionMessage({ type: "error", text: res.message || "Failed to reschedule." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to reschedule appointment." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={["patient", "admin"]}>
        <div className="p-12 text-center text-xs text-slate-500">Loading appointment details...</div>
      </RoleGuard>
    );
  }

  if (!appointment) {
    return (
      <RoleGuard allowedRoles={["patient", "admin"]}>
        <div className="max-w-xl mx-auto space-y-4 py-8 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Appointment Not Found</h2>
          <p className="text-xs text-slate-500">The requested appointment record does not exist or has been removed.</p>
          <Link href="/patient/appointments">
            <Button variant="outline" size="sm" className="text-xs rounded-xl">
              Back to Appointments
            </Button>
          </Link>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="max-w-2xl mx-auto space-y-5 pb-20 animate-in fade-in-50 duration-150">
        
        {/* Header & Back Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/patient/appointments"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Appointments
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
              {appointment.appointment_no}
            </span>
            <Badge
              className={`text-[10px] font-bold ${
                appointment.status === "CONFIRMED"
                  ? "bg-teal-600 text-white"
                  : appointment.status === "CHECKED_IN"
                  ? "bg-amber-600 text-white"
                  : appointment.status === "COMPLETED"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              ● {appointment.status}
            </Badge>
          </div>
        </div>

        {/* Action Feedback Toast */}
        {actionMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
              actionMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-700 text-xs">
              ✕
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 1. APPOINTMENT PASS / DIGITAL TICKET                         */}
        {/* ============================================================ */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-6 shadow-sm space-y-5">
          {/* Top Ticket Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">{appointment.doctor_name}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {appointment.department_name} • {appointment.organization_name}
                </p>
              </div>
            </div>

            {/* Token Badge */}
            {(appointment.token_number || queueEntry?.token_number) && (
              <div className="text-center bg-teal-50 border border-teal-200 px-3.5 py-1.5 rounded-2xl shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 block">Queue Token</span>
                <span className="font-mono text-lg font-black text-teal-950">
                  #{appointment.token_number || queueEntry?.token_number}
                </span>
              </div>
            )}
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-teal-600" /> Appointment Date
              </span>
              <span className="text-xs font-bold text-slate-900 block">{appointment.appointment_date}</span>
              <span className="text-[10px] text-slate-500">
                {new Date(appointment.appointment_date).toLocaleDateString("en-IN", { weekday: "long" })}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3 text-teal-600" /> Operational Window
              </span>
              <span className="text-xs font-bold text-slate-900 block">{appointment.slot_display_time}</span>
              <span className="text-[10px] text-slate-500">OPD Session Window</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-teal-600" /> Consultation Room
              </span>
              <span className="text-xs font-bold text-slate-900 block">{appointment.opd_room || "OPD Room 102"}</span>
              <span className="text-[10px] text-slate-500">{appointment.organization_name}</span>
            </div>
          </div>

          {/* Reason for Visit */}
          {appointment.reason_for_visit && (
            <div className="p-3 rounded-2xl bg-slate-100/70 text-xs text-slate-700 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Stated Clinical Purpose / Symptoms
              </span>
              <p className="font-medium text-slate-800">"{appointment.reason_for_visit}"</p>
            </div>
          )}

          {/* Live Status & Check-In Action */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {isCheckedIn ? (
              <div className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-2 rounded-2xl">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Checked In • Token #{queueEntry?.token_number || appointment.token_number} Active in OPD Queue</span>
              </div>
            ) : isToday && isUpcoming ? (
              <Button
                onClick={handleCheckIn}
                disabled={isProcessing}
                className="h-10 px-5 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-2xl shadow-xs gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isProcessing ? "Checking In..." : "Self Check-In for Today's Visit"}</span>
              </Button>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Check-in opens on visit day ({appointment.appointment_date})</span>
              </div>
            )}

            {/* Print / Save Ticket */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs h-9 rounded-2xl gap-1.5 border-slate-200 hover:bg-slate-100"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Print Slip</span>
            </Button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. CLINIC ARRIVAL GUIDANCE & HOSPITAL DIRECTIONS             */}
        {/* ============================================================ */}
        <Card className="rounded-3xl border-slate-200 shadow-xs bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-teal-600" /> Hospital Arrival Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-3 text-xs text-slate-600">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  <strong>Arrive 15 minutes before</strong> your slot window ({appointment.slot_display_time}) to verify vitals and complete initial triage.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  <strong>Self Check-In:</strong> Tap the check-in button on this pass when you arrive at {appointment.organization_name} to activate your live queue token.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <p>
                  <strong>Carry Previous Records:</strong> Bring previous physical discharge summaries or ensure digital reports are shared in your MEDORA Health Hub.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* 3. RESCHEDULE & CANCEL ACTIONS                               */}
        {/* ============================================================ */}
        {isUpcoming && (
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenReschedule}
              className="text-xs h-9 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 border-slate-200 gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reschedule Session</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="text-xs h-9 rounded-2xl font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Cancel Appointment</span>
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/* CANCEL CONFIRMATION MODAL                                    */}
        {/* ============================================================ */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Cancel Appointment?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to cancel your consultation with <strong>{appointment.doctor_name}</strong> on {appointment.appointment_date}?
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-left">
                <label className="font-semibold text-slate-700 text-[11px]">Reason for cancellation:</label>
                <input
                  type="text"
                  placeholder="e.g. Change of plans, illness resolved..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 text-xs rounded-xl"
                >
                  Keep Appointment
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isProcessing}
                  onClick={handleCancel}
                  className="flex-1 text-xs rounded-xl"
                >
                  {isProcessing ? "Cancelling..." : "Confirm Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* RESCHEDULE MODAL (Strictly Current Calendar Week)            */}
        {/* ============================================================ */}
        {showRescheduleModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-teal-600" /> Reschedule Appointment
                </h3>
                <p className="text-xs text-slate-500">
                  Select a new available date and slot within the current calendar week.
                </p>
              </div>

              {/* Date Options */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">Select Date (This Week):</label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {getRemainingCurrentWeekDates().map((d) => (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => handleDateChangeForReschedule(d.iso)}
                      className={`px-3 py-2 rounded-xl text-center border transition-all text-xs shrink-0 ${
                        newDate === d.iso
                          ? "bg-teal-700 text-white border-teal-700 font-bold shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-[10px]">{d.dayName}</div>
                      <div className="font-bold">{d.dayNum}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Sessions for Selected Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">Available Time Slots:</label>
                {availableRescheduleSessions.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {availableRescheduleSessions.map((ses) => {
                      const isAvail = ses.status === "AVAILABLE" || ses.status === "LIMITED";
                      return (
                        <div
                          key={ses.session_id}
                          onClick={() => isAvail && setNewSessionId(ses.session_id)}
                          className={`p-3 rounded-2xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                            newSessionId === ses.session_id
                              ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                              : isAvail
                              ? "bg-white border-slate-200 hover:bg-slate-50"
                              : "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">{ses.slot_display_time}</span>
                            <span className="text-[10px] text-slate-500">{ses.room_number || "OPD Room"}</span>
                          </div>
                          <Badge
                            variant={isAvail ? "success" : "secondary"}
                            className="text-[9px] font-mono"
                          >
                            {ses.remaining_capacity} left
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                    Doctor has no scheduled sessions on this date. Please pick another day.
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!newSessionId || isProcessing}
                  onClick={handleConfirmReschedule}
                  className="flex-1 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl"
                >
                  {isProcessing ? "Rescheduling..." : "Confirm New Slot"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
