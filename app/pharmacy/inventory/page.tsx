"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  Package,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  Plus,
  Building2,
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getFacilityInventory, getInventoryBatches } from "@/lib/data/pharmacy-inventory-store";
import { getAllPharmacyFacilities } from "@/lib/data/pharmacy-organization-store";
import { PharmacyInventoryItem, PharmacyFacility } from "@/types/database.types";

export default function PharmacyInventoryPage() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<PharmacyFacility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("PHARM-FAC-1001");
  const [inventory, setInventory] = useState<PharmacyInventoryItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const refresh = () => {
    setFacilities(getAllPharmacyFacilities());
    const items = getFacilityInventory(selectedFacilityId);
    setInventory(items);
  };

  useEffect(() => {
    refresh();
  }, [selectedFacilityId]);

  const filteredInventory = inventory.filter((item) => {
    if (filterStatus === "AVAILABLE" && item.status !== "AVAILABLE") return false;
    if (filterStatus === "LOW_STOCK" && item.status !== "LOW_STOCK") return false;
    if (filterStatus === "OUT_OF_STOCK" && item.status !== "OUT_OF_STOCK") return false;

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const match =
        item.medicine_name.toLowerCase().includes(q) ||
        item.generic_name.toLowerCase().includes(q) ||
        item.medicine_id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["admin", "doctor", "lab_staff"]}>
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
                <Boxes className="h-5 w-5 text-emerald-600" /> Facility Medicine Inventory & Batch Console
              </h1>
              <p className="text-xs text-slate-500">Real-time stock levels, FEFO batch expiry dates & reserved quantity tracking</p>
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
            {["ALL", "AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK"].map((f) => (
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
              placeholder="Search medicine name, generic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs h-9 pl-9 pr-3 rounded-xl border border-input bg-slate-50"
            />
          </div>
        </div>

        {/* Inventory List Table */}
        <Card className="bg-white rounded-2xl shadow-xs border-slate-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="p-3.5">Medicine Catalog Item</th>
                    <th className="p-3.5">Strength / Form</th>
                    <th className="p-3.5 text-center">Total Stock</th>
                    <th className="p-3.5 text-center">Reserved</th>
                    <th className="p-3.5 text-center">Usable Available</th>
                    <th className="p-3.5">Unit Price</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No inventory stock matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{item.medicine_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Generic: {item.generic_name}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800">{item.strength}</span>
                          <Badge variant="outline" className="text-[9px] ml-1.5">{item.dosage_form}</Badge>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-900">{item.total_quantity}</td>
                        <td className="p-3.5 text-center font-bold text-amber-600">{item.reserved_quantity}</td>
                        <td className="p-3.5 text-center font-bold text-emerald-700 font-mono text-sm">
                          {item.available_quantity}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 font-mono">₹{item.unit_price.toFixed(2)}</td>
                        <td className="p-3.5">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
