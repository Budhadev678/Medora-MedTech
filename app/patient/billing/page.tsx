"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  Building2,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Bell,
  ShieldCheck,
  Search,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { useLocalization } from "@/lib/localization";
import { getBillsByPatient } from "@/lib/data/billing-store";
import { HealthcareBill } from "@/types/database.types";

export default function PatientBillingDashboardPage() {
  const { user } = useAuth();
  const { t, formatCurrency } = useLocalization();
  const [bills, setBills] = useState<HealthcareBill[]>([]);

  useEffect(() => {
    const patientId = user?.identifier || user?.id || "PAT-1001";
    const list = getBillsByPatient(patientId);
    setBills(list);
  }, [user]);

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("nav.home")}
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" /> {t("billing.title")}
              </h1>
              <p className="text-xs text-slate-500">{t("billing.why_charged")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/patient/billing/payments">
              <Button variant="outline" size="sm" className="text-xs rounded-xl h-8 text-slate-700 hover:bg-slate-50 border-slate-200">
                {t("billing.payment_history")}
              </Button>
            </Link>
            <Link href="/patient/insurance">
              <Button variant="outline" size="sm" className="text-xs rounded-xl h-8 text-slate-700 hover:bg-slate-50 border-slate-200">
                {t("nav.insurance")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Bills List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t("billing.your_bills")}</h2>
          {bills.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
              {t("common.no_records")}
            </div>
          ) : (
            bills.map((item) => (
              <Card key={item.id} className="bg-white rounded-2xl shadow-xs border-slate-200 hover:border-emerald-300 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[9px] font-extrabold tracking-wider uppercase font-mono">
                        MEDORA TRACE
                      </span>
                      <span className="font-mono font-bold text-emerald-950 text-xs">{item.bill_number}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">V{item.current_version}</Badge>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                      <span>Hospital: <strong className="text-slate-900">{item.facility_name}</strong></span>
                      <span>•</span>
                      <span>{t("billing.gross_total")}: <strong className="text-slate-900 font-mono">{formatCurrency(item.gross_total)}</strong></span>
                      <span>•</span>
                      <span>{t("billing.patient_due")}: <strong className="text-purple-950 font-mono font-extrabold">{formatCurrency(item.patient_responsibility)}</strong></span>
                    </div>
                  </div>

                  <Link href={`/patient/billing/${item.id}`}>
                    <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
                      {t("billing.itemized_breakdown")} <ArrowRight className="h-4 w-4 ml-1" />
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
