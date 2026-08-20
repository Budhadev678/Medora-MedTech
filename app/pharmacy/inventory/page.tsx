"use client";

import React from "react";
import { Layers, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PharmacyInventoryPage() {
  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Medication Stock & Batch Inventory"
          description="Real-time medicine stock tracking, batch expiry alerts, and inventory reordering."
          breadcrumbs={[{ label: "Pharmacy Desk", href: "/pharmacy" }, { label: "Inventory" }]}
        />

        <EmptyState
          icon={<Layers className="h-6 w-6 text-emerald-600" />}
          title="Pharmacy Medicine Inventory Desk"
          description="Stock levels, batch numbers, MRP pricing, and low-stock alerts will operate here in Phase 9."
          phase="Phase 9 — Connected Pharmacy & Pickup"
          actionHref="/pharmacy"
          actionLabel="Return to Pharmacy Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
