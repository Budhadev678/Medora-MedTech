"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Filter,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Building2,
  User,
  Plus,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
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
import { getAllBills, getFacilityBills, saveBill } from "@/lib/data/billing-store";
import { getAllPayments } from "@/lib/data/payment-store";
import { BillingEngineService } from "@/lib/services/billing-engine-service";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";
import { HealthcareBill } from "@/types/database.types";

export default function HospitalBillingConsolePage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode) || getFacilityById("FAC-1001");
  const targetFacId = facility?.facility_code || "FAC-1001";

  const [bills, setBills] = useState<HealthcareBill[]>([]);
  const [filterTab, setFilterTab] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Draft Bill Modal State
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [newPatientId, setNewPatientId] = useState("PAT-1001");
  const [newPatientName, setNewPatientName] = useState("Rahul Verma");
  const [newEncounterId, setNewEncounterId] = useState("ENC-1001");
  const [newBillType, setNewBillType] = useState<"FINAL" | "INTERIM">("FINAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const refresh = () => {
    setIsRefreshing(true);
    const list = getFacilityBills(targetFacId);
    setBills(list.length > 0 ? list : getAllBills());
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener("medora-billing-updated", handleUpdate);
    window.addEventListener("medora-bills-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-billing-updated", handleUpdate);
      window.removeEventListener("medora-bills-updated", handleUpdate);
    };
  }, [targetFacId]);

  // Derive Financial Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let openDrafts = 0;
    let openDisputes = 0;

    bills.forEach((b) => {
      totalBilled += b.gross_total || 0;
      const bal = PaymentProcessingService.calculateOutstandingBalance(b.id);
      totalPaid += bal.totalSettledPayments || 0;
      totalOutstanding += bal.outstandingBalance || 0;
      if (b.status === "DRAFT") openDrafts++;
      if (b.status === "DISPUTED") openDisputes++;
    });

    return { totalBilled, totalPaid, totalOutstanding, openDrafts, openDisputes };
  }, [bills]);

  const filteredBills = useMemo(() => {
    let list = bills;

    if (filterTab === "DRAFT") {
      list = list.filter((b) => b.status === "DRAFT");
    } else if (filterTab === "ISSUED") {
      list = list.filter((b) => b.status === "ISSUED");
    } else if (filterTab === "PAID") {
      list = list.filter((b) => {
        const bal = PaymentProcessingService.calculateOutstandingBalance(b.id);
        return bal.outstandingBalance === 0 && bal.totalSettledPayments > 0;
      });
    } else if (filterTab === "PARTIALLY_PAID") {
      list = list.filter((b) => {
        const bal = PaymentProcessingService.calculateOutstandingBalance(b.id);
        return bal.outstandingBalance > 0 && bal.totalSettledPayments > 0;
      });
    } else if (filterTab === "DISPUTED") {
      list = list.filter((b) => b.status === "DISPUTED");
    } else if (filterTab === "EXCEPTIONS") {
      list = list.filter((b) => b.items.some((i) => i.verification_status === "BILLING_EXCEPTION"));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.bill_number.toLowerCase().includes(q) ||
          b.patient_name.toLowerCase().includes(q) ||
          b.patient_id.toLowerCase().includes(q)
      );
    }

    return list;
  }, [bills, filterTab, searchTerm]);

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientId.trim() || !newPatientName.trim()) {
      setFeedbackMsg({ type: "error", text: "Patient ID and Name are required." });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = BillingEngineService.createDraftBill({
        patientId: newPatientId.trim().toUpperCase(),
        patientName: newPatientName.trim(),
        organizationId: facility?.organization_id || "11111111-1111-1111-1111-111111111101",
        organizationName: facility?.name || "City Hospital",
        facilityId: targetFacId,
        facilityName: facility?.name || "City Hospital Trauma Center",
        encounterId: newEncounterId.trim() || undefined,
        billType: newBillType,
        actor: user,
      });

      if (res.success && res.bill) {
        setFeedbackMsg({ type: "success", text: `Draft Bill ${res.bill.bill_number} created successfully.` });
        setShowDraftModal(false);
        refresh();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to create draft bill." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "finance_staff", "doctor"]}>
      <div className="min-h-screen space-y-6 max-w-7xl mx-auto pb-24 font-sans animate-in fade-in-50 duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Receipt className="h-5 w-5 text-teal-600" /> Central Billing & Financial Ledger
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-teal-50 text-teal-800 border-teal-200">
                {targetFacId}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold">
                <ShieldCheck className="h-3 w-3 inline mr-1 text-emerald-600" /> Itemized Transparency (Step 3)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authoritative bill creation, itemized charge provenance, payment reconciliation & anti-fraud accounting • {facility?.name || "City Hospital"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowDraftModal(true)}
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-xs gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Draft Bill
            </Button>
            <Link href="/hospital/billing/payments">
              <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-teal-700" /> Payments Desk
              </Button>
            </Link>
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
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Core Financial Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="bg-white border-slate-200 shadow-xs p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Billed</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-slate-900 font-mono">₹{summaryMetrics.totalBilled.toLocaleString("en-IN")}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{bills.length} canonical bills</span>
          </Card>

          <Card className="bg-emerald-50/60 border-emerald-200 shadow-xs p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Total Collected</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-emerald-950 font-mono">₹{summaryMetrics.totalPaid.toLocaleString("en-IN")}</span>
            </div>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">Settled payments</span>
          </Card>

          <Card className="bg-amber-50/60 border-amber-200 shadow-xs p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Outstanding Balance</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-amber-950 font-mono">₹{summaryMetrics.totalOutstanding.toLocaleString("en-IN")}</span>
            </div>
            <span className="text-[10px] text-amber-700 mt-0.5 block">Patient obligation</span>
          </Card>

          <Card className="bg-slate-50 border-slate-200 shadow-xs p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Draft Bills</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-slate-900 font-mono">{summaryMetrics.openDrafts}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Unissued bills</span>
          </Card>

          <Card className="bg-rose-50/60 border-rose-200 shadow-xs p-4 rounded-2xl col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Open Disputes</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-rose-950 font-mono">{summaryMetrics.openDisputes}</span>
            </div>
            <span className="text-[10px] text-rose-700 mt-0.5 block">Financial review</span>
          </Card>
        </div>

        {/* Filter Controls & Search */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { key: "ALL", label: "All Bills" },
                  { key: "DRAFT", label: "Drafts" },
                  { key: "ISSUED", label: "Issued" },
                  { key: "PARTIALLY_PAID", label: "Partially Paid" },
                  { key: "PAID", label: "Fully Paid" },
                  { key: "DISPUTED", label: "Disputed" },
                  { key: "EXCEPTIONS", label: "Exceptions" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      filterTab === tab.key
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Bill #, Patient ID, Name..."
                  className="text-xs pl-8 h-8 bg-slate-50 border-slate-200 rounded-xl"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredBills.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredBills.map((b) => {
                  const bal = PaymentProcessingService.calculateOutstandingBalance(b.id);
                  const hasException = b.items.some((i) => i.verification_status === "BILLING_EXCEPTION");

                  return (
                    <div
                      key={b.id}
                      className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {b.bill_number}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            V{b.current_version}
                          </Badge>
                          <StatusBadge status={b.status} />
                          {hasException && (
                            <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-800 border-rose-300 font-bold">
                              <AlertTriangle className="h-3 w-3 inline mr-1 text-rose-600" /> Exception Flagged
                            </Badge>
                          )}
                          <span className="text-[11px] text-slate-400">
                            {new Date(b.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-slate-600">
                          <span className="font-bold text-slate-900">{b.patient_name}</span>
                          <span className="font-mono text-[11px] text-teal-700 font-semibold">({b.patient_id})</span>
                          <span>•</span>
                          <span>{b.items.length} itemized charges</span>
                          {b.encounter_id && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-slate-500">Enc: {b.encounter_id}</span>
                            </>
                          )}
                        </div>

                        {/* Financial Line Item Summary */}
                        <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                          <span className="text-slate-500">
                            Gross: <strong className="text-slate-900 font-mono">₹{b.gross_total.toFixed(2)}</strong>
                          </span>
                          <span className="text-emerald-700">
                            Paid: <strong className="font-mono">₹{bal.totalSettledPayments.toFixed(2)}</strong>
                          </span>
                          <span className={bal.outstandingBalance > 0 ? "text-amber-800 font-bold" : "text-emerald-800 font-bold"}>
                            Due: <strong className="font-mono">₹{bal.outstandingBalance.toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/hospital/billing/${b.id}`}>
                          <Button size="sm" variant="outline" className="text-xs rounded-xl font-bold h-8 gap-1">
                            <span>Open Bill</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <Receipt className="h-8 w-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">No healthcare bills found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {filterTab !== "ALL"
                    ? `No bills matching filter "${filterTab}". Switch filters or clear search.`
                    : "No bills have been initiated for this facility yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Create Draft Bill */}
        {showDraftModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-teal-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Create New Draft Bill</h3>
                </div>
                <button onClick={() => setShowDraftModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDraft} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient ID *</label>
                  <input
                    type="text"
                    value={newPatientId}
                    onChange={(e) => setNewPatientId(e.target.value)}
                    placeholder="e.g. PAT-1001"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Encounter / Visit Reference (Optional)</label>
                  <input
                    type="text"
                    value={newEncounterId}
                    onChange={(e) => setNewEncounterId(e.target.value)}
                    placeholder="e.g. ENC-1001 or ADM-1001"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bill Type *</label>
                  <select
                    value={newBillType}
                    onChange={(e) => setNewBillType(e.target.value as any)}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-medium"
                  >
                    <option value="FINAL">FINAL (Standard Outpatient / Discharge Bill)</option>
                    <option value="INTERIM">INTERIM (Running Inpatient Stay Bill)</option>
                  </select>
                </div>

                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-[11px] text-teal-900 leading-relaxed">
                  <strong>Draft Isolation:</strong> Draft bills allow staging charges from clinical encounters, diagnostics, and pharmacy before final authoritative locking.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDraftModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {isSubmitting ? "Creating..." : "Create Draft Bill"}
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
