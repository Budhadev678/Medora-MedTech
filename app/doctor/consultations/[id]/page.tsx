"use client";

// ============================================================
// MEDORA — DEDICATED DOCTOR CONSULTATION WORKSPACE
// MODIFICATION PHASE C.1 & C.2 (CLINICAL ENCOUNTER + PRESCRIPTION & MEDICAL ORDERS)
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  ChevronLeft,
  User,
  HeartPulse,
  Pill,
  FlaskConical,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Plus,
  Trash2,
  History,
  AlertCircle,
  Check,
  Share2,
  Search,
  Eye,
  Radio,
  Send,
  ArrowRight,
  Info,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import {
  HealthcareEncounter,
  ClinicalRecord,
  ClinicalSymptom,
  ClinicalVitals,
  ClinicalDiagnosis,
  ClinicalFollowUpPlan,
  HealthcarePrescription,
  PrescriptionItem,
  PrescriptionRoute,
  MedicineTiming,
  MedicineCatalogItem,
  HealthcareMedicalOrder,
  MedicalOrderType,
  MedicalOrderPriority,
  LabOrderItem,
  ImagingOrderDetails,
  ReferralOrderDetails,
  TimelineEvent,
} from "@/types/database.types";
import { ConsultationService, ConsultationContext } from "@/lib/services/consultation-service";
import { searchMedicines, getAllMedicines } from "@/lib/data/medicine-catalog-store";
import { PrescriptionOrderService } from "@/lib/services/prescription-order-service";
import { LabOrderService } from "@/lib/services/lab-order-service";
import { ReferralService } from "@/lib/services/referral-service";
import { FollowUpService } from "@/lib/services/followup-service";
import { ClinicalContinuityService } from "@/lib/services/clinical-continuity-service";
import { DoctorConsultationWorkspace } from "@/components/doctor/DoctorConsultationWorkspace";

