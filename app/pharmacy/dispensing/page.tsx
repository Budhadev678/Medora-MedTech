"use client";

import React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PharmacyDispensingPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "pharmacy_staff", "staff", "admin", "doctor"]}>
      <div className="space-y-4">
        <PageHeader
          title="Dispensing Audit & Records"
          description="Authoritative dispensing log tracking WHO, WHEN, WHAT, and TO WHOM medicines were dispensed."
          breadcrumbs={[{ label: "Pharmacy Desk", href: "/pharmacy" }, { label: "Dispensing Desk" }]}
        />

        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
          title="Authoritative Dispensing Ledger"
          description="Dispensing event records with registered pharmacist signatory and digital timestamps will operate here in Phase 9."
          phase="Phase 9 — Connected Pharmacy & Pickup"
          actionHref="/pharmacy"
          actionLabel="Return to Pharmacy Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
