"use client";

import React from "react";
import { Clock, Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function LabTestingPage() {
  return (
    <RoleGuard allowedRoles={["lab_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Diagnostic Testing & Instrument Worklist"
          description="Analyzer worklists, biochemistry runs, hematology values, and abnormal flag detection."
          breadcrumbs={[{ label: "Diagnostic Lab", href: "/lab" }, { label: "Testing" }]}
        />

        <EmptyState
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          title="Instrument Worklist & Value Entry"
          description="Automated analyzer interfacing and manual parameter entry with automated reference range checks will operate here in Phase 8."
          phase="Phase 8 — Connected Laboratory System"
          actionHref="/lab"
          actionLabel="Return to Lab Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
