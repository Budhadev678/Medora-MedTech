"use client";

import React from "react";
import Link from "next/link";
import { 
  Building2, 
  Users, 
  Stethoscope, 
  Calendar, 
  Receipt, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Layers,
  Settings
} from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { MetricCard } from "@/components/professional/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ClinicDashboardPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["hospital_admin", "doctor", "staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Outpatient Clinic Operations"
          description="General medicine, pediatric outpatient consults, day clinic appointment scheduling, and patient intake."
          facilityContext={user?.organizationName || "Green Care Clinic (CLN-1001)"}
          badgeText="OPD Active"
          actions={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">
                {user?.identifier || "CLN-1001"}
              </span>
            </div>
          }
        />

        {/* Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Today's OPD Queue"
            value="12 Tokens"
            subtext="Consultation Room 1 Active"
            badge="Live"
            icon={<Clock className="h-4 w-4 text-teal-600" />}
          />
          <MetricCard
            label="Consulting Doctors"
            value="3 Active"
            subtext="Dr. Ananya Sharma on duty"
            icon={<Stethoscope className="h-4 w-4 text-blue-600" />}
          />
          <MetricCard
            label="Appointments (Today)"
            value="18 Booked"
            subtext="9 Checked-in"
            icon={<Calendar className="h-4 w-4 text-emerald-600" />}
          />
          <MetricCard
            label="Day Clinic Receipts"
            value="₹9,400"
            subtext="14 Encounters settled"
            icon={<Receipt className="h-4 w-4 text-purple-600" />}
          />
        </div>

        {/* Clinic Module Quick Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/hospital/doctors" className="group">
            <Card className="bg-white hover:border-teal-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <Badge variant="teal" className="text-[10px]">3 Specialists</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-teal-700 transition-colors">
                  Consulting Physicians
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Affiliated doctors and visiting specialists consulting at this clinic branch.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/hospital/appointments" className="group">
            <Card className="bg-white hover:border-blue-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">OPD Tokens</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-blue-700 transition-colors">
                  Clinic Appointments & Queue
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Day clinic appointment slots, walk-in tokens, and room allocation.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/hospital/billing" className="group">
            <Card className="bg-white hover:border-purple-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <Badge variant="teal" className="text-[10px]">Transparent</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-purple-700 transition-colors">
                  OPD Invoicing & Receipts
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Itemized OPD consultation bills with digital payment settlement.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Empty State placeholder for Phase 5 Clinic Service Customizer */}
        <EmptyState
          icon={<Building2 className="h-6 w-6 text-teal-600" />}
          title="Outpatient Clinic Management Desk"
          description="Clinic specialty offerings (General Medicine, Pediatrics, Dental), visiting doctor hours, and local pharmacy fulfillment will be fully configurable in Phase 5."
          phase="Phase 5 — Hospital, Department & Facility Setup"
          actionHref="/doctor"
          actionLabel="Go to Doctor Clinical Workspace"
        />
      </div>
    </RoleGuard>
  );
}
