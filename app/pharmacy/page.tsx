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
  AlertCircle 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function PharmacyDashboard() {
  const [searchId, setSearchId] = useState("");

  const prescriptions = [
    { rxId: "RX-1001", patientName: "Rahul Verma", patientId: "MED-PAT-1001", doctor: "Dr. Rajesh Sharma", itemCount: "2 Medicines", status: "ready_for_pickup", issuedAt: "10:35 AM" },
    { rxId: "RX-1002", patientName: "Ananya Mishra", patientId: "MED-PAT-1002", doctor: "Dr. Rajesh Sharma", itemCount: "1 Medicine", status: "dispensed", issuedAt: "09:45 AM" },
    { rxId: "RX-1003", patientName: "Pooja Das", patientId: "MED-PAT-1004", doctor: "Dr. Rajesh Sharma", itemCount: "3 Medicines", status: "preparing", issuedAt: "11:10 AM" },
  ];

  return (
    <div className="space-y-6">
      {/* Pharmacy Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-white p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Apex In-Hospital Pharmacy
            </h1>
            <Badge variant="teal" className="text-xs">
              MED-PHARM-1001
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prescription Verification & Physical Pickup Desk • Counter 1-4
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-emerald-800 bg-emerald-50 border-emerald-300">
            Physical Pickup Verification Mandatory
          </Badge>
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
            Scan or enter Patient Medora ID (`MED-PAT-1001`) or Prescription ID (`RX-1001`) to physically dispense medicines.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Enter Medora ID (e.g. MED-PAT-1001) or Rx ID (e.g. RX-1001)..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="pl-9 bg-white text-xs"
              />
            </div>
            <Button size="sm" className="text-xs font-semibold gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verify & Dispense
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Incoming Prescriptions Queue */}
      <Card className="bg-white">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Prescriptions Queue
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Incoming digital prescriptions transmitted automatically upon doctor consultation completion.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs text-slate-600">
              3 Pending Action
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prescription ID</TableHead>
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
                      className="text-xs"
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
    </div>
  );
}
