"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  Users, 
  Droplet, 
  Clock, 
  Activity, 
  ShieldAlert, 
  UserCheck,
  ChevronRight,
  Plus,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";

export default function EmergencyWorkspacePage() {
  const emergencyCases = [
    { caseNo: "ER-1001", patient: "Trauma Victim #4", triage: "critical", doctor: "Dr. Ananya Iyer", status: "in_treatment", elapsed: "12m ago", bloodUrgent: "O- Negative (2 Units)" },
    { caseNo: "ER-1002", patient: "Ramesh Jena", triage: "high", doctor: "Dr. Rajesh Sharma (Reassigned)", status: "triaged", elapsed: "28m ago", bloodUrgent: "None" },
    { caseNo: "ER-1003", patient: "Priyanka Roy", triage: "moderate", doctor: "Dr. S. K. Mahapatra", status: "arrived", elapsed: "45m ago", bloodUrgent: "None" },
  ];

  return (
    <RoleGuard allowedRoles={["emergency_staff", "hospital_admin", "doctor", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Emergency Command Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-300 bg-red-50/50 p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-red-950 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                Emergency Triage & Operational Command Desk
              </h1>
              <Badge variant="emergency" className="text-xs">
                Live Trauma Center
              </Badge>
            </div>
            <p className="text-xs text-red-800 mt-1">
              Priority-Tagged Intake • Doctor Availability Auto-Check • Blood Bank Escalation Link
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="emergency" size="sm" className="gap-1.5 text-xs h-8">
              <Plus className="h-4 w-4" /> Rapid Patient Triage
            </Button>
          </div>
        </div>

        {/* Triage Urgency Level Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-2xs">
            <span className="text-xs font-bold text-red-700 block">Level 1: Critical (Immediate)</span>
            <span className="text-2xl font-bold text-red-800">1 Patient</span>
            <span className="text-[11px] text-red-600 block mt-0.5">ICU Bed Allocated</span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-2xs">
            <span className="text-xs font-bold text-amber-700 block">Level 2: Urgent (15m)</span>
            <span className="text-2xl font-bold text-amber-800">1 Patient</span>
            <span className="text-[11px] text-amber-600 block mt-0.5">Doctor Reassigned</span>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50/40 p-4 shadow-2xs">
            <span className="text-xs font-bold text-yellow-700 block">Level 3: Moderate</span>
            <span className="text-2xl font-bold text-yellow-800">1 Patient</span>
            <span className="text-[11px] text-yellow-600 block mt-0.5">Observation Bay 3</span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
            <span className="text-xs font-bold text-emerald-700 block">Level 4: Routine</span>
            <span className="text-2xl font-bold text-emerald-800">0 Patients</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">Shifted to OPD</span>
          </div>
        </div>

        {/* Active Emergency Trauma Queue */}
        <Card className="border-red-200 bg-white">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Active Emergency Cases & Doctor Escalations
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Auto-alert nearest on-call specialist and reserve critical blood units.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs text-red-700 border-red-300">
                1 Doctor Auto-Reassigned
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Code</TableHead>
                  <TableHead>Patient / Tag</TableHead>
                  <TableHead>Triage Priority</TableHead>
                  <TableHead>Assigned ER Doctor</TableHead>
                  <TableHead>Emergency Blood</TableHead>
                  <TableHead>Arrived</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emergencyCases.map((c) => (
                  <TableRow key={c.caseNo} className={c.triage === "critical" ? "bg-red-50/30" : ""}>
                    <TableCell className="font-mono font-bold text-slate-900 text-xs">{c.caseNo}</TableCell>
                    <TableCell className="font-semibold text-slate-900 text-xs">{c.patient}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.triage} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">{c.doctor}</TableCell>
                    <TableCell className="text-xs">
                      {c.bloodUrgent !== "None" ? (
                        <span className="font-bold text-red-700 flex items-center gap-1">
                          <Droplet className="h-3 w-3" /> {c.bloodUrgent}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{c.elapsed}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant={c.triage === "critical" ? "emergency" : "outline"} className="text-xs h-8">
                        {c.triage === "critical" ? "Emergency Snapshot" : "Reassign Doctor"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Phase notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>Automated emergency doctor reassignment and road accident pre-alert protocols belong to Phase 13 & Phase 18.</span>
        </div>
      </div>
    </RoleGuard>
  );
}
