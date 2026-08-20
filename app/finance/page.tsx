"use client";

import React, { useState } from "react";
import { 
  Receipt, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  Eye, 
  FileText,
  Search,
  CheckCircle2,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { RoleGuard } from "@/components/shared/role-guard";

export default function FinanceWorkspacePage() {
  const [selectedBill, setSelectedBill] = useState<string | null>("BILL-1001");

  const bills = [
    { billNo: "BILL-1001", patient: "Rahul Verma", patientId: "MED-PAT-1001", total: 1550, insSplit: "₹0 (Self-Pay)", status: "generated", items: "Consultation + CBC + 2 Meds" },
    { billNo: "BILL-1002", patient: "Ananya Mishra", patientId: "MED-PAT-1002", total: 850, insSplit: "₹0 (Self-Pay)", status: "paid", items: "Consultation + Electrolytes" },
    { billNo: "BILL-1003", patient: "Trauma Victim #4", patientId: "MED-EMERG-1001", total: 45000, insSplit: "₹35,000 Govt Ayushman", status: "generated", items: "ER Surgery + ICU Bed + Blood" },
  ];

  return (
    <RoleGuard allowedRoles={["finance_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        {/* Finance Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Billing & Financial Traceability Command
              </h1>
              <Badge variant="teal" className="text-xs">
                MED-FIN-1001
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Itemized Invoice Aggregation • Insurance & Scheme Split • Medical-to-Financial Traceability
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-teal-600" /> Bill Version Audit
            </Button>
          </div>
        </div>

        {/* Finance Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Total Invoices Today</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">₹47,400</span>
            <span className="text-[11px] text-teal-700 font-medium block mt-0.5">3 Active Accounts</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Govt / Ayushman Split</span>
            <span className="text-xl font-bold text-blue-600 mt-1 block">₹35,000</span>
            <span className="text-[11px] text-blue-600 block mt-0.5">ER Trauma Case</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Patient Out-of-Pocket</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">₹12,400</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">₹850 Settled</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs text-slate-500 block">Lineage Integrity</span>
            <span className="text-xl font-bold text-teal-700 mt-1 block">100% Traceable</span>
            <span className="text-[11px] text-teal-700 block mt-0.5">Zero unlinked charges</span>
          </div>
        </div>

        {/* Itemized Invoices Table & Lineage Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-bold text-slate-900">
                  Patient Invoices & Settlement
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Every bill item must point to a verified consultation, lab test, or pharmacy dispense event.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill No</TableHead>
                      <TableHead>Patient Details</TableHead>
                      <TableHead>Included Items</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill.billNo} className={selectedBill === bill.billNo ? "bg-teal-50/30" : ""}>
                        <TableCell className="font-mono font-bold text-slate-900 text-xs">{bill.billNo}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-900 block text-xs">{bill.patient}</span>
                          <span className="font-mono text-[10px] text-slate-500">{bill.patientId}</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{bill.items}</TableCell>
                        <TableCell className="font-mono font-bold text-xs text-slate-900">{formatCurrency(bill.total)}</TableCell>
                        <TableCell>
                          <StatusBadge status={bill.status} size="sm" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant={selectedBill === bill.billNo ? "default" : "outline"}
                            onClick={() => setSelectedBill(bill.billNo)}
                            className="text-xs h-8"
                          >
                            Inspect Lineage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Lineage & 'Why was I charged?' Breakdown */}
          <div className="space-y-4">
            <Card className="bg-white border-teal-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  Lineage Trace: BILL-1001
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="space-y-2">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>Cardiology OPD Consultation</span>
                      <span>₹500</span>
                    </div>
                    <span className="text-[10px] text-teal-700 block font-mono">Linked to Dr. Rajesh Sharma (OPD-102)</span>
                  </div>

                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>Complete Blood Count (CBC)</span>
                      <span>₹600</span>
                    </div>
                    <span className="text-[10px] text-teal-700 block font-mono">Linked to Lab Order LAB-1001</span>
                  </div>

                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>Amoxicillin 500mg (15 Caps)</span>
                      <span>₹450</span>
                    </div>
                    <span className="text-[10px] text-teal-700 block font-mono">Linked to Rx RX-1001 Dispense</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Amount</span>
                  <span>₹1,550</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Phase notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>Real-time insurance claim processing and financial assistance splitting belong to Phase 10 & Phase 12.</span>
        </div>
      </div>
    </RoleGuard>
  );
}
