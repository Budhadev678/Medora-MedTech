"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Stethoscope, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Pause, 
  StopCircle, 
  ArrowRight, 
  X, 
  Volume2, 
  RotateCcw, 
  UserCheck, 
  UserX, 
  AlertOctagon, 
  RefreshCw, 
  HeartPulse, 
  ShieldAlert, 
  Radio, 
  Activity, 
  Zap, 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  getDoctorContext, 
  setDoctorSessionStatus, 
  setDoctorDutyStatus,
  DoctorActiveContext,
  DoctorSessionStatus
} from "@/lib/data/doctor-context-store";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { QueueManagementService } from "@/lib/services/queue-management-service";
import { WaitingTimeEstimationService } from "@/lib/services/waiting-time-service";
import { getEmergenciesForFacility, PatientEmergencyCase, acknowledgeEmergency, startPreparation } from "@/lib/data/emergency-store";
import { triggerBreakGlassEmergencyAccess } from "@/lib/data/consent-store";
import { getAllEncounters } from "@/lib/data/encounter-store";
import { ConsultationService } from "@/lib/services/consultation-service";
import { DoctorQueueSummary, QueueEntry, DoctorOperationalQueueStatus } from "@/types/database.types";

export default function DoctorWorkspacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const doctorId = user?.identifier || user?.id || "DOC-1001";
  
  const [context, setContext] = useState<DoctorActiveContext | null>(null);
  const [summaries, setSummaries] = useState<DoctorQueueSummary[]>([]);
  const [emergencies, setEmergencies] = useState<PatientEmergencyCase[]>([]);
  const [operationalStatuses, setOperationalStatuses] = useState<DoctorOperationalQueueStatus[]>([]);
  const [filterCategory, setFilterCategory] = useState<"ALL" | "WAITING" | "CURRENT" | "SKIPPED" | "COMPLETED">("ALL");
  
  // Action & Modal States
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [skipModalEntry, setSkipModalEntry] = useState<QueueEntry | null>(null);
  const [skipReason, setSkipReason] = useState("Patient stepped out of waiting lobby");
  const [noShowModalEntry, setNoShowModalEntry] = useState<QueueEntry | null>(null);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [attendEmergencyCase, setAttendEmergencyCase] = useState<PatientEmergencyCase | null>(null);
  const [isEmergencyActing, setIsEmergencyActing] = useState(false);

  const todayStr = getTodayDateStr();

  const loadData = () => {
    const ctx = getDoctorContext(doctorId);
    setContext(ctx);

    const facilityId = ctx?.facilityId || "HSP-1001";
    const queueList = QueueManagementService.getDoctorQueueSummary(doctorId, facilityId, todayStr);
    setSummaries(queueList);

    const ops = WaitingTimeEstimationService.getDoctorOperationalQueueStatus(doctorId, facilityId, todayStr);
    setOperationalStatuses(ops);

    const emrList = getEmergenciesForFacility("FAC-1001").filter(
      (e) => e.status !== "COMPLETED" && e.status !== "CANCELLED"
    );
    setEmergencies(emrList);
  };

  useEffect(() => {
    loadData();

    const handleContextChange = () => loadData();
    const handleQueueUpdate = () => loadData();

    window.addEventListener("medora-doctor-context-changed", handleContextChange);
    window.addEventListener("medora-queue-updated", handleQueueUpdate);

    return () => {
      window.removeEventListener("medora-doctor-context-changed", handleContextChange);
      window.removeEventListener("medora-queue-updated", handleQueueUpdate);
    };
  }, [doctorId]);

  const currentSummary = summaries[0];
  const currentPatient = currentSummary?.current_patient;
  const nextPatient = currentSummary?.next_patient;
  const waitingList = currentSummary?.waiting_list || [];
  const skippedList = currentSummary?.skipped_list || [];
  const completedCount = currentSummary?.completed_count || 0;
  const totalBooked = currentSummary?.booked_count || 0;
  const totalCapacity = currentSummary?.total_capacity || 12;
  const sessionStatus: DoctorSessionStatus = context?.sessionStatus || "ACTIVE";

  // Action: Call Next Patient
  const handleCallNext = async () => {
    if (!currentSummary || !user || sessionStatus === "PAUSED" || isProcessing) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await QueueManagementService.callNextPatient(
        { doctor_id: doctorId, session_id: currentSummary.session_id, date: todayStr },
        user
      );
      if (res.success) {
        setActionMessage({ type: "success", text: res.message });
        loadData();
      } else {
        setActionMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to call next patient." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Call Specific Patient
  const handleCallSpecific = async (entry: QueueEntry) => {
    if (!user || sessionStatus === "PAUSED" || isProcessing) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await QueueManagementService.callPatient(entry.id, user);
      if (res.success) {
        setActionMessage({ type: "success", text: res.message });
        loadData();
      } else {
        setActionMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to call patient." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Complete Consultation
  const handleCompleteConsultation = async (entry: QueueEntry) => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await QueueManagementService.completeConsultation(entry.id, user);
      if (res.success) {
        setActionMessage({ type: "success", text: `Consultation completed for Token #${entry.token_number} (${entry.patient_name}).` });
        loadData();
      } else {
        setActionMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to complete consultation." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Skip Patient
  const handleConfirmSkip = async () => {
    if (!skipModalEntry || !user || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await QueueManagementService.skipPatient(skipModalEntry.id, user, skipReason);
      if (res.success) {
        setActionMessage({ type: "success", text: `Patient Token #${skipModalEntry.token_number} moved to skipped list.` });
        setSkipModalEntry(null);
        loadData();
      } else {
        setActionMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to skip patient." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Recall Patient
  const handleRecallPatient = async (entry: QueueEntry) => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await QueueManagementService.recallPatient(entry.id, user);
      if (res.success) {
        setActionMessage({ type: "success", text: `Recalled Token #${entry.token_number} back to waiting queue.` });
        loadData();
      } else {
        setActionMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to recall patient." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: No-Show
  const handleConfirmNoShow = async () => {
    if (!noShowModalEntry || !user || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await QueueManagementService.markNoShow(noShowModalEntry.id, user, "Patient did not attend after multiple calls");
      if (res.success) {
        setActionMessage({ type: "success", text: `Marked Token #${noShowModalEntry.token_number} as No-Show.` });
        setNoShowModalEntry(null);
        loadData();
      } else {
        setActionMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to mark no-show." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Open Workbench dynamically bound to patient encounter
  const handleOpenWorkbenchForPatient = async (entry: QueueEntry) => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      // 1. Check if encounter already exists for this entry or patient
      const allEncounters = getAllEncounters();
      let match = allEncounters.find(
        (e) =>
          e.queue_entry_id === entry.id ||
          (entry.appointment_id && e.appointment_id?.toLowerCase() === entry.appointment_id?.toLowerCase()) ||
          (e.patient_id === entry.patient_id && e.provider_id === doctorId && (e.status === "ACTIVE" || entry.status === "IN_CONSULTATION"))
      );

      if (match) {
        // Sync queue entry if needed
        if (entry.status !== "IN_CONSULTATION") {
          QueueStore.saveQueueEntry({
            ...entry,
            status: "IN_CONSULTATION",
            encounter_id: match.id,
            consultation_started_at: new Date().toISOString(),
          });
        }
        router.push(`/doctor/consultations/${match.id}`);
        return;
      }

      // 2. Start consultation from queue entry to create/link canonical encounter
      const startRes = await ConsultationService.startConsultationFromQueue(entry.id, user);
      if (startRes.success && startRes.encounter) {
        router.push(`/doctor/consultations/${startRes.encounter.id}`);
        return;
      }

      // 3. Fallback to any encounter for this patient
      match = allEncounters.find((e) => e.patient_id === entry.patient_id);
      if (match) {
        router.push(`/doctor/consultations/${match.id}`);
      } else {
        setActionMessage({ type: "error", text: startRes.message || "Failed to initialize consultation workbench." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to open clinical workbench." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Session State Toggle (Pause / Resume / End)
  const handleToggleSessionPause = () => {
    const nextState: DoctorSessionStatus = sessionStatus === "PAUSED" ? "ACTIVE" : "PAUSED";
    setDoctorSessionStatus(doctorId, nextState);
    loadData();
  };

  const handleAcknowledgeEmergency = (em: PatientEmergencyCase) => {
    setIsEmergencyActing(true);
    try {
      const res = acknowledgeEmergency(em.id, doctorId, user?.fullName || "Attending Physician", user?.role || "doctor");
      startPreparation(em.id, doctorId, user?.fullName || "Attending Physician", user?.role || "doctor");
      if (res.success) {
        setActionMessage({
          type: "success",
          text: `Emergency Case ${em.case_number} acknowledged and Trauma Bay 1 mobilized.`,
        });
        loadData();
      }
    } finally {
      setIsEmergencyActing(false);
    }
  };

  const handleBreakGlassEmergencyRecords = (em: PatientEmergencyCase) => {
    setIsEmergencyActing(true);
    try {
      const res = triggerBreakGlassEmergencyAccess({
        patientId: em.patient_id,
        patientName: em.patient_name,
        actorId: doctorId,
        actorName: user?.fullName || "Dr. Ananya Sharma",
        actorRole: user?.role || "doctor",
        organizationId: em.hospital_id || context?.facilityId || "FAC-1001",
        organizationName: em.hospital_name || context?.facilityName || "City Hospital",
        justificationReason: `Rapid trauma ingress response for ${em.case_number} (${em.emergency_type})`,
        emergencyCaseId: em.id,
      });

      if (res.success) {
        setActionMessage({
          type: "success",
          text: `Emergency break-glass medical records access unlocked and stamped in institutional audit ledger.`,
        });
      }
    } finally {
      setIsEmergencyActing(false);
    }
  };

  const handleEndSession = () => {
    setDoctorSessionStatus(doctorId, "ENDED");
    setDoctorDutyStatus(doctorId, "OFF_DUTY");
    setShowEndSessionModal(false);
    loadData();
  };

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        
        {/* Urgent Emergency Pre-Alert Banner */}
        {emergencies.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-red-600 text-white px-2 py-0.5 rounded">
                    EMERGENCY INGRESS
                  </span>
                  <span className="font-mono text-xs font-bold text-red-950">
                    {emergencies[0].case_number}
                  </span>
                </div>
                <p className="text-xs font-semibold text-red-900 mt-0.5">
                  <strong>{emergencies[0].patient_name}</strong> • {emergencies[0].emergency_type.replace("_", " ")} — {emergencies[0].description}
                </p>
                <p className="text-[11px] text-red-700 font-mono mt-0.5">
                  Status: <strong>{emergencies[0].status}</strong> {emergencies[0].arriving_by_ambulance ? `(Ambulance ETA: ${emergencies[0].eta_minutes || 0}m)` : "(Direct Walk-in ER)"}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              type="button"
              onClick={() => setAttendEmergencyCase(emergencies[0])}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shrink-0 gap-1.5 shadow-xs"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Attend Emergency</span>
            </Button>
          </div>
        )}

        {/* Operational Action Notification Toast */}
        {actionMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Operational Session Control Header */}
        <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
          <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Session Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="teal" className="text-[10px] font-bold">
                  {currentSummary?.session_time || "08:00 AM - 12:00 PM"}
                </Badge>
                <span className="font-bold text-slate-900 text-sm">
                  {context?.departmentName || "Cardiology OPD"}
                </span>
                <span className="text-slate-400 font-mono text-xs">·</span>
                <span className="text-slate-600 font-mono text-xs font-semibold">
                  {context?.opdRoom || "Room 102"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                OPD Schedule Session Capacity: <strong>{totalCapacity} Slots</strong> • Currently Booked: <strong>{totalBooked}</strong>
              </p>
            </div>

            {/* Session State Badge & Control Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {sessionStatus === "PAUSED" && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs py-1 px-2.5">
                  SESSION PAUSED
                </Badge>
              )}
              {sessionStatus === "ENDED" && (
                <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-bold text-xs py-1 px-2.5">
                  SESSION ENDED
                </Badge>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleSessionPause}
                disabled={sessionStatus === "ENDED" || isProcessing}
                className="h-8 text-xs font-semibold rounded-xl gap-1.5 border-slate-200"
              >
                {sessionStatus === "PAUSED" ? (
                  <>
                    <Play className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Resume Session</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5 text-amber-600" />
                    <span>Pause Session</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEndSessionModal(true)}
                disabled={sessionStatus === "ENDED" || isProcessing}
                className="h-8 text-xs font-semibold rounded-xl text-rose-700 hover:bg-rose-50 hover:border-rose-200 border-slate-200 gap-1.5"
              >
                <StopCircle className="h-3.5 w-3.5 text-rose-600" />
                <span>End OPD Session</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={loadData}
                className="h-8 text-xs font-semibold rounded-xl border-slate-200 gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isProcessing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* OPD Capacity & Operational Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white rounded-xl shadow-xs border-slate-200 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Waiting in Lobby</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{waitingList.length}</span>
              <span className="text-xs text-slate-500 font-medium">patients</span>
            </div>
          </Card>

          <Card className="bg-white rounded-xl shadow-xs border-slate-200 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Consultation</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-teal-700">{currentPatient ? "1" : "0"}</span>
              <span className="text-xs text-slate-500 font-medium">active</span>
            </div>
          </Card>

          <Card className="bg-white rounded-xl shadow-xs border-slate-200 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Today</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-700">{completedCount}</span>
              <span className="text-xs text-slate-500 font-medium">finished</span>
            </div>
          </Card>

          <Card className="bg-white rounded-xl shadow-xs border-slate-200 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skipped / On Hold</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600">{skippedList.length}</span>
              <span className="text-xs text-slate-500 font-medium">re-callable</span>
            </div>
          </Card>
        </div>

        {/* PRIMARY OPERATIONAL WORKBENCH: Current Patient Slot */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Active Patient in Consultation */}
          <div className="lg:col-span-2 space-y-4">
            <Card className={`rounded-2xl shadow-xs transition-all ${
              currentPatient 
                ? "bg-white border-2 border-teal-500 shadow-md" 
                : "bg-slate-50/70 border-dashed border-2 border-slate-200"
            }`}>
              <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-teal-700" />
                  <span>Current Patient In Consultation</span>
                </CardTitle>

                {currentPatient && (
                  <Badge variant="teal" className="text-[10px] font-mono font-bold animate-pulse">
                    ACTIVE ENCOUNTER
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="p-5">
                {currentPatient ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                      
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl bg-teal-600 text-white font-mono font-black text-lg flex items-center justify-center shrink-0">
                          {currentPatient.token_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900">{currentPatient.patient_name}</h3>
                            <span className="text-[10px] font-mono font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                              {currentPatient.patient_id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            Appointment: <strong className="font-mono text-slate-900">{currentPatient.appointment_id || "Direct Check-in"}</strong> • Room: <strong className="text-slate-900">{currentPatient.room_number || "Room 102"}</strong>
                          </p>
                          <p className="text-[11px] text-teal-800 font-mono mt-0.5">
                            Checked in at: {new Date(currentPatient.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                        <Badge className="bg-teal-700 text-white text-xs font-bold">
                          {currentPatient.status.replace("_", " ")}
                        </Badge>
                      </div>

                    </div>

                    {/* Operational Actions for Current Patient */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleOpenWorkbenchForPatient(currentPatient)}
                          disabled={isProcessing}
                          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-xs"
                        >
                          <Stethoscope className="h-4 w-4" />
                          <span>Open Clinical Workbench</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSkipModalEntry(currentPatient)}
                          disabled={isProcessing}
                          className="h-9 text-xs font-semibold text-amber-700 hover:bg-amber-50 border-amber-200 rounded-xl gap-1"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          <span>Hold / Skip</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNoShowModalEntry(currentPatient)}
                          disabled={isProcessing}
                          className="h-9 text-xs font-semibold text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl gap-1"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>No-Show</span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleCompleteConsultation(currentPatient)}
                          disabled={isProcessing}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-9 rounded-xl gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Complete Visit</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Doctor OPD Ready</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {waitingList.length > 0 
                          ? `${waitingList.length} patient(s) waiting in the lobby. Call the next patient to begin.` 
                          : "No patients currently in consultation. You're all caught up."}
                      </p>
                    </div>

                    {waitingList.length > 0 && sessionStatus === "ACTIVE" && (
                      <Button
                        onClick={handleCallNext}
                        disabled={isProcessing}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-sm"
                      >
                        <Volume2 className="h-4 w-4" />
                        <span>Call Next Patient ({nextPatient?.token_number || "Next"})</span>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Next Patient Call Panel */}
          <div className="space-y-4">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Next in Queue</span>
                  <span className="font-mono text-teal-700 font-bold">{waitingList.length} Waiting</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {nextPatient ? (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="h-7 px-2 bg-teal-100 text-teal-800 rounded font-mono font-bold text-xs flex items-center justify-center">
                        {nextPatient.token_number}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Sequence #{nextPatient.token_sequence}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{nextPatient.patient_name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{nextPatient.patient_id}</p>
                    </div>
                    
                    <Button
                      onClick={() => handleCallSpecific(nextPatient)}
                      disabled={sessionStatus === "PAUSED" || isProcessing}
                      size="sm"
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-8 rounded-xl gap-1.5 shadow-xs"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Call to Room {context?.opdRoom || "102"}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <Clock className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
                    <span>No waiting patients in this session.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FULL PATIENT QUEUE TABLE WITH OPERATIONAL TABS */}
        <Card className="bg-white rounded-2xl shadow-xs border-slate-200 overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-700" />
                <span>Today's Patient Queue Registry</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Deterministic token sequence for {context?.facilityName || "City Hospital"} • {context?.departmentName || "Cardiology OPD"}
              </CardDescription>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterCategory("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === "ALL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({(waitingList.length) + (currentPatient ? 1 : 0) + skippedList.length + completedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory("WAITING")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === "WAITING" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Waiting ({waitingList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory("SKIPPED")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === "SKIPPED" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Skipped ({skippedList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory("COMPLETED")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === "COMPLETED" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-slate-100">
                    <TableHead className="text-[11px] font-bold text-slate-600 uppercase w-20">Token</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-600 uppercase">Patient Information</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-600 uppercase">Checked In</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-600 uppercase">Status</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-600 uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  
                  {/* Render Current Patient if applicable */}
                  {currentPatient && (filterCategory === "ALL" || filterCategory === "CURRENT") && (
                    <TableRow className="bg-teal-50/40 hover:bg-teal-50/60 font-medium">
                      <TableCell className="font-mono font-black text-teal-800">{currentPatient.token_number}</TableCell>
                      <TableCell>
                        <div className="font-bold text-xs text-slate-900">{currentPatient.patient_name}</div>
                        <span className="font-mono text-[10px] text-slate-500">{currentPatient.patient_id}</span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {new Date(currentPatient.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-teal-700 text-white text-[10px]">IN CONSULTATION</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleOpenWorkbenchForPatient(currentPatient)}
                          disabled={isProcessing}
                          className="h-7 text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg gap-1 shadow-2xs"
                        >
                          <span>Open</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Render Waiting List */}
                  {(filterCategory === "ALL" || filterCategory === "WAITING") &&
                    waitingList.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-slate-50/70">
                        <TableCell className="font-mono font-bold text-slate-900">{entry.token_number}</TableCell>
                        <TableCell>
                          <div className="font-bold text-xs text-slate-900">{entry.patient_name}</div>
                          <span className="font-mono text-[10px] text-slate-500">{entry.patient_id}</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {new Date(entry.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] text-slate-700 bg-slate-50">WAITING</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCallSpecific(entry)}
                            disabled={sessionStatus === "PAUSED" || isProcessing}
                            className="h-7 text-xs font-semibold rounded-lg text-teal-800 border-teal-200 hover:bg-teal-50"
                          >
                            <Volume2 className="h-3 w-3 mr-1" /> Call
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSkipModalEntry(entry)}
                            disabled={isProcessing}
                            className="h-7 text-xs font-semibold rounded-lg text-amber-700 hover:bg-amber-50"
                          >
                            Skip
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setNoShowModalEntry(entry)}
                            disabled={isProcessing}
                            className="h-7 text-xs font-semibold rounded-lg text-rose-700 hover:bg-rose-50"
                          >
                            No-Show
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                  {/* Render Skipped List */}
                  {(filterCategory === "ALL" || filterCategory === "SKIPPED") &&
                    skippedList.map((entry) => (
                      <TableRow key={entry.id} className="bg-amber-50/30 hover:bg-amber-50/50">
                        <TableCell className="font-mono font-bold text-amber-900">{entry.token_number}</TableCell>
                        <TableCell>
                          <div className="font-bold text-xs text-slate-900">{entry.patient_name}</div>
                          <span className="text-[10px] text-amber-800 italic">Reason: {entry.notes || "Bypassed"}</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {new Date(entry.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50 border-amber-300">SKIPPED</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRecallPatient(entry)}
                            disabled={isProcessing}
                            className="h-7 text-xs font-bold rounded-lg text-emerald-800 border-emerald-300 hover:bg-emerald-50 gap-1"
                          >
                            <RotateCcw className="h-3 w-3" /> Recall to Queue
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                  {waitingList.length === 0 && !currentPatient && skippedList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-xs text-slate-400">
                        <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto mb-1 opacity-70" />
                        <span className="block font-bold text-slate-800 text-xs">No active queue entries</span>
                        <span className="text-[11px] text-slate-400">All registered OPD patients for this session have been completed.</span>
                      </TableCell>
                    </TableRow>
                  )}

                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* MODAL: Skip Patient Confirmation */}
        {skipModalEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Skip / Hold Patient in Queue</h3>
                  <p className="text-xs text-slate-500">Token #{skipModalEntry.token_number} • {skipModalEntry.patient_name}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skipping this patient will bypass them in the active sequence and move them to the <strong>Skipped List</strong>. You can recall them at any point during this session.
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Clinical / Operational Reason</label>
                <input
                  type="text"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-teal-600"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button size="sm" variant="ghost" onClick={() => setSkipModalEntry(null)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirmSkip} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl">
                  Confirm Skip
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: No-Show Confirmation */}
        {noShowModalEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Mark Patient as No-Show</h3>
                  <p className="text-xs text-slate-500">Token #{noShowModalEntry.token_number} • {noShowModalEntry.patient_name}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to mark this patient as <strong>NO-SHOW</strong>? The appointment slot will be released, and the operational record will be archived with full audit traceability.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button size="sm" variant="ghost" onClick={() => setNoShowModalEntry(null)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirmNoShow} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl">
                  Confirm No-Show
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: End OPD Session Confirmation */}
        {showEndSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <StopCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Conclude OPD Working Session</h3>
                  <p className="text-xs text-slate-500">{context?.facilityName} • {context?.departmentName}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ending this OPD session will finalize the operational queue for today. {waitingList.length > 0 && `Note: ${waitingList.length} patient(s) still remain waiting in the lobby.`}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button size="sm" variant="ghost" onClick={() => setShowEndSessionModal(false)} className="text-xs">
                  Keep Active
                </Button>
                <Button size="sm" onClick={handleEndSession} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl">
                  Conclude Session
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Emergency Ingress Live Attendance (No Redirect) */}
        {attendEmergencyCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border-2 border-red-300 space-y-4 max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0">
                    <AlertOctagon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded">
                        CRITICAL LEVEL-1 EMERGENCY
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {attendEmergencyCase.case_number}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
                      Emergency Clinical Ingress Response
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAttendEmergencyCase(null)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Patient & Arrival Snapshot */}
              <div className="p-3.5 bg-red-50/70 rounded-2xl border border-red-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-red-800 block">Patient Identity</span>
                    <p className="font-black text-slate-900 text-sm">{attendEmergencyCase.patient_name}</p>
                    <span className="font-mono text-slate-600 text-[11px]">{attendEmergencyCase.patient_id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-red-800 block">Blood Group</span>
                    <Badge variant="outline" className="font-black text-xs text-rose-700 bg-white border-rose-300">
                      {attendEmergencyCase.blood_group || "O+"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t border-red-200/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 font-bold block">Status & Transit</span>
                    <span className="font-bold text-red-950">
                      {attendEmergencyCase.status} {attendEmergencyCase.arriving_by_ambulance ? `(ETA: ${attendEmergencyCase.eta_minutes || 0}m)` : "(Direct ER)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Designated Area</span>
                    <span className="font-bold text-slate-900">
                      {attendEmergencyCase.assigned_area || "Trauma Bay 1"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-red-200/60">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Clinical Indication / Presentation</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">
                    {attendEmergencyCase.emergency_type.replace("_", " ")} — {attendEmergencyCase.description}
                  </p>
                </div>
              </div>

              {/* Actions Box */}
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Rapid Clinical Response Actions
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => handleAcknowledgeEmergency(attendEmergencyCase)}
                    disabled={isEmergencyActing}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl h-10 gap-1.5 shadow-xs"
                  >
                    <HeartPulse className="h-4 w-4" />
                    <span>Mobilize Trauma Bay</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleBreakGlassEmergencyRecords(attendEmergencyCase)}
                    disabled={isEmergencyActing}
                    variant="outline"
                    className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl h-10 gap-1.5 shadow-2xs"
                  >
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <span>Break-Glass Unlock</span>
                  </Button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-teal-600" />
                    <span>Trauma Stabilization Protocol Activated</span>
                  </p>
                  <p>
                    Attending physician {user?.fullName || "Dr. Ananya Sharma"} assigned as supervising clinical authority for {attendEmergencyCase.case_number}.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAttendEmergencyCase(null)}
                  className="text-xs font-semibold rounded-xl"
                >
                  Close & Continue OPD
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
