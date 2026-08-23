"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  HeartPulse, 
  FileText, 
  FlaskConical, 
  Pill, 
  Clock, 
  FolderOpen, 
  ChevronRight, 
  ShieldCheck, 
  Share2, 
  Stethoscope, 
  Calendar, 
  Store, 
  QrCode, 
  Search, 
  Eye, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Upload,
  History,
  Activity,
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ClinicalContinuityService,
  HealthJourneyDateGroup,
} from "@/lib/services/clinical-continuity-service";
import { 
  HealthcarePrescription, 
  getPatientPrescriptions 
} from "@/lib/data/prescription-store";
import { 
  getPatientLabReports 
} from "@/lib/data/lab-order-store";
import { LabReportService } from "@/lib/services/lab-report-service";
import { 
  HealthcareMedicalDocument, 
  MedicalDocumentType,
  getPatientMedicalDocuments, 
  createMedicalDocument, 
  getMedicalDocumentById, 
  generateSecureDocumentAccessToken 
} from "@/lib/data/medical-document-store";
import { 
  TimelineEvent, 
  TimelineFilterOptions, 
  EncounterClinicalBundle,
  PatientStructuredHealthSummary,
  HealthcareLabReport
} from "@/types/database.types";

export type HealthTab = "overview" | "visits" | "prescriptions" | "lab_reports" | "documents" | "timeline";

