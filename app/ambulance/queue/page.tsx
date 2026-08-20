"use client";

import React from "react";
import { Truck, AlertTriangle } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function AmbulanceQueuePage() {
  return (
    <RoleGuard allowedRoles={["ambulance_staff", "emergency_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Emergency Dispatch Queue"
          description="Incoming emergency SOS triggers, trauma scene alerts, and hospital pre-alerts awaiting fleet assignment."
          badgeText="Emergency Queue"
          breadcrumbs={[{ label: "Ambulance Console", href: "/ambulance" }, { label: "Emergency Queue" }]}
        />

        <EmptyState
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          title="No Emergency Calls Queued"
          description="Real-time citizen SOS alarms and highway trauma detection tickets will stream here directly in Phase 18."
          phase="Phase 18 — Road Accident Simulation & Transit Pre-Alert"
          actionHref="/ambulance"
          actionLabel="Return to Dispatch Console"
        />
      </div>
    </RoleGuard>
  );
}
