"use client";

import React from "react";
import { Settings, Pill, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function PharmacySettingsPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Pharmacy Retail License & Settings"
          description="Drug retail license details, connected hospital partner channels, and operational hours."
          breadcrumbs={[{ label: "Pharmacy Desk", href: "/pharmacy" }, { label: "Settings" }]}
        />

        <Card className="bg-white border-slate-200">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Pharmacy Retail Outlet
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {user?.organizationName || "ABC Pharmacy"} ({user?.identifier || "PHA-1001"})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 text-xs text-slate-600 space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">Retail Drug License (Form 20/21)</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                License: OD-DRUG-2021-9988 • Active Counter.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
