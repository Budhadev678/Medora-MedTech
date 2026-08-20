"use client";

import React from "react";
import { CreditCard, HandHeart } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function FinancePlansPage() {
  return (
    <RoleGuard allowedRoles={["finance_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="CarePay Financing & EMI Plans"
          description="Configured patient financial assistance products, tenure limits, and partner hospital agreements."
          badgeText="CarePay Plans"
          breadcrumbs={[{ label: "Finance Desk", href: "/finance" }, { label: "Micro-Financing Plans" }]}
        />

        <EmptyState
          icon={<HandHeart className="h-6 w-6 text-purple-600" />}
          title="Financing Product Catalogue"
          description="Zero-cost healthcare credit plans and micro-loan configurations will be managed here in Phase 12."
          phase="Phase 12 — Insurance, Assistance & Financing Engine"
          actionHref="/finance"
          actionLabel="Return to Financing Overview"
        />
      </div>
    </RoleGuard>
  );
}
