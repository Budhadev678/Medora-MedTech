"use client";

import React from "react";
import { CreditCard, FileSpreadsheet } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function FinanceApplicationsPage() {
  return (
    <RoleGuard allowedRoles={["finance_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Patient Treatment Financing Applications"
          description="CarePay micro-financing and zero-interest medical installment applications for elective and inpatient procedures."
          badgeText="Financing Applications"
          breadcrumbs={[{ label: "Finance Desk", href: "/finance" }, { label: "Applications" }]}
        />

        <EmptyState
          icon={<FileSpreadsheet className="h-6 w-6 text-emerald-600" />}
          title="No Financing Applications Pending"
          description="Instant eligibility approvals and patient EMI agreements will be reviewed and approved here in Phase 12."
          phase="Phase 12 — Insurance, Assistance & Financing Engine"
          actionHref="/finance"
          actionLabel="Return to Financing Overview"
        />
      </div>
    </RoleGuard>
  );
}
