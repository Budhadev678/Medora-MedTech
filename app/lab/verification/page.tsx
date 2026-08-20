"use client";

import React from "react";
import { FileCheck, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function LabVerificationPage() {
  return (
    <RoleGuard allowedRoles={["lab_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Pathologist Review & Clinical Verification"
          description="Pathologist clinical sign-off, critical value re-testing, and digital signature authorization."
          breadcrumbs={[{ label: "Diagnostic Lab", href: "/lab" }, { label: "Verification" }]}
        />

        <EmptyState
          icon={<FileCheck className="h-6 w-6 text-amber-600" />}
          title="Pathologist Verification Suite"
          description="Qualified pathologist review desk to verify analyzer results and apply tamper-evident cryptographic digital signatures."
          phase="Phase 8 — Connected Laboratory System"
          actionHref="/lab"
          actionLabel="Return to Lab Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
