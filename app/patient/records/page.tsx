"use client";

import React from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PatientRecordsPage() {
  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Longitudinal Medical Records"
          description="Unified health timeline aggregating verified consultations, discharge summaries, and medical history."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Medical Records" }]}
        />

        <EmptyState
          icon={<FileText className="h-6 w-6 text-teal-600" />}
          title="Longitudinal Timeline Initialized"
          description="Authoritative clinical records will automatically aggregate here as you visit connected hospitals and specialists."
          phase="Phase 16 — Unified Healthcare Timeline"
          secondaryText="Zero duplicate records: Timeline aggregates authoritative clinical events across all MEDORA facilities."
          actionHref="/patient"
          actionLabel="Return to Patient Home"
        />
      </div>
    </RoleGuard>
  );
}
