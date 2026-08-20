"use client";

import React from "react";
import { Users, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function HospitalStaffPage() {
  const staffMembers = [
    { name: "Sunita Mohanty", role: "Head Nurse", dept: "Cardiology Inpatient Ward", id: "STAFF-1001" },
    { name: "Manoj Rath", role: "Chief Pharmacist", dept: "Hospital Pharmacy Desk", id: "STAFF-1002" },
    { name: "Pooja Das", role: "Billing Executive", dept: "Hospital Accounts Desk", id: "STAFF-1003" },
  ];

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Hospital Clinical & Operational Staff"
          description="Nurses, ward technicians, pharmacists, and billing personnel appointed at this facility."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Staff Roster" }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {staffMembers.map((st) => (
            <Card key={st.id} className="bg-white">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    {st.id}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">● Active</span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                  {st.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-slate-600 space-y-1">
                <p><strong>Designation:</strong> {st.role}</p>
                <p className="text-slate-500">{st.dept}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <EmptyState
          icon={<Users className="h-6 w-6 text-teal-600" />}
          title="Staff Membership & Shift Rostering"
          description="Detailed duty rotas, department access permissions, and clinical handover tracking will become active in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/hospital"
          actionLabel="Return to Command Center"
        />
      </div>
    </RoleGuard>
  );
}
