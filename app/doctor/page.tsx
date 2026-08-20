"use client";

import React, { useState } from "react";
import { 
  Users, 
  Stethoscope, 
  FileText, 
  FlaskConical, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";

export default function DoctorDashboard() {
  const [dutyStatus, setDutyStatus] = useState<"available" | "busy" | "on_call" | "emergency_occupied">("available");

  const queuePatients = [
    { token: "#01", name: "Ananya Mishra", id: "MED-PAT-1002", age: 34, reason: "Chest tightness / Follow-up", status: "completed" },
    { token: "#02", name: "Rahul Verma", id: "MED-PAT-1001", age: 29, reason: "Routine Checkup & Blood Pressure", status: "in_consultation" },
    { token: "#03", name: "Suresh Patnaik", id: "MED-PAT-1003", age: 62, reason: "ECG Review / Chronic Care", status: "waiting" },
    { token: "#04", name: "Pooja Das", id: "MED-PAT-1004", age: 45, reason: "Palpitations / New Consultation", status: "waiting" },
  ];

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6">
      {/* Doctor Header & Availability Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-white p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Dr. Rajesh Sharma, MD (Cardiology)
            </h1>
            <Badge variant="outline" className="text-xs text-teal-700 border-teal-300">
              MED-DOC-1001
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of Cardiology • Apex Multispeciality Hospital (OPD Room 102)
          </p>
        </div>

        {/* Live Duty Status Controller */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
          <span className="text-xs font-semibold text-slate-700 pl-1">Duty Status:</span>
          <select
            value={dutyStatus}
            onChange={(e) => setDutyStatus(e.target.value as any)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-teal-600"
          >
            <option value="available">🟢 Available (Accepting Patients)</option>
            <option value="busy">🟡 In Consultation (Busy)</option>
            <option value="on_call">🔵 On Call</option>
            <option value="emergency_occupied">🔴 Emergency Occupied</option>
          </select>
        </div>
      </div>

      {/* Clinical Queue Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Today's Appointments</span>
          <span className="text-xl font-bold text-slate-900">12 Scheduled</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Waiting in Queue</span>
          <span className="text-xl font-bold text-amber-600">2 Patients</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Completed Today</span>
          <span className="text-xl font-bold text-emerald-600">1 Completed</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Pending Lab Reports</span>
          <span className="text-xl font-bold text-blue-600">3 Pending Review</span>
        </div>
      </div>

      {/* Active Clinical Patient Queue Table */}
      <Card className="bg-white">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Live Outpatient Queue
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Authorized access to patient histories, digital prescriptions, and diagnostic orders.
              </CardDescription>
            </div>
            <Badge variant="teal" className="text-xs">
              Room 102 Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Token</TableHead>
                <TableHead>Patient Name & ID</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Reason for Visit</TableHead>
                <TableHead>Queue Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queuePatients.map((patient) => (
                <TableRow key={patient.token} className={patient.status === "in_consultation" ? "bg-teal-50/40" : ""}>
                  <TableCell className="font-bold font-mono text-slate-900">{patient.token}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-900 block">{patient.name}</span>
                    <span className="font-mono text-[11px] text-slate-500">{patient.id}</span>
                  </TableCell>
                  <TableCell>{patient.age} yrs</TableCell>
                  <TableCell className="text-slate-700">{patient.reason}</TableCell>
                  <TableCell>
                    <StatusBadge status={patient.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant={patient.status === "in_consultation" ? "default" : "outline"} 
                      className="gap-1 text-xs"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      {patient.status === "in_consultation" ? "Continue Consult" : "Open Record"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </RoleGuard>
  );
}
