"use client";

import React from "react";
import { Landmark, ClipboardList } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function GovernmentCasesPage() {
  return (
    <RoleGuard allowedRoles={["government_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Assistance Cases Queue"
          description="Pending and approved healthcare subsidy assistance cases from affiliated hospitals across the state."
          badgeText="Scheme Cases"
          breadcrumbs={[{ label: "Government Desk", href: "/government" }, { label: "Assistance Cases" }]}
        />

        <EmptyState
          icon={<ClipboardList className="h-6 w-6 text-blue-600" />}
          title="No Pending Assistance Cases"
          description="Inpatient and outpatient healthcare cases eligible for BSKY and PM-JAY subsidies will queue here automatically."
          phase="Phase 12 — Insurance, Assistance & Financing Engine"
          actionHref="/government"
          actionLabel="Return to Assistance Overview"
        />
      </div>
    </RoleGuard>
  );
}
