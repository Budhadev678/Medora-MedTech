"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  BedDouble, 
  Clock, 
  User, 
  Stethoscope, 
  ArrowRight, 
  Search, 
  RefreshCw,
  FileText,
  Receipt,
  Layers,
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getFacilityById } from "@/lib/data/facility-store";
import { getFacilityAdmissions, completeDischarge } from "@/lib/data/admission-store";
import { getFacilityBills } from "@/lib/data/billing-store";

export default function HospitalDischargePage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode) || getFacilityById("FAC-1001");
  const targetFacId = facility?.facility_code || "FAC-1001";

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"PENDING" | "DISCHARGED" | "ALL">("PENDING");

  const facilityAdmissions = useMemo(() => getFacilityAdmissions(targetFacId), [targetFacId, isRefreshing]);
  const facilityBills = useMemo(() => getFacilityBills(targetFacId), [targetFacId, isRefreshing]);

  const dischargePending = facilityAdmissions.filter((a) => a.status === "DISCHARGE_PENDING");
  const completedDischarges = facilityAdmissions.filter((a) => a.status === "DISCHARGED");

  const filteredList = useMemo(() => {
    let list = facilityAdmissions;
    if (filterTab === "PENDING") list = dischargePending;
    else if (filterTab === "DISCHARGED") list = completedDischarges;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.patient_name.toLowerCase().includes(q) ||
          a.patient_id.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [facilityAdmissions, filterTab, dischargePending, completedDischarges, searchQuery]);

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "doctor", "receptionist"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200 font-sans pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-teal-600" /> Inpatient Discharge Desk
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-teal-50 text-teal-800 border-teal-200">
                {targetFacId}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-semibold">
                Foundation Architecture (Step 4 Preview)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Discharge readiness, clinical summary handoff, and bed clearance desk • {facility?.name || "City Hospital"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRefreshing((prev) => !prev)} className="text-xs gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} /> Refresh
            </Button>
            <Link href="/hospital/admissions">
              <Button variant="outline" size="sm" className="text-xs">
                Inpatient Admissions →
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational Notice */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 text-xs text-teal-900 flex items-start gap-3">
          <Layers className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">5-Step Architecture Roadmap:</strong>
            Discharge workflow foundation is structurally defined in Step 1. Full multi-department discharge clearance, automated billing settlement, and digital document release are formally expanded in Step 4.
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setFilterTab("PENDING")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                    filterTab === "PENDING" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>Discharge Pending</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === "PENDING" ? "bg-slate-700 text-white" : "bg-white text-slate-700 font-bold"}`}>
                    {dischargePending.length}
                  </span>
                </button>

                <button
                  onClick={() => setFilterTab("DISCHARGED")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                    filterTab === "DISCHARGED" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>Discharged History</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === "DISCHARGED" ? "bg-slate-700 text-white" : "bg-white text-slate-700 font-bold"}`}>
                    {completedDischarges.length}
                  </span>
                </button>

                <button
                  onClick={() => setFilterTab("ALL")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    filterTab === "ALL" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Inpatient Records ({facilityAdmissions.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient, admission ID..."
                  className="text-xs pl-8 h-8 bg-slate-50 border-slate-200"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredList.map((adm) => {
                  const patBills = facilityBills.filter((b) => b.patient_id === adm.patient_id);
                  const totalOutstanding = patBills.reduce((acc, b) => acc + (b.patient_responsibility || b.net_billable_total || 0), 0);

                  return (
                    <div key={adm.id} className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px] font-bold">
                            {adm.id}
                          </Badge>
                          <span className="font-bold text-slate-900 text-sm">{adm.patient_name}</span>
                          <span className="font-mono text-[11px] text-teal-700">({adm.patient_id})</span>
                          <Badge 
                            variant={adm.status === "DISCHARGE_PENDING" ? "warning" : adm.status === "DISCHARGED" ? "default" : "teal"}
                            className="text-[10px] uppercase font-bold"
                          >
                            ● {adm.status}
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Physician: <strong>{adm.doctor_name}</strong> • Ward: <strong>{adm.ward_name || "General Ward"}</strong> (Room {adm.room_number || "301"} - Bed {adm.bed_number || "A"})
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                          <span>Admitted: {new Date(adm.admitted_at || adm.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Financial Status: <strong>₹{totalOutstanding.toFixed(2)} Outstanding</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href="/hospital/admissions">
                          <Button size="sm" variant="outline" className="text-xs">
                            View Inpatient Stay <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">
                  {filterTab === "PENDING" ? "No patients pending discharge." : "No matching discharge records found."}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Patients marked for discharge by clinical doctors will appear here for administrative clearance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </RoleGuard>
  );
}
