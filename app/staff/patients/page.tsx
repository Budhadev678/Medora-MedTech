"use client";

import React from "react";
import { Users, BedDouble } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function StaffPatientsPage() {
  return (
    <RoleGuard allowedRoles={["staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Assigned Inpatients Roster"
          description="Inpatients currently admitted to your assigned hospital ward and bed."
          breadcrumbs={[{ label: "Staff Workspace", href: "/staff" }, { label: "Assigned Patients" }]}
        />

        <EmptyState
          icon={<Users className="h-6 w-6 text-teal-600" />}
          title="Ward Inpatient Directory"
          description="Assigned inpatient rosters with real-time vitals monitoring and doctor instructions will operate here in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/staff"
          actionLabel="Return to Staff Workspace"
        />
      </div>
    </RoleGuard>
  );
}
