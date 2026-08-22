"use client";

import React from "react";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function StaffTasksPage() {
  return (
    <RoleGuard allowedRoles={["staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Clinical Handover & Duty Tasks"
          description="Inpatient vitals verification, admissions coordination, and staff checklist."
          breadcrumbs={[{ label: "Staff Workspace", href: "/staff" }, { label: "My Tasks" }]}
        />

        <EmptyState
          icon={<ClipboardList className="h-6 w-6 text-teal-600" />}
          title="Operational & Clinical Shift Tasks"
          description="Assigned patient intake schedules and duty tasks will operate here in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/staff"
          actionLabel="Return to Staff Workspace"
        />
      </div>
    </RoleGuard>
  );
}
