"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Receipt,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  Plus,
  HelpCircle,
  Pill,
  Lock,
  Layers,
  FileSpreadsheet,
  History,
  Building2,
  CreditCard,
  RefreshCw,
  DollarSign,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Tag,
  Printer,
  FileText,
  AlertCircle,
  X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getBillById, getBillVersions } from "@/lib/data/billing-store";
import { getPaymentsForBill, getRefundsForPayment, saveRefundRecord } from "@/lib/data/payment-store";
import { BillingEngineService } from "@/lib/services/billing-engine-service";
import { FinancialCoverageService } from "@/lib/services/financial-coverage-service";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";
import { HealthcareBill, FinancialWaterfallSummary, BillVersion, PaymentRecord, BillableItem, RefundRecord } from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";

export default function HospitalBillWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const billId = (params?.billId as string) || "";

  const [bill, setBill] = useState<HealthcareBill | null>(null);
  const [waterfall, setWaterfall] = useState<FinancialWaterfallSummary | null>(null);
  const [versions, setVersions] = useState<BillVersion[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProvenance, setExpandedProvenance] = useState<Record<string, boolean>>({});

  // Add Item Modal State
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [serviceCode, setServiceCode] = useState("IMG-MRI-BRAIN-01");
  const [sourceType, setSourceType] = useState<"ENCOUNTER" | "LAB_TEST" | "IMAGING" | "PROCEDURE" | "DISPENSING" | "ADMISSION" | "MANUAL_ENTRY">("IMAGING");
  const [sourceId, setSourceId] = useState("IMG-1001");
  const [quantity, setQuantity] = useState(1);
  const [manualDescription, setManualDescription] = useState("");

  // Receive Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<"UPI" | "CARD" | "CASH" | "BANK_TRANSFER">("UPI");
  const [payTxnRef, setPayTxnRef] = useState("");

  // Apply Discount / Waiver State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(1000);
  const [discountReason, setDiscountReason] = useState("Hospital administrative fee waiver");

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState("Duplicate charge correction");

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = () => {
    if (!billId) return;
    const b = getBillById(billId);
    setBill(b);
    if (b) {
      const summary = FinancialCoverageService.calculateFinancialWaterfall(b.id);
      setWaterfall(summary);
      const verList = getBillVersions(b.id);
      setVersions(verList);
      const payList = getPaymentsForBill(b.id);
      setPayments(payList);

      const bal = PaymentProcessingService.calculateOutstandingBalance(b.id);
      setPayAmount(bal.outstandingBalance > 0 ? bal.outstandingBalance : 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [billId]);

  const toggleProvenance = (itemId: string) => {
    setExpandedProvenance((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // ------------------------------------------------------------
  // 1. ADD ITEM TO BILL
  // ------------------------------------------------------------
  const handleAddItem = async () => {
    if (!bill) return;
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = BillingEngineService.addBillableItem({
        billId: bill.id,
        serviceCode,
        sourceType,
        sourceId: sourceId || `REF-${Date.now() % 10000}`,
        quantity,
        manualDescription: sourceType === "MANUAL_ENTRY" ? manualDescription : undefined,
        actor: user,
      });

      if (res.success && res.billItem) {
        setActionSuccess(`Added item "${res.billItem.service_name}" (₹${res.billItem.base_amount.toFixed(2)})`);
        setShowAddItemModal(false);
        refresh();
      } else {
        setActionError(res.error || "Failed to add bill item.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // 2. ISSUE AUTHORITATIVE BILL
  // ------------------------------------------------------------
  const handleIssueBill = async () => {
    if (!bill) return;
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = BillingEngineService.issueBill(bill.id, user);
      if (res.success && res.bill) {
        setActionSuccess(`Issued authoritative bill ${res.bill.bill_number} (V1 Snapshot Created)!`);
        refresh();
      } else {
        setActionError(res.error || "Failed to issue bill.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // 3. RECEIVE PAYMENT
  // ------------------------------------------------------------
  const handleReceivePayment = async () => {
    if (!bill || payAmount <= 0) {
      setActionError("Payment amount must be greater than 0.");
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      if (payMethod === "CASH") {
        const res = PaymentProcessingService.recordCashPayment({
          billId: bill.id,
          amount: payAmount,
          actor: user,
        });
        if (res.success && res.payment) {
          setActionSuccess(`Recorded cash payment of ₹${payAmount.toFixed(2)} (Receipt #${res.payment.receipt_number})`);
          setShowPaymentModal(false);
          refresh();
        } else {
          setActionError(res.error || "Failed to record cash payment.");
        }
      } else {
        const intentRes = PaymentProcessingService.createPaymentIntent({
          billId: bill.id,
          amount: payAmount,
          idempotencyKey: `IDEMP-${bill.id}-${payMethod}-${Date.now()}`,
          actor: user,
        });

        if (!intentRes.success || !intentRes.intent) {
          setActionError(intentRes.error || "Failed to create payment intent.");
          return;
        }

        const payRes = PaymentProcessingService.executePaymentAttempt({
          intentId: intentRes.intent.id,
          paymentMethod: payMethod,
          transactionReference: payTxnRef || `TXN-${payMethod}-${Date.now() % 10000}`,
          actor: user,
        });

        if (payRes.success && payRes.payment) {
          setActionSuccess(`Settled ${payMethod} payment of ₹${payAmount.toFixed(2)} (Receipt #${payRes.payment.receipt_number})`);
          setShowPaymentModal(false);
          refresh();
        } else {
          setActionError(payRes.error || "Failed to settle payment.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // 4. APPLY DISCOUNT / WAIVER
  // ------------------------------------------------------------
  const handleApplyDiscount = async () => {
    if (!bill) return;
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = FinancialCoverageService.applyDiscount({
        billId: bill.id,
        discountType: "HOSPITAL_DISCOUNT",
        amount: discountAmount,
        reason: discountReason,
        actor: user,
      });

      if (res.success) {
        setActionSuccess(`Applied discount / fee waiver of ₹${discountAmount.toFixed(2)}`);
        setShowDiscountModal(false);
        refresh();
      } else {
        setActionError(res.error || "Failed to apply discount.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // 5. PROCESS REFUND
  // ------------------------------------------------------------
  const handleProcessRefund = async () => {
    if (!bill || !refundPaymentId || refundAmount <= 0) {
      setActionError("Valid payment ID and refund amount required.");
      return;
    }

    const origPay = payments.find((p) => p.id === refundPaymentId);
    if (!origPay) {
      setActionError("Original payment record not found.");
      return;
    }

    if (refundAmount > origPay.amount) {
      setActionError(`Refund amount cannot exceed original payment amount (₹${origPay.amount.toFixed(2)}).`);
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const refId = `REFUND-${Date.now() % 10000}`;
      const refundRec: RefundRecord = {
        id: refId,
        payment_id: origPay.id,
        bill_id: bill.id,
        patient_id: bill.patient_id,
        amount: refundAmount,
        currency: "INR",
        reason: refundReason,
        status: "COMPLETED",
        requested_by_id: user?.identifier || user?.id || "STAFF",
        requested_by_name: user?.fullName || "Finance Desk",
        approved_by_id: user?.identifier || user?.id || "STAFF",
        approved_by_name: user?.fullName || "Finance Desk",
        receipt_number: `REF-REC-${Date.now() % 10000}`,
        completed_at: now,
        created_at: now,
      };

      saveRefundRecord(refundRec);

      appendAuditEvent(
        "REFUND_PROCESSED" as any,
        user?.identifier || user?.id || "STAFF",
        user?.fullName || "Finance Staff",
        user?.role || "finance_staff",
        `Processed refund ${refId} of ₹${refundAmount.toFixed(2)} for payment ${origPay.id} on bill ${bill.id}. Reason: ${refundReason}`,
        bill.patient_id,
        bill.organization_id,
        undefined,
        bill.id
      );

      setActionSuccess(`Refund ${refId} of ₹${refundAmount.toFixed(2)} processed successfully.`);
      setShowRefundModal(false);
      refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium text-xs">
        <Receipt className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-2" />
        Loading healthcare billing workspace...
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4 font-sans">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Healthcare Bill Not Found</h2>
        <p className="text-slate-600 text-xs">No authoritative bill record found for identifier: {billId}</p>
        <Link href="/hospital/billing">
          <Button variant="outline" size="sm" className="text-xs">
            ← Back to Billing Console
          </Button>
        </Link>
      </div>
    );
  }

  const bal = PaymentProcessingService.calculateOutstandingBalance(bill.id);
  const totalSettledPaid = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "finance_staff", "doctor", "receptionist"]}>
      <div className="min-h-screen space-y-6 max-w-7xl mx-auto pb-24 font-sans animate-in fade-in-50 duration-200">
        
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/hospital/billing">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs">
                <ArrowLeft className="h-4 w-4 mr-1" /> Billing Console
              </Button>
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 font-mono tracking-tight">{bill.bill_number}</h1>
                <Badge variant="outline" className="text-xs font-mono font-bold bg-slate-50">
                  Version {bill.current_version}
                </Badge>
                <StatusBadge status={bill.status} />
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-teal-800 bg-teal-50 border-teal-200">
                  {bill.bill_type} BILL
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Patient: <strong className="text-slate-900">{bill.patient_name}</strong> (<span className="font-mono text-teal-700">{bill.patient_id}</span>) • {bill.facility_name}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {bill.status === "DRAFT" ? (
              <>
                <Button
                  onClick={() => setShowAddItemModal(true)}
                  size="sm"
                  variant="outline"
                  className="text-xs rounded-xl font-bold gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Charge Item
                </Button>
                <Button
                  onClick={handleIssueBill}
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-xs gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Issue Authoritative Bill
                </Button>
              </>
            ) : (
              <>
                {bal.outstandingBalance > 0 && (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    size="sm"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs gap-1.5"
                  >
                    <CreditCard className="h-4 w-4" /> Receive Payment
                  </Button>
                )}
                <Button
                  onClick={() => setShowDiscountModal(true)}
                  size="sm"
                  variant="outline"
                  className="text-xs rounded-xl font-bold gap-1 text-amber-800 hover:bg-amber-50 border-amber-200"
                >
                  <Tag className="h-3.5 w-3.5" /> Apply Waiver / Discount
                </Button>
                {payments.length > 0 && (
                  <Button
                    onClick={() => {
                      setRefundPaymentId(payments[0]?.id || "");
                      setRefundAmount(payments[0]?.amount || 0);
                      setShowRefundModal(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="text-xs rounded-xl font-bold gap-1 text-slate-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Process Refund
                  </Button>
                )}
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="text-xs rounded-xl gap-1"
            >
              <Printer className="h-3.5 w-3.5" /> Print Bill
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionSuccess && (
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Core Financial Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <Card className="bg-white border-slate-200 shadow-xs p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Gross Total</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">₹{bill.gross_total.toFixed(2)}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{bill.items.length} line items</span>
          </Card>

          <Card className="bg-amber-50/60 border-amber-200 shadow-xs p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">2. Discounts / Waivers</span>
            <div className="text-lg font-black text-amber-950 font-mono mt-1">
              -₹{(waterfall?.discounts_total || 0).toFixed(2)}
            </div>
            <span className="text-[10px] text-amber-700 mt-0.5 block">Approved reductions</span>
          </Card>

          <Card className="bg-blue-50/60 border-blue-200 shadow-xs p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">3. Insurance / Assistance</span>
            <div className="text-lg font-black text-blue-950 font-mono mt-1">
              -₹{((waterfall?.gross_charges || 0) - (waterfall?.projected_patient_responsibility || 0)).toFixed(2)}
            </div>
            <span className="text-[10px] text-blue-700 mt-0.5 block">Third-party coverage</span>
          </Card>

          <Card className="bg-purple-50/60 border-purple-200 shadow-xs p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">4. Patient Share</span>
            <div className="text-lg font-black text-purple-950 font-mono mt-1">
              ₹{(waterfall?.projected_patient_responsibility || bill.net_billable_total).toFixed(2)}
            </div>
            <span className="text-[10px] text-purple-700 mt-0.5 block">Net patient obligation</span>
          </Card>

          <Card className="bg-emerald-50/60 border-emerald-200 shadow-xs p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">5. Settled Payments</span>
            <div className="text-lg font-black text-emerald-950 font-mono mt-1">
              ₹{totalSettledPaid.toFixed(2)}
            </div>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">{payments.length} transaction(s)</span>
          </Card>

          <Card className={`shadow-xs p-4 rounded-2xl col-span-2 sm:col-span-1 ${bal.outstandingBalance > 0 ? "bg-rose-50 border-rose-200 text-rose-950" : "bg-emerald-100/60 border-emerald-300 text-emerald-950"}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block">6. Balance Due</span>
            <div className="text-lg font-black font-mono mt-1">₹{bal.outstandingBalance.toFixed(2)}</div>
            <span className="text-[10px] mt-0.5 block font-semibold">
              {bal.outstandingBalance === 0 ? "✓ Fully Cleared" : "Payment Pending"}
            </span>
          </Card>
        </div>

        {/* Itemized Charges Table (Strict Transparency - Rule 1 of Step 3) */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-teal-600" />
                <CardTitle className="text-sm font-bold text-slate-900">Itemized Healthcare Services & Line Charges</CardTitle>
              </div>
              <p className="text-[11px] text-slate-500">Every charge possesses an authenticated source event, quantity, unit price snapshot, and verification status.</p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {bill.items.length} Charge Item(s)
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <th className="p-3 pl-4">Service & Code</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Source Event</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Line Total</th>
                    <th className="p-3 text-center">Verification</th>
                    <th className="p-3 pr-4 text-right">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {bill.items.map((item, idx) => {
                    const isExpanded = expandedProvenance[item.id];
                    return (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 pl-4">
                            <div className="font-bold text-slate-900">{item.service_name}</div>
                            <div className="font-mono text-[10px] text-slate-400">{item.service_code}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] font-semibold bg-slate-50">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 inline-block">
                              {item.source_type}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">{item.source_id}</div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">{item.quantity}</td>
                          <td className="p-3 text-right font-mono text-slate-600">₹{item.unit_price.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-black text-slate-900">₹{item.base_amount.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <Badge
                              variant={
                                item.verification_status === "VERIFIED"
                                  ? "teal"
                                  : item.verification_status === "BILLING_EXCEPTION"
                                  ? "emergency"
                                  : "warning"
                              }
                              className="text-[9px] uppercase font-bold"
                            >
                              {item.verification_status}
                            </Badge>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            {item.provenance ? (
                              <button
                                onClick={() => toggleProvenance(item.id)}
                                className="text-teal-700 hover:text-teal-900 font-bold text-[11px] inline-flex items-center gap-1"
                              >
                                <span>{isExpanded ? "Hide" : "Audit Link"}</span>
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Provenance Detail */}
                        {isExpanded && item.provenance && (
                          <tr className="bg-teal-50/40 border-b border-teal-100">
                            <td colSpan={8} className="p-3 pl-6 text-[11px] text-teal-950">
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-teal-200">
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Ordered / Supervised By:</span>
                                  <strong className="text-slate-900 font-bold">{item.provenance.ordered_by_name || "Doctor"}</strong>
                                  <span className="font-mono text-[10px] text-slate-500 block">({item.provenance.ordered_by_id})</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Order / Encounter Ref:</span>
                                  <span className="font-mono font-bold text-slate-900">{item.provenance.order_reference_id || item.source_id}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Performed At:</span>
                                  <span>{item.provenance.performed_at ? new Date(item.provenance.performed_at).toLocaleString() : "Documented"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px]">Clinical Reason / Indication:</span>
                                  <span className="italic text-slate-700 font-medium">{item.provenance.clinical_reason || "Medical necessity"}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payments & Receipts Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-sm font-bold text-slate-900">Payment Transactions & Receipts</CardTitle>
                </div>
                <p className="text-[11px] text-slate-500">Separately recorded financial settlement entries with cashier attribution.</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold">
                ₹{totalSettledPaid.toFixed(2)} Paid
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {payments.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {payments.map((p) => (
                    <div key={p.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200">
                            {p.receipt_number}
                          </Badge>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {p.payment_method}
                          </Badge>
                          <Badge variant={p.status === "SUCCESS" ? "default" : "warning"} className="text-[9px] uppercase font-bold">
                            {p.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Ref: <span className="font-mono">{p.transaction_reference || p.provider_reference}</span> • Received by: <strong>{p.actor_name || "Cashier"}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(p.settled_at || p.created_at).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-800 font-mono block">
                          ₹{p.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block">SETTLED</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No payment transactions recorded for this bill yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Immutable Bill Versioning Trail */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-purple-600" />
                  <CardTitle className="text-sm font-bold text-slate-900">Immutable Version Snapshots</CardTitle>
                </div>
                <p className="text-[11px] text-slate-500">Every price and charge adjustment captures an immutable audit record.</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold">
                {versions.length} Version(s)
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {versions.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {versions.map((ver) => (
                    <div key={ver.id} className="p-4 hover:bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                            Version {ver.version_number}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {new Date(ver.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className="font-mono font-black text-slate-900 text-xs">
                          Gross: ₹{ver.gross_total.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs italic">"{ver.reason}"</p>
                      <div className="text-[10px] text-slate-400">
                        Authorized by: <strong>{ver.authorized_by_name}</strong> ({ver.authorized_by_id}) • Delta:{" "}
                        <strong className={ver.change_delta >= 0 ? "text-slate-900" : "text-emerald-700"}>
                          {ver.change_delta >= 0 ? "+" : ""}₹{ver.change_delta.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Initial version snapshot will be generated upon bill issuance.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal: Receive Payment */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Record Patient Settlement Payment</h3>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    max={bal.outstandingBalance > 0 ? bal.outstandingBalance : undefined}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono font-black text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Outstanding balance: ₹{bal.outstandingBalance.toFixed(2)} (Partial payments supported)
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-medium"
                  >
                    <option value="UPI">UPI / QR Code Scan</option>
                    <option value="CARD">Debit / Credit Card POS</option>
                    <option value="CASH">Direct Cash Collection</option>
                    <option value="BANK_TRANSFER">NEFT / RTGS / Bank Wire</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transaction Reference (Optional)</label>
                  <input
                    type="text"
                    value={payTxnRef}
                    onChange={(e) => setPayTxnRef(e.target.value)}
                    placeholder="e.g. UPI-TXN-998822 or POS-AUTH-4411"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono"
                  />
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                  <strong>Instant Receipt:</strong> Submitting this payment will automatically update the hospital balance ledger and generate an official receipt for the patient.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPaymentModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReceivePayment}
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {isSubmitting ? "Settling..." : `Confirm Settlement (₹${payAmount.toFixed(2)})`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Charge Item */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-teal-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Add Itemized Clinical Charge</h3>
                </div>
                <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catalog Service *</label>
                  <select
                    value={serviceCode}
                    onChange={(e) => setServiceCode(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-bold"
                  >
                    <option value="CONS-OPD-01">CONS-OPD-01: Outpatient Doctor Consultation (₹500.00)</option>
                    <option value="IMG-MRI-BRAIN-01">IMG-MRI-BRAIN-01: MRI Brain Diagnostic (₹12,000.00)</option>
                    <option value="LAB-CBC-01">LAB-CBC-01: Complete Blood Count (CBC) (₹500.00)</option>
                    <option value="MED-PCM-500">MED-PCM-500: Paracetamol 500mg (10s) (₹1,000.00)</option>
                    <option value="ROOM-ICU-DAY">ROOM-ICU-DAY: ICU Ward Stay (Per Day) (₹8,000.00)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Source Department / Channel *</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as any)}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50"
                  >
                    <option value="ENCOUNTER">ENCOUNTER (Doctor Consultation)</option>
                    <option value="LAB_TEST">LAB_TEST (Laboratory Diagnostic Order)</option>
                    <option value="IMAGING">IMAGING (Radiology / Scan Order)</option>
                    <option value="DISPENSING">DISPENSING (Hospital Pharmacy)</option>
                    <option value="PROCEDURE">PROCEDURE (Surgery / Clinical Ward)</option>
                    <option value="MANUAL_ENTRY">MANUAL_ENTRY (Authorized Manual Charge)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Source Reference ID *</label>
                  <input
                    type="text"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    placeholder="e.g. ENC-1001 or LAB-1001"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono font-bold"
                  />
                </div>

                {sourceType === "MANUAL_ENTRY" && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Manual Charge Rationale *</label>
                    <input
                      type="text"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="Mandatory clinical justification for manual addition"
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddItemModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddItem}
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {isSubmitting ? "Adding..." : "Add to Bill"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Apply Discount / Waiver */}
        {showDiscountModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-amber-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Apply Fee Waiver / Hospital Discount</h3>
                </div>
                <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Amount (₹) *</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Authorization Reason / Justification *</label>
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="e.g. Senior citizen concession or hospital charity fund"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDiscountModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApplyDiscount}
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {isSubmitting ? "Applying..." : "Apply Discount"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Process Refund */}
        {showRefundModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-rose-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Process Transaction Refund</h3>
                </div>
                <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Payment *</label>
                  <select
                    value={refundPaymentId}
                    onChange={(e) => {
                      setRefundPaymentId(e.target.value);
                      const target = payments.find((p) => p.id === e.target.value);
                      if (target) setRefundAmount(target.amount);
                    }}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-medium"
                  >
                    {payments.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.receipt_number} ({p.payment_method}) — ₹{p.amount.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Refund Amount (₹) *</label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason for Refund *</label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. Duplicate charge or patient cancellation"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRefundModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProcessRefund}
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {isSubmitting ? "Processing..." : `Confirm Refund (₹${refundAmount.toFixed(2)})`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
