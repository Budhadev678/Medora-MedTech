"use client";

import React from "react";
import { Receipt, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function HospitalBillingPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "finance_staff", "staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Hospital Invoices & Lineage Billing"
          description="Generate transparent, itemized hospital invoices with clinical event traceability and version history."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Billing & Invoices" }]}
        />

        <EmptyState
          icon={<Receipt className="h-6 w-6 text-purple-600" />}
          title="Hospital Transparent Billing Engine"
          description="Automated clinical event aggregation, line-item pricing lineage, and split-settlements will operate here in Phase 10."
          phase="Phase 10 — Itemized Billing & Why Charged"
          actionHref="/hospital"
          actionLabel="Return to Command Center"
        />
      </div>
    </RoleGuard>
  );
}
