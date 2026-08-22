"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Receipt,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Info,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getBillById } from "@/lib/data/billing-store";
import { FinancialCoverageService } from "@/lib/services/financial-coverage-service";
import { HealthcareBill, BillableItem, FinancialWaterfallSummary } from "@/types/database.types";

export default function PatientBillDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const billId = (params?.billId as string) || "";

  const [bill, setBill] = useState<HealthcareBill | null>(null);
  const [waterfall, setWaterfall] = useState<FinancialWaterfallSummary | null>(null);
  const [selectedWhyItem, setSelectedWhyItem] = useState<BillableItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billId) return;
    const b = getBillById(billId);
    setBill(b);
    if (b) {
      const summary = FinancialCoverageService.calculateFinancialWaterfall(b.id);
      setWaterfall(summary);
    }
    setLoading(false);
  }, [billId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium text-xs">
        <Receipt className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
        Loading bill details...
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Bill Not Found</h2>
        <p className="text-slate-600 text-sm">No healthcare bill found for ID: {billId}</p>
        <Link href="/patient/billing">
          <Button variant="outline">Back to Bills</Button>
        </Link>
      </div>
    );
  }

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
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono">{bill.bill_number}</h1>
                <StatusBadge status={bill.status} />
              </div>
              <p className="text-xs text-slate-500">{bill.facility_name}</p>
            </div>
          </div>
        </div>

        {/* Financial Waterfall Breakdown */}
        <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" /> Interactive Financial Coverage Waterfall
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-bold">
                <span className="text-slate-700">Gross Total Service Charges:</span>
                <span className="font-mono text-slate-900 text-sm">₹{waterfall?.gross_charges.toFixed(2)}</span>
              </div>

              {waterfall && waterfall.discounts_total > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between font-semibold text-amber-900">
                  <span>Hospital Discounts Applied:</span>
                  <span className="font-mono">-₹{waterfall.discounts_total.toFixed(2)}</span>
                </div>
              )}

              {waterfall && waterfall.insurance_approved_total > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between font-semibold text-emerald-900">
                  <div>
                    <span className="block font-bold">Insurance Coverage Approved:</span>
                    <span className="text-[10px] text-emerald-700">Settlement state: ₹{waterfall.insurance_received_total.toFixed(2)} received</span>
                  </div>
                  <span className="font-mono font-bold">-₹{waterfall.insurance_approved_total.toFixed(2)}</span>
                </div>
              )}

              {waterfall && waterfall.govt_assistance_approved_total > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between font-semibold text-blue-900">
                  <div>
                    <span className="block font-bold">Government Assistance (BSKY / Scheme):</span>
                    <span className="text-[10px] text-blue-700">State universal healthcare benefit</span>
                  </div>
                  <span className="font-mono font-bold">-₹{waterfall.govt_assistance_approved_total.toFixed(2)}</span>
                </div>
              )}

              {waterfall && waterfall.hospital_assistance_total > 0 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between font-semibold text-purple-900">
                  <span>Hospital Hardship Relief Fund:</span>
                  <span className="font-mono font-bold">-₹{waterfall.hospital_assistance_total.toFixed(2)}</span>
                </div>
              )}

              {waterfall && waterfall.financing_approved_total > 0 && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between font-semibold text-indigo-900">
                  <div>
                    <span className="block font-bold">MEDORA CarePay Micro-Financing:</span>
                    <span className="text-[10px] text-indigo-700">Financed (Repayment obligation)</span>
                  </div>
                  <span className="font-mono font-bold">-₹{waterfall.financing_approved_total.toFixed(2)}</span>
                </div>
              )}

              <div className="p-4 bg-purple-950 text-white rounded-xl flex items-center justify-between font-extrabold text-sm mt-3">
                <span>YOUR FINAL RESPONSIBILITY (AMOUNT DUE):</span>
                <span className="font-mono text-base text-amber-300">₹{waterfall?.projected_patient_responsibility.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itemized Charges with "Why Was I Charged?" Button */}
        <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Itemized Service Charges</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-3">
              {bill.items.map((item) => (
                <div key={item.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{item.service_name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono">{item.category}</Badge>
                      <Badge className={item.verification_status === "VERIFIED" ? "bg-emerald-100 text-emerald-800 text-[9px]" : "bg-amber-100 text-amber-800 text-[9px]"}>
                        {item.verification_status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600">{item.description_snapshot}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-extrabold text-slate-900 text-xs">₹{item.base_amount.toFixed(2)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedWhyItem(item)}
                      className="bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl"
                    >
                      <HelpCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Why was I charged?
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modal: "Why Was I Charged?" Provenance Modal */}
        {selectedWhyItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-emerald-700">
                  <HelpCircle className="h-5 w-5 text-emerald-600" /> Provenance: Why Was I Charged?
                </h3>
                <span className="font-mono font-bold text-purple-950 text-sm">₹{selectedWhyItem.base_amount.toFixed(2)}</span>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Service Charged</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedWhyItem.service_name}</span>
                  <span className="text-[10px] text-slate-500 font-mono block">{selectedWhyItem.service_code} • {selectedWhyItem.category}</span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Source Provenance Chain</h4>
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5 font-mono text-[11px]">
                    <div><span className="text-slate-500">Ordered By:</span> <strong>{selectedWhyItem.provenance?.ordered_by_name || "Authorized Clinician"}</strong></div>
                    <div><span className="text-slate-500">Order Reference:</span> <strong>{selectedWhyItem.provenance?.order_reference_id || selectedWhyItem.source_id}</strong></div>
                    <div><span className="text-slate-500">Facility:</span> <strong>{selectedWhyItem.provenance?.facility_name || bill.facility_name}</strong></div>
                    <div><span className="text-slate-500">Service Date:</span> <strong>{new Date(selectedWhyItem.service_date).toLocaleString()}</strong></div>
                    <div><span className="text-slate-500">Clinical Reason:</span> <strong>{selectedWhyItem.provenance?.clinical_reason || "Diagnostic investigation"}</strong></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono">
                  <div className="flex justify-between"><span>Unit Rate:</span> <span>₹{selectedWhyItem.unit_price.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Quantity:</span> <span>{selectedWhyItem.quantity}</span></div>
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-200"><span>Line Total:</span> <span>₹{selectedWhyItem.base_amount.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <Button size="sm" onClick={() => setSelectedWhyItem(null)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl">
                  Close Provenance Details
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
