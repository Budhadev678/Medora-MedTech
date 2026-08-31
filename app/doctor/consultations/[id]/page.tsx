"use client";

// ============================================================
// MEDORA — DEDICATED DOCTOR CLINICAL DESK & CONSULTATION WORKSPACE
// PRIORITY 1 — TASKS 1 + 2 + 3 + 4 (CANONICAL ENCOUNTER WORKBENCH)
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
  Droplet,
  BedDouble,
  AlertOctagon,
  Lock,
  Unlock,
  CheckCheck,
  RefreshCw,
  ExternalLink,
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
import { placeLabOrder } from "@/lib/data/lab-order-store";
import { ReferralService } from "@/lib/services/referral-service";
import { FollowUpService } from "@/lib/services/followup-service";
import { ClinicalContinuityService } from "@/lib/services/clinical-continuity-service";
import { createBloodRequest, BloodGroup, BloodComponentType } from "@/lib/data/blood-centre-store";
import { requestAdmission, AdmissionType } from "@/lib/data/admission-store";
import {
  hasContextualAccess,
  grantContextualConsultationSharing,
  triggerBreakGlassEmergencyAccess,
  requestConsultationSharing,
} from "@/lib/data/consent-store";
import { DigitalExamPad } from "@/components/doctor/digital-exam-pad";

