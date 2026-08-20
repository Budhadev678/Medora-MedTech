"use client";

import React from "react";
import { Settings, Building2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function HospitalSettingsPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["hospital_admin", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Hospital Facility Settings & Governance"
          description="Facility license numbers, emergency contact channels, and multi-branch infrastructure."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Settings" }]}
        />

        <Card className="bg-white border-slate-200">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Facility Registration
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {user?.organizationName || "City Hospital"} ({user?.identifier || "HSP-1001"})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 text-xs text-slate-600 space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">Verified Healthcare Facility</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                License: ODISHA-MED-2022-8819 • Multi-Branch Hub (Bhubaneswar, Rourkela, Cuttack).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
