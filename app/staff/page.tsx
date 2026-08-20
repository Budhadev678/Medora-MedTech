"use client";

import React from "react";
import Link from "next/link";
import { Activity, ClipboardList, Users, User, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export default function StaffDashboardPage() {
  const { user, staffMemberships } = useAuth();
  const currentMembership = staffMemberships && staffMemberships.length > 0 ? staffMemberships[0] : null;

  return (
    <RoleGuard allowedRoles={["staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Clinical & Operational Staff Workspace"
          description="Assigned department shifts, clinical tasks, and inpatient ward roster."
          badgeText="Active Shift"
          actions={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">
                {user?.identifier || "STAFF-1001"}
              </span>
            </div>
          }
        />

        {/* Staff Assignment Banner */}
        <Card className="bg-teal-50/50 border-teal-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900">
                Current Active Appointment
              </span>
              <Badge variant="teal" className="text-[10px]">Verified Member</Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-1">
              {currentMembership?.organizationName || "City Hospital"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Role: <strong>{currentMembership?.roleTitle || "Head Nurse"}</strong> • Department: <strong>{currentMembership?.departmentName || "Cardiology Ward"}</strong>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/staff/tasks" className="group">
            <Card className="bg-white hover:border-teal-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <Badge variant="warning" className="text-[10px]">4 Pending</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-teal-700 transition-colors">
                  My Clinical Tasks
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Vitals recording, medication administration, and patient intake checklist.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/staff/patients" className="group">
            <Card className="bg-white hover:border-blue-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">Ward 3</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-blue-700 transition-colors">
                  Assigned Inpatients
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  View patients admitted to your assigned ward and monitor vital trends.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/staff/profile" className="group">
            <Card className="bg-white hover:border-purple-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <Badge variant="teal" className="text-[10px]">Active</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-purple-700 transition-colors">
                  Staff ID & Shift Roster
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  View staff badge, employee registration, and weekly shift rotas.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </RoleGuard>
  );
}
