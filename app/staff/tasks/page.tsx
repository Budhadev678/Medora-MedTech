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
          description="Inpatient vitals capture, medication rounds, and nursing checklist."
          breadcrumbs={[{ label: "Staff Workspace", href: "/staff" }, { label: "My Tasks" }]}
        />

        <EmptyState
          icon={<ClipboardList className="h-6 w-6 text-teal-600" />}
          title="Nursing & Clinical Shift Tasks"
          description="Assigned patient medication schedules and ward round tasks will operate here in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/staff"
          actionLabel="Return to Staff Workspace"
        />
      </div>
    </RoleGuard>
  );
}
