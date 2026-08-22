"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FlaskConical,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  Activity,
  Check,
  X,
  Printer,
  QrCode,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getLabOrderById, HealthcareLabOrder } from "@/lib/data/lab-order-store";
import { getOrderSamples } from "@/lib/data/lab-sample-store";
import { LabIntakeService } from "@/lib/services/lab-intake-service";
import { LabSampleService } from "@/lib/services/lab-sample-service";
import { SampleType, HealthcareLabSample } from "@/types/database.types";

export default function LabOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = (params?.id as string) || "";

  const [order, setOrder] = useState<HealthcareLabOrder | null>(null);
  const [samples, setSamples] = useState<HealthcareLabSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Verification & Sample modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifiedMedoraId, setVerifiedMedoraId] = useState("");
  const [verifiedDob, setVerifiedDob] = useState("");

  const [showCollectModal, setShowCollectModal] = useState(false);
  const [sampleType, setSampleType] = useState<SampleType>("WHOLE_BLOOD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unable to Process modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonCategory, setRejectReasonCategory] = useState("TEST_NOT_AVAILABLE");
  const [rejectExplanation, setRejectExplanation] = useState("");

  const refresh = () => {
    if (!orderId) return;
    const ord = getLabOrderById(orderId);
    setOrder(ord);
    if (ord) {
      setSamples(getOrderSamples(ord.id));
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [orderId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        <FlaskConical className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
        Loading laboratory order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Laboratory Order Not Found</h2>
        <p className="text-slate-600 text-sm">No laboratory order found for reference: {orderId}</p>
        <Link href="/lab">
          <Button variant="outline">Back to Lab Workspace</Button>
        </Link>
      </div>
    );
  }

  // Action handlers
  const handleAcceptOrder = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await LabIntakeService.acceptOrder(order.id, "LAB-FAC-1001", user);
      if (res.success && res.order) {
        setActionSuccess("Laboratory order accepted successfully.");
        refresh();
      } else {
        setActionError(res.error || "Failed to accept order.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkUnableToProcess = async () => {
    if (!rejectReasonCategory) return;
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await LabIntakeService.markUnableToProcess(order.id, rejectReasonCategory, rejectExplanation, user);
      if (res.success && res.order) {
        setActionSuccess("Marked laboratory order as unable to process.");
        setShowRejectModal(false);
        refresh();
      } else {
        setActionError(res.error || "Failed to update order status.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPatient = async () => {
    if (!verifiedMedoraId.trim() || !verifiedDob.trim()) {
      setActionError("Two-point patient verification required (MEDORA ID + Date of Birth).");
      return;
    }
    setActionError(null);
    const res = await LabSampleService.verifyPatientIdentity(
      order.id,
      [`MEDORA_ID:${verifiedMedoraId.trim()}`, `DOB:${verifiedDob.trim()}`],
      user
    );

    if (res.success) {
      setShowVerifyModal(false);
      setShowCollectModal(true);
    } else {
      setActionError(res.error || "Patient verification failed.");
    }
  };

  const handleCollectSample = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      const testItemIds = order.items.map((i) => i.id);
      const testNames = order.items.map((i) => i.test_name);

      const res = await LabSampleService.collectSample(
        order.id,
        {
          sample_type: sampleType,
          test_item_ids: testItemIds,
          test_names: testNames,
          facility_id: "LAB-FAC-1001",
          location: "Collection Room 1",
        },
        user
      );

      if (res.success && res.sample) {
        setActionSuccess(`Collected specimen ${res.sample.id} (${res.sample.sample_type}). Label generated.`);
        setShowCollectModal(false);
        refresh();
      } else {
        setActionError(res.error || "Failed to register sample.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "doctor", "lab_staff"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/lab">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">Lab Order {order.id}</h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-500">Source: {order.organization_name} • Clinician: {order.ordering_provider_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {order.status === "FINALIZED" || order.status === "ORDERED" ? (
              <>
                <Button
                  onClick={handleAcceptOrder}
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  <Check className="h-4 w-4 mr-1" /> Accept Order
                </Button>
                <Button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isSubmitting}
                  size="sm"
                  variant="outline"
                  className="text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold rounded-xl text-xs"
                >
                  <X className="h-4 w-4 mr-1" /> Unable to Process
                </Button>
              </>
            ) : null}

            {order.status === "ACCEPTED" ? (
              <Button
                onClick={() => setShowVerifyModal(true)}
                size="sm"
                className="bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs"
              >
                <User className="h-4 w-4 mr-1" /> Collect Specimen
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

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-purple-600" /> Requested Diagnostic Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.test_name}</p>
                      <p className="text-[10px] text-slate-500">Code: {item.test_code || item.id} • Specimen: {item.specimen_type || "Standard"}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white font-mono">{item.instructions || "Standard protocol"}</Badge>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Priority:</span>{" "}
                    <span className="font-bold text-purple-950">{order.priority}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Clinical Reason:</span>{" "}
                    <span className="font-semibold text-slate-900">{order.reason}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registered Samples */}
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" /> Physical Specimen Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {samples.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No physical specimen collected yet. Order status: <span className="font-bold text-slate-700">{order.status}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {samples.map((s) => (
                      <div key={s.id} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-purple-950">{s.id}</span>
                            <Badge variant="secondary" className="text-[9px]">{s.sample_type}</Badge>
                            <StatusBadge status={s.status} />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Collected at {s.collected_at ? new Date(s.collected_at).toLocaleTimeString() : "N/A"} by {s.collected_by_name}
                          </p>
                        </div>
                        <Link href={`/lab/samples/${s.id}`}>
                          <Button size="sm" variant="outline" className="text-[10px] h-7 rounded-lg">
                            Chain of Custody
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Patient Provenance</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div>
                  <Label text="Patient Name" />
                  <p className="font-bold text-slate-900">{order.patient_name}</p>
                </div>
                <div>
                  <Label text="MEDORA Patient ID" />
                  <p className="font-mono text-purple-900 font-bold">{order.patient_id}</p>
                </div>
                <div>
                  <Label text="Encounter Reference" />
                  <p className="font-mono text-slate-700">{order.encounter_id}</p>
                </div>
                <div>
                  <Label text="Ordering Clinician" />
                  <p className="font-semibold text-slate-800">{order.ordering_provider_name}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal 1: Patient Verification */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" /> Patient Identity Verification
              </h3>
              <p className="text-xs text-slate-600">
                Two-point identity verification is mandatory before specimen collection for patient <span className="font-bold text-slate-900">{order.patient_name}</span>.
              </p>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700">1. MEDORA Patient ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. PAT-1001"
                    value={verifiedMedoraId}
                    onChange={(e) => setVerifiedMedoraId(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700">2. Date of Birth / Year *</label>
                  <input
                    type="text"
                    placeholder="e.g. 15-08-1988"
                    value={verifiedDob}
                    onChange={(e) => setVerifiedDob(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowVerifyModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleVerifyPatient} className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl">
                  Confirm Identity & Proceed
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Sample Collection */}
        {showCollectModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-purple-600" /> Specimen Collection & Labeling
              </h3>
              <p className="text-xs text-slate-600">Registering physical specimen for order {order.id}.</p>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700">Specimen Type *</label>
                  <select
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value as SampleType)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-2 mt-1 bg-white"
                  >
                    <option value="WHOLE_BLOOD">Whole Blood</option>
                    <option value="SERUM">Serum</option>
                    <option value="PLASMA">Plasma</option>
                    <option value="URINE">Urine</option>
                    <option value="SWAB">Swab</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowCollectModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCollectSample} disabled={isSubmitting} className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl">
                  {isSubmitting ? "Registering..." : "Register Specimen & Print Label"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 3: Unable to Process */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5 text-amber-600" /> Unable to Process Order
              </h3>
              <p className="text-xs text-slate-600">Document the operational reason why this laboratory cannot process order {order.id}.</p>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700">Reason Category *</label>
                  <select
                    value={rejectReasonCategory}
                    onChange={(e) => setRejectReasonCategory(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-2 mt-1 bg-white"
                  >
                    <option value="TEST_NOT_AVAILABLE">Requested test not supported at this facility</option>
                    <option value="EQUIPMENT_MAINTENANCE">Equipment / analyzer undergoing maintenance</option>
                    <option value="REAGENT_STOCK_DEPLETED">Reagent stock temporarily depleted</option>
                    <option value="CAPACITY_EXCEEDED">Facility operational capacity limit reached</option>
                    <option value="OTHER">Other documented reason</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700">Additional Explanation</label>
                  <input
                    type="text"
                    placeholder="Details for clinician/patient..."
                    value={rejectExplanation}
                    onChange={(e) => setRejectExplanation(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleMarkUnableToProcess} disabled={isSubmitting} className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl">
                  {isSubmitting ? "Updating..." : "Confirm Unable to Process"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

function Label({ text }: { text: string }) {
  return <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{text}</p>;
}
