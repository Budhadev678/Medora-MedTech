"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Pill,
  Building2,
  Users,
  FileText,
  Boxes,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllPharmacyFacilities, getPharmacyOrganizationById } from "@/lib/data/pharmacy-organization-store";
import { getAllIntakes } from "@/lib/data/pharmacy-intake-store";
import { PharmacyFacility } from "@/types/database.types";

export default function PharmacyPortalPage() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<PharmacyFacility[]>([]);
  const [intakesCount, setIntakesCount] = useState({ pending: 0, valid: 0, total: 0 });

  useEffect(() => {
    setFacilities(getAllPharmacyFacilities());
    const intakes = getAllIntakes();
    setIntakesCount({
      pending: intakes.filter((i) => i.status === "RECEIVED" || i.status === "UNDER_REVIEW").length,
      valid: intakes.filter((i) => i.status === "VALID").length,
      total: intakes.length,
    });
  }, []);

  return (
    <RoleGuard allowedRoles={["admin", "doctor", "lab_staff"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <Pill className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">Connected Pharmacy Portal</h1>
                <Badge className="bg-emerald-600 text-white text-xs">PHASE 9.1 & 9.2 CONNECTED</Badge>
              </div>
              <p className="text-xs text-slate-500">Connected pharmacy facility management, prescription intake & stock inventory</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/pharmacy/prescriptions">
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
                <FileText className="h-4 w-4 mr-1" /> Intake Queue ({intakesCount.pending})
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Connected Facilities</p>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{facilities.length}</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Rourkela Central & Branches</p>
              </div>
              <Building2 className="h-8 w-8 text-emerald-600 opacity-80" />
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Prescription Review</p>
                <h2 className="text-2xl font-extrabold text-amber-600 mt-1">{intakesCount.pending}</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Awaiting Pharmacist Validation</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Validated Intakes</p>
                <h2 className="text-2xl font-extrabold text-emerald-600 mt-1">{intakesCount.valid}</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Ready for Fulfillment & Reserve</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-600 opacity-80" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Nav Workspaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white rounded-2xl shadow-xs border-slate-200 hover:border-emerald-300 transition-all">
            <CardHeader className="p-4 pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" /> Prescription Intake Workbench
                </span>
                <Link href="/pharmacy/prescriptions">
                  <Button size="sm" variant="ghost" className="text-xs text-emerald-700">Open Workbench <ArrowRight className="h-3 w-3 ml-1" /></Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-slate-600">
              <p>Review incoming Phase 7 digital prescriptions, validate patient/prescriber relationships, verify prescription status (`ACTIVE`/`CANCELLED`/`EXPIRED`), and handle prescriber clarification requests.</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-xs border-slate-200 hover:border-emerald-300 transition-all">
            <CardHeader className="p-4 pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-emerald-600" /> Inventory & Batch Console
                </span>
                <Link href="/pharmacy/inventory">
                  <Button size="sm" variant="ghost" className="text-xs text-emerald-700">Open Console <ArrowRight className="h-3 w-3 ml-1" /></Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-slate-600">
              <p>Manage facility medicine stock, FEFO batch expiry dates, atomic stock reservations, low-stock reorder thresholds, and stock movement logs.</p>
            </CardContent>
          </Card>
        </div>

        {/* Connected Facilities List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Connected Pharmacy Facilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {facilities.map((fac) => (
              <Card key={fac.id} className="bg-white rounded-2xl shadow-xs border-slate-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-emerald-950">{fac.id}</span>
                    <Badge className="bg-emerald-600 text-white text-[9px]">{fac.operational_status}</Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">{fac.name}</h4>
                  <p className="text-[10px] text-slate-500">{fac.address}, {fac.city}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-[9px]">Pickup: {fac.pickup_available ? "Yes" : "No"}</Badge>
                    <Badge variant="outline" className="text-[9px]">Delivery: {fac.delivery_available ? "Yes" : "No"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
