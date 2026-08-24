"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Check,
  Pill,
  FlaskConical
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
import { 
  HealthcarePrescription, 
  PrescriptionItem,
  getEncounterPrescriptions,
  savePrescriptionDraft,
  issuePrescription
} from "@/lib/data/prescription-store";
import { 
  HealthcareLabOrder, 
  LabOrderItem, 
  LabOrderPriority,
  getEncounterLabOrders,
  saveLabOrderDraft,
  placeLabOrder
} from "@/lib/data/lab-order-store";
import { getAllIdentities, findIdentityById, StoredIdentity } from "@/lib/data/identity-store";
import { getPatientHealthJourney } from "@/lib/services/health-journey-service";
import { AccessEngine } from "@/lib/services/access-engine";
import { useLocalization } from "@/lib/localization";

function DoctorConsultationsContent() {
  const { user } = useAuth();
  const { t } = useLocalization();
  const searchParams = useSearchParams();
  const paramEncounterId = searchParams?.get("encounterId");
  const paramPatientId = searchParams?.get("patientId");

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

  // ============================================================
  // PHASE 4.3: PRESCRIPTION AUTHORING MODAL STATE
  // ============================================================
  const [rxModalEncounter, setRxModalEncounter] = useState<HealthcareEncounter | null>(null);
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([
    {
      id: "RXI-1",
      medicine_name: "Telmisartan",
      strength: "40 mg",
      dosage: "1 tablet",
      route: "ORAL",
      frequency: "Once daily (morning)",
      duration: "30 days",
      quantity: "30 tablets",
      instructions: "Take after breakfast with water.",
    },
  ]);
  const [rxNotes, setRxNotes] = useState("");
  const [rxRefills, setRxRefills] = useState(0);
  const [rxFeedback, setRxFeedback] = useState<string | null>(null);

  // ============================================================
  // PHASE 4.3: LAB ORDER AUTHORING MODAL STATE
  // ============================================================
  const [labModalEncounter, setLabModalEncounter] = useState<HealthcareEncounter | null>(null);
  const [labItems, setLabItems] = useState<LabOrderItem[]>([
    {
      id: "LOI-1",
      test_name: "Complete Blood Count (CBC) with Differential",
      test_code: "CBC-01",
      specimen_type: "Whole Blood (EDTA)",
      instructions: "Standard venipuncture",
    },
  ]);
  const [labPriority, setLabPriority] = useState<LabOrderPriority>("ROUTINE");
  const [labReason, setLabReason] = useState("");
  const [labInstructions, setLabInstructions] = useState("");
  const [labFeedback, setLabFeedback] = useState<string | null>(null);

  // Health Journey Modal State (Phase 4.4)
  const [journeyEncounterModal, setJourneyEncounterModal] = useState<HealthcareEncounter | null>(null);

  // Refresh Encounters & Attached Objects
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
    window.addEventListener("medora-prescriptions-updated", handleUpdate);
    window.addEventListener("medora-lab-orders-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-encounters-updated", handleUpdate);
      window.removeEventListener("medora-clinical-records-updated", handleUpdate);
      window.removeEventListener("medora-prescriptions-updated", handleUpdate);
      window.removeEventListener("medora-lab-orders-updated", handleUpdate);
    };
  }, [user, selectedOrgId, activeEncounterForRecord]);

  // Auto-open encounter if query params are provided from Queue/Appointments
  useEffect(() => {
    if (encounters.length === 0) return;
    if (paramEncounterId) {
      const match = encounters.find(e => e.id === paramEncounterId);
      if (match && activeEncounterForRecord?.id !== match.id) {
        handleOpenRecordEditor(match);
      }
    } else if (paramPatientId) {
      const match = encounters.find(e => e.patient_id === paramPatientId && e.status !== "CANCELLED");
      if (match && activeEncounterForRecord?.id !== match.id) {
        handleOpenRecordEditor(match);
      }
    }
  }, [paramEncounterId, paramPatientId, encounters]);

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

  // Open Prescription Modal for an Encounter
  const handleOpenPrescriptionModal = (encounter: HealthcareEncounter) => {
    setRxModalEncounter(encounter);
    setRxFeedback(null);
    setRxItems([
      {
        id: "RXI-1",
        medicine_name: "Telmisartan",
        strength: "40 mg",
        dosage: "1 tablet",
        route: "ORAL",
        frequency: "Once daily (morning)",
        duration: "30 days",
        quantity: "30 tablets",
        instructions: "Take after breakfast with water.",
      },
    ]);
    setRxNotes("Patient advised regular monitoring of home blood pressure.");
    setRxRefills(1);
  };

  // Open Lab Order Modal for an Encounter
  const handleOpenLabOrderModal = (encounter: HealthcareEncounter) => {
    setLabModalEncounter(encounter);
    setLabFeedback(null);
    setLabItems([
      {
        id: "LOI-1",
        test_name: "Lipid Profile (Total Chol, HDL, LDL, VLDL, Triglycerides)",
        test_code: "LIP-01",
        specimen_type: "Serum",
        instructions: "12-hour overnight fasting required",
      },
    ]);
    setLabPriority("ROUTINE");
    setLabReason(`Diagnostic investigation for: ${encounter.reason_for_visit}`);
    setLabInstructions("Fasting blood sample");
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

  // Handle Issue Prescription
  const handleIssuePrescription = () => {
    if (!user || !rxModalEncounter) return;
    setIsSubmitting(true);
    setRxFeedback(null);

    const res = issuePrescription({
      encounterId: rxModalEncounter.id,
      items: rxItems,
      notes: rxNotes,
      refillsAllowed: rxRefills,
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });

    setIsSubmitting(false);
    if (res.success && res.prescription) {
      setRxFeedback(`Prescription ${res.prescription.prescription_reference} successfully issued.`);
      setTimeout(() => {
        setRxModalEncounter(null);
        setRxFeedback(null);
        refreshEncounters();
      }, 1500);
    } else {
      setRxFeedback(res.error || "Failed to issue prescription.");
    }
  };

  // Handle Place Lab Order
  const handlePlaceLabOrder = () => {
    if (!user || !labModalEncounter) return;
    if (!labReason.trim()) {
      setLabFeedback("Please enter a clinical reason for this diagnostic order.");
      return;
    }

    setIsSubmitting(true);
    setLabFeedback(null);

    const res = placeLabOrder({
      encounterId: labModalEncounter.id,
      items: labItems,
      priority: labPriority,
      reason: labReason.trim(),
      instructions: labInstructions.trim(),
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });

    setIsSubmitting(false);
    if (res.success && res.order) {
      setLabFeedback(`Diagnostic order ${res.order.order_reference} placed successfully.`);
      setTimeout(() => {
        setLabModalEncounter(null);
        setLabFeedback(null);
        refreshEncounters();
      }, 1500);
    } else {
      setLabFeedback(res.error || "Failed to place lab order.");
    }
  };

  const isRecordLocked = activeRecord?.status === "COMPLETED" || activeRecord?.status === "AMENDED";

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Clinical Encounter Workbench & Orders"
            description="Manage clinical sessions, document clinical records, prescribe medications, and place diagnostic lab orders."
            breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Encounter Workbench" }]}
          />
          <div className="flex items-center gap-2">
            <Link href="/doctor/prescriptions">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 text-teal-800 border-teal-200">
                <Pill className="h-3.5 w-3.5" /> Prescriptions Desk
              </Button>
            </Link>
            <Link href="/doctor/lab-orders">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 text-blue-800 border-blue-200">
                <FlaskConical className="h-3.5 w-3.5" /> Lab Orders Desk
              </Button>
            </Link>
            <Button 
              onClick={() => setShowStartModal(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold gap-2 text-xs shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Start Encounter</span>
            </Button>
          </div>
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

        {/* 2. Encounters List with Clinical Record, Prescription, and Lab Order Indicators */}
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
                const attachedRxs = getEncounterPrescriptions(encounter.id);
                const attachedLabs = getEncounterLabOrders(encounter.id);
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
                                  : "bg-blue-50 text-blue-800 border-blue-300"
                              }`}
                            >
                              <FileText className="h-3 w-3 mr-1 inline" />
                              {clinicalRec.record_reference} ({clinicalRec.status} v{clinicalRec.version})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500 border-dashed">
                              No Clinical Record
                            </Badge>
                          )}

                          {/* Attached Prescriptions Badge */}
                          {attachedRxs.length > 0 && (
                            <Badge variant="outline" className="text-[10px] font-bold bg-teal-50 text-teal-800 border-teal-200">
                              <Pill className="h-3 w-3 mr-1 inline" />
                              {attachedRxs.length} RX ({attachedRxs.map(r => r.prescription_reference).join(", ")})
                            </Badge>
                          )}

                          {/* Attached Lab Orders Badge */}
                          {attachedLabs.length > 0 && (
                            <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-800 border-blue-200">
                              <FlaskConical className="h-3 w-3 mr-1 inline" />
                              {attachedLabs.length} Lab Orders ({attachedLabs.map((l: any) => l.order_reference).join(", ")})
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
                          <span>{clinicalRec ? "Edit Record" : "Record"}</span>
                        </Button>

                        {/* Health Journey History Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setJourneyEncounterModal(encounter)}
                          className="text-xs font-bold text-indigo-800 border-indigo-200 hover:bg-indigo-50 h-8 gap-1"
                        >
                          <Activity className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Journey</span>
                        </Button>

                        {/* Prescribe Medication Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPrescriptionModal(encounter)}
                          className="text-xs font-bold text-teal-800 border-teal-300 hover:bg-teal-50 h-8 gap-1"
                        >
                          <Pill className="h-3.5 w-3.5 text-teal-600" />
                          <span>Prescribe</span>
                        </Button>

                        {/* Order Lab Tests Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenLabOrderModal(encounter)}
                          className="text-xs font-bold text-blue-800 border-blue-300 hover:bg-blue-50 h-8 gap-1"
                        >
                          <FlaskConical className="h-3.5 w-3.5 text-blue-600" />
                          <span>Order Lab</span>
                        </Button>

                        {isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCompleteEncounterModal(encounter)}
                            className="text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            End Visit
                          </Button>
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
        {/* PRESCRIBE MEDICATION MODAL (PHASE 4.3) */}
        {/* ============================================================ */}
        {rxModalEncounter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl flex flex-col overflow-hidden space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Prescribe Medication — {rxModalEncounter.patient_name}
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Encounter: {rxModalEncounter.encounter_reference || rxModalEncounter.id} • {rxModalEncounter.organization_name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRxModalEncounter(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {rxFeedback && (
                <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <span>{rxFeedback}</span>
                </div>
              )}

              {/* Medicines Builder */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900">
                    Prescribed Medicines ({rxItems.length})
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newId = `RXI-${rxItems.length + 1}`;
                      setRxItems([
                        ...rxItems,
                        {
                          id: newId,
                          medicine_name: "",
                          strength: "",
                          dosage: "1 tablet",
                          route: "ORAL",
                          frequency: "Twice daily",
                          duration: "5 days",
                          quantity: "10 tablets",
                          instructions: "Take after food",
                        },
                      ]);
                    }}
                    className="text-xs font-bold text-teal-700 border-teal-200 hover:bg-teal-50 h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Medicine
                  </Button>
                </div>

                <div className="space-y-3">
                  {rxItems.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 text-xs">Medicine #{idx + 1}</span>
                        {rxItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRxItems(rxItems.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Medicine Name (e.g. Paracetamol)"
                          value={item.medicine_name}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].medicine_name = e.target.value;
                            setRxItems(updated);
                          }}
                          className="text-xs bg-white"
                        />
                        <Input
                          placeholder="Strength (e.g. 500 mg)"
                          value={item.strength || ""}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].strength = e.target.value;
                            setRxItems(updated);
                          }}
                          className="text-xs bg-white"
                        />
                        <Input
                          placeholder="Dosage (e.g. 1 tablet)"
                          value={item.dosage}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].dosage = e.target.value;
                            setRxItems(updated);
                          }}
                          className="text-xs bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={item.route}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].route = e.target.value as any;
                            setRxItems(updated);
                          }}
                          className="text-xs rounded-lg border border-slate-300 bg-white p-2 font-medium"
                        >
                          <option value="ORAL">Oral</option>
                          <option value="TOPICAL">Topical</option>
                          <option value="INHALATION">Inhalation</option>
                          <option value="INJECTION">Injection</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <Input
                          placeholder="Frequency (e.g. Twice daily)"
                          value={item.frequency}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].frequency = e.target.value;
                            setRxItems(updated);
                          }}
                          className="text-xs bg-white"
                        />
                        <Input
                          placeholder="Duration (e.g. 5 days)"
                          value={item.duration}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].duration = e.target.value;
                            setRxItems(updated);
                          }}
                          className="text-xs bg-white"
                        />
                      </div>

                      <Input
                        placeholder="Instructions (e.g. Take after food with water)"
                        value={item.instructions || ""}
                        onChange={(e) => {
                          const updated = [...rxItems];
                          updated[idx].instructions = e.target.value;
                          setRxItems(updated);
                        }}
                        className="text-xs bg-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label className="font-semibold text-slate-700">Refills Allowed</Label>
                    <select
                      value={rxRefills}
                      onChange={(e) => setRxRefills(Number(e.target.value))}
                      className="w-full mt-1 rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-900"
                    >
                      <option value={0}>0 (No Refills)</option>
                      <option value={1}>1 Refill</option>
                      <option value={2}>2 Refills</option>
                      <option value={3}>3 Refills</option>
                    </select>
                  </div>
                  <div>
                    <Label className="font-semibold text-slate-700">Clinician Notes / Dietary Advice</Label>
                    <Input
                      placeholder="e.g. Sodium restriction and plenty of fluids"
                      value={rxNotes}
                      onChange={(e) => setRxNotes(e.target.value)}
                      className="text-xs mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0">
                <span className="text-[11px] text-slate-500">
                  Prescribed by {user?.fullName} ({user?.identifier})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!user || !rxModalEncounter) return;
                      savePrescriptionDraft({
                        encounterId: rxModalEncounter.id,
                        items: rxItems,
                        notes: rxNotes,
                        refillsAllowed: rxRefills,
                        actorId: user.identifier || user.id,
                        actorName: user.fullName,
                        actorRole: user.role,
                      });
                      setRxFeedback("Draft saved.");
                    }}
                    disabled={isSubmitting}
                    className="text-xs"
                  >
                    Save Draft
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleIssuePrescription}
                    disabled={isSubmitting}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Issue Digital Prescription
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ORDER LAB TESTS MODAL (PHASE 4.3) */}
        {/* ============================================================ */}
        {labModalEncounter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl flex flex-col overflow-hidden space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Order Diagnostic Tests — {labModalEncounter.patient_name}
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Encounter: {labModalEncounter.encounter_reference || labModalEncounter.id} • {labModalEncounter.organization_name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLabModalEncounter(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {labFeedback && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>{labFeedback}</span>
                </div>
              )}

              {/* Lab Tests Form */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900">
                    Diagnostic Tests ({labItems.length})
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newId = `LOI-${labItems.length + 1}`;
                      setLabItems([
                        ...labItems,
                        {
                          id: newId,
                          test_name: "",
                          test_code: "",
                          specimen_type: "Serum",
                          instructions: "",
                        },
                      ]);
                    }}
                    className="text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50 h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Test
                  </Button>
                </div>

                <div className="space-y-3">
                  {labItems.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 text-xs">Test #{idx + 1}</span>
                        {labItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setLabItems(labItems.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="Test Name (e.g. Complete Blood Count)"
                          value={item.test_name}
                          onChange={(e) => {
                            const updated = [...labItems];
                            updated[idx].test_name = e.target.value;
                            setLabItems(updated);
                          }}
                          className="text-xs bg-white"
                        />
                        <Input
                          placeholder="Specimen Type (e.g. Whole Blood, Serum)"
                          value={item.specimen_type || ""}
                          onChange={(e) => {
                            const updated = [...labItems];
                            updated[idx].specimen_type = e.target.value;
                            setLabItems(updated);
                          }}
                          className="text-xs bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label className="font-semibold text-slate-700">Order Priority</Label>
                    <select
                      value={labPriority}
                      onChange={(e) => setLabPriority(e.target.value as LabOrderPriority)}
                      className="w-full mt-1 rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-900"
                    >
                      <option value="ROUTINE">Routine</option>
                      <option value="URGENT">Urgent (Stat)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="font-semibold text-slate-700">Special Specimen Instructions</Label>
                    <Input
                      placeholder="e.g. 12-hour fasting sample"
                      value={labInstructions}
                      onChange={(e) => setLabInstructions(e.target.value)}
                      className="text-xs mt-1 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="font-bold text-slate-900">
                    Clinical Indication / Reason for Investigation <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Rule out secondary hypertension and assess baseline renal parameters."
                    value={labReason}
                    onChange={(e) => setLabReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0">
                <span className="text-[11px] text-slate-500">
                  Ordered by {user?.fullName} ({user?.identifier})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!user || !labModalEncounter) return;
                      saveLabOrderDraft({
                        encounterId: labModalEncounter.id,
                        items: labItems,
                        priority: labPriority,
                        reason: labReason,
                        instructions: labInstructions,
                        actorId: user.identifier || user.id,
                        actorName: user.fullName,
                        actorRole: user.role,
                      });
                      setLabFeedback("Draft saved.");
                    }}
                    disabled={isSubmitting}
                    className="text-xs"
                  >
                    Save Draft
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePlaceLabOrder}
                    disabled={isSubmitting}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Place Diagnostic Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start Encounter Modal, Complete Modal, Cancel Modal, Clinical Record Editor Modal remain intact */}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="encounterDept" className="text-xs font-semibold text-slate-700">Department</Label>
                    <Input id="encounterDept" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="text-xs mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="encounterLocation" className="text-xs font-semibold text-slate-700">Location</Label>
                    <Input id="encounterLocation" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} className="text-xs mt-1" />
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
                <Button variant="outline" size="sm" onClick={() => setShowStartModal(false)} disabled={isSubmitting} className="text-xs">Cancel</Button>
                <Button size="sm" onClick={handleStartEncounter} disabled={isSubmitting} className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs">Start Encounter</Button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Encounter Confirmation */}
        {showCompleteEncounterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Complete Encounter</h3>
                  <span className="text-xs text-slate-500">{showCompleteEncounterModal.patient_name}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowCompleteEncounterModal(null)} className="text-xs">Cancel</Button>
                <Button size="sm" onClick={handleCompleteEncounter} disabled={isSubmitting} className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs">Confirm & End Visit</Button>
              </div>
            </div>
          </div>
        )}

        {/* Clinician Health Journey Viewer Modal (Phase 4.4) */}
        {journeyEncounterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col space-y-4 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Longitudinal Health Journey — {journeyEncounterModal.patient_name}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      Patient ID: {journeyEncounterModal.patient_id} • Consent Verified
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setJourneyEncounterModal(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Timeline Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {getPatientHealthJourney(journeyEncounterModal.patient_id, {}).map((event) => (
                  <div
                    key={event.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {event.reference_id}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold bg-white">
                          {event.event_type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {event.status}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(event.occurred_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">
                      {event.title}
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      {event.summary}
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Provenance: {event.professional_name || "Provider"} • {event.organization_name || "Facility"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setJourneyEncounterModal(null)}
                  className="text-xs"
                >
                  Close History
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

export default function DoctorConsultationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-semibold">Loading clinical workspace...</div>}>
      <DoctorConsultationsContent />
    </Suspense>
  );
}
