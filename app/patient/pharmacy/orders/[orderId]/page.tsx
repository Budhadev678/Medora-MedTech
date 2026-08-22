"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Pill,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Package,
  Truck,
  UserCheck,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getOrderById } from "@/lib/data/pharmacy-order-store";
import { PharmacyTransparencyService } from "@/lib/services/pharmacy-transparency-service";
import { PharmacyOrder, PharmacyTimelineEvent } from "@/types/database.types";

export default function PatientOrderTrackerPage() {
  const params = useParams();
  const { user } = useAuth();
  const orderId = (params?.orderId as string) || "";

  const [order, setOrder] = useState<PharmacyOrder | null>(null);
  const [timeline, setTimeline] = useState<PharmacyTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const ord = getOrderById(orderId);
    setOrder(ord);
    if (ord) {
      const events = PharmacyTransparencyService.getVisualTimeline(ord.id);
      setTimeline(events);
    }
    setLoading(false);
  }, [orderId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium text-xs">
        <Clock className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
        Loading order tracker...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-slate-600 text-sm">No pharmacy order found for ID: {orderId}</p>
        <Link href="/patient/pharmacy">
          <Button variant="outline">Back to Pharmacy Hub</Button>
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
            <Link href="/patient/pharmacy">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Orders
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono">{order.id}</h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-500">Fulfilled by: {order.facility_name}</p>
            </div>
          </div>
        </div>

        {/* Verification OTP Alert Card */}
        {order.status === "READY_FOR_PICKUP" && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-950 text-xs">Ready for Counter Pickup</h3>
                <p className="text-[11px] text-emerald-800">Show this 6-digit OTP code to the pharmacist counter at {order.facility_name}:</p>
              </div>
            </div>
            <span className="font-mono font-extrabold text-xl text-emerald-950 bg-white px-3 py-1.5 rounded-xl border border-emerald-300">
              {order.verification_otp}
            </span>
          </div>
        )}

        {/* Transparent Medicine Quantity Breakdown */}
        <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Transparent Quantity Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="p-2.5">Medicine</th>
                    <th className="p-2.5 text-center">Prescribed</th>
                    <th className="p-2.5 text-center">Reserved</th>
                    <th className="p-2.5 text-center">Dispensed</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-900">{item.medicine_name}</td>
                      <td className="p-2.5 text-center font-bold text-slate-700">{item.quantity_requested}</td>
                      <td className="p-2.5 text-center font-bold text-amber-600">{item.quantity_reserved}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-700 font-mono text-sm">{item.quantity_dispensed}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-purple-950">₹{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Visual Fulfillment Timeline */}
        <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fulfillment Timeline & Event Provenance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {timeline.length === 0 ? (
              <p className="text-xs text-slate-500">Timeline events initializing...</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timeline.map((evt) => (
                  <div key={evt.id} className="relative space-y-1">
                    <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs">{evt.display_title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(evt.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-600">{evt.description}</p>
                    {evt.actor_name && (
                      <span className="text-[10px] text-slate-400 block font-medium">By {evt.actor_name} ({evt.actor_type})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
