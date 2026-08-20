"use client";

import React, { useState } from "react";
import { 
  Pill, 
  Search, 
  CheckCircle2, 
  Clock, 
  Package, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle,
  Info 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";

export default function PharmacyWorkspacePage() {
  const { user } = useAuth();
  const [searchId, setSearchId] = useState("");

  const prescriptions = [
    { rxId: "RX-1001", patientName: "Rahul Verma", patientId: "PAT-1001", doctor: "Dr. Ananya Sharma", itemCount: "2 Medicines", status: "ready_for_pickup", issuedAt: "10:35 AM" },
    { rxId: "RX-1002", patientName: "Priya Sharma", patientId: "PAT-1002", doctor: "Dr. Ananya Sharma", itemCount: "1 Medicine", status: "dispensed", issuedAt: "09:45 AM" },
    { rxId: "RX-1003", patientName: "Amit Das", patientId: "PAT-1003", doctor: "Dr. Ananya Sharma", itemCount: "3 Medicines", status: "preparing", issuedAt: "11:10 AM" },
  ];

  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Pharmacy Operations Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {user?.organizationName || user?.fullName || "City Pharmacy Desk"}
              </h1>
              <Badge variant="teal" className="text-xs font-mono">
                {user?.identifier || "PHA-1001"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Prescription Verification & Physical Pickup Desk
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-emerald-800 bg-emerald-50 border-emerald-300">
              Physical Pickup Verification Mandatory
            </Badge>
          </div>
        </div>

        {/* Pharmacy Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Prescriptions Today</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">18 Total</span>
            <span className="text-[11px] text-teal-700 font-medium block mt-0.5">OPD & Inpatient</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Ready for Pickup</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">3 Packaged</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">At Counter 3</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Preparing / Packaging</span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">2 Queued</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Pharmacist Tray A</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Dispensed & Logged</span>
            <span className="text-xl font-bold text-blue-600 mt-1 block">13 Fulfilled</span>
            <span className="text-[11px] text-blue-600 block mt-0.5">With Medora ID verification</span>
          </div>
        </div>

        {/* Patient Physical Pickup Verification Desk */}
        <Card className="border-teal-300 bg-teal-50/30">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-teal-600" />
              Counter Dispense: Verify Patient Identity
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Enter Patient Medora ID or Scan Prescription QR to confirm pickup.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Enter Medora Patient ID (e.g. MED-PAT-1001)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="pl-9 bg-white text-xs"
                />
              </div>
              <Button size="sm" className="font-semibold text-xs h-9">
                Lookup & Dispense
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Prescription Fulfillment Queue */}
        <Card className="bg-white">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-slate-900">
              Prescription Queue & Physical Dispense Tracker
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Only physical in-person handoffs with identity validation are recorded. No unverified deliveries.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rx ID</TableHead>
                  <TableHead>Patient Details</TableHead>
                  <TableHead>Prescribing Doctor</TableHead>
                  <TableHead>Medications</TableHead>
                  <TableHead>Issued Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((rx) => (
                  <TableRow key={rx.rxId}>
                    <TableCell className="font-mono font-bold text-slate-900 text-xs">{rx.rxId}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-900 block text-xs">{rx.patientName}</span>
                      <span className="font-mono text-[10px] text-slate-500">{rx.patientId}</span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">{rx.doctor}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-800">{rx.itemCount}</TableCell>
                    <TableCell className="text-xs text-slate-500">{rx.issuedAt}</TableCell>
                    <TableCell>
                      <StatusBadge status={rx.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant={rx.status === "ready_for_pickup" ? "default" : "outline"} 
                        className="text-xs h-8"
                      >
                        {rx.status === "ready_for_pickup" ? "Mark Dispensed" : rx.status === "dispensed" ? "View Dispense Log" : "Package Meds"}
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
          <span>Detailed inventory tracking and barcode dispensing logs belong to Phase 9.</span>
        </div>
      </div>
    </RoleGuard>
  );
}
