"use client";

import React from "react";
import Link from "next/link";
import { Shield, FileCheck, FileSearch, CreditCard, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export default function InsuranceDashboardPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["insurance_staff", "finance_staff", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Insurance & Healthcare Payer Portal"
          description="Pre-authorization processing, cashless claim settlements, and direct hospital disbursement."
          badgeText="Active Payer Hub"
          actions={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">
                {user?.identifier || "INS-1001"}
              </span>
            </div>
          }
        />

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4">
              <span className="text-slate-400 text-xs block">Pending Pre-Auths</span>
              <span className="text-xl font-bold text-slate-900 block mt-1">3 Cases</span>
              <span className="text-[10px] text-amber-600 font-semibold">● Under Desk Review</span>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <span className="text-slate-400 text-xs block">Approved Claims (MTD)</span>
              <span className="text-xl font-bold text-slate-900 block mt-1">₹4,25,000</span>
              <span className="text-[10px] text-emerald-600 font-semibold">● 18 Claims Settled</span>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <span className="text-slate-400 text-xs block">Active Linked Policies</span>
              <span className="text-xl font-bold text-slate-900 block mt-1">1,420</span>
              <span className="text-[10px] text-blue-600 font-semibold">● ABDM / PM-JAY Linked</span>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4">
              <span className="text-slate-400 text-xs block">Avg Adjudication Time</span>
              <span className="text-xl font-bold text-slate-900 block mt-1">42 Mins</span>
              <span className="text-[10px] text-teal-600 font-semibold">● Fast-Track Protocol</span>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/insurance/claims" className="group">
            <Card className="bg-white hover:border-teal-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <FileSearch className="h-4 w-4" />
                  </div>
                  <Badge variant="warning" className="text-[10px]">3 New</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-teal-700 transition-colors">
                  Incoming Claims & Pre-Auth
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Review emergency pre-auth requests from hospital admission desks.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/insurance/policies" className="group">
            <Card className="bg-white hover:border-blue-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">Registry</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-blue-700 transition-colors">
                  Policyholder Coverage Registry
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Verify sum insured, deductibles, and family floater entitlements.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/insurance/payments" className="group">
            <Card className="bg-white hover:border-purple-400 transition-colors h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <Badge variant="teal" className="text-[10px]">Settlements</Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 group-hover:text-purple-700 transition-colors">
                  Hospital Direct Disbursements
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Execute NEFT/RTGS batch disbursements for approved hospital bills.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </RoleGuard>
  );
}
