"use client";

import React from "react";
import { Landmark, Settings } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function GovernmentSettingsPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["government_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Government Scheme Directorate Settings"
          description="Scheme policy rules, maximum procedure ceilings, and hospital empaneled network criteria."
          badgeText="Scheme Settings"
          breadcrumbs={[{ label: "Government Desk", href: "/government" }, { label: "Settings" }]}
        />

        <Card className="bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-blue-600" />
              Empaneled Scheme Directorate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 text-xs text-slate-600 space-y-2">
            <p>
              Directorate Organization: <strong>{user?.organizationName || "Swasthya Assistance Directorate"}</strong>
            </p>
            <p className="font-mono text-slate-400">
              Government Official ID: {user?.identifier || "GOV-1001"}
            </p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
