"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ClipboardCheck, 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Building2, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Printer,
  ArrowRight,
  UserPlus
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useAuth } from "@/lib/auth/auth-context";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { QueueManagementService } from "@/lib/services/queue-management-service";
import { Appointment, QueueEntry } from "@/types/database.types";

export default function ReceptionCheckInPage() {
  const { user, activeMembership } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Walk-in Modal State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInPatientId, setWalkInPatientId] = useState("PAT-1004");
  const [walkInDoctorId, setWalkInDoctorId] = useState("DOC-1001");
  const [walkInSessionId, setWalkInSessionId] = useState("SES-1001");
  const [walkInReason, setWalkInReason] = useState("");

  // Last Issued Token Receipt
  const [lastIssuedEntry, setLastIssuedEntry] = useState<QueueEntry | null>(null);

  const orgIdentifier = activeMembership?.organization_identifier || "HSP-1001";
  const orgName = activeMembership?.organization_name || "City Hospital";
  const todayStr = getTodayDateStr();

  const loadData = () => {
    const apts = AppointmentStore.getAllAppointments().filter(
      (a) => a.organization_identifier === orgIdentifier && a.appointment_date === todayStr
    );
    setAppointments(apts);

    const queue = QueueStore.getQueueForFacility(orgIdentifier, todayStr);
    setQueueEntries(queue);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("medora-queue-updated", handleUpdate);
    return () => window.removeEventListener("medora-queue-updated", handleUpdate);
  }, [activeMembership]);

  const handleCheckIn = async (appointment: Appointment) => {
    if (!user) return;
    setIsProcessing(true);
    setActionMessage(null);
    setErrorMessage(null);

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
          checkin_source: "RECEPTIONIST",
        },
        user
      );

      if (res.success && res.queue_entry) {
        setActionMessage(res.message);
        setLastIssuedEntry(res.queue_entry);
        loadData();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process check-in.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const res = await QueueManagementService.createWalkInQueueEntry(
        {
          patient_id: walkInPatientId,
          doctor_id: walkInDoctorId,
          organization_identifier: orgIdentifier,
          facility_id: "FAC-1001",
          department_id: "DEP-CARD-1001",
          session_id: walkInSessionId,
          date: todayStr,
          source: "WALK_IN",
          checkin_source: "RECEPTIONIST",
          reason_for_visit: walkInReason || "Walk-In Consultation",
        },
        user
      );

      if (res.success && res.queue_entry) {
        setActionMessage(res.message);
        setLastIssuedEntry(res.queue_entry);
        setShowWalkInModal(false);
        setWalkInReason("");
        loadData();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to register walk-in patient.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredAppointments = appointments.filter(
    (a) =>
      a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.appointment_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.patient_phone && a.patient_phone.includes(searchQuery))
  );

  return (
    <RoleGuard allowedRoles={["staff", "receptionist" as any, "hospital_admin", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150 max-w-5xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Front Desk Patient Check-In & Token Desk"
            description={`Verify arrivals, issue OPD queue tokens, and manage patient entry for ${orgName}.`}
            breadcrumbs={[
              { label: "Reception Workspace", href: "/reception" },
              { label: "Patient Check-in" },
            ]}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => setShowWalkInModal(true)}
              className="rounded-2xl h-10 px-5 text-xs font-bold bg-teal-700 hover:bg-teal-800 shadow-xs flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register Walk-in Patient</span>
            </Button>
          </div>
        </div>

        {/* Action Messages */}
        {actionMessage && (
          <div className="rounded-2xl bg-teal-50 border border-teal-200 p-3.5 text-xs text-teal-800 font-medium flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-teal-700 text-xs font-bold">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-medium flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-700 text-xs font-bold">✕</button>
          </div>
        )}

        {/* Recently Issued Token Slip (Print / Handover Preview) */}
        {lastIssuedEntry && (
          <Card className="bg-gradient-to-r from-teal-800 to-teal-950 text-white rounded-3xl p-5 shadow-lg border-teal-700 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-200 block">
                  Token Successfully Issued • Handover to Patient
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black font-mono">
                    #{lastIssuedEntry.token_number}
                  </span>
                  <span className="text-sm font-bold text-teal-100">
                    {lastIssuedEntry.patient_name} ({lastIssuedEntry.patient_id})
                  </span>
                </div>
                <p className="text-xs text-teal-200">
                  Doctor: <strong>{lastIssuedEntry.doctor_name}</strong> • {lastIssuedEntry.department_name} ({lastIssuedEntry.room_number || "Room 102"})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="rounded-2xl h-10 px-4 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border-white/30 gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print Token Slip
                </Button>
                <Button
                  onClick={() => setLastIssuedEntry(null)}
                  variant="ghost"
                  className="rounded-2xl h-10 px-3 text-xs text-teal-200 hover:text-white"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Search Bar & Scope Indicator */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, phone, or APT ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-teal-600"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            <span>Today: {todayStr}</span>
            <Badge variant="teal" className="text-xs font-mono font-bold">
              {orgName} ({orgIdentifier})
            </Badge>
          </div>
        </div>

        {/* Today's Appointments Table */}
        <Card className="bg-white border-slate-200 rounded-3xl shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">
                Today's Booked Outpatient Roster ({filteredAppointments.length})
              </CardTitle>
              <span className="text-xs text-slate-500 font-medium">
                {queueEntries.length} Checked-In Today
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-slate-50">
                  <TableHead>Appointment ID</TableHead>
                  <TableHead>Patient Details</TableHead>
                  <TableHead>Doctor & Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                      No matching appointments scheduled for today.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((apt) => {
                    const queueEntry = queueEntries.find(
                      (q) => q.appointment_id && q.appointment_id.toLowerCase() === apt.id.toLowerCase()
                    );
                    const isCheckedIn = Boolean(queueEntry);

                    return (
                      <TableRow key={apt.id} className="text-xs hover:bg-slate-50/80">
                        <TableCell className="font-mono font-bold text-teal-800">
                          {apt.appointment_no}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-slate-900 block">{apt.patient_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {apt.patient_id} • {apt.patient_phone || "+91 98765 00000"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-900 block">{apt.doctor_name}</span>
                          <span className="text-[10px] text-slate-500">
                            {apt.slot_display_time} ({apt.opd_room || "Room 102"})
                          </span>
                        </TableCell>
                        <TableCell>
                          {isCheckedIn ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="teal" className="text-[10px] font-mono font-bold">
                                #{queueEntry?.token_number}
                              </Badge>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                ({queueEntry?.status})
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-600">
                              ● {apt.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isCheckedIn ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLastIssuedEntry(queueEntry || null)}
                              className="h-7 text-xs font-semibold rounded-xl text-teal-700 border-teal-200"
                            >
                              View Slip
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(apt)}
                              disabled={isProcessing}
                              className="h-7 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Check In
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Walk-in Registration Modal */}
        {showWalkInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Register Walk-In Patient
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct OPD queue entry with session capacity check
                  </p>
                </div>
                <button
                  onClick={() => setShowWalkInModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleWalkInSubmit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Patient</label>
                  <select
                    value={walkInPatientId}
                    onChange={(e) => setWalkInPatientId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="PAT-1001">Rahul Verma (PAT-1001)</option>
                    <option value="PAT-1002">Priya Sharma (PAT-1002)</option>
                    <option value="PAT-1003">Amit Das (PAT-1003)</option>
                    <option value="PAT-1004">Pooja Das (PAT-1004)</option>
                    <option value="PAT-1005">Rohan Mehra (PAT-1005)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Consulting Doctor</label>
                  <select
                    value={walkInDoctorId}
                    onChange={(e) => {
                      setWalkInDoctorId(e.target.value);
                      if (e.target.value === "DOC-1001") setWalkInSessionId("SES-1001");
                      if (e.target.value === "MULTI-1001") setWalkInSessionId("SES-1005");
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="DOC-1001">Dr. Ananya Sharma (Cardiology OPD - Room 102)</option>
                    <option value="MULTI-1001">Dr. Rahul Sharma (General Medicine - Room 105)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Chief Complaint / Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Acute hypertension review, fever"
                    value={walkInReason}
                    onChange={(e) => setWalkInReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="rounded-xl bg-teal-50 p-2.5 text-[11px] text-teal-800 border border-teal-100">
                  ⚡ <strong>Capacity Notice:</strong> Walk-in registration respects the doctor's planned session capacity and will not exceed the administrative ceiling.
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWalkInModal(false)}
                    className="flex-1 rounded-xl h-9 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 rounded-xl h-9 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white"
                  >
                    {isProcessing ? "Checking..." : "Confirm & Issue Token"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
