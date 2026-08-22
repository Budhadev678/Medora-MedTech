"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  PackageCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  Check,
  HelpCircle,
  Pill,
  Lock,
  Boxes,
  KeyRound,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getOrderById } from "@/lib/data/pharmacy-order-store";
import { getDispensingRecordByOrder } from "@/lib/data/dispensing-store";
import { PharmacyFulfillmentService } from "@/lib/services/pharmacy-fulfillment-service";
import { PharmacyOrder, DispensingRecord } from "@/types/database.types";

export default function PharmacyOrderConsolePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = (params?.orderId as string) || "";

  const [order, setOrder] = useState<PharmacyOrder | null>(null);
  const [dispensing, setDispensing] = useState<DispensingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // OTP Verification modal state
  const [providedOtp, setProvidedOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = () => {
    if (!orderId) return;
    const ord = getOrderById(orderId);
    setOrder(ord);
    if (ord) {
      const disp = getDispensingRecordByOrder(ord.id);
      setDispensing(disp);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [orderId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium text-xs">
        <PackageCheck className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
        Loading pharmacy order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-slate-600 text-sm">No pharmacy order found for ID: {orderId}</p>
        <Link href="/pharmacy/orders">
          <Button variant="outline">Back to Queue</Button>
        </Link>
      </div>
    );
  }

  const handleStartPreparation = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await PharmacyFulfillmentService.startPreparation(order.id, user);
      if (res.success && res.order) {
        setActionSuccess("Revalidated prescription state & started medicine preparation.");
        refresh();
      } else {
        setActionError(res.error || "Failed to start preparation.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkReady = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const prepItems = order.items.map((i) => ({
        medicineId: i.medicine_id,
        batchId: i.batch_id || "BATCH-1001",
        batchNumber: i.batch_number || "PCM-2026-01",
        quantity: i.quantity_reserved || i.quantity_requested,
      }));

      const res = await PharmacyFulfillmentService.markReady(order.id, prepItems, user);
      if (res.success && res.order) {
        setActionSuccess("Medicines packed and marked READY FOR PICKUP.");
        refresh();
      } else {
        setActionError(res.error || "Failed to mark ready.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispense = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await PharmacyFulfillmentService.dispenseOrder(order.id, providedOtp, user);
      if (res.success && res.dispensing) {
        setActionSuccess(`Medicines successfully dispensed! Receipt: ${res.dispensing.id}`);
        setShowOtpModal(false);
        setProvidedOtp("");
        refresh();
      } else {
        setActionError(res.error || "Dispensing transaction failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "doctor", "lab_staff"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-5xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/pharmacy/orders">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Order Queue
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono">{order.id}</h1>
                <Badge variant="outline" className="text-xs font-mono">{order.prescription_id}</Badge>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-500">Patient: {order.patient_name} ({order.patient_id}) • Facility: {order.facility_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {order.status === "CONFIRMED" && (
              <Button
                onClick={handleStartPreparation}
                disabled={isSubmitting}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
              >
                <Boxes className="h-4 w-4 mr-1" /> Start Preparation
              </Button>
            )}

            {order.status === "PREPARING" && (
              <Button
                onClick={handleMarkReady}
                disabled={isSubmitting}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Ready for Pickup
              </Button>
            )}

            {order.status === "READY_FOR_PICKUP" && (
              <Button
                onClick={() => setShowOtpModal(true)}
                disabled={isSubmitting}
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
              >
                <KeyRound className="h-4 w-4 mr-1" /> Verify Patient & Dispense
              </Button>
            )}
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
          {/* Main Items Table */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-emerald-600" /> Order Items & Stock Allocation
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-slate-50 font-mono">OTP Code: {order.verification_otp}</Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="p-2.5">Medicine</th>
                        <th className="p-2.5">Batch / Expiry</th>
                        <th className="p-2.5 text-center">Req / Res</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.items.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-900">{item.medicine_name}</td>
                          <td className="p-2.5 text-slate-700">
                            <span className="font-mono font-bold block">{item.batch_number || "PCM-2026-01"}</span>
                            <span className="text-[9px] text-slate-500">FEFO Allocated</span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                            {item.quantity_requested} / <span className="text-emerald-700">{item.quantity_reserved}</span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-purple-950">
                            ₹{item.subtotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-700">Total Order Amount:</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">₹{order.total_amount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Dispensing Receipt (If Dispensed) */}
            {dispensing && (
              <Card className="bg-emerald-50/60 rounded-2xl shadow-xs border-emerald-200">
                <CardHeader className="p-4 pb-2 border-b border-emerald-100">
                  <CardTitle className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" /> Authoritative Dispensing Receipt
                    </span>
                    <span className="font-mono">{dispensing.id}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Pharmacist: <strong>{dispensing.pharmacist_name}</strong></div>
                    <div>Dispensed At: <strong>{new Date(dispensing.dispensed_at).toLocaleString()}</strong></div>
                    <div>Status: <StatusBadge status={dispensing.status} /></div>
                    <div>Verification: <strong>{dispensing.verification_method}</strong></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Patient & Order Metadata</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div><span className="text-slate-500 font-medium">Patient:</span> <span className="font-bold text-slate-900">{order.patient_name}</span></div>
                <div><span className="text-slate-500 font-medium">Prescriber:</span> <span className="font-semibold text-slate-800">{order.prescriber_name}</span></div>
                <div><span className="text-slate-500 font-medium">Fulfillment Type:</span> <Badge variant="outline" className="text-[10px]">{order.fulfillment_type}</Badge></div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal: Patient Verification & Dispensing */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-emerald-700">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Patient Identity Verification & Handover
              </h3>
              <p className="text-xs text-slate-600">Enter the patient's 6-digit MEDORA OTP code (Demo OTP: <strong className="font-mono text-purple-900">{order.verification_otp}</strong> or <strong className="font-mono">123456</strong>) to confirm handover.</p>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700">Verification OTP *</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP..."
                    value={providedOtp}
                    onChange={(e) => setProvidedOtp(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-mono text-center font-bold text-lg text-slate-900 tracking-widest"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowOtpModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleDispense} disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl">
                  Confirm Handover & Dispense
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
