"use client";

import React from "react";
import { Users, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LabStaffPage() {
  return (
    <RoleGuard allowedRoles={["lab_staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Laboratory Personnel & Technicians"
          description="Pathologists, biochemists, and phlebotomists appointed at this diagnostic facility."
          breadcrumbs={[{ label: "Diagnostic Lab", href: "/lab" }, { label: "Staff" }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white">
            <CardHeader className="p-4 pb-2">
              <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded w-fit">
                LAB-STAFF-1001
              </span>
              <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                Dr. B. Mohapatra, MD (Pathology)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-slate-600">
              <p><strong>Role:</strong> Chief Pathologist & Signatory</p>
              <p className="text-slate-500">Odisha Medical Council: OMC-1998-1204</p>
            </CardContent>
          </Card>
        </div>

        <EmptyState
          icon={<Users className="h-6 w-6 text-amber-600" />}
          title="Laboratory Staff Directory"
          description="Phlebotomy shift schedules, analyzer instrument certifications, and signing authorities will be managed here in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/lab"
          actionLabel="Return to Lab Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
