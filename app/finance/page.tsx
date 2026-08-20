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
  CheckCircle2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default function FinanceDashboard() {
  const [selectedBill, setSelectedBill] = useState<string | null>("BILL-1001");

  const bills = [
    { billNo: "BILL-1001", patient: "Rahul Verma", patientId: "MED-PAT-1001", total: 1550, insSplit: "₹0 (Self-Pay)", status: "generated", items: "Consultation + CBC + 2 Meds" },
    { billNo: "BILL-1002", patient: "Ananya Mishra", patientId: "MED-PAT-1002", total: 850, insSplit: "₹0 (Self-Pay)", status: "paid", items: "Consultation + Electrolytes" },
    { billNo: "BILL-1003", patient: "Trauma Victim #4", patientId: "MED-EMERG-1001", total: 45000, insSplit: "₹35,000 Govt Ayushman", status: "generated", items: "ER Surgery + ICU Bed + Blood" },
  ];

  return (
    <div className="space-y-6">
      {/* Finance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-white p-5 shadow-2xs">
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
          <Button variant="outline" size="sm" className="text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-teal-600" /> Bill Version Audit
          </Button>
        </div>
      </div>

      {/* Itemized Invoices Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Hospital Invoices & Claims
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Every line item is linked to a verified doctor order, lab sample, or pharmacy dispense event.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Patient Details</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Insurance / Scheme</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((b) => (
                    <TableRow key={b.billNo} className={selectedBill === b.billNo ? "bg-teal-50/40" : ""}>
                      <TableCell className="font-mono font-bold text-slate-900 text-xs">{b.billNo}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-900 block text-xs">{b.patient}</span>
                        <span className="font-mono text-[10px] text-slate-500">{b.patientId}</span>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 text-xs">{formatCurrency(b.total)}</TableCell>
                      <TableCell className="text-xs text-slate-600">{b.insSplit}</TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant={selectedBill === b.billNo ? "default" : "outline"}
                          className="text-xs"
                          onClick={() => setSelectedBill(b.billNo)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Lineage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* "Why Was I Charged?" Visual Traceability Inspector */}
        <div>
          <Card className="border-teal-300 bg-white">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-teal-50/40">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                Medical-to-Financial Traceability
              </span>
              <CardTitle className="text-sm font-bold text-slate-900 mt-1">
                Lineage for BILL-1001
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>1. OPD Consultation</span>
                  <span>₹500.00</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Doctor: Dr. Rajesh Sharma • Dept: Cardiology (OPD-102)
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-teal-200 bg-teal-50/40 space-y-1">
                <div className="flex justify-between font-semibold text-teal-950">
                  <span>2. Complete Blood Count (CBC)</span>
                  <span>₹600.00</span>
                </div>
                <p className="text-[11px] text-teal-800">
                  Order: LAB-1001 • Sample: SMP-1001 • Report Approved by Central Lab
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>3. Pharmacy Medication Pack</span>
                  <span>₹450.00</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Rx: RX-1001 • Dispensed at Counter 3 • Medora ID Verified
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Net Total Payable:</span>
                <span className="text-teal-700">₹1,550.00</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