export default function PatientHealthHubPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as HealthTab;
  const [activeTab, setActiveTab] = useState<HealthTab>(() => {
    if (tabParam && ["overview", "visits", "prescriptions", "lab_reports", "documents", "timeline"].includes(tabParam)) {
      return tabParam;
    }
    return "overview";
  });

  useEffect(() => {
    if (tabParam && ["overview", "visits", "prescriptions", "lab_reports", "documents", "timeline"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: HealthTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    if (newTab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    const queryString = params.toString();
    router.replace(queryString ? `/patient/health?${queryString}` : "/patient/health");
  };

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [bundles, setBundles] = useState<EncounterClinicalBundle[]>([]);
  const [prescriptions, setPrescriptions] = useState<HealthcarePrescription[]>([]);
  const [reports, setReports] = useState<HealthcareLabReport[]>([]);
  const [documents, setDocuments] = useState<HealthcareMedicalDocument[]>([]);
  const [summary, setSummary] = useState<PatientStructuredHealthSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TimelineFilterOptions["category"]>("all");
  const [dateRange, setDateRange] = useState<TimelineFilterOptions["dateRange"]>("all");

  const [rxTab, setRxTab] = useState<"active" | "past">("active");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [viewingDoc, setViewingDoc] = useState<HealthcareMedicalDocument | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<MedicalDocumentType>("DIAGNOSTIC_REPORT");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<HealthcareLabReport | null>(null);
  const [recipientName, setRecipientName] = useState("Dr. Ananya Sharma");
  const [recipientId, setRecipientId] = useState("DOC-1001");
  const [sharePermission, setSharePermission] = useState<"VIEW" | "DOWNLOAD">("VIEW");
  const [shareDurationHours, setShareDurationHours] = useState(24);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  const refreshAllHealthData = () => {
    if (!user) return;
    const pId = user.identifier || user.id || "PAT-1001";
    const actor = {
      id: user.id,
      identifier: user.identifier || user.id,
      name: user.fullName || user.email || "Patient",
      role: (user.role || "patient") as any,
    };

    const timelineData = ClinicalContinuityService.getPatientTimeline(pId, actor as any, {
      category: categoryFilter,
      dateRange,
      searchQuery,
    });
    setEvents(timelineData);

    const bundleData = ClinicalContinuityService.getPatientEncounterBundles(pId, actor as any, {
      category: categoryFilter,
      dateRange,
      searchQuery,
    });
    setBundles(bundleData);

    setSummary(ClinicalContinuityService.getPatientStructuredHealthSummary(pId, actor as any));
    setPrescriptions(getPatientPrescriptions(pId, false));
    setReports(getPatientLabReports(pId, false));
    setDocuments(getPatientMedicalDocuments(pId, true));
  };

  useEffect(() => {
    refreshAllHealthData();
    const handleUpdate = () => refreshAllHealthData();
    window.addEventListener("medora-encounters-updated", handleUpdate);
    window.addEventListener("medora-clinical-records-updated", handleUpdate);
    window.addEventListener("medora-prescriptions-updated", handleUpdate);
    window.addEventListener("medora-lab-orders-updated", handleUpdate);
    window.addEventListener("medora-documents-updated", handleUpdate);
    window.addEventListener("medora-medical-orders-updated", handleUpdate);

    return () => {
      window.removeEventListener("medora-encounters-updated", handleUpdate);
      window.removeEventListener("medora-clinical-records-updated", handleUpdate);
      window.removeEventListener("medora-prescriptions-updated", handleUpdate);
      window.removeEventListener("medora-lab-orders-updated", handleUpdate);
      window.removeEventListener("medora-documents-updated", handleUpdate);
      window.removeEventListener("medora-medical-orders-updated", handleUpdate);
    };
  }, [user, categoryFilter, dateRange, searchQuery]);

  const pastEvents = events.filter((e) => e.section !== "UPCOMING" && e.section !== "TODAY");
  const pastDateGroups: HealthJourneyDateGroup[] = ClinicalContinuityService.groupTimelineEventsByDate(pastEvents);

  const activePrescriptions = prescriptions.filter(p => p.status === "ISSUED" || p.status === "FINALIZED");
  const pastPrescriptions = prescriptions.filter(p => p.status === "COMPLETED" || p.status === "CANCELLED" || p.status === "EXPIRED" || p.status === "VOIDED" || p.status === "SUPERSEDED");
  const displayedPrescriptions = rxTab === "active" ? activePrescriptions : pastPrescriptions;

  const filteredDocuments = documents.filter((doc) => {
    if (docTypeFilter !== "all") {
      if (docTypeFilter === "patient_uploaded") {
        if (doc.source_type !== "PATIENT_UPLOADED") return false;
      } else if (doc.document_type !== docTypeFilter) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchRef = doc.document_reference.toLowerCase().includes(q);
      const matchOrg = doc.source_organization_name?.toLowerCase().includes(q);
      const matchDoc = doc.source_professional_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchRef && !matchOrg && !matchDoc) return false;
    }
    return true;
  });

  const handleOpenDoc = (docId: string) => {
    const doc = getMedicalDocumentById(docId);
    if (doc) {
      if (user) {
        generateSecureDocumentAccessToken(docId, "VIEW", user.identifier || user.id, user.fullName || user.email || "Patient", "patient");
      }
      setViewingDoc(doc);
    }
  };

  const handleDownloadDoc = (doc: HealthcareMedicalDocument) => {
    if (!user) return;
    const res = generateSecureDocumentAccessToken(doc.id, "DOWNLOAD", user.identifier || user.id, user.fullName || user.email || "Patient", "patient");
    if (res.success) {
      setDownloadSuccessMessage(`Secure download initiated (Signed Token: ${res.token?.substring(0, 24)}...)`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    }
  };

  const handlePatientUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploadError(null);

    if (!uploadTitle.trim()) {
      setUploadError("Document title is required.");
      return;
    }

    const res = createMedicalDocument({
      patientId: user.identifier || user.id || "PAT-1001",
      patientName: user.fullName || user.email || "Patient",
      documentType: uploadType,
      title: uploadTitle.trim(),
      description: uploadDesc.trim(),
      sourceType: "PATIENT_UPLOADED",
      mimeType: "application/pdf",
      fileSizeBytes: 420000,
      actorId: user.identifier || user.id || "PAT-1001",
      actorName: user.fullName || user.email || "Patient",
      actorRole: "patient",
    });

    if (!res.success) {
      setUploadError(res.error || "Failed to upload document.");
      return;
    }

    setUploadSuccess("Medical document saved successfully to your private documents.");
    setTimeout(() => {
      setUploadSuccess(null);
      setIsUploadOpen(false);
      setUploadTitle("");
      setUploadDesc("");
      refreshAllHealthData();
    }, 1200);
  };

  const handleCreateShare = async () => {
    if (!selectedReport) return;
    setShareSuccess(null);
    const res = await LabReportService.shareReport(
      selectedReport.id,
      recipientId,
      recipientName,
      sharePermission,
      shareDurationHours,
      user as any
    );

    if (res.success) {
      setShareSuccess(`Shared report ${selectedReport.id} with ${recipientName} for ${shareDurationHours} hours.`);
      setShowShareModal(false);
      refreshAllHealthData();
    }
  };

  const getEventBadge = (type: TimelineEvent["event_type"]) => {
    switch (type) {
      case "APPOINTMENT":
        return <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 text-[10px] font-bold">Appointment</Badge>;
      case "ENCOUNTER":
        return <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-[10px] font-bold">Visit</Badge>;
      case "CLINICAL_RECORD":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">Clinical Note</Badge>;
      case "PRESCRIPTION":
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-bold">Prescription</Badge>;
      case "LAB_ORDER":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">Lab Order</Badge>;
      case "LAB_REPORT":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[10px] font-bold">Lab Report</Badge>;
      case "MEDICAL_DOCUMENT":
        return <Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-200 text-[10px] font-bold">Document</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-bold">Care Event</Badge>;
    }
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150 font-sans pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Unified Patient Health Records</span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-teal-600" />
              My Health
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Your comprehensive visits, prescriptions, lab reports, documents, and medical timeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs gap-1.5 h-9 font-bold rounded-xl"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Document</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl overflow-x-auto no-scrollbar text-xs font-bold text-slate-600 border border-slate-200/80 shadow-2xs">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "visits", label: `Visits (${bundles.length})`, icon: Stethoscope },
            { id: "prescriptions", label: `Prescriptions (${prescriptions.length})`, icon: Pill },
            { id: "lab_reports", label: `Lab Reports (${reports.length})`, icon: FlaskConical },
            { id: "documents", label: `Documents (${documents.length})`, icon: FolderOpen },
            { id: "timeline", label: "Timeline", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as HealthTab)}
                className={`py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? "bg-white text-teal-900 shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-teal-700 stroke-[2.5]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {downloadSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {shareSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{shareSuccess}</span>
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-5">
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div onClick={() => handleTabChange("prescriptions")} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 cursor-pointer hover:border-amber-300 transition-all group">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block group-hover:text-amber-700">Active Regimen</span>
                  <span className="text-xl font-extrabold text-amber-900">{summary.active_prescriptions.length}</span>
                </div>
                <div onClick={() => router.push("/patient/profile")} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 cursor-pointer hover:border-rose-300 transition-all group">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block group-hover:text-rose-700">Allergies</span>
                  <span className="text-sm font-bold text-rose-900 truncate block">{summary.allergies.length > 0 ? summary.allergies.join(", ") : "Not recorded"}</span>
                </div>
                <div onClick={() => handleTabChange("lab_reports")} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 cursor-pointer hover:border-indigo-300 transition-all group">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block group-hover:text-indigo-700">Recent Reports</span>
                  <span className="text-xl font-extrabold text-indigo-900">{summary.recent_released_reports.length}</span>
                </div>
                <div onClick={() => router.push("/patient/appointments")} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 cursor-pointer hover:border-sky-300 transition-all group">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block group-hover:text-sky-700">Upcoming Care</span>
                  <span className="text-xl font-extrabold text-sky-900">{summary.upcoming_appointments.length + summary.upcoming_follow_ups.length}</span>
                </div>
              </div>
            )}
            <div className="space-y-2.5 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Healthcare Activity</h2>
              {pastEvents.length > 0 ? (
                <div className="space-y-2">
                  {pastEvents.slice(0, 4).map((ev) => (
                    <div key={ev.id} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-500">{ev.reference_id}</span>
                          {getEventBadge(ev.event_type)}
                        </div>
                        <h4 className="font-bold text-slate-900">{ev.title}</h4>
                      </div>
                      <Link href={ev.deep_link}>
                        <Button size="sm" variant="outline" className="text-xs h-7 rounded-xl shrink-0 text-teal-800 border-teal-200">Open</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="bg-white border-dashed border-slate-200 text-center p-6 rounded-2xl"><span className="text-xs text-slate-500">No medical history recorded yet.</span></Card>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: VISITS & CONSULTATIONS                                */}
        {/* ============================================================ */}
        {activeTab === "visits" && (
          <div className="space-y-4">
            {bundles.length > 0 ? (
              bundles.map((bundle) => (
                <div
                  key={bundle.encounter.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                          {bundle.encounter.id}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold bg-teal-50 text-teal-800 border-teal-200">
                          {bundle.encounter.encounter_type?.replace(/_/g, " ") || "Consultation"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            bundle.status === "COMPLETED" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {bundle.status}
                        </Badge>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {bundle.department_name || "Consultation"} with {bundle.doctor_name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {bundle.facility_name || bundle.organization_name} • {new Date(bundle.occurred_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <Link href={`/doctor/consultations/${bundle.encounter.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8 text-teal-800 border-teal-200 hover:bg-teal-50 gap-1 font-semibold rounded-xl">
                        <span>View Consultation</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  {/* Clinical Assessment */}
                  {bundle.clinical_record && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <span className="font-bold text-slate-900">Clinical Assessment & Diagnosis</span>
                      </div>
                      <p className="text-slate-700">
                        <span className="font-semibold">Diagnoses: </span>
                        {bundle.clinical_record.diagnoses && bundle.clinical_record.diagnoses.length > 0
                          ? bundle.clinical_record.diagnoses.map((d) => `${d.name} (${d.icd10_code || "Clinician Authored"})`).join(", ")
                          : "General evaluation completed."}
                      </p>
                      {bundle.clinical_record.assessment && (
                        <p className="text-slate-600 italic">
                          "{bundle.clinical_record.assessment}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Linked Prescriptions */}
                  {bundle.prescriptions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                        <Pill className="h-3.5 w-3.5" />
                        Prescribed Regimen ({bundle.prescriptions.length})
                      </span>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {bundle.prescriptions.map((rx) => (
                          <div key={rx.id} className="p-3 rounded-xl bg-amber-50/40 border border-amber-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold text-amber-900">{rx.id}</span>
                              <Badge variant="outline" className="text-[9px] bg-white font-bold">{rx.status}</Badge>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {rx.items.map((i) => `${i.medicine_name} ${i.strength || ""}`).join(", ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Lab Orders & Reports */}
                  {(bundle.lab_orders.length > 0 || bundle.lab_reports.length > 0) && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                        <FlaskConical className="h-3.5 w-3.5" />
                        Lab Orders & Certified Reports
                      </span>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {bundle.lab_orders.map((lo) => (
                          <div key={lo.id} className="p-3 rounded-xl bg-blue-50/40 border border-blue-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold text-blue-900">{lo.order_reference || lo.id}</span>
                              <Badge variant="outline" className="text-[9px] bg-white font-bold">{lo.status}</Badge>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {lo.items.map((i) => i.test_name).join(", ")}
                            </p>
                          </div>
                        ))}
                        {bundle.lab_reports.map((lr) => (
                          <div key={lr.id} className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold text-indigo-900">{lr.report_reference || lr.id}</span>
                              <Badge variant="outline" className="text-[9px] bg-indigo-100 text-indigo-800 font-bold border-indigo-200">Released</Badge>
                            </div>
                            <p className="font-semibold text-slate-900">
                              Certified: {Array.from(new Set(lr.results.map((r) => r.test_name))).join(", ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <EmptyState
                icon={<Stethoscope className="h-6 w-6 text-teal-600" />}
                title="No Completed Visits Yet"
                description="Your past outpatient consultations and clinical visit records will appear here automatically."
                actionHref="/patient/appointments/book"
                actionLabel="Book Doctor Consultation"
              />
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PRESCRIPTIONS                                         */}
        {/* ============================================================ */}
        {activeTab === "prescriptions" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 shadow-2xs space-y-1">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                <Store className="h-4 w-4 text-teal-700" />
                <span>Open Pharmacy Choice Guaranteed</span>
              </div>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                You may fulfill your digital prescription at any registered hospital pharmacy, local chemist, or licensed online pharmacy of your choice.
              </p>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setRxTab("active")}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  rxTab === "active" ? "bg-white text-teal-800 font-bold shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Active Regimen ({activePrescriptions.length})
              </button>
              <button
                type="button"
                onClick={() => setRxTab("past")}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  rxTab === "past" ? "bg-white text-teal-800 font-bold shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Past Prescriptions ({pastPrescriptions.length})
              </button>
            </div>

            {displayedPrescriptions.length > 0 ? (
              <div className="space-y-3.5">
                {displayedPrescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          {rx.prescription_reference}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            rx.status === "ISSUED" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-slate-50 text-slate-700"
                          }`}
                        >
                          {rx.status}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(rx.issued_at || rx.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="text-xs space-y-0.5">
                      <span className="font-bold text-slate-900 block text-sm">
                        {rx.prescriber_name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {rx.facility_name || rx.organization_name}
                      </span>
                    </div>

                    {/* Prescribed Medicines */}
                    <div className="space-y-2 pt-1">
                      <div className="space-y-2">
                        {rx.items.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                {item.medicine_name} {item.strength && `(${item.strength})`}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {item.route}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                              <span><strong>Dosage:</strong> {item.dosage}</span>
                              <span><strong>Frequency:</strong> {item.frequency}</span>
                              <span><strong>Duration:</strong> {item.duration}</span>
                            </div>
                            {item.instructions && (
                              <p className="text-[11px] text-teal-800 font-medium pt-0.5">
                                <strong>Instructions:</strong> {item.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Digitally Certified by Doctor</span>
                      </div>
                      <Link href={`/verify/prescription/${rx.verification_token || rx.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-xs font-bold text-teal-700 border-teal-200 hover:bg-teal-50 h-7 gap-1 rounded-xl">
                          <QrCode className="h-3 w-3" />
                          <span>Verify Slip</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Pill className="h-6 w-6 text-amber-600" />}
                title={rxTab === "active" ? "No Active Prescriptions" : "No Past Prescriptions"}
                description="Medications prescribed by your doctors during consultations will automatically appear here."
                actionHref="/patient/appointments/book"
                actionLabel="Schedule Doctor Consultation"
              />
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: LAB REPORTS                                           */}
        {/* ============================================================ */}
        {activeTab === "lab_reports" && (
          <div className="space-y-4">
            {reports.length > 0 ? (
              <div className="space-y-3.5">
                {reports.map((rpt) => (
                  <div
                    key={rpt.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                          {rpt.id}
                        </span>
                        <Badge className="bg-emerald-600 text-white text-[9px] font-bold">
                          {rpt.status.toUpperCase()} V{rpt.version}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {rpt.released_at ? new Date(rpt.released_at).toLocaleDateString() : "N/A"}
                      </span>
                    </div>

                    <div className="text-xs space-y-0.5">
                      <h4 className="font-bold text-slate-900 text-sm">{rpt.laboratory_name}</h4>
                      <p className="text-[11px] text-slate-500">Ordering Doctor: {rpt.ordering_provider_name}</p>
                    </div>

                    {/* Results table */}
                    <div className="rounded-xl border border-slate-100 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-2">Test Name</th>
                            <th className="p-2">Result</th>
                            <th className="p-2">Reference Range</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rpt.results.map((res, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-2 font-medium text-slate-900">{res.test_name}</td>
                              <td className="p-2 font-mono font-bold text-slate-800">{res.value} {res.unit}</td>
                              <td className="p-2 text-slate-500 text-[11px]">{res.reference_range || "Standard"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Verified by {rpt.verified_by_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedReport(rpt);
                            setShowShareModal(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 text-indigo-700 border-indigo-300 font-bold rounded-xl"
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1 text-indigo-600" /> Share
                        </Button>
                        <Link href={`/reports/${rpt.id}`}>
                          <Button size="sm" className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs h-7">
                            <Eye className="h-3.5 w-3.5 mr-1" /> View Official Report
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FlaskConical className="h-6 w-6 text-indigo-600" />}
                title="No Lab Reports Available"
                description="Verified diagnostic reports released by accredited laboratories will appear here."
                actionHref="/patient/appointments/book"
                actionLabel="Book Care Appointment"
              />
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: DOCUMENTS VAULT                                       */}
        {/* ============================================================ */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              {[
                { key: "all", label: `All Documents (${documents.length})` },
                { key: "LAB_REPORT", label: "Lab Reports" },
                { key: "CONSULTATION_NOTE", label: "Consultation Slips" },
                { key: "DIAGNOSTIC_REPORT", label: "Diagnostic Scans" },
                { key: "patient_uploaded", label: "Patient Uploads" },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setDocTypeFilter(cat.key)}
                  className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    docTypeFilter === cat.key
                      ? "bg-teal-700 text-white font-bold shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {filteredDocuments.length > 0 ? (
              <div className="space-y-3">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          {doc.document_reference}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            doc.source_type === "PROVIDER_GENERATED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {doc.source_type === "PROVIDER_GENERATED" ? "Provider Verified" : "Patient Uploaded"}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(doc.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                      {doc.description && <p className="text-slate-600 text-[11px]">{doc.description}</p>}
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                      <span><strong>Source:</strong> {doc.source_type === "PROVIDER_GENERATED" ? (doc.source_organization_name || "Accredited Provider") : "Patient Upload"}</span>
                      <span>{(doc.file_size_bytes / 1024).toFixed(0)} KB</span>
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDoc(doc.id)}
                        className="text-xs h-7 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1 font-semibold rounded-xl"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View Document</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDoc(doc)}
                        className="text-xs h-7 text-slate-700 border-slate-200 hover:bg-slate-50 gap-1 font-semibold rounded-xl"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FolderOpen className="h-6 w-6 text-teal-600" />}
                title="No Documents Available"
                description="Upload medical reports or consult connected facilities to populate your digital health documents."
                actionHref="/patient"
                actionLabel="Return to Patient Home"
              />
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: HEALTH TIMELINE                                       */}
        {/* ============================================================ */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search timeline records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs h-9 bg-white"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setDateRange("all")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${dateRange === "all" ? "bg-white text-teal-900 font-bold shadow-2xs" : "hover:text-slate-900"}`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setDateRange("30_days")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${dateRange === "30_days" ? "bg-white text-teal-900 font-bold shadow-2xs" : "hover:text-slate-900"}`}
                >
                  30 Days
                </button>
              </div>
            </div>

            {pastDateGroups.length > 0 ? (
              pastDateGroups.map((group) => (
                <div key={group.dateKey} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100/80 px-2.5 py-0.5 rounded-md">
                      {group.dateLabel}
                    </span>
                    <div className="h-px flex-1 bg-slate-200/60" />
                  </div>

                  <div className="space-y-2.5">
                    {group.events.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-800">
                              {event.reference_id}
                            </span>
                            {getEventBadge(event.event_type)}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(event.occurred_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="text-xs space-y-0.5">
                          <h4 className="font-bold text-slate-900 text-sm">{event.title}</h4>
                          <p className="text-slate-600 text-[11px]">{event.summary}</p>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-50">
                          <span>{event.professional_name || event.organization_name}</span>
                          <Link href={event.deep_link}>
                            <Button variant="outline" size="sm" className="text-xs h-7 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1 font-semibold rounded-xl">
                              <span>Open Record</span>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<History className="h-6 w-6 text-teal-600" />}
                title="No Timeline Activity"
                description="Your healthcare journey will automatically be aggregated here chronologically."
                actionHref="/patient"
                actionLabel="Return to Patient Home"
              />
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: UPLOAD DOCUMENT                                       */}
        {/* ============================================================ */}
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Upload Health Document</h3>
                    <p className="text-[11px] text-slate-500">Save historical records to your private health profile</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePatientUpload} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Document Title *</label>
                  <Input
                    type="text"
                    placeholder="e.g. Previous Chest X-Ray or Blood Panel Report"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Document Category *</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 font-medium"
                  >
                    <option value="DIAGNOSTIC_REPORT">Diagnostic Report (Scan, X-Ray)</option>
                    <option value="LAB_REPORT">Lab Blood / Urine Report</option>
                    <option value="CONSULTATION_NOTE">External Doctor Slip</option>
                    <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                    <option value="OTHER">Other Health Document</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Description / Notes</label>
                  <textarea
                    placeholder="Optional notes or clinic details..."
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUploadOpen(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl"
                  >
                    Save Document
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: SHARE LAB REPORT                                      */}
        {/* ============================================================ */}
        {showShareModal && selectedReport && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-indigo-700">
                <Share2 className="h-5 w-5 text-indigo-600" /> Share Lab Report {selectedReport.id}
              </h3>
              <p className="text-xs text-slate-600">Grant secure time-bound access to a consulting doctor.</p>
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Recipient Doctor *</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Access Duration *</label>
                  <select
                    value={shareDurationHours}
                    onChange={(e) => setShareDurationHours(parseInt(e.target.value))}
                    className="w-full text-xs h-9 rounded-xl border border-input px-2 mt-1 bg-white font-semibold"
                  >
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={72}>72 Hours (3 Days)</option>
                    <option value={168}>7 Days</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => setShowShareModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateShare} className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl">
                  Grant Access
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: SECURE DOCUMENT VIEWER                                */}
        {/* ============================================================ */}
        {viewingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      {viewingDoc.document_reference}
                    </span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {viewingDoc.title}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Provenance Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Document Type:</span>
                  <Badge variant="outline" className="text-[10px] font-bold bg-white">
                    {viewingDoc.document_type.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Source:</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      viewingDoc.source_type === "PROVIDER_GENERATED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {viewingDoc.source_type === "PROVIDER_GENERATED" ? "Provider Verified" : "Patient Uploaded"}
                  </Badge>
                </div>
                {viewingDoc.source_organization_name && (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Organization:</span>
                    <span className="text-slate-900">{viewingDoc.source_organization_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">File Size:</span>
                  <span className="text-slate-900">{(viewingDoc.file_size_bytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              {/* In-app Document Preview Pane */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 flex flex-col items-center justify-center space-y-2 min-h-[160px]">
                <FileText className="h-10 w-10 text-teal-400" />
                <span className="text-xs font-bold text-slate-200">Secure Document Preview</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  SHA-256: {viewingDoc.file_hash_sha256?.substring(0, 32)}...
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingDoc(null)}
                  className="text-xs h-8 rounded-xl"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownloadDoc(viewingDoc)}
                  className="text-xs h-8 bg-teal-700 hover:bg-teal-800 text-white gap-1.5 rounded-xl font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Secure Copy</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

