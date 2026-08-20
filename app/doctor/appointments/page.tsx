"use client";

import React from "react";
import { Calendar, Clock, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function DoctorAppointmentsPage() {
  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Doctor Outpatient Appointments"
          description="View, reschedule, and manage OPD slots across all affiliated healthcare facilities."
          breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Appointments" }]}
        />

        <EmptyState
          icon={<Calendar className="h-6 w-6 text-teal-600" />}
          title="OPD Appointment Calendar"
          description="Patient appointment bookings and real-time clinic slots will be managed here."
          phase="Phase 6 — Appointments & Token/Queue Flow"
          actionHref="/doctor"
          actionLabel="Return to Clinical Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
