"use client";

import React from "react";
import { Package, MapPin, Store } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PatientPharmacyPage() {
  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Connected Pharmacy & Pickup"
          description="Open-fulfillment network allowing you to fulfill digital prescriptions at any verified pharmacy."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Pharmacy" }]}
        />

        <EmptyState
          icon={<Package className="h-6 w-6 text-teal-600" />}
          title="Open Prescription Fulfillment Desk"
          description="Prescriptions are never locked to one hospital. You can select hospital pharmacies, local chemist counters, or connected delivery partners."
          phase="Phase 9 — Connected Pharmacy & Pickup"
          secondaryText="Prescription lookup, medicine packaging status, and contactless dispensing will become active in Phase 9."
          actionHref="/patient"
          actionLabel="Return to Patient Home"
        />
      </div>
    </RoleGuard>
  );
}
