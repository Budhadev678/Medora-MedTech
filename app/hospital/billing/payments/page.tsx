"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  ArrowLeft,
  Search,
  CheckCircle2,
  Receipt,
  Building2,
  User,
  Plus,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getPaymentsForBill, getAllUnappliedPayments } from "@/lib/data/payment-store";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";
import { PaymentRecord, UnappliedPayment } from "@/types/database.types";

export default function HospitalCashierDeskPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [unapplied, setUnapplied] = useState<UnappliedPayment[]>([]);

  // Post Cash State
  const [showCashModal, setShowCashModal] = useState(false);
  const [billId, setBillId] = useState("BILL-1001");
  const [amount, setAmount] = useState(14000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => {
    const list = getPaymentsForBill("BILL-1001");
    setPayments(list);
    setUnapplied(getAllUnappliedPayments());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handlePostCash = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = PaymentProcessingService.recordCashPayment({
        billId,
        amount,
        actor: user,
      });

      if (res.success && res.payment) {
        setMessage(`Recorded cash payment ${res.payment.id} (Receipt: ${res.payment.receipt_number})`);
        setShowCashModal(false);
        refresh();
      } else {
        setMessage(res.error || "Failed to post cash payment.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "doctor", "lab_staff"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/hospital/billing">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Billing Console
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" /> Hospital Cashier & Payment Desk
              </h1>
              <p className="text-xs text-slate-500">Authoritative payment recording, receipt generation, cash posting control & unapplied cash queue</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCashModal(true)} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
              <Plus className="h-4 w-4 mr-1" /> Record Cash Payment
            </Button>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Payments List */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Settled & Processed Payments</h2>
            <div className="space-y-3">
              {payments.map((p) => (
                <Card key={p.id} className="bg-white rounded-2xl shadow-xs border-slate-200">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-950 text-xs">{p.id}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{p.payment_method}</Badge>
                        <Badge variant="outline" className="text-[10px] font-mono">Receipt: {p.receipt_number}</Badge>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                        <span>Patient: <strong className="text-slate-900">{p.patient_name}</strong></span>
                        <span>•</span>
                        <span>Bill: <strong className="text-slate-800 font-mono">{p.bill_id}</strong></span>
                        <span>•</span>
                        <span>Ref: <strong className="font-mono text-slate-700">{p.transaction_reference}</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-extrabold text-slate-900 text-sm block">₹{p.amount.toFixed(2)}</span>
                      <span className="text-[10px] text-emerald-700 font-bold block">{p.settlement_status}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Unapplied Cash Queue */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider text-amber-700">Unapplied Cash Queue</h2>
            <Card className="bg-amber-50/50 border-amber-200 rounded-2xl">
              <CardHeader className="p-4 pb-2 border-b border-amber-200/60">
                <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> Unclaimed Direct Credits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {unapplied.map((u) => (
                  <div key={u.id} className="p-3 bg-white border border-amber-200 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-900 font-mono">{u.id}</span>
                      <span className="font-mono text-amber-950">₹{u.amount.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{u.source_name}</p>
                    <span className="text-[10px] font-mono text-slate-400 block">Ref: {u.reference}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cash Modal */}
        {showCashModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-emerald-700">
                <Plus className="h-5 w-5 text-emerald-600" /> Post Cash Payment (Attributed)
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Bill ID *</label>
                  <input
                    type="text"
                    value={billId}
                    onChange={(e) => setBillId(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Cash Amount (₹) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-mono font-bold"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowCashModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handlePostCash} disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl">
                  Post Cash & Issue Receipt
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
