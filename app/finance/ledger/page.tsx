"use client";

import React from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function FinanceLedgerPage() {
  return (
    <RoleGuard allowedRoles={["finance_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Disbursement & Remittance Ledger"
          description="Audited hospital settlement batches, EMI collections, and lender transfer receipts."
          badgeText="Ledger"
          breadcrumbs={[{ label: "Finance Desk", href: "/finance" }, { label: "Disbursement Ledger" }]}
        />

        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
          title="Financing Ledger Active"
          description="Direct lender disbursements to hospital accounts will be logged and audited here in Phase 12."
          phase="Phase 12 — Insurance, Assistance & Financing Engine"
          actionHref="/finance"
          actionLabel="Return to Financing Overview"
        />
      </div>
    </RoleGuard>
  );
}
