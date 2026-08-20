"use client";

import React from "react";
import { Share2, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function DoctorReferralsPage() {
  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Clinical Specialist Referrals"
          description="Refer patients to specialist colleagues and cross-consulting departments across the MEDORA network."
          breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Referrals" }]}
        />

        <EmptyState
          icon={<Share2 className="h-6 w-6 text-teal-600" />}
          title="Inter-Specialist Referral Network"
          description="Send clinical referral handovers with attached diagnosis summaries to specialists across connected hospitals and clinics."
          phase="Phase 7 — Digital Consultation & Prescription"
          actionHref="/doctor"
          actionLabel="Return to Clinical Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
