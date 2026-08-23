"use client";

import React from "react";
import Link from "next/link";
import { 
  CreditCard, 
  HandHeart, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  ChevronRight,
  ShieldCheck,
  Calculator
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export default function PatientFinancingPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-4 animate-in fade-in-50 duration-150">
        {/* Header */}
        <div className="pb-1">
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block">
            CarePay Treatment Financing
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Financial Support & Micro-EMI
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent 0% interest treatment financing and multi-source cost splitting.
          </p>
        </div>

        {/* 1. CarePay Limit Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                CarePay Instant Credit Line
              </span>
            </div>
            <Badge variant="teal" className="text-[10px] bg-purple-500/20 text-purple-200 border-purple-400/30">
              Pre-Approved
            </Badge>
          </div>

          <div className="mt-4">
            <span className="text-xs text-purple-200 block">Available Treatment Financing</span>
            <span className="font-mono text-xl font-bold tracking-wider block mt-0.5">
              ₹1,50,000
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-purple-300 text-[11px]">0% Interest • 3 to 12 Easy Monthly EMIs</span>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7">
              Apply for Bill
            </Button>
          </div>
        </div>

        {/* 2. Transparent Multi-Source Split Explanation */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              How Cost-Splitting Works
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Combine insurance, government subsidies, and CarePay to reduce out-of-pocket expenses to zero.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>1. Primary Health Insurance / BSKY</span>
                <span className="font-semibold text-teal-700">Pays 80%</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>2. CarePay Zero-Cost Micro EMI</span>
                <span className="font-semibold text-purple-700">Finances 20%</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
                <span>Your Immediate Cash Required</span>
                <span className="text-teal-700">₹0 (Zero Upfront)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Link to Unpaid Hospital Bills */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Itemized Hospital Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Link href="/patient/bills">
              <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50/60 border border-teal-100 hover:bg-teal-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Receipt className="h-4 w-4 text-teal-700" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">View Hospital Bills</span>
                    <span className="text-[11px] text-slate-500">Apply CarePay EMI directly to any invoice</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-teal-700" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
