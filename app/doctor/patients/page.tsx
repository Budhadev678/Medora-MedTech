"use client";

import React from "react";
import { Users, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function DoctorPatientsPage() {
  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Clinical Patients Registry"
          description="Patients with active consultations, clinical history, or scheduled appointments across your affiliated hospitals."
          breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Patients" }]}
        />

        <EmptyState
          icon={<Users className="h-6 w-6 text-teal-600" />}
          title="Active Patient Registry"
          description="Patients scheduled for OPD consultations or currently admitted under your care will be listed here with consent-controlled access."
          phase="Phase 6 — Appointments & Queue Flow"
          actionHref="/doctor"
          actionLabel="Return to Clinical Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
