"use client";

import React, { useState, useEffect } from "react";
import { Appointment, SessionAvailability } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { FrontendAppointmentService } from "@/lib/services/frontend-appointment-service";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/utils";

interface RescheduleModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleModal({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [sessions, setSessions] = useState<SessionAvailability[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (appointment && isOpen) {
      const today = new Date();
      today.setDate(today.getDate() + 2);
      const defaultDate = today.toISOString().split("T")[0];
      setSelectedDate(defaultDate);
      setSelectedSessionId("");
      setErrorMsg(null);
      loadAvailability(defaultDate);
    }
  }, [appointment, isOpen]);

  const loadAvailability = async (dateStr: string) => {
    if (!appointment) return;
    setIsLoadingSlots(true);
    setErrorMsg(null);
    try {
      const avail = await FrontendAppointmentService.getAvailability(
        appointment.doctor_id,
        appointment.organization_identifier || "HSP-1001",
        appointment.facility_id,
        dateStr
      );
      setSessions(avail);
      const availableOne = avail.find((s) => s.status === "AVAILABLE" || s.status === "LIMITED");
      if (availableOne) {
        setSelectedSessionId(availableOne.session_id);
      } else {
        setSelectedSessionId("");
      }
    } catch (err: any) {
      setErrorMsg("Failed to load doctor availability for this date.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    loadAvailability(newDate);
  };

  const handleConfirmReschedule = async () => {
    if (!appointment || !user || !selectedSessionId || !selectedDate) {
      setErrorMsg("Please select a date and an available practicing session.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await FrontendAppointmentService.rescheduleAppointment(
        appointment.id,
        selectedDate,
        selectedSessionId,
        user
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.message || "Unable to reschedule to this session.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during rescheduling.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const selectedSession = sessions.find((s) => s.session_id === selectedSessionId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base" id="reschedule-modal-title">
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </div>
            <span>Reschedule Appointment</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Comparison Overview: Current vs New */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Booking</div>
            <div className="font-bold text-slate-800">{formatDate(appointment.appointment_date)}</div>
            <div className="text-slate-600 flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" aria-hidden="true" />
              <span>{appointment.slot_display_time || appointment.scheduled_time}</span>
            </div>
          </div>

          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
            <div className="text-[10px] uppercase font-bold text-teal-800 flex items-center gap-1">
              <span>New Requested Time</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </div>
            <div className="font-bold text-teal-950">
              {selectedDate ? formatDate(selectedDate) : "Select date below"}
            </div>
            <div className="text-teal-900 flex items-center gap-1">
              <Clock className="h-3 w-3 text-teal-600" aria-hidden="true" />
              <span>{selectedSession?.slot_display_time || "Select session below"}</span>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between" htmlFor="reschedule-date-input">
            <span>Select New Date</span>
            <span className="text-[11px] font-normal text-slate-500">Available practicing days</span>
          </label>
          <input
            id="reschedule-date-input"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all bg-white"
          />
        </div>

        {/* Available Practicing Sessions */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Available Clinic Sessions</label>
          {isLoadingSlots ? (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl animate-pulse">
              Checking doctor roster & remaining capacity...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium">
              No clinical sessions scheduled for Dr. {appointment.doctor_name} on this date. Please pick another day.
            </div>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {sessions.map((s) => {
                const isAvail = s.status === "AVAILABLE" || s.status === "LIMITED";
                const isSelected = selectedSessionId === s.session_id;

                return (
                  <button
                    key={s.session_id}
                    type="button"
                    disabled={!isAvail}
                    onClick={() => setSelectedSessionId(s.session_id)}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      !isAvail
                        ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed text-slate-400"
                        : isSelected
                        ? "bg-teal-50 border-teal-600 text-teal-950 font-bold ring-2 ring-teal-600/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{s.slot_display_time}</div>
                      <div className="text-[11px] text-slate-500">{s.room_number || "OPD Room"} • {s.department_name}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isAvail ? "bg-emerald-50 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}>
                        {isAvail ? `${s.remaining_capacity} slots left` : s.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Toolbar */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs h-10 px-4 rounded-xl text-slate-700 hover:bg-slate-50"
          >
            Keep Original Time
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleConfirmReschedule}
            disabled={isSubmitting || !selectedSessionId}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-xs"
          >
            {isSubmitting ? "Updating Schedule..." : "Confirm Reschedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
