"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Stethoscope, 
  FileText, 
  FlaskConical, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  ArrowRight,
  Calendar,
  Layers,
  Info,
  ChevronRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";

export default function DoctorWorkspacePage() {
  const { user } = useAuth();
  const [dutyStatus, setDutyStatus] = useState<"available" | "busy" | "on_call" | "emergency_occupied">("available");
  const [selectedTab, setSelectedTab] = useState<"queue" | "schedule" | "tasks">("queue");

  const queuePatients = [
    { token: "#01", name: "Ananya Mishra", id: "MED-PAT-1002", age: 34, reason: "Chest tightness / Follow-up", status: "completed" },
    { token: "#02", name: "Rahul Verma", id: "MED-PAT-1001", age: 29, reason: "Routine Checkup & Blood Pressure", status: "in_consultation" },
    { token: "#03", name: "Suresh Patnaik", id: "MED-PAT-1003", age: 62, reason: "ECG Review / Chronic Care", status: "waiting" },
    { token: "#04", name: "Pooja Das", id: "MED-PAT-1004", age: 45, reason: "Palpitations / New Consultation", status: "waiting" },
  ];

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Doctor Header & Duty Status Controller */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
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
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-700 pl-1">Duty Status:</span>
            <select
              value={dutyStatus}
              onChange={(e) => setDutyStatus(e.target.value as any)}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-teal-600 cursor-pointer"
            >
              <option value="available">🟢 Available (Accepting Patients)</option>
              <option value="busy">🟡 In Consultation (Busy)</option>
              <option value="on_call">🔵 On Call</option>
              <option value="emergency_occupied">🔴 Emergency Occupied</option>
            </select>
          </div>
        </div>

        {/* Clinical Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Today's Appointments</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">12 Scheduled</span>
            <span className="text-[11px] text-teal-700 font-medium block mt-0.5">Room 102 Active</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Waiting in Queue</span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">2 Patients</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Est. wait: 15 mins</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Completed Consults</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">1 Completed</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">RX-1001 Generated</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Pending Lab Reviews</span>
            <span className="text-xl font-bold text-blue-600 mt-1 block">3 Reports</span>
            <span className="text-[11px] text-blue-600 block mt-0.5">1 Abnormal Flag</span>
          </div>
        </div>

        {/* Operational View Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold max-w-md">
          <button
            onClick={() => setSelectedTab("queue")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              selectedTab === "queue" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Live Queue (4)
          </button>
          <button
            onClick={() => setSelectedTab("schedule")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              selectedTab === "schedule" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setSelectedTab("tasks")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              selectedTab === "tasks" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending Reviews (3)
          </button>
        </div>

        {/* Tab 1: Live Patient Queue Table */}
        {selectedTab === "queue" && (
          <Card className="bg-white">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Live Outpatient Queue (OPD Room 102)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Authorized access to patient histories, digital prescriptions, and diagnostic orders.
                  </CardDescription>
                </div>
                <Badge variant="teal" className="text-xs">
                  Session Active
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
                      <TableCell className="font-bold font-mono text-slate-900 text-xs">{patient.token}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-900 block text-xs">{patient.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{patient.id}</span>
                      </TableCell>
                      <TableCell className="text-xs">{patient.age} yrs</TableCell>
                      <TableCell className="text-slate-700 text-xs">{patient.reason}</TableCell>
                      <TableCell>
                        <StatusBadge status={patient.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant={patient.status === "in_consultation" ? "default" : "outline"} 
                          className="gap-1 text-xs h-8"
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
        )}

        {/* Tab 2: Schedule Skeleton */}
        {selectedTab === "schedule" && (
          <Card className="bg-white">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Today's Slot Schedule
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Morning Session: 09:00 AM – 01:00 PM • Afternoon: 03:00 PM – 06:00 PM
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <span>09:30 AM — Ananya Mishra (Chest tightness)</span>
                <Badge variant="success" className="text-[10px]">Completed</Badge>
              </div>
              <div className="p-3 rounded-lg border border-teal-300 bg-teal-50/40 flex justify-between items-center">
                <span>10:00 AM — Rahul Verma (Blood Pressure / Checkup)</span>
                <Badge variant="teal" className="text-[10px]">In Progress</Badge>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <span>10:30 AM — Suresh Patnaik (ECG Review)</span>
                <Badge variant="outline" className="text-[10px]">Scheduled</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Tasks Skeleton */}
        {selectedTab === "tasks" && (
          <Card className="bg-white">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Diagnostic Reports Requiring Doctor Sign-Off
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 text-xs">
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">CBC Report: Rahul Verma (MED-PAT-1001)</span>
                  <span className="text-[11px] text-slate-500">Central Pathology Lab • Sample Collected</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-8">Review Result</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>Doctor availability management and structured prescription authoring will be implemented in Phase 4 & Phase 7.</span>
        </div>
      </div>
    </RoleGuard>
  );
}
