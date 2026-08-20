"use client";

import React from "react";
import { Landmark, Users } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function GovernmentBeneficiariesPage() {
  return (
    <RoleGuard allowedRoles={["government_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Scheme Beneficiaries Registry"
          description="Verified BSKY, Ayushman Bharat PM-JAY, and National Health Mission registered citizens."
          badgeText="Beneficiaries"
          breadcrumbs={[{ label: "Government Desk", href: "/government" }, { label: "Beneficiaries" }]}
        />

        <EmptyState
          icon={<Users className="h-6 w-6 text-blue-600" />}
          title="Beneficiary Registry Active"
          description="Citizen ration card linkages, ABHA identifiers, and scheme balances will be queried here in Phase 12."
          phase="Phase 12 — Insurance, Assistance & Financing Engine"
          actionHref="/government"
          actionLabel="Return to Assistance Overview"
        />
      </div>
    </RoleGuard>
  );
}
