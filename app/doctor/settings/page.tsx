"use client";

import React from "react";
import { Settings, ShieldCheck, Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function DoctorSettingsPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Clinical Account & Workspace Preferences"
          description="Manage security preferences, OPD notification triggers, and practice details."
          breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Settings" }]}
        />

        <Card className="bg-white border-slate-200">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Identity & Security Settings
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Account credentials for {user?.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 text-xs text-slate-600 space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Row-Level Security & Access Isolation</span>
              <p className="text-[11px] text-slate-500">
                Your clinical workspace permissions are strictly enforced at the database level using verified Supabase auth sessions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
