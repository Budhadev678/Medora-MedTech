"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, Stethoscope, Plus, Search, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { useAuth } from "@/lib/auth/auth-context";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { QueueStore } from "@/lib/data/queue-store";
import { LiveQueueCard } from "@/components/patient/live-queue-card";
import { Button } from "@/components/ui/button";
import { Appointment, QueueEntry, WaitlistEntry } from "@/types/database.types";
import { WaitlistStore } from "@/lib/data/waitlist-store";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Bell, CheckCircle } from "lucide-react";
import { useLocalization } from "@/lib/localization";

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const { t } = useLocalization();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeQueue, setActiveQueue] = useState<QueueEntry | null>(null);
  const [waitlists, setWaitlists] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingWaitlistId, setBookingWaitlistId] = useState<string | null>(null);

  const loadAppointments = () => {
    if (!user) return;
    setIsLoading(true);
    const patientId = user.identifier || user.id;
    const records = AppointmentStore.getAppointmentsForPatient(patientId);
    setAppointments(records);
    setActiveQueue(QueueStore.getPatientActiveQueueEntry(patientId));
    setWaitlists(WaitlistStore.getPatientActiveWaitlists(patientId));
    setIsLoading(false);
  };

  useEffect(() => {
    loadAppointments();
    const handleUpdate = () => loadAppointments();
    window.addEventListener("medora-appointments-updated", handleUpdate);
    window.addEventListener("medora-appointment-updated", handleUpdate);
    window.addEventListener("medora-queue-updated", handleUpdate);
    window.addEventListener("medora-waitlist-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-appointments-updated", handleUpdate);
      window.removeEventListener("medora-appointment-updated", handleUpdate);
      window.removeEventListener("medora-queue-updated", handleUpdate);
      window.removeEventListener("medora-waitlist-updated", handleUpdate);
    };
  }, [user]);

  const handleBookWaitlistSlot = async (waitlist: WaitlistEntry) => {
    if (!user) return;
    setBookingWaitlistId(waitlist.id);
    try {
      const result = await AppointmentBookingService.bookAppointment(
        {
          patient_id: user.identifier || user.id,
          doctor_id: waitlist.doctor_id,
          organization_identifier: waitlist.organization_identifier,
          facility_id: waitlist.facility_id,
          department_id: waitlist.department_id,
          session_id: waitlist.preferred_session_id || "SES-1001",
          appointment_date: waitlist.preferred_date,
          booking_source: "PATIENT",
          reason_for_visit: "Booked from waitlist slot release notification",
        },
        user
      );
      if (result.success) {
        WaitlistStore.markWaitlistBooked(waitlist.id, result.appointment!.id);
        loadAppointments();
      } else {
        alert(result.message || "Slot is no longer available.");
        loadAppointments();
      }
    } catch (err: any) {
      alert(err.message || "Failed to book waitlist slot.");
    } finally {
      setBookingWaitlistId(null);
    }
  };

  const handleCancelWaitlist = (waitlistId: string) => {
    if (!user) return;
    WaitlistStore.cancelWaitlistEntry(waitlistId, user.identifier || user.id);
    loadAppointments();
  };

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "REQUESTED" || a.status === "CHECKED_IN"
  );
  const pastAppointments = appointments.filter((a) => a.status === "COMPLETED");
  const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED" || a.status === "RESCHEDULED");

  const displayedList = 
    activeTab === "upcoming" 
      ? upcomingAppointments 
      : activeTab === "past" 
      ? pastAppointments 
      : cancelledAppointments;

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title={t("appointments.title")}
            description={t("common.upcoming_schedule")}
            breadcrumbs={[{ label: t("nav.home"), href: "/patient" }, { label: t("nav.appointments") }]}
          />
          <Link href="/patient/appointments/book">
            <Button className="w-full sm:w-auto rounded-2xl h-10 px-5 text-xs font-bold bg-teal-700 hover:bg-teal-800 shadow-xs flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              <span>{t("appointments.book")}</span>
            </Button>
          </Link>
        </div>

        {/* Live Queue Banner if Active */}
        {activeQueue && (
          <section aria-label="Live Queue Status">
            <LiveQueueCard queueEntry={activeQueue} onRefresh={loadAppointments} />
          </section>
        )}

        {/* Active Waitlists */}
        {waitlists.length > 0 && (
          <section aria-label="My Active Waitlists" className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <Bell className="h-4 w-4 text-teal-600" />
                <span>Active Waitlists ({waitlists.length})</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Automatic Slot Notification</span>
            </div>

            <div className="space-y-2">
              {waitlists.map((w) => {
                const isNotified = w.status === "NOTIFIED";
                return (
                  <div
                    key={w.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isNotified
                        ? "bg-teal-50 border-teal-400 ring-2 ring-teal-500/20 shadow-xs"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isNotified ? (
                            <Badge variant="teal" className="text-[10px] font-black uppercase tracking-wider animate-pulse">
                              ●  Slot Available Now
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-bold border-slate-300 text-slate-700">
                              Waitlist Active #{w.waitlist_no}
                            </Badge>
                          )}
                          <span className="text-[11px] font-mono text-slate-500">
                            {w.preferred_date} • {w.preferred_time_window || "OPD Session"}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-900">
                          {w.doctor_name} • <span className="text-slate-600 font-normal">{w.organization_name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isNotified && (
                          <Button
                            size="sm"
                            onClick={() => handleBookWaitlistSlot(w)}
                            disabled={bookingWaitlistId === w.id}
                            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl h-8"
                          >
                            {bookingWaitlistId === w.id ? "..." : "Claim Slot"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelWaitlist(w.id)}
                          className="text-xs text-slate-500 hover:text-red-600 rounded-xl h-8"
                        >
                          {t("profile.cancel")}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tab Filters */}
        <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "upcoming" ? "bg-white text-teal-900 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            {t("common.upcoming_schedule")} ({upcomingAppointments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "past" ? "bg-white text-teal-900 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            {t("status.completed")} ({pastAppointments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "cancelled" ? "bg-white text-teal-900 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            {t("status.cancelled")} ({cancelledAppointments.length})
          </button>
        </div>

        {/* Appointment List / Empty State */}
        {displayedList.length > 0 ? (
          <div className="space-y-3">
            {displayedList.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} onRefresh={loadAppointments} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Calendar className="h-6 w-6 text-teal-600" />}
            title={activeTab === "upcoming" ? t("common.no_appointments") : t("common.no_records")}
            description={t("appointments.no_appointments")}
            actionHref="/patient/appointments/book"
            actionLabel={t("appointments.book")}
          />
        )}
      </div>
    </RoleGuard>
  );
}
