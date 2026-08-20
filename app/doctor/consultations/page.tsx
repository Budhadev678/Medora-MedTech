"use client";

import React from "react";
import { Stethoscope, FileText, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function DoctorConsultationsPage() {
  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Clinical Consultation Suite"
          description="Encounter notes, vitals review, clinical assessments, and diagnosis recording."
          breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Consultation Suite" }]}
        />

        <EmptyState
          icon={<Stethoscope className="h-6 w-6 text-teal-600" />}
          title="Digital Clinical Encounter Suite"
          description="Conduct consultations, review patient health histories, record vitals, and author digitally signed treatment plans."
          phase="Phase 7 — Digital Consultation & Prescription"
          actionHref="/doctor"
          actionLabel="Return to Clinical Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
