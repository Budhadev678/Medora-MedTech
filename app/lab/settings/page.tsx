"use client";

import React from "react";
import { Settings, FlaskConical, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function LabSettingsPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["lab_staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Laboratory Accreditation & Settings"
          description="NABL accreditation, instrument interface channels, and digital signing certificates."
          breadcrumbs={[{ label: "Diagnostic Lab", href: "/lab" }, { label: "Settings" }]}
        />

        <Card className="bg-white border-slate-200">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Laboratory Facility Registration
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {user?.organizationName || "ABC Diagnostics"} ({user?.identifier || "LAB-1001"})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 text-xs text-slate-600 space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">NABL Accredited Facility</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Accreditation: NABL-MC-2023-4412 • Primary Hub (Bhubaneswar).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
