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
  Activity,
  Scale,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllDisputes, getAllAnomalies, getDisputeById } from "@/lib/data/dispute-store";
import { DisputeInvestigationService } from "@/lib/services/dispute-investigation-service";
import { compareChargeWithBenchmark } from "@/lib/data/reference-rate-store";
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

  // Multi-Stage Modal State
  const [showMultiStageModal, setShowMultiStageModal] = useState(false);
  const [modalStage, setModalStage] = useState<"L1" | "L2" | "L3">("L1");
  const [l1Action, setL1Action] = useState<"EXPLAIN" | "ADJUST" | "REFUND" | "REJECT" | "ESCALATE_L2">("EXPLAIN");
  const [l2Action, setL2Action] = useState<"RESOLVE" | "ESCALATE_L3">("RESOLVE");
  const [l3Outcome, setL3Outcome] = useState<"FULLY_RESOLVED" | "PARTIALLY_RESOLVED" | "NOT_RESOLVED">("FULLY_RESOLVED");
  const [responseExplanation, setResponseExplanation] = useState("");
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
    if (filterTab === "L1") {
      list = list.filter((d) => d.status === "HOSPITAL_REVIEW_L1" || d.status === "SUBMITTED" || d.status === "RECEIVED" || d.current_stage === "HOSPITAL_L1");
    } else if (filterTab === "L2") {
      list = list.filter((d) => d.status === "HOSPITAL_REVIEW_L2" || d.current_stage === "HOSPITAL_L2");
    } else if (filterTab === "L3") {
      list = list.filter((d) => d.status === "FINAL_HOSPITAL_REVIEW" || d.current_stage === "HOSPITAL_L3");
    } else if (filterTab === "EXTERNAL") {
      list = list.filter((d) => d.status === "EXTERNAL_CASE_CREATED" || d.status === "ELIGIBLE_FOR_EXTERNAL_ESCALATION" || d.current_stage === "EXTERNAL_PROTOTYPE");
    } else if (filterTab === "RESOLVED") {
      list = list.filter((d) => d.status === "RESOLVED" || d.status === "RESOLVED_BY_HOSPITAL" || d.status === "PARTIALLY_RESOLVED");
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

  const handleOpenStageModal = (stage: "L1" | "L2" | "L3") => {
    setModalStage(stage);
    setResponseExplanation("");
    setAdjustmentAmount(0);
    setShowMultiStageModal(true);
  };

  const handleExecuteStageResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !user || !responseExplanation.trim()) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      if (modalStage === "L1") {
        const res = DisputeInvestigationService.respondHospitalLevel1({
          disputeId: selectedDispute.id,
          explanation: responseExplanation.trim(),
          action: l1Action,
          adjustmentAmount: l1Action === "ADJUST" || l1Action === "REFUND" ? adjustmentAmount : undefined,
          actor: user,
        });
        if (res.success) {
          setFeedbackMsg({ type: "success", text: `Level 1 Review processed: Action ${l1Action} recorded.` });
          setShowMultiStageModal(false);
          refresh();
          if (res.dispute) setSelectedDispute(res.dispute);
        }
      } else if (modalStage === "L2") {
        const res = DisputeInvestigationService.respondHospitalLevel2({
          disputeId: selectedDispute.id,
          explanation: responseExplanation.trim(),
          action: l2Action,
          adjustmentAmount: l2Action === "RESOLVE" ? adjustmentAmount : undefined,
          actor: user,
        });
        if (res.success) {
          setFeedbackMsg({ type: "success", text: `Internal Review (Level 2) processed: Action ${l2Action} recorded.` });
          setShowMultiStageModal(false);
          refresh();
          if (res.dispute) setSelectedDispute(res.dispute);
        }
      } else if (modalStage === "L3") {
        const res = DisputeInvestigationService.respondHospitalFinalLevel3({
          disputeId: selectedDispute.id,
          explanation: responseExplanation.trim(),
          outcome: l3Outcome,
          adjustmentAmount: l3Outcome !== "NOT_RESOLVED" ? adjustmentAmount : undefined,
          actor: user,
        });
        if (res.success) {
          setFeedbackMsg({ type: "success", text: `Final Hospital Review (Level 3) completed: Outcome ${l3Outcome} recorded.` });
          setShowMultiStageModal(false);
          refresh();
          if (res.dispute) setSelectedDispute(res.dispute);
        }
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
                <HelpCircle className="h-5 w-5 text-indigo-600" /> Multi-Stage Dispute & Pricing Review Desk
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-indigo-50 text-indigo-800 border-indigo-200">
                Institutional Oversight (Step 5)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-stage review workflow (Level 1 Review $\rightarrow$ Internal Escalation $\rightarrow$ Final Review $\rightarrow$ External Escalation Package)
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
                <Activity className="h-3.5 w-3.5 text-indigo-700" /> Activity Log
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

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 5 COLUMNS: DISPUTES LIST & MULTI-STAGE TABS */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
              {[
                { id: "ALL", label: `All (${disputes.length})` },
                { id: "L1", label: "Level 1 Review" },
                { id: "L2", label: "L2 Escalated" },
                { id: "L3", label: "Final L3" },
                { id: "EXTERNAL", label: "External" },
                { id: "RESOLVED", label: "Resolved" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filterTab === tab.id
                      ? "bg-white text-indigo-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search by dispute #, patient name, bill ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            {/* Disputes Queue */}
            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
              {filteredDisputes.map((d) => {
                const isSelected = selectedDispute?.id === d.id;
                const comp = d.service_name && d.charged_amount ? compareChargeWithBenchmark(d.service_name, d.charged_amount) : null;

                return (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDispute(d)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] font-bold">
                          {d.dispute_number}
                        </Badge>
                        <StatusBadge status={d.status} />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{d.patient_name}</span>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{d.description}</p>
                    </div>

                    {comp && comp.has_reference && (
                      <div className="flex items-center justify-between text-[10px] p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-500">Benchmark Comparison:</span>
                        <span className={comp.difference_amount > 0 ? "text-rose-700 font-bold" : "text-emerald-700 font-bold"}>
                          Charged ₹{d.charged_amount?.toFixed(2)} vs Ref ₹{comp.benchmark_amount.toFixed(2)} ({comp.status_label})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredDisputes.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs italic">
                  No disputes match the selected stage filter.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 7 COLUMNS: EVIDENCE GRAPH & MULTI-STAGE ACTION DESK */}
          <div className="lg:col-span-7 space-y-4">
            {selectedDispute ? (
              <div className="space-y-4">
                
                {/* Dispute Dossier Card */}
                <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
                  <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono font-bold text-xs">
                          {selectedDispute.dispute_number}
                        </Badge>
                        <StatusBadge status={selectedDispute.status} />
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-900 mt-1.5">
                        Patient: {selectedDispute.patient_name} ({selectedDispute.patient_id})
                      </CardTitle>
                    </div>

                    {/* Stage Action Controls */}
                    <div className="flex items-center gap-2">
                      {selectedDispute.status !== "RESOLVED" && selectedDispute.status !== "RESOLVED_BY_HOSPITAL" && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenStageModal("L1")}
                            className="text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Level 1 Review
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenStageModal("L2")}
                            className="text-xs font-bold rounded-xl border-amber-300 text-amber-900 hover:bg-amber-50"
                          >
                            Internal Escalation (L2)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenStageModal("L3")}
                            className="text-xs font-bold rounded-xl border-rose-300 text-rose-900 hover:bg-rose-50"
                          >
                            Final Review (L3)
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs">
                    
                    {/* Inquiry Details */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Formal Statement</span>
                      <p className="text-slate-800 font-medium leading-relaxed">{selectedDispute.description}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Category:</span>
                          <span className="font-bold text-slate-700">{selectedDispute.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Bill Reference:</span>
                          <span className="font-mono font-bold text-slate-700">{selectedDispute.bill_id}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Disputed Item:</span>
                          <span className="font-bold text-slate-700">{selectedDispute.service_name || "Line Item"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Previous Round Hospital Responses */}
                    {selectedDispute.l1_response && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-950 space-y-1">
                        <span className="font-bold block">Hospital Level 1 Response ({selectedDispute.l1_response.responder_name}):</span>
                        <p>{selectedDispute.l1_response.explanation}</p>
                        <span className="text-[10px] text-blue-700 block">Action: {selectedDispute.l1_response.action} • {new Date(selectedDispute.l1_response.timestamp).toLocaleString()}</span>
                      </div>
                    )}

                    {selectedDispute.l2_response && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 space-y-1">
                        <span className="font-bold block">Internal Escalation (Level 2) Review ({selectedDispute.l2_response.reviewer_name}):</span>
                        <p>{selectedDispute.l2_response.explanation}</p>
                        <span className="text-[10px] text-amber-700 block">Action: {selectedDispute.l2_response.action} • {new Date(selectedDispute.l2_response.timestamp).toLocaleString()}</span>
                      </div>
                    )}

                    {selectedDispute.l3_response && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-950 space-y-1">
                        <span className="font-bold block">Final Hospital Decision (Level 3): Outcome = {selectedDispute.l3_response.outcome}</span>
                        <p>{selectedDispute.l3_response.explanation}</p>
                        <span className="text-[10px] text-purple-700 block">Reviewer: {selectedDispute.l3_response.reviewer_name} • {new Date(selectedDispute.l3_response.timestamp).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Evidence Timeline Graph */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Corroborating Clinical & Financial Evidence Graph ({evidenceNodes.length} Nodes)
                      </span>
                      <div className="space-y-2">
                        {evidenceNodes.map((node) => (
                          <div key={node.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5">
                            <div className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                            <div className="space-y-0.5 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{node.title}</span>
                                <span className="text-[10px] font-mono text-slate-400">{new Date(node.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <p className="text-[11px] text-slate-600">{node.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs italic">
                Select a dispute from the queue on the left to inspect evidence and execute multi-stage hospital reviews.
              </div>
            )}
          </div>
        </div>

        {/* MULTI-STAGE HOSPITAL RESPONSE MODAL */}
        {showMultiStageModal && selectedDispute && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {modalStage === "L1" && "Hospital Review — Level 1"}
                      {modalStage === "L2" && "Internal Escalation — Level 2"}
                      {modalStage === "L3" && "Final Hospital Review — Level 3"}
                    </h3>
                    <p className="text-[11px] text-slate-500">Case #{selectedDispute.dispute_number}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMultiStageModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleExecuteStageResponse} className="space-y-3 text-xs">
                
                {/* Stage 1 Action Selection */}
                {modalStage === "L1" && (
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Review Decision & Action *</Label>
                    <select
                      value={l1Action}
                      onChange={(e) => setL1Action(e.target.value as any)}
                      className="w-full h-9 mt-1 rounded-xl border border-input bg-white px-2 text-xs font-medium"
                    >
                      <option value="EXPLAIN">Explain Charge (Provide Tariff Context)</option>
                      <option value="ADJUST">Apply Financial Adjustment</option>
                      <option value="REFUND">Approve Patient Refund</option>
                      <option value="REJECT">Reject Dispute with Cause</option>
                      <option value="ESCALATE_L2">Escalate to Internal Review Level 2</option>
                    </select>
                  </div>
                )}

                {/* Stage 2 Action Selection */}
                {modalStage === "L2" && (
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Internal Committee Action *</Label>
                    <select
                      value={l2Action}
                      onChange={(e) => setL2Action(e.target.value as any)}
                      className="w-full h-9 mt-1 rounded-xl border border-input bg-white px-2 text-xs font-medium"
                    >
                      <option value="RESOLVE">Resolve with Corrective Settlement</option>
                      <option value="ESCALATE_L3">Escalate to Final Hospital Review (L3)</option>
                    </select>
                  </div>
                )}

                {/* Stage 3 Outcome Selection */}
                {modalStage === "L3" && (
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Final Hospital Outcome *</Label>
                    <select
                      value={l3Outcome}
                      onChange={(e) => setL3Outcome(e.target.value as any)}
                      className="w-full h-9 mt-1 rounded-xl border border-input bg-white px-2 text-xs font-medium"
                    >
                      <option value="FULLY_RESOLVED">Fully Resolved (Mutually Agreed)</option>
                      <option value="PARTIALLY_RESOLVED">Partially Resolved</option>
                      <option value="NOT_RESOLVED">Not Resolved (Eligible for External Grievance)</option>
                    </select>
                  </div>
                )}

                {/* Adjustment Amount Input if applicable */}
                {(l1Action === "ADJUST" || l1Action === "REFUND" || l2Action === "RESOLVE" || l3Outcome === "PARTIALLY_RESOLVED") && (
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Adjustment / Refund Amount (₹)</Label>
                    <Input
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                      className="text-xs h-9 mt-1 rounded-xl font-mono font-bold"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-[11px] font-bold text-slate-700">Detailed Institutional Notes & Explanation *</Label>
                  <Textarea
                    rows={3}
                    value={responseExplanation}
                    onChange={(e) => setResponseExplanation(e.target.value)}
                    placeholder="Document clinical evidence, tariff verification, or adjustment rationale..."
                    className="text-xs mt-1 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMultiStageModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !responseExplanation.trim()}
                    size="sm"
                    className="text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSubmitting ? "Recording..." : "Record Institutional Decision"}
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