export default function DedicatedConsultationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const encounterId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const { user } = useAuth();

  const [contextData, setContextData] = useState<ConsultationContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestDecisionStatus, setRequestDecisionStatus] = useState<string | null>(null);

  // Timeline & Continuity Modal State
  const [patientTimeline, setPatientTimeline] = useState<TimelineEvent[]>([]);
  const [showFullTimelineModal, setShowFullTimelineModal] = useState(false);
  const [timelineSearch, setTimelineSearch] = useState("");
  const [timelineCategory, setTimelineCategory] = useState<string>("all");
  const [previewHistoryEncounter, setPreviewHistoryEncounter] = useState<HealthcareEncounter | null>(null);

  // Clinical Record Form Fields
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState<ClinicalSymptom[]>([]);
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
  const [freehandDrawing, setFreehandDrawing] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [assessment, setAssessment] = useState("");
  const [diagnoses, setDiagnoses] = useState<ClinicalDiagnosis[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [followUpPlan, setFollowUpPlan] = useState<ClinicalFollowUpPlan>({ required: false });

  // Autosave & Status State
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");

  // Elapsed Consultation Duration Timer
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Periodic Safe Autosave (every 15s when unsaved changes exist)
  useEffect(() => {
    const isEncCompleted = contextData?.encounter?.status === "COMPLETED" || contextData?.encounter?.status === "FINALIZED";
    if (saveStatus !== "unsaved" || isEncCompleted) return;
    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 15000);
    return () => clearTimeout(timer);
  }, [saveStatus, contextData, chiefComplaint, symptoms, vitals, observations, freehandDrawing, clinicalNotes, assessment, diagnoses, treatmentPlan]);

  // ============================================================
  // PRESCRIPTION COMPOSER STATE
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
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Prescription Modals
  const [showRxPreviewModal, setShowRxPreviewModal] = useState(false);
  const [showRxIssueConfirmModal, setShowRxIssueConfirmModal] = useState(false);
  const [isIssuingRx, setIsIssuingRx] = useState(false);
  const [issuedPrescription, setIssuedPrescription] = useState<HealthcarePrescription | null>(null);

  // ============================================================
  // MEDICAL ORDERS STATE
  // ============================================================
  const [activeOrderTab, setActiveOrderTab] = useState<"prescriptions" | "lab" | "imaging" | "referral" | "blood" | "admission">("prescriptions");
  const [encounterOrders, setEncounterOrders] = useState<HealthcareMedicalOrder[]>([]);

  // Lab Order State
  const [labTests] = useState<{ id: string; name: string; specimen: string }[]>([
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

  // Blood Order State
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O+");
  const [bloodComponent, setBloodComponent] = useState<BloodComponentType>("PACKED_RBC");
  const [bloodUnits, setBloodUnits] = useState<number>(1);
  const [bloodPriority, setBloodPriority] = useState<"NORMAL" | "URGENT" | "EMERGENCY">("URGENT");
  const [bloodIndication, setBloodIndication] = useState("");
  const [isSubmittingBlood, setIsSubmittingBlood] = useState(false);

  // Inpatient Admission State
  const [admissionDept, setAdmissionDept] = useState("General Medicine");
  const [admissionType, setAdmissionType] = useState<AdmissionType>("PLANNED");
  const [admissionReason, setAdmissionReason] = useState("");
  const [isSubmittingAdmission, setIsSubmittingAdmission] = useState(false);

  // Break-Glass State
  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState("");
  const [isSubmittingBreakGlass, setIsSubmittingBreakGlass] = useState(false);

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
      setFreehandDrawing(rec.freehand_drawing || "");
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

    // Load Patient Clinical Continuity Timeline (Disclose previous records only if shared)
    const allTimeline = ClinicalContinuityService.getPatientTimeline(ctx.encounter.patient_id, user as any);
    if (ctx.records_shared) {
      setPatientTimeline(allTimeline);
    } else {
      setPatientTimeline(
        allTimeline.filter((e) => e.reference_id === encounterId || e.source_id === encounterId)
      );
    }

    setIsLoading(false);
  };

  const handleRequestPatientDecision = () => {
    if (!contextData || !user) return;
    requestConsultationSharing({
      encounterId: contextData.encounter.id,
      doctorId: user.identifier || user.id,
      doctorName: user.fullName || "Attending Physician",
      patientId: contextData.encounter.patient_id,
      organizationId: contextData.encounter.organization_id,
    });
    setRequestDecisionStatus("Access decision request sent to patient.");
    setTimeout(() => setRequestDecisionStatus(null), 5000);
  };

  const handleGrantContextualSharingForDemo = () => {
    if (!contextData || !user) return;
    grantContextualConsultationSharing({
      encounterId: contextData.encounter.id,
      doctorId: user.identifier || user.id,
      doctorName: user.fullName || "Attending Physician",
      patientId: contextData.encounter.patient_id,
      patientName: contextData.encounter.patient_name,
      organizationId: contextData.encounter.organization_id,
      organizationName: contextData.encounter.organization_name,
    });
    loadContext();
  };

  useEffect(() => {
    loadContext();
    const handleUpdate = () => loadContext();
    window.addEventListener("medora-sharing-decision-updated", handleUpdate);
    window.addEventListener("medora-consent-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-sharing-decision-updated", handleUpdate);
      window.removeEventListener("medora-consent-updated", handleUpdate);
    };
  }, [encounterId, user]);

  // Elapsed Timer Calculation
  useEffect(() => {
    if (!contextData?.encounter?.started_at) return;
    const updateElapsed = () => {
      const startMs = new Date(contextData.encounter.started_at).getTime();
      const nowMs = Date.now();
      const mins = Math.max(0, Math.floor((nowMs - startMs) / 60000));
      setElapsedMinutes(mins);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [contextData?.encounter?.started_at]);

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (!contextData || !user) return;
    setSaveStatus("saving");

    try {
      const res = await ConsultationService.saveDraft(
        encounterId,
        {
          chief_complaint: chiefComplaint,
          symptoms,
          vitals,
          observations,
          clinical_notes: clinicalNotes,
          freehand_drawing: freehandDrawing,
          assessment,
          diagnoses,
          treatment_plan: treatmentPlan,
          follow_up_plan: followUpPlan,
        },
        user
      );

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

  // Medicine Search
  const handleSearchMedicines = (q: string) => {
    setMedSearchQuery(q);
    if (!q.trim()) {
      setMedSearchResults([]);
      return;
    }
    const results = searchMedicines(q);
    setMedSearchResults(results.slice(0, 6));
  };

  const handleSelectMedicineFromCatalog = (med: MedicineCatalogItem) => {
    setSelectedCatalogMed(med);
    setItemMedName(med.brand_name || med.generic_name);
    setItemGenericName(med.generic_name);
    setItemBrandName(med.brand_name || "");
    setItemStrength(med.strength || "");
    setItemRoute(med.form === "INJECTION" ? "INJECTION" : "ORAL");
    setMedSearchQuery("");
    setMedSearchResults([]);

    // Check duplicate
    const isDup = prescriptionItems.some(
      (it) => (it.generic_name || it.medicine_name).toLowerCase() === med.generic_name.toLowerCase()
    );
    if (isDup) {
      setDuplicateWarning(`Warning: ${med.generic_name} is already present in this prescription.`);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleAddPrescriptionItem = () => {
    if (!itemMedName.trim() || !user || !contextData) return;

    const newItem: PrescriptionItem = {
      id: `item-${Date.now()}`,
      medicine_name: itemMedName.trim(),
      generic_name: itemGenericName.trim() || itemMedName.trim(),
      brand_name: itemBrandName.trim() || undefined,
      strength: itemStrength.trim() || undefined,
      dosage: itemDosage.trim(),
      route: itemRoute,
      frequency: itemFrequency.trim(),
      timing: itemTiming,
      duration: itemDuration.trim(),
      quantity: itemQuantity.trim(),
      instructions: itemInstructions.trim() || undefined,
    };

    const updated = [...prescriptionItems, newItem];
    setPrescriptionItems(updated);

    // Reset Form
    setItemMedName("");
    setItemGenericName("");
    setItemBrandName("");
    setItemStrength("");
    setItemInstructions("");
    setSelectedCatalogMed(null);
    setDuplicateWarning(null);

    // Save Prescription Draft to Store
    PrescriptionOrderService.saveDraft(
      encounterId,
      {
        items: updated,
        notes: prescriptionNotes,
      },
      user
    );
  };

  const handleRemovePrescriptionItem = (index: number) => {
    if (!user) return;
    const updated = prescriptionItems.filter((_, i) => i !== index);
    setPrescriptionItems(updated);
    PrescriptionOrderService.saveDraft(
      encounterId,
      {
        items: updated,
        notes: prescriptionNotes,
      },
      user
    );
  };

  const handleIssuePrescriptionConfirm = async () => {
    if (!user || !contextData || prescriptionItems.length === 0) return;
    setIsIssuingRx(true);
    try {
      const res = await PrescriptionOrderService.issuePrescription(
        encounterId,
        {
          items: prescriptionItems,
          notes: prescriptionNotes,
        },
        user
      );

      if (res.success && res.prescription) {
        setIssuedPrescription(res.prescription);
        setShowRxIssueConfirmModal(false);
        loadContext();
      } else {
        alert(res.error || "Failed to issue prescription.");
      }
    } finally {
      setIsIssuingRx(false);
    }
  };

  // Lab Order Submit
  const handleSubmitLabOrder = async () => {
    if (selectedLabTestIds.length === 0 || !user || !contextData) return;
    setIsSubmittingLab(true);
    try {
      const items: LabOrderItem[] = selectedLabTestIds.map((tid) => {
        const t = labTests.find((x) => x.id === tid);
        return {
          id: `item-${Date.now()}-${tid}`,
          test_id: tid,
          test_code: tid,
          test_name: t?.name || tid,
          specimen_type: t?.specimen || "Blood",
        };
      });

      const res = placeLabOrder({
        encounterId,
        appointmentId: contextData.encounter.appointment_id,
        patientId: contextData.encounter.patient_id,
        patientName: contextData.encounter.patient_name,
        actorId: user.identifier || user.id,
        actorName: user.fullName,
        actorRole: user.role,
        organizationId: contextData.encounter.organization_id,
        organizationName: contextData.encounter.organization_name,
        items,
        reason: labIndication.trim() || chiefComplaint,
        instructions: "",
        priority: labPriority,
      });

      if (res.success && res.order) {
        setSelectedLabTestIds([]);
        setLabIndication("");
        loadContext();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("medora-lab-orders-updated"));
        }
      } else {
        alert(res.error || "Failed to place lab order.");
      }
    } finally {
      setIsSubmittingLab(false);
    }
  };

  // Imaging Order Submit
  const handleSubmitImagingOrder = async () => {
    if (!imagingBodyPart.trim() || !user || !contextData) return;
    setIsSubmittingImaging(true);
    try {
      const res = await PrescriptionOrderService.createMedicalOrder(
        {
          encounterId,
          orderType: "IMAGING",
          clinicalIndication: imagingIndication.trim() || chiefComplaint,
          imagingDetails: {
            modality: imagingModality,
            body_part: imagingBodyPart.trim(),
            with_contrast: imagingContrast,
          },
        },
        user
      );

      if (res.success && res.order) {
        setImagingBodyPart("");
        setImagingIndication("");
        loadContext();
      } else {
        alert(res.error || "Failed to submit radiology order.");
      }
    } finally {
      setIsSubmittingImaging(false);
    }
  };

  // Referral Order Submit
  const handleSubmitReferral = async () => {
    if (!referralReason.trim() || !user || !contextData) return;
    setIsSubmittingReferral(true);
    try {
      const res = await PrescriptionOrderService.createMedicalOrder(
        {
          encounterId,
          orderType: "REFERRAL",
          referralDetails: {
            target_specialty: referralSpecialty,
            urgency: referralUrgency,
            referral_reason: referralReason.trim(),
            clinical_summary: referralSummary.trim() || assessment,
          },
        },
        user
      );

      if (res.success && res.order) {
        setReferralReason("");
        setReferralSummary("");
        loadContext();
      } else {
        alert(res.error || "Failed to create referral.");
      }
    } finally {
      setIsSubmittingReferral(false);
    }
  };

  // Blood Order Submit
  const handleSubmitBloodOrder = () => {
    if (!contextData || !user || !bloodIndication.trim()) return;
    setIsSubmittingBlood(true);
    try {
      const res = createBloodRequest({
        hospitalId: contextData.encounter.organization_id || "FAC-1001",
        patientId: contextData.encounter.patient_id,
        patientName: contextData.encounter.patient_name,
        encounterId,
        doctorId: user.identifier || user.id,
        doctorName: user.fullName,
        bloodGroup,
        componentType: bloodComponent,
        unitsRequested: bloodUnits,
        priority: bloodPriority,
        clinicalIndication: bloodIndication.trim(),
        actorId: user.identifier || user.id,
        actorName: user.fullName,
        actorRole: user.role,
      });

      if (res.success && res.request) {
        alert(`Blood request ${res.request.id} for ${bloodUnits} unit(s) of ${bloodGroup} submitted.`);
        setBloodIndication("");
      } else {
        alert(res.error || "Failed to request blood units.");
      }
    } finally {
      setIsSubmittingBlood(false);
    }
  };

  // Inpatient Admission Submit
  const handleSubmitAdmissionOrder = () => {
    if (!contextData || !user) return;
    setIsSubmittingAdmission(true);
    try {
      const res = requestAdmission({
        patientId: contextData.encounter.patient_id,
        patientName: contextData.encounter.patient_name,
        encounterId,
        doctorId: user.identifier || user.id,
        doctorName: user.fullName,
        departmentName: admissionDept,
        facilityId: contextData.encounter.organization_id || "FAC-1001",
        facilityName: contextData.encounter.organization_name || "City Hospital",
        admissionType,
        reason: admissionReason.trim() || chiefComplaint || "Inpatient clinical monitoring and treatment",
        actorId: user.identifier || user.id,
        actorName: user.fullName,
        actorRole: user.role,
      });

      if (res.success && res.admission) {
        alert(`Inpatient admission request ${res.admission.id} created for ${admissionDept}.`);
        setAdmissionReason("");
      } else {
        alert(res.error || "Failed to request admission.");
      }
    } finally {
      setIsSubmittingAdmission(false);
    }
  };

  // Break-Glass Emergency Access
  const handleExecuteBreakGlass = () => {
    if (!contextData || !user || !breakGlassReason.trim()) return;
    setIsSubmittingBreakGlass(true);
    try {
      const res = triggerBreakGlassEmergencyAccess({
        patientId: contextData.encounter.patient_id,
        patientName: contextData.encounter.patient_name,
        actorId: user.identifier || user.id,
        actorName: user.fullName,
        actorRole: user.role,
        organizationId: contextData.encounter.organization_id || "FAC-1001",
        organizationName: contextData.encounter.organization_name || "City Hospital",
        justificationReason: breakGlassReason.trim(),
        emergencyCaseId: contextData.encounter.id,
      });

      if (res.success) {
        alert("Break-glass emergency medical record access granted and logged to immutable audit ledger.");
        setShowBreakGlassModal(false);
        setBreakGlassReason("");
        loadContext();
      }
    } finally {
      setIsSubmittingBreakGlass(false);
    }
  };

  // Finalize Consultation Handler
  const handleCompleteConsultation = async () => {
    if (!contextData || !user) return;
    setIsCompleting(true);

    try {
      const labItems: LabOrderItem[] = selectedLabTestIds.map((tid) => {
        const t = labTests.find((x) => x.id === tid);
        return {
          id: `item-${Date.now()}-${tid}`,
          test_id: tid,
          test_code: tid,
          test_name: t?.name || tid,
          specimen_type: t?.specimen || "Blood",
        };
      });

      const res = await ConsultationService.completeConsultation(
        encounterId,
        {
          chief_complaint: chiefComplaint,
          symptoms,
          vitals,
          observations,
          clinical_notes: clinicalNotes,
          freehand_drawing: freehandDrawing,
          assessment,
          diagnoses,
          treatment_plan: treatmentPlan,
          follow_up_plan: followUpPlan,
          prescriptions: prescriptionItems,
          prescription_notes: prescriptionNotes,
          refills_allowed: 0,
          lab_orders: labItems,
          lab_reason: labIndication.trim() || chiefComplaint,
          lab_priority: labPriority,
        },
        user
      );

      if (res.success) {
        setShowSummaryModal(false);
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
        freehand_drawing: freehandDrawing,
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

  const {
    encounter,
    clinical_record,
    patient,
    linked_appointment,
    same_doctor_encounters = [],
    network_encounters = [],
    records_shared,
  } = contextData;

  const isCompleted = encounter.status === "COMPLETED" || encounter.status === "FINALIZED";

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-5 pb-20 animate-in fade-in-50 duration-150">
        
        {/* ============================================================ */}
        {/* TOP CLINICAL HEADER (STICKY DESK BAR) */}
        {/* ============================================================ */}
        <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Left: Patient Identity, Room, Department */}
            <div className="flex items-center gap-3">
              <Link
                href="/doctor"
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all"
                title="Back to OPD Queue"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900">
                    {patient?.fullName || encounter.patient_name}
                  </h1>
                  <Badge variant="outline" className="font-mono text-xs font-bold text-teal-900 bg-teal-50 border-teal-200">
                    {encounter.patient_id}
                  </Badge>
                  <StatusBadge status={encounter.status} />
                  {isCompleted && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-900 text-[10px] font-bold">
                      v{clinical_record?.version || 1} Finalized
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">{patient?.patientData?.gender || "Gender N/A"}</span>
                  <span>•</span>
                  <span>{patient?.patientData?.dob ? `DOB: ${patient.patientData.dob}` : "Age N/A"}</span>
                  <span>•</span>
                  <span className="font-black text-rose-700">Blood: {patient?.patientData?.bloodGroup || "O+"}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-800">
                    {encounter.organization_name} ({encounter.location || "Room 102"})
                  </span>
                  <span>•</span>
                  <span className="font-mono font-bold text-teal-800">
                    Encounter: {encounter.id}
                  </span>
                  {encounter.token_number && (
                    <>
                      <span>•</span>
                      <span className="font-mono font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Token #{encounter.token_number}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Timer, Autosave Status, Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                <span>⏱️ {elapsedMinutes}m in visit</span>
              </div>

              {/* Autosave Status */}
              <div className="text-xs flex items-center gap-1 text-slate-500 font-medium">
                {saveStatus === "saving" && <span className="text-amber-600 animate-pulse font-semibold">⏳ Saving draft...</span>}
                {saveStatus === "saved" && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCheck className="h-3.5 w-3.5" /> Saved {lastSavedTime ? `at ${lastSavedTime}` : ""}
                  </span>
                )}
                {saveStatus === "unsaved" && <span className="text-amber-700 font-semibold">⚠️ Unsaved changes</span>}
                {saveStatus === "error" && <span className="text-rose-600 font-semibold">❌ Save failed</span>}
              </div>

              {!isCompleted ? (
                <>
                  <Button
                    onClick={handleSaveDraft}
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold rounded-xl h-9 border-slate-200"
                    disabled={saveStatus === "saving"}
                  >
                    <Save className="h-3.5 w-3.5 mr-1" /> Save Draft
                  </Button>
                  <Button
                    onClick={() => setShowSummaryModal(true)}
                    size="sm"
                    className="text-xs font-bold rounded-xl h-9 bg-teal-700 hover:bg-teal-800 text-white shadow-xs gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Finalize Consultation
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowAmendModal(true)}
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold rounded-xl h-9 border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 gap-1"
                >
                  <History className="h-3.5 w-3.5" /> Amend Record
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* THREE-COLUMN CLINICAL DESK (DESKTOP) / RESPONSIVE WORKSPACE */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ============================================================ */}
          {/* COLUMN 1: PATIENT CONTEXT & SAFETY (3 Cols) */}
          {/* ============================================================ */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Patient Context Overview */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-teal-700" />
                  <span>Patient Identity & Demographics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Legal Name</span>
                  <span className="font-bold text-slate-900 text-sm">{patient?.fullName || encounter.patient_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender & Age</span>
                    <span className="font-semibold text-slate-800">
                      {patient?.patientData?.gender || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
                    <span className="font-extrabold text-rose-700">
                      {patient?.patientData?.bloodGroup || "O+"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">ABHA Health ID</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {patient?.patientData?.abhaAddress || "12-3456-7890-1234"}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Emergency Contact</span>
                  <p className="text-slate-700 font-medium">
                    {patient?.patientData?.emergencyContact?.name 
                      ? `${patient.patientData.emergencyContact.name} (${patient.patientData.emergencyContact.relation || "Kin"})`
                      : "Not recorded"}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Appointment Schedule</span>
                  <p className="text-slate-800 font-semibold">
                    {linked_appointment?.slot_display_time || "OPD Walk-in Check-in"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    APT: {encounter.appointment_id || "APT-1001"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SAFETY ALERT: KNOWN ALLERGIES */}
            <Card className={`rounded-2xl shadow-xs border ${
              patient?.patientData?.allergies && patient.patientData.allergies.length > 0
                ? "bg-rose-50/70 border-rose-200"
                : "bg-emerald-50/50 border-emerald-200"
            }`}>
              <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${patient?.patientData?.allergies && patient.patientData.allergies.length > 0 ? "text-rose-600" : "text-emerald-600"}`} />
                  <span className={patient?.patientData?.allergies && patient.patientData.allergies.length > 0 ? "text-rose-900" : "text-emerald-900"}>
                    Verified Allergies
                  </span>
                </CardTitle>
                <Badge variant="outline" className="text-[9px] bg-white font-mono">
                  SAFETY CHECK
                </Badge>
              </CardHeader>
              <CardContent className="p-3.5 pt-1 text-xs">
                {patient?.patientData?.allergies && patient.patientData.allergies.length > 0 ? (
                  <div className="space-y-1">
                    {patient.patientData.allergies.map((alg, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 font-bold text-rose-800">
                        <span>⚠️</span>
                        <span>{alg}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-emerald-800 font-medium text-[11px]">
                    No known drug/food allergies on record.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Chronic Conditions & Baseline Context */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  <span>Chronic Conditions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                {patient?.patientData?.chronicConditions && patient.patientData.chronicConditions.length > 0 ? (
                  <div className="space-y-1.5">
                    {patient.patientData.chronicConditions.map((cond, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold">
                        {cond}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No active chronic conditions recorded.</p>
                )}
              </CardContent>
            </Card>

          </div>

          {/* ============================================================ */}
          {/* COLUMN 2: PRIMARY CLINICAL WORKSPACE (6 Cols) */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 space-y-6">

            {/* Task 4: Digital Pen-and-Paper Clinical Examination Pad */}
            <DigitalExamPad
              chiefComplaint={chiefComplaint}
              onChangeChiefComplaint={(val) => {
                setChiefComplaint(val);
                setSaveStatus("unsaved");
              }}
              symptoms={symptoms}
              onChangeSymptoms={(syms) => {
                setSymptoms(syms);
                setSaveStatus("unsaved");
              }}
              vitals={vitals}
              onChangeVitals={(v) => {
                setVitals(v);
                setSaveStatus("unsaved");
              }}
              observations={observations}
              onChangeObservations={(val) => {
                setObservations(val);
                setSaveStatus("unsaved");
              }}
              freehandDrawing={freehandDrawing}
              onChangeFreehandDrawing={(dataUrl) => {
                setFreehandDrawing(dataUrl);
                setSaveStatus("unsaved");
              }}
              assessment={assessment}
              onChangeAssessment={(val) => {
                setAssessment(val);
                setSaveStatus("unsaved");
              }}
              diagnoses={diagnoses}
              onChangeDiagnoses={(dxs) => {
                setDiagnoses(dxs);
                setSaveStatus("unsaved");
              }}
              treatmentPlan={treatmentPlan}
              onChangeTreatmentPlan={(val) => {
                setTreatmentPlan(val);
                setSaveStatus("unsaved");
              }}
              followUpPlan={followUpPlan}
              onChangeFollowUpPlan={(plan) => {
                setFollowUpPlan(plan);
                setSaveStatus("unsaved");
              }}
              isReadOnly={isCompleted}
              specialty={encounter.department_name || "Cardiology OPD"}
            />

            {/* ============================================================ */}
            {/* CONNECTED ORDER DESK (PRESCRIPTIONS, LABS, IMAGING, REFERRAL) */}
            {/* ============================================================ */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200 border-2 border-emerald-100 overflow-hidden">
              <CardHeader className="p-4 pb-3 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/50 border-b border-emerald-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black text-emerald-950 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-emerald-700" />
                    <span>Connected Clinical Order Desks</span>
                  </CardTitle>
                  <span className="text-[10px] font-mono text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                    BOUND TO {encounter.id}
                  </span>
                </div>
                <CardDescription className="text-xs text-emerald-900/80">
                  Prescribe medications, order diagnostic laboratory panels, schedule imaging, and issue specialist referrals without losing patient context.
                </CardDescription>

                {/* Desk Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveOrderTab("prescriptions")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeOrderTab === "prescriptions"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Pill className="h-3.5 w-3.5" />
                    <span>Prescriptions ({prescriptionItems.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveOrderTab("lab")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeOrderTab === "lab"
                        ? "bg-indigo-700 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span>Lab Orders ({selectedLabTestIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveOrderTab("imaging")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeOrderTab === "imaging"
                        ? "bg-purple-700 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Radio className="h-3.5 w-3.5" />
                    <span>Radiology / Imaging</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveOrderTab("referral")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeOrderTab === "referral"
                        ? "bg-teal-700 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Specialist Referral</span>
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                
                {/* TAB 1: PRESCRIPTIONS */}
                {activeOrderTab === "prescriptions" && (
                  <div className="space-y-4">
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
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2 font-bold text-slate-900">
                                <span>{idx + 1}. {item.medicine_name}</span>
                                {item.strength && <Badge variant="outline" className="text-[10px] font-mono">{item.strength}</Badge>}
                                <Badge variant="secondary" className="text-[9px]">{item.route}</Badge>
                              </div>
                              <p className="text-slate-600 mt-0.5 text-[11px]">
                                {item.dosage} • {item.frequency} • {item.timing} • For {item.duration} (Qty: {item.quantity})
                              </p>
                              {item.instructions && (
                                <p className="text-slate-500 italic text-[10px]">“{item.instructions}”</p>
                              )}
                            </div>

                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleRemovePrescriptionItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No medications added yet.</p>
                    )}

                    {/* Prescription Item Builder */}
                    {!isCompleted && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-emerald-950">Search & Prescribe Medicine</Label>
                          <span className="text-[10px] text-emerald-700 font-mono">Open Generic Catalog</span>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <Input
                            placeholder="Type medicine name or generic composition (e.g. Paracetamol, Telmisartan, Amoxicillin)..."
                            value={medSearchQuery}
                            onChange={(e) => handleSearchMedicines(e.target.value)}
                            className="pl-8 text-xs h-9 rounded-xl bg-white"
                          />

                          {medSearchResults.length > 0 && (
                            <div className="absolute z-10 left-0 right-0 top-10 bg-white rounded-xl shadow-lg border border-slate-200 p-1 max-h-48 overflow-y-auto space-y-1">
                              {medSearchResults.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleSelectMedicineFromCatalog(m)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-xs flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-bold text-slate-900">{m.brand_name || m.generic_name}</span>
                                    <span className="text-slate-500 text-[10px] ml-2 font-mono">({m.generic_name})</span>
                                  </div>
                                  <Badge variant="outline" className="text-[9px] font-mono">{m.strength}</Badge>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Dosage Config Form */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div>
                            <Label className="text-[10px] font-bold text-slate-700">Dosage</Label>
                            <Input
                              placeholder="1 tablet"
                              value={itemDosage}
                              onChange={(e) => setItemDosage(e.target.value)}
                              className="text-xs h-8 mt-1 rounded-lg bg-white"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold text-slate-700">Frequency</Label>
                            <Input
                              placeholder="Twice daily"
                              value={itemFrequency}
                              onChange={(e) => setItemFrequency(e.target.value)}
                              className="text-xs h-8 mt-1 rounded-lg bg-white"
                            />
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
                              <option value="EMPTY_STOMACH">Empty Stomach</option>
                              <option value="WITH_FOOD">With Food</option>
                              <option value="BEDTIME">Bedtime</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold text-slate-700">Duration</Label>
                            <Input
                              placeholder="5 days"
                              value={itemDuration}
                              onChange={(e) => setItemDuration(e.target.value)}
                              className="text-xs h-8 mt-1 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <Input
                            placeholder="Special clinical instructions (e.g. Drink plenty of water, avoid citrus)..."
                            value={itemInstructions}
                            onChange={(e) => setItemInstructions(e.target.value)}
                            className="text-xs h-8 rounded-lg bg-white max-w-sm"
                          />
                          <Button
                            type="button"
                            onClick={handleAddPrescriptionItem}
                            size="sm"
                            disabled={!itemMedName.trim()}
                            className="text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white h-8"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Medication
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: LAB TEST ORDERS */}
                {activeOrderTab === "lab" && (
                  <div className="space-y-3 pt-1">
                    <Label className="text-xs font-bold text-slate-800">Select Diagnostic Test Panels</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {labTests.map((t) => (
                        <label
                          key={t.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                            selectedLabTestIds.includes(t.id)
                              ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div>
                            <p>{t.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">Specimen: {t.specimen}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedLabTestIds.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedLabTestIds([...selectedLabTestIds, t.id]);
                              else setSelectedLabTestIds(selectedLabTestIds.filter((id) => id !== t.id));
                            }}
                            className="rounded text-indigo-600 h-4 w-4"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Input
                        placeholder="Clinical Indication (e.g. Evaluate dyslipidemia & renal profile)..."
                        value={labIndication}
                        onChange={(e) => setLabIndication(e.target.value)}
                        className="text-xs h-8 rounded-lg max-w-sm"
                      />

                      <Button
                        type="button"
                        onClick={handleSubmitLabOrder}
                        size="sm"
                        disabled={selectedLabTestIds.length === 0 || isSubmittingLab}
                        className="text-xs font-bold rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white h-8"
                      >
                        <FlaskConical className="h-3.5 w-3.5 mr-1" />
                        {isSubmittingLab ? "Submitting..." : `Order ${selectedLabTestIds.length} Test(s)`}
                      </Button>
                    </div>
                  </div>
                )}

                {/* TAB 3: RADIOLOGY / IMAGING */}
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
                          <option value="XRAY">X-Ray Digital</option>
                          <option value="ECG">12-Lead ECG</option>
                          <option value="ECHO">2D Echocardiogram</option>
                          <option value="ULTRASOUND">Ultrasound Sonography</option>
                          <option value="CT">CT Scan</option>
                          <option value="MRI">MRI</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] font-bold text-slate-700">Body Region / Examination Part *</Label>
                        <Input
                          placeholder="e.g. Chest PA View, 12-Lead Rhythm Strip"
                          value={imagingBodyPart}
                          onChange={(e) => setImagingBodyPart(e.target.value)}
                          className="text-xs h-8 mt-1 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <Button
                        type="button"
                        onClick={handleSubmitImagingOrder}
                        size="sm"
                        disabled={!imagingBodyPart.trim() || isSubmittingImaging}
                        className="text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white h-8"
                      >
                        <Radio className="h-3.5 w-3.5 mr-1" />
                        {isSubmittingImaging ? "Submitting..." : "Order Imaging"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* TAB 4: SPECIALIST REFERRAL */}
                {activeOrderTab === "referral" && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Specialty</Label>
                        <select
                          value={referralSpecialty}
                          onChange={(e) => setReferralSpecialty(e.target.value)}
                          className="w-full h-8 mt-1 rounded-lg border border-input bg-white px-2 text-xs"
                        >
                          <option value="Cardiology">Cardiology</option>
                          <option value="Endocrinology">Endocrinology</option>
                          <option value="Nephrology">Nephrology</option>
                          <option value="Clinical Nutrition & Dietetics">Clinical Nutrition & Dietetics</option>
                          <option value="Neurology">Neurology</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-700">Urgency</Label>
                        <select
                          value={referralUrgency}
                          onChange={(e) => setReferralUrgency(e.target.value as any)}
                          className="w-full h-8 mt-1 rounded-lg border border-input bg-white px-2 text-xs"
                        >
                          <option value="ROUTINE">Routine Specialist Consult</option>
                          <option value="URGENT">Urgent Evaluation</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold text-slate-700">Reason for Referral *</Label>
                      <Input
                        placeholder="e.g. Dietary planning and lifestyle counseling for Stage 1 Hypertension"
                        value={referralReason}
                        onChange={(e) => setReferralReason(e.target.value)}
                        className="text-xs h-8 mt-1 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <Button
                        type="button"
                        onClick={handleSubmitReferral}
                        size="sm"
                        disabled={!referralReason.trim() || isSubmittingReferral}
                        className="text-xs font-bold rounded-xl bg-teal-700 hover:bg-teal-800 text-white h-8"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        {isSubmittingReferral ? "Issuing..." : "Issue Referral"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* ============================================================ */}
          {/* COLUMN 3: CLINICAL CONTEXT & HISTORY (3 Cols) */}
          {/* ============================================================ */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Task 2: Record Sharing Decision Card */}
            <Card className={`rounded-2xl shadow-xs border ${
              records_shared
                ? "bg-emerald-50/50 border-emerald-200"
                : "bg-amber-50/50 border-amber-200"
            }`}>
              <CardHeader className="p-4 pb-2 border-b border-slate-100/80 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className={`h-4 w-4 ${records_shared ? "text-emerald-700" : "text-amber-700"}`} />
                  <span className={records_shared ? "text-emerald-950" : "text-amber-950"}>
                    Record Sharing Access
                  </span>
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`text-[9px] font-bold ${
                    records_shared
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {records_shared ? "AUTHORIZED" : "NOT SHARED"}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-xs">
                {records_shared ? (
                  <div className="space-y-2">
                    <p className="text-emerald-900 font-medium text-[11px] leading-relaxed">
                      ✓ Patient has authorized medical record access for this clinical encounter.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullTimelineModal(true)}
                      className="w-full text-xs font-bold rounded-xl h-8 text-emerald-800 border-emerald-200 hover:bg-emerald-100/50"
                    >
                      <History className="h-3.5 w-3.5 mr-1" /> View Full Trajectory
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-center">
                    <div className="h-8 w-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="h-4 w-4" />
                    </div>
                    <p className="text-amber-900 font-semibold text-[11px]">
                      Historical records outside this consultation are restricted by patient privacy policy.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleGrantContextualSharingForDemo}
                        className="w-full text-xs font-bold rounded-xl bg-white border-amber-300 text-amber-900 hover:bg-amber-100 h-8"
                      >
                        <Unlock className="h-3.5 w-3.5 mr-1" /> Grant Sharing (Patient Demo)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleRequestPatientDecision}
                        className="w-full text-xs font-semibold text-slate-600 hover:bg-slate-100 h-7"
                      >
                        <Share2 className="h-3 w-3 mr-1" /> Request Patient Consent
                      </Button>
                    </div>
                    {requestDecisionStatus && (
                      <p className="text-[10px] text-emerald-700 font-bold animate-pulse">{requestDecisionStatus}</p>
                    )}
                  </div>
                )}

                {/* Break-Glass Emergency Access */}
                <div className="pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBreakGlassModal(true)}
                    size="sm"
                    className="w-full text-xs font-bold rounded-xl border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 h-7 gap-1"
                  >
                    <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
                    Emergency Break-Glass
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Task 3: PREVIOUS VISITS WITH YOU (Same-Doctor History) */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-teal-700" />
                  <span>Previous Visits With You</span>
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-400">
                  Care continuity matched by doctor ID ({user?.identifier || user?.id || "DOC-1001"})
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                {same_doctor_encounters.length > 0 ? (
                  <div className="space-y-2">
                    {same_doctor_encounters.map((enc) => (
                      <div
                        key={enc.id}
                        onClick={() => setPreviewHistoryEncounter(enc)}
                        className="p-2.5 rounded-xl bg-teal-50/40 border border-teal-200 hover:bg-teal-50 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="text-[11px] font-mono text-teal-900">{enc.id}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(enc.started_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium line-clamp-1">
                          {enc.reason_for_visit || "Follow-up consultation"}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-teal-800 pt-0.5">
                          <span>{enc.department_name}</span>
                          <span className="text-teal-600 flex items-center gap-0.5 font-bold">
                            View <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2 text-center">
                    No prior consultations recorded with you.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Task 3: PREVIOUS AUTHORIZED HOSPITAL RECORDS */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <span>Network Hospital Records</span>
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-400">
                  Cross-facility records authorized by patient
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                {records_shared ? (
                  network_encounters.length > 0 ? (
                    <div className="space-y-2">
                      {network_encounters.map((enc) => (
                        <div
                          key={enc.id}
                          onClick={() => setPreviewHistoryEncounter(enc)}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer transition-all space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span className="text-[11px]">{enc.provider_name}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(enc.started_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 line-clamp-1">{enc.organization_name} • {enc.reason_for_visit}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2 text-center">
                      No other hospital records found.
                    </p>
                  )
                ) : (
                  <p className="text-xs text-slate-400 italic py-2 text-center">
                    Restricted until patient grants record sharing.
                  </p>
                )}
              </CardContent>
            </Card>

          </div>

        </div>

        {/* ============================================================ */}
        {/* MODAL 1: CONSULTATION SUMMARY REVIEW & FINALIZATION */}
        {/* ============================================================ */}
        {showSummaryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
            <Card className="max-w-2xl w-full p-6 space-y-4 bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Consultation Summary & Review</h2>
                    <p className="text-xs text-slate-500">Review structured findings before official finalization</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Summary Sections */}
              <div className="space-y-3 text-xs divide-y divide-slate-100">
                {/* Demographics & Reason */}
                <div className="space-y-1 pt-1">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Patient & Visit Reason</p>
                  <p className="text-slate-900 font-semibold">{patient?.fullName || encounter.patient_name} ({encounter.patient_id})</p>
                  <p className="text-slate-600 font-medium">Chief Complaint: {chiefComplaint || "Routine Consultation"}</p>
                </div>

                {/* Vitals Summary */}
                <div className="space-y-1 pt-2">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Physiological Vitals</p>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]">
                    <div>BP: <strong>{vitals.systolic_bp_mmhg || "—"}/{vitals.diastolic_bp_mmhg || "—"} mmHg</strong></div>
                    <div>HR: <strong>{vitals.heart_rate_bpm || "—"} bpm</strong></div>
                    <div>Temp: <strong>{vitals.temperature_celsius || "—"} °C</strong></div>
                    <div>SpO₂: <strong>{vitals.spo2_percent || "—"} %</strong></div>
                    <div>Weight: <strong>{vitals.weight_kg || "—"} kg</strong></div>
                    <div>BMI: <strong>{vitals.bmi || "—"} kg/m²</strong></div>
                  </div>
                </div>

                {/* Diagnoses */}
                <div className="space-y-1 pt-2">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Diagnoses ({diagnoses.length})</p>
                  {diagnoses.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {diagnoses.map((d, i) => (
                        <Badge key={i} variant="teal" className="text-xs font-bold">
                          {d.name} {d.icd10_code ? `(${d.icd10_code})` : ""}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-amber-800 italic font-semibold">⚠️ No diagnoses formally entered yet.</p>
                  )}
                </div>

                {/* Prescriptions */}
                <div className="space-y-1 pt-2">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Prescription Orders ({prescriptionItems.length})</p>
                  {prescriptionItems.length > 0 ? (
                    <div className="space-y-1">
                      {prescriptionItems.map((p, i) => (
                        <p key={i} className="text-slate-700 text-[11px]">
                          • <strong>{p.medicine_name}</strong>: {p.dosage}, {p.frequency}, {p.timing} ({p.duration})
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No prescriptions issued for this visit.</p>
                  )}
                </div>

                {/* Follow-up */}
                <div className="space-y-1 pt-2">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Treatment Plan & Follow-Up</p>
                  <p className="text-slate-700">{treatmentPlan || "Supportive care and monitoring."}</p>
                  <p className="text-teal-800 font-semibold">
                    Follow-Up: {followUpPlan.follow_up_timeframe || "SOS / As needed"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setShowSummaryModal(false)}
                  className="text-xs font-semibold rounded-xl"
                  disabled={isCompleting}
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={handleSaveDraft}
                  variant="secondary"
                  className="text-xs font-semibold rounded-xl"
                  disabled={isCompleting}
                >
                  <Save className="h-3.5 w-3.5 mr-1" /> Save Draft
                </Button>
                <Button
                  onClick={handleCompleteConsultation}
                  className="text-xs font-bold rounded-xl bg-teal-700 hover:bg-teal-800 text-white shadow-xs"
                  disabled={isCompleting}
                >
                  {isCompleting ? "Finalizing..." : "Confirm & Finalize Consultation"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 2: HISTORICAL ENCOUNTER PREVIEW */}
        {/* ============================================================ */}
        {previewHistoryEncounter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
            <Card className="max-w-xl w-full p-6 space-y-4 bg-white rounded-3xl shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Historical Encounter Details</h3>
                    <p className="text-xs text-slate-500">{previewHistoryEncounter.id} • {new Date(previewHistoryEncounter.started_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewHistoryEncounter(null)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <p><strong>Attending Clinician:</strong> {previewHistoryEncounter.provider_name} ({previewHistoryEncounter.provider_role})</p>
                <p><strong>Facility & Department:</strong> {previewHistoryEncounter.organization_name} • {previewHistoryEncounter.department_name}</p>
                <p><strong>Reason for Visit:</strong> {previewHistoryEncounter.reason_for_visit}</p>
                <p><strong>Status:</strong> <StatusBadge status={previewHistoryEncounter.status} /></p>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <Button
                  onClick={() => setPreviewHistoryEncounter(null)}
                  size="sm"
                  className="text-xs rounded-xl"
                >
                  Close Preview
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 3: BREAK-GLASS EMERGENCY OVERRIDE */}
        {/* ============================================================ */}
        {showBreakGlassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
            <div className="max-w-md w-full p-6 space-y-4 bg-white rounded-3xl shadow-2xl border border-amber-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
                    <AlertOctagon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Break-Glass Emergency Access</h2>
                    <p className="text-xs text-slate-500">Immediate access to critical records with mandatory audit</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBreakGlassModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                  <strong>⚠️ Legal & Audit Notice:</strong> Break-glass access unlocks the patient's longitudinal diagnostic history without explicit consultation consent. This action is permanently cryptographically stamped in the institutional audit ledger.
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-slate-700">Mandatory Clinical Justification *</Label>
                  <Textarea
                    rows={3}
                    placeholder="e.g. Critical hemodynamic instability, unresponsive patient in trauma bay requiring immediate allergy and history review..."
                    value={breakGlassReason}
                    onChange={(e) => setBreakGlassReason(e.target.value)}
                    className="text-xs mt-1 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBreakGlassModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExecuteBreakGlass}
                    disabled={!breakGlassReason.trim() || isSubmittingBreakGlass}
                    size="sm"
                    className="text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  >
                    {isSubmittingBreakGlass ? "Verifying..." : "Confirm & Unlock Records"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 4: AMENDMENT MODAL */}
        {/* ============================================================ */}
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

      </div>
    </RoleGuard>
  );
}
