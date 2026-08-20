"use client";

import React from "react";
import { 
  Droplet, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2,
  Plus
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function BloodBankDashboard() {
  const bloodRequests = [
    { reqNo: "BR-1001", group: "O-", units: "2 Units", urgency: "stat", hospital: "Apex Multispeciality (Trauma #4)", status: "matching", potentialDonors: 14, confirmedDonors: 2 },
    { reqNo: "BR-1002", group: "B+", units: "1 Unit", urgency: "routine", hospital: "General Surgery Ward", status: "fulfilled", potentialDonors: 35, confirmedDonors: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Blood Bank Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/50 p-5 shadow-2xs">
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
          <Button size="sm" className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white">
            <Plus className="h-3.5 w-3.5" /> New Urgent Blood Request
          </Button>
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
            <Badge variant="teal" className="text-xs">Live Matching</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request No</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Units Required</TableHead>
                <TableHead>Hospital & Case</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Donors Matched</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloodRequests.map((req) => (
                <TableRow key={req.reqNo}>
                  <TableCell className="font-mono font-bold text-slate-900 text-xs">{req.reqNo}</TableCell>
                  <TableCell>
                    <span className="font-bold text-rose-700 text-sm">{req.group}</span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">{req.units}</TableCell>
                  <TableCell className="text-xs text-slate-700">{req.hospital}</TableCell>
                  <TableCell>
                    <Badge variant={req.urgency === "stat" ? "emergency" : "secondary"} className="text-[11px]">
                      {req.urgency.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-bold text-emerald-700">{req.confirmedDonors}</span> / {req.potentialDonors} Notified
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="text-xs">
                      {req.status === "matching" ? "Dispatch Units" : "View Record"}
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
