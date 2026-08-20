"use client";

import React from "react";
import { Droplet, FlaskConical } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function BloodMatchingPage() {
  return (
    <RoleGuard allowedRoles={["blood_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Cross-Match & Compatibility Lab"
          description="Serological cross-matching, antibody screening, and transfusion compatibility testing for hospital emergency requests."
          badgeText="Cross-Match Lab"
          breadcrumbs={[{ label: "Blood Centre", href: "/blood-bank" }, { label: "Cross-Matching" }]}
        />

        <EmptyState
          icon={<FlaskConical className="h-6 w-6 text-rose-600" />}
          title="Serological Compatibility Workbench"
          description="Major and minor cross-match test results and digital transfusion compatibility tags will be issued here in Phase 14."
          phase="Phase 14 — Emergency Blood Logistics & Matching"
          actionHref="/blood-bank"
          actionLabel="Return to Blood Desk"
        />
      </div>
    </RoleGuard>
  );
}
