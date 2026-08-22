"use client";

import React from "react";
import { User, Building2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StaffProfilePage() {
  const { user, staffMemberships } = useAuth();
  const currentMembership = staffMemberships && staffMemberships.length > 0 ? staffMemberships[0] : null;

  return (
    <RoleGuard allowedRoles={["staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Staff Member Profile & Credentials"
          description="Verified healthcare staff credentials and facility membership appointment."
          breadcrumbs={[{ label: "Staff Workspace", href: "/staff" }, { label: "Profile" }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-slate-200">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-lg">
                  {user?.fullName?.charAt(0) || "S"}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    {user?.fullName || "Sunita Mohanty"}
                  </CardTitle>
                  <span className="font-mono text-xs font-semibold text-teal-700 block">
                    {user?.identifier || "STAFF-1001"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Role:</span>
                <span className="font-semibold text-slate-900">{currentMembership?.roleTitle || "Admissions & Front Desk Staff"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Hospital:</span>
                <span className="font-semibold text-slate-900">{currentMembership?.organizationName || "City Hospital"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
