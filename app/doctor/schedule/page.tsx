"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Calendar, 
  Building2, 
  Plus, 
  Edit3, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldCheck,
  MapPin
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { AppointmentBookingService } from "@/lib/services/appointment-booking-service";
import { DoctorWorkingSession } from "@/types/database.types";

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DoctorWorkingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<DoctorWorkingSession | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCapacity, setEditCapacity] = useState<number>(12);
  const [editStartTime, setEditStartTime] = useState<string>("08:00");
  const [editEndTime, setEditEndTime] = useState<string>("10:00");
  const [editRoom, setEditRoom] = useState<string>("Room 102");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Leave Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveDate, setLeaveDate] = useState<string>("");
  const [leaveReason, setLeaveReason] = useState<string>("");
  const [leaveResult, setLeaveResult] = useState<string | null>(null);

  const doctorId = user?.identifier || "DOC-1001";

  const loadSessions = () => {
    const records = AppointmentStore.getDoctorSessions(doctorId);
    setSessions(records);
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  const openEditModal = (session: DoctorWorkingSession) => {
    setSelectedSession(session);
    setEditCapacity(session.capacity);
    setEditStartTime(session.start_time);
    setEditEndTime(session.end_time);
    setEditRoom(session.room_number || "Room 102");
    setStatusMessage(null);
    setWarningMessage(null);
    setShowEditModal(true);
  };

  const handleSaveSession = async () => {
    if (!selectedSession || !user) return;
    setIsSaving(true);
    setStatusMessage(null);
    setWarningMessage(null);

    try {
      const res = await AppointmentBookingService.createOrUpdateSession(
        {
          id: selectedSession.id,
          doctor_id: selectedSession.doctor_id,
          doctor_name: selectedSession.doctor_name,
          organization_id: selectedSession.organization_id,
          organization_identifier: selectedSession.organization_identifier,
          organization_name: selectedSession.organization_name,
          facility_id: selectedSession.facility_id,
          department_id: selectedSession.department_id,
          department_name: selectedSession.department_name,
          day_of_week: selectedSession.day_of_week,
          start_time: editStartTime,
          end_time: editEndTime,
          capacity: editCapacity,
          room_number: editRoom,
        },
        user
      );

      if (res.success) {
        setStatusMessage("Session configuration updated successfully.");
        if (res.warning) setWarningMessage(res.warning);
        loadSessions();
        setTimeout(() => {
          if (!res.warning) setShowEditModal(false);
        }, 1200);
      } else {
        setStatusMessage(res.message);
      }
    } catch (err: any) {
      setStatusMessage(err.message || "Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!leaveDate || !leaveReason || !user) return;
    setIsSaving(true);
    setLeaveResult(null);

    try {
      const res = await AppointmentBookingService.addDoctorLeave(
        {
          doctor_id: doctorId,
          date: leaveDate,
          reason: leaveReason,
        },
        user
      );

      if (res.success) {
        setLeaveResult(
          `Leave applied for ${leaveDate}. ${
            res.affectedAppointmentsCount > 0
              ? `Warning: ${res.affectedAppointmentsCount} existing appointment(s) require operational handling.`
              : "No conflicting appointments found."
          }`
        );
      } else {
        setLeaveResult(`Error: ${res.message}`);
      }
    } catch (err: any) {
      setLeaveResult(err.message || "Failed to apply leave.");
    } finally {
      setIsSaving(false);
    }
  };

  const getDayName = (d: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[d] || "Weekday";
  };

  return (
    <RoleGuard allowedRoles={["doctor", "admin", "hospital_admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150 max-w-4xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Doctor Practice Schedule & Capacity"
            description="Manage weekly working sessions, operational capacity constraints, and leave dates across affiliated facilities."
            breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Schedule & Capacity" }]}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setLeaveDate("");
                setLeaveReason("");
                setLeaveResult(null);
                setShowLeaveModal(true);
              }}
              variant="outline"
              className="rounded-2xl h-10 px-4 text-xs font-semibold border-slate-300"
            >
              <Calendar className="h-4 w-4 mr-1.5 text-slate-500" />
              Apply Leave / Date Block
            </Button>
          </div>
        </div>

        {/* Multi-Facility Schedule Overview */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-3xl">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Active Weekly Working Sessions ({sessions.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Unified Doctor Identity: <strong className="font-mono text-teal-800">{doctorId}</strong>
                </CardDescription>
              </div>
              <Badge variant="teal" className="text-xs font-semibold">
                ● Multi-Hospital Practice
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-teal-400 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md font-mono">
                      {getDayName(session.day_of_week)}
                    </span>
                    <span className="font-black text-xs text-slate-900">
                      {session.organization_name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      • {session.department_name} ({session.room_number || "OPD Room"})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      {session.start_time} - {session.end_time} ({session.session_name || "Clinic"})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 font-bold text-slate-900">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      Planning Capacity: {session.capacity} Patients
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(session)}
                    className="h-8 text-xs font-semibold rounded-xl"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Configure Capacity
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Capacity Policy Notice */}
        <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>MEDORA Clinical Autonomy Policy</span>
          </div>
          <p className="leading-relaxed">
            Configured session capacity acts as an administrative scheduling ceiling. MEDORA does not enforce fixed per-patient consultation timers, preserving full clinical judgment for individual patient complexities.
          </p>
        </div>

        {/* Configure Capacity Modal */}
        {showEditModal && selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Configure Session Capacity
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedSession.organization_name} • {getDayName(selectedSession.day_of_week)}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {statusMessage && (
                <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800 font-medium">
                  {statusMessage}
                </div>
              )}

              {warningMessage && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 font-medium flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{warningMessage}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Start Time</label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">End Time</label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Patient Session Capacity (Max Bookable Ceiling)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    Number of patient appointments that can be booked in this time window.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Consultation Room</label>
                  <input
                    type="text"
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSession}
                  disabled={isSaving}
                  className="flex-1 rounded-xl h-9 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white"
                >
                  {isSaving ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Apply Leave Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Block Date / Record Leave
                </h3>
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {leaveResult && (
                <div className="rounded-xl bg-slate-100 border border-slate-200 p-3 text-xs text-slate-800 font-medium">
                  {leaveResult}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Leave Date</label>
                  <input
                    type="date"
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Reason for Absence</label>
                  <input
                    type="text"
                    placeholder="e.g. Attending Cardiology Conference, Personal Leave"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 rounded-xl h-9 text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={handleApplyLeave}
                  disabled={isSaving || !leaveDate || !leaveReason}
                  className="flex-1 rounded-xl h-9 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white"
                >
                  {isSaving ? "Recording..." : "Record Leave"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
