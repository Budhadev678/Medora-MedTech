"use client";

import React from "react";
import { Layers, QrCode } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function LabSamplesPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "lab_staff", "staff", "admin", "doctor"]}>
      <div className="space-y-4">
        <PageHeader
          title="Specimen Intake & Barcode Tracking"
          description="Specimen collection, barcode accessioning, and chain-of-custody verification."
          breadcrumbs={[{ label: "Diagnostic Lab", href: "/lab" }, { label: "Sample Intake" }]}
        />

        <EmptyState
          icon={<Layers className="h-6 w-6 text-amber-600" />}
          title="Specimen Accessioning Desk"
          description="Blood, urine, serum, and biopsy specimen barcoding (e.g. SMP-1024) and intake validation will operate here in Phase 8."
          phase="Phase 8 — Connected Laboratory System"
          actionHref="/lab"
          actionLabel="Return to Lab Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
