"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Receipt,
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Info,
  DollarSign,
  AlertTriangle,
  Landmark,
  HandHeart,
  Scale,
  Sparkles,
  ExternalLink,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getBillById, getBillVersions } from "@/lib/data/billing-store";
import { getPaymentsForPatient } from "@/lib/data/payment-store";
import { getDisputesByPatient } from "@/lib/data/dispute-store";
import { DisputeInvestigationService } from "@/lib/services/dispute-investigation-service";
import { compareChargeWithBenchmark, RateComparisonResult } from "@/lib/data/reference-rate-store";
import { calculateBillCoverageBreakdown, BillCoverageBreakdown } from "@/lib/data/patient-financial-support-store";
import { getExternalCasesByPatient } from "@/lib/data/external-dispute-store";
import {
  HealthcareBill,
  BillableItem,
  PaymentRecord,
  FinancialDispute,
  ExternalDisputeCase,
  DisputeCategory,
} from "@/types/database.types";

export default function PatientBillDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const billId = (params?.billId as string) || "";

  const [bill, setBill] = useState<HealthcareBill | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [disputes, setDisputes] = useState<FinancialDispute[]>([]);
  const [externalCases, setExternalCases] = useState<ExternalDisputeCase[]>([]);
  const [coverageBreakdown, setCoverageBreakdown] = useState<BillCoverageBreakdown | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Dispute Modal State
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedItemForDispute, setSelectedItemForDispute] = useState<BillableItem | null>(null);
  const [selectedItemComparison, setSelectedItemComparison] = useState<RateComparisonResult | null>(null);
  const [disputeCategory, setDisputeCategory] = useState<DisputeCategory>("INCORRECT_AMOUNT");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);

  // Rate Comparison Explanation Modal State
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonModalData, setComparisonModalData] = useState<{
    item: BillableItem;
    comparison: RateComparisonResult;
  } | null>(null);

  // External Escalation Modal State
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [selectedDisputeForEscalation, setSelectedDisputeForEscalation] = useState<FinancialDispute | null>(null);
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationSubmitting, setEscalationSubmitting] = useState(false);

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<"UPI" | "CARD" | "NET_BANKING">("UPI");
  const [payProcessing, setPayProcessing] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const reloadData = () => {
    if (!billId) return;
    const b = getBillById(billId);
    setBill(b);

    if (b) {
      setCoverageBreakdown(calculateBillCoverageBreakdown(b.id));
    }

    if (user?.identifier || user?.id) {
      const pId = user.identifier || user.id;
      const allPayments = getPaymentsForPatient(pId);
      const billPayments = allPayments.filter((p) => p.bill_id.toLowerCase() === billId.toLowerCase());
      setPayments(billPayments);

      const patientDisputes = getDisputesByPatient(pId).filter(
        (d) => d.bill_id.toLowerCase() === billId.toLowerCase()
      );
      setDisputes(patientDisputes);

      const patientExtCases = getExternalCasesByPatient(pId).filter(
        (c) => c.bill_id.toLowerCase() === billId.toLowerCase()
      );
      setExternalCases(patientExtCases);
    }
  };

  useEffect(() => {
    reloadData();
  }, [billId, user]);

  const toggleItemProvenance = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleOpenComparisonModal = (item: BillableItem) => {
    const comp = compareChargeWithBenchmark(item.service_name, item.unit_price);
    setComparisonModalData({ item, comparison: comp });
    setShowComparisonModal(true);
  };

  const handleOpenSmartDispute = (item: BillableItem) => {
    const comp = compareChargeWithBenchmark(item.service_name, item.unit_price);
    setSelectedItemForDispute(item);
    setSelectedItemComparison(comp);

    if (comp.is_above_reference) {
      setDisputeCategory("INCORRECT_AMOUNT");
      setDisputeDesc(
        `The hospital charged rate for "${item.service_name}" (₹${item.unit_price.toFixed(2)}) is higher than the reference benchmark rate (₹${comp.benchmark_amount.toFixed(2)} — difference +₹${comp.difference_amount.toFixed(2)}). Requesting clinical and institutional tariff clarification.`
      );
    } else {
      setDisputeCategory("INCORRECT_AMOUNT");
      setDisputeDesc(`I would like clarification regarding the charge for "${item.service_name}" (₹${item.base_amount.toFixed(2)}).`);
    }
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill || !user) return;
    setDisputeSubmitting(true);
    try {
      const pId = user.identifier || user.id || "PAT-1001";
      const pName = user.fullName || "Patient";
      const comp = selectedItemForDispute
        ? compareChargeWithBenchmark(selectedItemForDispute.service_name, selectedItemForDispute.unit_price)
        : null;

      const res = DisputeInvestigationService.submitDispute({
        patientId: pId,
        patientName: pName,
        billId: bill.id,
        billItemId: selectedItemForDispute?.id,
        serviceName: selectedItemForDispute?.service_name,
        chargedAmount: selectedItemForDispute?.base_amount,
        benchmarkAmount: comp?.benchmark_amount,
        differenceAmount: comp?.difference_amount,
        referenceRateId: comp?.reference_rate?.reference_rate_id,
        category: disputeCategory,
        description: disputeDesc,
        actor: user,
      });

      if (res.success && res.dispute) {
        setDisputeSuccess(`Dispute ${res.dispute.dispute_number} submitted for Hospital Level 1 Review.`);
        setShowDisputeModal(false);
        reloadData();
      }
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const handleEscalateExternally = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeForEscalation || !user || !escalationReason.trim()) return;
    setEscalationSubmitting(true);
    try {
      const res = DisputeInvestigationService.escalateToExternalGovernment({
        disputeId: selectedDisputeForEscalation.id,
        escalationReason: escalationReason.trim(),
        actor: user,
      });

      if (res.success && res.externalCase) {
        setDisputeSuccess(
          `Prototype external escalation case ${res.externalCase.external_case_id} generated. All clinical and review records packaged.`
        );
        setShowEscalationModal(false);
        setEscalationReason("");
        reloadData();
      }
    } finally {
      setEscalationSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!bill || !user) return;
    setPayProcessing(true);
    setTimeout(() => {
      setPayProcessing(false);
      setPaySuccess("Payment processed successfully! Receipt generated.");
      setShowPayModal(false);
      reloadData();
    }, 1000);
  };

  // Anti-IDOR Authorization Check
  if (bill && user && user.role === "patient") {
    const currentPatientId = (user.identifier || user.id || "").toLowerCase();
    if (bill.patient_id.toLowerCase() !== currentPatientId) {
      return (
        <RoleGuard allowedRoles={["patient", "admin"]}>
          <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
            <Card className="max-w-md w-full p-6 text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
              <p className="text-xs text-slate-600">You are not authorized to view this billing record.</p>
              <Link href="/patient/billing">
                <Button size="sm" className="rounded-xl">Return to My Bills</Button>
              </Link>
            </Card>
          </div>
        </RoleGuard>
      );
    }
  }

  if (!bill) {
    return (
      <RoleGuard allowedRoles={["patient", "admin"]}>
        <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
          <Card className="max-w-md w-full p-6 text-center space-y-4">
            <Receipt className="h-10 w-10 text-slate-400 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Bill Not Found</h2>
            <p className="text-xs text-slate-500">The requested billing record could not be found or has been archived.</p>
            <Link href="/patient/billing">
              <Button size="sm" className="rounded-xl">Return to My Bills</Button>
            </Link>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  const totalPaid = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  const balanceDue = coverageBreakdown ? coverageBreakdown.outstanding_amount : Math.max(0, bill.patient_responsibility - totalPaid);

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient/billing">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> All Bills
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 font-mono">
                  {bill.bill_number}
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono">V{bill.current_version}</Badge>
                <StatusBadge status={bill.status} />
              </div>
              <p className="text-xs text-slate-500">
                {bill.facility_name} • Issued {new Date(bill.issued_at || bill.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/patient/financial-support">
              <Button variant="outline" size="sm" className="text-xs rounded-xl h-8 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100">
                <Landmark className="h-4 w-4 mr-1 text-indigo-600" /> Apply Insurance / Scheme
              </Button>
            </Link>
            {balanceDue > 0 && (
              <Button
                size="sm"
                onClick={() => setShowPayModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs h-8 shadow-xs"
              >
                <CreditCard className="h-4 w-4 mr-1" /> Pay Due (₹{balanceDue.toFixed(2)})
              </Button>
            )}
          </div>
        </div>

        {disputeSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{disputeSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setDisputeSuccess(null)}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {paySuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{paySuccess}</span>
          </div>
        )}

        {/* COVERAGE EXPLANATION & WATERFALL BREAKDOWN ("How was my payable amount calculated?") */}
        {coverageBreakdown && (
          <Card className="bg-white border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 pb-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <div>
                  <CardTitle className="text-sm font-bold text-white">How was my payable amount calculated?</CardTitle>
                  <p className="text-[11px] text-indigo-200">Unified financial ledger transparent coverage waterfall</p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white text-[10px] font-mono">Ledger Verified</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Service Charges</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">₹{coverageBreakdown.gross_service_charges.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Insurance Coverage</span>
                  <span className="text-sm font-extrabold text-emerald-800 font-mono">-₹{coverageBreakdown.insurance_coverage.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                  <span className="text-teal-700 block text-[10px] uppercase font-bold">Govt Scheme (PM-JAY)</span>
                  <span className="text-sm font-extrabold text-teal-800 font-mono">-₹{coverageBreakdown.government_scheme_coverage.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <span className="text-indigo-700 block text-[10px] uppercase font-bold">Hospital Relief Aid</span>
                  <span className="text-sm font-extrabold text-indigo-800 font-mono">-₹{coverageBreakdown.financial_assistance.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900 text-white rounded-xl text-xs gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Net Patient Responsibility</span>
                  <span className="text-base font-black text-white font-mono">₹{coverageBreakdown.net_patient_responsibility.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold text-right">Already Paid</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">₹{coverageBreakdown.amount_paid.toFixed(2)}</span>
                  </div>
                  <div className="border-l border-slate-700 pl-4">
                    <span className="text-amber-400 block text-[10px] uppercase font-bold text-right">Outstanding Balance</span>
                    <span className="text-base font-black text-amber-300 font-mono">₹{coverageBreakdown.outstanding_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ACTIVE DISPUTES & MULTI-STAGE ESCALATION STATUS */}
        {disputes.length > 0 && (
          <Card className="bg-white border-amber-200 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 pb-2 bg-amber-50/50 border-b border-amber-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-600" />
                Active Billing Inquiry & Multi-Stage Escalation ({disputes.length})
              </CardTitle>
              <Badge className="bg-amber-100 text-amber-900 text-[10px] font-bold">In Progress</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {disputes.map((disp) => {
                const isEligibleForExternal = disp.status === "ELIGIBLE_FOR_EXTERNAL_ESCALATION" || disp.current_stage === "HOSPITAL_L3";
                const isExternallyEscalated = disp.status === "EXTERNAL_CASE_CREATED" || disp.current_stage === "EXTERNAL_PROTOTYPE";

                return (
                  <div key={disp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono font-bold">{disp.dispute_number}</Badge>
                          <StatusBadge status={disp.status} />
                          {disp.service_name && <span className="font-bold text-slate-800">{disp.service_name}</span>}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{disp.description}</p>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(disp.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Multi-Stage Step Progress Visualizer */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Resolution Journey</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-1.5 text-emerald-800 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>1. Dispute Filed</span>
                        </div>
                        <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${disp.l1_response ? "bg-white border-slate-200 text-emerald-800 font-bold" : "bg-slate-100 text-slate-400"}`}>
                          {disp.l1_response ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                          <span>2. Hospital L1</span>
                        </div>
                        <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${disp.l2_response || disp.l3_response ? "bg-white border-slate-200 text-emerald-800 font-bold" : "bg-slate-100 text-slate-400"}`}>
                          {disp.l2_response || disp.l3_response ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                          <span>3. Hospital L2/L3</span>
                        </div>
                        <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${isExternallyEscalated ? "bg-purple-50 border-purple-200 text-purple-900 font-bold" : "bg-slate-100 text-slate-400"}`}>
                          {isExternallyEscalated ? <ExternalLink className="h-3.5 w-3.5 text-purple-600 shrink-0" /> : <Scale className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                          <span>4. External Review</span>
                        </div>
                      </div>
                    </div>

                    {/* Hospital L1 / L2 / L3 Review Responses */}
                    {disp.l1_response && (
                      <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-950 text-[11px] space-y-0.5">
                        <span className="font-bold block">Hospital Level 1 Response ({disp.l1_response.responder_name}):</span>
                        <p>{disp.l1_response.explanation}</p>
                      </div>
                    )}
                    {disp.l2_response && (
                      <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-950 text-[11px] space-y-0.5">
                        <span className="font-bold block">Internal Escalation (Level 2) Review ({disp.l2_response.reviewer_name}):</span>
                        <p>{disp.l2_response.explanation}</p>
                      </div>
                    )}
                    {disp.l3_response && (
                      <div className="p-2.5 bg-rose-50/60 border border-rose-200 rounded-xl text-rose-950 text-[11px] space-y-0.5">
                        <span className="font-bold block">Final Hospital Decision (Level 3): Outcome = {disp.l3_response.outcome}</span>
                        <p>{disp.l3_response.explanation}</p>
                      </div>
                    )}

                    {/* External Escalation Action Button */}
                    {isEligibleForExternal && !isExternallyEscalated && (
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[11px] text-amber-800 font-medium">
                          Issue remains unresolved after hospital final review. You may escalate externally.
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setSelectedDisputeForEscalation(disp);
                            setShowEscalationModal(true);
                          }}
                          className="text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white gap-1.5 shadow-xs"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Escalate Externally (Prototype)
                        </Button>
                      </div>
                    )}

                    {isExternallyEscalated && (
                      <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 text-[11px]">
                        <span className="font-bold block">🏛️ Prototype External Case #{disp.external_case_id}:</span>
                        <span>Dossier packaged with clinical orders, reference tariffs, and review notes. Case status: Under Prototype Review.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Itemized Charges Section with Benchmark Rate Comparison & "Question Charge" */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Itemized Healthcare Charges ({bill.items.length})</span>
              <span className="text-[10px] font-normal text-slate-400 normal-case">
                Compare with reference rate or request clarification
              </span>
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {bill.items.map((item) => {
              const isExpanded = Boolean(expandedItems[item.id]);
              const comparison = compareChargeWithBenchmark(item.service_name, item.unit_price);

              return (
                <div key={item.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-2">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                    onClick={() => toggleItemProvenance(item.id)}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">{item.service_name}</span>
                        <Badge variant="outline" className="text-[9px] font-mono">{item.category}</Badge>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">
                          {item.verification_status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Qty: {item.quantity} • Unit Price: ₹{item.unit_price.toFixed(2)} • Date: {new Date(item.service_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 text-xs block">
                          ₹{item.base_amount.toFixed(2)}
                        </span>
                        {comparison.has_reference && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Ref: ₹{comparison.benchmark_amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 rounded-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemProvenance(item.id);
                        }}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* RATE COMPARISON ROW */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center gap-2">
                      <Scale className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      {comparison.has_reference ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-600">
                            Reference Benchmark: <strong>₹{comparison.benchmark_amount.toFixed(2)}</strong>
                          </span>
                          <Badge
                            className={`text-[9px] font-bold ${
                              comparison.status === "SIGNIFICANTLY_ABOVE_REFERENCE"
                                ? "bg-rose-100 text-rose-900"
                                : comparison.status === "ABOVE_REFERENCE"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-100 text-emerald-900"
                            }`}
                          >
                            {comparison.status_label}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No reference benchmark cataloged</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {comparison.has_reference && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenComparisonModal(item);
                          }}
                          className="h-6 text-[10px] font-bold rounded-lg border-slate-300 hover:bg-slate-100"
                        >
                          View Comparison
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSmartDispute(item);
                        }}
                        className="h-6 text-[10px] font-bold rounded-lg text-indigo-700 hover:bg-indigo-50"
                      >
                        Question Charge
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Clinical Provenance */}
                  {isExpanded && item.provenance && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-emerald-600" /> Clinical Order Provenance
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block">Ordered By:</span>
                          <span className="font-medium text-slate-800">{item.provenance.ordered_by_name || "Clinician"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Facility:</span>
                          <span className="font-medium text-slate-800">{item.provenance.facility_name || bill.facility_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Clinical Reason:</span>
                          <span className="font-medium text-slate-800">{item.provenance.clinical_reason || "Medical necessity"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Performed At:</span>
                          <span className="font-medium text-slate-800">{item.provenance.performed_at ? new Date(item.provenance.performed_at).toLocaleString() : "Documented in visit"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Payments History */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" /> Payments Applied to this Bill ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {payments.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs">
                No payments have been recorded for this bill yet.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{p.receipt_number}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{p.payment_method}</Badge>
                        <StatusBadge status={p.status} />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Txn: {p.transaction_reference} • {new Date(p.initiated_at).toLocaleString()}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">₹{p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MODAL 1: VIEW BENCHMARK COMPARISON EXPLANATION */}
        {showComparisonModal && comparisonModalData && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Rate Benchmark Comparison</h3>
                    <p className="text-[11px] text-slate-500">{comparisonModalData.item.service_name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComparisonModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Hospital Charged</span>
                    <span className="text-base font-black text-slate-900 font-mono">₹{comparisonModalData.item.unit_price.toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <span className="text-indigo-700 block text-[10px] uppercase font-bold">Reference Rate</span>
                    <span className="text-base font-black text-indigo-900 font-mono">₹{comparisonModalData.comparison.benchmark_amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Difference:</span>
                    <strong className={comparisonModalData.comparison.difference_amount > 0 ? "text-rose-700" : "text-emerald-700"}>
                      {comparisonModalData.comparison.difference_amount > 0 ? "+" : ""}₹{comparisonModalData.comparison.difference_amount.toFixed(2)} ({comparisonModalData.comparison.percentage_difference > 0 ? "+" : ""}{comparisonModalData.comparison.percentage_difference}%)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tariff Source:</span>
                    <span className="font-mono text-slate-700">{comparisonModalData.comparison.source_badge}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-[11px] leading-relaxed">
                  <p>{comparisonModalData.comparison.disclaimer}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComparisonModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setShowComparisonModal(false);
                      handleOpenSmartDispute(comparisonModalData.item);
                    }}
                    className="text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Question this Charge
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: SMART DISPUTE ENTRY */}
        {showDisputeModal && selectedItemForDispute && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-indigo-700">
                <HelpCircle className="h-5 w-5 text-indigo-600" /> Raise Billing Inquiry / Question Charge
              </h3>
              
              <form onSubmit={handleSubmitDispute} className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Disputed Service Item:</span>
                  <span className="font-bold text-slate-900">{selectedItemForDispute.service_name}</span>
                  <div className="flex items-center gap-3 pt-1 text-[11px]">
                    <span>Hospital: <strong>₹{selectedItemForDispute.base_amount.toFixed(2)}</strong></span>
                    {selectedItemComparison?.has_reference && (
                      <span>Ref: <strong>₹{selectedItemComparison.benchmark_amount.toFixed(2)}</strong></span>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-slate-700">Reason for Inquiry *</Label>
                  <select
                    value={disputeCategory}
                    onChange={(e) => setDisputeCategory(e.target.value as DisputeCategory)}
                    className="w-full h-9 mt-1 rounded-xl border border-input bg-white px-2 text-xs font-medium"
                  >
                    <option value="INCORRECT_AMOUNT">Rate higher than reference benchmark</option>
                    <option value="DUPLICATE_CHARGE">Duplicate line item</option>
                    <option value="SERVICE_NOT_RECEIVED">Service / Test not received</option>
                    <option value="INSURANCE_COVERAGE_DISPUTE">Insurance / Government coverage discrepancy</option>
                    <option value="OTHER">Other question / clarification</option>
                  </select>
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-slate-700">Detailed Question / Explanation *</Label>
                  <Textarea
                    rows={3}
                    value={disputeDesc}
                    onChange={(e) => setDisputeDesc(e.target.value)}
                    placeholder="Provide specific details regarding your inquiry..."
                    className="text-xs mt-1 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDisputeModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={disputeSubmitting || !disputeDesc.trim()}
                    size="sm"
                    className="text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {disputeSubmitting ? "Submitting..." : "Submit to Hospital Review"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: EXTERNAL / GOVERNMENT ESCALATION (PROTOTYPE) */}
        {showEscalationModal && selectedDisputeForEscalation && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-purple-200">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-800">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Prototype External Escalation</h3>
                  <p className="text-[11px] text-slate-500">Grievance escalation dossier generation</p>
                </div>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-purple-950 text-[11px] leading-relaxed">
                <strong>Prototype Notice:</strong> This compiles your complete dispute history, hospital responses, reference benchmarks, and diagnostic evidence into an authoritative case package. In production, this can submit directly to consumer health grievance portals.
              </div>

              <form onSubmit={handleEscalateExternally} className="space-y-3 text-xs">
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">Reason for External Grievance Escalation *</Label>
                  <Textarea
                    rows={3}
                    placeholder="e.g. Hospital Level 3 review did not resolve the unexplained tariff discrepancy over the reference benchmark..."
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    className="text-xs mt-1 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEscalationModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!escalationReason.trim() || escalationSubmitting}
                    size="sm"
                    className="text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white"
                  >
                    {escalationSubmitting ? "Packaging..." : "Confirm & Create Case"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: PAY DUE */}
        {showPayModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-emerald-700">
                <CreditCard className="h-5 w-5 text-emerald-600" /> Settle Outstanding Balance
              </h3>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs">
                <span className="text-slate-500 block">Total Due for {bill.bill_number}:</span>
                <span className="text-lg font-extrabold text-emerald-900 font-mono">₹{balanceDue.toFixed(2)}</span>
              </div>

              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-700 block">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod("UPI")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs ${payMethod === "UPI" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600"}`}
                  >
                    UPI (GPay/PhonePe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("CARD")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs ${payMethod === "CARD" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600"}`}
                  >
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("NET_BANKING")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs ${payMethod === "NET_BANKING" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600"}`}
                  >
                    Net Banking
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowPayModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSimulatePayment}
                  disabled={payProcessing}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
                >
                  {payProcessing ? "Processing..." : `Pay ₹${balanceDue.toFixed(2)}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
