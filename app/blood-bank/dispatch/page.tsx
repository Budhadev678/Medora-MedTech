"use client";

import React from "react";
import { Droplet, Truck } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function BloodDispatchPage() {
  return (
    <RoleGuard allowedRoles={["blood_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Blood Unit Cold-Chain Dispatch"
          description="Cold-chain container tracking, delivery couriers, and hospital trauma unit receiving handoffs."
          badgeText="Dispatch Logistics"
          breadcrumbs={[{ label: "Blood Centre", href: "/blood-bank" }, { label: "Dispatch Logistics" }]}
        />

        <EmptyState
          icon={<Truck className="h-6 w-6 text-rose-600" />}
          title="Emergency Blood Dispatch Active"
          description="Secure cold-chain transit verification and hospital emergency receiving receipts will be confirmed here in Phase 14."
          phase="Phase 14 — Emergency Blood Logistics & Matching"
          actionHref="/blood-bank"
          actionLabel="Return to Blood Desk"
        />
      </div>
    </RoleGuard>
  );
}
