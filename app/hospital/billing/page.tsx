"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Filter,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Building2,
  User,
  Plus,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllBills, getBillsByFacility } from "@/lib/data/billing-store";
import { BillingEngineService } from "@/lib/services/billing-engine-service";
import { HealthcareBill } from "@/types/database.types";

export default function HospitalBillingConsolePage() {
  const { user } = useAuth();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("FAC-1001");
  const [bills, setBills] = useState<HealthcareBill[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const refresh = () => {
    const list = selectedFacilityId ? getBillsByFacility(selectedFacilityId, filterStatus) : getAllBills();
    setBills(list);
  };

  useEffect(() => {
    refresh();
  }, [selectedFacilityId, filterStatus]);

  const filteredBills = bills.filter((item) => {
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const match =
        item.id.toLowerCase().includes(q) ||
        item.bill_number.toLowerCase().includes(q) ||
        item.patient_name.toLowerCase().includes(q) ||
        item.patient_id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateDraft = () => {
    const res = BillingEngineService.createDraftBill({
      patientId: "PAT-1001",
      patientName: "Rahul Verma",
      organizationId: "11111111-1111-1111-1111-111111111101",
      organizationName: "City Hospital",
      facilityId: "FAC-1001",
      facilityName: "City Hospital — Rourkela Central",
      encounterId: "ENC-1001",
      billType: "FINAL",
      actor: user,
    });

    if (res.success && res.bill) {
      refresh();
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "doctor", "lab_staff"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/hospital">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Hospital Command
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" /> Hospital Itemized Billing & Financial Desk
              </h1>
              <p className="text-xs text-slate-500">Authoritative bill creation, service-to-charge linkage & financial coverage management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleCreateDraft} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
              <Plus className="h-4 w-4 mr-1" /> New Draft Bill
            </Button>
            <Button size="sm" variant="ghost" onClick={refresh} className="rounded-xl">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["ALL", "DRAFT", "PENDING_REVIEW", "ISSUED", "DISPUTED", "CANCELLED"].map((f) => (
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
              placeholder="Search bill number, patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs h-9 pl-9 pr-3 rounded-xl border border-input bg-slate-50"
            />
          </div>
        </div>

        {/* Bills List */}
        <div className="space-y-3">
          {filteredBills.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
              No healthcare bills matching filter criteria.
            </div>
          ) : (
            filteredBills.map((item) => (
              <Card key={item.id} className="bg-white rounded-2xl shadow-xs border-slate-200 hover:border-emerald-200 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-950 text-xs">{item.bill_number}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">V{item.current_version}</Badge>
                      <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-[10px]">{item.bill_type}</Badge>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                      <span>Patient: <strong className="text-slate-900">{item.patient_name}</strong> ({item.patient_id})</span>
                      <span>•</span>
                      <span>Items: <strong className="text-slate-800">{item.items.length} charges</strong></span>
                      <span>•</span>
                      <span>Gross: <strong className="text-slate-900 font-mono">₹{item.gross_total.toFixed(2)}</strong></span>
                      <span>•</span>
                      <span>Patient Due: <strong className="text-purple-950 font-mono font-extrabold">₹{item.patient_responsibility.toFixed(2)}</strong></span>
                    </div>
                  </div>

                  <Link href={`/hospital/billing/${item.id}`}>
                    <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
                      Manage & Itemize <ChevronRight className="h-4 w-4 ml-1" />
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
