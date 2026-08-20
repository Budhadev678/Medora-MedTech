"use client";

import React from "react";
import { Calendar, Clock, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PatientAppointmentsPage() {
  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="My Doctor Appointments"
          description="Scheduled outpatient consultations, hospital visits, and OPD tokens."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Appointments" }]}
        />

        <EmptyState
          icon={<Calendar className="h-6 w-6 text-teal-600" />}
          title="No Scheduled Appointments Yet"
          description="You do not have any upcoming doctor appointments or OPD tokens registered."
          phase="Phase 6 — Appointments & Queue Engine"
          secondaryText="Hospital discovery and real-time token booking will become active in Phase 6."
          actionHref="/patient"
          actionLabel="Return to Patient Home"
        />
      </div>
    </RoleGuard>
  );
}
