"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function HospitalAppointmentsPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Facility Outpatient Queue & Appointments"
          description="Manage hospital-wide OPD queues, token allocation, and specialist scheduling."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Appointments" }]}
        />

        <EmptyState
          icon={<Calendar className="h-6 w-6 text-teal-600" />}
          title="Hospital Central OPD Queue Manager"
          description="Live token dispensers, room queues, and doctor schedule allocations will operate here in Phase 6."
          phase="Phase 6 — Appointments & Token/Queue Flow"
          actionHref="/hospital"
          actionLabel="Return to Command Center"
        />
      </div>
    </RoleGuard>
  );
}
