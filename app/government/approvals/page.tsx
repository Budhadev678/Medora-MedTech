"use client";

import React from "react";
import { Landmark, CheckCircle2 } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function GovernmentApprovalsPage() {
  return (
    <RoleGuard allowedRoles={["government_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Subsidy Pre-Auth Approvals"
          description="Issued pre-authorization decision vouchers and subsidy grant certificates for hospital procedures."
          badgeText="Approvals"
          breadcrumbs={[{ label: "Government Desk", href: "/government" }, { label: "Subsidy Approvals" }]}
        />

        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
          title="No Subsidy Approvals Queued"
          description="Audited subsidy vouchers issued to hospitals will archive here for direct fund release."
          phase="Phase 12 — Insurance, Assistance & Financing Engine"
          actionHref="/government"
          actionLabel="Return to Assistance Overview"
        />
      </div>
    </RoleGuard>
  );
}
