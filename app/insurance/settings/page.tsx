"use client";

import React from "react";
import { Settings, Shield, Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function InsuranceSettingsPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["insurance_staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Insurance Organization & IRDAI Settings"
          description="IRDAI regulatory registration, network hospital integration endpoints, and adjudication rules."
          breadcrumbs={[{ label: "Insurance Desk", href: "/insurance" }, { label: "Settings" }]}
        />

        <Card className="bg-white border-slate-200">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Payer Organization Details
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {user?.organizationName || "ABC Insurance"} ({user?.identifier || "INS-1001"})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 text-xs text-slate-600 space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">IRDAI Registered Health Insurer</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Registration: IRDAI-HLTH-2020-0012 • Cashless Provider Network.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
