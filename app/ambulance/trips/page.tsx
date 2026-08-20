"use client";

import React from "react";
import { Truck, Clock } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function AmbulanceTripsPage() {
  return (
    <RoleGuard allowedRoles={["ambulance_staff", "emergency_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Active Transit & Trips Log"
          description="Real-time emergency transit journeys with estimated time of arrival (ETA) and route optimization."
          badgeText="Transit Trips"
          breadcrumbs={[{ label: "Ambulance Console", href: "/ambulance" }, { label: "Active Trips" }]}
        />

        <EmptyState
          icon={<Clock className="h-6 w-6 text-blue-600" />}
          title="No Active Transit Trips"
          description="Active patient transit logs and destination hospital delivery timestamps will be archived here in Phase 18."
          phase="Phase 18 — Road Accident Simulation & Transit Pre-Alert"
          actionHref="/ambulance"
          actionLabel="Return to Dispatch Console"
        />
      </div>
    </RoleGuard>
  );
}
