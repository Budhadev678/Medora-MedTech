"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  FolderOpen,
  ShieldCheck, 
  Filter, 
  Building2, 
  Calendar, 
  Clock, 
  X, 
  Sparkles,
  ChevronRight,
  User,
  HeartPulse,
  Activity,
  CheckCircle2
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
import { getClinicalRecordByEncounterId, ClinicalRecord } from "@/lib/data/clinical-record-store";
import { getPatientPrescriptions } from "@/lib/data/prescription-store";
import { getPatientMedicalDocuments } from "@/lib/data/medical-document-store";

export default function PatientRecordsPage() {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [encounters, setEncounters] = useState<HealthcareEncounter[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedEncounterDetail, setSelectedEncounterDetail] = useState<HealthcareEncounter | null>(null);

  const refreshAllRecords = () => {
    if (!user) return;
    const patientId = user.identifier || user.id;
    setEncounters(getPatientEncounters(patientId));
    setPrescriptions(getPatientPrescriptions(patientId));
    setDocuments(getPatientMedicalDocuments(patientId));
  };

  useEffect(() => {
    refreshAllRecords();
    const handleUpdate = () => refreshAllRecords();
    window.addEventListener("medora-encounters-updated", handleUpdate);
    window.addEventListener("medora-clinical-records-updated", handleUpdate);
    window.addEventListener("medora-prescriptions-updated", handleUpdate);
    window.addEventListener("medora-medical-documents-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-encounters-updated", handleUpdate);
      window.removeEventListener("medora-clinical-records-updated", handleUpdate);
      window.removeEventListener("medora-prescriptions-updated", handleUpdate);
      window.removeEventListener("medora-medical-documents-updated", handleUpdate);
    };
  }, [user]);

  // Map dynamic encounters to RecordCard format (Only finalized/completed encounters released to patient)
  const dynamicEncounterRecords: PatientRecordProps[] = encounters
    .filter((enc) => enc.status === "COMPLETED")
    .map((enc) => {
      const clinicalRec = getClinicalRecordByEncounterId(enc.id);
      const diagnosisSummary = clinicalRec?.diagnoses?.length 
        ? ` • Diagnosis: ${clinicalRec.diagnoses.map((d: any) => d.name).join(", ")}` 
        : "";

      return {
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
        summary: `Chief Complaint: ${clinicalRec?.chief_complaint || enc.reason_for_visit}${diagnosisSummary}. Clinically documented by ${enc.provider_name}.`,
        actionHref: `/patient/records#${enc.id}`,
        actionLabel: clinicalRec ? "View Clinical Summary" : "View Visit Details",
      };
    });

  const dynamicPrescriptionRecords: PatientRecordProps[] = prescriptions.map((rx) => ({
    id: rx.id,
    category: "prescription",
    title: `Electronic Prescription — ${rx.items.map((i: any) => i.medication_name).join(", ")}`,
    doctorName: rx.doctor_name,
    facilityName: rx.organization_name,
    date: new Date(rx.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    summary: `Prescription with ${rx.items.length} prescribed medications. Open pharmacy dispensing enabled.`,
    actionHref: "/patient/prescriptions",
    actionLabel: "View Prescription",
  }));

  const dynamicDocumentRecords: PatientRecordProps[] = documents.map((doc) => ({
    id: doc.id,
    category: "report",
    title: doc.title,
    facilityName: doc.source_organization_name,
    date: new Date(doc.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    summary: `${doc.description || "Certified medical document"}. Verified: ${doc.verification_status}.`,
    actionHref: "/patient/documents",
    actionLabel: "View Certified Document",
  }));

  const allPatientRecords = [
    ...dynamicEncounterRecords, 
    ...dynamicPrescriptionRecords, 
    ...dynamicDocumentRecords
  ];

  const filteredRecords = selectedFilter === "all"
    ? allPatientRecords
    : allPatientRecords.filter(r => r.category === selectedFilter);

  const filters = [
    { key: "all", label: `All Records (${allPatientRecords.length})` },
    { key: "consultation", label: `Visits & Consultations (${dynamicEncounterRecords.length})` },
    { key: "prescription", label: `Prescriptions (${dynamicPrescriptionRecords.length})` },
    { key: "report", label: `Lab Reports & Documents (${dynamicDocumentRecords.length})` },
  ];

  // Active encounter's clinical record
  const currentClinicalRecord = selectedEncounterDetail 
    ? getClinicalRecordByEncounterId(selectedEncounterDetail.id) 
    : null;

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Longitudinal Medical Records"
          description="Authoritative clinical consultations, symptoms, vitals, assessments, and diagnoses across all your MEDORA healthcare visits."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Medical Records" }]}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/patient/health">
                <Button variant="outline" size="sm" className="text-xs h-8 text-teal-800 border-teal-200 hover:bg-teal-50 gap-1.5 font-bold">
                  <HeartPulse className="h-3.5 w-3.5" />
                  <span>Health Journey</span>
                </Button>
              </Link>
              <Link href="/patient/documents">
                <Button variant="outline" size="sm" className="text-xs h-8 text-indigo-800 border-indigo-200 hover:bg-indigo-50 gap-1.5 font-bold">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>Document Vault</span>
                </Button>
              </Link>
            </div>
          }
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
                    actionLabel={matchedEncounter ? "View Clinical Summary" : record.actionLabel}
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
            phase="Phase 4.2 — Clinical Record Core"
            secondaryText="Zero duplicate records: Timeline aggregates authoritative clinical events across all MEDORA facilities."
            actionHref="/patient"
            actionLabel="Return to Patient Home"
          />
        )}

        {/* ============================================================ */}
        {/* CLINICAL ENCOUNTER DETAIL SHEET (MOBILE-FIRST) */}
        {/* ============================================================ */}
        {selectedEncounterDetail && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                      {selectedEncounterDetail.encounter_reference || selectedEncounterDetail.id}
                    </span>
                    <StatusBadge status={selectedEncounterDetail.status.toLowerCase() as any} />
                    {currentClinicalRecord && (
                      <Badge variant="outline" className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border-emerald-200">
                        {currentClinicalRecord.status} (v{currentClinicalRecord.version})
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    Clinical Visit Summary
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

              <div className="space-y-3.5 text-xs">
                
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

                {/* Chief Complaint */}
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Chief Complaint / Reason
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {currentClinicalRecord?.chief_complaint || selectedEncounterDetail.reason_for_visit}
                  </p>
                </div>

                {/* Symptoms */}
                {currentClinicalRecord?.symptoms && currentClinicalRecord.symptoms.length > 0 && (
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Documented Symptoms ({currentClinicalRecord.symptoms.length})
                    </span>
                    <div className="space-y-1.5">
                      {currentClinicalRecord.symptoms.map((sym: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-slate-800 bg-white p-2 rounded-lg border border-slate-200/60">
                          <span className="font-semibold">{sym.name}</span>
                          <div className="flex items-center gap-1.5">
                            {sym.duration && (
                              <span className="text-[10px] text-slate-500">{sym.duration}</span>
                            )}
                            <Badge variant="outline" className="text-[9px] font-bold py-0">
                              {sym.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vitals */}
                {currentClinicalRecord?.vitals && (
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Recorded Physical Vitals
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      {currentClinicalRecord.vitals.systolic_bp_mmhg && currentClinicalRecord.vitals.diastolic_bp_mmhg && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 block">BP</span>
                          <span className="font-bold text-slate-800">
                            {currentClinicalRecord.vitals.systolic_bp_mmhg}/{currentClinicalRecord.vitals.diastolic_bp_mmhg} <span className="text-[9px] text-slate-400 font-normal">mmHg</span>
                          </span>
                        </div>
                      )}
                      {currentClinicalRecord.vitals.heart_rate_bpm && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 block">Pulse</span>
                          <span className="font-bold text-slate-800">
                            {currentClinicalRecord.vitals.heart_rate_bpm} <span className="text-[9px] text-slate-400 font-normal">bpm</span>
                          </span>
                        </div>
                      )}
                      {currentClinicalRecord.vitals.spo2_percent && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 block">SpO2</span>
                          <span className="font-bold text-slate-800">
                            {currentClinicalRecord.vitals.spo2_percent}%
                          </span>
                        </div>
                      )}
                      {currentClinicalRecord.vitals.temperature_celsius && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 block">Temp</span>
                          <span className="font-bold text-slate-800">
                            {currentClinicalRecord.vitals.temperature_celsius}°C
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Clinician Diagnoses */}
                {currentClinicalRecord?.diagnoses && currentClinicalRecord.diagnoses.length > 0 && (
                  <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                        Clinician Diagnoses
                      </span>
                      <span className="text-[9px] font-semibold text-teal-700">
                        Attributed to {currentClinicalRecord.author_name}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {currentClinicalRecord.diagnoses.map((dx: any, i: number) => (
                        <div key={i} className="p-2 rounded-lg bg-white border border-teal-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block">{dx.name}</span>
                            {dx.icd10_code && (
                              <span className="text-[10px] font-mono text-slate-500">ICD-10: {dx.icd10_code}</span>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[10px] font-bold bg-teal-50 text-teal-800 border-teal-300">
                            {dx.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Treatment Plan & Advice */}
                {currentClinicalRecord?.treatment_plan && (
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Care & Lifestyle Plan
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {currentClinicalRecord.treatment_plan}
                    </p>
                  </div>
                )}

                {/* Follow-up Plan */}
                {currentClinicalRecord?.follow_up_plan && currentClinicalRecord.follow_up_plan.required && (
                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Follow-up Plan
                    </span>
                    <p className="text-slate-800 font-medium">
                      {currentClinicalRecord.follow_up_plan.instructions || "Follow-up recommended with attending specialist."}
                      {currentClinicalRecord.follow_up_plan.follow_up_date && ` (Target Date: ${currentClinicalRecord.follow_up_plan.follow_up_date})`}
                    </p>
                  </div>
                )}

                {/* Cryptographic Provenance */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Clinician Certified Record
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {currentClinicalRecord ? `${currentClinicalRecord.id} (v${currentClinicalRecord.version})` : selectedEncounterDetail.id}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => setSelectedEncounterDetail(null)}
                  className="w-full sm:w-auto bg-slate-900 text-white font-bold text-xs"
                >
                  Close Summary
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
