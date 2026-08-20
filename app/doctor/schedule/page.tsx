"use client";

import React from "react";
import { Clock, Calendar, Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DoctorSchedulePage() {
  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Doctor Practice Schedule & Availability"
          description="Multi-hospital practice hours, slot capacity, and on-call availability settings."
          breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Schedule & Hours" }]}
        />

        {/* Multi-Facility Schedule Overview */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Active Weekly Hospital OPD Allocations
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Practicing under unified Doctor Identity DOC-1001
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">City Hospital (HSP-1001)</span>
                  <span className="text-slate-500">Mon, Wed, Fri • 09:00 AM - 01:00 PM • Room 102</span>
                </div>
                <Badge variant="teal" className="text-xs">Consultant</Badge>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Green Care Hospital (HSP-1002)</span>
                  <span className="text-slate-500">Tue, Thu • 02:00 PM - 05:00 PM • Visiting Suite 2</span>
                </div>
                <Badge variant="outline" className="text-xs">Visiting Specialist</Badge>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Green Care Clinic (CLN-1001)</span>
                  <span className="text-slate-500">Sat • 10:00 AM - 02:00 PM • Clinic Suite 1</span>
                </div>
                <Badge variant="outline" className="text-xs">Consultant</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <EmptyState
          icon={<Clock className="h-6 w-6 text-teal-600" />}
          title="Slot Availability & Leave Engine"
          description="Detailed slot capacity adjustments, emergency on-call shifts, and leave blocks will become configurable here."
          phase="Phase 4 — Doctor Schedule & Availability Engine"
          actionHref="/doctor"
          actionLabel="Return to Clinical Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
