"use client";

import React from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function HospitalPatientsPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Hospital Patients Directory"
          description="Inpatients, emergency admissions, and outpatient registrations at this hospital facility."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Patients" }]}
        />

        <EmptyState
          icon={<Users className="h-6 w-6 text-teal-600" />}
          title="Hospital Inpatient & Outpatient Records"
          description="Patients admitted across departments and registered at OPD desks will be listed here."
          phase="Phase 6 — Appointments & Queue Flow"
          actionHref="/hospital"
          actionLabel="Return to Command Center"
        />
      </div>
    </RoleGuard>
  );
}
