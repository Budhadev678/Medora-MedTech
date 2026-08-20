"use client";

import React from "react";
import { 
  Building2, 
  Users, 
  BedDouble, 
  Activity, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Calendar 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";

export default function HospitalDashboard() {
  const departments = [
    { name: "Emergency & Trauma Care", code: "EMERG", activeDoctors: 4, occupiedBeds: "18 / 20", status: "high" },
    { name: "Cardiology & Cath Lab", code: "CARD", activeDoctors: 3, occupiedBeds: "12 / 15", status: "available" },
    { name: "Diagnostic Pathology & Imaging", code: "PATH", activeDoctors: 5, occupiedBeds: "N/A (OPD)", status: "available" },
    { name: "General Medicine & Ward", code: "MED", activeDoctors: 6, occupiedBeds: "42 / 50", status: "available" },
  ];

  return (
    <RoleGuard allowedRoles={["hospital_admin", "admin"]}>
      <div className="space-y-6">
      {/* Hospital Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-white p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Apex Multispeciality Hospital
            </h1>
            <Badge variant="teal" className="text-xs">
              MED-HOSP-1001
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Command Center • 250 Bed Capacity • Bhubaneswar Hub
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-teal-600" /> View Hospital Audit Log
          </Button>
          <Button variant="emergency" size="sm" className="text-xs">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Emergency Desk
          </Button>
        </div>
      </div>

      {/* Operational Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Total Inpatient Beds</span>
          <span className="text-xl font-bold text-slate-900">72 / 85 Occupied</span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">84.7% Occupancy</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Doctors On Duty</span>
          <span className="text-xl font-bold text-teal-700">18 Active</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">4 On-Call</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Today's Outpatients</span>
          <span className="text-xl font-bold text-slate-900">142 Registered</span>
          <span className="text-[11px] text-blue-600 block mt-0.5">38 in Queue</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Emergency Admissions</span>
          <span className="text-xl font-bold text-red-600">6 Trauma Cases</span>
          <span className="text-[11px] text-red-500 block mt-0.5">1 Critical</span>
        </div>
      </div>

      {/* Department Status Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="h-4 w-4 text-teal-600" />
          Active Hospital Departments
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => (
            <Card key={dept.code} className="bg-white">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {dept.code}
                  </span>
                  <StatusBadge status={dept.status} size="sm" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                  {dept.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 my-2">
                  <div className="rounded bg-slate-50 p-2">
                    <span className="text-slate-400 block text-[11px]">Doctors on Duty</span>
                    <span className="font-semibold text-slate-900">{dept.activeDoctors} Specialists</span>
                  </div>
                  <div className="rounded bg-slate-50 p-2">
                    <span className="text-slate-400 block text-[11px]">Beds Occupied</span>
                    <span className="font-semibold text-slate-900">{dept.occupiedBeds}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs mt-1">
                  Manage Department & Staff
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </div>
    </RoleGuard>
  );
}
