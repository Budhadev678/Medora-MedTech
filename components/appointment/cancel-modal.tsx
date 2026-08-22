"use client";

import React, { useState } from "react";
import { Appointment } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { XCircle, AlertCircle, Calendar, Clock, Building2, Stethoscope, ArrowLeft } from "lucide-react";
import { FrontendAppointmentService } from "@/lib/services/frontend-appointment-service";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/utils";

interface CancelModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelModal({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}: CancelModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>("Schedule conflict / Personal reasons");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handleConfirmCancel = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await FrontendAppointmentService.cancelAppointment(
        appointment.id,
        user,
        reason
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(result.message || "Failed to cancel appointment.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during cancellation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2 text-red-600 font-bold text-base" id="cancel-modal-title">
            <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <span>Cancel Appointment?</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Cancelling will immediately release your reserved slot for other patients. Your consultation history will preserve this record.
        </p>

        {/* Appointment Card Summary */}
        <div className="bg-red-50/40 border border-red-200/70 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Stethoscope className="h-4 w-4 text-teal-700 shrink-0" aria-hidden="true" />
            <span>{appointment.doctor_name}</span>
          </div>
          <div className="text-slate-600 flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span>{appointment.organization_name} • {appointment.department_name}</span>
          </div>
          <div className="text-slate-700 font-semibold flex items-center gap-2 pt-1 border-t border-red-100">
            <Calendar className="h-3.5 w-3.5 text-teal-700 shrink-0" aria-hidden="true" />
            <span>{formatDate(appointment.appointment_date)} at {appointment.slot_display_time || appointment.scheduled_time}</span>
          </div>
        </div>

        {/* Reason Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700" htmlFor="cancellation-reason-select">
            Please tell us why you are cancelling:
          </label>
          <select
            id="cancellation-reason-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-600/20 focus:border-red-600 bg-white"
          >
            <option value="Schedule conflict / Personal reasons">Schedule conflict / Personal reasons</option>
            <option value="Symptoms resolved / Consultation no longer needed">Symptoms resolved / Consultation no longer needed</option>
            <option value="Seeking alternate medical consultation">Seeking alternate medical consultation</option>
            <option value="Accidental booking / Duplicate appointment">Accidental booking / Duplicate appointment</option>
            <option value="Doctor requested rescheduling">Doctor requested rescheduling</option>
          </select>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Actions: Safe Keep as default */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs h-10 px-5 rounded-xl font-bold text-slate-800 hover:bg-slate-100 border-slate-300"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Keep Appointment
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-xs"
          >
            {isSubmitting ? "Cancelling..." : "Cancel Appointment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
