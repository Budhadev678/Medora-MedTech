"use client";

import React from "react";
import { ShieldCheck, Lock, Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminAuditPage() {
  const auditLogs = [
    { id: "AUD-1001", actor: "Dr. Ananya Sharma (DOC-1001)", action: "Prescription Created (RX-1001)", target: "Rahul Verma (PAT-1001)", time: "20 Aug 2026 10:42:15", status: "SUCCESS" },
    { id: "AUD-1002", actor: "Dr. B. Mohapatra (LAB-1001)", action: "Pathology Report Verified (RPT-1024)", target: "Rahul Verma (PAT-1001)", time: "20 Aug 2026 11:15:30", status: "SUCCESS" },
    { id: "AUD-1003", actor: "City Hospital Billing (HSP-1001)", action: "Invoice Lineage Generated (BIL-1001)", target: "Rahul Verma (PAT-1001)", time: "20 Aug 2026 11:30:00", status: "SUCCESS" },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Immutable Platform Audit Stream"
          description="Tamper-evident cryptographically signed audit records tracking WHO, WHAT, WHEN, WHY, and STATUS across all ecosystem actions."
          breadcrumbs={[{ label: "Admin Console", href: "/admin" }, { label: "Audit Ledger" }]}
        />

        {/* Live Immutable Stream Table */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                Live Cryptographic Activity Ledger
              </CardTitle>
              <Badge variant="teal" className="text-[10px]">● Append-Only Ledger</Badge>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Zero records can be modified or deleted. Immutable compliance ledger.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-slate-50">
                  <TableHead>Event ID</TableHead>
                  <TableHead>Actor (WHO)</TableHead>
                  <TableHead>Action (WHAT)</TableHead>
                  <TableHead>Target Entity</TableHead>
                  <TableHead>Timestamp (WHEN)</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id} className="text-xs">
                    <TableCell className="font-mono font-bold text-teal-800">{log.id}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{log.actor}</TableCell>
                    <TableCell className="text-slate-700">{log.action}</TableCell>
                    <TableCell className="font-mono text-slate-600">{log.target}</TableCell>
                    <TableCell className="text-slate-500 font-mono text-[11px]">{log.time}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="teal" className="text-[9px]">{log.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <EmptyState
          icon={<ShieldCheck className="h-6 w-6 text-teal-600" />}
          title="Full Historical Audit Query Engine"
          description="Detailed multi-entity forensic filters, cryptographic hash verification, and regulatory export will be fully powered in Phase 11."
          phase="Phase 11 — Immutable Audit Trail"
          actionHref="/admin"
          actionLabel="Return to Governance Console"
        />
      </div>
    </RoleGuard>
  );
}
