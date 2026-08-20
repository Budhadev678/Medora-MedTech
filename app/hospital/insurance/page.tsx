"use client";

import React from "react";
import { Shield, FileCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function HospitalInsurancePage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "finance_staff", "staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Hospital Insurance & Claims Desk"
          description="Pre-authorization processing, cashless claim settlement, and scheme assistance tracking."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Insurance Desk" }]}
        />

        <EmptyState
          icon={<Shield className="h-6 w-6 text-sky-600" />}
          title="Cashless Insurance & Scheme Pre-Auth Desk"
          description="Real-time policy verification, cashless admissions, and claim dispute management will operate here in Phase 12."
          phase="Phase 12 — Insurance & Financial Assistance"
          actionHref="/hospital"
          actionLabel="Return to Command Center"
        />
      </div>
    </RoleGuard>
  );
}
