"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Building2,
  User,
  ShieldCheck,
  Pill,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllOrders, getOrdersByFacility } from "@/lib/data/pharmacy-order-store";
import { getAllPharmacyFacilities } from "@/lib/data/pharmacy-organization-store";
import { PharmacyOrder, PharmacyFacility } from "@/types/database.types";

export default function PharmacyOrderQueuePage() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<PharmacyFacility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("PHARM-FAC-1001");
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const refresh = () => {
    setFacilities(getAllPharmacyFacilities());
    const list = selectedFacilityId ? getOrdersByFacility(selectedFacilityId, filterStatus) : getAllOrders();
    setOrders(list);
  };

  useEffect(() => {
    refresh();
  }, [selectedFacilityId, filterStatus]);

  const filteredOrders = orders.filter((item) => {
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const match =
        item.id.toLowerCase().includes(q) ||
        item.prescription_id.toLowerCase().includes(q) ||
        item.patient_name.toLowerCase().includes(q) ||
        item.prescriber_name.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/pharmacy">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Pharmacy Portal
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-emerald-600" /> Pharmacist Fulfillment & Preparation Queue
              </h1>
              <p className="text-xs text-slate-500">Prepare, verify & dispense confirmed medicine orders from Phase 9.2 reservations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="text-xs h-9 rounded-xl border border-input px-3 bg-white font-semibold text-slate-800"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <Button size="sm" variant="ghost" onClick={refresh} className="rounded-xl">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["ALL", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "DISPENSED", "PARTIALLY_DISPENSED", "CANCELLED"].map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filterStatus === f ? "default" : "ghost"}
                onClick={() => setFilterStatus(f)}
                className={`text-xs rounded-lg px-3 h-8 font-semibold ${filterStatus === f ? "bg-emerald-700 hover:bg-emerald-800 text-white" : "text-slate-600"}`}
              >
                {f.replace(/_/g, " ")}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search order ID, RX ID, patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs h-9 pl-9 pr-3 rounded-xl border border-input bg-slate-50"
            />
          </div>
        </div>

        {/* Order List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
              No pharmacy orders matching filter criteria for this facility.
            </div>
          ) : (
            filteredOrders.map((item) => (
              <Card key={item.id} className="bg-white rounded-2xl shadow-xs border-slate-200 hover:border-emerald-200 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-950 text-xs">{item.id}</span>
                      <Badge variant="outline" className="text-[10px] font-mono text-purple-900 border-purple-200 bg-purple-50">
                        {item.prescription_id}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-[10px]">
                        {item.fulfillment_type}
                      </Badge>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                      <span>Patient: <strong className="text-slate-900">{item.patient_name}</strong> ({item.patient_id})</span>
                      <span>•</span>
                      <span>Items: <strong className="text-slate-800">{item.items.length} medicines</strong></span>
                      <span>•</span>
                      <span>Amount: <strong className="text-purple-950 font-mono">₹{item.total_amount.toFixed(2)}</strong></span>
                    </div>
                  </div>

                  <Link href={`/pharmacy/orders/${item.id}`}>
                    <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
                      Process & Dispense <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
