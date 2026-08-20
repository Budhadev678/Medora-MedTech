"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  User, 
  Calendar, 
  X, 
  ArrowRight,
  ShieldCheck,
  FileText,
  Activity,
  HeartPulse,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Ban
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  HealthcareEncounter, 
  EncounterType, 
  EncounterStatus,
  getDoctorEncounters, 
  createEncounter, 
  completeEncounter, 
  cancelEncounter 
} from "@/lib/data/encounter-store";
import { getAllIdentities, findIdentityById, StoredIdentity } from "@/lib/data/identity-store";
import { AccessEngine } from "@/lib/services/access-engine";

export default function DoctorConsultationsPage() {
  const { user } = useAuth();

  // Selected organization context from doctor's affiliations
  const doctorAffiliations = user?.doctorData?.affiliations?.filter(a => a.status === "active") || [];
  const [selectedOrgId, setSelectedOrgId] = useState<string>(() => {
    return doctorAffiliations[0]?.organizationIdentifier || doctorAffiliations[0]?.organizationId || "HSP-1001";
  });

  const [encounters, setEncounters] = useState<HealthcareEncounter[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal States
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState<HealthcareEncounter | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<HealthcareEncounter | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");

  // Start Encounter Form State
  const [allPatients, setAllPatients] = useState<StoredIdentity[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Cardiology OPD");
  const [selectedEncounterType, setSelectedEncounterType] = useState<EncounterType>("CONSULTATION");
  const [reasonInput, setReasonInput] = useState("");
  const [locationInput, setLocationInput] = useState("Room 204, OPD Block A");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Encounter Detail Sheet
  const [selectedEncounterDetail, setSelectedEncounterDetail] = useState<HealthcareEncounter | null>(null);

  // Refresh Encounters
  const refreshEncounters = () => {
    if (!user) return;
    const docId = user.identifier || user.id;
    const data = getDoctorEncounters(docId, selectedOrgId || undefined);
    setEncounters(data);
  };

  useEffect(() => {
    refreshEncounters();
    const patients = getAllIdentities().filter(u => u.role === "patient");
    setAllPatients(patients);
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].identifier || patients[0].id);
    }

    window.addEventListener("medora-encounters-updated", refreshEncounters);
    return () => window.removeEventListener("medora-encounters-updated", refreshEncounters);
  }, [user, selectedOrgId]);

  // Filtered Encounters
  const filteredEncounters = encounters.filter(e => {
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.patient_name.toLowerCase().includes(q);
      const matchId = e.patient_id.toLowerCase().includes(q);
      const matchRef = e.encounter_reference?.toLowerCase().includes(q);
      const matchReason = e.reason_for_visit.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchRef && !matchReason) return false;
    }
    return true;
  });

  // Selected Patient Details in Modal
  const activeModalPatient = allPatients.find(p => p.identifier === selectedPatientId || p.id === selectedPatientId);

  // Access pre-check in modal
  const modalAccessCheck = user && activeModalPatient ? AccessEngine.evaluateAccess({
    actor: user,
    targetPatientId: activeModalPatient.identifier || activeModalPatient.id,
    organizationId: selectedOrgId,
    purpose: "treatment",
    requiredScope: "medical_history",
  }) : null;

  // Handle Start Encounter Submission
  const handleStartEncounter = () => {
    if (!user || !activeModalPatient) return;
    setFormError(null);

    if (!reasonInput.trim()) {
      setFormError("Please enter a valid clinical reason for this encounter.");
      return;
    }

    setIsSubmitting(true);
    const res = createEncounter({
      patientId: activeModalPatient.identifier || activeModalPatient.id,
      providerId: user.identifier || user.id,
      organizationId: selectedOrgId,
      departmentName: selectedDepartment,
      encounterType: selectedEncounterType,
      reasonForVisit: reasonInput.trim(),
      location: locationInput.trim(),
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || "Failed to start encounter.");
      return;
    }

    // Success
    setShowStartModal(false);
    setReasonInput("");
    refreshEncounters();
  };

  // Handle Complete Encounter
  const handleCompleteEncounter = () => {
    if (!user || !showCompleteModal) return;
    setIsSubmitting(true);
    const res = completeEncounter(
      showCompleteModal.id,
      user.identifier || user.id,
      user.fullName,
      user.role
    );
    setIsSubmitting(false);
    setShowCompleteModal(null);
    refreshEncounters();
  };

  // Handle Cancel Encounter
  const handleCancelEncounter = () => {
    if (!user || !showCancelModal) return;
    if (!cancelReasonInput.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    setIsSubmitting(true);
    const res = cancelEncounter(
      showCancelModal.id,
      cancelReasonInput.trim(),
      user.identifier || user.id,
      user.fullName,
      user.role
    );
    setIsSubmitting(false);
    setShowCancelModal(null);
    setCancelReasonInput("");
    refreshEncounters();
  };

  const activeEncountersCount = encounters.filter(e => e.status === "ACTIVE").length;
  const completedEncountersCount = encounters.filter(e => e.status === "COMPLETED").length;

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Clinical Encounter Workbench"
            description="Initiate, manage, and complete authoritative healthcare encounters across your affiliated hospital facilities."
            breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Encounter Workbench" }]}
          />
          <Button 
            onClick={() => setShowStartModal(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold gap-2 self-start sm:self-auto shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Start Encounter</span>
          </Button>
        </div>

        {/* 1. Multi-Hospital Organization Scoping Context Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 flex-shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Active Hospital Practice Context
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {doctorAffiliations.find(a => (a.organizationIdentifier === selectedOrgId || a.organizationId === selectedOrgId))?.organizationName || "City Hospital"}
              </span>
              <span className="text-[11px] font-mono text-teal-700 ml-2">
                ({selectedOrgId})
              </span>
            </div>
          </div>

          {/* Quick Context Switcher if affiliated with multiple hospitals */}
          {doctorAffiliations.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Switch Facility:</span>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                aria-label="Switch Facility"
                className="text-xs font-bold rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {doctorAffiliations.map(aff => (
                  <option key={aff.organizationIdentifier || aff.organizationId} value={aff.organizationIdentifier || aff.organizationId}>
                    {aff.organizationName} ({aff.roleTitle})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 2. Metrics & Status Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Active Encounters</span>
            <span className="text-2xl font-extrabold text-teal-700 mt-1 block">
              {activeEncountersCount}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Completed Today</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {completedEncountersCount}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Access Engine</span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Consent Protected</span>
            </div>
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "ALL" 
                  ? "bg-slate-900 text-white font-bold" 
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Encounters ({encounters.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === "ACTIVE" 
                  ? "bg-teal-700 text-white font-bold" 
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Active ({activeEncountersCount})
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "COMPLETED" 
                  ? "bg-slate-900 text-white font-bold" 
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Completed ({completedEncountersCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search patient, ID, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>

        {/* 4. Encounters List */}
        {filteredEncounters.length > 0 ? (
          <div className="space-y-3">
            {filteredEncounters.map((encounter) => {
              const isActive = encounter.status === "ACTIVE";
              const isCompleted = encounter.status === "COMPLETED";

              return (
                <div
                  key={encounter.id}
                  className={`rounded-2xl border transition-all p-4 ${
                    isActive 
                      ? "border-teal-300 bg-teal-50/40 shadow-xs" 
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                          {encounter.encounter_reference || encounter.id}
                        </span>
                        <StatusBadge status={encounter.status.toLowerCase() as any} />
                        <span className="text-[11px] font-semibold text-slate-500">
                          {encounter.department_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">
                          {encounter.patient_name}
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-mono text-slate-600">
                          {encounter.patient_id}
                        </Badge>
                        {encounter.patient_blood_group && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            {encounter.patient_blood_group}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 font-medium">
                        <strong>Reason:</strong> {encounter.reason_for_visit}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {encounter.organization_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {new Date(encounter.started_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {new Date(encounter.started_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {encounter.ended_at && ` - ${new Date(encounter.ended_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {isActive && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setShowCompleteModal(encounter)}
                            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5 h-8"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Complete Visit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowCancelModal(encounter);
                              setCancelReasonInput("");
                            }}
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50 h-8"
                          >
                            Cancel
                          </Button>
                        </>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEncounterDetail(encounter)}
                        className="text-xs text-slate-700 h-8"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Stethoscope className="h-8 w-8 text-teal-600" />}
            title={statusFilter === "ACTIVE" ? "No Active Encounters" : "No Encounters Found"}
            description={
              searchQuery
                ? `No encounters matching "${searchQuery}" in ${selectedOrgId}.`
                : `You currently have no ${statusFilter.toLowerCase()} healthcare encounters recorded for ${selectedOrgId}.`
            }
            actionLabel="Start New Encounter"
            onAction={() => setShowStartModal(true)}
          />
        )}

        {/* ============================================================ */}
        {/* START ENCOUNTER MODAL */}
        {/* ============================================================ */}
        {showStartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Start Healthcare Encounter</h3>
                    <span className="text-[11px] text-slate-500">Initiate clinical consultation session</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Error Box */}
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                {/* 1. Patient Selector */}
                <div>
                  <Label htmlFor="patientSelect" className="text-xs font-semibold text-slate-700">
                    Select Patient
                  </Label>
                  <select
                    id="patientSelect"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    {allPatients.map(p => (
                      <option key={p.id} value={p.identifier || p.id}>
                        {p.fullName} ({p.identifier || p.id}) • {p.patientData?.bloodGroup || "Blood Group N/A"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Patient Summary Snapshot & Phase 3 Access Check */}
                {activeModalPatient && (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{activeModalPatient.fullName}</span>
                      <span className="text-[10px] font-mono text-slate-500">{activeModalPatient.identifier}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600">
                      <span>DOB: {activeModalPatient.patientData?.dob || "N/A"}</span>
                      <span>Gender: {activeModalPatient.patientData?.gender || "N/A"}</span>
                      <span>Blood Group: <strong>{activeModalPatient.patientData?.bloodGroup || "N/A"}</strong></span>
                    </div>
                    {modalAccessCheck && (
                      <div className="pt-1.5 border-t border-slate-200 flex items-center gap-1.5 text-[10px]">
                        {modalAccessCheck.allowed ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            {modalAccessCheck.reason}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            {modalAccessCheck.reason}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Organization Context (Readonly to prevent accidental mismatch) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="encounterOrg" className="text-xs font-semibold text-slate-700">
                      Facility
                    </Label>
                    <Input
                      id="encounterOrg"
                      value={doctorAffiliations.find(a => (a.organizationIdentifier === selectedOrgId || a.organizationId === selectedOrgId))?.organizationName || selectedOrgId}
                      readOnly
                      className="text-xs bg-slate-100 text-slate-600 cursor-not-allowed mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="encounterType" className="text-xs font-semibold text-slate-700">
                      Encounter Type
                    </Label>
                    <select
                      id="encounterType"
                      value={selectedEncounterType}
                      onChange={(e) => setSelectedEncounterType(e.target.value as EncounterType)}
                      className="w-full mt-1 rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value="CONSULTATION">Outpatient Consultation</option>
                      <option value="FOLLOW_UP">Follow-Up Visit</option>
                      <option value="DIAGNOSTIC_VISIT">Diagnostic Review</option>
                    </select>
                  </div>
                </div>

                {/* 3. Department & Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="encounterDept" className="text-xs font-semibold text-slate-700">
                      Department
                    </Label>
                    <Input
                      id="encounterDept"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      placeholder="e.g. Cardiology OPD"
                      className="text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="encounterLocation" className="text-xs font-semibold text-slate-700">
                      Location / Room
                    </Label>
                    <Input
                      id="encounterLocation"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      placeholder="e.g. Room 204, Block A"
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                {/* 4. Reason for Visit */}
                <div>
                  <Label htmlFor="encounterReason" className="text-xs font-semibold text-slate-700">
                    Reason for Visit <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="encounterReason"
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    rows={2}
                    placeholder="Chief complaint / visit reason (e.g. Exertional chest tightness and dizziness)"
                    className="w-full mt-1 rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer with Double-Click Protection */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStartModal(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartEncounter}
                  disabled={isSubmitting}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Start Encounter
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* COMPLETE ENCOUNTER CONFIRMATION MODAL */}
        {/* ============================================================ */}
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Complete Healthcare Encounter</h3>
                  <span className="text-xs text-slate-500">
                    {showCompleteModal.patient_name} • {showCompleteModal.encounter_reference || showCompleteModal.id}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Completing this encounter will mark the clinical session as finished, lock timestamps, and update the patient's longitudinal health record.
              </p>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                <div><strong>Reason:</strong> {showCompleteModal.reason_for_visit}</div>
                <div><strong>Started:</strong> {new Date(showCompleteModal.started_at).toLocaleTimeString("en-IN")}</div>
                <div><strong>Facility:</strong> {showCompleteModal.organization_name}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompleteModal(null)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCompleteEncounter}
                  disabled={isSubmitting}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs"
                >
                  {isSubmitting ? "Completing..." : "Confirm & Complete"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CANCEL ENCOUNTER MODAL */}
        {/* ============================================================ */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center flex-shrink-0">
                  <Ban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Cancel Healthcare Encounter</h3>
                  <span className="text-xs text-slate-500">
                    {showCancelModal.patient_name} • {showCancelModal.encounter_reference || showCancelModal.id}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cancelReason" className="text-xs font-semibold text-slate-700">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cancelReason"
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  placeholder="e.g. Patient did not show up / cancelled by patient"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(null)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleCancelEncounter}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  {isSubmitting ? "Cancelling..." : "Cancel Encounter"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ENCOUNTER DETAIL SHEET */}
        {/* ============================================================ */}
        {selectedEncounterDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                      {selectedEncounterDetail.encounter_reference || selectedEncounterDetail.id}
                    </span>
                    <StatusBadge status={selectedEncounterDetail.status.toLowerCase() as any} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    {selectedEncounterDetail.patient_name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEncounterDetail(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient ID</span>
                  <span className="font-mono font-bold text-slate-800">{selectedEncounterDetail.patient_id}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Blood Group</span>
                  <span className="font-bold text-red-600">{selectedEncounterDetail.patient_blood_group || "N/A"}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Facility</span>
                  <span className="font-bold text-slate-800">{selectedEncounterDetail.organization_name}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Department</span>
                  <span className="font-bold text-slate-800">{selectedEncounterDetail.department_name}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Encounter Type</span>
                  <span className="font-bold text-slate-800">{selectedEncounterDetail.encounter_type}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Location</span>
                  <span className="font-bold text-slate-800">{selectedEncounterDetail.location || "OPD"}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Reason for Visit</span>
                <p className="text-slate-800 font-medium">{selectedEncounterDetail.reason_for_visit}</p>
              </div>

              <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/70 text-xs text-teal-900 space-y-1">
                <span className="font-bold block flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                  Clinical Records Attachment
                </span>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  Structured SOAP consultation notes, formal ICD-10 diagnoses, e-prescriptions, and lab investigation orders will attach to this encounter in upcoming phases (4.2 & 4.3).
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => setSelectedEncounterDetail(null)}
                  className="bg-slate-900 text-white font-bold text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
