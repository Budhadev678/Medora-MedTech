"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getBillById, getBillVersions } from "@/lib/data/billing-store";
import { BillingEngineService } from "@/lib/services/billing-engine-service";
import { FinancialCoverageService } from "@/lib/services/financial-coverage-service";
import { HealthcareBill, FinancialWaterfallSummary, BillVersion } from "@/types/database.types";

export default function HospitalBillWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const billId = (params?.billId as string) || "";

  const [bill, setBill] = useState<HealthcareBill | null>(null);
  const [waterfall, setWaterfall] = useState<FinancialWaterfallSummary | null>(null);
  const [versions, setVersions] = useState<BillVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Item State
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [serviceCode, setServiceCode] = useState("IMG-MRI-BRAIN-01");
  const [sourceType, setSourceType] = useState<"ENCOUNTER" | "LAB_TEST" | "IMAGING" | "PROCEDURE" | "DISPENSING" | "ADMISSION" | "MANUAL_ENTRY">("IMAGING");
  const [sourceId, setSourceId] = useState("IMG-1001");
  const [quantity, setQuantity] = useState(1);

  // Add Coverage / Discount State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(1000);
  const [discountReason, setDiscountReason] = useState("Hospital manager approval");

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
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [billId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium text-xs">
        <Receipt className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
        Loading healthcare bill...
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Bill Not Found</h2>
        <p className="text-slate-600 text-sm">No healthcare bill found for ID: {billId}</p>
        <Link href="/hospital/billing">
          <Button variant="outline">Back to Billing Console</Button>
        </Link>
      </div>
    );
  }

  const handleAddItem = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = BillingEngineService.addBillableItem({
        billId: bill.id,
        serviceCode,
        sourceType,
        sourceId,
        quantity,
        actor: user,
      });

      if (res.success && res.billItem) {
        setActionSuccess(`Added item ${res.billItem.service_name} (₹${res.billItem.base_amount})`);
        setShowAddItemModal(false);
        refresh();
      } else {
        setActionError(res.error || "Failed to add bill item.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueBill = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = BillingEngineService.issueBill(bill.id, user);
      if (res.success && res.bill) {
        setActionSuccess(`Issued authoritative bill ${res.bill.bill_number}!`);
        refresh();
      } else {
        setActionError(res.error || "Failed to issue bill.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyDiscount = async () => {
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
        setActionSuccess(`Applied discount of ₹${discountAmount}`);
        setShowDiscountModal(false);
        refresh();
      } else {
        setActionError(res.error || "Failed to apply discount.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "doctor", "lab_staff"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/hospital/billing">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Billing Console
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono">{bill.bill_number}</h1>
                <Badge variant="outline" className="text-xs font-mono">V{bill.current_version}</Badge>
                <StatusBadge status={bill.status} />
              </div>
              <p className="text-xs text-slate-500">Patient: {bill.patient_name} ({bill.patient_id}) • Facility: {bill.facility_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {bill.status === "DRAFT" && (
              <>
                <Button onClick={() => setShowAddItemModal(true)} size="sm" variant="outline" className="text-xs rounded-xl">
                  <Plus className="h-4 w-4 mr-1" /> Add Charge Item
                </Button>
                <Button onClick={handleIssueBill} disabled={isSubmitting} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Issue Authoritative Bill
                </Button>
              </>
            )}
            <Button onClick={() => setShowDiscountModal(true)} size="sm" variant="ghost" className="text-xs rounded-xl">
              Apply Discount
            </Button>
          </div>
        </div>

        {/* Feedback alerts */}
        {actionError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0 text-red-600" />
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {actionSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Itemized Charges Table */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Itemized Charges & Source Linkage
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">{bill.items.length} items</Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="p-2.5">Service / Category</th>
                        <th className="p-2.5">Source Event</th>
                        <th className="p-2.5 text-center">Qty / Rate</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bill.items.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block">{item.service_name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{item.service_code} • {item.category}</span>
                          </td>
                          <td className="p-2.5 text-slate-700">
                            <Badge variant="outline" className="text-[10px] font-mono">{item.source_type}: {item.source_id}</Badge>
                          </td>
                          <td className="p-2.5 text-center font-mono">
                            {item.quantity} × ₹{item.unit_price.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <Badge className={item.verification_status === "VERIFIED" ? "bg-emerald-100 text-emerald-800 text-[9px]" : "bg-amber-100 text-amber-800 text-[9px]"}>
                              {item.verification_status}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{item.base_amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-700">Gross Total Charges:</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">₹{bill.gross_total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Version History Table */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <History className="h-4 w-4 text-purple-600" /> Bill Version History & Revision Audit
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                {versions.map((ver) => (
                  <div key={ver.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900 font-mono">Version {ver.version_number}</span>
                      <span className="font-mono text-purple-950">₹{ver.gross_total.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{ver.reason}</p>
                    <span className="text-[10px] text-slate-400 block font-mono">By {ver.created_by_name} at {new Date(ver.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Financial Waterfall Summary */}
          <div className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Financial Waterfall Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Gross Charges:</span>
                  <span className="font-mono font-bold text-slate-900">₹{waterfall?.gross_charges.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-amber-700">
                  <span>Discounts Applied:</span>
                  <span className="font-mono font-bold">-₹{waterfall?.discounts_total.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 font-bold">
                  <span className="text-slate-700">Net Billable Amount:</span>
                  <span className="font-mono text-slate-900">₹{waterfall?.net_billable_total.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                  <span>Insurance Approved:</span>
                  <span className="font-mono font-bold">-₹{waterfall?.insurance_approved_total.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-blue-700">
                  <span>Government Assistance:</span>
                  <span className="font-mono font-bold">-₹{waterfall?.govt_assistance_approved_total.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-purple-700">
                  <span>Hospital Relief Fund:</span>
                  <span className="font-mono font-bold">-₹{waterfall?.hospital_assistance_total.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-indigo-700">
                  <span>CarePay Financing:</span>
                  <span className="font-mono font-bold">-₹{waterfall?.financing_approved_total.toFixed(2) || "0.00"}</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold">
                  <span className="text-purple-950">Patient Due:</span>
                  <span className="font-mono text-purple-950">₹{waterfall?.projected_patient_responsibility.toFixed(2) || "0.00"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal: Add Charge Item */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-emerald-700">
                <Plus className="h-5 w-5 text-emerald-600" /> Add Charge Item with Source Linkage
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Service Code *</label>
                  <select
                    value={serviceCode}
                    onChange={(e) => setServiceCode(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 bg-white font-bold"
                  >
                    <option value="CONS-OPD-01">CONS-OPD-01 (Consultation: ₹500)</option>
                    <option value="IMG-MRI-BRAIN-01">IMG-MRI-BRAIN-01 (MRI Brain: ₹12,000)</option>
                    <option value="LAB-CBC-01">LAB-CBC-01 (Complete Blood Count: ₹500)</option>
                    <option value="MED-PCM-500">MED-PCM-500 (Paracetamol Strip: ₹150)</option>
                    <option value="ROOM-ICU-DAY">ROOM-ICU-DAY (ICU Room Stay: ₹8,000)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Source Type *</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as any)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 bg-white"
                  >
                    <option value="ENCOUNTER">ENCOUNTER</option>
                    <option value="LAB_TEST">LAB_TEST</option>
                    <option value="IMAGING">IMAGING</option>
                    <option value="DISPENSING">DISPENSING</option>
                    <option value="MANUAL_ENTRY">MANUAL_ENTRY</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Source Event Reference ID *</label>
                  <input
                    type="text"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddItemModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddItem} disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl">
                  Add Item to Bill
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Apply Discount */}
        {showDiscountModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 text-amber-700">Apply Authorized Hospital Discount</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Discount Amount (₹) *</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Reason / Authorization *</label>
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowDiscountModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleApplyDiscount} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl">
                  Apply Discount
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
