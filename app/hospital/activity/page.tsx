"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  Activity, 
  Clock, 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  FileText
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getFacilityById } from "@/lib/data/facility-store";
import { AuditLedger } from "@/lib/data/audit-store";

export default function HospitalActivityPage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode) || getFacilityById("FAC-1001");
  const targetFacId = facility?.facility_code || "FAC-1001";

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");

  useEffect(() => {
    const handleUpdate = () => setIsRefreshing((prev) => !prev);
    window.addEventListener("medora-audit-updated", handleUpdate);
    return () => window.removeEventListener("medora-audit-updated", handleUpdate);
  }, []);

  const allLogs = useMemo(() => {
    return AuditLedger.getEvents();
  }, [isRefreshing]);

  const filteredLogs = useMemo(() => {
    let list = allLogs;
    if (moduleFilter !== "ALL") {
      list = list.filter((l) => l.event_type.includes(moduleFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.summary.toLowerCase().includes(q) ||
          l.actor_name.toLowerCase().includes(q) ||
          l.event_type.toLowerCase().includes(q) ||
          (l.reference_id && l.reference_id.toLowerCase().includes(q)) ||
          (l.patient_id && l.patient_id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allLogs, moduleFilter, searchQuery]);

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "emergency_staff", "finance_staff"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200 font-sans pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" /> Traceable Hospital Activity Log
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-teal-50 text-teal-800 border-teal-200">
                {targetFacId}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold">
                <ShieldCheck className="h-3 w-3 inline mr-1 text-emerald-600" /> Immutable Event Trail
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authoritative operational timeline linking patient, clinical, emergency, and financial events • {facility?.name || "City Hospital"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRefreshing((prev) => !prev)} className="text-xs gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} /> Refresh
            </Button>
            <Link href="/admin/audit">
              <Button variant="outline" size="sm" className="text-xs">
                Platform Audit Ledger →
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(
                  [
                    { key: "ALL", label: "All Events" },
                    { key: "EMERGENCY", label: "Emergency" },
                    { key: "ADMISSION", label: "Admissions" },
                    { key: "BILL", label: "Billing & Finance" },
                    { key: "CONSULTATION", label: "Consultations" },
                    { key: "PRESCRIPTION", label: "Prescriptions" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setModuleFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      moduleFilter === tab.key
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search actor, event, reference..."
                  className="text-xs pl-8 h-8 bg-slate-50 border-slate-200"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredLogs.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((evt) => (
                  <div key={evt.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {evt.event_type}
                        </span>
                        <span className="font-bold text-slate-900">{evt.actor_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({evt.actor_role})</span>
                        {evt.reference_id && (
                          <Badge variant="outline" className="text-[9px] font-mono">
                            Ref: {evt.reference_id}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-700 text-xs">{evt.summary}</p>
                    </div>

                    <div className="text-right shrink-0 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-slate-500 block">
                        {new Date(evt.timestamp).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                No matching operational activity logs found.
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </RoleGuard>
  );
}
