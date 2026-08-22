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
  ExternalLink,
  Layers,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Compass,
  History,
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
  ClinicalContinuityService,
  HealthJourneyDateGroup,
} from "@/lib/services/clinical-continuity-service";
import { 
  getMedicalDocumentById, 
  generateSecureDocumentAccessToken, 
  HealthcareMedicalDocument 
} from "@/lib/data/medical-document-store";
import { 
  TimelineEvent, 
  TimelineFilterOptions, 
  EncounterClinicalBundle,
  PatientStructuredHealthSummary 
} from "@/types/database.types";

export default function PatientHealthPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<"stream" | "bundles">("stream");
  const [selectedCategory, setSelectedCategory] = useState<TimelineFilterOptions["category"]>("all");
  const [dateRange, setDateRange] = useState<TimelineFilterOptions["dateRange"]>("all");
  const [facilityFilter, setFacilityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [bundles, setBundles] = useState<EncounterClinicalBundle[]>([]);
  const [summary, setSummary] = useState<PatientStructuredHealthSummary | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<EncounterClinicalBundle | null>(null);
  
  // Secure Document Viewer State
  const [viewingDoc, setViewingDoc] = useState<HealthcareMedicalDocument | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const refreshJourney = () => {
    if (!user) return;
    const pId = user.identifier || user.id;
    const actor = {
      id: user.id,
      identifier: user.identifier || user.id,
      name: user.fullName || user.email || "Patient",
      role: (user.role || "patient") as any,
    };

    const data = ClinicalContinuityService.getPatientTimeline(pId, actor as any, {
      category: selectedCategory,
      dateRange,
      facilityId: facilityFilter !== "all" ? facilityFilter : undefined,
      searchQuery,
    });
    setEvents(data);

    const bundleData = ClinicalContinuityService.getPatientEncounterBundles(pId, actor as any, {
      category: selectedCategory,
      dateRange,
      facilityId: facilityFilter !== "all" ? facilityFilter : undefined,
      searchQuery,
    });
    setBundles(bundleData);

    setSummary(ClinicalContinuityService.getPatientStructuredHealthSummary(pId, actor as any));
  };

  useEffect(() => {
    refreshJourney();
    const handleUpdate = () => refreshJourney();
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
  }, [user, selectedCategory, dateRange, facilityFilter, searchQuery]);

  // Section splitting
  const upcomingEvents = events.filter((e) => e.section === "UPCOMING");
  const todayEvents = events.filter((e) => e.section === "TODAY");
  const pastEvents = events.filter((e) => e.section !== "UPCOMING" && e.section !== "TODAY");
  const pastDateGroups: HealthJourneyDateGroup[] = ClinicalContinuityService.groupTimelineEventsByDate(pastEvents);

  // Collect unique facilities for facility filter
  const facilities = Array.from(
    new Set(
      events
        .map((e) => e.facility_name || e.organization_name)
        .filter(Boolean) as string[]
    )
  );

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
      case "SAMPLE":
        return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-[10px] font-bold">Sample</Badge>;
      case "LAB_REPORT":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[10px] font-bold">Lab Report</Badge>;
      case "IMAGING_ORDER":
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-800 border-cyan-200 text-[10px] font-bold">Imaging</Badge>;
      case "REFERRAL":
        return <Badge variant="outline" className="bg-violet-50 text-violet-800 border-violet-200 text-[10px] font-bold">Referral</Badge>;
      case "FOLLOW_UP":
        return <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200 text-[10px] font-bold">Follow-Up</Badge>;
      case "MEDICAL_DOCUMENT":
        return <Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-200 text-[10px] font-bold">Document</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-bold">Care Event</Badge>;
    }
  };

  const getEventIcon = (type: TimelineEvent["event_type"]) => {
    switch (type) {
      case "APPOINTMENT":
        return <Calendar className="h-4 w-4 text-sky-600" />;
      case "ENCOUNTER":
        return <Stethoscope className="h-4 w-4 text-teal-600" />;
      case "CLINICAL_RECORD":
        return <FileText className="h-4 w-4 text-emerald-600" />;
      case "PRESCRIPTION":
        return <Pill className="h-4 w-4 text-amber-600" />;
      case "LAB_ORDER":
        return <FlaskConical className="h-4 w-4 text-blue-600" />;
      case "SAMPLE":
        return <Compass className="h-4 w-4 text-purple-600" />;
      case "LAB_REPORT":
        return <ShieldCheck className="h-4 w-4 text-indigo-600" />;
      case "IMAGING_ORDER":
        return <Sparkles className="h-4 w-4 text-cyan-600" />;
      case "REFERRAL":
        return <ArrowUpRight className="h-4 w-4 text-violet-600" />;
      case "FOLLOW_UP":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "MEDICAL_DOCUMENT":
        return <FolderOpen className="h-4 w-4 text-slate-600" />;
      default:
        return <HeartPulse className="h-4 w-4 text-teal-600" />;
    }
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-200">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Unified Patient Health Records</span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-teal-600" />
              My Health Hub
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveView("bundles")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === "bundles"
                    ? "bg-white text-teal-900 shadow-2xs font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                <span>Visits & Consultations ({bundles.length})</span>
              </button>
              <button
                onClick={() => setActiveView("stream")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeView === "stream"
                    ? "bg-white text-teal-900 shadow-2xs font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                <History className="h-3.5 w-3.5 text-teal-700" />
                <span>Health Timeline</span>
              </button>
            </div>
            <Link href="/patient/pharmacy">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl">
                <Pill className="h-3.5 w-3.5 text-amber-600" />
                <span>Prescriptions</span>
              </Button>
            </Link>
            <Link href="/patient/lab">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl">
                <FlaskConical className="h-3.5 w-3.5 text-blue-600" />
                <span>Lab Reports</span>
              </Button>
            </Link>
            <Link href="/patient/documents">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 text-teal-800 border-teal-200 hover:bg-teal-50 rounded-xl">
                <FolderOpen className="h-3.5 w-3.5 text-teal-700" />
                <span>Documents</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Structured Health Facts Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Regimen</span>
              <span className="text-lg font-extrabold text-amber-900">{summary.active_prescriptions.length}</span>
              <span className="text-[10px] text-slate-500 block">
                {summary.active_prescriptions.length > 0 ? "Prescriptions Active" : "None active"}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Known Allergies</span>
              <span className="text-sm font-bold text-rose-900 truncate block">
                {summary.allergies.length > 0 ? summary.allergies.join(", ") : "Not recorded"}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {summary.allergies.length > 0 ? `${summary.allergies.length} recorded` : "No allergies recorded"}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recent Reports</span>
              <span className="text-lg font-extrabold text-indigo-900">{summary.recent_released_reports.length}</span>
              <span className="text-[10px] text-slate-500 block">Certified Released</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Upcoming Care</span>
              <span className="text-lg font-extrabold text-sky-900">
                {summary.upcoming_appointments.length + summary.upcoming_follow_ups.length}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {summary.upcoming_appointments.length} Appointments / {summary.upcoming_follow_ups.length} Follow-ups
              </span>
            </div>
          </div>
        )}

        {/* Search, Facility & Date Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search timeline (doctor, hospital, medicine, lab test, diagnosis)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-white"
            />
          </div>

          {/* Facility Filter */}
          {facilities.length > 1 && (
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Facilities ({facilities.length})</option>
              {facilities.map((fac) => (
                <option key={fac} value={fac}>{fac}</option>
              ))}
            </select>
          )}

          {/* Date Range Filter */}
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

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          {[
            { key: "all", label: `All Activity (${events.length})` },
            { key: "visits", label: "Consultation Visits" },
            { key: "prescriptions", label: "Prescriptions" },
            { key: "lab_reports", label: "Certified Lab Reports" },
            { key: "lab_orders", label: "Lab Orders & Samples" },
            { key: "appointments", label: "Appointments" },
            { key: "referrals", label: "Referrals & Follow-ups" },
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

        {/* VIEW MODE 1: CHRONOLOGICAL STREAM */}
        {activeView === "stream" && (
          <div className="space-y-6">
            {/* SECTION 1: UPCOMING CARE */}
            {upcomingEvents.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Upcoming Care & Appointments ({upcomingEvents.length})
                  </span>
                  <div className="h-px flex-1 bg-sky-200" />
                </div>
                <div className="grid gap-2.5">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border-2 border-sky-200 bg-sky-50/40 p-4 shadow-2xs space-y-2 hover:border-sky-300 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                            {getEventIcon(event.event_type)}
                          </div>
                          <span className="font-mono text-[11px] font-bold text-sky-900">
                            {event.reference_id}
                          </span>
                          {getEventBadge(event.event_type)}
                          <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-300 text-[9px] font-bold">
                            {event.status}
                          </Badge>
                        </div>
                        <span className="text-[11px] font-bold text-sky-800">
                          {new Date(event.occurred_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="text-xs space-y-1">
                        <h3 className="font-bold text-slate-900 text-sm">{event.title}</h3>
                        <p className="text-slate-700 leading-relaxed text-[11px]">{event.summary}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600 border-t border-sky-100/60">
                        <span>{event.professional_name} • {event.organization_name}</span>
                        <Link href={event.deep_link}>
                          <Button size="sm" variant="outline" className="text-xs h-7 text-sky-800 border-sky-300 hover:bg-sky-100 gap-1 font-semibold">
                            <span>Manage</span>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: TODAY'S ACTIVITY */}
            {todayEvents.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Today's Activity ({todayEvents.length})
                  </span>
                  <div className="h-px flex-1 bg-emerald-200" />
                </div>
                <div className="grid gap-2.5">
                  {todayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-2xs space-y-2 hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-100/60 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            {getEventIcon(event.event_type)}
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-800">
                            {event.reference_id}
                          </span>
                          {getEventBadge(event.event_type)}
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[9px] font-bold">
                            {event.status}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {new Date(event.occurred_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-xs space-y-1">
                        <h3 className="font-bold text-slate-900 text-sm">{event.title}</h3>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{event.summary}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-emerald-100/60">
                        <span>{event.professional_name} • {event.organization_name}</span>
                        <Link href={event.deep_link}>
                          <Button size="sm" variant="outline" className="text-xs h-7 text-emerald-800 border-emerald-200 hover:bg-emerald-50 gap-1 font-semibold">
                            <span>Open</span>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: PAST CARE TRAJECTORY */}
            {pastDateGroups.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    Past Healthcare Trajectory
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {pastDateGroups.map((group) => (
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
                                  event.status === "COMPLETED" || event.status === "ISSUED" || event.status === "ORDERED" || event.status === "RELEASED" || event.status === "Prescribed"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : event.status === "CANCELLED" || event.status === "Cancelled" || event.status === "REJECTED"
                                    ? "bg-rose-50 text-rose-800 border-rose-200"
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

                          <div className="text-xs space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm">
                              {event.title}
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-[11px]">
                              {event.summary}
                            </p>
                          </div>

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
            ) : upcomingEvents.length === 0 && todayEvents.length === 0 ? (
              <EmptyState
                icon={<HeartPulse className="h-6 w-6 text-teal-600" />}
                title="No Healthcare Activity in Selection"
                description="Adjust your search query or filter to view longitudinal medical records across consultations, prescriptions, lab tests, and documents."
                phase="Phase C.4 — Unified Clinical Record & Continuity Layer"
                actionHref="/patient"
                actionLabel="Return to Patient Home"
              />
            ) : null}
          </div>
        )}

        {/* VIEW MODE 2: ENCOUNTER BUNDLES */}
        {activeView === "bundles" && (
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
                          {bundle.encounter.encounter_type}
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
                      <Button variant="outline" size="sm" className="text-xs h-8 text-teal-800 border-teal-200 hover:bg-teal-50 gap-1 font-semibold">
                        <span>View Full Consultation</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  {/* Clinical Assessment */}
                  {bundle.clinical_record && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">Clinical Assessment & Diagnosis</span>
                      </div>
                      <p className="text-xs text-slate-700">
                        <span className="font-semibold">Diagnoses: </span>
                        {bundle.clinical_record.diagnoses && bundle.clinical_record.diagnoses.length > 0
                          ? bundle.clinical_record.diagnoses.map((d) => `${d.name} (${d.icd10_code || "Clinician Authored"})`).join(", ")
                          : "General evaluation completed."}
                      </p>
                      {bundle.clinical_record.assessment && (
                        <p className="text-xs text-slate-600 italic">
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
                        Diagnostic Investigations & Reports ({bundle.lab_orders.length} orders / {bundle.lab_reports.length} reports)
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
                            <span className="text-[10px] text-slate-500 block">Indication: "{lo.reason}"</span>
                          </div>
                        ))}
                        {bundle.lab_reports.map((lr) => (
                          <div key={lr.id} className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold text-indigo-900">{lr.report_reference || lr.id}</span>
                              <Badge variant="outline" className="text-[9px] bg-indigo-100 text-indigo-800 font-bold border-indigo-200">Released</Badge>
                            </div>
                            <p className="font-semibold text-slate-900">
                              Certified Report: {Array.from(new Set(lr.results.map((r) => r.test_name))).join(", ")}
                            </p>
                            <span className="text-[10px] text-slate-500 block">Verified by: {lr.verified_by_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medical Orders (Follow-ups, Referrals, Imaging) */}
                  {bundle.medical_orders.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-violet-800 flex items-center gap-1.5">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Care Orders & Recommendations ({bundle.medical_orders.length})
                      </span>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {bundle.medical_orders.map((mo) => (
                          <div key={mo.id} className="p-3 rounded-xl bg-violet-50/40 border border-violet-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold text-violet-900">{mo.order_type}</span>
                              <Badge variant="outline" className="text-[9px] bg-white font-bold">{mo.priority}</Badge>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {mo.clinical_indication || mo.instructions || "Care instruction"}
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
                icon={<Layers className="h-6 w-6 text-teal-600" />}
                title="No Consultation Bundles Available"
                description="No consultation visits match the active filter criteria."
                phase="Phase C.4 — Unified Clinical Record & Continuity Layer"
                actionHref="/patient"
                actionLabel="Return to Patient Home"
              />
            )}
          </div>
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
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingDoc(null)}
                  className="text-xs h-8"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownloadDoc(viewingDoc)}
                  className="text-xs h-8 bg-indigo-700 hover:bg-indigo-800 text-white gap-1.5"
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

