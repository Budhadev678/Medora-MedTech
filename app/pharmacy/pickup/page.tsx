"use client";

import React from "react";
import { User, QrCode } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PharmacyPickupPage() {
  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Patient Counter Pickup & Identity Check"
          description="Verify patient MEDORA ID / QR token before handing over dispensed medicines."
          breadcrumbs={[{ label: "Pharmacy Desk", href: "/pharmacy" }, { label: "Pickup" }]}
        />

        <EmptyState
          icon={<User className="h-6 w-6 text-emerald-600" />}
          title="Patient Pickup Verification Desk"
          description="Scan patient pickup QR or verify OTP identity before dispensing medications to prevent unauthorized handover."
          phase="Phase 9 — Connected Pharmacy & Pickup"
          actionHref="/pharmacy"
          actionLabel="Return to Pharmacy Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
