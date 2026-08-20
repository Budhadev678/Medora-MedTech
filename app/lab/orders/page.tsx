"use client";

import React from "react";
import { ClipboardList, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function LabOrdersPage() {
  return (
    <RoleGuard allowedRoles={["lab_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Diagnostic Test Orders Queue"
          description="Incoming test orders from hospital OPDs, emergency wards, and external consulting doctors."
          breadcrumbs={[{ label: "Diagnostic Lab", href: "/lab" }, { label: "Test Orders" }]}
        />

        <EmptyState
          icon={<ClipboardList className="h-6 w-6 text-amber-600" />}
          title="Diagnostic Orders Intake Desk"
          description="Doctor investigation orders will populate here with priority tags, clinical indications, and patient ABHA references."
          phase="Phase 8 — Connected Laboratory System"
          actionHref="/lab"
          actionLabel="Return to Lab Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
