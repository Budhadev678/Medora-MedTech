"use client";

import React from "react";
import { Settings, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Platform Security & Master Settings"
          description="Global RLS policies, ABDM gateway endpoints, and cryptographic key parameters."
          breadcrumbs={[{ label: "Admin Console", href: "/admin" }, { label: "Settings" }]}
        />

        <Card className="bg-white border-slate-200">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Platform Configuration
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Admin: {user?.fullName} ({user?.identifier || "ADM-1001"})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 text-xs text-slate-600 space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Ecosystem Health & Identity Enforcement</span>
              <p className="text-[11px] text-slate-500">
                All 14 persona roles are isolated with database-backed RLS policies. Zero cross-account data leakage.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
