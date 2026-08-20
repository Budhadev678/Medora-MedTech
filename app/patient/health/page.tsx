"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  HeartPulse, 
  FileText, 
  FlaskConical, 
  Pill, 
  Clock, 
  FolderOpen,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Share2,
  Stethoscope,
  Building2,
  Calendar,
  Store,
  QrCode,
  Search,
  Filter,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  getPatientHealthJourney, 
  groupTimelineEventsByDate, 
  getHealthJourneySummary, 
  HealthJourneySummary, 
  HealthJourneyDateGroup 
} from "@/lib/services/health-journey-service";
import { 
  getMedicalDocumentById, 
  generateSecureDocumentAccessToken, 
  HealthcareMedicalDocument 
} from "@/lib/data/medical-document-store";
import { TimelineEvent } from "@/types/database.types";

export default function PatientHealthPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "visits" | "records" | "prescriptions" | "lab_orders" | "documents">("all");
  const [dateRange, setDateRange] = useState<"all" | "30_days" | "7_days">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [summary, setSummary] = useState<HealthJourneySummary | null>(null);
  
  // Secure Document Viewer State
  const [viewingDoc, setViewingDoc] = useState<HealthcareMedicalDocument | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const refreshJourney = () => {
    if (!user) return;
    const pId = user.identifier || user.id;
    const data = getPatientHealthJourney(pId, {
      category: selectedCategory,
      dateRange,
      searchQuery,
    });
    setEvents(data);
    setSummary(getHealthJourneySummary(pId));
  };

  useEffect(() => {
    refreshJourney();
    const handleUpdate = () => refreshJourney();
    window.addEventListener("medora-encounters-updated", handleUpdate);
    window.addEventListener("medora-clinical-records-updated", handleUpdate);
    window.addEventListener("medora-prescriptions-updated", handleUpdate);
    window.addEventListener("medora-lab-orders-updated", handleUpdate);
    window.addEventListener("medora-documents-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-encounters-updated", handleUpdate);
      window.removeEventListener("medora-clinical-records-updated", handleUpdate);
      window.removeEventListener("medora-prescriptions-updated", handleUpdate);
      window.removeEventListener("medora-lab-orders-updated", handleUpdate);
      window.removeEventListener("medora-documents-updated", handleUpdate);
    };
  }, [user, selectedCategory, dateRange, searchQuery]);

  const dateGroups: HealthJourneyDateGroup[] = groupTimelineEventsByDate(events);

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

  const getEventBadge = (type: TimelineEvent["event_type"]) => {
    switch (type) {
      case "ENCOUNTER":
        return <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-[10px] font-bold">Visit</Badge>;
      case "CLINICAL_RECORD":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">Clinical Note</Badge>;
      case "PRESCRIPTION":
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-bold">Prescription</Badge>;
      case "LAB_ORDER":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">Lab Order</Badge>;
      case "MEDICAL_DOCUMENT":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[10px] font-bold">Document</Badge>;
    }
  };

  const getEventIcon = (type: TimelineEvent["event_type"]) => {
    switch (type) {
      case "ENCOUNTER":
        return <Stethoscope className="h-4 w-4 text-teal-600" />;
      case "CLINICAL_RECORD":
        return <FileText className="h-4 w-4 text-emerald-600" />;
      case "PRESCRIPTION":
        return <Pill className="h-4 w-4 text-amber-600" />;
      case "LAB_ORDER":
        return <FlaskConical className="h-4 w-4 text-blue-600" />;
      case "MEDICAL_DOCUMENT":
        return <FolderOpen className="h-4 w-4 text-indigo-600" />;
    }
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-200">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Unified Care Record</span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-teal-600" />
              My Health Journey
            </h1>
          </div>
          <Link href="/patient/documents">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 text-teal-800 border-teal-200 hover:bg-teal-50">
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Document Vault</span>
            </Button>
          </Link>
        </div>

        {/* Summary Metric Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Doctor Visits</span>
              <span className="text-lg font-extrabold text-teal-900">{summary.totalEncounters}</span>
              <span className="text-[10px] text-slate-500 block">{summary.activeEncounters} Active</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Prescriptions</span>
              <span className="text-lg font-extrabold text-amber-900">{summary.activePrescriptions}</span>
              <span className="text-[10px] text-slate-500 block">Active Regimen</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lab Orders</span>
              <span className="text-lg font-extrabold text-blue-900">{summary.pendingLabOrders}</span>
              <span className="text-[10px] text-slate-500 block">Ordered Tests</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Documents</span>
              <span className="text-lg font-extrabold text-indigo-900">{summary.totalMedicalDocuments}</span>
              <span className="text-[10px] text-slate-500 block">{summary.verifiedDocuments} Verified</span>
            </div>
          </div>
        )}

        {/* Search & Date Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search health journey (doctor, hospital, medicine, lab test, diagnosis)..."
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
            <button
              onClick={() => setDateRange("7_days")}
              className={`px-2.5 py-1 rounded-lg transition-all ${dateRange === "7_days" ? "bg-white text-teal-900 font-bold shadow-2xs" : "hover:text-slate-900"}`}
            >
              7 Days
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          {[
            { key: "all", label: `All Activity (${events.length})` },
            { key: "visits", label: "Visits" },
            { key: "records", label: "Clinical Notes" },
            { key: "prescriptions", label: "Prescriptions" },
            { key: "lab_orders", label: "Lab Orders" },
            { key: "documents", label: "Documents" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as any)}
              className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                selectedCategory === cat.key
                  ? "bg-teal-700 text-white font-bold shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {downloadSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Chronological Date-Grouped Stream */}
        {dateGroups.length > 0 ? (
          <div className="space-y-6">
            {dateGroups.map((group) => (
              <div key={group.dateKey} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {group.dateLabel}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="space-y-2.5">
                  {group.events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                            {getEventIcon(event.event_type)}
                          </div>
                          <div>
                            <span className="font-mono text-[11px] font-bold text-slate-800">
                              {event.reference_id}
                            </span>
                          </div>
                          {getEventBadge(event.event_type)}
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${
                              event.status === "COMPLETED" || event.status === "ISSUED" || event.status === "ORDERED" || event.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-slate-50 text-slate-600"
                            }`}
                          >
                            {event.status}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" />
                          {new Date(event.occurred_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Event Title & Summary */}
                      <div className="text-xs space-y-1">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {event.title}
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          {event.summary}
                        </p>
                      </div>

                      {/* Provider & Facility Lineage */}
                      <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          {event.professional_name && (
                            <span className="font-medium text-slate-700">
                              {event.professional_name}
                            </span>
                          )}
                          {event.organization_name && (
                            <span>• {event.organization_name}</span>
                          )}
                        </div>

                        {/* Direct Deep-link Action */}
                        <div className="pt-1 sm:pt-0">
                          {event.event_type === "MEDICAL_DOCUMENT" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDoc(event.reference_id)}
                              className="text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50 gap-1 font-semibold"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View Document</span>
                            </Button>
                          ) : (
                            <Link href={event.deep_link}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1 font-semibold"
                              >
                                <span>Open Record</span>
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<HeartPulse className="h-6 w-6 text-teal-600" />}
            title="No Healthcare Activity in Selection"
            description="Adjust your search query or filter to view longitudinal medical records across consultations, prescriptions, lab tests, and documents."
            phase="Phase 4.4 — Unified Patient Health Journey"
            actionHref="/patient"
            actionLabel="Return to Patient Home"
          />
        )}

        {/* Secure Document Viewer Modal */}
        {viewingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
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
                  <span className="font-bold text-slate-700">Source Provenance:</span>
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
                {viewingDoc.source_professional_name && (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Author / Clinician:</span>
                    <span className="text-slate-900">{viewingDoc.source_professional_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">File Size:</span>
                  <span className="text-slate-900">{(viewingDoc.file_size_bytes / 1024).toFixed(1)} KB ({viewingDoc.mime_type})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Version:</span>
                  <span className="text-slate-900">v{viewingDoc.version}</span>
                </div>
              </div>

              {/* In-app Document Preview Pane */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 flex flex-col items-center justify-center space-y-2 min-h-[160px]">
                <FileText className="h-10 w-10 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">Secure Document Preview</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  SHA-256: {viewingDoc.file_hash_sha256?.substring(0, 32)}...
                </span>
                <span className="text-[10px] text-slate-400">
                  Private storage reference: {viewingDoc.storage_reference}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setViewingDoc(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadDoc(viewingDoc)}
                  className="text-xs bg-indigo-700 hover:bg-indigo-800 text-white gap-1.5"
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
