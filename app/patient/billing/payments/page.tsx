"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  ArrowLeft,
  Receipt,
  CheckCircle2,
  Building2,
  Clock,
  ShieldCheck,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getPaymentsForPatient } from "@/lib/data/payment-store";
import { PaymentRecord } from "@/types/database.types";

export default function PatientPaymentHubPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    const patientId = user?.identifier || user?.id || "PAT-1001";
    const list = getPaymentsForPatient(patientId);
    setPayments(list);
  }, [user]);

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient/billing">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Bills
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" /> Patient Payment History & Digital Receipts
              </h1>
              <p className="text-xs text-slate-500">Authoritative payment receipts, transaction references, and settlement verification</p>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Payment Receipts</h2>
          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
              No payment receipts recorded for your account.
            </div>
          ) : (
            payments.map((p) => (
              <Card key={p.id} className="bg-white rounded-2xl shadow-xs border-slate-200">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-950 text-xs">{p.receipt_number}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{p.payment_method}</Badge>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                      <span>Bill: <strong className="text-slate-900 font-mono">{p.bill_id}</strong></span>
                      <span>•</span>
                      <span>Txn Ref: <strong className="font-mono text-slate-700">{p.transaction_reference}</strong></span>
                      <span>•</span>
                      <span>Paid At: <strong className="text-slate-700">{new Date(p.initiated_at).toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-extrabold text-slate-900 text-sm block">₹{p.amount.toFixed(2)}</span>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[9px] mt-1">Settlement: {p.settlement_status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
