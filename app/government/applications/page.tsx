"use client";

import React from "react";
import { Landmark, FileText } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function GovernmentApplicationsPage() {
  return (
    <RoleGuard allowedRoles={["government_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Beneficiary Scheme Applications"
          description="Citizen applications for state healthcare scheme enrollment, income verification, and family health card issuance."
          badgeText="Applications"
          breadcrumbs={[{ label: "Government Desk", href: "/government" }, { label: "Applications" }]}
        />

        <EmptyState
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          title="No Scheme Applications Awaiting Review"
          description="Citizen registrations and health card enrollment verifications will be handled here in Phase 12."
          phase="Phase 12 — Insurance, Assistance & Financing Engine"
          actionHref="/government"
          actionLabel="Return to Assistance Overview"
        />
      </div>
    </RoleGuard>
  );
}
