"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Search, 
  Building2, 
  CheckCircle2, 
  Stethoscope, 
  ClipboardList,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { Appointment, DoctorWorkingSession, SessionAvailability } from "@/types/database.types";

export default function ReceptionAppointmentsPage() {
  const { user, activeMembership } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBookModal, setShowBookModal] = useState(false);

  // New Booking State
  const [patientId, setPatientId] = useState("PAT-1001");
  const [patientName, setPatientName] = useState("Rahul Verma");
  const [selectedDoctorId, setSelectedDoctorId] = useState("DOC-1001");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessions, setSessions] = useState<SessionAvailability[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeOrgIdentifier = activeMembership?.organization_identifier || "HSP-1001";
  const activeOrgName = activeMembership?.organization_name || "City Hospital";

  const loadAppointments = () => {
    const all = AppointmentStore.getAllAppointments().filter(
      (a) => a.organization_identifier === activeOrgIdentifier
    );
    setAppointments(all);
  };

  useEffect(() => {
    loadAppointments();
  }, [activeMembership]);

  useEffect(() => {
    async function loadDoctorAvailability() {
      try {
        const avail = await AppointmentBookingService.getDoctorAvailability(
          selectedDoctorId,
          activeOrgIdentifier,
          "FAC-1001",
          bookingDate
        );
        setSessions(avail);
        if (avail.length > 0) {
          const first = avail.find((s) => s.status === "AVAILABLE" || s.status === "LIMITED");
          if (first) setSelectedSessionId(first.session_id);
        }
      } catch (err) {
        setSessions([]);
      }
    }
    if (showBookModal) {
      loadDoctorAvailability();
    }
  }, [showBookModal, selectedDoctorId, bookingDate, activeOrgIdentifier]);

  const handleCreateFrontDeskBooking = async () => {
    if (!selectedSessionId || !user) return;
    setIsSubmitting(true);
    setActionError(null);

    const targetSession = sessions.find((s) => s.session_id === selectedSessionId);
    if (!targetSession) return;

    try {
      const res = await AppointmentBookingService.bookAppointment(
        {
          patient_id: patientId,
          doctor_id: selectedDoctorId,
          organization_identifier: activeOrgIdentifier,
          facility_id: targetSession.facility_id,
          department_id: targetSession.department_id,
          session_id: selectedSessionId,
          appointment_date: bookingDate,
          reason_for_visit: reason || "Front Desk Scheduled Appointment",
          booking_source: "RECEPTION",
        },
        user
      );

      if (res.success) {
        setShowBookModal(false);
        loadAppointments();
      } else {
        setActionError(res.message);
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to book appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    return (
      a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.appointment_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctor_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <RoleGuard allowedRoles={["staff", "receptionist" as any, "hospital_admin", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150 max-w-5xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Front Desk OPD Appointments & Roster"
            description={`Patient appointment queue, intake schedules, and front-desk booking for ${activeOrgName}.`}
            breadcrumbs={[{ label: "Reception Workspace", href: "/reception" }, { label: "Appointments" }]}
          />
          <Button
            onClick={() => setShowBookModal(true)}
            className="rounded-2xl h-10 px-5 text-xs font-bold bg-teal-700 hover:bg-teal-800 shadow-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Book Patient at Front Desk</span>
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, doctor, or APT ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-teal-600"
            />
          </div>
          <Badge variant="teal" className="text-xs font-semibold">
            {activeOrgName} ({activeOrgIdentifier})
          </Badge>
        </div>

        {/* Appointments Table */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-3xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Active Facility Bookings ({filteredAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2.5">
            {filteredAppointments.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <ClipboardList className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No appointments scheduled for this facility.</p>
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                      {apt.token_number ? `#${apt.token_number}` : "APT"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{apt.patient_name}</span>
                        <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-semibold">
                          {apt.appointment_no}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium font-mono">
                          ({apt.patient_id})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-900 flex items-center gap-1">
                          <Stethoscope className="h-3 w-3 text-teal-600" />
                          {apt.doctor_name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {apt.appointment_date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {apt.slot_display_time} ({apt.opd_room || "Room 102"})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="teal" className="text-[10px]">
                      ● {apt.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Front Desk Booking Modal */}
        {showBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Front Desk Patient Appointment Booking
                </h3>
                <button
                  onClick={() => setShowBookModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  ✕
                </button>
              </div>

              {actionError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Patient Identifier</label>
                  <select
                    value={patientId}
                    onChange={(e) => {
                      setPatientId(e.target.value);
                      if (e.target.value === "PAT-1001") setPatientName("Rahul Verma");
                      if (e.target.value === "PAT-1002") setPatientName("Priya Sharma");
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="PAT-1001">Rahul Verma (PAT-1001)</option>
                    <option value="PAT-1002">Priya Sharma (PAT-1002)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Doctor</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="DOC-1001">Dr. Ananya Sharma (Cardiology)</option>
                    <option value="MULTI-1001">Dr. Rahul Sharma (General Medicine)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Appointment Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Available Working Sessions</label>
                  {sessions.length === 0 ? (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      No working sessions configured for this doctor on {bookingDate}.
                    </p>
                  ) : (
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    >
                      {sessions.map((s) => (
                        <option
                          key={s.session_id}
                          value={s.session_id}
                          disabled={s.status !== "AVAILABLE" && s.status !== "LIMITED"}
                        >
                          {s.slot_display_time} — {s.remaining_capacity}/{s.capacity} Slots Left ({s.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Reason for Visit</label>
                  <input
                    type="text"
                    placeholder="e.g. In-person OPD Consultation"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 rounded-xl h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFrontDeskBooking}
                  disabled={isSubmitting || !selectedSessionId || sessions.length === 0}
                  className="flex-1 rounded-xl h-9 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white"
                >
                  {isSubmitting ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
