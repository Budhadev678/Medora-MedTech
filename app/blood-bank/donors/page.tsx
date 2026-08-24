"use client";

import React from "react";
import { Droplet, Users } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function BloodDonorsPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "blood_staff", "staff", "admin", "emergency_staff", "doctor"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Verified Voluntary Blood Donors"
          description="Verified citizen donor registry categorized by ABO/Rh blood groups with eligibility and donation interval tracking."
          badgeText="Donor Registry"
          breadcrumbs={[{ label: "Blood Centre", href: "/blood-bank" }, { label: "Donors" }]}
        />

        <EmptyState
          icon={<Users className="h-6 w-6 text-rose-600" />}
          title="Citizen Donor Network"
          description="Geo-fenced emergency donor notifications and voluntary donation scheduling will activate in Phase 14."
          phase="Phase 14 — Emergency Blood Logistics & Matching"
          actionHref="/blood-bank"
          actionLabel="Return to Blood Desk"
        />
      </div>
    </RoleGuard>
  );
}
