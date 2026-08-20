"use client";

import React from "react";
import { Truck, Building2 } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function AmbulanceTransfersPage() {
  return (
    <RoleGuard allowedRoles={["ambulance_staff", "emergency_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Inter-Hospital Patient Transfers"
          description="Coordinated tertiary referrals and critical care patient transfers between healthcare campuses."
          badgeText="Hospital Transfers"
          breadcrumbs={[{ label: "Ambulance Console", href: "/ambulance" }, { label: "Transfers" }]}
        />

        <EmptyState
          icon={<Building2 className="h-6 w-6 text-teal-600" />}
          title="Inter-Facility Transfer Coordinator"
          description="Automated hospital bed pre-checks and direct transfer handoffs will be orchestrated here in Phase 18."
          phase="Phase 18 — Road Accident Simulation & Transit Pre-Alert"
          actionHref="/ambulance"
          actionLabel="Return to Dispatch Console"
        />
      </div>
    </RoleGuard>
  );
}
