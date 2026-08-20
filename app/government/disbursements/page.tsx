"use client";

import React from "react";
import { Landmark, CreditCard } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function GovernmentDisbursementsPage() {
  return (
    <RoleGuard allowedRoles={["government_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Direct Hospital Disbursements"
          description="Electronic fund transfers and government treasury reimbursements settled to accredited hospital bank accounts."
          badgeText="Disbursements"
          breadcrumbs={[{ label: "Government Desk", href: "/government" }, { label: "Disbursements" }]}
        />

        <EmptyState
          icon={<CreditCard className="h-6 w-6 text-blue-600" />}
          title="Disbursement Ledger Active"
          description="Audited hospital settlement batches and electronic treasury remittances will be tracked here in Phase 12."
          phase="Phase 12 — Insurance, Assistance & Financing Engine"
          actionHref="/government"
          actionLabel="Return to Assistance Overview"
        />
      </div>
    </RoleGuard>
  );
}
