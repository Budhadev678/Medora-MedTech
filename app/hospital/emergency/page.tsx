"use client";

import React from "react";
import { AlertTriangle, Ambulance, Droplet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function HospitalEmergencyPage() {
  return (
    <RoleGuard allowedRoles={["hospital_admin", "emergency_staff", "staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Emergency Trauma Command Unit"
          description="Trauma triage, operational doctor escalation, ambulance pre-alerts, and blood coordination."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Emergency Unit" }]}
        />

        <EmptyState
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          title="Emergency Triage & Trauma Desk"
          description="Color-coded triage (RED/YELLOW/GREEN), specialist escalation, and emergency medical snapshot access will operate here in Phase 13."
          phase="Phase 13 — Emergency Triage & Reassignment"
          actionHref="/hospital"
          actionLabel="Return to Command Center"
        />
      </div>
    </RoleGuard>
  );
}
