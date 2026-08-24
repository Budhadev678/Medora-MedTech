"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckSquare,
  Package,
  Boxes,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  User,
  Pill,
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

export default function PharmacyPreparationPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const refreshData = () => {
    const list = getAllOrders();
    setOrders(list);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleStartPrep = async (orderId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setIsProcessing(true);
    try {
      const res = await PharmacyFulfillmentService.startPreparation(orderId, user);
      if (res.success && res.order) {
        setActionSuccess(`Order ${res.order.id} is now in preparation.`);
        refreshData();
      } else {
        setActionError(res.error || "Failed to start preparation.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkReady = async (order: PharmacyOrder) => {
    setActionError(null);
    setActionSuccess(null);
    setIsProcessing(true);
    try {
      const items = order.items.map((i) => ({
        medicineId: i.medicine_id,
        batchId: i.batch_id || "BATCH-1001",
        batchNumber: i.batch_number || "PCM-2026-01",
        quantity: i.quantity_reserved > 0 ? i.quantity_reserved : i.quantity_requested,
      }));
      const res = await PharmacyFulfillmentService.markReady(order.id, items, user);
      if (res.success && res.order) {
        setActionSuccess(`Order ${res.order.id} packaged and marked Ready for Pickup.`);
        refreshData();
      } else {
        setActionError(res.error || "Failed to mark order ready.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "NEEDS_PREP" && o.status !== "CONFIRMED") return false;
    if (statusFilter === "IN_PREP" && o.status !== "PREPARING") return false;
    if (statusFilter === "READY" && o.status !== "READY_FOR_PICKUP" && o.status !== "READY_FOR_DISPATCH") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchRx = o.prescription_id.toLowerCase().includes(q);
      const matchPat = o.patient_name.toLowerCase().includes(q);
      const matchMed = o.items.some((i) => i.medicine_name.toLowerCase().includes(q));
      return matchId || matchRx || matchPat || matchMed;
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
                <Boxes className="h-5 w-5 text-emerald-600" /> Medication Packaging & Quality Preparation Desk
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                Step 3: Stock Reservation & Prep
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verify FEFO batch allocation, count unit dosages, inspect tamper seals, and prepare prescription packages for counter pickup.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/pharmacy/orders">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-slate-200 text-slate-700">
                <Package className="h-3.5 w-3.5" /> All Pharmacy Orders
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

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <Button
              variant={statusFilter === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("ALL")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "ALL" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              All Orders ({orders.length})
            </Button>
            <Button
              variant={statusFilter === "NEEDS_PREP" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("NEEDS_PREP")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "NEEDS_PREP" ? "bg-amber-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              Awaiting Prep ({orders.filter((o) => o.status === "CONFIRMED").length})
            </Button>
            <Button
              variant={statusFilter === "IN_PREP" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("IN_PREP")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "IN_PREP" ? "bg-indigo-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              In Preparation ({orders.filter((o) => o.status === "PREPARING").length})
            </Button>
            <Button
              variant={statusFilter === "READY" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("READY")}
              className={`text-xs rounded-lg h-7 font-bold ${statusFilter === "READY" ? "bg-emerald-800 text-white shadow-xs" : "text-slate-600"}`}
            >
              Ready ({orders.filter((o) => o.status === "READY_FOR_PICKUP" || o.status === "READY_FOR_DISPATCH").length})
            </Button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Order ID, Patient, Rx, or Drug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
            />
          </div>
        </div>

        {/* Preparation Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-200">
                <TableHead className="text-xs font-bold text-slate-700 py-3">Order & Patient</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Prescription Source</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Prescribed Medicines & Batch</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-right pr-4">Preparation Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-xs text-slate-400">
                    No pharmacy orders awaiting preparation in this view.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((ord) => (
                  <TableRow key={ord.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    {/* Order ID & Patient */}
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-900 text-xs">{ord.id}</span>
                        <div className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" /> {ord.patient_name}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{ord.patient_id}</span>
                      </div>
                    </TableCell>

                    {/* Prescription Source */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <span className="font-mono font-bold text-emerald-800">{ord.prescription_id}</span>
                        <p className="text-slate-500 text-[11px]">By {ord.prescriber_name}</p>
                      </div>
                    </TableCell>

                    {/* Medicines & Batch */}
                    <TableCell>
                      <div className="space-y-1">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <Pill className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-900">{item.medicine_name}</span>
                            <Badge variant="outline" className="text-[10px] font-mono py-0">
                              Qty: {item.quantity_reserved > 0 ? item.quantity_reserved : item.quantity_requested}
                            </Badge>
                            {item.batch_number && (
                              <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-600 font-mono py-0">
                                Lot: {item.batch_number}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={ord.status} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        {ord.status === "CONFIRMED" && (
                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleStartPrep(ord.id)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs h-7 px-2.5"
                          >
                            Start Prep
                          </Button>
                        )}
                        {ord.status === "PREPARING" && (
                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleMarkReady(ord)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs h-7 px-2.5"
                          >
                            Package & Mark Ready
                          </Button>
                        )}
                        <Link href={`/pharmacy/orders/${ord.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs rounded-xl font-bold border-slate-200 px-2">
                            Console <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </div>
    </RoleGuard>
  );
}
