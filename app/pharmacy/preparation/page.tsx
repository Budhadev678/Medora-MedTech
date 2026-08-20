"use client";

import React from "react";
import { Clock, CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PharmacyPreparationPage() {
  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Medication Packaging & Quality Verification"
          description="Batch matching, dosage check, expiry inspection, and packaging verification."
          breadcrumbs={[{ label: "Pharmacy Desk", href: "/pharmacy" }, { label: "Preparation" }]}
        />

        <EmptyState
          icon={<Clock className="h-6 w-6 text-emerald-600" />}
          title="Pharmacy Preparation Worktable"
          description="Pharmacist medication dispensing verification and safety label generation will operate here in Phase 9."
          phase="Phase 9 — Connected Pharmacy & Pickup"
          actionHref="/pharmacy"
          actionLabel="Return to Pharmacy Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
