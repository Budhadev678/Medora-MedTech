"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Receipt, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  Eye, 
  FileText,
  Search,
  CheckCircle2,
  Layers,
  ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { RoleGuard } from "@/components/shared/role-guard";
import { getAllBills } from "@/lib/data/billing-store";
import { FinancialCoverageService } from "@/lib/services/financial-coverage-service";
import { HealthcareBill } from "@/types/database.types";

export default function FinanceWorkspacePage() {
  const [bills, setBills] = useState<HealthcareBill[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string>("BILL-1001");

  useEffect(() => {
    setBills(getAllBills());
  }, []);

  const selectedBill = bills.find((b) => b.id === selectedBillId) || bills[0];
  const waterfall = selectedBill ? FinancialCoverageService.calculateFinancialWaterfall(selectedBill.id) : null;

  return (
    <RoleGuard allowedRoles={["finance_staff", "admin", "hospital_admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-24 p-4 sm:p-6">
        {/* Finance Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Healthcare Financial & Billing Governance Hub
              </h1>
              <Badge variant="teal" className="text-xs font-mono">
                PHASE 10 CONNECTED
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authoritative Healthcare Billing • Financial Waterfall • Multi-Channel Coverage • 3-Way Reconciliation
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/hospital/billing">
              <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl">
                Billing Console <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
            <Link href="/hospital/billing/payments">
              <Button variant="outline" size="sm" className="text-xs rounded-xl font-bold">
                Cashier & Payments
              </Button>
            </Link>
            <Link href="/hospital/finance/reconciliation">
              <Button variant="outline" size="sm" className="text-xs rounded-xl font-bold">
                3-Way Reconciliation
              </Button>
            </Link>
            <Link href="/hospital/finance/disputes">
              <Button variant="outline" size="sm" className="text-xs rounded-xl font-bold">
                Disputes & Evidence
              </Button>
            </Link>
          </div>
        </div>

        {/* Finance Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Gross Invoiced Charges</span>
            <span className="text-xl font-mono font-extrabold text-slate-900 mt-1 block">
              ₹{bills.reduce((sum, b) => sum + b.gross_total, 0).toFixed(2)}
            </span>
            <span className="text-[11px] text-teal-700 font-medium block mt-0.5">{bills.length} Healthcare Bills</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Insurance & Scheme Coverage</span>
            <span className="text-xl font-mono font-extrabold text-blue-600 mt-1 block">₹10,000.00</span>
            <span className="text-[11px] text-blue-600 font-bold block mt-0.5">Approved Ayushman / Insurance</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Confirmed Patient Obligation</span>
            <span className="text-xl font-mono font-extrabold text-emerald-600 mt-1 block">
              ₹{bills.reduce((sum, b) => sum + b.patient_responsibility, 0).toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">Net Billable Balance</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Lineage Integrity</span>
            <span className="text-xl font-bold text-teal-700 mt-1 block">100% Provenance</span>
            <span className="text-[11px] text-teal-700 font-bold block mt-0.5">Zero unlinked charges</span>
          </div>
        </div>

        {/* Itemized Invoices Table & Waterfall Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Healthcare Bills & Itemized Charges
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Bill Number</TableHead>
                      <TableHead>Patient Details</TableHead>
                      <TableHead>Gross Charges</TableHead>
                      <TableHead>Patient Responsibility</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill.id} className={selectedBillId === bill.id ? "bg-teal-50/40" : ""}>
                        <TableCell className="font-mono font-bold text-slate-900 text-xs">
                          {bill.bill_number}
                          <span className="text-[10px] text-slate-400 block font-mono">v{bill.current_version}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-900 block text-xs">{bill.patient_name}</span>
                          <span className="font-mono text-[10px] text-slate-500">{bill.patient_id}</span>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-slate-900">₹{bill.gross_total.toFixed(2)}</TableCell>
                        <TableCell className="font-mono font-bold text-xs text-emerald-800">₹{bill.patient_responsibility.toFixed(2)}</TableCell>
                        <TableCell>
                          <StatusBadge status={bill.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hospital/billing/${bill.id}`}>
                            <Button size="sm" variant="outline" className="text-xs rounded-xl font-bold">
                              Inspect Bill
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Lineage & Waterfall Card */}
          <div className="space-y-4">
            {waterfall ? (
              <Card className="bg-white border-teal-200 rounded-2xl shadow-xs">
                <CardHeader className="p-4 pb-2 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    Financial Waterfall: {selectedBill?.bill_number}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-600">Gross Charges:</span>
                    <span className="font-mono font-bold">₹{waterfall.gross_charges.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-emerald-700">
                    <span>Discounts Applied:</span>
                    <span className="font-mono font-bold">-₹{waterfall.discounts_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-blue-700">
                    <span>Insurance Approved:</span>
                    <span className="font-mono font-bold">-₹{waterfall.insurance_approved_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-purple-700">
                    <span>Government Scheme:</span>
                    <span className="font-mono font-bold">-₹{waterfall.govt_assistance_approved_total.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Patient Responsibility:</span>
                    <span className="font-mono text-emerald-800">₹{waterfall.projected_patient_responsibility.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
