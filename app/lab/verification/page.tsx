"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FlaskConical,
  ArrowLeft,
  Search,
  Check,
  RotateCcw,
  User,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllTestWorkItems, getTestWorkItemById } from "@/lib/data/lab-testing-store";
import { getOrderTestResults, HealthcareTestResult } from "@/lib/data/lab-order-store";
import { LabTestingService } from "@/lib/services/lab-testing-service";
import { LabReportService } from "@/lib/services/lab-report-service";
import { LabTestWorkItem } from "@/types/database.types";

export default function LabVerificationPage() {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<LabTestWorkItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LabTestWorkItem | null>(null);
  const [selectedResult, setSelectedResult] = useState<HealthcareTestResult | null>(null);

  const [returnReason, setReturnReason] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = () => {
    const all = getAllTestWorkItems();
    const reviewQueue = all.filter((w) => w.status === "RESULT_ENTERED" || w.status === "UNDER_REVIEW");
    setPendingItems(reviewQueue);
    if (selectedItem) {
      const updated = all.find((w) => w.id === selectedItem.id);
      setSelectedItem(updated || null);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSelectItem = (item: LabTestWorkItem) => {
    setSelectedItem(item);
    const results = getOrderTestResults(item.lab_order_id);
    const res = results.find((r) => r.test_id.toLowerCase() === item.test_id.toLowerCase());
    setSelectedResult(res || null);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleVerify = async () => {
    if (!selectedItem) return;
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await LabTestingService.verifyResult(selectedItem.id, user);
      if (res.success && res.result) {
        setActionSuccess(`Verified result for test ${selectedItem.test_name}.`);

        // Check if report can be finalized
        const reportRes = await LabReportService.generateAndFinalizeReport(selectedItem.lab_order_id, undefined, user);
        if (reportRes.success && reportRes.report) {
          setActionSuccess(`Verified result. Finalized diagnostic report ${reportRes.report.id} V${reportRes.report.version}.`);
        }

        refresh();
      } else {
        setActionError(res.error || "Failed to verify result.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedItem || !returnReason.trim()) return;
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await LabTestingService.returnForCorrection(selectedItem.id, returnReason, user);
      if (res.success) {
        setActionSuccess(`Returned test ${selectedItem.test_name} for correction.`);
        setShowReturnModal(false);
        setReturnReason("");
        refresh();
      } else {
        setActionError(res.error || "Failed to return result.");
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
            <Link href="/lab">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Lab Workspace
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" /> Pathologist / Verifier Review Desk
              </h1>
              <p className="text-xs text-slate-500">Authorized verification queue for submitted laboratory results</p>
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {actionError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0 text-red-600" />
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {actionSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Queue List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Awaiting Verification ({pendingItems.length})</h3>
            {pendingItems.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                No laboratory results currently awaiting verification.
              </div>
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-colors ${
                    selectedItem?.id === item.id ? "bg-purple-50 border-purple-300" : "bg-white border-slate-200 hover:border-purple-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-purple-950">{item.id}</span>
                    <Badge variant="outline" className="text-[9px]">{item.test_name}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Patient: {item.patient_name}</p>
                </div>
              ))
            )}
          </div>

          {/* Verification Workspace */}
          <div className="md:col-span-2 space-y-6">
            {selectedItem && selectedResult ? (
              <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
                <CardHeader className="p-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900 font-mono">Reviewing {selectedItem.id}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleVerify}
                      disabled={isSubmitting}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                    >
                      <Check className="h-4 w-4 mr-1" /> Verify Result
                    </Button>
                    <Button
                      onClick={() => setShowReturnModal(true)}
                      disabled={isSubmitting}
                      size="sm"
                      variant="outline"
                      className="text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold rounded-xl text-xs"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" /> Return for Correction
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 font-medium">Test Name:</span>{" "}
                      <span className="font-bold text-slate-900">{selectedResult.test_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Entered Value:</span>{" "}
                      <span className="font-bold text-purple-950">{selectedResult.value} {selectedResult.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Reference Range:</span>{" "}
                      <span className="font-semibold text-slate-800">{selectedResult.reference_range}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Abnormal Flag:</span>{" "}
                      <span className="font-bold text-purple-900">{selectedResult.flag}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Technician:</span>{" "}
                      <span className="font-semibold text-slate-800">{selectedResult.entered_by_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Version:</span>{" "}
                      <span className="font-mono text-slate-700">V{selectedResult.version}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Select a test item from the verification queue to review.
              </div>
            )}
          </div>
        </div>

        {/* Modal: Return for Correction */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-amber-700">
                <RotateCcw className="h-5 w-5 text-amber-600" /> Return for Correction
              </h3>
              <p className="text-xs text-slate-600">Document the operational review reason why this result is being returned to the technician.</p>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700">Documented Reason *</label>
                  <input
                    type="text"
                    placeholder="e.g. Value inconsistent with configured unit..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowReturnModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleReturn} disabled={isSubmitting} className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl">
                  Confirm Return
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
