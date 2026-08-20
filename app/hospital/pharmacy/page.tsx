"use client";

import React from "react";
import { Pill, Package } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function HospitalPharmacyPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "pharmacy_staff", "staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Hospital Pharmacy Dispensing Desk"
          description="Inpatient ward medication dispensing, discharge medicine packaging, and inventory stock."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Pharmacy" }]}
        />

        <EmptyState
          icon={<Pill className="h-6 w-6 text-emerald-600" />}
          title="Hospital Pharmacy Operations Desk"
          description="Prescription queues, barcode batch verification, and medication pickup fulfillment will operate here in Phase 9."
          phase="Phase 9 — Connected Pharmacy & Pickup"
          actionHref="/hospital"
          actionLabel="Return to Command Center"
        />
      </div>
    </RoleGuard>
  );
}
