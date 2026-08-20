"use client";

import React from "react";
import { Receipt, HelpCircle, ShieldCheck, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientBillsPage() {
  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Transparent Hospital Invoices"
          description="Itemized clinical billing with explicit event lineage and 'Why Was I Charged?' auditability."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Bills & Payments" }]}
        />

        {/* Sample Transparent Bill Preview */}
        <Card className="bg-white border-purple-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
                BIL-1001
              </span>
              <Badge variant="teal" className="text-[10px]">
                ● Settled via UPI
              </Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              City Hospital — Outpatient Cardiology Encounter
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Encounter: ENC-1001 • Date: 20 Aug 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-2 text-xs">
            <div className="divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Specialist OPD Consultation (Dr. Ananya Sharma)</span>
                <span className="font-bold text-slate-900">₹500.00</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Complete Blood Count (LAB-ORD-1024)</span>
                <span className="font-bold text-slate-900">₹850.00</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600">Pharmacy Dispensing (RX-1001)</span>
                <span className="font-bold text-slate-900">₹420.00</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-100 text-[11px] space-y-1">
              <div className="flex justify-between font-semibold text-purple-950">
                <span>Total Gross:</span>
                <span>₹1,770.00</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Insurance Pre-Auth (ABC Insurance):</span>
                <span>-₹1,200.00</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>Government Assistance (BSKY Subsidy):</span>
                <span>-₹300.00</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-purple-200">
                <span>Patient Net Paid:</span>
                <span>₹270.00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <EmptyState
          icon={<Receipt className="h-6 w-6 text-purple-600" />}
          title="Lineage-Backed Transparent Invoices"
          description="Every bill item in MEDORA traces backward to the exact consultation, lab order, or medication that generated it."
          phase="Phase 10 — Itemized Billing & Why Charged"
          actionHref="/patient"
          actionLabel="Return to Patient Home"
        />
      </div>
    </RoleGuard>
  );
}
