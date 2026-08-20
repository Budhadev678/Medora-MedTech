"use client";

import React from "react";
import { ClipboardList, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function InsuranceClaimsPage() {
  return (
    <RoleGuard allowedRoles={["insurance_staff", "finance_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Incoming Cashless Claims & Pre-Authorizations"
          description="Emergency pre-auth requests and final claim settlement submissions from hospitals."
          breadcrumbs={[{ label: "Insurance Desk", href: "/insurance" }, { label: "Incoming Claims" }]}
        />

        <EmptyState
          icon={<ClipboardList className="h-6 w-6 text-sky-600" />}
          title="Cashless Claims Adjudication Desk"
          description="Review hospital claim documents, itemized medical lineages, and diagnostic justifications in Phase 12."
          phase="Phase 12 — Insurance & Financial Assistance"
          actionHref="/insurance"
          actionLabel="Return to Insurance Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
