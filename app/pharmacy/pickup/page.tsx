"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  QrCode,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Pill,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllOrders } from "@/lib/data/pharmacy-order-store";
import { PharmacyFulfillmentService } from "@/lib/services/pharmacy-fulfillment-service";
import { PharmacyOrder } from "@/types/database.types";

export default function PharmacyPickupPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("READY");

  // Selected Order for Handover & OTP Modal
  const [selectedOrder, setSelectedOrder] = useState<PharmacyOrder | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshData = () => {
    const list = getAllOrders();
    setOrders(list);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDispenseAndHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await PharmacyFulfillmentService.dispenseOrder(
        selectedOrder.id,
        otpInput.trim() || undefined,
        user
      );

      if (res.success && res.dispensing) {
        setActionSuccess(
          `Handover confirmed for ${selectedOrder.patient_name}. Dispensing Record: ${res.dispensing.id}`
        );
        setSelectedOrder(null);
        setOtpInput("");
        refreshData();
      } else {
        setActionError(res.error || "Failed to complete dispensing & handover.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "READY" && o.status !== "READY_FOR_PICKUP" && o.status !== "READY_FOR_DISPATCH") return false;
    if (activeTab === "HANDED_OVER" && o.status !== "DISPENSED" && o.status !== "PARTIALLY_DISPENSED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchRx = o.prescription_id.toLowerCase().includes(q);
      const matchPat = o.patient_name.toLowerCase().includes(q);
      const matchOtp = o.verification_otp?.includes(q);
      return matchId || matchRx || matchPat || matchOtp;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["hospital_admin", "pharmacy_staff", "staff", "admin", "doctor"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans p-4 sm:p-6 animate-in fade-in-50 duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-600" /> Patient Counter Pickup & Identity Verification Desk
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                Step 4: Dispensing & Handover
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verify patient identification using MEDORA ID & 6-digit OTP token before releasing prepared medications at the dispensing counter.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/pharmacy/dispensing">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-slate-200 text-slate-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Dispensing Ledger
              </Button>
            </Link>
            <Button size="sm" onClick={refreshData} variant="ghost" className="rounded-xl text-xs gap-1 text-slate-600">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Feedback alerts */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <Button
              variant={activeTab === "READY" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("READY")}
              className={`text-xs rounded-lg h-7 font-bold ${activeTab === "READY" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              Waiting at Counter ({orders.filter((o) => o.status === "READY_FOR_PICKUP" || o.status === "READY_FOR_DISPATCH").length})
            </Button>
            <Button
              variant={activeTab === "HANDED_OVER" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("HANDED_OVER")}
              className={`text-xs rounded-lg h-7 font-bold ${activeTab === "HANDED_OVER" ? "bg-teal-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              Dispensed / Handed Over ({orders.filter((o) => o.status === "DISPENSED" || o.status === "PARTIALLY_DISPENSED").length})
            </Button>
            <Button
              variant={activeTab === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("ALL")}
              className={`text-xs rounded-lg h-7 font-bold ${activeTab === "ALL" ? "bg-slate-800 text-white shadow-xs" : "text-slate-600"}`}
            >
              All Fulfillments ({orders.length})
            </Button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Order ID, Patient Name, or Token OTP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
            />
          </div>
        </div>

        {/* Pickup Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-200">
                <TableHead className="text-xs font-bold text-slate-700 py-3">Order & Patient</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Fulfillment Channel</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Prescribed Medicines</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Security Token / OTP</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-right pr-4">Counter Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-xs text-slate-400">
                    No orders waiting in this pickup queue.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((ord) => (
                  <TableRow key={ord.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    {/* Order & Patient */}
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-900 text-xs">{ord.id}</span>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" /> {ord.patient_name}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{ord.patient_id}</span>
                      </div>
                    </TableCell>

                    {/* Channel & Status */}
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {ord.fulfillment_type}
                        </Badge>
                        <div>
                          <StatusBadge status={ord.status} />
                        </div>
                      </div>
                    </TableCell>

                    {/* Medicines */}
                    <TableCell>
                      <div className="space-y-1">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs">
                            <Pill className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800">{item.medicine_name}</span>
                            <span className="text-slate-400 font-mono text-[11px]">(Qty: {item.quantity_reserved || item.quantity_requested})</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    {/* OTP */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 w-fit">
                        <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                        <span className="font-bold tracking-widest">{ord.verification_otp || "948201"}</span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        {(ord.status === "READY_FOR_PICKUP" || ord.status === "READY_FOR_DISPATCH") ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(ord);
                              setOtpInput(ord.verification_otp || "948201");
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs h-7 px-3 gap-1 shadow-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> Verify & Dispense
                          </Button>
                        ) : (
                          <Link href={`/pharmacy/orders/${ord.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs rounded-xl font-bold border-slate-200 px-2">
                              View Order <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Handover & OTP Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <Card className="max-w-md w-full bg-white rounded-2xl shadow-xl border-slate-200 overflow-hidden">
              <CardHeader className="bg-emerald-900 text-white p-5">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" /> Confirm Patient Handover & Dispensing
                </CardTitle>
                <p className="text-xs text-emerald-200 mt-1">
                  Order: <strong className="font-mono text-white">{selectedOrder.id}</strong> • Patient: <strong className="text-white">{selectedOrder.patient_name}</strong>
                </p>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-700">Prescribed Medication Package:</p>
                  {selectedOrder.items.map((i, idx) => (
                    <div key={idx} className="text-slate-600 flex justify-between">
                      <span>• {i.medicine_name}</span>
                      <strong className="font-mono">{i.quantity_reserved || i.quantity_requested} Units</strong>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleDispenseAndHandover} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Patient Verification OTP / Token</span>
                      <span className="text-[10px] text-slate-400 font-mono">Demo: {selectedOrder.verification_otp || "948201"}</span>
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="font-mono text-center text-lg tracking-widest font-bold rounded-xl h-10 border-slate-200"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(null)}
                      className="rounded-xl text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs gap-1.5 px-4"
                    >
                      {isSubmitting ? "Processing Dispense..." : "Confirm & Dispense"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
