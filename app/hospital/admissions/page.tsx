"use client";

import React from "react";
import { BedDouble, Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function HospitalAdmissionsPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Inpatient Ward & Bed Occupancy"
          description="Track inpatient admissions, ICU bed availability, and ward transfers."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Admissions & Beds" }]}
        />

        <EmptyState
          icon={<BedDouble className="h-6 w-6 text-teal-600" />}
          title="Inpatient Bed Occupancy Manager"
          description="Real-time 250-bed occupancy tracking, ICU triage, and discharge summaries will become active in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/hospital"
          actionLabel="Return to Command Center"
        />
      </div>
    </RoleGuard>
  );
}
