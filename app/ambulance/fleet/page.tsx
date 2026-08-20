"use client";

import React from "react";
import { Truck, Activity } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function AmbulanceFleetPage() {
  return (
    <RoleGuard allowedRoles={["ambulance_staff", "emergency_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Ambulance Fleet Status"
          description="GPS tracking, telemetry, oxygen levels, and crew readiness for Advanced Life Support (ALS) & Basic Life Support (BLS) units."
          badgeText="Fleet Management"
          breadcrumbs={[{ label: "Ambulance Console", href: "/ambulance" }, { label: "Available Fleet" }]}
        />

        <EmptyState
          icon={<Activity className="h-6 w-6 text-emerald-600" />}
          title="Fleet Telemetry Connected"
          description="Live vehicle status, GPS positions, and emergency medical equipment checks will be managed here in Phase 18."
          phase="Phase 18 — Road Accident Simulation & Transit Pre-Alert"
          actionHref="/ambulance"
          actionLabel="Return to Dispatch Console"
        />
      </div>
    </RoleGuard>
  );
}
