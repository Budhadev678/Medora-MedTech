"use client";

import React from "react";
import { FlaskConical, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function HospitalLaboratoryPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "lab_staff", "staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Hospital Diagnostic Laboratory Operations"
          description="Manage connected internal and external pathology labs, specimen intake, and verified reports."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Laboratory" }]}
        />

        <EmptyState
          icon={<FlaskConical className="h-6 w-6 text-amber-600" />}
          title="Hospital Diagnostic Pathology Workspace"
          description="Inpatient lab requests, sample barcoding, analyzer verification, and certified report release will operate here in Phase 8."
          phase="Phase 8 — Connected Laboratory System"
          actionHref="/hospital"
          actionLabel="Return to Command Center"
        />
      </div>
    </RoleGuard>
  );
}
