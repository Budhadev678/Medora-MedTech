"use client";

import React from "react";
import { 
  Droplet, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2,
  Plus,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";

export default function BloodBankWorkspacePage() {
  const bloodRequests = [
    { reqNo: "BR-1001", group: "O-", units: "2 Units", urgency: "stat", hospital: "Apex Multispeciality (Trauma #4)", status: "matching", potentialDonors: 14, confirmedDonors: 2 },
    { reqNo: "BR-1002", group: "B+", units: "1 Unit", urgency: "routine", hospital: "General Surgery Ward", status: "fulfilled", potentialDonors: 35, confirmedDonors: 1 },
  ];

  return (
    <RoleGuard allowedRoles={["hospital_admin", "blood_staff", "staff", "admin", "emergency_staff", "doctor"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Blood Bank Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/50 p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-rose-950 flex items-center gap-2">
                <Droplet className="h-6 w-6 text-rose-600" />
                RedCross Blood Coordination Desk
              </h1>
              <Badge variant="outline" className="text-xs text-rose-800 border-rose-300">
                MED-BLOOD-1001
              </Badge>
            </div>
            <p className="text-xs text-rose-800 mt-1">
              Urgent Blood Matching • Compatible Donor Network • Verified Fulfillment
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white h-8 font-semibold">
              <Plus className="h-3.5 w-3.5" /> New Urgent Blood Request
            </Button>
          </div>
        </div>

        {/* Blood Stock & Request Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-rose-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Critical O- Stock</span>
            <span className="text-xl font-bold text-rose-600 mt-1 block">4 Units</span>
            <span className="text-[11px] text-rose-600 block mt-0.5">Low reserve alert</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Active Requests</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">2 Queued</span>
            <span className="text-[11px] text-teal-700 block mt-0.5">1 STAT emergency</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Potential Donors</span>
            <span className="text-xl font-bold text-blue-600 mt-1 block">49 Matched</span>
            <span className="text-[11px] text-blue-600 block mt-0.5">Within 10 km radius</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Fulfilled Today</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">5 Units</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">Dispatched to ER</span>
          </div>
        </div>

        {/* Blood Requests Table */}
        <Card className="bg-white">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Hospital Blood Requirements
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Automated matching against compatible verified donors and nearby blood storage banks.
                </CardDescription>
              </div>
              <Badge variant="teal" className="text-xs">
                Compatible Match Engine
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request No</TableHead>
                  <TableHead>Required Group</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Requesting Facility</TableHead>
                  <TableHead>Donor Matching Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bloodRequests.map((req) => (
                  <TableRow key={req.reqNo}>
                    <TableCell className="font-mono font-bold text-slate-900 text-xs">{req.reqNo}</TableCell>
                    <TableCell>
                      <span className="font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        {req.group}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{req.units}</TableCell>
                    <TableCell>
                      <StatusBadge status={req.urgency} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">{req.hospital}</TableCell>
                    <TableCell>
                      <StatusBadge status={req.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        {req.status === "matching" ? "Alert Donors (14)" : "View Dispatch Receipt"}
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
          <span>Real-time donor location matching and reward badging belong to Phase 14 & Phase 17.</span>
        </div>
      </div>
    </RoleGuard>
  );
}
