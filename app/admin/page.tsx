"use client";

import React from "react";
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Activity, 
  Lock, 
  FileText,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const auditLogs = [
    { time: "2026-08-19T10:42:00Z", actor: "Dr. Rajesh Sharma (MED-DOC-1001)", action: "PRESCRIPTION_ISSUED", entity: "RX-1001 (Rahul Verma)", reason: "Hypertension diagnosis", status: "SUCCESS" },
    { time: "2026-08-19T11:15:00Z", actor: "Central Lab Staff (MED-LAB-1001)", action: "REPORT_APPROVED", entity: "LAB-1001 (CBC Report)", reason: "Diagnostic verification", status: "SUCCESS" },
    { time: "2026-08-19T11:30:00Z", actor: "Hospital Pharmacy (MED-PHARM-1001)", action: "MEDICINE_DISPENSED", entity: "RX-1001 (Amoxicillin)", reason: "Physical Medora ID verified", status: "SUCCESS" },
    { time: "2026-08-19T11:45:00Z", actor: "Billing Desk (MED-FIN-1001)", action: "BILL_ITEM_ATTACHED", entity: "BILL-1001 (+₹600 CBC)", reason: "Diagnostic service lineage", status: "SUCCESS" },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-300 bg-slate-900 text-white p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-teal-400" />
              MEDORA Master System Administration
            </h1>
            <Badge variant="teal" className="text-xs bg-teal-500/20 text-teal-300 border-teal-500">
              Append-Only Audit Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global Event Stream • Role Authorization Matrix • Immutable Traceability Ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500">
            System Integrity 100%
          </Badge>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <Card className="bg-white">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Master System Audit Trail
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Append-only record of WHO did WHAT, WHEN, WHY, and with WHAT STATUS.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono text-slate-600">
              WHO • WHAT • WHEN • WHY • STATUS
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor (WHO)</TableHead>
                <TableHead>Action (WHAT)</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Clinical Reason (WHY)</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {formatDate(log.time, true)}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">{log.actor}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">{log.entity}</TableCell>
                  <TableCell className="text-xs text-slate-500">{log.reason}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {log.status}
                    </span>
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
