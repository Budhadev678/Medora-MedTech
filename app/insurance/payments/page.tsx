"use client";

import React from "react";
import { CreditCard, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function InsurancePaymentsPage() {
  return (
    <RoleGuard allowedRoles={["insurance_staff", "finance_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Direct Hospital Settlement & Disbursements"
          description="Batch NEFT/RTGS payments, UTR tracking, and payer reconciliation statements."
          breadcrumbs={[{ label: "Insurance Desk", href: "/insurance" }, { label: "Disbursements" }]}
        />

        <EmptyState
          icon={<CreditCard className="h-6 w-6 text-purple-600" />}
          title="Direct Hospital Disbursement Desk"
          description="Execute electronic batch fund disbursements directly to hospital bank accounts upon discharge in Phase 12."
          phase="Phase 12 — Insurance & Financial Assistance"
          actionHref="/insurance"
          actionLabel="Return to Insurance Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
