"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Plus,
  Landmark,
  HandHeart,
  Clock,
  ChevronRight,
  Sparkles,
  Info,
  CreditCard,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { useLocalization } from "@/lib/localization";
import {
  getPatientPolicies,
  getPatientClaims,
  getAllSchemes,
  getPatientSchemeApplications,
  getPatientAssistanceGrants,
  submitInsuranceClaim,
  applyForGovernmentScheme,
  InsurancePolicy,
  InsuranceClaim,
  GovernmentHealthScheme,
  SchemeApplication,
  FinancialAssistanceGrant,
} from "@/lib/data/patient-financial-support-store";
import { getPatientBills } from "@/lib/data/billing-store";
import { HealthcareBill } from "@/types/database.types";

export default function PatientFinancialSupportPage() {
  const { user } = useAuth();
  const { t, formatCurrency } = useLocalization();
  const patientId = user?.identifier || user?.id || "PAT-1001";

  const [activeTab, setActiveTab] = useState<"insurance" | "schemes" | "assistance">("insurance");
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [schemes, setSchemes] = useState<GovernmentHealthScheme[]>([]);
  const [applications, setApplications] = useState<SchemeApplication[]>([]);
  const [grants, setGrants] = useState<FinancialAssistanceGrant[]>([]);
  const [patientBills, setPatientBills] = useState<HealthcareBill[]>([]);

  // Claim Modal State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [selectedBillId, setSelectedBillId] = useState("");
  const [claimAmount, setClaimAmount] = useState<number>(5000);
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  // Scheme Application Modal State
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<GovernmentHealthScheme | null>(null);
  const [schemeCardNo, setSchemeCardNo] = useState("");
  const [schemeSubmitting, setSchemeSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = () => {
    setPolicies(getPatientPolicies(patientId));
    setClaims(getPatientClaims(patientId));
    setSchemes(getAllSchemes());
    setApplications(getPatientSchemeApplications(patientId));
    setGrants(getPatientAssistanceGrants(patientId));
    const bills = getPatientBills(patientId);
    setPatientBills(bills);
    if (bills.length > 0 && !selectedBillId) {
      setSelectedBillId(bills[0].id);
      setClaimAmount(bills[0].patient_responsibility);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicyId || !selectedBillId || !user) return;
    setClaimSubmitting(true);
    setFeedback(null);

    const bill = patientBills.find((b) => b.id === selectedBillId);
    const res = submitInsuranceClaim({
      policyId: selectedPolicyId,
      billId: selectedBillId,
      patientId,
      patientName: user.fullName || "Rahul Verma",
      hospitalId: bill?.facility_id || "FAC-1001",
      hospitalName: "City Hospital",
      claimedAmount: Number(claimAmount),
      actor: user,
    });

    setClaimSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: `Claim ${res.claim?.claim_number} successfully submitted for processing.` });
      setShowClaimModal(false);
      loadData();
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to submit claim." });
    }
  };

  const handleSchemeApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheme || !schemeCardNo.trim() || !user) return;
    setSchemeSubmitting(true);
    setFeedback(null);

    const res = applyForGovernmentScheme({
      schemeId: selectedScheme.id,
      patientId,
      patientName: user.fullName || "Rahul Verma",
      hospitalId: "FAC-1001",
      cardNumber: schemeCardNo.trim(),
      actor: user,
    });

    setSchemeSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: `Application for ${selectedScheme.name} submitted successfully!` });
      setShowSchemeModal(false);
      setSchemeCardNo("");
      loadData();
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to submit scheme application." });
    }
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/patient" className="text-xs font-semibold text-slate-500 hover:text-slate-900">
                  {t("nav.home")}
                </Link>
                <span className="text-slate-400">/</span>
                <span className="text-xs font-semibold text-indigo-700">{t("billing.manage_coverage")}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <ShieldCheck className="h-7 w-7 text-indigo-600" />
                {t("billing.insurance_coverage")} &amp; {t("billing.scheme_coverage")}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {t("billing.why_charged")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/patient/billing">
                <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl border-slate-300">
                  <FileText className="h-4 w-4 mr-1.5 text-slate-600" /> {t("billing.title")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Prototype Transparency Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">{t("billing.reference_benchmark")}:</span> PM-JAY, BSKY &amp; {t("billing.insurance_coverage")}.
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                  : "bg-rose-50 text-rose-900 border border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-xs font-bold underline ml-4 hover:opacity-80"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("insurance")}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === "insurance"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {t("nav.insurance")} ({policies.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("schemes")}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === "schemes"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Landmark className="h-4 w-4" />
              {t("billing.scheme_coverage")} ({schemes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("assistance")}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === "assistance"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <HandHeart className="h-4 w-4" />
              {t("billing.how_calculated")} ({grants.length})
            </button>
          </div>

          {/* TAB 1: HEALTH INSURANCE */}
          {activeTab === "insurance" && (
            <div className="space-y-6">
              
              {/* Policies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policies.map((p) => (
                  <Card key={p.id} className="bg-white rounded-3xl shadow-xs border-slate-200 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-5">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-[10px] font-mono">
                          {p.policy_number}
                        </Badge>
                        <Badge className="bg-emerald-400 text-emerald-950 text-[10px] font-bold">
                          {p.is_active ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold mt-2 text-white">{p.plan_name}</CardTitle>
                      <CardDescription className="text-xs text-indigo-200">{p.insurer_name} • {p.tpa_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Sum Insured</span>
                          <span className="text-base font-black text-slate-900">₹{p.sum_insured.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Available Balance</span>
                          <span className="text-base font-black text-emerald-700">₹{p.balance_sum_insured.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <span>Co-Pay: <strong>{p.co_pay_percentage}%</strong></span>
                        <span>Valid Until: <strong>{new Date(p.valid_to).toLocaleDateString()}</strong></span>
                      </div>

                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedPolicyId(p.id);
                          setShowClaimModal(true);
                        }}
                        className="w-full text-xs font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Submit Claim Against Bill
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Claims History */}
              <Card className="bg-white rounded-3xl shadow-xs border-slate-200">
                <CardHeader className="p-5 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900">Insurance Claims History ({claims.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {claims.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono font-bold text-[10px]">{c.claim_number}</Badge>
                          <StatusBadge status={c.status} />
                          <span className="text-[10px] text-slate-400">Bill: {c.bill_id}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium mt-1">{c.remarks || "Standard hospitalization claim"}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Claimed</span>
                          <span className="font-bold text-slate-900">₹{c.claimed_amount.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-600 block uppercase font-bold">Approved</span>
                          <span className="font-black text-emerald-700">₹{c.approved_amount.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {claims.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No insurance claims on file.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: GOVERNMENT HEALTH SCHEMES */}
          {activeTab === "schemes" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {schemes.map((s) => (
                  <Card key={s.id} className="bg-white rounded-3xl shadow-xs border-slate-200 flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200 text-[10px] font-bold">
                          {s.sponsor === "CENTRAL_GOVERNMENT" ? "National" : "State"} Scheme
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-700 text-[9px] font-mono">Demo</Badge>
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-900">{s.name}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">{s.full_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-4">
                      <p className="text-xs text-slate-600 leading-relaxed">{s.benefits_summary}</p>
                      <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Annual Family Cover</span>
                        <span className="text-base font-black text-slate-900">₹{s.annual_benefit_limit.toLocaleString("en-IN")}</span>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedScheme(s);
                          setShowSchemeModal(true);
                        }}
                        className="w-full text-xs font-bold rounded-2xl bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        Apply / Link Card
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Active Applications */}
              <Card className="bg-white rounded-3xl shadow-xs border-slate-200">
                <CardHeader className="p-5 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900">Scheme Allocations ({applications.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-teal-100 text-teal-900 text-[10px] font-bold">{app.scheme_code}</Badge>
                          <StatusBadge status={app.status} />
                          <span className="font-mono text-slate-500 text-[10px]">Card: {app.card_or_ration_number}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">Verified: {app.verified_by || "Arogya Mitra Desk"}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-teal-600 block uppercase font-bold">Authorized Pool</span>
                        <span className="text-base font-black text-teal-900">₹{app.authorized_amount.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: CHARITY & FINANCIAL ASSISTANCE */}
          {activeTab === "assistance" && (
            <div className="space-y-4">
              <Card className="bg-white rounded-3xl shadow-xs border-slate-200">
                <CardHeader className="p-5 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900">Hospital Compassion Grants & Welfare Funds</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Direct hospital-sponsored relief grants applied to your medical bills.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {grants.map((g) => (
                    <div key={g.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{g.trust_name}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Applied against bill {g.bill_id} • Status: {g.status}</p>
                      </div>
                      <span className="text-base font-black text-indigo-700">₹{g.amount_granted.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SUBMIT INSURANCE CLAIM MODAL */}
          {showClaimModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
              <div className="max-w-md w-full p-6 space-y-4 bg-white rounded-3xl shadow-2xl border border-slate-200">
                <h2 className="text-base font-extrabold text-slate-900">Submit Insurance Claim</h2>
                <form onSubmit={handleClaimSubmit} className="space-y-3 text-xs">
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Select Bill *</Label>
                    <select
                      value={selectedBillId}
                      onChange={(e) => {
                        setSelectedBillId(e.target.value);
                        const b = patientBills.find((bill) => bill.id === e.target.value);
                        if (b) setClaimAmount(b.patient_responsibility);
                      }}
                      className="w-full h-9 mt-1 rounded-xl border border-input px-2 text-xs"
                    >
                      {patientBills.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bill_number} (₹{b.patient_responsibility.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Claim Amount (₹) *</Label>
                    <Input
                      type="number"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(Number(e.target.value))}
                      className="text-xs h-9 mt-1 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowClaimModal(false)}
                      className="text-xs rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={claimSubmitting}
                      size="sm"
                      className="text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {claimSubmitting ? "Submitting..." : "Submit Claim"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SCHEME APPLICATION MODAL */}
          {showSchemeModal && selectedScheme && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
              <div className="max-w-md w-full p-6 space-y-4 bg-white rounded-3xl shadow-2xl border border-slate-200">
                <h2 className="text-base font-extrabold text-slate-900">Apply for {selectedScheme.name}</h2>
                <form onSubmit={handleSchemeApply} className="space-y-3 text-xs">
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700">Ration Card / PM-JAY Card Number *</Label>
                    <Input
                      placeholder="e.g. PMJAY-9928-1029-4401"
                      value={schemeCardNo}
                      onChange={(e) => setSchemeCardNo(e.target.value)}
                      className="text-xs h-9 mt-1 rounded-xl font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSchemeModal(false)}
                      className="text-xs rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!schemeCardNo.trim() || schemeSubmitting}
                      size="sm"
                      className="text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      {schemeSubmitting ? "Submitting..." : "Confirm & Check Eligibility"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </RoleGuard>
  );
}
