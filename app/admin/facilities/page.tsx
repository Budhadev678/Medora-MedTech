"use client";

import React from "react";
import { Layers, MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function AdminFacilitiesPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Multi-Branch Facilities & Campuses"
          description="Manage physical hospital branches, diagnostic collection centres, and retail pharmacy outlets."
          breadcrumbs={[{ label: "Admin Console", href: "/admin" }, { label: "Facilities" }]}
        />

        <EmptyState
          icon={<Layers className="h-6 w-6 text-teal-600" />}
          title="Multi-Branch Facility Setup"
          description="Configure multi-location branches (e.g. Bhubaneswar Hub, Rourkela Trauma Center, Cuttack Clinic) under parent organizations in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/admin"
          actionLabel="Return to Governance Console"
        />
      </div>
    </RoleGuard>
  );
}
