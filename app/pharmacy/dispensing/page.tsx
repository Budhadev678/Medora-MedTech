"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  PackageCheck,
  User,
  Pill,
  Clock,
  ArrowRight,
  FileText,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RoleGuard } from "@/components/shared/role-guard";
import { getAllDispensingRecords } from "@/lib/data/dispensing-store";
import { DispensingRecord } from "@/types/database.types";

export default function PharmacyDispensingPage() {
  const [records, setRecords] = useState<DispensingRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  const refreshData = () => {
    const list = getAllDispensingRecords();
    setRecords(list);
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener("medora-dispensing-updated", handleUpdate);
    window.addEventListener("medora-pharmacy-updated", handleUpdate);
    window.addEventListener("medora-prescriptions-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-dispensing-updated", handleUpdate);
      window.removeEventListener("medora-pharmacy-updated", handleUpdate);
      window.removeEventListener("medora-prescriptions-updated", handleUpdate);
    };
  }, []);

  const filteredRecords = records.filter((r) => {
    if (filterType === "FULL" && r.is_partial) return false;
    if (filterType === "PARTIAL" && !r.is_partial) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchOrder = r.order_id.toLowerCase().includes(q);
      const matchRx = r.prescription_id.toLowerCase().includes(q);
      const matchPat = r.patient_name.toLowerCase().includes(q);
      const matchPharm = r.pharmacist_name.toLowerCase().includes(q);
      const matchMed = r.items.some((i) => i.medicine_name.toLowerCase().includes(q));
      return matchId || matchOrder || matchRx || matchPat || matchPharm || matchMed;
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
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Authoritative Dispensing Ledger & Audit Records
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                Step 4: Dispensing & Fulfillment
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold">
                <ShieldCheck className="h-3 w-3 inline mr-1 text-indigo-600" /> Immutable Event Trail
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Durable record of every dispensing event capturing WHO (Pharmacist), WHEN (Timestamp), WHAT (Medicine, Batch & Qty), and FOR WHOM (Patient).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/pharmacy/pickup">
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs gap-1.5 shadow-xs">
                <User className="h-3.5 w-3.5" /> Counter Pickup & Handover
              </Button>
            </Link>
            <Button size="sm" onClick={refreshData} variant="ghost" className="rounded-xl text-xs gap-1 text-slate-600">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <Button
              variant={filterType === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterType("ALL")}
              className={`text-xs rounded-lg h-7 font-bold ${filterType === "ALL" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              All Dispensed Records ({records.length})
            </Button>
            <Button
              variant={filterType === "FULL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterType("FULL")}
              className={`text-xs rounded-lg h-7 font-bold ${filterType === "FULL" ? "bg-teal-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              Fully Dispensed ({records.filter((r) => !r.is_partial).length})
            </Button>
            <Button
              variant={filterType === "PARTIAL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterType("PARTIAL")}
              className={`text-xs rounded-lg h-7 font-bold ${filterType === "PARTIAL" ? "bg-amber-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              Partial Fulfillments ({records.filter((r) => r.is_partial).length})
            </Button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Dispensing ID, Patient, Rx, or Drug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
            />
          </div>
        </div>

        {/* Dispensing Records Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-200">
                <TableHead className="text-xs font-bold text-slate-700 py-3">Dispensing Ref & Patient</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Source Order & Prescription</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Medicines, Batches & Quantities</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Signatory & Timestamp</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-xs text-slate-400">
                    No dispensing records match the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    {/* Ref & Patient */}
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-emerald-950 text-xs">{r.id}</span>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" /> {r.patient_name}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{r.patient_id}</span>
                      </div>
                    </TableCell>

                    {/* Source Order & Rx */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <span className="font-mono text-indigo-900 font-semibold">{r.order_id}</span>
                        <div className="font-mono text-[11px] text-slate-500">Rx: {r.prescription_id}</div>
                        {r.is_partial ? (
                          <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-800 border-amber-300 font-bold py-0">
                            PARTIALLY DISPENSED
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold py-0">
                            FULLY DISPENSED
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Items */}
                    <TableCell>
                      <div className="space-y-1">
                        {r.items.map((item, idx) => (
                          <div key={idx} className="text-xs space-y-0.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Pill className="h-3 w-3 text-emerald-600" />
                              {item.medicine_name}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span>Batch: <strong className="font-mono text-slate-700">{item.batch_number || "PCM-2026-01"}</strong></span>
                              <span>•</span>
                              <span>Dispensed: <strong className="text-emerald-700 font-mono">{item.quantity_dispensed}</strong></span>
                              {item.quantity_remaining > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-700 font-bold">Remaining: {item.quantity_remaining}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    {/* Signatory & Timestamp */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-slate-600">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> {r.pharmacist_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(r.dispensed_at).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">{r.facility_name || "ABC Pharmacy"}</div>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-4">
                      <Link href={`/pharmacy/orders/${r.order_id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs rounded-xl font-bold border-slate-200 px-2.5">
                          View Order <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
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
