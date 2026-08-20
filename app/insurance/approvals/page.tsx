"use client";

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function InsuranceApprovalsPage() {
  return (
    <RoleGuard allowedRoles={["insurance_staff", "finance_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Claim Decision Letters & Approvals"
          description="Approved claim authorization vouchers, partial approvals, and rejection rationales."
          breadcrumbs={[{ label: "Insurance Desk", href: "/insurance" }, { label: "Approvals" }]}
        />

        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
          title="Adjudication Decisions Archive"
          description="Generate tamper-evident approval certificates and item-level deduction summaries in Phase 12."
          phase="Phase 12 — Insurance & Financial Assistance"
          actionHref="/insurance"
          actionLabel="Return to Insurance Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
