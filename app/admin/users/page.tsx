"use client";

import React from "react";
import { Users, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";

export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Ecosystem User Accounts Directory"
          description="View and govern registered patients, healthcare providers, and administrative staff accounts."
          breadcrumbs={[{ label: "Admin Console", href: "/admin" }, { label: "User Accounts" }]}
        />

        <EmptyState
          icon={<Users className="h-6 w-6 text-teal-600" />}
          title="Ecosystem Identity Registry"
          description="Manage registered user profiles, account statuses (ACTIVE/SUSPENDED), and role allocations in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/admin"
          actionLabel="Return to Governance Console"
        />
      </div>
    </RoleGuard>
  );
}
