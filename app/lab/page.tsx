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
  Plus
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function LabDashboard() {
  const labOrders = [
    { orderId: "LAB-1001", patientName: "Rahul Verma", patientId: "MED-PAT-1001", test: "Complete Blood Count (CBC)", doctor: "Dr. Rajesh Sharma", priority: "routine", status: "sample_collected", sampleId: "SMP-1001" },
    { orderId: "LAB-1002", patientName: "Pooja Das", patientId: "MED-PAT-1004", test: "Lipid Profile & HbA1c", doctor: "Dr. Rajesh Sharma", priority: "routine", status: "ordered", sampleId: "Pending" },
    { orderId: "LAB-1003", patientName: "Trauma Victim #4", patientId: "MED-EMERG-1001", test: "Cross-Match & Blood Grouping", doctor: "Dr. Ananya Iyer", priority: "critical", status: "testing", sampleId: "SMP-1003" },
    { orderId: "LAB-1004", patientName: "Ananya Mishra", patientId: "MED-PAT-1002", test: "Serum Creatinine & Electrolytes", doctor: "Dr. Rajesh Sharma", priority: "routine", status: "report_ready", sampleId: "SMP-1002" },
  ];

  return (
    <div className="space-y-6">
      {/* Lab Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-white p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Central Diagnostic Pathology Laboratory
            </h1>
            <Badge variant="teal" className="text-xs">
              MED-LAB-1001
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Connected Diagnostic Queue • Apex Multispeciality Hospital
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Sample Intake (Barcode)
          </Button>
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
                    <Button size="sm" variant="outline" className="text-xs">
                      {order.status === "ordered" ? "Collect Sample" : order.status === "report_ready" ? "View Approved Report" : "Enter Results"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
