"use client";

import React, { useState } from "react";
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
  Activity,
  ShieldCheck,
} from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { MetricCard } from "@/components/professional/metric-card";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFacilityById } from "@/lib/data/facility-store";
import { getDepartmentsForFacility } from "@/lib/data/department-store";
import { getFacilityDoctors } from "@/lib/data/affiliation-store";
import { getServicesForFacility } from "@/lib/data/service-store";

export default function ClinicDashboardPage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-2001";
  const facility = getFacilityById(facilityCode) || getFacilityById("FAC-2001");

  const [departments] = useState(() => getDepartmentsForFacility(facility?.facility_code || "FAC-2001"));
  const [doctors] = useState(() => getFacilityDoctors(facility?.facility_code || "FAC-2001"));
  const [services] = useState(() => getServicesForFacility(facility?.facility_code || "FAC-2001"));

  return (
    <RoleGuard allowedRoles={["hospital_admin", "doctor", "staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Outpatient Clinic Operations"
          description="General medicine, pediatric outpatient consults, day clinic appointment scheduling, and patient intake."
          facilityContext={facility ? `${facility.name} (${facility.facility_code})` : "Green Care Clinic (FAC-2001)"}
          badgeText="OPD Active"
          actions={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                {facility?.facility_code || "FAC-2001"}
              </span>
            </div>
          }
        />

        {/* Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Clinical Units"
            value={`${departments.length} Units`}
            subtext="Primary care & pediatrics"
            badge="Configured"
            icon={<Layers className="h-4 w-4 text-teal-600" />}
          />
          <MetricCard
            label="Consulting Doctors"
            value={`${doctors.length} Doctors`}
            subtext={doctors[0]?.doctor_name || "Specialists on duty"}
            icon={<Stethoscope className="h-4 w-4 text-blue-600" />}
          />
          <MetricCard
            label="Clinical Services"
            value={`${services.length} Services`}
            subtext="Consultations & screenings"
            icon={<Activity className="h-4 w-4 text-emerald-600" />}
          />
          <MetricCard
            label="Facility Status"
            value={facility?.status || "ACTIVE"}
            subtext={facility?.city || "Cuttack"}
            icon={<Building2 className="h-4 w-4 text-purple-600" />}
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
                  <Badge variant="teal" className="text-[10px]">{doctors.length} Doctors</Badge>
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

          <Link href="/hospital/services" className="group">
            <Card className="bg-white hover:border-blue-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Activity className="h-4 w-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">{services.length} Services</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-blue-700 transition-colors">
                  Clinic Services & Procedures
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Outpatient consults, immunizations, and clinical packages offered here.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/hospital/departments" className="group">
            <Card className="bg-white hover:border-purple-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Layers className="h-4 w-4" />
                  </div>
                  <Badge variant="teal" className="text-[10px]">{departments.length} Units</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-purple-700 transition-colors">
                  Outpatient Departments
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  General medicine, pediatrics, and preventive cardiology suites.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Configured Services at this Clinic */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-600" />
                Clinic Offerings & Outpatient Packages ({services.length})
              </CardTitle>
              <Link href="/hospital/services">
                <Button size="sm" variant="ghost" className="h-7 text-xs text-teal-700">
                  Manage Services →
                </Button>
              </Link>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Services actively available for patient booking and intake at {facility?.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {services.map((srv) => (
                <div key={srv.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{srv.name}</span>
                    <Badge variant="outline" className="text-[10px] bg-white">
                      ₹{srv.base_price}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500">{srv.department_name || "Outpatient General"}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{srv.code} • {srv.duration_minutes} mins</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
