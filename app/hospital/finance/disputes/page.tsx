"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  RotateCcw,
  Tag,
  Check,
  X,
  FileText,
  Clock,
  AlertCircle,
  Activity
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllDisputes, getAllAnomalies, getDisputeById } from "@/lib/data/dispute-store";
import { DisputeInvestigationService } from "@/lib/services/dispute-investigation-service";
import { FinancialDispute, FinancialAnomaly, EvidenceNode } from "@/types/database.types";

export default function FinancialDisputesDeskPage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<FinancialDispute[]>([]);
  const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<FinancialDispute | null>(null);
  const [evidenceNodes, setEvidenceNodes] = useState<EvidenceNode[]>([]);
  const [filterTab, setFilterTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Resolution Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionDecision, setResolutionDecision] = useState<"NO_ERROR_FOUND" | "PARTIALLY_VALID" | "FULLY_VALID" | "REJECTED">("NO_ERROR_FOUND");
  const [resolutionExplanation, setResolutionExplanation] = useState("Authoritative clinical order, diagnostic result, and physician signature verified against institutional billing catalog.");
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);

  const refresh = () => {
    setDisputes(getAllDisputes());
    const orgId = user?.organizationId || "11111111-1111-1111-1111-111111111101";
    setAnomalies(DisputeInvestigationService.detectFinancialAnomalies(orgId));
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const handleSelectDispute = (d: FinancialDispute) => {
    setSelectedDispute(d);
    const nodes = DisputeInvestigationService.gatherInternalEvidenceTimeline(d.id);
    setEvidenceNodes(nodes);
  };

  const filteredDisputes = useMemo(() => {
    let list = disputes;
    if (filterTab === "OPEN") {
      list = list.filter((d) => d.status === "RECEIVED" || d.status === "WAITING_FOR_INFORMATION" || d.status === "EVIDENCE_COLLECTED");
    } else if (filterTab === "RESOLVED") {
      list = list.filter((d) => d.status === "RESOLVED");
    } else if (filterTab === "REJECTED") {
      list = list.filter((d) => d.status === "REJECTED");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.dispute_number.toLowerCase().includes(q) ||
          d.patient_name.toLowerCase().includes(q) ||
          d.patient_id.toLowerCase().includes(q) ||
          d.bill_id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [disputes, filterTab, searchQuery]);

  const handleExecuteResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !user) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = DisputeInvestigationService.resolveDispute({
        disputeId: selectedDispute.id,
        resolutionType: resolutionDecision === "REJECTED" ? "NO_ERROR_FOUND" : resolutionDecision,
        decisionExplanation: resolutionExplanation.trim() || "Formally reviewed by hospital billing investigation desk.",
        amountAffected: adjustmentAmount,
        refundAmount: resolutionDecision === "FULLY_VALID" || resolutionDecision === "PARTIALLY_VALID" ? adjustmentAmount : undefined,
        actor: user,
      });

      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: `Dispute ${selectedDispute.dispute_number} resolved with decision: ${resolutionDecision}. Financial audit ledger updated.`,
        });
        setShowResolveModal(false);
        refresh();
        setSelectedDispute(null);
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to resolve dispute." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "finance_staff", "doctor"]}>
      <div className="min-h-screen space-y-6 max-w-7xl mx-auto pb-24 font-sans p-4 sm:p-6 animate-in fade-in-50 duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-teal-600" /> Financial Disputes & Fraud Prevention Desk
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-teal-50 text-teal-800 border-teal-200">
                Audit Oversight (Step 5)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Chronological clinical evidence graph, explainable dispute resolution & anti-fraud anomaly detection
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/hospital/billing">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs">
                <ArrowLeft className="h-4 w-4 mr-1" /> Central Billing
              </Button>
            </Link>
            <Link href="/hospital/activity">
              <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5">
                <Activity className="h-3.5 w-3.5 text-teal-700" /> Activity Log
              </Button>
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Anomaly Detection Banner (Fraud Prevention Oversight) */}
        {anomalies.length > 0 && (
          <Card className="bg-amber-50/70 border-amber-300 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                    Explainable Anti-Fraud & Anomaly Alerts ({anomalies.length} Flagged)
                  </h3>
                  <Badge variant="outline" className="text-[10px] bg-white border-amber-300 text-amber-900 font-bold">
                    Automated Inspection
                  </Badge>
                </div>
                <div className="divide-y divide-amber-200/60 pt-1 text-xs">
                  {anomalies.map((a) => (
                    <div key={a.id} className="py-2 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-900">{a.category}</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">{a.explanation}</p>
                      </div>
                      <Badge variant="warning" className="text-[9px] uppercase font-bold shrink-0">
                        {a.severity} RISK
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Disputes Queue */}
          <div className="lg:col-span-2 space-y-3">
            <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="p-4 pb-3 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    {[
                      { key: "ALL", label: "All Inquiries" },
                      { key: "OPEN", label: "Open Reviews" },
                      { key: "RESOLVED", label: "Resolved" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setFilterTab(tab.key)}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                          filterTab === tab.key
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search patient, dispute ID..."
                      className="text-xs pl-8 h-8 bg-slate-50 border-slate-200 rounded-xl"
                    />
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredDisputes.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {filteredDisputes.map((d) => {
                      const isSelected = selectedDispute?.id === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => handleSelectDispute(d)}
                          className={`p-4 cursor-pointer hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition-colors ${
                            isSelected ? "bg-teal-50/50 border-l-4 border-l-teal-600" : ""
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-teal-950 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs">
                                {d.dispute_number}
                              </span>
                              <Badge variant="outline" className="text-[10px] font-mono bg-slate-50">
                                {d.category}
                              </Badge>
                              <StatusBadge status={d.status} />
                            </div>

                            <p className="text-slate-900 font-medium text-xs">{d.description}</p>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                              <span>Patient: <strong className="text-slate-800">{d.patient_name}</strong> ({d.patient_id})</span>
                              <span>•</span>
                              <span>Target Bill: <strong className="text-slate-800">{d.bill_id}</strong></span>
                              {d.bill_item_id && (
                                <>
                                  <span>•</span>
                                  <span>Item: {d.bill_item_id}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className="text-xs rounded-xl font-bold h-8"
                            >
                              {isSelected ? "Investigating ↓" : "Inspect Evidence →"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-1">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-700">No matching disputes in queue</p>
                    <p>All financial inquiries have been investigated and documented.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Evidence Graph & Resolution Drawer */}
          <div className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="p-4 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Chronological Evidence Lineage
                    </CardTitle>
                  </div>
                  {selectedDispute && (
                    <Badge variant="outline" className="text-[10px] font-mono font-bold">
                      {selectedDispute.dispute_number}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {selectedDispute ? (
                  <>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-slate-900 block">Dispute Subject:</span>
                      <p className="text-slate-600 text-[11px] italic">"{selectedDispute.description}"</p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                        Compiled Service Events
                      </span>

                      {evidenceNodes.length > 0 ? (
                        evidenceNodes.map((node) => (
                          <div key={node.id} className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-900 text-[11px]">{node.title}</span>
                              <Badge variant="outline" className="text-[9px] font-mono bg-slate-50">
                                {node.source_type}
                              </Badge>
                            </div>
                            <p className="text-slate-600 text-[10px]">{node.description}</p>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {new Date(node.timestamp).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500">
                          Compiling verified clinical provenance trail...
                        </div>
                      )}
                    </div>

                    {selectedDispute.status !== "RESOLVED" && selectedDispute.status !== "REJECTED" && (
                      <div className="pt-2 border-t border-slate-100">
                        <Button
                          onClick={() => setShowResolveModal(true)}
                          size="sm"
                          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-xs"
                        >
                          Execute Formal Dispute Finding →
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                    <FileSpreadsheet className="h-8 w-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">Select a dispute from the queue</p>
                    <p className="text-[11px]">
                      The system will automatically compile doctor orders, procedure logs, diagnostic signatures, and invoice history into a unified evidence graph.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal: Formal Dispute Resolution */}
        {showResolveModal && selectedDispute && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Execute Dispute Resolution</h3>
                </div>
                <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleExecuteResolution} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Resolution Decision *</label>
                  <select
                    value={resolutionDecision}
                    onChange={(e) => setResolutionDecision(e.target.value as any)}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-bold"
                  >
                    <option value="NO_ERROR_FOUND">NO_ERROR_FOUND (Charge fully verified & upheld)</option>
                    <option value="PARTIALLY_VALID">PARTIALLY_VALID (Issue courtesy partial adjustment / waiver)</option>
                    <option value="FULLY_VALID">FULLY_VALID (Charge reversed / full refund authorized)</option>
                    <option value="REJECTED">REJECTED (Claim invalid or unsupported)</option>
                  </select>
                </div>

                {(resolutionDecision === "PARTIALLY_VALID" || resolutionDecision === "FULLY_VALID") && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Adjustment / Refund Amount (₹) *</label>
                    <input
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono font-bold"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Formal Finding & Auditor Notes *</label>
                  <textarea
                    rows={3}
                    value={resolutionExplanation}
                    onChange={(e) => setResolutionExplanation(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50"
                    required
                  />
                </div>

                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-[11px] text-teal-900">
                  <strong>Tamper-Evident Ledger:</strong> Submitting this finding will append an immutable resolution record signed under your authenticated credential (<strong>{user?.fullName || "Compliance Officer"}</strong>).
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResolveModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {isSubmitting ? "Finalizing..." : "Submit Formal Finding"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
