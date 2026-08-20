"use client";

import React, { useState } from "react";
import { FileText, Stethoscope, FlaskConical, Pill, ShieldCheck, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { RecordCard, PatientRecordProps } from "@/components/patient/record-card";
import { useAuth } from "@/lib/auth/auth-context";

export default function PatientRecordsPage() {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const isRahul = user?.identifier === "PAT-1001";

  // User-scoped records (only PAT-1001 has these seed records; PAT-1002/1003 see clear empty state)
  const patientRecords: PatientRecordProps[] = isRahul ? [
    {
      id: "ENC-1001",
      category: "consultation",
      title: "Outpatient Cardiology Consultation — Stage 1 HTN",
      doctorName: "Dr. Ananya Sharma",
      facilityName: "City Hospital (Bhubaneswar)",
      date: "20 Aug 2026",
      summary: "Patient presented with mild morning headaches and elevated blood pressure (142/90 mmHg). Advised lifestyle changes, sodium reduction, and prescribed Telmisartan.",
      actionHref: "/patient/prescriptions",
      actionLabel: "View Rx",
    },
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

  const filteredRecords = selectedFilter === "all"
    ? patientRecords
    : patientRecords.filter(r => r.category === selectedFilter);

  const filters = [
    { key: "all", label: "All Records" },
    { key: "consultation", label: "Consultations" },
    { key: "report", label: "Lab Reports" },
    { key: "prescription", label: "Prescriptions" },
    { key: "emergency", label: "Emergency" },
  ];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Longitudinal Medical Records"
          description="Authoritative clinical records, consultation summaries, and diagnostic reports across all healthcare visits."
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
            {filteredRecords.map((record) => (
              <RecordCard key={record.id} {...record} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-6 w-6 text-teal-600" />}
            title="No Healthcare Records in this Category"
            description="Verified clinical records will aggregate here automatically after your doctor visits and lab investigations."
            phase="Phase 16 — Unified Healthcare Timeline Engine"
            secondaryText="Zero duplicate records: Timeline aggregates authoritative clinical events across all MEDORA facilities."
            actionHref="/patient"
            actionLabel="Return to Patient Home"
          />
        )}
      </div>
    </RoleGuard>
  );
}
