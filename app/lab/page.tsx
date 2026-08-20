"use client";

import React from "react";
import { 
  FlaskConical, 
  Layers, 
  FileCheck2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Plus,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";

export default function LabWorkspacePage() {
  const { user } = useAuth();
  const labOrders = [
    { orderId: "LAB-1001", patientName: "Rahul Verma", patientId: "PAT-1001", test: "Complete Blood Count (CBC)", doctor: "Dr. Ananya Sharma", priority: "routine", status: "sample_collected", sampleId: "SMP-1001" },
    { orderId: "LAB-1002", patientName: "Priya Sharma", patientId: "PAT-1002", test: "Lipid Profile & HbA1c", doctor: "Dr. Ananya Sharma", priority: "routine", status: "ordered", sampleId: "Pending" },
    { orderId: "LAB-1003", patientName: "Amit Das", patientId: "PAT-1003", test: "Fasting Blood Sugar", doctor: "Dr. Ananya Sharma", priority: "routine", status: "testing", sampleId: "SMP-1003" },
  ];

  return (
    <RoleGuard allowedRoles={["lab_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Lab Operations Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {user?.organizationName || user?.fullName || "Central Pathology Lab"}
              </h1>
              <Badge variant="teal" className="text-xs font-mono">
                {user?.identifier || "LAB-1001"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Connected Diagnostic Queue & Sample Verification Desk
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5 text-xs h-8 font-semibold">
              <Plus className="h-3.5 w-3.5" /> Sample Intake (Barcode)
            </Button>
          </div>
        </div>

        {/* Diagnostic Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Pending Orders</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">4 Orders</span>
            <span className="text-[11px] text-teal-700 font-medium block mt-0.5">2 New Today</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Samples in Testing</span>
            <span className="text-xl font-bold text-blue-600 mt-1 block">1 Active</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Analyzer #2</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Critical Cross-Match</span>
            <span className="text-xl font-bold text-rose-600 mt-1 block">1 Urgent</span>
            <span className="text-[11px] text-rose-600 block mt-0.5">Trauma Patient</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Reports Approved</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">8 Today</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">Signed by Pathologist</span>
          </div>
        </div>

        {/* Lab Order Progression State Machine Table */}
        <Card className="bg-white">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Diagnostic Orders & State Machine
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Ordered → Sample Collection → Diagnostic Testing → Pathologist Approval → Auto-notification.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs text-slate-600">
                Auto-Syncs with Timeline
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test Requested</TableHead>
                  <TableHead>Ordering Doctor</TableHead>
                  <TableHead>Sample Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labOrders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell className="font-mono font-bold text-slate-900 text-xs">{order.orderId}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-900 block text-xs">{order.patientName}</span>
                      <span className="font-mono text-[10px] text-slate-500">{order.patientId}</span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 text-xs">{order.test}</TableCell>
                    <TableCell className="text-xs text-slate-600">{order.doctor}</TableCell>
                    <TableCell className="font-mono text-xs text-teal-800 font-semibold">{order.sampleId}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        {order.status === "ordered" ? "Collect Sample" : order.status === "report_ready" ? "View Approved Report" : "Enter Results"}
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
          <span>Complete connected laboratory workflows, reference range evaluations, and automated report generation belong to Phase 8.</span>
        </div>
      </div>
    </RoleGuard>
  );
}
