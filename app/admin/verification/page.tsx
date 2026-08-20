"use client";

import React from "react";
import { FileCheck, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function AdminVerificationPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Practitioner License & Facility Verification"
          description="Verify doctor medical council registration numbers, hospital licenses, and lab NABL accreditations."
          breadcrumbs={[{ label: "Admin Console", href: "/admin" }, { label: "Verification" }]}
        />

        <EmptyState
          icon={<FileCheck className="h-6 w-6 text-teal-600" />}
          title="Clinical Credential Verification Desk"
          description="Review submitted MCI/NMC council registration certificates, pharmacy drug licenses, and clinical establishment acts in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/admin"
          actionLabel="Return to Governance Console"
        />
      </div>
    </RoleGuard>
  );
}
