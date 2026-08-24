"use client";

import React from "react";
import { Droplet, Layers } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function BloodInventoryPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "blood_staff", "staff", "admin", "emergency_staff", "doctor"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Blood Bank Units & Component Inventory"
          description="Packed Red Blood Cells (PRBC), Fresh Frozen Plasma (FFP), and Platelet concentrate storage logs with temperature control."
          badgeText="Blood Inventory"
          breadcrumbs={[{ label: "Blood Centre", href: "/blood-bank" }, { label: "Inventory" }]}
        />

        <EmptyState
          icon={<Layers className="h-6 w-6 text-rose-600" />}
          title="Blood Component Storage Ledger"
          description="Barcode-tagged blood unit stock counts and expiry trackers will be managed here in Phase 14."
          phase="Phase 14 — Emergency Blood Logistics & Matching"
          actionHref="/blood-bank"
          actionLabel="Return to Blood Desk"
        />
      </div>
    </RoleGuard>
  );
}
