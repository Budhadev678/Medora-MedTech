"use client";

import React from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PharmacyStaffPage() {
  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Registered Pharmacists & Counter Staff"
          description="Licensed pharmacists and dispensing staff appointed at this pharmacy outlet."
          breadcrumbs={[{ label: "Pharmacy Desk", href: "/pharmacy" }, { label: "Staff" }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white">
            <CardHeader className="p-4 pb-2">
              <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded w-fit">
                PHA-STAFF-1001
              </span>
              <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                Manoj Rath, B.Pharm
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-slate-600">
              <p><strong>Role:</strong> Chief Dispensing Pharmacist</p>
              <p className="text-slate-500">Pharmacy Council Reg: OPC-2016-5519</p>
            </CardContent>
          </Card>
        </div>

        <EmptyState
          icon={<Users className="h-6 w-6 text-emerald-600" />}
          title="Pharmacy Staff Directory"
          description="Dispensing licenses, counter shifts, and authorized signatories will be managed here in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/pharmacy"
          actionLabel="Return to Pharmacy Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
