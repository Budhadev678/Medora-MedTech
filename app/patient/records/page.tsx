"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  ShieldCheck, 
  Filter, 
  Building2, 
  Calendar, 
  Clock, 
  X, 
  Sparkles,
  ChevronRight,
  User
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { RecordCard, PatientRecordProps } from "@/components/patient/record-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/lib/auth/auth-context";
import { getPatientEncounters, HealthcareEncounter } from "@/lib/data/encounter-store";

export default function PatientRecordsPage() {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [encounters, setEncounters] = useState<HealthcareEncounter[]>([]);
  const [selectedEncounterDetail, setSelectedEncounterDetail] = useState<HealthcareEncounter | null>(null);

  const refreshEncounters = () => {
    if (!user) return;
    const data = getPatientEncounters(user.identifier || user.id);
    setEncounters(data);
  };

  useEffect(() => {
    refreshEncounters();
    window.addEventListener("medora-encounters-updated", refreshEncounters);
    return () => window.removeEventListener("medora-encounters-updated", refreshEncounters);
  }, [user]);

  const isRahul = user?.identifier === "PAT-1001";

  // Static/Auxiliary Records for PAT-1001
  const auxiliaryRecords: PatientRecordProps[] = isRahul ? [
    {
      id: "RPT-1024",
      category: "report",
      title: "Complete Blood Count (CBC) with Differential",
      facilityName: "ABC Diagnostics (LAB-1001)",
      date: "20 Aug 2026",
      summary: "Hemoglobin 14.2 g/dL, Platelets 245,000 /uL, Total WBC 7,800 /uL. All parameters within normal physiological reference ranges.",
      actionHref: "/verify/lab/LAB-1024",
      actionLabel: "View Certified Report",
    },
    {
      id: "RX-1001",
      category: "prescription",
      title: "Electronic Prescription — Telmisartan 40mg + Aspirin 75mg",
      doctorName: "Dr. Ananya Sharma",
      facilityName: "City Hospital OPD",
      date: "20 Aug 2026",
      summary: "Digitally signed e-prescription with verifiable cryptographic QR slip. Open pharmacy dispensing enabled.",
      actionHref: "/verify/rx/RX-1001",
      actionLabel: "View Slip (QR)",
    },
  ] : [];

  // Map dynamic encounters to RecordCard format
  const dynamicEncounterRecords: PatientRecordProps[] = encounters.map((enc) => ({
    id: enc.id,
    category: "consultation",
    title: `${enc.encounter_type.replace(/_/g, " ")} — ${enc.department_name}`,
    doctorName: enc.provider_name,
    facilityName: `${enc.organization_name}${enc.location ? ` (${enc.location})` : ""}`,
    date: new Date(enc.started_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    summary: `Reason for Visit: ${enc.reason_for_visit}. Status: ${enc.status}. Clinically recorded by ${enc.provider_name}.`,
    actionHref: `/patient/records#${enc.id}`,
    actionLabel: "View Details",
  }));

  const allPatientRecords = [...dynamicEncounterRecords, ...auxiliaryRecords];

  const filteredRecords = selectedFilter === "all"
    ? allPatientRecords
    : allPatientRecords.filter(r => r.category === selectedFilter);

  const filters = [
    { key: "all", label: `All Records (${allPatientRecords.length})` },
    { key: "consultation", label: `Visits & Consultations (${dynamicEncounterRecords.length})` },
    { key: "report", label: `Lab Reports (${auxiliaryRecords.filter(r => r.category === "report").length})` },
    { key: "prescription", label: `Prescriptions (${auxiliaryRecords.filter(r => r.category === "prescription").length})` },
    { key: "emergency", label: "Emergency (0)" },
  ];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Longitudinal Medical Records"
          description="Authoritative clinical records, healthcare visits, and consultation summaries across all MEDORA facilities."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Medical Records" }]}
        />

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSelectedFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFilter === f.key
                  ? "bg-teal-700 text-white shadow-2xs font-bold"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Record Cards Stream */}
        {filteredRecords.length > 0 ? (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const matchedEncounter = encounters.find(e => e.id === record.id);

              return (
                <div key={record.id} className="relative group">
                  <RecordCard 
                    {...record} 
                    actionLabel={matchedEncounter ? "View Visit Details" : record.actionLabel}
                  />
                  {matchedEncounter && (
                    <button
                      type="button"
                      onClick={() => setSelectedEncounterDetail(matchedEncounter)}
                      aria-label={`Open visit details for ${matchedEncounter.id}`}
                      className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-6 w-6 text-teal-600" />}
            title="No Healthcare Records in this Category"
            description="Verified clinical records will aggregate here automatically after your doctor visits and lab investigations."
            phase="Phase 4.1 — Healthcare Encounter Core"
            secondaryText="Zero duplicate records: Timeline aggregates authoritative clinical events across all MEDORA facilities."
            actionHref="/patient"
            actionLabel="Return to Patient Home"
          />
        )}

        {/* ============================================================ */}
        {/* ENCOUNTER DETAIL SHEET (MOBILE-FIRST) */}
        {/* ============================================================ */}
        {selectedEncounterDetail && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                      {selectedEncounterDetail.encounter_reference || selectedEncounterDetail.id}
                    </span>
                    <StatusBadge status={selectedEncounterDetail.status.toLowerCase() as any} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    Healthcare Visit Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEncounterDetail(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Doctor & Facility Info */}
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        {selectedEncounterDetail.provider_name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {selectedEncounterDetail.provider_role} • {selectedEncounterDetail.department_name}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      {selectedEncounterDetail.organization_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {new Date(selectedEncounterDetail.started_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Clinical Reason */}
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Reason for Visit</span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {selectedEncounterDetail.reason_for_visit}
                  </p>
                </div>

                {/* Timing & Location */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Session Started</span>
                    <span className="text-slate-800 font-medium">
                      {new Date(selectedEncounterDetail.started_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Session Ended</span>
                    <span className="text-slate-800 font-medium">
                      {selectedEncounterDetail.ended_at 
                        ? new Date(selectedEncounterDetail.ended_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) 
                        : "In Progress"}
                    </span>
                  </div>
                </div>

                {/* Clinical Provenance & Future Clinical Attachment Notice */}
                <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/70 text-xs text-teal-900 space-y-1">
                  <span className="font-bold block flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                    Verified Healthcare Provenance
                  </span>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    This encounter is cryptographically logged in the MEDORA health registry. Future consultation notes, diagnoses, and e-prescriptions will link directly to this visit ID.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => setSelectedEncounterDetail(null)}
                  className="w-full sm:w-auto bg-slate-900 text-white font-bold text-xs"
                >
                  Close Visit Details
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
