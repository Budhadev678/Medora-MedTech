"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Stethoscope, 
  FileText, 
  FlaskConical, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  ArrowRight,
  Calendar,
  Layers,
  Info,
  ChevronRight,
  Building2,
  Plus,
  ShieldCheck,
  MapPin,
  Clock3,
  X,
  Volume2,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  getAllIdentities, 
  findIdentityById, 
  requestDoctorAffiliation, 
  StoredDoctorAffiliation 
} from "@/lib/data/identity-store";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { QueueManagementService } from "@/lib/services/queue-management-service";
import { WaitingTimeEstimationService } from "@/lib/services/waiting-time-service";
import { DoctorQueueSummary, QueueEntry, DoctorOperationalQueueStatus } from "@/types/database.types";

export default function DoctorWorkspacePage() {
  const { user, activeMembership } = useAuth();
  const [dutyStatus, setDutyStatus] = useState<"available" | "busy" | "on_call" | "emergency_occupied">("available");
  const [selectedTab, setSelectedTab] = useState<"queue" | "affiliations" | "schedule">("queue");
  const [isAffiliationModalOpen, setIsAffiliationModalOpen] = useState(false);

  // Queue State
  const [summaries, setSummaries] = useState<DoctorQueueSummary[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Request Affiliation Form State
  const [targetFacilityId, setTargetFacilityId] = useState("HSP-1001");
  const [roleTitle, setRoleTitle] = useState("Visiting Specialist");
  const [departmentName, setDepartmentName] = useState("Cardiology Outpatient Clinic");
  const [consultationFee, setConsultationFee] = useState(500);
  const [opdRoom, setOpdRoom] = useState("OPD Room 204");
  const [scheduleNotes, setScheduleNotes] = useState("Tue, Thu (02:00 PM - 05:00 PM)");
  const [affiliationMessage, setAffiliationMessage] = useState<string | null>(null);

  const doctorId = user?.identifier || "DOC-1001";
  const orgIdentifier = activeMembership?.organization_identifier || "HSP-1001";
  const todayStr = getTodayDateStr();

  const [operationalStatuses, setOperationalStatuses] = useState<DoctorOperationalQueueStatus[]>([]);

  const loadQueue = () => {
    const list = QueueManagementService.getDoctorQueueSummary(doctorId, orgIdentifier, todayStr);
    setSummaries(list);
    const ops = WaitingTimeEstimationService.getDoctorOperationalQueueStatus(doctorId, orgIdentifier, todayStr);
    setOperationalStatuses(ops);
  };

  useEffect(() => {
    loadQueue();
    const handleUpdate = () => loadQueue();
    window.addEventListener("medora-queue-updated", handleUpdate);
    return () => window.removeEventListener("medora-queue-updated", handleUpdate);
  }, [user, activeMembership]);

  const currentOpStatus = operationalStatuses[0];

  const currentDoctor = user ? findIdentityById(user.id) || user : null;
  const affiliations: StoredDoctorAffiliation[] = currentDoctor?.doctorData?.affiliations || [];

  const currentSessionSummary = summaries[0];
  const currentPatient = currentSessionSummary?.current_patient;
  const nextPatient = currentSessionSummary?.next_patient;
  const waitingList = currentSessionSummary?.waiting_list || [];
  const skippedList = currentSessionSummary?.skipped_list || [];

  // Action Handlers
  const handleCallNext = async () => {
    if (!currentSessionSummary || !user) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await QueueManagementService.callNextPatient(
        { doctor_id: doctorId, session_id: currentSessionSummary.session_id, date: todayStr },
        user
      );
      if (res.success) {
        setActionMessage(res.message);
        loadQueue();
      } else {
        setActionMessage(res.message);
      }
    } catch (err: any) {
      setActionMessage(err.message || "Failed to call next patient.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartConsultation = async (entry: QueueEntry) => {
    if (!user) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await QueueManagementService.startConsultation(entry.id, user);
      if (res.success) {
        setActionMessage(res.message);
        loadQueue();
      } else {
        setActionMessage(res.message);
      }
    } catch (err: any) {
      setActionMessage(err.message || "Failed to start consultation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteConsultation = async (entry: QueueEntry) => {
    if (!user) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await QueueManagementService.completeConsultation(entry.id, user);
      if (res.success) {
        setActionMessage(res.message);
        loadQueue();
      } else {
        setActionMessage(res.message);
      }
    } catch (err: any) {
      setActionMessage(err.message || "Failed to complete consultation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipPatient = async (entry: QueueEntry) => {
    if (!user) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await QueueManagementService.skipPatient(entry.id, user, "Patient not present when token called");
      if (res.success) {
        setActionMessage(res.message);
        loadQueue();
      } else {
        setActionMessage(res.message);
      }
    } catch (err: any) {
      setActionMessage(err.message || "Failed to skip patient.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecallPatient = async (entry: QueueEntry) => {
    if (!user) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await QueueManagementService.recallPatient(entry.id, user);
      if (res.success) {
        setActionMessage(res.message);
        loadQueue();
      } else {
        setActionMessage(res.message);
      }
    } catch (err: any) {
      setActionMessage(err.message || "Failed to recall patient.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAffiliationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const result = requestDoctorAffiliation(user.id, {
      organizationIdOrIdentifier: targetFacilityId,
      roleTitle,
      departmentName,
      consultationFee,
      opdRoom,
      scheduleNotes,
    });

    if (result.success) {
      setAffiliationMessage("Affiliation request submitted successfully! Awaiting hospital review.");
      setTimeout(() => {
        setIsAffiliationModalOpen(false);
        setAffiliationMessage(null);
      }, 1500);
    } else {
      setAffiliationMessage(result.error || "Failed to submit affiliation request.");
    }
  };

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Doctor Header & Duty Status Controller */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900">
                {user?.fullName || "Dr. Ananya Sharma"}
              </h1>
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                {doctorId}
              </span>
              <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50">
                {activeMembership?.organization_name || "City Hospital"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Context: <strong>{activeMembership?.organization_name || "City Hospital"}</strong> • Cardiology OPD ({currentSessionSummary?.room_number || "Room 102"})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 pl-1">Duty Status:</span>
            <select
              value={dutyStatus}
              onChange={(e) => setDutyStatus(e.target.value as any)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-teal-600 cursor-pointer shadow-2xs"
            >
              <option value="available">🟢 Available (Accepting Patients)</option>
              <option value="busy">🟡 In Consultation (Busy)</option>
              <option value="on_call">🔵 On Call</option>
              <option value="emergency_occupied">🔴 Emergency Occupied</option>
            </select>
          </div>
        </div>

        {/* Action / Notification Banner */}
        {actionMessage && (
          <div className="rounded-2xl bg-teal-50 border border-teal-200 p-3.5 text-xs text-teal-900 font-medium flex items-center justify-between shadow-2xs animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600 flex-shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-teal-700 hover:text-teal-900 text-xs font-bold">✕</button>
          </div>
        )}

        {/* Clinical Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Session Capacity</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {currentSessionSummary?.booked_count || 0} / {currentSessionSummary?.total_capacity || 12}
            </span>
            <span className="text-[11px] text-teal-700 font-medium block mt-0.5">
              {currentSessionSummary?.session_time || "08:00 AM - 10:00 AM"}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Waiting in Queue</span>
            <span className="text-xl font-black text-amber-600 mt-1 block">
              {waitingList.length} Patients
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {currentSessionSummary?.checked_in_count || 0} Total Checked In
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Completed Today</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">
              {currentSessionSummary?.completed_count || 0} Consultations
            </span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">Clinical Notes Finalized</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Skipped / Missed</span>
            <span className="text-xl font-black text-slate-700 mt-1 block">
              {skippedList.length} Recalls
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Available for Re-Call</span>
          </div>
        </div>

        {/* Operational View Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-semibold max-w-md">
            <button
              onClick={() => setSelectedTab("queue")}
              className={`flex-1 py-2 px-4 rounded-xl transition-all ${
                selectedTab === "queue" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              OPD Live Queue ({waitingList.length + (currentPatient ? 1 : 0)})
            </button>
            <button
              onClick={() => setSelectedTab("affiliations")}
              className={`flex-1 py-2 px-4 rounded-xl transition-all ${
                selectedTab === "affiliations" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Affiliations ({affiliations.length})
            </button>
            <button
              onClick={() => setSelectedTab("schedule")}
              className={`flex-1 py-2 px-4 rounded-xl transition-all ${
                selectedTab === "schedule" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Weekly Schedule
            </button>
          </div>

          {selectedTab === "queue" && (
            <Button 
              onClick={handleCallNext}
              disabled={isProcessing || waitingList.length === 0}
              className="rounded-2xl h-10 px-5 text-xs font-bold bg-teal-700 hover:bg-teal-800 shadow-xs gap-1.5"
            >
              <Volume2 className="h-4 w-4" />
              <span>Call Next Patient</span>
            </Button>
          )}

          {selectedTab === "affiliations" && (
            <Button 
              size="sm" 
              onClick={() => setIsAffiliationModalOpen(true)}
              className="gap-1.5 text-xs font-semibold rounded-2xl"
            >
              <Plus className="h-3.5 w-3.5" /> Request New Affiliation
            </Button>
          )}
        </div>

        {/* TAB 1: OPD LIVE QUEUE CONSOLE */}
        {selectedTab === "queue" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white border-slate-200 rounded-3xl shadow-xs">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold text-slate-900">
                          Current OPD Session Queue
                        </CardTitle>
                        {currentOpStatus && (
                          <Badge variant={currentOpStatus.delay_status === "DELAYED" ? "warning" : "secondary"} className="text-[10px]">
                            {currentOpStatus.delay_status === "DELAYED" 
                              ? `🟡 ${currentOpStatus.delay_notice || "Delay Detected"}`
                              : `🟢 On Track • Median ${currentOpStatus.historical_median_minutes}m`}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        {currentSessionSummary?.department_name || "Cardiology OPD"} • {currentSessionSummary?.room_number || "Room 102"} • {currentSessionSummary?.session_time}
                      </CardDescription>
                    </div>
                    {currentPatient && (
                      <div className="text-right">
                        <Badge variant="teal" className="text-xs font-bold font-mono">
                          Token #{currentPatient.token_number} Active
                        </Badge>
                        {currentOpStatus?.active_patient && currentPatient.status === "IN_CONSULTATION" && (
                          <span className="text-[10px] text-teal-800 font-mono block mt-0.5 font-semibold">
                            ⏱️ {currentOpStatus.active_patient.elapsed_minutes}m elapsed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs bg-slate-50">
                        <TableHead className="w-16">Token</TableHead>
                        <TableHead>Patient Details</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Current Patient Row */}
                      {currentPatient && (
                        <TableRow className="text-xs bg-teal-50/70 border-l-4 border-l-teal-600 font-medium">
                          <TableCell className="font-mono font-black text-teal-900 text-sm">
                            #{currentPatient.token_number}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-slate-900 block">{currentPatient.patient_name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{currentPatient.patient_id}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {currentPatient.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="teal" className="text-[10px]">
                              ● {currentPatient.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {currentPatient.status === "CALLED" ? (
                              <Button
                                size="sm"
                                onClick={() => handleStartConsultation(currentPatient)}
                                disabled={isProcessing}
                                className="h-7 text-xs font-bold bg-teal-700 hover:bg-teal-800 rounded-xl"
                              >
                                <Play className="h-3 w-3 mr-1 fill-current" /> Start
                              </Button>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <Link href={`/doctor/consultations/${currentPatient.encounter_id || 'ENC-1001'}`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs font-bold text-teal-700 border-teal-300 hover:bg-teal-50 rounded-xl"
                                  >
                                    <Stethoscope className="h-3 w-3 mr-1" /> Workspace
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteConsultation(currentPatient)}
                                  disabled={isProcessing}
                                  className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                                </Button>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSkipPatient(currentPatient)}
                              disabled={isProcessing}
                              className="h-7 text-xs text-slate-500 rounded-xl"
                            >
                              Skip
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Waiting Patients */}
                      {waitingList.map((pt) => (
                        <TableRow key={pt.id} className="text-xs hover:bg-slate-50/80">
                          <TableCell className="font-mono font-bold text-slate-900">
                            #{pt.token_number}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-slate-900 block">{pt.patient_name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{pt.patient_id}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-[11px] text-slate-500">{pt.source}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              ● Waiting
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartConsultation(pt)}
                              disabled={isProcessing || Boolean(currentPatient && currentPatient.status === "IN_CONSULTATION")}
                              className="h-7 text-xs rounded-xl"
                            >
                              Direct Start
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Skipped Patients */}
                      {skippedList.map((pt) => (
                        <TableRow key={pt.id} className="text-xs bg-slate-50/60 opacity-80">
                          <TableCell className="font-mono font-bold text-slate-500">
                            #{pt.token_number}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-slate-700 block">{pt.patient_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{pt.patient_id} (Skipped)</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-[11px] text-slate-400">{pt.source}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50">
                              ● Skipped
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRecallPatient(pt)}
                              disabled={isProcessing}
                              className="h-7 text-xs rounded-xl text-teal-700 border-teal-300"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Recall
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {!currentPatient && waitingList.length === 0 && skippedList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                            No checked-in patients in queue for this session.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Active Patient Snapshot Side Card */}
            <div className="space-y-4">
              {currentPatient ? (
                <Card className="bg-white border-teal-300 shadow-sm rounded-3xl overflow-hidden">
                  <CardHeader className="p-5 pb-3 bg-teal-50/80 border-b border-teal-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-900">
                        {currentPatient.status === "IN_CONSULTATION" ? "In Consultation Now" : "Called Patient"}
                      </span>
                      <Badge variant="teal" className="text-xs font-mono font-bold">
                        Token #{currentPatient.token_number}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-black text-slate-900 mt-1">
                      {currentPatient.patient_name}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 font-mono">
                      {currentPatient.patient_id} • {currentPatient.patient_phone || "+91 98765 00000"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3 text-xs">
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Appointment Ref:</span>
                        <span className="font-mono font-bold text-slate-800">{currentPatient.appointment_id || "Walk-In"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Consultation Room:</span>
                        <span className="font-bold text-teal-800">{currentPatient.room_number || "Room 102"}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link href={`/doctor/consultations/${currentPatient.encounter_id || 'ENC-1001'}`}>
                        <Button className="w-full h-10 text-xs font-bold rounded-2xl bg-teal-700 hover:bg-teal-800 gap-1.5">
                          <Stethoscope className="h-4 w-4" /> Open Full Clinical Consultation Workspace
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white border-dashed border-slate-200 rounded-3xl p-6 text-center space-y-2">
                  <Users className="h-8 w-8 mx-auto text-slate-300" />
                  <h3 className="text-xs font-bold text-slate-700">No Patient in Consultation</h3>
                  <p className="text-[11px] text-slate-400">
                    Click "Call Next Patient" above to announce the next waiting token.
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY PROFESSIONAL AFFILIATIONS */}
        {selectedTab === "affiliations" && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-5 flex items-start gap-3 text-xs text-blue-900">
              <Building2 className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Doctor Multi-Hospital Affiliation Architecture</span>
                <p className="mt-0.5 text-blue-800 leading-relaxed">
                  You are registered under one primary MEDORA Doctor Identity (<strong>{doctorId}</strong>). You can practice across multiple hospitals, diagnostic centers, and clinics with independent consultation rates, OPD rooms, and schedule allocations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {affiliations.map((aff) => (
                <Card key={aff.id} className="bg-white border-slate-200 rounded-3xl shadow-xs">
                  <CardHeader className="p-5 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-slate-900">{aff.organizationName}</CardTitle>
                      <Badge variant={aff.status === "active" ? "teal" : "warning"} className="text-[10px]">
                        ● {aff.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-500 font-mono">
                      {aff.organizationIdentifier || aff.organizationId} • {aff.roleTitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-2 text-xs space-y-2 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Department:</span>
                      <span className="font-semibold text-slate-900">{aff.departmentName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>OPD Room:</span>
                      <span className="font-semibold text-slate-900">{aff.opdRoom || "Room 102"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Consultation Fee:</span>
                      <span className="font-bold text-teal-800">₹{aff.consultationFee}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: WEEKLY SCHEDULE */}
        {selectedTab === "schedule" && (
          <div className="space-y-4">
            <Link href="/doctor/schedule">
              <Button className="rounded-2xl h-10 px-5 text-xs font-bold bg-teal-700 hover:bg-teal-800">
                <span>Manage Working Sessions & Capacity →</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
