"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileSpreadsheet,
  Building2,
  User,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllReconciliationRuns, getAllFinancialExceptions } from "@/lib/data/reconciliation-store";
import { FinancialReconciliationService } from "@/lib/services/financial-reconciliation-service";
import { ReconciliationRun, FinancialException } from "@/types/database.types";

export default function FinanceReconciliationConsolePage() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [exceptions, setExceptions] = useState<FinancialException[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => {
    setRuns(getAllReconciliationRuns());
    setExceptions(getAllFinancialExceptions());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRunReconciliation = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = FinancialReconciliationService.runReconciliation({
        organizationId: "11111111-1111-1111-1111-111111111101",
        facilityId: "FAC-1001",
        periodStart: "2026-08-21T00:00:00Z",
        periodEnd: "2026-08-21T23:59:59Z",
        actor: user,
      });

      if (res.success && res.run) {
        setMessage(`Executed reconciliation run ${res.run.run_number}! Matched: ₹${res.run.matched_total}`);
        refresh();
      } else {
        setMessage(res.error || "Failed to execute reconciliation run.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "doctor", "lab_staff"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/hospital/billing">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Billing
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-600" /> Finance Reconciliation & Exception Desk
              </h1>
              <p className="text-xs text-slate-500">3-Way matching (MEDORA vs Gateway vs Bank Deposit), Exception Management & Audit Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleRunReconciliation} disabled={isSubmitting} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
              <Play className="h-4 w-4 mr-1" /> Run Daily 3-Way Reconciliation
            </Button>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Reconciliation Runs */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reconciliation Runs</h2>
            <div className="space-y-3">
              {runs.map((r) => (
                <Card key={r.id} className="bg-white rounded-2xl shadow-xs border-slate-200">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-950 text-xs">{r.run_number}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                        <span>Period: <strong className="text-slate-900 font-mono">{r.period_start.substring(0, 10)}</strong></span>
                        <span>•</span>
                        <span>Matched: <strong className="text-emerald-700 font-mono font-bold">₹{r.matched_total.toFixed(2)}</strong></span>
                        <span>•</span>
                        <span>Performed By: <strong className="text-slate-800">{r.performed_by_name}</strong></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Exceptions Queue */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider text-amber-700">Reconciliation Exceptions Queue</h2>
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardContent className="p-4 space-y-3">
                {exceptions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No open financial exceptions.</p>
                ) : (
                  exceptions.map((exc) => (
                    <div key={exc.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-amber-950">
                        <span>{exc.category}</span>
                        <span className="font-mono">₹{exc.amount_mismatch.toFixed(2)}</span>
                      </div>
                      <p className="text-slate-700 text-[11px]">{exc.explanation}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
