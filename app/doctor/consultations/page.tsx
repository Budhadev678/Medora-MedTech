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
  Ban,
  Edit3,
  History,
  FileEdit,
  Save,
  Trash2,
  Check
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
import { 
  ClinicalRecord, 
  ClinicalSymptom, 
  ClinicalVitals, 
  ClinicalDiagnosis, 
  ClinicalFollowUpPlan,
  getClinicalRecordByEncounterId,
  saveClinicalRecordDraft,
  completeClinicalRecord,
  amendClinicalRecord
} from "@/lib/data/clinical-record-store";
import { getAllIdentities, findIdentityById, StoredIdentity } from "@/lib/data/identity-store";
import { AccessEngine } from "@/lib/services/access-engine";
import { useLocalization } from "@/lib/localization";

export default function DoctorConsultationsPage() {
  const { user } = useAuth();
  const { t } = useLocalization();

  // Selected organization context from doctor's affiliations
  const doctorAffiliations = user?.doctorData?.affiliations?.filter(a => a.status === "active") || [];
  const [selectedOrgId, setSelectedOrgId] = useState<string>(() => {
    return doctorAffiliations[0]?.organizationIdentifier || doctorAffiliations[0]?.organizationId || "HSP-1001";
  });

  const [encounters, setEncounters] = useState<HealthcareEncounter[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals for Encounter Lifecycle
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteEncounterModal, setShowCompleteEncounterModal] = useState<HealthcareEncounter | null>(null);
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

  // Clinical Record Editor Drawer / Modal
  const [activeEncounterForRecord, setActiveEncounterForRecord] = useState<HealthcareEncounter | null>(null);
  const [activeRecord, setActiveRecord] = useState<ClinicalRecord | null>(null);
  const [editorTab, setEditorTab] = useState<"symptoms" | "vitals" | "assessment" | "plan" | "history">("symptoms");
  
  // Editor Form Fields
  const [recordComplaint, setRecordComplaint] = useState("");
  const [symptoms, setSymptoms] = useState<ClinicalSymptom[]>([]);
  const [vitals, setVitals] = useState<ClinicalVitals>({ recorded_at: "", recorded_by: "" });
  const [observations, setObservations] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [assessment, setAssessment] = useState("");
  const [diagnoses, setDiagnoses] = useState<ClinicalDiagnosis[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [followUpPlan, setFollowUpPlan] = useState<ClinicalFollowUpPlan>({ required: false });
  const [recordSaveStatus, setRecordSaveStatus] = useState<string | null>(null);

  // Amendment Modal
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendmentReasonInput, setAmendmentReasonInput] = useState("");

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

    const handleUpdate = () => {
      refreshEncounters();
      if (activeEncounterForRecord) {
        const rec = getClinicalRecordByEncounterId(activeEncounterForRecord.id);
        setActiveRecord(rec);
      }
    };

    window.addEventListener("medora-encounters-updated", handleUpdate);
    window.addEventListener("medora-clinical-records-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-encounters-updated", handleUpdate);
      window.removeEventListener("medora-clinical-records-updated", handleUpdate);
    };
  }, [user, selectedOrgId, activeEncounterForRecord]);

  // Open Clinical Record Editor
  const handleOpenRecordEditor = (encounter: HealthcareEncounter) => {
    setActiveEncounterForRecord(encounter);
    const existing = getClinicalRecordByEncounterId(encounter.id);
    setActiveRecord(existing);

    if (existing) {
      setRecordComplaint(existing.chief_complaint || encounter.reason_for_visit);
      setSymptoms(existing.symptoms ? [...existing.symptoms] : []);
      setVitals(existing.vitals ? { ...existing.vitals } : { recorded_at: new Date().toISOString(), recorded_by: user?.identifier || "DOC-1001" });
      setObservations(existing.observations || "");
      setClinicalNotes(existing.clinical_notes || "");
      setAssessment(existing.assessment || "");
      setDiagnoses(existing.diagnoses ? [...existing.diagnoses] : []);
      setTreatmentPlan(existing.treatment_plan || "");
      setFollowUpPlan(existing.follow_up_plan ? { ...existing.follow_up_plan } : { required: false });
    } else {
      // Initialize with encounter details
      setRecordComplaint(encounter.reason_for_visit);
      setSymptoms([]);
      setVitals({
        temperature_celsius: 36.8,
        heart_rate_bpm: 74,
        systolic_bp_mmhg: 120,
        diastolic_bp_mmhg: 80,
        respiratory_rate_bpm: 16,
        spo2_percent: 99,
        recorded_at: new Date().toISOString(),
        recorded_by: user?.identifier || "DOC-1001",
        recorded_by_name: user?.fullName || "Dr. Ananya Sharma",
      });
      setObservations("");
      setClinicalNotes("");
      setAssessment("");
      setDiagnoses([]);
      setTreatmentPlan("");
      setFollowUpPlan({ required: false });
    }

    setEditorTab("symptoms");
    setRecordSaveStatus(null);
  };

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

  const activeModalPatient = allPatients.find(p => p.identifier === selectedPatientId || p.id === selectedPatientId);

  // Pre-access check for encounter creation
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

    setShowStartModal(false);
    setReasonInput("");
    refreshEncounters();
  };

  // Handle Complete Encounter
  const handleCompleteEncounter = () => {
    if (!user || !showCompleteEncounterModal) return;
    setIsSubmitting(true);
    completeEncounter(
      showCompleteEncounterModal.id,
      user.identifier || user.id,
      user.fullName,
      user.role
    );
    setIsSubmitting(false);
    setShowCompleteEncounterModal(null);
    refreshEncounters();
  };

  // Handle Save Clinical Record Draft
  const handleSaveDraft = () => {
    if (!user || !activeEncounterForRecord) return;
    setIsSubmitting(true);
    setRecordSaveStatus(null);

    const res = saveClinicalRecordDraft({
      encounterId: activeEncounterForRecord.id,
      chiefComplaint: recordComplaint,
      symptoms,
      vitals,
      observations,
      clinicalNotes,
      assessment,
      diagnoses,
      treatmentPlan,
      followUpPlan,
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });

    setIsSubmitting(false);
    if (res.success && res.record) {
      setActiveRecord(res.record);
      setRecordSaveStatus("Draft saved successfully.");
      setTimeout(() => setRecordSaveStatus(null), 3000);
    } else {
      setRecordSaveStatus(res.error || "Failed to save draft.");
    }
  };

  // Handle Complete Clinical Record
  const handleCompleteRecord = () => {
    if (!user || !activeEncounterForRecord) return;

    // First save draft state
    saveClinicalRecordDraft({
      encounterId: activeEncounterForRecord.id,
      chiefComplaint: recordComplaint,
      symptoms,
      vitals,
      observations,
      clinicalNotes,
      assessment,
      diagnoses,
      treatmentPlan,
      followUpPlan,
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });

    const currentRecord = getClinicalRecordByEncounterId(activeEncounterForRecord.id);
    if (!currentRecord) {
      setRecordSaveStatus("Please save the record before completing.");
      return;
    }

    setIsSubmitting(true);
    const res = completeClinicalRecord({
      recordId: currentRecord.id,
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });

    setIsSubmitting(false);
    if (res.success && res.record) {
      setActiveRecord(res.record);
      setRecordSaveStatus("Clinical Record completed and signed off.");
      setTimeout(() => setRecordSaveStatus(null), 4000);
    } else {
      setRecordSaveStatus(res.error || "Failed to complete clinical record.");
    }
  };

  // Handle Amend Clinical Record
  const handleAmendRecord = () => {
    if (!user || !activeRecord) return;
    if (!amendmentReasonInput.trim()) {
      alert("Please provide an amendment reason.");
      return;
    }

    setIsSubmitting(true);
    const res = amendClinicalRecord({
      recordId: activeRecord.id,
      amendmentReason: amendmentReasonInput.trim(),
      chiefComplaint: recordComplaint,
      symptoms,
      vitals,
      observations,
      clinicalNotes,
      assessment,
      diagnoses,
      treatmentPlan,
      followUpPlan,
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });

    setIsSubmitting(false);
    setShowAmendModal(false);
    setAmendmentReasonInput("");

    if (res.success && res.record) {
      setActiveRecord(res.record);
      setRecordSaveStatus(`Clinical Record amended to Version ${res.record.version}.`);
      setTimeout(() => setRecordSaveStatus(null), 4000);
    } else {
      setRecordSaveStatus(res.error || "Failed to amend record.");
    }
  };

  // Add Dynamic Symptom
  const handleAddSymptom = () => {
    const newSym: ClinicalSymptom = {
      id: `SYM-${symptoms.length + 1}`,
      name: "",
      severity: "MODERATE",
      duration: "1 day",
    };
    setSymptoms([...symptoms, newSym]);
  };

  // Add Dynamic Diagnosis
  const handleAddDiagnosis = () => {
    const newDx: ClinicalDiagnosis = {
      id: `DX-${diagnoses.length + 1}`,
      name: "",
      icd10_code: "",
      status: "CONFIRMED",
      category: diagnoses.length === 0 ? "PRIMARY" : "SECONDARY",
      recorded_by: user?.identifier || "DOC-1001",
      recorded_by_name: user?.fullName || "Dr. Ananya Sharma",
      recorded_at: new Date().toISOString(),
    };
    setDiagnoses([...diagnoses, newDx]);
  };

  const isRecordLocked = activeRecord?.status === "COMPLETED" || activeRecord?.status === "AMENDED";

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Clinical Encounter Workbench & Records"
            description="Document structured symptoms, vitals, assessments, diagnoses, and follow-up plans attached to authoritative hospital encounters."
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

        {/* 1. Multi-Hospital Organization Context Banner */}
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

          {/* Quick Context Switcher */}
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

        {/* 2. Encounters List with Clinical Record Attachment Indicators */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === "ALL" ? "bg-slate-900 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Encounters ({encounters.length})
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === "ACTIVE" ? "bg-teal-700 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Active ({encounters.filter(e => e.status === "ACTIVE").length})
              </button>
              <button
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === "COMPLETED" ? "bg-slate-900 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Completed ({encounters.filter(e => e.status === "COMPLETED").length})
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

          {filteredEncounters.length > 0 ? (
            <div className="space-y-3">
              {filteredEncounters.map((encounter) => {
                const clinicalRec = getClinicalRecordByEncounterId(encounter.id);
                const isActive = encounter.status === "ACTIVE";

                return (
                  <div
                    key={encounter.id}
                    className={`rounded-2xl border transition-all p-4 ${
                      isActive 
                        ? "border-teal-300 bg-teal-50/30 shadow-xs" 
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                            {encounter.encounter_reference || encounter.id}
                          </span>
                          <StatusBadge status={encounter.status.toLowerCase() as any} />
                          <span className="text-[11px] font-semibold text-slate-500">
                            {encounter.department_name}
                          </span>

                          {/* Clinical Record Status Badge */}
                          {clinicalRec ? (
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] font-bold ${
                                clinicalRec.status === "COMPLETED" 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : clinicalRec.status === "AMENDED"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-blue-50 text-blue-800 border-blue-300"
                              }`}
                            >
                              <FileText className="h-3 w-3 mr-1 inline" />
                              {clinicalRec.record_reference} ({clinicalRec.status} v{clinicalRec.version})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500 border-dashed">
                              No Clinical Record Attached
                            </Badge>
                          )}
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
                          <strong>Chief Reason:</strong> {encounter.reason_for_visit}
                        </p>

                        {clinicalRec?.diagnoses && clinicalRec.diagnoses.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[11px] font-bold text-slate-500">Diagnoses:</span>
                            {clinicalRec.diagnoses.map((dx, idx) => (
                              <span key={idx} className="text-[11px] font-bold text-teal-800 bg-teal-100/60 px-1.5 py-0.2 rounded">
                                {dx.name} ({dx.icd10_code || "Clinician Recorded"})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                        {/* Clinical Record Document Action */}
                        <Button
                          size="sm"
                          onClick={() => handleOpenRecordEditor(encounter)}
                          className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5 h-8 shadow-2xs"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          <span>{clinicalRec ? "Edit Clinical Record" : "Document Record"}</span>
                        </Button>

                        {isActive && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowCompleteEncounterModal(encounter)}
                              className="text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              End Visit
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Stethoscope className="h-8 w-8 text-teal-600" />}
              title="No Encounters Found"
              description={`No encounters matching filters in ${selectedOrgId}.`}
              actionLabel="Start New Encounter"
              onAction={() => setShowStartModal(true)}
            />
          )}
        </div>

        {/* ============================================================ */}
        {/* CLINICAL RECORD WORKBENCH DRAWER / MODAL */}
        {/* ============================================================ */}
        {activeEncounterForRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl flex flex-col overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">
                        Clinical Record — {activeEncounterForRecord.patient_name}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {activeEncounterForRecord.encounter_reference || activeEncounterForRecord.id}
                      </Badge>
                      {activeRecord && (
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                          {activeRecord.status} (v{activeRecord.version})
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {activeEncounterForRecord.organization_name} • {activeEncounterForRecord.department_name} • Attending: {user?.fullName}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveEncounterForRecord(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Banner / Feedback */}
              {recordSaveStatus && (
                <div className="my-2 p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900 flex items-center justify-between animate-in fade-in-50">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    {recordSaveStatus}
                  </span>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-200 pt-2 pb-1 overflow-x-auto scrollbar-none flex-shrink-0 text-xs font-bold">
                <button
                  onClick={() => setEditorTab("symptoms")}
                  className={`px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                    editorTab === "symptoms" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  1. Chief Complaint & Symptoms ({symptoms.length})
                </button>
                <button
                  onClick={() => setEditorTab("vitals")}
                  className={`px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                    editorTab === "vitals" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  2. Vitals & Observations
                </button>
                <button
                  onClick={() => setEditorTab("assessment")}
                  className={`px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                    editorTab === "assessment" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  3. Clinical Assessment & Notes
                </button>
                <button
                  onClick={() => setEditorTab("plan")}
                  className={`px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                    editorTab === "plan" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  4. Diagnoses & Treatment Plan ({diagnoses.length})
                </button>
                {activeRecord?.version_history && activeRecord.version_history.length > 0 && (
                  <button
                    onClick={() => setEditorTab("history")}
                    className={`px-3 py-2 border-b-2 transition-all whitespace-nowrap flex items-center gap-1 ${
                      editorTab === "history" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    Version History ({activeRecord.version_history.length})
                  </button>
                )}
              </div>

              {/* Tab Content Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
                
                {/* ---------------------------------------------------- */}
                {/* TAB 1: Chief Complaint & Symptoms */}
                {/* ---------------------------------------------------- */}
                {editorTab === "symptoms" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-900">
                        Chief Complaint / Primary Reason for Visit <span className="text-red-500">*</span>
                      </Label>
                      <textarea
                        value={recordComplaint}
                        onChange={(e) => setRecordComplaint(e.target.value)}
                        disabled={isRecordLocked}
                        rows={2}
                        placeholder="e.g. Exertional chest tightness and morning headaches for 2 weeks"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 disabled:bg-slate-100 resize-none"
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold text-slate-900">
                          Structured Symptoms ({symptoms.length})
                        </Label>
                        {!isRecordLocked && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAddSymptom}
                            className="text-xs font-bold text-teal-700 border-teal-300 hover:bg-teal-50 h-7"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Symptom
                          </Button>
                        )}
                      </div>

                      {symptoms.length > 0 ? (
                        <div className="space-y-2">
                          {symptoms.map((sym, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center gap-2">
                              <Input
                                placeholder="Symptom Name (e.g. Substernal heaviness)"
                                value={sym.name}
                                disabled={isRecordLocked}
                                onChange={(e) => {
                                  const updated = [...symptoms];
                                  updated[idx].name = e.target.value;
                                  setSymptoms(updated);
                                }}
                                className="text-xs flex-1 bg-white"
                              />
                              <Input
                                placeholder="Duration (e.g. 3 days)"
                                value={sym.duration || ""}
                                disabled={isRecordLocked}
                                onChange={(e) => {
                                  const updated = [...symptoms];
                                  updated[idx].duration = e.target.value;
                                  setSymptoms(updated);
                                }}
                                className="text-xs w-28 bg-white"
                              />
                              <select
                                value={sym.severity}
                                disabled={isRecordLocked}
                                onChange={(e) => {
                                  const updated = [...symptoms];
                                  updated[idx].severity = e.target.value as any;
                                  setSymptoms(updated);
                                }}
                                className="text-xs rounded-lg border border-slate-300 bg-white p-2 font-medium"
                              >
                                <option value="MILD">Mild</option>
                                <option value="MODERATE">Moderate</option>
                                <option value="SEVERE">Severe</option>
                              </select>
                              {!isRecordLocked && (
                                <button
                                  type="button"
                                  onClick={() => setSymptoms(symptoms.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-red-600 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded-xl border border-slate-100">
                          No symptoms recorded yet. Click "+ Add Symptom" to document specific symptoms.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 2: Vitals & Observations */}
                {/* ---------------------------------------------------- */}
                {editorTab === "vitals" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <Label className="font-semibold text-slate-700">BP Systolic (mmHg)</Label>
                        <Input
                          type="number"
                          value={vitals.systolic_bp_mmhg || ""}
                          disabled={isRecordLocked}
                          onChange={(e) => setVitals({ ...vitals, systolic_bp_mmhg: Number(e.target.value) || undefined })}
                          placeholder="e.g. 120"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700">BP Diastolic (mmHg)</Label>
                        <Input
                          type="number"
                          value={vitals.diastolic_bp_mmhg || ""}
                          disabled={isRecordLocked}
                          onChange={(e) => setVitals({ ...vitals, diastolic_bp_mmhg: Number(e.target.value) || undefined })}
                          placeholder="e.g. 80"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700">Heart Rate (bpm)</Label>
                        <Input
                          type="number"
                          value={vitals.heart_rate_bpm || ""}
                          disabled={isRecordLocked}
                          onChange={(e) => setVitals({ ...vitals, heart_rate_bpm: Number(e.target.value) || undefined })}
                          placeholder="e.g. 72"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700">Temperature (°C)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={vitals.temperature_celsius || ""}
                          disabled={isRecordLocked}
                          onChange={(e) => setVitals({ ...vitals, temperature_celsius: Number(e.target.value) || undefined })}
                          placeholder="e.g. 36.8"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700">SpO2 (%)</Label>
                        <Input
                          type="number"
                          value={vitals.spo2_percent || ""}
                          disabled={isRecordLocked}
                          onChange={(e) => setVitals({ ...vitals, spo2_percent: Number(e.target.value) || undefined })}
                          placeholder="e.g. 98"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700">Resp Rate (bpm)</Label>
                        <Input
                          type="number"
                          value={vitals.respiratory_rate_bpm || ""}
                          disabled={isRecordLocked}
                          onChange={(e) => setVitals({ ...vitals, respiratory_rate_bpm: Number(e.target.value) || undefined })}
                          placeholder="e.g. 16"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700">Weight (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={vitals.weight_kg || ""}
                          disabled={isRecordLocked}
                          onChange={(e) => setVitals({ ...vitals, weight_kg: Number(e.target.value) || undefined })}
                          placeholder="e.g. 74"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700">Height (cm)</Label>
                        <Input
                          type="number"
                          value={vitals.height_cm || ""}
                          disabled={isRecordLocked}
                          onChange={(e) => setVitals({ ...vitals, height_cm: Number(e.target.value) || undefined })}
                          placeholder="e.g. 175"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <Label className="font-bold text-slate-900">
                        Physical Examination & Clinical Observations
                      </Label>
                      <textarea
                        value={observations}
                        disabled={isRecordLocked}
                        onChange={(e) => setObservations(e.target.value)}
                        rows={3}
                        placeholder="General appearance, systemic examination findings (CVS, RS, CNS, Abdomen)..."
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 3: Clinical Assessment & Notes */}
                {/* ---------------------------------------------------- */}
                {editorTab === "assessment" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-900">
                        Clinical Assessment / Impression <span className="text-red-500">*</span>
                      </Label>
                      <textarea
                        value={assessment}
                        disabled={isRecordLocked}
                        onChange={(e) => setAssessment(e.target.value)}
                        rows={3}
                        placeholder="Clinician's diagnostic assessment and synthesis of findings..."
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 disabled:bg-slate-100"
                      />
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <Label className="font-bold text-slate-900">
                        Attributable Clinical Notes (History & Context)
                      </Label>
                      <textarea
                        value={clinicalNotes}
                        disabled={isRecordLocked}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        rows={3}
                        placeholder="Family history, risk factors, progression timeline, medication adherence..."
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 4: Diagnoses & Treatment Plan */}
                {/* ---------------------------------------------------- */}
                {editorTab === "plan" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold text-slate-900">
                          Formal Diagnoses ({diagnoses.length})
                        </Label>
                        {!isRecordLocked && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAddDiagnosis}
                            className="text-xs font-bold text-teal-700 border-teal-300 hover:bg-teal-50 h-7"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Diagnosis
                          </Button>
                        )}
                      </div>

                      {diagnoses.length > 0 ? (
                        <div className="space-y-2">
                          {diagnoses.map((dx, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center gap-2">
                              <Input
                                placeholder="Diagnosis Name (e.g. Essential Hypertension)"
                                value={dx.name}
                                disabled={isRecordLocked}
                                onChange={(e) => {
                                  const updated = [...diagnoses];
                                  updated[idx].name = e.target.value;
                                  setDiagnoses(updated);
                                }}
                                className="text-xs flex-1 bg-white"
                              />
                              <Input
                                placeholder="ICD-10 (e.g. I10)"
                                value={dx.icd10_code || ""}
                                disabled={isRecordLocked}
                                onChange={(e) => {
                                  const updated = [...diagnoses];
                                  updated[idx].icd10_code = e.target.value;
                                  setDiagnoses(updated);
                                }}
                                className="text-xs w-28 bg-white"
                              />
                              <select
                                value={dx.status}
                                disabled={isRecordLocked}
                                onChange={(e) => {
                                  const updated = [...diagnoses];
                                  updated[idx].status = e.target.value as any;
                                  setDiagnoses(updated);
                                }}
                                className="text-xs rounded-lg border border-slate-300 bg-white p-2 font-medium"
                              >
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="SUSPECTED">Suspected</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="HISTORICAL">Historical</option>
                              </select>
                              {!isRecordLocked && (
                                <button
                                  type="button"
                                  onClick={() => setDiagnoses(diagnoses.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-red-600 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-[11px] p-2 bg-slate-50 rounded-xl border border-slate-100">
                          No diagnoses added. Click "+ Add Diagnosis" to record clinician diagnosis.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <Label className="font-bold text-slate-900">
                        Clinical Treatment Plan & Patient Advice
                      </Label>
                      <textarea
                        value={treatmentPlan}
                        disabled={isRecordLocked}
                        onChange={(e) => setTreatmentPlan(e.target.value)}
                        rows={3}
                        placeholder="Lifestyle advice, sodium reduction, hydration, non-pharmacological care..."
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 disabled:bg-slate-100"
                      />
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Follow-up Required</span>
                        <input
                          type="checkbox"
                          checked={followUpPlan.required}
                          disabled={isRecordLocked}
                          onChange={(e) => setFollowUpPlan({ ...followUpPlan, required: e.target.checked })}
                          className="h-4 w-4 text-teal-600 rounded"
                        />
                      </div>
                      {followUpPlan.required && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                          <div>
                            <Label className="font-semibold text-slate-600">Follow-up Date / Timeframe</Label>
                            <Input
                              placeholder="e.g. 7 days or 2026-08-27"
                              value={followUpPlan.follow_up_date || followUpPlan.follow_up_timeframe || ""}
                              disabled={isRecordLocked}
                              onChange={(e) => setFollowUpPlan({ ...followUpPlan, follow_up_date: e.target.value, follow_up_timeframe: e.target.value })}
                              className="text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label className="font-semibold text-slate-600">Instructions for Follow-up</Label>
                            <Input
                              placeholder="e.g. Bring 7-day BP log"
                              value={followUpPlan.instructions || ""}
                              disabled={isRecordLocked}
                              onChange={(e) => setFollowUpPlan({ ...followUpPlan, instructions: e.target.value })}
                              className="text-xs mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TAB 5: Version History & Amendments */}
                {/* ---------------------------------------------------- */}
                {editorTab === "history" && activeRecord?.version_history && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-900 block">
                      Documented Clinical Amendments & Version Ledger
                    </span>
                    {activeRecord.version_history.map((snap, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            Version {snap.version} ({snap.status})
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(snap.saved_at).toLocaleString("en-IN")}
                          </span>
                        </div>
                        {snap.amendment_reason && (
                          <p className="text-xs font-semibold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            <strong>Amendment Reason:</strong> {snap.amendment_reason}
                          </p>
                        )}
                        <p className="text-xs text-slate-700">
                          <strong>Assessment:</strong> {snap.assessment || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] text-slate-500">
                    Provenance: Attributed to {user?.fullName} ({user?.identifier})
                  </Badge>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {!isRecordLocked ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveDraft}
                        disabled={isSubmitting}
                        className="text-xs font-bold gap-1.5"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Draft
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCompleteRecord}
                        disabled={isSubmitting}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Sign & Complete Record
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setShowAmendModal(true)}
                      className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs gap-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Amend Clinical Record
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* AMEND CLINICAL RECORD MODAL */}
        {/* ============================================================ */}
        {showAmendModal && activeRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Amend Clinical Record</h3>
                  <span className="text-xs text-slate-500">
                    Version {activeRecord.version} $\rightarrow$ Version {activeRecord.version + 1}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Documenting an amendment will preserve the previous clinical record version in the audit history and publish your corrections under Version {activeRecord.version + 1}.
              </p>

              <div className="space-y-1.5">
                <Label className="font-bold text-slate-900">
                  Documented Amendment Reason <span className="text-red-500">*</span>
                </Label>
                <textarea
                  value={amendmentReasonInput}
                  onChange={(e) => setAmendmentReasonInput(e.target.value)}
                  rows={3}
                  placeholder="e.g. Corrected systolic blood pressure reading and added diagnosis notes."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAmendModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAmendRecord}
                  disabled={isSubmitting}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs"
                >
                  {isSubmitting ? "Amending..." : "Save Amendment"}
                </Button>
              </div>
            </div>
          </div>
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

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-3.5">
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

                <div>
                  <Label htmlFor="encounterReason" className="text-xs font-semibold text-slate-700">
                    Reason for Visit <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="encounterReason"
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    rows={2}
                    placeholder="Chief complaint / visit reason"
                    className="w-full mt-1 rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                  />
                </div>
              </div>

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
                  {isSubmitting ? "Starting..." : "Start Encounter"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Encounter Confirmation */}
        {showCompleteEncounterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Complete Healthcare Encounter</h3>
                  <span className="text-xs text-slate-500">
                    {showCompleteEncounterModal.patient_name} • {showCompleteEncounterModal.encounter_reference || showCompleteEncounterModal.id}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Completing this encounter will mark the clinical session as finished and lock the timestamps.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompleteEncounterModal(null)}
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
                  {isSubmitting ? "Completing..." : "Confirm & End Visit"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Encounter Modal */}
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
                    {showCancelModal.patient_name}
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
                  placeholder="e.g. Patient did not show up"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(null)}
                  className="text-xs"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!user || !showCancelModal || !cancelReasonInput.trim()) return;
                    cancelEncounter(showCancelModal.id, cancelReasonInput.trim(), user.identifier || user.id, user.fullName, user.role);
                    setShowCancelModal(null);
                    refreshEncounters();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  Confirm Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
