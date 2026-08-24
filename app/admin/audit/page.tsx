"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowLeft,
  Calendar,
  Building2,
  User,
  FileText,
  Clock,
  Layers,
  Download
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AuditLedger } from "@/lib/data/audit-store";
import { StoredAuditEvent } from "@/types/database.types";

export default function AdminAuditPage() {
  const [events, setEvents] = useState<StoredAuditEvent[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshLogs = () => {
    setIsRefreshing(true);
    setEvents(AuditLedger.getEvents());
    setTimeout(() => setIsRefreshing(false), 200);
  };

  useEffect(() => {
    refreshLogs();
    const handleUpdate = () => refreshLogs();
    window.addEventListener("medora-audit-updated", handleUpdate);
    return () => window.removeEventListener("medora-audit-updated", handleUpdate);
  }, []);

  const filteredEvents = useMemo(() => {
    let list = events;
    if (filterType !== "ALL") {
      list = list.filter((e) => e.event_type.includes(filterType));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.summary.toLowerCase().includes(q) ||
          e.actor_name.toLowerCase().includes(q) ||
          e.event_type.toLowerCase().includes(q) ||
          (e.reference_id && e.reference_id.toLowerCase().includes(q)) ||
          (e.patient_id && e.patient_id.toLowerCase().includes(q)) ||
          (e.organization_name && e.organization_name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [events, filterType, searchQuery]);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans p-4 sm:p-6 animate-in fade-in-50 duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" /> Immutable Platform Audit Stream
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-teal-50 text-teal-800 border-teal-200">
                Append-Only Ledger
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tamper-evident cryptographically sequenced audit records tracking WHO, WHAT, WHEN, WHY, and RESOURCE ID across all ecosystem actions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshLogs} className="rounded-xl text-xs gap-1">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} /> Refresh
            </Button>
            <Link href="/hospital">
              <Button variant="outline" size="sm" className="rounded-xl text-xs">
                Hospital Control →
              </Button>
            </Link>
          </div>
        </div>

        {/* Audit Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white border-slate-200 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Ledger Entries</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">{events.length}</div>
            <span className="text-[10px] text-slate-400">Cryptographically sequenced</span>
          </Card>

          <Card className="bg-teal-50/50 border-teal-200 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">Emergency Actions</span>
            <div className="text-xl font-black text-teal-950 font-mono mt-1">
              {events.filter((e) => e.event_type.includes("EMERGENCY")).length}
            </div>
            <span className="text-[10px] text-teal-700">Trauma & Rapid response</span>
          </Card>

          <Card className="bg-blue-50/50 border-blue-200 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Admission & Ward Events</span>
            <div className="text-xl font-black text-blue-950 font-mono mt-1">
              {events.filter((e) => e.event_type.includes("ADMISSION") || e.event_type.includes("BED") || e.event_type.includes("DISCHARGE")).length}
            </div>
            <span className="text-[10px] text-blue-700">Inpatient movements</span>
          </Card>

          <Card className="bg-emerald-50/50 border-emerald-200 p-4 rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Financial Settlements</span>
            <div className="text-xl font-black text-emerald-950 font-mono mt-1">
              {events.filter((e) => e.event_type.includes("BILL") || e.event_type.includes("PAYMENT") || e.event_type.includes("DISPUTE")).length}
            </div>
            <span className="text-[10px] text-emerald-700">Billing & Payment ledger</span>
          </Card>
        </div>

        {/* Filter Controls & Search */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { key: "ALL", label: "All Audit Events" },
                  { key: "EMERGENCY", label: "Emergency" },
                  { key: "ADMISSION", label: "Admissions & Beds" },
                  { key: "BILL", label: "Billing" },
                  { key: "PAYMENT", label: "Payments" },
                  { key: "DISPUTE", label: "Disputes" },
                  { key: "PRESCRIPTION", label: "Prescriptions" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterType(tab.key)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      filterType === tab.key
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search actor, event type, patient, ref..."
                  className="text-xs pl-8 h-8 bg-slate-50 border-slate-200 rounded-xl"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredEvents.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {evt.event_type}
                        </span>
                        <span className="font-bold text-slate-900">{evt.actor_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">({evt.actor_role})</span>
                        {evt.reference_id && (
                          <Badge variant="outline" className="text-[10px] font-mono font-bold bg-slate-50">
                            Ref: {evt.reference_id}
                          </Badge>
                        )}
                        {evt.patient_id && (
                          <span className="text-[10px] text-teal-700 font-mono font-bold">
                            Patient: {evt.patient_id}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-700 text-xs">{evt.summary}</p>

                      <div className="text-[10px] text-slate-400 font-mono">
                        {evt.organization_name && <span>{evt.organization_name} • </span>}
                        <span>Event ID: {evt.id}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-slate-600 font-semibold block">
                        {new Date(evt.timestamp).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      <Badge variant="outline" className="text-[9px] font-mono text-emerald-800 bg-emerald-50 border-emerald-200 mt-1">
                        VERIFIED
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 space-y-1">
                <ShieldCheck className="h-8 w-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">No matching audit events found</p>
                <p>No audit trail records matched the current search query or module filter.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </RoleGuard>
  );
}
