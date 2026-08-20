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
  Clock,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { RoleGuard } from "@/components/shared/role-guard";

export default function AdminWorkspacePage() {
  const auditLogs = [
    { time: "2026-08-19T10:42:00Z", actor: "Dr. Rajesh Sharma (MED-DOC-1001)", action: "PRESCRIPTION_ISSUED", entity: "RX-1001 (Rahul Verma)", reason: "Hypertension diagnosis", status: "SUCCESS" },
    { time: "2026-08-19T11:15:00Z", actor: "Central Lab Staff (MED-LAB-1001)", action: "REPORT_APPROVED", entity: "LAB-1001 (CBC Report)", reason: "Diagnostic verification", status: "SUCCESS" },
    { time: "2026-08-19T11:30:00Z", actor: "Hospital Pharmacy (MED-PHARM-1001)", action: "MEDICINE_DISPENSED", entity: "RX-1001 (Amoxicillin)", reason: "Physical Medora ID verified", status: "SUCCESS" },
    { time: "2026-08-19T11:45:00Z", actor: "Billing Desk (MED-FIN-1001)", action: "BILL_ITEM_ATTACHED", entity: "BILL-1001 (+₹600 CBC)", reason: "Diagnostic service lineage", status: "SUCCESS" },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Admin Operations Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-300 bg-slate-900 text-white p-5 shadow-xs">
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

        {/* System Administration Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Registered Profiles</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">9 Active Personas</span>
            <span className="text-[11px] text-teal-700 font-medium block mt-0.5">8 Operational Roles</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Registered Facilities</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">1 Hub Hospital</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Apex Multispeciality</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Security Policies</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">15 RLS Rules</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">Least-privilege active</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Audit Events Logged</span>
            <span className="text-xl font-bold text-blue-600 mt-1 block">4 Verified</span>
            <span className="text-[11px] text-blue-600 block mt-0.5">Append-only stream</span>
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
                  WHO performed WHAT action, to WHICH record, WHEN, and with WHAT clinical justification.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs text-teal-700 border-teal-300">
                Tamper-Resistant
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Authorized Actor</TableHead>
                  <TableHead>Action Code</TableHead>
                  <TableHead>Target Entity</TableHead>
                  <TableHead>Clinical / Operational Justification</TableHead>
                  <TableHead className="text-right">Integrity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(log.time)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900">{log.actor}</TableCell>
                    <TableCell>
                      <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-700">{log.entity}</TableCell>
                    <TableCell className="text-xs text-slate-600">{log.reason}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3" /> VERIFIED
                      </span>
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
          <span>Cryptographic hash linking and automated anomaly detection belong to Phase 11.</span>
        </div>
      </div>
    </RoleGuard>
  );
}
