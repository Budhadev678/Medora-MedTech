"use client";

import React from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function InsurancePoliciesPage() {
  return (
    <RoleGuard allowedRoles={["insurance_staff", "finance_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Active Policy Registry & Member Coverage"
          description="Track policy numbers, valid coverage dates, sum insured, and linked ABHA identifiers."
          breadcrumbs={[{ label: "Insurance Desk", href: "/insurance" }, { label: "Policies" }]}
        />

        <EmptyState
          icon={<FileText className="h-6 w-6 text-sky-600" />}
          title="Policyholder Verification Directory"
          description="Query active policies, check pre-existing disease exclusions, and manage family floater limits in Phase 12."
          phase="Phase 12 — Insurance & Financial Assistance"
          actionHref="/insurance"
          actionLabel="Return to Insurance Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