export default function DedicatedConsultationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const encounterId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const { user } = useAuth();
  const [workspaceMode, setWorkspaceMode] = useState<"digital_desk" | "classic_view">("digital_desk");

  const [contextData, setContextData] = useState<ConsultationContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timeline & Continuity Modal State
  const [patientTimeline, setPatientTimeline] = useState<TimelineEvent[]>([]);
  const [showFullTimelineModal, setShowFullTimelineModal] = useState(false);
  const [timelineSearch, setTimelineSearch] = useState("");
  const [timelineCategory, setTimelineCategory] = useState<string>("all");

  // Clinical Record Form Fields
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState<ClinicalSymptom[]>([]);
  const [newSymptomName, setNewSymptomName] = useState("");
  const [newSymptomDuration, setNewSymptomDuration] = useState("");
  const [newSymptomSeverity, setNewSymptomSeverity] = useState<"MILD" | "MODERATE" | "SEVERE">("MODERATE");

  // Vitals with explicit units
  const [vitals, setVitals] = useState<ClinicalVitals>({
    temperature_celsius: undefined,
    heart_rate_bpm: undefined,
    systolic_bp_mmhg: undefined,
    diastolic_bp_mmhg: undefined,
    respiratory_rate_bpm: undefined,
    spo2_percent: undefined,
    weight_kg: undefined,
    height_cm: undefined,
    bmi: undefined,
    recorded_at: "",
    recorded_by: "",
  });

  const [observations, setObservations] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [assessment, setAssessment] = useState("");

  // Diagnoses
  const [diagnoses, setDiagnoses] = useState<ClinicalDiagnosis[]>([]);
  const [newDxName, setNewDxName] = useState("");
  const [newDxCode, setNewDxCode] = useState("");
  const [newDxCategory, setNewDxCategory] = useState<"PRIMARY" | "SECONDARY" | "PROVISIONAL">("PRIMARY");
  const [newDxStatus, setNewDxStatus] = useState<"SUSPECTED" | "CONFIRMED">("CONFIRMED");

  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [followUpPlan, setFollowUpPlan] = useState<ClinicalFollowUpPlan>({ required: false });

  // Autosave & Status State
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");

  // Periodic Safe Autosave (Requirement 42)
  useEffect(() => {
    const isEncCompleted = contextData?.encounter?.status === "COMPLETED" || contextData?.encounter?.status === "FINALIZED";
    if (saveStatus !== "unsaved" || isEncCompleted) return;
    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 15000);
    return () => clearTimeout(timer);
  }, [saveStatus, contextData, chiefComplaint, symptoms, vitals, observations, clinicalNotes, assessment, diagnoses, treatmentPlan]);

  // Elapsed Consultation Duration Timer (Informational Only — Never Pressures Doctor)
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // ============================================================
  // PHASE C.2: PRESCRIPTION COMPOSER STATE
  // ============================================================
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [medSearchQuery, setMedSearchQuery] = useState("");
  const [medSearchResults, setMedSearchResults] = useState<MedicineCatalogItem[]>([]);
  const [selectedCatalogMed, setSelectedCatalogMed] = useState<MedicineCatalogItem | null>(null);

  // New Item Builder Form
  const [itemMedName, setItemMedName] = useState("");
  const [itemGenericName, setItemGenericName] = useState("");
  const [itemBrandName, setItemBrandName] = useState("");
  const [itemStrength, setItemStrength] = useState("");
  const [itemDosage, setItemDosage] = useState("1 tablet");
  const [itemRoute, setItemRoute] = useState<PrescriptionRoute>("ORAL");
  const [itemFrequency, setItemFrequency] = useState("Twice daily (morning, night)");
  const [itemTiming, setItemTiming] = useState<MedicineTiming>("AFTER_FOOD");
  const [itemDuration, setItemDuration] = useState("5 days");
  const [itemQuantity, setItemQuantity] = useState("10 tablets");
  const [itemInstructions, setItemInstructions] = useState("");
  const [itemIsPrn, setItemIsPrn] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Prescription Modals
  const [showRxPreviewModal, setShowRxPreviewModal] = useState(false);
  const [showRxIssueConfirmModal, setShowRxIssueConfirmModal] = useState(false);
  const [isIssuingRx, setIsIssuingRx] = useState(false);
  const [issuedPrescription, setIssuedPrescription] = useState<HealthcarePrescription | null>(null);

  // ============================================================
  // PHASE C.2: MEDICAL ORDERS STATE
  // ============================================================
  const [activeOrderTab, setActiveOrderTab] = useState<"lab" | "imaging" | "referral">("lab");
  const [encounterOrders, setEncounterOrders] = useState<HealthcareMedicalOrder[]>([]);

  // Lab Order State
  const [labTests, setLabTests] = useState<{ id: string; name: string; specimen: string }[]>([
    { id: "CBC-01", name: "Complete Blood Count (CBC) with Differential", specimen: "Whole Blood (EDTA)" },
    { id: "LIP-01", name: "Lipid Profile (Cholesterol, HDL, LDL, VLDL, Triglycerides)", specimen: "Serum" },
    { id: "REN-02", name: "Renal Function Test (Creatinine, BUN, Urea)", specimen: "Serum" },
    { id: "DIA-01", name: "Glycated Hemoglobin (HbA1c)", specimen: "Whole Blood (EDTA)" },
    { id: "LFT-01", name: "Liver Function Test (SGOT, SGPT, Bilirubin)", specimen: "Serum" },
    { id: "THY-01", name: "Thyroid Profile (T3, T4, TSH)", specimen: "Serum" },
  ]);
  const [selectedLabTestIds, setSelectedLabTestIds] = useState<string[]>([]);
  const [labPriority, setLabPriority] = useState<MedicalOrderPriority>("ROUTINE");
  const [labIndication, setLabIndication] = useState("");
  const [isSubmittingLab, setIsSubmittingLab] = useState(false);

  // Imaging Order State
  const [imagingModality, setImagingModality] = useState<"XRAY" | "MRI" | "CT" | "ULTRASOUND" | "ECG" | "ECHO">("XRAY");
  const [imagingBodyPart, setImagingBodyPart] = useState("Chest PA View");
  const [imagingContrast, setImagingContrast] = useState(false);
  const [imagingIndication, setImagingIndication] = useState("");
  const [isSubmittingImaging, setIsSubmittingImaging] = useState(false);

  // Referral Order State
  const [referralSpecialty, setReferralSpecialty] = useState("Cardiology");
  const [referralUrgency, setReferralUrgency] = useState<"ROUTINE" | "URGENT">("ROUTINE");
  const [referralReason, setReferralReason] = useState("");
  const [referralSummary, setReferralSummary] = useState("");
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

  // Load Context & Orders
  const loadContext = () => {
    if (!encounterId) return;
    setIsLoading(true);
    setErrorMessage(null);

    const ctx = ConsultationService.getConsultationContext(encounterId, user);
    if (!ctx) {
      setErrorMessage("Consultation encounter not found or access denied.");
      setIsLoading(false);
      return;
    }

    setContextData(ctx);
    const rec = ctx.clinical_record;

    if (rec) {
      setChiefComplaint(rec.chief_complaint || ctx.encounter.reason_for_visit || "");
      setSymptoms(rec.symptoms || []);
      if (rec.vitals) setVitals(rec.vitals);
      setObservations(rec.observations || "");
      setClinicalNotes(rec.clinical_notes || "");
      setAssessment(rec.assessment || "");
      setDiagnoses(rec.diagnoses || []);
      setTreatmentPlan(rec.treatment_plan || "");
      if (rec.follow_up_plan) setFollowUpPlan(rec.follow_up_plan);
    } else {
      setChiefComplaint(ctx.encounter.reason_for_visit || "");
    }

    // Load Prescriptions attached to encounter
    const rxList = PrescriptionOrderService.getEncounterPrescriptions(encounterId, user);
    const latestRx = rxList[0];
    if (latestRx) {
      setIssuedPrescription(latestRx.status === "ISSUED" ? latestRx : null);
      setPrescriptionItems(latestRx.items || []);
      setPrescriptionNotes(latestRx.notes || "");
    }

    // Load Medical Orders attached to encounter
    const orders = PrescriptionOrderService.getEncounterMedicalOrders(encounterId, user);
    setEncounterOrders(orders);

    // Load Patient Clinical Continuity Timeline
    const timeline = ClinicalContinuityService.getPatientTimeline(ctx.encounter.patient_id, user as any);
    setPatientTimeline(timeline);

    setIsLoading(false);
  };

  useEffect(() => {
    loadContext();
  }, [encounterId, user]);

  // Elapsed Timer Calculation
  useEffect(() => {
    if (!contextData?.encounter?.started_at) return;
    const updateElapsed = () => {
      const startMs = new Date(contextData.encounter.started_at).getTime();
      const endMs = contextData.encounter.completed_at
        ? new Date(contextData.encounter.completed_at).getTime()
        : Date.now();
      const mins = Math.max(0, Math.floor((endMs - startMs) / 60000));
      setElapsedMinutes(mins);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 30000);
    return () => clearInterval(interval);
  }, [contextData?.encounter?.started_at, contextData?.encounter?.completed_at]);

  // Medicine Search Autocomplete Handler
  useEffect(() => {
    if (!medSearchQuery.trim()) {
      setMedSearchResults([]);
      return;
    }
    const results = searchMedicines(medSearchQuery);
    setMedSearchResults(results.slice(0, 6));
  }, [medSearchQuery]);

  // Vitals BMI Auto-Calculation
  const handleVitalsChange = (field: keyof ClinicalVitals, val: any) => {
    setSaveStatus("unsaved");
    const num = val === "" ? undefined : parseFloat(val);
    setVitals((prev) => {
      const next = { ...prev, [field]: num };
      if (field === "weight_kg" || field === "height_cm") {
        const w = field === "weight_kg" ? num : prev.weight_kg;
        const h = field === "height_cm" ? num : prev.height_cm;
        if (w && h && h > 0) {
          const hm = h / 100;
          next.bmi = parseFloat((w / (hm * hm)).toFixed(1));
        }
      }
      return next;
    });
  };

  // Symptoms Management
  const handleAddSymptom = () => {
    if (!newSymptomName.trim()) return;
    setSaveStatus("unsaved");
    setSymptoms((prev) => [
      ...prev,
      {
        id: `sym-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: newSymptomName.trim(),
        duration: newSymptomDuration.trim() || undefined,
        severity: newSymptomSeverity,
      },
    ]);
    setNewSymptomName("");
    setNewSymptomDuration("");
  };

  const handleRemoveSymptom = (index: number) => {
    setSaveStatus("unsaved");
    setSymptoms((prev) => prev.filter((_, i) => i !== index));
  };

  // Diagnoses Management
  const handleAddDiagnosis = () => {
    if (!newDxName.trim()) return;
    setSaveStatus("unsaved");
    setDiagnoses((prev) => [
      ...prev,
      {
        id: `dx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: newDxName.trim(),
        icd10_code: newDxCode.trim() || undefined,
        category: newDxCategory,
        status: newDxStatus,
        recorded_by: user?.identifier || user?.id || "DOC-1001",
        recorded_by_name: user?.fullName || "Attending Doctor",
        recorded_at: new Date().toISOString(),
      },
    ]);
    setNewDxName("");
    setNewDxCode("");
  };

  const handleRemoveDiagnosis = (index: number) => {
    setSaveStatus("unsaved");
    setDiagnoses((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // MEDICINE CATALOG SELECTION & ITEM ADDITION
  // ============================================================
  const handleSelectCatalogMed = (med: MedicineCatalogItem) => {
    setSelectedCatalogMed(med);
    setItemMedName(med.brand_name ? `${med.generic_name} (${med.brand_name})` : med.generic_name);
    setItemGenericName(med.generic_name);
    setItemBrandName(med.brand_name || "");
    setItemStrength(med.default_strength || "500 mg");
    setItemRoute(med.default_route || ("ORAL" as any));
    setMedSearchQuery("");
    setMedSearchResults([]);

    // Check duplicate warning
    const duplicates = prescriptionItems.filter(
      (item) => item.generic_name?.toLowerCase() === med.generic_name.toLowerCase()
    );
    if (duplicates.length > 0) {
      setDuplicateWarning(`Warning: "${med.generic_name}" is already included in this prescription.`);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleAddPrescriptionItem = () => {
    if (!itemMedName.trim()) return;

    const newItem: PrescriptionItem = {
      id: `PRI-${prescriptionItems.length + 1}`,
      medicine_id: selectedCatalogMed?.id,
      medicine_name: itemMedName.trim(),
      generic_name: itemGenericName.trim() || undefined,
      brand_name: itemBrandName.trim() || undefined,
      strength: itemStrength.trim() || undefined,
      dosage: itemDosage.trim(),
      route: itemRoute,
      frequency: itemFrequency.trim(),
      timing: itemTiming,
      duration: itemDuration.trim(),
      quantity: itemQuantity.trim() || undefined,
      instructions: itemInstructions.trim() || undefined,
      is_prn: itemIsPrn,
      status: "ACTIVE",
    };

    setPrescriptionItems((prev) => [...prev, newItem]);
    setSaveStatus("unsaved");

    // Reset item form
    setItemMedName("");
    setItemGenericName("");
    setItemBrandName("");
    setItemStrength("");
    setItemInstructions("");
    setSelectedCatalogMed(null);
    setDuplicateWarning(null);
  };

  const handleRemovePrescriptionItem = (index: number) => {
    setPrescriptionItems((prev) => prev.filter((_, i) => i !== index));
    setSaveStatus("unsaved");
  };

  // Save Clinical & Prescription Draft
  const handleSaveDraft = async () => {
    if (!contextData) return;
    setSaveStatus("saving");

    try {
      // 1. Save Clinical Record Draft
      const res = await ConsultationService.saveDraft(
        encounterId,
        {
          chief_complaint: chiefComplaint,
          symptoms,
          vitals,
          observations,
          clinical_notes: clinicalNotes,
          assessment,
          diagnoses,
          treatment_plan: treatmentPlan,
          follow_up_plan: followUpPlan,
        },
        user
      );

      // 2. Save Prescription Draft if items present
      if (prescriptionItems.length > 0 && !issuedPrescription) {
        await PrescriptionOrderService.saveDraft(
          encounterId,
          {
            items: prescriptionItems,
            notes: prescriptionNotes,
          },
          user
        );
      }

      if (res.success) {
        setSaveStatus("saved");
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  // Authoritative Digital Prescription Finalization
  const handleIssuePrescriptionConfirm = async () => {
    if (!contextData || prescriptionItems.length === 0) return;
    setIsIssuingRx(true);

    try {
      const res = await PrescriptionOrderService.finalizePrescription(
        encounterId,
        {
          prescription_id: issuedPrescription?.id,
          items: prescriptionItems,
          notes: prescriptionNotes,
        },
        user
      );

      if (res.success && res.prescription) {
        setIssuedPrescription(res.prescription);
        setShowRxIssueConfirmModal(false);
        setShowRxPreviewModal(false);
        setSaveStatus("saved");
      } else {
        alert(res.error || "Failed to finalize prescription.");
      }
    } finally {
      setIsIssuingRx(false);
    }
  };

  // Submit Diagnostic Lab Order (Phase 7.3)
  const handleSubmitLabOrder = async () => {
    if (selectedLabTestIds.length === 0) return;
    setIsSubmittingLab(true);

    const selectedTests: LabOrderItem[] = labTests
      .filter((t) => selectedLabTestIds.includes(t.id))
      .map((t) => ({
        id: `LOI-${t.id}`,
        test_id: t.id,
        test_name: t.name,
        test_code: t.id,
        specimen_type: t.specimen,
        instructions: "Standard specimen protocol",
      }));

    try {
      const res = await LabOrderService.finalizeLabOrder(
        encounterId,
        {
          items: selectedTests,
          priority: labPriority as any,
          reason: labIndication.trim() || chiefComplaint || "Diagnostic evaluation",
        },
        user
      );

      if (res.success && res.order) {
        setEncounterOrders((prev) => [res.order as any, ...prev]);
        setSelectedLabTestIds([]);
        setLabIndication("");
      } else {
        alert(res.error || "Failed to finalize lab order.");
      }
    } finally {
      setIsSubmittingLab(false);
    }
  };

  // Submit Radiology / Imaging Order
  const handleSubmitImagingOrder = async () => {
    if (!imagingBodyPart.trim()) return;
    setIsSubmittingImaging(true);

    try {
      const res = await PrescriptionOrderService.createMedicalOrder(
        {
          encounterId,
          orderType: "IMAGING",
          priority: "ROUTINE",
          clinicalIndication: imagingIndication || chiefComplaint,
          imagingDetails: {
            modality: imagingModality,
            body_part: imagingBodyPart.trim(),
            with_contrast: imagingContrast,
            special_instructions: imagingIndication.trim() || undefined,
          },
        },
        user
      );

      if (res.success && res.order) {
        setEncounterOrders((prev) => [res.order!, ...prev]);
        setImagingIndication("");
      } else {
        alert(res.error || "Failed to order imaging.");
      }
    } finally {
      setIsSubmittingImaging(false);
    }
  };

  // Submit Specialty Referral (Phase 7.3)
  const handleSubmitReferral = async () => {
    if (!referralReason.trim()) return;
    setIsSubmittingReferral(true);

    try {
      const res = await ReferralService.finalizeReferral(
        encounterId,
        {
          destination_type: "SPECIALTY",
          destination_specialty_name: referralSpecialty,
          priority: referralUrgency as any,
          reason: referralReason.trim(),
          notes: referralSummary.trim() || undefined,
        },
        user
      );

      if (res.success && res.referral) {
        setEncounterOrders((prev) => [res.referral as any, ...prev]);
        setReferralReason("");
        setReferralSummary("");
      } else {
        alert(res.error || "Failed to submit referral.");
      }
    } finally {
      setIsSubmittingReferral(false);
    }
  };

  // Complete Consultation Handler
  const handleCompleteConsultation = async () => {
    if (!contextData) return;
    setIsCompleting(true);

    try {
      const res = await ConsultationService.completeConsultation(
        encounterId,
        {
          chief_complaint: chiefComplaint,
          symptoms,
          vitals,
          observations,
          clinical_notes: clinicalNotes,
          assessment,
          diagnoses,
          treatment_plan: treatmentPlan,
          follow_up_plan: followUpPlan,
        },
        user
      );

      if (res.success) {
        setShowCompleteModal(false);
        router.push("/doctor");
      } else {
        alert(res.message || "Failed to complete consultation.");
      }
    } finally {
      setIsCompleting(false);
    }
  };

  // Amend Completed Record Handler
  const handleAmendConsultation = async () => {
    if (!amendmentReason.trim()) return;
    const res = await ConsultationService.amendConsultation(
      encounterId,
      {
        chief_complaint: chiefComplaint,
        symptoms,
        vitals,
        observations,
        clinical_notes: clinicalNotes,
        assessment,
        diagnoses,
        treatment_plan: treatmentPlan,
        follow_up_plan: followUpPlan,
      },
      amendmentReason,
      user
    );

    if (res.success) {
      setShowAmendModal(false);
      setAmendmentReason("");
      loadContext();
    } else {
      alert(res.error || "Failed to apply amendment.");
    }
  };

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={["doctor", "admin"]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading Clinical Consultation Workspace...</p>
        </div>
      </RoleGuard>
    );
  }

  if (errorMessage || !contextData) {
    return (
      <RoleGuard allowedRoles={["doctor", "admin"]}>
        <div className="p-6 max-w-2xl mx-auto space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMessage || "Unable to access this consultation encounter."}</span>
          </div>
          <Button onClick={() => router.push("/doctor")} variant="outline" className="rounded-xl">
            <ChevronLeft className="h-4 w-4 mr-1" /> Return to OPD Desk
          </Button>
        </div>
      </RoleGuard>
    );
  }

  const { encounter, clinical_record, patient, linked_appointment, recent_encounters } = contextData;
  const isCompleted = encounter.status === "COMPLETED" || encounter.status === "FINALIZED";

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6 pb-20 animate-in fade-in-50 duration-150">
        <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
          <span className="font-semibold text-slate-700">
            Consultation View Mode: <strong>{workspaceMode === "digital_desk" ? "Digital Clinical Desk & Digital Exam Pad" : "Standard Multi-Tab Workspace"}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWorkspaceMode(workspaceMode === "digital_desk" ? "classic_view" : "digital_desk")}
            className="text-xs h-7 font-bold border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            {workspaceMode === "digital_desk" ? "Switch to Classic Multi-Tab View" : "Switch to Digital Clinical Desk & Exam Pad"}
          </Button>
        </div>

        {workspaceMode === "digital_desk" && user ? (
          <DoctorConsultationWorkspace
            encounterId={encounterId}
            currentDoctor={user as any}
            onFinalized={() => loadContext()}
          />
        ) : (
          <>
        {/* ============================================================ */}
        {/* 1. TOP PATIENT SAFETY & CONTEXT HEADER */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/doctor" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{patient?.fullName || encounter.patient_name}</h1>
                  <Badge variant="outline" className="font-mono text-xs font-semibold text-slate-700 bg-slate-50">
                    {encounter.patient_id}
                  </Badge>
                  <StatusBadge status={encounter.status} />
                  {isCompleted && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[10px] font-bold">
                      v{clinical_record?.version || 1}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>{patient?.patientData?.gender || "Gender N/A"}</span>
                  <span>•</span>
                  <span>{patient?.patientData?.dob ? `DOB: ${patient.patientData.dob}` : "Age N/A"}</span>
                  <span>•</span>
                  <span className="font-bold text-slate-700">Blood: {patient?.patientData?.bloodGroup || "O+"}</span>
                  <span>•</span>
                  <span>{encounter.organization_name} ({encounter.location || "Room 102"})</span>
                  {encounter.token_number && (
                    <>
                      <span>•</span>
                      <span className="font-mono font-bold text-teal-800">Token #{encounter.token_number}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Informational Elapsed Timer & Top Action Bar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-slate-700">
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                <span>⏱️ {elapsedMinutes}m elapsed</span>
              </div>

              {/* Autosave Status (Requirement 44) */}
              <div className="text-xs flex items-center gap-1 text-slate-500 font-medium">
                {saveStatus === "saving" && <span className="text-amber-600 animate-pulse">⏳ Saving...</span>}
                {saveStatus === "saved" && (
                  <span className="text-emerald-700 font-semibold">
                    ● Saved {lastSavedTime ? `at ${lastSavedTime}` : ""}
                  </span>
                )}
                {saveStatus === "unsaved" && <span className="text-amber-700">⚠️ Unsaved changes</span>}
                {saveStatus === "error" && <span className="text-rose-600 font-semibold">❌ Save failed</span>}
              </div>

              {!isCompleted ? (
                <>
                  <Button
                    onClick={handleSaveDraft}
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold rounded-xl h-9"
                    disabled={saveStatus === "saving"}
                  >
                    <Save className="h-3.5 w-3.5 mr-1" /> Save Draft
                  </Button>
                  <Button
                    onClick={() => setShowCompleteModal(true)}
                    size="sm"
                    className="text-xs font-bold rounded-xl h-9 bg-teal-700 hover:bg-teal-800 text-white shadow-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete Consultation
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowAmendModal(true)}
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold rounded-xl h-9 border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
                >
                  <History className="h-3.5 w-3.5 mr-1" /> Amend Record
                </Button>
              )}
            </div>
          </div>

          {/* Prominent Allergies Safety Banner (Requirement 26 & 133 - No Fabricated Data) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs flex items-center justify-between text-slate-800">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className={`h-4 w-4 shrink-0 ${patient?.patientData?.allergies && patient.patientData.allergies.length > 0 ? "text-rose-600" : "text-amber-500"}`} />
              <span>
                KNOWN ALLERGIES:{" "}
                {patient?.patientData?.allergies && patient.patientData.allergies.length > 0
                  ? patient.patientData.allergies.join(", ")
                  : "Not recorded"}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Patient Safety Verification</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. MAIN 2-COLUMN CLINICAL WORKBENCH */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT 2 COLUMNS: STRUCTURED CLINICAL DOCUMENTATION & ORDERS */}
          <div className="lg:col-span-2 space-y-6">

            {/* Section 1: Chief Complaint */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600" />
                    1. Chief Complaint & Presenting Problem *
                  </span>
                  {encounter.reason_for_visit && (
                    <Badge variant="outline" className="text-[10px] font-normal text-slate-600 bg-slate-50">
                      Patient-provided reason: {encounter.reason_for_visit}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                <Textarea
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setChiefComplaint(e.target.value);
                    setSaveStatus("unsaved");
                  }}
                  disabled={isCompleted}
                  placeholder="Primary complaint described by patient (e.g. Dull chest discomfort and shortness of breath upon exertion for 3 days)..."
                  className="text-xs rounded-xl"
                />
              </CardContent>
            </Card>

            {/* Section 2: Symptoms List */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  2. Presenting Symptoms & Clinical History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                {/* Symptom Cards */}
                {symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {symptoms.map((sym, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800"
                      >
                        <span className="font-semibold">{sym.name}</span>
                        {sym.duration && <span className="text-slate-500 font-mono text-[11px]">({sym.duration})</span>}
                        <Badge
                          variant="secondary"
                          className={`text-[9px] px-1.5 py-0 ${
                            sym.severity === "SEVERE"
                              ? "bg-rose-100 text-rose-800"
                              : sym.severity === "MODERATE"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {sym.severity}
                        </Badge>
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSymptom(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Symptom Bar */}
                {!isCompleted && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-100">
                    <div className="sm:col-span-5">
                      <Input
                        placeholder="Symptom name (e.g. Palpitations)"
                        value={newSymptomName}
                        onChange={(e) => setNewSymptomName(e.target.value)}
                        className="text-xs h-9 rounded-xl"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        placeholder="Duration (e.g. 2 weeks)"
                        value={newSymptomDuration}
                        onChange={(e) => setNewSymptomDuration(e.target.value)}
                        className="text-xs h-9 rounded-xl"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={newSymptomSeverity}
                        onChange={(e) => setNewSymptomSeverity(e.target.value as any)}
                        className="w-full h-9 rounded-xl border border-input bg-background px-2 text-xs"
                      >
                        <option value="MILD">Mild</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="SEVERE">Severe</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        onClick={handleAddSymptom}
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs font-semibold h-9 rounded-xl"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 3: Physical Examination & Vitals */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-rose-600" />
                  3. Examination Findings & Structured Vitals
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Record objective physiological metrics with explicit clinical units.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Heart Rate (bpm)</Label>
                    <Input
                      type="number"
                      placeholder="72"
                      value={vitals.heart_rate_bpm ?? ""}
                      onChange={(e) => handleVitalsChange("heart_rate_bpm", e.target.value)}
                      disabled={isCompleted}
                      className="text-xs h-9 mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">BP Systolic (mmHg)</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={vitals.systolic_bp_mmhg ?? ""}
                      onChange={(e) => handleVitalsChange("systolic_bp_mmhg", e.target.value)}
                      disabled={isCompleted}
                      className="text-xs h-9 mt-1 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">BP Diastolic (mmHg)</Label>
                    <Input
                      type="number"
                      placeholder="80"
                      value={vitals.diastolic_bp_mmhg ?? ""}
                      onChange={(e) => handleVitalsChange("diastolic_bp_mmhg", e.target.value)}
                      disabled={isCompleted}
                      className="text-xs h-9 mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Temp (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="37.0"
                      value={vitals.temperature_celsius ?? ""}
                      onChange={(e) => handleVitalsChange("temperature_celsius", e.target.value)}
                      disabled={isCompleted}
                      className="text-xs h-9 mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">SpO₂ (%)</Label>
                    <Input
                      type="number"
                      placeholder="98"
                      value={vitals.spo2_percent ?? ""}
                      onChange={(e) => handleVitalsChange("spo2_percent", e.target.value)}
                      disabled={isCompleted}
                      className="text-xs h-9 mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="70"
                      value={vitals.weight_kg ?? ""}
                      onChange={(e) => handleVitalsChange("weight_kg", e.target.value)}
                      disabled={isCompleted}
                      className="text-xs h-9 mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Height (cm)</Label>
                    <Input
                      type="number"
                      placeholder="175"
                      value={vitals.height_cm ?? ""}
                      onChange={(e) => handleVitalsChange("height_cm", e.target.value)}
                      disabled={isCompleted}
                      className="text-xs h-9 mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Calculated BMI</Label>
                    <div className="h-9 px-3 flex items-center bg-slate-200/80 rounded-xl font-mono text-xs font-bold text-slate-800 mt-1">
                      {vitals.bmi ? `${vitals.bmi} kg/m²` : "—"}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Physical Examination & Systemic Observations</Label>
                  <Textarea
                    rows={2}
                    value={observations}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setObservations(e.target.value);
                      setSaveStatus("unsaved");
                    }}
                    disabled={isCompleted}
                    placeholder="General appearance, cardiovascular S1/S2, respiratory clear, abdomen soft, no edema..."
                    className="text-xs mt-1 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Assessment & Clinical Diagnoses */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  4. Assessment & Clinical Diagnoses (Doctor-Authored)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Documented exclusively by the attending clinician. MEDORA never auto-diagnoses.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Clinical Assessment / Differential</Label>
                  <Textarea
                    rows={2}
                    value={assessment}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setAssessment(e.target.value);
                      setSaveStatus("unsaved");
                    }}
                    disabled={isCompleted}
                    placeholder="Clinical impression, staging, risk assessment..."
                    className="text-xs mt-1 rounded-xl"
                  />
                </div>

                {/* Diagnoses List */}
                {diagnoses.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {diagnoses.map((dx, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{dx.name}</span>
                          {dx.icd10_code && (
                            <Badge variant="outline" className="font-mono text-[10px] text-teal-800 bg-teal-50/70 border-teal-200">
                              ICD-10: {dx.icd10_code}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[9px]">
                            {dx.category} • {dx.status}
                          </Badge>
                        </div>
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDiagnosis(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Diagnosis Bar */}
                {!isCompleted && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-100">
                    <div className="sm:col-span-5">
                      <Input
                        placeholder="Diagnosis name (e.g. Essential Hypertension)"
                        value={newDxName}
                        onChange={(e) => setNewDxName(e.target.value)}
                        className="text-xs h-9 rounded-xl"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        placeholder="ICD-10 (e.g. I10)"
                        value={newDxCode}
                        onChange={(e) => setNewDxCode(e.target.value)}
                        className="text-xs h-9 rounded-xl font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={newDxCategory}
                        onChange={(e) => setNewDxCategory(e.target.value as any)}
                        className="w-full h-9 rounded-xl border border-input bg-background px-2 text-xs"
                      >
                        <option value="PRIMARY">Primary</option>
                        <option value="SECONDARY">Secondary</option>
                        <option value="PROVISIONAL">Provisional</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        onClick={handleAddDiagnosis}
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs font-semibold h-9 rounded-xl"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Dx
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 5: Treatment Plan & Follow-Up */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  5. Treatment Plan & Follow-Up Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Treatment Plan & Patient Advice</Label>
                  <Textarea
                    rows={2}
                    value={treatmentPlan}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setTreatmentPlan(e.target.value);
                      setSaveStatus("unsaved");
                    }}
                    disabled={isCompleted}
                    placeholder="Prescription guidelines, lifestyle changes, dietary precautions, activity recommendations..."
                    className="text-xs mt-1 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Follow-Up Recommended Timeframe</Label>
                    <Input
                      placeholder="e.g. 7 days / 2 weeks / SOS"
                      value={followUpPlan.follow_up_timeframe || ""}
                      onChange={(e) => {
                        setFollowUpPlan({ ...followUpPlan, required: true, follow_up_timeframe: e.target.value });
                        setSaveStatus("unsaved");
                      }}
                      disabled={isCompleted}
                      className="text-xs mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Return Precautions / Instructions</Label>
                    <Input
                      placeholder="e.g. Return immediately if chest pain recurs"
                      value={followUpPlan.instructions || ""}
                      onChange={(e) => {
                        setFollowUpPlan({ ...followUpPlan, instructions: e.target.value });
                        setSaveStatus("unsaved");
                      }}
                      disabled={isCompleted}
                      className="text-xs mt-1 rounded-xl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ============================================================ */}
            {/* SECTION 6: INTERACTIVE PRESCRIPTION COMPOSER (PHASE C.2) */}
            {/* ============================================================ */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200 border-2 border-emerald-100">
              <CardHeader className="p-4 pb-2 bg-emerald-50/40 rounded-t-2xl border-b border-emerald-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-emerald-700" />
                    6. Digital Prescription Composer (Phase C.2)
                  </CardTitle>
                  {issuedPrescription ? (
                    <Badge className="bg-emerald-100 text-emerald-800 font-mono text-xs">
                      ISSUED ({issuedPrescription.id} • v{issuedPrescription.version || 1})
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-slate-600 bg-white font-mono">
                      DRAFT COMPOSITION
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-emerald-800/80">
                  Author structured medications with dosage, route, frequency, and instructions for open pharmacy fulfillment.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                
                {/* Duplicate Medicine Warning Banner */}
                {duplicateWarning && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{duplicateWarning}</span>
                  </div>
                )}

                {/* Prescription Items Table */}
                {prescriptionItems.length > 0 ? (
                  <div className="space-y-2">
                    {prescriptionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-start justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{item.medicine_name}</span>
                            {item.strength && (
                              <Badge variant="outline" className="font-mono text-[10px] bg-white">
                                {item.strength}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[9px] bg-slate-200 text-slate-700">
                              {item.route}
                            </Badge>
                            {item.is_prn && (
                              <Badge className="bg-purple-100 text-purple-800 text-[9px]">AS NEEDED (PRN)</Badge>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium">
                            <strong>Dose:</strong> {item.dosage} • <strong>Freq:</strong> {item.frequency} • <strong>Timing:</strong> {item.timing || "AFTER_FOOD"} • <strong>Duration:</strong> {item.duration}
                          </p>
                          {item.instructions && (
                            <p className="text-slate-500 italic text-[11px]">“{item.instructions}”</p>
                          )}
                        </div>

                        {!issuedPrescription && !isCompleted && (
                          <Button
                            type="button"
                            onClick={() => handleRemovePrescriptionItem(idx)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-rose-600 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    No medications added to this prescription yet. Search catalog below.
                  </div>
                )}

                {/* Medicine Catalog Search & Add Item Form */}
                {!issuedPrescription && !isCompleted && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5 text-emerald-700" />
                        Search Pharmaceutical Catalog or Enter Custom Medicine
                      </Label>
                    </div>

                    <div className="relative">
                      <Input
                        placeholder="Search by generic (e.g. Paracetamol) or brand name (e.g. Dolo 650)..."
                        value={medSearchQuery}
                        onChange={(e) => setMedSearchQuery(e.target.value)}
                        className="text-xs h-9 rounded-xl bg-white"
                      />

                      {/* Autocomplete Dropdown */}
                      {medSearchResults.length > 0 && (
                        <div className="absolute top-10 left-0 right-0 z-30 bg-white rounded-xl shadow-lg border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {medSearchResults.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectCatalogMed(m)}
                              className="w-full text-left p-2.5 hover:bg-emerald-50 text-xs flex items-center justify-between transition-colors"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{m.brand_name}</span>
                                <span className="text-slate-500 ml-2">({m.generic_name})</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-[10px] font-mono">{m.default_strength}</Badge>
                                <span className="text-[10px] text-slate-400">{m.category}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Detailed Item Input Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Medicine Name *</Label>
                        <Input
                          placeholder="Medicine name"
                          value={itemMedName}
                          onChange={(e) => setItemMedName(e.target.value)}
                          className="text-xs h-8 mt-1 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Strength</Label>
                        <Input
                          placeholder="e.g. 500 mg"
                          value={itemStrength}
                          onChange={(e) => setItemStrength(e.target.value)}
                          className="text-xs h-8 mt-1 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Dosage *</Label>
                        <Input
                          placeholder="e.g. 1 tablet"
                          value={itemDosage}
                          onChange={(e) => setItemDosage(e.target.value)}
                          className="text-xs h-8 mt-1 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Route</Label>
                        <select
                          value={itemRoute}
                          onChange={(e) => setItemRoute(e.target.value as any)}
                          className="w-full h-8 mt-1 rounded-lg border border-input bg-white px-2 text-xs"
                        >
                          <option value="ORAL">Oral</option>
                          <option value="TOPICAL">Topical</option>
                          <option value="INHALATION">Inhalation</option>
                          <option value="INJECTION">Injection</option>
                          <option value="OPHTHALMIC">Ophthalmic</option>
                          <option value="OTIC">Otic</option>
                          <option value="SUBLINGUAL">Sublingual</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Frequency *</Label>
                        <select
                          value={itemFrequency}
                          onChange={(e) => setItemFrequency(e.target.value)}
                          className="w-full h-8 mt-1 rounded-lg border border-input bg-white px-2 text-xs"
                        >
                          <option value="Once daily (morning)">Once daily (morning)</option>
                          <option value="Once daily (night)">Once daily (night)</option>
                          <option value="Twice daily (morning, night)">Twice daily (morning, night)</option>
                          <option value="Three times daily (TID)">Three times daily (TID)</option>
                          <option value="Every 8 hours">Every 8 hours</option>
                          <option value="Every 12 hours">Every 12 hours</option>
                          <option value="As needed (PRN)">As needed (PRN)</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Timing</Label>
                        <select
                          value={itemTiming}
                          onChange={(e) => setItemTiming(e.target.value as any)}
                          className="w-full h-8 mt-1 rounded-lg border border-input bg-white px-2 text-xs"
                        >
                          <option value="AFTER_FOOD">After Food</option>
                          <option value="BEFORE_FOOD">Before Food</option>
                          <option value="WITH_FOOD">With Food</option>
                          <option value="AT_BEDTIME">At Bedtime</option>
                          <option value="EMPTY_STOMACH">Empty Stomach</option>
                          <option value="ANY_TIME">Any Time</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Duration *</Label>
                        <Input
                          placeholder="e.g. 5 days / 30 days"
                          value={itemDuration}
                          onChange={(e) => setItemDuration(e.target.value)}
                          className="text-xs h-8 mt-1 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Quantity</Label>
                        <Input
                          placeholder="e.g. 10 tablets"
                          value={itemQuantity}
                          onChange={(e) => setItemQuantity(e.target.value)}
                          className="text-xs h-8 mt-1 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700">Specific Administration Instructions</Label>
                      <Input
                        placeholder="e.g. Take with a glass of water after breakfast. Avoid citrus fruits."
                        value={itemInstructions}
                        onChange={(e) => setItemInstructions(e.target.value)}
                        className="text-xs h-8 mt-1 rounded-lg bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={itemIsPrn}
                          onChange={(e) => setItemIsPrn(e.target.checked)}
                          className="rounded text-teal-600"
                        />
                        <span>PRN (Take as needed for severe symptoms)</span>
                      </label>

                      <Button
                        type="button"
                        onClick={handleAddPrescriptionItem}
                        size="sm"
                        className="text-xs font-bold h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
                        disabled={!itemMedName.trim()}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Medication
                      </Button>
                    </div>
                  </div>
                )}

                {/* Prescription Actions Bar */}
                {prescriptionItems.length > 0 && !issuedPrescription && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <Button
                      type="button"
                      onClick={() => setShowRxPreviewModal(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold rounded-xl"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Preview Prescription
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowRxIssueConfirmModal(true)}
                      size="sm"
                      className="text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Issue Digital Prescription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ============================================================ */}
            {/* SECTION 7: MEDICAL ORDERS (LAB, IMAGING & REFERRAL) (PHASE C.2) */}
            {/* ============================================================ */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 bg-slate-50/50 rounded-t-2xl border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    7. Medical Orders (Diagnostic, Radiology & Referral)
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">Phase C.2</Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                
                {/* Order Type Tabs */}
                <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setActiveOrderTab("lab")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      activeOrderTab === "lab" ? "bg-white text-purple-800 font-bold shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    🧪 Diagnostic Lab Orders
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOrderTab("imaging")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      activeOrderTab === "imaging" ? "bg-white text-purple-800 font-bold shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    🩻 Radiology & Imaging
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOrderTab("referral")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      activeOrderTab === "referral" ? "bg-white text-purple-800 font-bold shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    🏥 Specialty Referral
                  </button>
                </div>

                {/* Sub-Tab 1: Diagnostic Lab Orders */}
                {activeOrderTab === "lab" && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {labTests.map((t) => (
                        <label
                          key={t.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            selectedLabTestIds.includes(t.id)
                              ? "bg-purple-50 border-purple-300 font-bold text-purple-950"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedLabTestIds.includes(t.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLabTestIds([...selectedLabTestIds, t.id]);
                                } else {
                                  setSelectedLabTestIds(selectedLabTestIds.filter((id) => id !== t.id));
                                }
                              }}
                              className="rounded text-purple-600"
                            />
                            <span>{t.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-mono">{t.specimen}</Badge>
                        </label>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Priority</Label>
                        <select
                          value={labPriority}
                          onChange={(e) => setLabPriority(e.target.value as any)}
                          className="w-full h-8 mt-1 rounded-lg border border-input bg-white px-2 text-xs"
                        >
                          <option value="ROUTINE">Routine</option>
                          <option value="URGENT">Urgent</option>
                          <option value="STAT">STAT (Emergency)</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] font-bold text-slate-700">Clinical Indication / Notes</Label>
                        <Input
                          placeholder="e.g. Fasting 12 hrs, baseline cardiovascular evaluation"
                          value={labIndication}
                          onChange={(e) => setLabIndication(e.target.value)}
                          className="text-xs h-8 mt-1 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <Button
                        type="button"
                        onClick={handleSubmitLabOrder}
                        size="sm"
                        className="text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white"
                        disabled={selectedLabTestIds.length === 0 || isSubmittingLab}
                      >
                        <FlaskConical className="h-3.5 w-3.5 mr-1" />
                        {isSubmittingLab ? "Ordering..." : `Order ${selectedLabTestIds.length} Lab Test(s)`}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 2: Radiology & Imaging */}
                {activeOrderTab === "imaging" && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Modality</Label>
                        <select
                          value={imagingModality}
                          onChange={(e) => setImagingModality(e.target.value as any)}
                          className="w-full h-8 mt-1 rounded-lg border border-input bg-white px-2 text-xs"
                        >
                          <option value="XRAY">X-Ray (Radiography)</option>
                          <option value="MRI">MRI Scan</option>
                          <option value="CT">CT Scan</option>
                          <option value="ULTRASOUND">Ultrasound (USG)</option>
                          <option value="ECG">12-Lead ECG</option>
                          <option value="ECHO">2D Echocardiogram</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] font-bold text-slate-700">Body Region / Examination Part *</Label>
                        <Input
                          placeholder="e.g. Chest PA View, Brain MRI with MRA, Abdomen Ultrasound"
                          value={imagingBodyPart}
                          onChange={(e) => setImagingBodyPart(e.target.value)}
                          className="text-xs h-8 mt-1 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700">Clinical Indication & Protocol</Label>
                      <Input
                        placeholder="e.g. Evaluate cardiomegaly, rule out pulmonary congestion"
                        value={imagingIndication}
                        onChange={(e) => setImagingIndication(e.target.value)}
                        className="text-xs h-8 mt-1 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={imagingContrast}
                          onChange={(e) => setImagingContrast(e.target.checked)}
                          className="rounded text-purple-600"
                        />
                        <span>With IV Contrast Protocol</span>
                      </label>

                      <Button
                        type="button"
                        onClick={handleSubmitImagingOrder}
                        size="sm"
                        className="text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white"
                        disabled={!imagingBodyPart.trim() || isSubmittingImaging}
                      >
                        <Radio className="h-3.5 w-3.5 mr-1" />
                        {isSubmittingImaging ? "Ordering..." : "Submit Radiology Order"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 3: Specialty Referral */}
                {activeOrderTab === "referral" && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Target Clinical Specialty *</Label>
                        <select
                          value={referralSpecialty}
                          onChange={(e) => setReferralSpecialty(e.target.value)}
                          className="w-full h-8 mt-1 rounded-lg border border-input bg-white px-2 text-xs"
                        >
                          <option value="Cardiology">Cardiology</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Nephrology">Nephrology</option>
                          <option value="Endocrinology">Endocrinology</option>
                          <option value="Clinical Nutrition & Dietetics">Clinical Nutrition & Dietetics</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="Pulmonology">Pulmonology</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Referral Urgency</Label>
                        <select
                          value={referralUrgency}
                          onChange={(e) => setReferralUrgency(e.target.value as any)}
                          className="w-full h-8 mt-1 rounded-lg border border-input bg-white px-2 text-xs"
                        >
                          <option value="ROUTINE">Routine Consult</option>
                          <option value="URGENT">Urgent Evaluation</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700">Reason for Referral *</Label>
                      <Input
                        placeholder="e.g. Dietary planning and lifestyle coaching for stage 1 hypertension"
                        value={referralReason}
                        onChange={(e) => setReferralReason(e.target.value)}
                        className="text-xs h-8 mt-1 rounded-lg"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700">Clinical Summary for Referred Specialist</Label>
                      <Textarea
                        rows={2}
                        placeholder="Relevant background, current diagnosis, and specific clinical questions..."
                        value={referralSummary}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReferralSummary(e.target.value)}
                        className="text-xs mt-1 rounded-xl"
                      />
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <Button
                        type="button"
                        onClick={handleSubmitReferral}
                        size="sm"
                        className="text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white"
                        disabled={!referralReason.trim() || isSubmittingReferral}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        {isSubmittingReferral ? "Issuing..." : "Issue Specialty Referral"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Display Existing Medical Orders for this Encounter */}
                {encounterOrders.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <Label className="text-xs font-bold text-slate-800">
                      Orders Placed During This Encounter ({encounterOrders.length})
                    </Label>
                    <div className="space-y-1.5">
                      {encounterOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono font-bold text-[10px]">
                                {ord.order_type}
                              </Badge>
                              <span className="font-bold text-slate-800">{ord.id}</span>
                              <StatusBadge status={ord.status} />
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              {ord.order_type === "LAB" && ord.lab_items?.map((i) => i.test_name).join(", ")}
                              {ord.order_type === "IMAGING" && `${ord.imaging_details?.modality}: ${ord.imaging_details?.body_part}`}
                              {ord.order_type === "REFERRAL" && `Referral to ${ord.referral_details?.target_specialty}`}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(ord.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT 1 COLUMN: PATIENT CONTEXT & RECENT MEDICAL HISTORY */}
          <div className="space-y-6">
            
            {/* Context Card */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-teal-600" />
                  Patient Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">ABHA Address</span>
                    <span className="font-medium text-slate-800">{patient?.patientData?.abhaAddress || "Not Linked"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Contact</span>
                    <span className="font-medium text-slate-800">
                      {patient?.patientData?.emergencyContact?.name ? `${patient.patientData.emergencyContact.name} (${patient.patientData.emergencyContact.relation || "Kin"})` : "Not provided"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Appointment Context</span>
                  <p className="text-slate-700 font-medium">
                    {linked_appointment?.slot_display_time || "OPD Walk-in Session"} • {encounter.department_name}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Previous Consultations & Clinical Continuity */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-600" />
                  Clinical Continuity ({patientTimeline.length} Events)
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullTimelineModal(true)}
                  className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-semibold"
                >
                  Full Timeline
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2">
                {/* Active Encounter Highlight */}
                <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-teal-900">
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                      CURRENT ENCOUNTER
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-white text-teal-800 font-mono font-bold">
                      {encounter.id}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-teal-800">{encounter.department_name} • {encounter.provider_name}</p>
                  <p className="text-[10px] text-teal-600 italic">Started: {new Date(encounter.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>

                {/* Recent Historical Timeline Events */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recent Care Trajectory</span>
                  {patientTimeline
                    .filter((e) => e.reference_id !== encounter.id && e.source_id !== encounter.id)
                    .slice(0, 4)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="text-[11px] truncate max-w-[170px]">{event.title}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(event.occurred_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 line-clamp-1">{event.summary}</p>
                        <div className="flex items-center justify-between text-[9px] text-slate-400">
                          <span>{event.professional_name || event.organization_name}</span>
                          <Badge variant="outline" className="text-[8px] px-1 py-0">{event.status}</Badge>
                        </div>
                      </div>
                    ))}

                  {patientTimeline.length <= 1 && (
                    <p className="text-xs text-slate-400 italic py-2 text-center">No prior medical records on file.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. MODALS (PREVIEW, CONFIRMATION, AMENDMENT, FULL TIMELINE) */}
        {/* ============================================================ */}

        {/* Full Patient Clinical Timeline Modal */}
        {showFullTimelineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
            <div className="max-w-3xl w-full p-6 space-y-4 bg-white rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Patient Longitudinal Clinical Timeline
                    </h2>
                    <p className="text-xs text-slate-500">
                      Authoritative chronological care trajectory for {patient?.fullName || encounter.patient_name} ({encounter.patient_id})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullTimelineModal(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search patient timeline..."
                    value={timelineSearch}
                    onChange={(e) => setTimelineSearch(e.target.value)}
                    className="pl-9 text-xs h-9 bg-slate-50"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                  {["all", "visits", "prescriptions", "lab_reports"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTimelineCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg transition-all capitalize ${
                        timelineCategory === cat ? "bg-white text-indigo-900 font-bold shadow-2xs" : "hover:text-slate-900"
                      }`}
                    >
                      {cat === "all" ? "All Events" : cat.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Events Stream */}
              <div className="space-y-3 pt-2">
                {patientTimeline
                  .filter((e) => {
                    if (timelineCategory === "visits" && e.event_type !== "ENCOUNTER") return false;
                    if (timelineCategory === "prescriptions" && e.event_type !== "PRESCRIPTION") return false;
                    if (timelineCategory === "lab_reports" && e.event_type !== "LAB_REPORT") return false;
                    if (timelineSearch.trim()) {
                      const q = timelineSearch.toLowerCase();
                      return (
                        e.title.toLowerCase().includes(q) ||
                        e.summary.toLowerCase().includes(q) ||
                        e.reference_id.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((event) => (
                    <div
                      key={event.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                        event.reference_id === encounter.id || event.source_id === encounter.id
                          ? "border-teal-300 bg-teal-50/40"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {event.reference_id}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{event.title}</span>
                          <Badge variant="outline" className="text-[9px] font-bold">
                            {event.status}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(event.occurred_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{event.summary}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>{event.professional_name} • {event.organization_name}</span>
                        {event.facility_name && <span>Facility: {event.facility_name}</span>}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <Button
                  onClick={() => setShowFullTimelineModal(false)}
                  className="text-xs h-8 bg-slate-900 text-white rounded-xl"
                >
                  Close Timeline
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Prescription Preview Modal */}
        {showRxPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
            <Card className="max-w-xl w-full p-6 space-y-4 bg-white rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                  <Pill className="h-5 w-5 text-emerald-600" />
                  <span>Digital Prescription Preview</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {encounter.organization_name}
                </Badge>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700">
                <p><strong>Patient:</strong> {patient?.fullName || encounter.patient_name} ({encounter.patient_id})</p>
                <p><strong>Prescribing Doctor:</strong> {encounter.provider_name}</p>
                <p><strong>Facility:</strong> {encounter.organization_name}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Rx Prescribed Medications</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-56 overflow-y-auto">
                  {prescriptionItems.map((item, idx) => (
                    <div key={idx} className="p-3 text-xs space-y-1 bg-white">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{idx + 1}. {item.medicine_name}</span>
                        <span className="font-mono text-slate-600">{item.strength || ""}</span>
                      </div>
                      <p className="text-slate-600">
                        {item.dosage} • {item.frequency} • {item.timing} • {item.duration}
                      </p>
                      {item.instructions && (
                        <p className="text-slate-500 italic text-[11px]">“{item.instructions}”</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setShowRxPreviewModal(false)}
                  className="text-xs font-semibold rounded-xl"
                >
                  Close Preview
                </Button>
                <Button
                  onClick={() => {
                    setShowRxPreviewModal(false);
                    setShowRxIssueConfirmModal(true);
                  }}
                  className="text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  Proceed to Issue
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Prescription Issue Confirmation Modal */}
        {showRxIssueConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
            <Card className="max-w-md w-full p-6 space-y-4 bg-white rounded-2xl shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Issue Authoritative Prescription?</h3>
                  <p className="text-xs text-slate-500">Prescription will be published to the patient portal.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to issue this prescription containing <strong>{prescriptionItems.length} medication(s)</strong> for <strong>{patient?.fullName || encounter.patient_name}</strong>?
              </p>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">Important Notice:</p>
                <p>Once issued, modifications require a documented clinical amendment to preserve historical medical integrity.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRxIssueConfirmModal(false)}
                  className="text-xs font-semibold rounded-xl"
                  disabled={isIssuingRx}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleIssuePrescriptionConfirm}
                  className="text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white"
                  disabled={isIssuingRx}
                >
                  {isIssuingRx ? "Issuing..." : "Yes, Issue Prescription"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Completion Confirmation Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
            <Card className="max-w-md w-full p-6 space-y-4 bg-white rounded-2xl shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Complete Consultation?</h3>
                  <p className="text-xs text-slate-500">Record will be finalized and released.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-1">
                <p><strong>Patient:</strong> {patient?.fullName || encounter.patient_name} ({encounter.patient_id})</p>
                <p><strong>Duration:</strong> {elapsedMinutes} minutes</p>
                <p><strong>Diagnoses:</strong> {diagnoses.length > 0 ? diagnoses.map((d) => d.name).join(", ") : "None documented"}</p>
                <p><strong>Prescription:</strong> {issuedPrescription ? `Issued (${issuedPrescription.id})` : `${prescriptionItems.length} items drafted`}</p>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                After completion, subsequent modifications will require a formal amendment snapshot.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteModal(false)}
                  className="text-xs font-semibold rounded-xl"
                  disabled={isCompleting}
                >
                  Continue Editing
                </Button>

                <Button
                  onClick={handleCompleteConsultation}
                  className="text-xs font-bold rounded-xl bg-teal-700 hover:bg-teal-800 text-white"
                  disabled={isCompleting}
                >
                  {isCompleting ? "Finalizing..." : "Yes, Complete Consultation"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Amendment Modal */}
        {showAmendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
            <Card className="max-w-md w-full p-6 space-y-4 bg-white rounded-2xl shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Amend Completed Record</h3>
                  <p className="text-xs text-slate-500">Document why this historical record is being updated.</p>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Clinical Reason for Amendment *</Label>
                <Textarea
                  rows={3}
                  value={amendmentReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAmendmentReason(e.target.value)}
                  placeholder="e.g. Corrected dosage instruction after reviewing morning blood pressure chart..."
                  className="text-xs mt-1 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAmendModal(false)}
                  className="text-xs font-semibold rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleAmendConsultation}
                  className="text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={!amendmentReason.trim()}
                >
                  Apply Amendment
                </Button>
              </div>
            </Card>
          </div>
        )}
          </>
        )}
      </div>
    </RoleGuard>
  );
}
