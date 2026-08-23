"use client";

import React from "react";
import Link from "next/link";
import { 
  Landmark, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Building2, 
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export default function PatientGovernmentSchemesPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-4 animate-in fade-in-50 duration-150">
        {/* Header */}
        <div className="pb-1">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
            National & State Welfare
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Government Health Schemes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Universal health coverage, state subsidies (BSKY), and PM-JAY entitlements.
          </p>
        </div>

        {/* 1. BSKY Scheme Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Biju Swasthya Kalyan Yojana (BSKY)
              </span>
            </div>
            <Badge variant="teal" className="text-[10px] bg-emerald-500/20 text-emerald-200 border-emerald-400/30">
              Active
            </Badge>
          </div>

          <div className="mt-4">
            <span className="text-xs text-emerald-200 block">Beneficiary Health Card No.</span>
            <span className="font-mono text-base font-bold tracking-wider block mt-0.5">
              BSKY-OD-2026-98104
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-emerald-300 text-[10px] block">Annual Family Cover</span>
              <span className="font-bold text-sm text-white">₹5,00,000</span>
            </div>
            <div>
              <span className="text-emerald-300 text-[10px] block">Women Care Cover</span>
              <span className="font-bold text-sm text-emerald-300">₹10,00,000</span>
            </div>
          </div>
        </div>

        {/* 2. Linked Beneficiaries */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Family Beneficiary Unit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{user?.fullName || "Primary Beneficiary"}</span>
                <span className="text-[10px] text-slate-500">Head of Household (Aadhaar Verified)</span>
              </div>
              <Badge variant="teal" className="text-[9px]">Enrolled</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 3. Empanelled Government Hospitals */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Free Treatment Facilities
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Avail 100% free inpatient care and diagnostics under state health schemes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-teal-700" />
                <div>
                  <span className="font-bold text-slate-900 block">City Hospital</span>
                  <span className="text-[10px] text-slate-500">Government Helpdesk Counter 4</span>
                </div>
              </div>
              <Badge variant="teal" className="text-[9px]">Empanelled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
