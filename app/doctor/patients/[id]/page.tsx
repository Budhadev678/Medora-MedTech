"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  User, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  Share2, 
  FileText, 
  Building2, 
  ChevronRight,
  Activity,
  HeartPulse,
  Plus
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { findIdentityById, StoredIdentity } from "@/lib/data/identity-store";
import { ClinicalContinuityService, HealthJourneyDateGroup } from "@/lib/services/clinical-continuity-service";
import { AccessEngine } from "@/lib/services/access-engine";
import type { TimelineEvent, TimelineEventType } from "@/types/database.types";

export default function DoctorPatientHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const patientId = String(params?.id || "");

  const [patient, setPatient] = useState<StoredIdentity | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ENCOUNTER" | "PRESCRIPTION" | "LAB_REPORT" | "REFERRAL">("ALL");

  useEffect(() => {
    if (!patientId) return;
    const p = findIdentityById(patientId);
    setPatient(p || null);

    if (p && user) {
      const events = ClinicalContinuityService.getPatientTimeline(
        p.identifier || p.id,
        user
      );
      setTimelineEvents(events);
    }
  }, [patientId, user]);

  if (!patient) {
    return (
      <RoleGuard allowedRoles={["doctor", "admin"]}>
        <div className="space-y-4 p-6 max-w-7xl mx-auto">
          <Link href="/doctor/patients" className="text-xs font-bold text-teal-700 flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Patients Registry
          </Link>
          <EmptyState
            icon={<User className="h-8 w-8 text-slate-400" />}
            title="Patient Record Not Found"
            description="The requested patient record could not be resolved or access is restricted."
            actionLabel="Return to Patients Registry"
            actionHref="/doctor/patients"
          />
        </div>
      </RoleGuard>
    );
  }

  const accessCheck = user ? AccessEngine.evaluateAccess({
    actor: user,
    targetPatientId: patient.identifier || patient.id,
    organizationId: "HSP-1001",
    purpose: "treatment",
    requiredScope: "medical_history",
  }) : null;

  const filteredEvents = timelineEvents.filter((evt) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "ENCOUNTER") return evt.event_type === "ENCOUNTER" || evt.event_type === "CLINICAL_RECORD";
    return evt.event_type === activeFilter;
  });

  const dateGroups = ClinicalContinuityService.groupTimelineEventsByDate(filteredEvents);

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150 max-w-7xl mx-auto pb-24 p-4 sm:p-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/doctor/patients" className="text-xs font-bold text-teal-700 flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Patients Registry
          </Link>
          <Link href={`/doctor/consultations?patientId=${patient.identifier || patient.id}`}>
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-1.5 shadow-xs">
              <Stethoscope className="h-4 w-4" /> Start Consultation Encounter
            </Button>
          </Link>
        </div>

        {/* Patient Demographics & Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-800 text-lg">
                {patient.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900">{patient.fullName}</h1>
                  <Badge variant="outline" className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border-teal-200">
                    {patient.identifier}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                  <span>DOB: <strong>{patient.patientData?.dob || "1988-04-12"}</strong></span>
                  <span>•</span>
                  <span>Gender: <strong>{patient.patientData?.gender || "Male"}</strong></span>
                  {patient.patientData?.bloodGroup && (
                    <>
                      <span>•</span>
                      <span>Blood Group: <strong className="text-red-700">{patient.patientData.bloodGroup}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {accessCheck?.allowed ? (
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs gap-1 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Consent Verified & Active
                </Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs gap-1 py-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Consent Pending
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Clinical Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Allergies</span>
              <span className="font-bold text-slate-900 block">
                {patient.patientData?.allergies?.length ? patient.patientData.allergies.join(", ") : "No known drug allergies (NKDA)"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Primary Conditions</span>
              <span className="font-bold text-slate-900 block">Stage 1 Hypertension</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Timeline Events</span>
              <span className="font-bold text-slate-900 block">{timelineEvents.length} recorded events</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Care Relationship</span>
              <span className="font-bold text-teal-800 block">City Hospital (Cardiology)</span>
            </div>
          </div>
        </div>

        {/* Timeline Section & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-700" />
                Longitudinal Health Journey & History
              </h2>
              <p className="text-xs text-slate-500">
                Authoritative chronological record of consultations, prescriptions, lab results, and referrals.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === "ALL" ? "bg-slate-900 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All ({timelineEvents.length})
              </button>
              <button
                onClick={() => setActiveFilter("ENCOUNTER")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === "ENCOUNTER" ? "bg-teal-700 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Consultations
              </button>
              <button
                onClick={() => setActiveFilter("PRESCRIPTION")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === "PRESCRIPTION" ? "bg-blue-700 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Prescriptions
              </button>
              <button
                onClick={() => setActiveFilter("LAB_REPORT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === "LAB_REPORT" ? "bg-amber-700 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Lab Reports
              </button>
              <button
                onClick={() => setActiveFilter("REFERRAL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === "REFERRAL" ? "bg-purple-700 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Referrals
              </button>
            </div>
          </div>

          {/* Chronological Timeline Groups */}
          {dateGroups.length > 0 ? (
            <div className="space-y-5">
              {dateGroups.map((group) => (
                <div key={group.dateKey} className="space-y-3">
                  <div className="sticky top-16 z-10 flex items-center gap-2 bg-slate-50/90 backdrop-blur-xs py-1.5 px-3 rounded-lg border border-slate-200 w-fit">
                    <Calendar className="h-3.5 w-3.5 text-teal-700" />
                    <span className="text-xs font-bold text-slate-800">{group.dateLabel}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({group.events.length} events)</span>
                  </div>

                  <div className="space-y-2.5 pl-3 border-l-2 border-slate-200 ml-4">
                    {group.events.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                event.event_type === "ENCOUNTER" || event.event_type === "CLINICAL_RECORD"
                                  ? "bg-teal-50 text-teal-800 border-teal-300"
                                  : event.event_type === "PRESCRIPTION"
                                  ? "bg-blue-50 text-blue-800 border-blue-300"
                                  : event.event_type === "LAB_REPORT" || event.event_type === "LAB_ORDER"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-purple-50 text-purple-800 border-purple-300"
                              }`}
                            >
                              {event.event_type}
                            </Badge>
                            <h3 className="font-bold text-sm text-slate-900">{event.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(event.occurred_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>

                        {event.summary && (
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {event.summary}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
                          <span className="flex items-center gap-1 font-medium">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {event.organization_name || "City Hospital"}
                          </span>
                          <span className="font-medium text-teal-800">
                            Provider: {event.professional_name || "Dr. Ananya Sharma"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Activity className="h-8 w-8 text-teal-600" />}
              title="No Timeline Records Found"
              description="No clinical events match the selected category for this patient."
            />
          )}
        </div>
      </div>
    </RoleGuard>
  );
}