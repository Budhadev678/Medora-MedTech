"use client";

import React from "react";
import { Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

export default function HospitalDepartmentsPage() {
  const departments = [
    { name: "Emergency & Trauma Care", code: "EMERG", activeDoctors: 4, occupiedBeds: "18 / 20", status: "high" },
    { name: "Cardiology & Cath Lab", code: "CARD", activeDoctors: 3, occupiedBeds: "12 / 15", status: "available" },
    { name: "Diagnostic Pathology & Imaging", code: "PATH", activeDoctors: 5, occupiedBeds: "N/A (OPD)", status: "available" },
    { name: "General Medicine & Ward", code: "MED", activeDoctors: 6, occupiedBeds: "42 / 50", status: "available" },
  ];

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Clinical & Operational Departments"
          description="Specialized medical departments, cath labs, ICUs, and outpatient suites."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Departments" }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => (
            <Card key={dept.code} className="bg-white">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {dept.code}
                  </span>
                  <StatusBadge status={dept.status} size="sm" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                  {dept.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 my-2">
                  <div className="rounded bg-slate-50 p-2">
                    <span className="text-slate-400 block text-[11px]">Doctors on Duty</span>
                    <span className="font-semibold text-slate-900">{dept.activeDoctors} Specialists</span>
                  </div>
                  <div className="rounded bg-slate-50 p-2">
                    <span className="text-slate-400 block text-[11px]">Inpatient Beds</span>
                    <span className="font-semibold text-slate-900">{dept.occupiedBeds}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <EmptyState
          icon={<Layers className="h-6 w-6 text-teal-600" />}
          title="Department Configuration Workspace"
          description="Detailed sub-specialty hierarchies, equipment assignment, and inter-departmental transfers will become configurable in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/hospital"
          actionLabel="Return to Command Center"
        />
      </div>
    </RoleGuard>
  );
}
