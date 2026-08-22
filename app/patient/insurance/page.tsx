"use client";

import React from "react";
import Link from "next/link";
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Building2, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export default function PatientInsurancePage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-4 animate-in fade-in-50 duration-150">
        {/* Header */}
        <div className="pb-1">
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider block">
            Health Protection
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Insurance & Benefits
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your active health insurance coverage, pre-authorizations, and claims.
          </p>
        </div>

        {/* 1. Primary Policy Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Active Health Policy
              </span>
            </div>
            <Badge variant="teal" className="text-[10px] bg-teal-500/20 text-teal-200 border-teal-400/30">
              Verified
            </Badge>
          </div>

          <div className="mt-4">
            <span className="text-xs text-blue-200 block">ABC Health Shield Platinum</span>
            <span className="font-mono text-base font-bold tracking-wider block mt-0.5">
              POL-2026-889104
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-blue-300 text-[10px] block">Sum Insured</span>
              <span className="font-bold text-sm text-white">₹5,00,000</span>
            </div>
            <div>
              <span className="text-blue-300 text-[10px] block">Available Balance</span>
              <span className="font-bold text-sm text-teal-300">₹4,85,000</span>
            </div>
          </div>
        </div>

        {/* 2. Cashless Hospital Network */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Network Hospitals
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Pre-authorized for 100% cashless admission at connected MEDORA facilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-teal-700" />
                <div>
                  <span className="font-bold text-slate-900 block">City Hospital</span>
                  <span className="text-[10px] text-slate-500">Tier-1 Cashless Desk Active</span>
                </div>
              </div>
              <Badge variant="teal" className="text-[9px]">Cashless</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-teal-700" />
                <div>
                  <span className="font-bold text-slate-900">Green Care Hospital</span>
                  <span className="text-[10px] text-slate-500">Fast-Track TPA Approval</span>
                </div>
              </div>
              <Badge variant="teal" className="text-[9px]">Cashless</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 3. Recent Insurance Claims */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Claim History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">Outpatient Consultation & ECG</span>
                  <Badge variant="teal" className="text-[9px] py-0">Settled</Badge>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Claim ID: CLM-1001 • City Hospital
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs text-slate-900 block">₹1,500</span>
                <span className="text-[10px] text-teal-700 font-semibold">100% Paid</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
