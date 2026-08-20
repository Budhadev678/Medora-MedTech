"use client";

import React, { useState } from "react";
import { FlaskConical, FileText, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { ReportCard, PatientReportProps } from "@/components/patient/report-card";
import { useAuth } from "@/lib/auth/auth-context";

export default function PatientReportsPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const isRahul = user?.identifier === "PAT-1001";

  const reports: PatientReportProps[] = isRahul ? [
    {
      id: "RPT-1024",
      testName: "Complete Blood Count (CBC) with Differential",
      category: "Laboratory",
      labName: "ABC Diagnostics (LAB-1001)",
      pathologistName: "Dr. B. Mohapatra, MD (Pathology)",
      date: "20 Aug 2026",
      status: "certified",
      parameters: [
        { name: "Hemoglobin", value: "14.2", unit: "g/dL", referenceRange: "13.0 - 17.0", flag: "NORMAL" },
        { name: "Total Leukocyte Count (WBC)", value: "7,800", unit: "/uL", referenceRange: "4,000 - 11,000", flag: "NORMAL" },
        { name: "Platelet Count", value: "245,000", unit: "/uL", referenceRange: "150,000 - 450,000", flag: "NORMAL" },
      ],
    },
  ] : [];

  const filteredReports = selectedCategory === "all"
    ? reports
    : reports.filter(r => r.category.toLowerCase() === selectedCategory);

  const categories = [
    { key: "all", label: "All Reports" },
    { key: "laboratory", label: "Laboratory" },
    { key: "imaging", label: "Imaging & X-Ray" },
    { key: "pathology", label: "Pathology" },
  ];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Diagnostic Lab Reports"
          description="NABL-certified pathology reports, diagnostic tests, and specimen investigation results."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Lab Reports" }]}
        />

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelectedCategory(c.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.key
                  ? "bg-blue-700 text-white shadow-2xs font-bold"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {filteredReports.length > 0 ? (
          <div className="space-y-3">
            {filteredReports.map((rpt) => (
              <ReportCard key={rpt.id} {...rpt} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FlaskConical className="h-6 w-6 text-blue-600" />}
            title="No Diagnostic Reports in this Category"
            description="Verified laboratory reports will be uploaded here directly by accredited diagnostic testing centers."
            phase="Phase 8 — Connected Laboratory System"
            actionHref="/patient"
            actionLabel="Return to Patient Home"
          />
        )}
      </div>
    </RoleGuard>
  );
}
