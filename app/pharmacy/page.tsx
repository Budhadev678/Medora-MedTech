"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Pill,
  Building2,
  Users,
  FileText,
  Package,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  Search,
  Filter,
  Check,
  UserCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllIntakes } from "@/lib/data/pharmacy-intake-store";
import { getAllOrders } from "@/lib/data/pharmacy-order-store";
import { getAllPharmacyFacilities } from "@/lib/data/pharmacy-organization-store";
import { PharmacyPrescriptionIntake, PharmacyOrder } from "@/types/database.types";

export default function PharmacyWorkQueuePage() {
  const { user } = useAuth();
  const [intakes, setIntakes] = useState<PharmacyPrescriptionIntake[]>([]);
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<"ALL" | "INTAKES" | "ORDERS" | "PICKUP">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = () => {
    setIsLoading(true);
    try {
      const allIntakes = getAllIntakes();
      const allOrders = getAllOrders();
      setIntakes(allIntakes);
      setOrders(allOrders);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("medora-pharmacy-updated", handleUpdate);
    return () => window.removeEventListener("medora-pharmacy-updated", handleUpdate);
  }, []);

  const pendingIntakes = intakes.filter(
    (i) => i.status === "RECEIVED" || i.status === "UNDER_REVIEW" || i.status === "VALID"
  );
  const pendingOrders = orders.filter(
    (o) => (o.status as string) === "STOCK_RESERVED" || (o.status as string) === "VERIFIED" || (o.status as string) === "PREPARATION_READY"
  );
  const pickupOrders = orders.filter(
    (o) => (o.status as string) === "DISPENSED" || (o.status as string) === "READY_FOR_PICKUP"
  );

  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        
        {/* Top Operational Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-600" />
              <span>Pharmacy Work Queue</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review and act on incoming prescriptions, order verifications, and medication dispensing tasks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="text-xs font-semibold h-8 rounded-xl gap-1.5 border-slate-200"
            >
              <RotateCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Queue</span>
            </Button>

            <Link href="/pharmacy/prescriptions">
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs h-8 gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Verify Prescriptions ({pendingIntakes.length})</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* TODAY'S WORK Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Prescriptions Awaiting Action */}
          <Link href="/pharmacy/prescriptions">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prescriptions Awaiting Action</p>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{pendingIntakes.length}</h2>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Intake & Verification Required</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <FileText className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 2: Orders Requiring Attention */}
          <Link href="/pharmacy/orders">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orders Requiring Attention</p>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{pendingOrders.length}</h2>
                  <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Stock Reservation & Prep</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Package className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 3: Ready for Pickup */}
          <Link href="/pharmacy/pickup">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ready for Patient Pickup</p>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{pickupOrders.length}</h2>
                  <p className="text-[11px] text-teal-700 font-semibold mt-0.5">Handover & Dispense Verification</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <UserCheck className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* REQUIRES ACTION — Work Queue Table */}
        <Card className="bg-white rounded-2xl shadow-xs border-slate-200 overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>Actionable Pharmacy Work Items</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Tasks currently pending pharmacist action, sorted by urgency and receipt time.
              </CardDescription>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterCategory("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === "ALL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({pendingIntakes.length + pendingOrders.length + pickupOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory("INTAKES")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === "INTAKES" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Intakes ({pendingIntakes.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory("ORDERS")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterCategory === "ORDERS" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Orders ({pendingOrders.length})
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {pendingIntakes.length === 0 && pendingOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-slate-800">You're all caught up.</p>
                <p className="text-slate-400">No pharmacy tasks currently require action.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {/* Render Prescriptions Awaiting Intake */}
                {(filterCategory === "ALL" || filterCategory === "INTAKES") &&
                  pendingIntakes.map((intake) => (
                    <div
                      key={intake.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{intake.patient_name}</span>
                            <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                              {intake.patient_id}
                            </span>
                            <Badge variant="teal" className="text-[9px] py-0 px-1.5 font-bold">
                              INTAKE REQUIRED
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                            <span>Prescription: <strong className="font-mono text-slate-700">{intake.prescription_id}</strong></span>
                            <span>•</span>
                            <span>Prescriber: <span className="text-slate-800 font-medium">{intake.prescriber_name}</span></span>
                            <span>•</span>
                            <span>Received: <span className="font-mono">{new Date(intake.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link href={`/pharmacy/prescriptions`}>
                          <Button size="sm" className="h-8 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl gap-1">
                            <span>Review & Verify</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}

                {/* Render Orders Requiring Prep / Dispense */}
                {(filterCategory === "ALL" || filterCategory === "ORDERS") &&
                  pendingOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{order.patient_name}</span>
                            <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                              {order.id}
                            </span>
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-bold border-amber-300 text-amber-800 bg-amber-50">
                              {String(order.status).replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                            <span>Medicines: <strong className="text-slate-800">{order.items?.length || order.total_items || 1} items</strong></span>
                            <span>•</span>
                            <span>Total: <strong className="text-slate-900">₹{order.total_amount || 250}</strong></span>
                            <span>•</span>
                            <span>Created: <span className="font-mono">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link href={`/pharmacy/dispensing`}>
                          <Button size="sm" className="h-8 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl gap-1">
                            <span>Dispense</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Access Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/pharmacy/prescriptions">
            <Card className="bg-white rounded-2xl border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Prescriptions Queue</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Review digitized clinical prescriptions and process pharmacist validation checks.
              </p>
            </Card>
          </Link>

          <Link href="/pharmacy/dispensing">
            <Card className="bg-white rounded-2xl border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Dispensing Desk</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Item-by-item batch verification, label verification, and patient OTP handovers.
              </p>
            </Card>
          </Link>

          <Link href="/pharmacy/inventory">
            <Card className="bg-white rounded-2xl border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">FEFO Stock Inventory</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Manage batch stock levels, track expiry dates, and review reorder thresholds.
              </p>
            </Card>
          </Link>
        </div>

      </div>
    </RoleGuard>
  );
}