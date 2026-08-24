"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  BedDouble, 
  Clock, 
  User, 
  Stethoscope, 
  ArrowRight, 
  Search, 
  RefreshCw,
  FileText,
  Receipt,
  Layers,
  AlertCircle,
  Pill,
  Activity,
  Check,
  X,
  ShieldCheck,
  LogOut
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getFacilityById } from "@/lib/data/facility-store";
import { getFacilityAdmissions, completeDischarge, HospitalAdmission } from "@/lib/data/admission-store";
import { getFacilityBills } from "@/lib/data/billing-store";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";

interface DischargeChecklistState {
  clinicalSummary: boolean;
  pharmacyCleared: boolean;
  diagnosticsCleared: boolean;
  billingSettled: boolean;
  bedSanitized: boolean;
}

export default function HospitalDischargePage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode) || getFacilityById("FAC-1001");
  const targetFacId = facility?.facility_code || "FAC-1001";

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"PENDING" | "DISCHARGED" | "ALL">("PENDING");

  // Selected case for discharge checklist modal
  const [selectedAdm, setSelectedAdm] = useState<HospitalAdmission | null>(null);
  const [checklist, setChecklist] = useState<DischargeChecklistState>({
    clinicalSummary: true,
    pharmacyCleared: true,
    diagnosticsCleared: true,
    billingSettled: true,
    bedSanitized: true,
  });
  const [summaryNote, setSummaryNote] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const facilityAdmissions = useMemo(() => getFacilityAdmissions(targetFacId), [targetFacId, isRefreshing]);
  const facilityBills = useMemo(() => getFacilityBills(targetFacId), [targetFacId, isRefreshing]);

  const dischargePending = facilityAdmissions.filter((a) => a.status === "DISCHARGE_PENDING");
  const completedDischarges = facilityAdmissions.filter((a) => a.status === "DISCHARGED");

  const filteredList = useMemo(() => {
    let list = facilityAdmissions;
    if (filterTab === "PENDING") list = dischargePending;
    else if (filterTab === "DISCHARGED") list = completedDischarges;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.patient_name.toLowerCase().includes(q) ||
          a.patient_id.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (a.ward_name && a.ward_name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [facilityAdmissions, filterTab, dischargePending, completedDischarges, searchQuery]);

  const handleOpenClearance = (adm: HospitalAdmission) => {
    setSelectedAdm(adm);
    const patBills = facilityBills.filter((b) => b.patient_id === adm.patient_id);
    let totalDue = 0;
    patBills.forEach((b) => {
      const bal = PaymentProcessingService.calculateOutstandingBalance(b.id);
      totalDue += bal.outstandingBalance;
    });

    setChecklist({
      clinicalSummary: true,
      pharmacyCleared: true,
      diagnosticsCleared: true,
      billingSettled: totalDue === 0,
      bedSanitized: true,
    });
    setSummaryNote(
      `Discharge completed. Inpatient episode for ${adm.patient_name} finalized under ${adm.doctor_name}. Medically stable.`
    );
  };

  const handleExecuteDischarge = () => {
    if (!selectedAdm || !user) return;

    if (!checklist.clinicalSummary || !checklist.pharmacyCleared || !checklist.diagnosticsCleared || !checklist.billingSettled || !checklist.bedSanitized) {
      setFeedbackMsg({
        type: "error",
        text: "All 5 departmental clearance milestones must be confirmed before final discharge.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = completeDischarge({
        admissionId: selectedAdm.id,
        dischargeSummary: summaryNote.trim() || "Inpatient stay concluded with clinical stability.",
        actorId: user.identifier || user.id,
        actorName: user.fullName,
        actorRole: user.role,
      });

      if (res.success && res.admission) {
        setFeedbackMsg({
          type: "success",
          text: `Patient ${res.admission.patient_name} safely discharged. Bed ${res.admission.bed_number} released and marked available.`,
        });
        setSelectedAdm(null);
        setIsRefreshing((prev) => !prev);
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to complete discharge." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "doctor", "receptionist"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200 font-sans max-w-7xl mx-auto pb-24 p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-teal-600" /> Inpatient Discharge & Bed Clearance Desk
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-teal-50 text-teal-800 border-teal-200">
                {targetFacId}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold">
                <ShieldCheck className="h-3 w-3 inline mr-1 text-emerald-600" /> Multi-Department Clearance (Step 4)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Physician discharge summary, pharmacy dispensing clearance, billing settlement & physical bed release • {facility?.name || "City Hospital"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRefreshing((prev) => !prev)} className="text-xs rounded-xl gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} /> Refresh
            </Button>
            <Link href="/hospital/admissions">
              <Button variant="outline" size="sm" className="text-xs rounded-xl">
                ← Inpatient Admissions
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

        {/* Filter Tabs & Search */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setFilterTab("PENDING")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                    filterTab === "PENDING"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>Discharge Pending</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      filterTab === "PENDING" ? "bg-slate-700 text-white" : "bg-white text-slate-700 font-bold"
                    }`}
                  >
                    {dischargePending.length}
                  </span>
                </button>

                <button
                  onClick={() => setFilterTab("DISCHARGED")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                    filterTab === "DISCHARGED"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>Discharged History</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      filterTab === "DISCHARGED" ? "bg-slate-700 text-white" : "bg-white text-slate-700 font-bold"
                    }`}
                  >
                    {completedDischarges.length}
                  </span>
                </button>

                <button
                  onClick={() => setFilterTab("ALL")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    filterTab === "ALL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Inpatient Records ({facilityAdmissions.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient, admission ID..."
                  className="text-xs pl-8 h-8 bg-slate-50 border-slate-200 rounded-xl"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredList.map((adm) => {
                  const patBills = facilityBills.filter((b) => b.patient_id === adm.patient_id);
                  let totalDue = 0;
                  patBills.forEach((b) => {
                    const bal = PaymentProcessingService.calculateOutstandingBalance(b.id);
                    totalDue += bal.outstandingBalance;
                  });

                  return (
                    <div
                      key={adm.id}
                      className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px] font-bold bg-slate-100">
                            {adm.id}
                          </Badge>
                          <span className="font-bold text-slate-900 text-sm">{adm.patient_name}</span>
                          <span className="font-mono text-[11px] text-teal-700">({adm.patient_id})</span>
                          <Badge
                            variant={
                              adm.status === "DISCHARGE_PENDING"
                                ? "warning"
                                : adm.status === "DISCHARGED"
                                ? "default"
                                : "teal"
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            ● {adm.status}
                          </Badge>
                        </div>

                        <p className="text-slate-600 text-[11px]">
                          Physician: <strong>{adm.doctor_name}</strong> • Ward:{" "}
                          <strong>{adm.ward_name || "General Ward"}</strong> ({adm.room_number || "Room 301"} -{" "}
                          {adm.bed_number || "Bed A"})
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                          <span>Admitted: {new Date(adm.admitted_at || adm.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className={totalDue > 0 ? "text-amber-800 font-bold" : "text-emerald-800 font-bold"}>
                            Financial Due: ₹{totalDue.toFixed(2)}
                          </span>
                          {adm.discharged_at && (
                            <>
                              <span>•</span>
                              <span>Discharged: {new Date(adm.discharged_at).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {adm.status === "DISCHARGE_PENDING" ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenClearance(adm)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl h-8 shadow-xs gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Department Clearance →
                          </Button>
                        ) : (
                          <Link href="/hospital/admissions">
                            <Button size="sm" variant="outline" className="text-xs rounded-xl font-bold h-8">
                              View Stay Details <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">
                  {filterTab === "PENDING"
                    ? "No patients pending discharge clearance."
                    : "No matching discharge records found."}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Patients marked for discharge by clinical doctors will appear here for administrative and multi-departmental clearance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Multi-Department Clearance & Bed Release */}
        {selectedAdm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Multi-Department Discharge Clearance</h3>
                </div>
                <button onClick={() => setSelectedAdm(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{selectedAdm.patient_name}</span>
                  <Badge variant="outline" className="font-mono text-[10px] font-bold">
                    {selectedAdm.id}
                  </Badge>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Ward: <strong>{selectedAdm.ward_name}</strong> ({selectedAdm.room_number} - {selectedAdm.bed_number}) • Physician: <strong>{selectedAdm.doctor_name}</strong>
                </div>
              </div>

              {/* 5-Point Discharge Readiness Checklist */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Discharge Verification Milestones
                </span>

                {[
                  {
                    key: "clinicalSummary" as const,
                    label: "1. Physician Clinical Discharge Summary Signed",
                    desc: "Medical stabilization confirmed and discharge advice documented",
                    icon: Stethoscope,
                  },
                  {
                    key: "pharmacyCleared" as const,
                    label: "2. Pharmacy Dispensing & Take-Home Medications Cleared",
                    desc: "Prescriptions dispensed and medication counseling completed",
                    icon: Pill,
                  },
                  {
                    key: "diagnosticsCleared" as const,
                    label: "3. Lab & Diagnostic Investigation Results Reviewed",
                    desc: "All inpatient diagnostic panels signed off",
                    icon: Activity,
                  },
                  {
                    key: "billingSettled" as const,
                    label: "4. Central Billing & Patient Obligation Settled",
                    desc: "All interim charges reconciled and settled with 0 balance due",
                    icon: Receipt,
                  },
                  {
                    key: "bedSanitized" as const,
                    label: "5. Physical Bed & Ward Clearance Confirmed",
                    desc: "Physical clearance and sanitization scheduled for incoming patient",
                    icon: BedDouble,
                  },
                ].map((item) => {
                  const isChecked = checklist[item.key];
                  const Icon = item.icon;
                  return (
                    <label
                      key={item.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked ? "bg-emerald-50/50 border-emerald-300" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">Discharge Advice / Final Summary *</label>
                <textarea
                  rows={2}
                  value={summaryNote}
                  onChange={(e) => setSummaryNote(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAdm(null)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecuteDischarge}
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  {isSubmitting ? "Finalizing..." : "Complete Discharge & Release Bed"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
