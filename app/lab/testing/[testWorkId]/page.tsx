"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FlaskConical,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Building2,
  FileText,
  Activity,
  Check,
  XCircle,
  Play,
  History,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getTestWorkItemById } from "@/lib/data/lab-testing-store";
import { getOrderTestResults } from "@/lib/data/lab-order-store";
import { LabTestingService } from "@/lib/services/lab-testing-service";
import { LabTestWorkItem, HealthcareTestResult, TestResultType, ResultAbnormalFlag } from "@/types/database.types";

export default function TestProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const testWorkId = (params?.testWorkId as string) || "";

  const [workItem, setWorkItem] = useState<LabTestWorkItem | null>(null);
  const [existingResult, setExistingResult] = useState<HealthcareTestResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Result entry form state
  const [resultType, setResultType] = useState<TestResultType>("NUMERIC");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("mg/dL");
  const [referenceRange, setReferenceRange] = useState("70 - 99");
  const [flag, setFlag] = useState<ResultAbnormalFlag>("NORMAL");
  const [correctionReason, setCorrectionReason] = useState("");

  const [instrumentName, setInstrumentName] = useState("Sysmex XN-550");
  const [method, setMethod] = useState("Automated Spectrophotometry");

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = () => {
    if (!testWorkId) return;
    const item = getTestWorkItemById(testWorkId);
    setWorkItem(item);
    if (item) {
      const results = getOrderTestResults(item.lab_order_id);
      const res = results.find((r) => r.test_id.toLowerCase() === item.test_id.toLowerCase());
      setExistingResult(res || null);
      if (res) {
        setResultType(res.result_type);
        setValue(res.value);
        setUnit(res.unit || "mg/dL");
        setReferenceRange(res.reference_range || "70 - 99");
        setFlag(res.flag);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [testWorkId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        <FlaskConical className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
        Loading test work item...
      </div>
    );
  }

  if (!workItem) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Test Work Item Not Found</h2>
        <p className="text-slate-600 text-sm">No operational test work item found for ID: {testWorkId}</p>
        <Link href="/lab/testing">
          <Button variant="outline">Back to Testing Worklist</Button>
        </Link>
      </div>
    );
  }

  const handleStartTest = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      const res = await LabTestingService.startTest(workItem.id, instrumentName, method, user);
      if (res.success) {
        setActionSuccess("Started test processing.");
        refresh();
      } else {
        setActionError(res.error || "Failed to start test processing.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitResult = async (isDraft: boolean) => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await LabTestingService.submitTestResult(
        workItem.id,
        {
          result_type: resultType,
          value,
          unit,
          reference_range: referenceRange,
          flag,
          is_draft: isDraft,
          correction_reason: existingResult ? correctionReason : undefined,
        },
        user
      );

      if (res.success && res.result) {
        setActionSuccess(isDraft ? "Draft result saved." : "Submitted result for verification.");
        refresh();
      } else {
        setActionError(res.error || "Failed to submit result.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "doctor", "lab_staff"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-5xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/lab/testing">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Worklist
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono">{workItem.id}</h1>
                <Badge variant="secondary" className="text-xs">{workItem.test_name}</Badge>
                <StatusBadge status={workItem.status} />
              </div>
              <p className="text-xs text-slate-500">Sample: {workItem.sample_id} • Order: {workItem.lab_order_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {workItem.status === "QUEUED" || workItem.status === "PENDING" ? (
              <Button
                onClick={handleStartTest}
                disabled={isSubmitting}
                size="sm"
                className="bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs"
              >
                <Play className="h-4 w-4 mr-1" /> Begin Processing
              </Button>
            ) : null}
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
          {/* Main Result Entry Form */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" /> Laboratory Result Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Data Type *</label>
                    <select
                      value={resultType}
                      onChange={(e) => setResultType(e.target.value as TestResultType)}
                      className="w-full text-xs h-9 rounded-xl border border-input px-2 mt-1 bg-white"
                    >
                      <option value="NUMERIC">Numeric</option>
                      <option value="TEXT">Text</option>
                      <option value="QUALITATIVE">Qualitative (Positive/Negative)</option>
                      <option value="BOOLEAN">Boolean</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Abnormal Flag</label>
                    <select
                      value={flag}
                      onChange={(e) => setFlag(e.target.value as ResultAbnormalFlag)}
                      className="w-full text-xs h-9 rounded-xl border border-input px-2 mt-1 bg-white font-semibold"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="LOW">Low</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="ABNORMAL">Abnormal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Measured Value *</label>
                    <input
                      type="text"
                      placeholder="e.g. 102"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. mg/dL"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700">Configured Reference Range</label>
                  <input
                    type="text"
                    placeholder="e.g. 70 - 99 mg/dL"
                    value={referenceRange}
                    onChange={(e) => setReferenceRange(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 text-slate-600 bg-slate-50"
                  />
                </div>

                {existingResult && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Correction Reason (Version V{existingResult.version + 1})</label>
                    <input
                      type="text"
                      placeholder="Reason for modifying submitted result..."
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      className="w-full text-xs h-9 rounded-xl border border-amber-300 bg-amber-50/50 px-3 mt-1"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleSubmitResult(true)} disabled={isSubmitting} className="text-xs rounded-xl">
                    Save Draft
                  </Button>
                  <Button size="sm" onClick={() => handleSubmitResult(false)} disabled={isSubmitting} className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl">
                    Submit for Verification
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Version History */}
            {existingResult && existingResult.version_history && existingResult.version_history.length > 0 && (
              <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
                <CardHeader className="p-4 pb-2 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <History className="h-4 w-4 text-purple-600" /> Result Version History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {existingResult.version_history.map((h, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900">V{h.version}: {h.value}</span>
                        <p className="text-[10px] text-slate-500">Saved at {new Date(h.saved_at).toLocaleString()} by {h.saved_by_name}</p>
                      </div>
                      <span className="text-[10px] italic text-slate-600">{h.amendment_reason || "Correction"}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Metadata */}
          <div className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Test Provenance</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Patient Name:</span>{" "}
                  <span className="font-bold text-slate-900">{workItem.patient_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Patient ID:</span>{" "}
                  <span className="font-mono text-purple-900 font-bold">{workItem.patient_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Facility:</span>{" "}
                  <span className="font-semibold text-slate-800">{workItem.facility_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Assigned Tech:</span>{" "}
                  <span className="font-semibold text-slate-800">{workItem.assigned_to_name || "Unassigned"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
