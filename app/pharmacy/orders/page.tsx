"use client";

import React from "react";
import { Package, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PharmacyOrdersPage() {
  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Medication Packaging & Pickup Orders"
          description="Inpatient ward orders, counter pickups, and home delivery packaging requests."
          breadcrumbs={[{ label: "Pharmacy Desk", href: "/pharmacy" }, { label: "Orders" }]}
        />

        <EmptyState
          icon={<Package className="h-6 w-6 text-emerald-600" />}
          title="Medication Packaging Worklist"
          description="Track prescription packaging stages (RECEIVED $\rightarrow$ VERIFIED $\rightarrow$ PREPARING $\rightarrow$ READY $\rightarrow$ DISPENSED) in Phase 9."
          phase="Phase 9 — Connected Pharmacy & Pickup"
          actionHref="/pharmacy"
          actionLabel="Return to Pharmacy Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
