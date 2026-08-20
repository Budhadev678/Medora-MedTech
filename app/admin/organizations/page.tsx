"use client";

import React from "react";
import { Building2, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function AdminOrganizationsPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Healthcare Organizations Registry"
          description="Hospitals, diagnostic chains, pharmacy networks, blood centres, and insurance partners."
          breadcrumbs={[{ label: "Admin Console", href: "/admin" }, { label: "Organizations" }]}
        />

        <EmptyState
          icon={<Building2 className="h-6 w-6 text-teal-600" />}
          title="Organization Entity Registry"
          description="Onboard parent healthcare groups, pharmacy brands, and diagnostic organizations in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/admin"
          actionLabel="Return to Governance Console"
        />
      </div>
    </RoleGuard>
  );
}
