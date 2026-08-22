"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Building2,
  User,
  ShieldCheck,
  FileSpreadsheet,
  History,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllDisputes, getAllAnomalies } from "@/lib/data/dispute-store";
import { DisputeInvestigationService } from "@/lib/services/dispute-investigation-service";
import { FinancialDispute, FinancialAnomaly, EvidenceNode } from "@/types/database.types";

export default function FinancialDisputesDeskPage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<FinancialDispute[]>([]);
  const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<FinancialDispute | null>(null);
  const [evidenceNodes, setEvidenceNodes] = useState<EvidenceNode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => {
    setDisputes(getAllDisputes());
    setAnomalies(getAllAnomalies());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSelectDispute = (d: FinancialDispute) => {
    setSelectedDispute(d);
    const nodes = DisputeInvestigationService.gatherInternalEvidenceTimeline(d.id);
    setEvidenceNodes(nodes);
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = DisputeInvestigationService.resolveDispute({
        disputeId: selectedDispute.id,
        resolutionType: "NO_ERROR_FOUND",
        decisionExplanation: "Authoritative clinical order, procedure log, and signed report verified by hospital compliance team.",
        amountAffected: 0,
        actor: user,
      });

      if (res.success) {
        setMessage(`Resolved dispute ${selectedDispute.dispute_number} successfully!`);
        refresh();
        setSelectedDispute(null);
      } else {
        setMessage(res.error || "Failed to resolve dispute.");
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
                <HelpCircle className="h-5 w-5 text-emerald-600" /> Financial Disputes & Investigation Desk
              </h1>
              <p className="text-xs text-slate-500">Chronological Evidence Graph, Explainable Rule-Based Anomaly Engine & Dispute Resolution</p>
            </div>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Disputes Queue */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient & Staff Financial Disputes</h2>
            <div className="space-y-3">
              {disputes.map((d) => (
                <Card
                  key={d.id}
                  onClick={() => handleSelectDispute(d)}
                  className={`bg-white rounded-2xl shadow-xs border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors ${selectedDispute?.id === d.id ? "border-emerald-500 ring-1 ring-emerald-500" : ""}`}
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-950 text-xs">{d.dispute_number}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{d.category}</Badge>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-xs text-slate-700">{d.description}</p>
                      <span className="text-[10px] text-slate-500 font-mono">Patient: {d.patient_name} • Bill: {d.bill_id}</span>
                    </div>

                    <Button size="sm" variant="outline" className="text-xs rounded-xl font-bold">
                      Investigate Evidence
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Evidence Graph Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Internal Evidence Graph</h2>
            {selectedDispute ? (
              <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
                <CardHeader className="p-4 pb-2 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Evidence Timeline for {selectedDispute.dispute_number}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2 text-xs">
                    {evidenceNodes.map((node) => (
                      <div key={node.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900 text-[11px]">{node.title}</span>
                          <Badge variant="outline" className="text-[9px] font-mono">{node.source_type}</Badge>
                        </div>
                        <p className="text-slate-600 text-[10px]">{node.description}</p>
                        <span className="text-[9px] text-slate-400 font-mono block">{new Date(node.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Button onClick={handleResolveDispute} disabled={isSubmitting} size="sm" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
                      Approve Resolution (No Error Found)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-500 text-xs">
                Select a dispute from the queue to compile and inspect its chronological evidence graph.
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
