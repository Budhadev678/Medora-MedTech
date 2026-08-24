"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Ambulance, 
  Clock, 
  CheckCircle2, 
  Users, 
  Building2, 
  Activity, 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  X, 
  ChevronRight, 
  ArrowRight, 
  RefreshCw, 
  Stethoscope, 
  Phone, 
  UserCheck, 
  Send, 
  FileText, 
  AlertCircle,
  Truck,
  HeartPulse,
  Radio
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getFacilityById } from "@/lib/data/facility-store";
import { 
  getAllEmergencies, 
  PatientEmergencyCase, 
  EmergencyStatus,
  EmergencyType,
  EmergencyPriority,
  acknowledgeEmergency,
  startPreparation,
  toggleChecklistItem,
  assignEmergencyTeam,
  markPatientArrived,
  startEmergencyCare,
  linkEmergencyPatient,
  handoffToAdmission,
  handoffTransfer,
  handoffDischarge,
  cancelEmergencyCase,
  createEmergencyCase
} from "@/lib/data/emergency-store";
import { getAllIdentities } from "@/lib/data/identity-store";

export default function EmergencyControlCenterPage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode) || getFacilityById("FAC-1001");
  const targetFacId = facility?.facility_code || "FAC-1001";

  const [filterStatus, setFilterStatus] = useState<"ACTIVE" | "INCOMING" | "PREPARING" | "ARRIVED" | "EMERGENCY_CARE" | "COMPLETED">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Cancellation modal state
  const [cancellingCaseId, setCancellingCaseId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Transfer modal state
  const [transferringCaseId, setTransferringCaseId] = useState<string | null>(null);
  const [transferDest, setTransferDest] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferAmbRef, setTransferAmbRef] = useState("");

  // Admission handoff modal state
  const [admittingCaseId, setAdmittingCaseId] = useState<string | null>(null);
  const [admDoctor, setAdmDoctor] = useState("Dr. Ananya Sharma");
  const [admDept, setAdmDept] = useState("Cardiology & Cath Lab");
  const [admReason, setAdmReason] = useState("");

  // Link patient modal state
  const [linkingCaseId, setLinkingCaseId] = useState<string | null>(null);
  const [linkPatientId, setLinkPatientId] = useState("PAT-1001");

  // Create Emergency state
  const [newEmergencyType, setNewEmergencyType] = useState<EmergencyType>("CHEST_PAIN");
  const [newPriority, setNewPriority] = useState<EmergencyPriority>("CRITICAL");
  const [newChiefComplaint, setNewChiefComplaint] = useState("");
  const [newArrivalMethod, setNewArrivalMethod] = useState<"AMBULANCE" | "WALK_IN" | "HOSPITAL_TRANSFER">("AMBULANCE");
  const [newAmbulanceId, setNewAmbulanceId] = useState("AMB-OD-02-108");
  const [newEta, setNewEta] = useState<number | ""> (10);
  const [newIsUnknown, setNewIsUnknown] = useState(false);
  const [newPatientId, setNewPatientId] = useState("PAT-1001");
  const [newPatientName, setNewPatientName] = useState("Rahul Verma");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  // Listen for storage events
  useEffect(() => {
    const handleUpdate = () => setIsRefreshing((prev) => !prev);
    window.addEventListener("medora-emergencies-updated", handleUpdate);
    return () => window.removeEventListener("medora-emergencies-updated", handleUpdate);
  }, []);

  const allEmergencies = useMemo(() => {
    try {
      return getAllEmergencies(targetFacId);
    } catch {
      setHasError(true);
      return [];
    }
  }, [targetFacId, isRefreshing]);

  // Derived counts
  const activeEmergencies = allEmergencies.filter(
    (e) => e.status !== "COMPLETED" && e.status !== "CANCELLED" && e.status !== "DISCHARGED"
  );
  const incomingEmergencies = activeEmergencies.filter((e) => e.status === "INCOMING");
  const preparingEmergencies = activeEmergencies.filter((e) => e.status === "PREPARING");
  const waitingForResponse = activeEmergencies.filter((e) => e.status === "INCOMING" || e.status === "ACKNOWLEDGED");

  // Filtered emergency list
  const filteredEmergencies = useMemo(() => {
    let list = allEmergencies;

    if (filterStatus === "ACTIVE") {
      list = list.filter((e) => e.status !== "COMPLETED" && e.status !== "CANCELLED" && e.status !== "DISCHARGED");
    } else if (filterStatus === "INCOMING") {
      list = list.filter((e) => e.status === "INCOMING");
    } else if (filterStatus === "PREPARING") {
      list = list.filter((e) => e.status === "PREPARING");
    } else if (filterStatus === "ARRIVED") {
      list = list.filter((e) => e.status === "ARRIVED");
    } else if (filterStatus === "EMERGENCY_CARE") {
      list = list.filter((e) => e.status === "EMERGENCY_CARE");
    } else if (filterStatus === "COMPLETED") {
      list = list.filter((e) => e.status === "COMPLETED" || e.status === "CANCELLED" || e.status === "DISCHARGED" || e.status === "ADMITTED" || e.status === "TRANSFERRED");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          e.case_number.toLowerCase().includes(q) ||
          e.patient_name.toLowerCase().includes(q) ||
          e.patient_id.toLowerCase().includes(q) ||
          (e.ambulance_id && e.ambulance_id.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allEmergencies, filterStatus, searchQuery]);

  const selectedCase = useMemo(() => {
    if (!selectedCaseId) return null;
    return allEmergencies.find((e) => e.id === selectedCaseId) || null;
  }, [allEmergencies, selectedCaseId]);

  const actorId = user?.identifier || user?.id || "STAFF-ER-101";
  const actorName = user?.fullName || "Dr. Emergency Lead";
  const actorRole = user?.role || "emergency_staff";

  // Actions
  const handleAcknowledge = (id: string) => {
    acknowledgeEmergency(id, actorId, actorName, actorRole);
    setIsRefreshing((prev) => !prev);
  };

  const handleStartPrep = (id: string) => {
    startPreparation(id, actorId, actorName, actorRole);
    setIsRefreshing((prev) => !prev);
  };

  const handleMarkArrived = (id: string) => {
    markPatientArrived(id, actorId, actorName, actorRole);
    setIsRefreshing((prev) => !prev);
  };

  const handleStartCare = (id: string) => {
    startEmergencyCare(id, actorId, actorName, actorRole);
    setIsRefreshing((prev) => !prev);
  };

  const handleCancelSubmit = () => {
    if (!cancellingCaseId || !cancelReason.trim()) return;
    cancelEmergencyCase({
      emergencyId: cancellingCaseId,
      reason: cancelReason.trim(),
      actorId,
      actorName,
      actorRole,
    });
    setCancellingCaseId(null);
    setCancelReason("");
    setIsRefreshing((prev) => !prev);
  };

  const handleTransferSubmit = () => {
    if (!transferringCaseId || !transferDest.trim()) return;
    handoffTransfer({
      emergencyId: transferringCaseId,
      destinationFacility: transferDest.trim(),
      transferReason: transferReason.trim() || "Advanced tertiary trauma care required",
      ambulanceRef: transferAmbRef.trim() || "108 Critical Transport Unit",
      actorId,
      actorName,
      actorRole,
    });
    setTransferringCaseId(null);
    setTransferDest("");
    setTransferReason("");
    setTransferAmbRef("");
    setIsRefreshing((prev) => !prev);
  };

  const handleAdmissionSubmit = () => {
    if (!admittingCaseId) return;
    handoffToAdmission({
      emergencyId: admittingCaseId,
      doctorId: admDoctor.includes("Ananya") ? "DOC-1001" : "DOC-1002",
      doctorName: admDoctor,
      departmentName: admDept,
      reason: admReason.trim() || "Post-emergency clinical observation and inpatient stabilization",
      actorId,
      actorName,
      actorRole,
    });
    setAdmittingCaseId(null);
    setAdmReason("");
    setIsRefreshing((prev) => !prev);
  };

  const handleDischargeSubmit = (id: string) => {
    handoffDischarge({
      emergencyId: id,
      dischargeNotes: "Patient vital signs stabilized. Medical snapshot reviewed. Cleared for outpatient follow-up.",
      actorId,
      actorName,
      actorRole,
    });
    setIsRefreshing((prev) => !prev);
  };

  const handleLinkPatientSubmit = () => {
    if (!linkingCaseId || !linkPatientId) return;
    linkEmergencyPatient({
      emergencyId: linkingCaseId,
      patientId: linkPatientId,
      actorId,
      actorName,
      actorRole,
    });
    setLinkingCaseId(null);
    setIsRefreshing((prev) => !prev);
  };

  const handleCreateEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChiefComplaint.trim()) return;

    createEmergencyCase({
      hospitalId: targetFacId,
      hospitalName: facility?.name || "City Hospital Trauma Center",
      patientId: newIsUnknown ? "UNKNOWN" : newPatientId,
      patientName: newIsUnknown ? "UNKNOWN PATIENT" : newPatientName,
      emergencyType: newEmergencyType,
      chiefComplaint: newChiefComplaint.trim(),
      arrivalMethod: newArrivalMethod,
      ambulanceId: newArrivalMethod === "AMBULANCE" ? newAmbulanceId : undefined,
      etaMinutes: newArrivalMethod === "AMBULANCE" && typeof newEta === "number" ? newEta : null,
      priority: newPriority,
      actorId,
      actorName,
      actorRole,
    });

    setIsCreateModalOpen(false);
    setNewChiefComplaint("");
    setIsRefreshing((prev) => !prev);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-6 animate-pulse">
        <div className="h-24 bg-white rounded-xl border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-white rounded-xl border border-slate-200" />
          <div className="h-24 bg-white rounded-xl border border-slate-200" />
          <div className="h-24 bg-white rounded-xl border border-slate-200" />
        </div>
        <div className="h-96 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Emergency control could not be loaded</h2>
        <p className="text-xs text-slate-500">A connection error occurred while loading active emergency cases.</p>
        <Button onClick={() => { setHasError(false); setIsRefreshing((prev) => !prev); }} size="sm" className="bg-red-700 hover:bg-red-800 text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "emergency_staff", "doctor", "receptionist"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200 font-sans pb-12">
        
        {/* ============================================================ */}
        {/* 1. EMERGENCY CONTROL CENTER HEADER & METRICS                 */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-600 animate-ping" />
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" /> Emergency Control Center
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-red-50 text-red-800 border-red-200 font-bold">
                {targetFacId}
              </Badge>
              <Badge variant="outline" className="text-[11px] text-emerald-700 bg-emerald-50 border-emerald-200 flex items-center gap-1 font-semibold">
                <Radio className="h-3 w-3 text-emerald-600 animate-pulse" /> Live Realtime Sync
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rapid Hospital Response Desk • {facility?.name || "City Hospital Trauma Center"} • Step 2 of 5 Operational Architecture
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> New Pre-Alert / Arrival
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsRefreshing((prev) => !prev)} className="text-xs gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} /> Refresh
            </Button>
            <Link href="/hospital">
              <Button variant="outline" size="sm" className="text-xs">
                Control Center
              </Button>
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. OPERATIONAL KPI SUMMARY CARDS                             */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className={`border-slate-200 shadow-xs ${activeEmergencies.length > 0 ? "bg-red-50/60 border-red-200" : "bg-white"}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Active Emergencies</span>
                <span className="text-2xl font-black text-red-600">{activeEmergencies.length}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Critical trauma cases requiring operational readiness</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Incoming Ingress (Pre-Alert)</span>
                <span className="text-2xl font-black text-amber-600">{incomingEmergencies.length}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Ambulance & transit cases en route</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Ambulance className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Waiting for Response</span>
                <span className="text-2xl font-black text-blue-700">{waitingForResponse.length}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Awaiting staff acknowledgement or bay prep</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================================ */}
        {/* 3. FILTERS, SEARCH & EMERGENCY QUEUE                         */}
        {/* ============================================================ */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(
                  [
                    { key: "ACTIVE", label: "Active Queue", count: activeEmergencies.length },
                    { key: "INCOMING", label: "Incoming", count: incomingEmergencies.length },
                    { key: "PREPARING", label: "Preparing", count: preparingEmergencies.length },
                    { key: "ARRIVED", label: "Arrived", count: allEmergencies.filter((e) => e.status === "ARRIVED").length },
                    { key: "EMERGENCY_CARE", label: "In ER Care", count: allEmergencies.filter((e) => e.status === "EMERGENCY_CARE").length },
                    { key: "COMPLETED", label: "Resolved / History", count: allEmergencies.filter((e) => e.status === "COMPLETED" || e.status === "DISCHARGED" || e.status === "ADMITTED" || e.status === "CANCELLED" || e.status === "TRANSFERRED").length },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterStatus(tab.key)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                      filterStatus === tab.key
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterStatus === tab.key ? "bg-slate-700 text-white" : "bg-white text-slate-700 font-bold"}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search case #, patient, ambulance..."
                  className="text-xs pl-8 h-8 bg-slate-50 border-slate-200"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredEmergencies.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredEmergencies.map((emg) => {
                  const isIncoming = emg.status === "INCOMING";
                  const isAck = emg.status === "ACKNOWLEDGED";
                  const isPrep = emg.status === "PREPARING";
                  const isArr = emg.status === "ARRIVED";
                  const isCare = emg.status === "EMERGENCY_CARE";
                  const isCompleted = emg.status === "COMPLETED" || emg.status === "DISCHARGED" || emg.status === "CANCELLED" || emg.status === "ADMITTED" || emg.status === "TRANSFERRED";

                  return (
                    <div 
                      key={emg.id}
                      className={`p-4 transition-colors hover:bg-slate-50/80 ${
                        isIncoming ? "bg-red-50/30" : ""
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Case Details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              variant={emg.priority === "CRITICAL" ? "destructive" : emg.priority === "HIGH" ? "warning" : "default"}
                              className="text-[10px] font-bold uppercase tracking-wider"
                            >
                              🚨 {emg.priority}
                            </Badge>
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              {emg.id}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                isIncoming ? "bg-red-100 text-red-800 border-red-300" :
                                isPrep ? "bg-amber-100 text-amber-800 border-amber-300" :
                                isCare ? "bg-teal-100 text-teal-800 border-teal-300" :
                                isCompleted ? "bg-slate-100 text-slate-700" :
                                "bg-blue-100 text-blue-800 border-blue-300"
                              }`}
                            >
                              ● Status: {emg.status}
                            </Badge>

                            {emg.is_unknown_patient && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                                ⚠️ UNKNOWN PATIENT
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-bold text-slate-900">
                              {emg.patient_name}
                            </h3>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-semibold text-slate-700">
                              {emg.emergency_type.replace(/_/g, " ")}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-1">
                            {emg.chief_complaint}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                            <span className="flex items-center gap-1 font-medium">
                              <Truck className="h-3.5 w-3.5 text-slate-400" />
                              {emg.arrival_method === "AMBULANCE" ? (emg.ambulance_id || "Ambulance Ingress") : "Walk-in ER"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <Clock className="h-3.5 w-3.5 text-teal-600" />
                              ETA: {emg.eta_minutes !== null && emg.eta_minutes !== undefined 
                                ? `${emg.eta_minutes} mins` 
                                : (emg.status === "ARRIVED" ? "Arrived at Bay" : "ETA unavailable")}
                            </span>
                            <span>•</span>
                            <span>
                              Assigned Team: <strong className="text-slate-800">{emg.assigned_team || "Trauma Response Desk"}</strong>
                            </span>
                            {emg.assigned_area && (
                              <>
                                <span>•</span>
                                <span>Bay: <strong className="text-slate-800">{emg.assigned_area}</strong></span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Operational Action Buttons (State-Driven Workflow) */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {isIncoming && (
                            <Button 
                              onClick={() => handleAcknowledge(emg.id)}
                              size="sm" 
                              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Acknowledge Pre-Alert
                            </Button>
                          )}

                          {isAck && (
                            <Button 
                              onClick={() => handleStartPrep(emg.id)}
                              size="sm" 
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                            >
                              <Activity className="h-3.5 w-3.5 mr-1" /> Start Operational Preparation
                            </Button>
                          )}

                          {isPrep && (
                            <Button 
                              onClick={() => handleMarkArrived(emg.id)}
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Patient Arrived
                            </Button>
                          )}

                          {isArr && (
                            <Button 
                              onClick={() => handleStartCare(emg.id)}
                              size="sm" 
                              className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs"
                            >
                              <Stethoscope className="h-3.5 w-3.5 mr-1" /> Start Emergency Care
                            </Button>
                          )}

                          {isCare && (
                            <div className="flex items-center gap-1.5">
                              <Button 
                                onClick={() => setAdmittingCaseId(emg.id)}
                                size="sm" 
                                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs"
                              >
                                Admission Handoff
                              </Button>
                              <Button 
                                onClick={() => setTransferringCaseId(emg.id)}
                                size="sm" 
                                variant="outline"
                                className="text-xs"
                              >
                                Transfer
                              </Button>
                              <Button 
                                onClick={() => handleDischargeSubmit(emg.id)}
                                size="sm" 
                                variant="outline"
                                className="text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              >
                                Discharge / Clear
                              </Button>
                            </div>
                          )}

                          {/* Open Details Modal */}
                          <Button 
                            onClick={() => setSelectedCaseId(emg.id)}
                            size="sm" 
                            variant="outline" 
                            className="text-xs font-semibold text-slate-700"
                          >
                            Open Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>

                          {/* Quick Cancel if not finished */}
                          {!isCompleted && (
                            <Button 
                              onClick={() => setCancellingCaseId(emg.id)}
                              size="sm" 
                              variant="ghost" 
                              className="text-xs text-slate-400 hover:text-red-600"
                              title="Cancel Emergency Case"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State (Section 42 & 84 of PDF) */
              <div className="p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No active emergencies</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  The trauma bay and rapid response teams are clear and on standard operational readiness standby.
                </p>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Emergency Pre-Alert
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* 4. EMERGENCY CASE DETAIL MODAL / DRAWER                      */}
        {/* ============================================================ */}
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in-50">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                  <h2 className="text-base font-extrabold text-slate-900">
                    Emergency Case #{selectedCase.id}
                  </h2>
                  <Badge variant="outline" className="text-xs font-mono bg-white font-bold">
                    {selectedCase.case_number}
                  </Badge>
                  <Badge 
                    variant={selectedCase.priority === "CRITICAL" ? "destructive" : "warning"}
                    className="text-[10px] uppercase font-bold"
                  >
                    {selectedCase.priority}
                  </Badge>
                </div>
                <button 
                  onClick={() => setSelectedCaseId(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                  aria-label="Close Case Details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-6 text-xs flex-1">
                
                {/* Clinical Notice (Section 27 & 71 of PDF: Hospital does not make clinical decisions) */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-[11px] text-blue-900 flex items-start gap-2.5">
                  <Stethoscope className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Operational vs Clinical Boundary:</strong>
                    Hospital Emergency Control provides operational pre-alerts, bay readiness, and logistics coordination. Diagnosis, medication, and clinical decisions remain strictly with attending medical doctors.
                  </div>
                </div>

                {/* Patient Information & Identity Banner */}
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Identity</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{selectedCase.patient_name}</h3>
                      <span className="font-mono text-[11px] text-teal-700 font-semibold">{selectedCase.patient_id}</span>
                    </div>

                    {selectedCase.is_unknown_patient ? (
                      <Button 
                        onClick={() => { setLinkingCaseId(selectedCase.id); }}
                        size="sm" 
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-7"
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" /> Link Verified Patient ID
                      </Button>
                    ) : (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Blood Group</span>
                        <Badge variant="outline" className="font-bold text-slate-800 bg-white">
                          {selectedCase.blood_group || "O+"}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Source</span>
                      <span className="font-semibold text-slate-800">{selectedCase.source}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Arrival Method</span>
                      <span className="font-semibold text-slate-800">{selectedCase.arrival_method}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Vehicle / Ambulance</span>
                      <span className="font-semibold text-slate-800">{selectedCase.ambulance_id || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Estimated Arrival</span>
                      <span className="font-bold text-teal-800">
                        {selectedCase.eta_minutes !== null && selectedCase.eta_minutes !== undefined 
                          ? `${selectedCase.eta_minutes} mins` 
                          : (selectedCase.status === "ARRIVED" ? "Arrived" : "ETA unavailable")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preparation Checklist (Section 17 of PDF) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-teal-600" /> Operational Preparation Checklist
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {selectedCase.preparation_checklist.filter((c) => c.completed).length} of {selectedCase.preparation_checklist.length} verified
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                    {selectedCase.preparation_checklist.map((item) => (
                      <label 
                        key={item.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => {
                              toggleChecklistItem(selectedCase.id, item.id, e.target.checked, actorName);
                              setIsRefreshing((prev) => !prev);
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className={`text-xs ${item.completed ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                            {item.label}
                          </span>
                        </div>
                        {item.completed && item.completed_by && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                            ✓ {item.completed_by}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Team & Bay Assignment Picker (Section 68 of PDF) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-teal-600" /> Assigned Response Team & Trauma Bay
                  </span>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{selectedCase.assigned_team || "Trauma Response Desk"}</span>
                      <span className="text-[11px] text-slate-500">{selectedCase.assigned_area || "Trauma Bay 1"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            assignEmergencyTeam({
                              emergencyId: selectedCase.id,
                              assignedTeam: val,
                              assignedArea: val.includes("Cardiology") ? "Cath Lab Resuscitation" : "Trauma Bay 1",
                              actorId,
                              actorName,
                              actorRole,
                            });
                            setIsRefreshing((prev) => !prev);
                          }
                        }}
                        defaultValue={selectedCase.assigned_team}
                        className="text-xs border border-slate-200 rounded-lg p-1.5 bg-white font-medium"
                      >
                        <option value="Trauma Resuscitation Team A">Trauma Resuscitation Team A</option>
                        <option value="Orthopaedic Trauma Rapid Unit">Orthopaedic Trauma Rapid Unit</option>
                        <option value="Cardiology Rapid Response">Cardiology Rapid Response</option>
                        <option value="General Emergency Care Desk">General Emergency Care Desk</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Traceable Timeline (Section 51 of PDF) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-teal-600" /> Traceable Emergency Event Timeline
                  </span>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
                    {selectedCase.timeline.map((event, idx) => (
                      <div key={event.id || idx} className="flex items-start gap-3 text-xs">
                        <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900 font-bold">{event.title}</strong>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{event.description}</p>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            By: {event.actor_name} ({event.actor_role})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <Button 
                  onClick={() => setSelectedCaseId(null)}
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {selectedCase.status === "INCOMING" && (
                    <Button 
                      onClick={() => { handleAcknowledge(selectedCase.id); }}
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                    >
                      Acknowledge Pre-Alert
                    </Button>
                  )}
                  {selectedCase.status === "ACKNOWLEDGED" && (
                    <Button 
                      onClick={() => { handleStartPrep(selectedCase.id); }}
                      size="sm" 
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                    >
                      Start Preparation
                    </Button>
                  )}
                  {selectedCase.status === "PREPARING" && (
                    <Button 
                      onClick={() => { handleMarkArrived(selectedCase.id); }}
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      Mark Patient Arrived
                    </Button>
                  )}
                  {selectedCase.status === "ARRIVED" && (
                    <Button 
                      onClick={() => { handleStartCare(selectedCase.id); }}
                      size="sm" 
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs"
                    >
                      Start Emergency Care
                    </Button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. CANCELLATION MODAL                                        */}
        {/* ============================================================ */}
        {cancellingCaseId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-900">Cancel Emergency Pre-Alert</h3>
              </div>
              <p className="text-xs text-slate-600">
                Are you sure you want to cancel Emergency <strong>#{cancellingCaseId}</strong>? This event will remain non-destructively preserved in the audit log.
              </p>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Cancellation Reason (Mandatory)
                </label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Patient rerouted by EMS to closer regional facility"
                  className="text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button onClick={() => setCancellingCaseId(null)} variant="outline" size="sm" className="text-xs">
                  Back
                </Button>
                <Button 
                  onClick={handleCancelSubmit} 
                  disabled={!cancelReason.trim()}
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. ADMISSION HANDOFF MODAL (STEP 4 BRIDGE)                   */}
        {/* ============================================================ */}
        {admittingCaseId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Building2 className="h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-900">Emergency Admission Handoff</h3>
              </div>
              <p className="text-xs text-slate-600">
                Transition this stabilized emergency patient into the hospital inpatient admission workflow.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Attending Physician</label>
                  <select 
                    value={admDoctor}
                    onChange={(e) => setAdmDoctor(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value="Dr. Ananya Sharma">Dr. Ananya Sharma (Cardiology)</option>
                    <option value="Dr. Rajesh Sharma">Dr. Rajesh Sharma (General Medicine)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Inpatient Department</label>
                  <Input 
                    value={admDept}
                    onChange={(e) => setAdmDept(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Clinical Admission Reason</label>
                  <Input 
                    value={admReason}
                    onChange={(e) => setAdmReason(e.target.value)}
                    placeholder="e.g. Continuous telemetry and cardiac monitoring post-ER resuscitation"
                    className="text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button onClick={() => setAdmittingCaseId(null)} variant="outline" size="sm" className="text-xs">
                  Cancel
                </Button>
                <Button onClick={handleAdmissionSubmit} size="sm" className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold">
                  Handoff to Admission Desk
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 7. TRANSFER MODAL                                            */}
        {/* ============================================================ */}
        {transferringCaseId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Truck className="h-5 w-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Transfer Patient to External Facility</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Destination Facility</label>
                  <Input 
                    value={transferDest}
                    onChange={(e) => setTransferDest(e.target.value)}
                    placeholder="e.g. AIIMS Tertiary Super-Specialty Center"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Transfer Clinical Reason</label>
                  <Input 
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="e.g. Requires emergency neurosurgery cath lab"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Transport Ambulance Ref</label>
                  <Input 
                    value={transferAmbRef}
                    onChange={(e) => setTransferAmbRef(e.target.value)}
                    placeholder="e.g. 108 Advanced Life Support Unit #OD-02"
                    className="text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button onClick={() => setTransferringCaseId(null)} variant="outline" size="sm" className="text-xs">
                  Cancel
                </Button>
                <Button 
                  onClick={handleTransferSubmit} 
                  disabled={!transferDest.trim()}
                  size="sm" 
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
                >
                  Confirm Transfer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 8. LINK UNKNOWN PATIENT MODAL                                */}
        {/* ============================================================ */}
        {linkingCaseId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-900">
                <UserCheck className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Link Unknown Emergency to Patient Profile</h3>
              </div>
              <p className="text-xs text-slate-600">
                Once patient identity is confirmed at arrival, link this case to the verified canonical patient profile without creating duplicate records.
              </p>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Patient Profile</label>
                <select 
                  value={linkPatientId}
                  onChange={(e) => setLinkPatientId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="PAT-1001">PAT-1001 — Rahul Verma (+91 98765 43210)</option>
                  <option value="PAT-1002">PAT-1002 — Priya Sharma (+91 94370 56789)</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button onClick={() => setLinkingCaseId(null)} variant="outline" size="sm" className="text-xs">
                  Cancel
                </Button>
                <Button onClick={handleLinkPatientSubmit} size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold">
                  Link Patient
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 9. CREATE EMERGENCY PRE-ALERT MODAL                          */}
        {/* ============================================================ */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="text-sm font-bold text-slate-900">Initiate Emergency Pre-Alert</h3>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEmergencySubmit} className="space-y-4 text-xs">
                
                {/* Emergency Type & Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Emergency Category</label>
                    <select 
                      value={newEmergencyType}
                      onChange={(e) => setNewEmergencyType(e.target.value as EmergencyType)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="CHEST_PAIN">Chest Pain / Cardiac</option>
                      <option value="MAJOR_INJURY">Major Trauma / Accident</option>
                      <option value="BREATHING_DIFFICULTY">Severe Respiratory Distress</option>
                      <option value="STROKE_SYMPTOMS">Stroke / Neurological</option>
                      <option value="UNCONSCIOUSNESS">Unconscious / Syncope</option>
                      <option value="SEVERE_BLEEDING">Hemorrhage / Bleeding</option>
                      <option value="OTHER">Other Urgent Condition</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Priority Level</label>
                    <select 
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as EmergencyPriority)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white font-bold text-red-700"
                    >
                      <option value="CRITICAL">🔴 CRITICAL (Red Flag)</option>
                      <option value="HIGH">🟠 HIGH (Urgent)</option>
                      <option value="NORMAL">🔵 NORMAL (Standard ER)</option>
                    </select>
                  </div>
                </div>

                {/* Chief Complaint */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Chief Complaint & Operational Summary</label>
                  <Input 
                    value={newChiefComplaint}
                    onChange={(e) => setNewChiefComplaint(e.target.value)}
                    placeholder="e.g. Acute chest discomfort with shortness of breath and diaphoresis"
                    className="text-xs"
                    required
                  />
                </div>

                {/* Ingress / Arrival Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Arrival Mode</label>
                    <select 
                      value={newArrivalMethod}
                      onChange={(e) => setNewArrivalMethod(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="AMBULANCE">🚑 Ambulance Ingress</option>
                      <option value="WALK_IN">🚶 Walk-in Emergency Bay</option>
                      <option value="HOSPITAL_TRANSFER">🏥 Hospital Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">ETA (Minutes)</label>
                    <Input 
                      type="number"
                      value={newEta}
                      onChange={(e) => setNewEta(e.target.value ? parseInt(e.target.value) : "")}
                      placeholder="e.g. 10"
                      className="text-xs"
                    />
                  </div>
                </div>

                {newArrivalMethod === "AMBULANCE" && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Ambulance Vehicle Identifier</label>
                    <Input 
                      value={newAmbulanceId}
                      onChange={(e) => setNewAmbulanceId(e.target.value)}
                      placeholder="e.g. AMB-OD-02-108"
                      className="text-xs"
                    />
                  </div>
                )}

                {/* Patient Identity Options */}
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Patient Identification</span>
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600 font-semibold">
                      <input 
                        type="checkbox"
                        checked={newIsUnknown}
                        onChange={(e) => setNewIsUnknown(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600"
                      />
                      Unknown Patient (Unidentified)
                    </label>
                  </div>

                  {!newIsUnknown ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block uppercase font-semibold">Patient Name</label>
                        <Input 
                          value={newPatientName}
                          onChange={(e) => setNewPatientName(e.target.value)}
                          className="text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block uppercase font-semibold">Patient ID</label>
                        <Input 
                          value={newPatientId}
                          onChange={(e) => setNewPatientId(e.target.value)}
                          className="text-xs bg-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      Case will be registered under temporary anonymous trauma identity. Can be mapped to canonical patient profile post-arrival.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" onClick={() => setIsCreateModalOpen(false)} variant="outline" size="sm" className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs">
                    Dispatch Pre-Alert to Trauma Bay
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
