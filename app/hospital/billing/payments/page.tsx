"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Clock,
  ArrowRight,
  Filter,
  Check,
  X,
  FileSpreadsheet
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getFacilityById } from "@/lib/data/facility-store";
import { getAllPayments, getAllUnappliedPayments, savePaymentRecord, savePaymentAllocation, saveUnappliedPayment } from "@/lib/data/payment-store";
import { getAllBills, getBillById } from "@/lib/data/billing-store";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";
import { PaymentRecord, UnappliedPayment } from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";

export default function HospitalCashierDeskPage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode) || getFacilityById("FAC-1001");
  const targetFacId = facility?.facility_code || "FAC-1001";

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [unapplied, setUnapplied] = useState<UnappliedPayment[]>([]);
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Post Cash Modal State
  const [showCashModal, setShowCashModal] = useState(false);
  const [targetBillId, setTargetBillId] = useState("BILL-1001");
  const [cashAmount, setCashAmount] = useState(500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Match Unapplied Modal State
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedUnapplied, setSelectedUnapplied] = useState<UnappliedPayment | null>(null);
  const [matchBillId, setMatchBillId] = useState("BILL-1001");

  const refresh = () => {
    setIsRefreshing(true);
    setPayments(getAllPayments());
    setUnapplied(getAllUnappliedPayments());
    setTimeout(() => setIsRefreshing(false), 200);
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredPayments = useMemo(() => {
    let list = payments;
    if (methodFilter !== "ALL") {
      list = list.filter((p) => p.payment_method === methodFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.receipt_number.toLowerCase().includes(q) ||
          (p.transaction_reference && p.transaction_reference.toLowerCase().includes(q)) ||
          p.bill_id.toLowerCase().includes(q) ||
          (p.patient_name && p.patient_name.toLowerCase().includes(q)) ||
          (p.patient_id && p.patient_id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [payments, methodFilter, searchQuery]);

  const handlePostCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cashAmount <= 0) {
      setFeedbackMsg({ type: "error", text: "Cash payment amount must be greater than 0." });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = PaymentProcessingService.recordCashPayment({
        billId: targetBillId.trim(),
        amount: cashAmount,
        actor: user,
      });

      if (res.success && res.payment) {
        setFeedbackMsg({
          type: "success",
          text: `Recorded cash payment ${res.payment.id} (Receipt: ${res.payment.receipt_number}) for Bill ${targetBillId}`,
        });
        setShowCashModal(false);
        refresh();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to post cash payment." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMatchUnapplied = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnapplied) return;

    const targetBill = getBillById(matchBillId);
    if (!targetBill) {
      setFeedbackMsg({ type: "error", text: `Bill ${matchBillId} not found.` });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const payNum = 1000 + Date.now() % 9000;
      const payId = `PAY-MATCH-${payNum}`;
      const recNum = `REC-BANK-${payNum}`;

      const newPay: PaymentRecord = {
        id: payId,
        payment_intent_id: `INTENT-MATCH-${payNum}`,
        bill_id: targetBill.id,
        patient_id: targetBill.patient_id,
        patient_name: targetBill.patient_name,
        organization_id: targetBill.organization_id,
        facility_id: targetBill.facility_id,
        amount: selectedUnapplied.amount,
        currency: "INR",
        payment_method: selectedUnapplied.payment_method,
        status: "SUCCESS",
        settlement_status: "SETTLED",
        receipt_number: recNum,
        transaction_reference: selectedUnapplied.reference,
        initiated_at: selectedUnapplied.received_at,
        completed_at: now,
        settled_at: now,
        actor_id: user?.identifier || user?.id || "STAFF",
        actor_name: user?.fullName || "Cashier",
        created_at: now,
        updated_at: now,
      };

      savePaymentRecord(newPay);

      savePaymentAllocation({
        id: `PAYALLOC-${payNum}`,
        payment_id: payId,
        bill_id: targetBill.id,
        allocated_amount: selectedUnapplied.amount,
        source_type: "PATIENT",
        created_at: now,
      });

      selectedUnapplied.status = "MATCHED";
      selectedUnapplied.matched_bill_id = targetBill.id;
      saveUnappliedPayment(selectedUnapplied);

      appendAuditEvent(
        "PAYMENT_ALLOCATED" as any,
        user?.identifier || user?.id || "STAFF",
        user?.fullName || "Finance Staff",
        user?.role || "finance_staff",
        `Matched unapplied deposit ${selectedUnapplied.id} (₹${selectedUnapplied.amount}) to bill ${targetBill.id}`,
        targetBill.patient_id,
        targetBill.organization_id,
        undefined,
        payId
      );

      setFeedbackMsg({
        type: "success",
        text: `Matched deposit ${selectedUnapplied.id} to Bill ${targetBill.id} (Receipt: ${recNum})`,
      });
      setShowMatchModal(false);
      refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCollected = useMemo(() => {
    return payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "finance_staff", "doctor", "receptionist"]}>
      <div className="min-h-screen space-y-6 max-w-7xl mx-auto pb-24 font-sans animate-in fade-in-50 duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/hospital/billing">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs">
                <ArrowLeft className="h-4 w-4 mr-1" /> Billing Console
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-teal-600" /> Hospital Financial Transactions Desk
                </h1>
                <Badge variant="outline" className="text-xs font-mono bg-teal-50 text-teal-800 border-teal-200">
                  {targetFacId}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Multi-channel settlement tracking, receipt generation, direct cash posting & unapplied deposit reconciliation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCashModal(true)}
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs gap-1.5"
            >
              <Plus className="h-4 w-4" /> Record Direct Cash
            </Button>
            <Button size="sm" variant="outline" onClick={refresh} className="rounded-xl text-xs gap-1">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Unapplied / Unmatched Bank Deposits Queue */}
        {unapplied.some((u) => u.status === "UNMATCHED") && (
          <Card className="bg-amber-50/70 border-amber-300 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                    Unallocated Bank Deposits Pending Matching
                  </h3>
                  <p className="text-xs text-amber-900 mt-0.5">
                    Direct NEFT/RTGS bank credits received without automated invoice attribution. Match to patient bills below.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 divide-y divide-amber-200/80 bg-white rounded-xl border border-amber-200 overflow-hidden text-xs">
              {unapplied
                .filter((u) => u.status === "UNMATCHED")
                .map((u) => (
                  <div key={u.id} className="p-3 flex items-center justify-between gap-3 hover:bg-amber-50/50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-900">{u.id}</span>
                        <Badge variant="outline" className="text-[10px] font-mono bg-white">
                          {u.reference}
                        </Badge>
                        <span className="font-bold text-slate-900">{u.source_name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Received: {new Date(u.received_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-slate-900 text-sm">₹{u.amount.toFixed(2)}</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUnapplied(u);
                          setShowMatchModal(true);
                        }}
                        className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg h-7"
                      >
                        Match to Bill →
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Transactions Table & Filters */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {["ALL", "UPI", "CARD", "CASH", "BANK_TRANSFER"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      methodFilter === m
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {m === "ALL" ? "All Methods" : m}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Receipt, Txn Ref, Bill ID..."
                  className="text-xs pl-8 h-8 bg-slate-50 border-slate-200 rounded-xl"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredPayments.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {filteredPayments.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] font-bold bg-emerald-50 text-emerald-900 border-emerald-200">
                          {p.receipt_number}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 font-bold">
                          {p.payment_method}
                        </Badge>
                        <Badge variant={p.status === "SUCCESS" ? "default" : "warning"} className="text-[9px] uppercase font-bold">
                          {p.status}
                        </Badge>
                        <span className="font-mono text-[11px] text-teal-700 font-bold">
                          Bill: {p.bill_id}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-slate-600">
                        <span>Patient: <strong className="text-slate-900">{p.patient_name || "Rahul Verma"}</strong> ({p.patient_id})</span>
                        <span>•</span>
                        <span>Txn Ref: <strong className="font-mono text-slate-900">{p.transaction_reference || p.provider_reference}</strong></span>
                        <span>•</span>
                        <span>Cashier: <strong>{p.actor_name || "Cash Desk"}</strong></span>
                      </div>

                      <div className="text-[10px] text-slate-400">
                        Settled At: {new Date(p.settled_at || p.created_at).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-base font-black text-emerald-900 font-mono block">
                          ₹{p.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block">SETTLED</span>
                      </div>
                      <Link href={`/hospital/billing/${p.bill_id}`}>
                        <Button size="sm" variant="outline" className="text-xs rounded-xl font-bold h-8 gap-1">
                          <span>View Bill</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 space-y-1">
                <Receipt className="h-8 w-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">No transactions found</p>
                <p>No payment records match the selected filter.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Direct Cash Payment */}
        {showCashModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Record Direct Cash Collection</h3>
                </div>
                <button onClick={() => setShowCashModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handlePostCash} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Bill ID *</label>
                  <input
                    type="text"
                    value={targetBillId}
                    onChange={(e) => setTargetBillId(e.target.value)}
                    placeholder="e.g. BILL-1001"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cash Collected Amount (₹) *</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    min={1}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono font-black"
                    required
                  />
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                  <strong>Cashier Attribution:</strong> This transaction will be stamped under your authenticated identity (<strong>{user?.fullName || "Cashier"}</strong>) with immediate receipt generation.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCashModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {isSubmitting ? "Posting..." : `Post Cash (₹${cashAmount.toFixed(2)})`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Match Unapplied Deposit */}
        {showMatchModal && selectedUnapplied && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-amber-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Match Bank Deposit to Bill</h3>
                </div>
                <button onClick={() => setShowMatchModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleMatchUnapplied} className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900">{selectedUnapplied.source_name}</div>
                  <div className="font-mono text-slate-600 text-[11px]">UTR: {selectedUnapplied.reference}</div>
                  <div className="font-mono font-black text-amber-900 text-sm pt-1">
                    Deposit Amount: ₹{selectedUnapplied.amount.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Bill ID *</label>
                  <input
                    type="text"
                    value={matchBillId}
                    onChange={(e) => setMatchBillId(e.target.value)}
                    placeholder="e.g. BILL-1001"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono font-bold"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMatchModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {isSubmitting ? "Matching..." : "Allocate Deposit"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
