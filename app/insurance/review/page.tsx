"use client";

import React from "react";
import { FileSearch, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function InsuranceReviewPage() {
  return (
    <RoleGuard allowedRoles={["insurance_staff", "finance_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Clinical Pre-Authorization Review"
          description="Medical officer review of ICU admissions, surgery estimates, and diagnostic necessity."
          breadcrumbs={[{ label: "Insurance Desk", href: "/insurance" }, { label: "Pre-Auth Review" }]}
        />

        <EmptyState
          icon={<FileSearch className="h-6 w-6 text-sky-600" />}
          title="Pre-Authorization Review Station"
          description="Medical adjudicator desk to issue Initial Approval Letters (IAL) and approve enhanced limits in Phase 12."
          phase="Phase 12 — Insurance & Financial Assistance"
          actionHref="/insurance"
          actionLabel="Return to Insurance Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
