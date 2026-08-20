"use client";

import React from "react";
import { CreditCard, Receipt } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function FinanceSplitsPage() {
  return (
    <RoleGuard allowedRoles={["finance_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Multi-Source Settlement Splits"
          description="Transparent split accounting: Insurance pre-auth + Government BSKY subsidy + Micro-financing + Patient out-of-pocket balance."
          badgeText="Cost Splits"
          breadcrumbs={[{ label: "Finance Desk", href: "/finance" }, { label: "Multi-Source Splits" }]}
        />

        <EmptyState
          icon={<Receipt className="h-6 w-6 text-teal-600" />}
          title="Real-Time Split Settlement Engine"
          description="Direct multi-payer settlement reconciliation will execute here automatically during hospital discharge in Phase 10 & 12."
          phase="Phase 10 — Itemized Billing & Why Charged"
          actionHref="/finance"
          actionLabel="Return to Financing Overview"
        />
      </div>
    </RoleGuard>
  );
}
