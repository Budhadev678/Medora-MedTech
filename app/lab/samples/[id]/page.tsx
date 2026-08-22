"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FlaskConical,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Building2,
  QrCode,
  Printer,
  XCircle,
  Activity,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getSampleById } from "@/lib/data/lab-sample-store";
import { LabSampleService } from "@/lib/services/lab-sample-service";
import { SampleRejectionReason, HealthcareLabSample, SampleCustodyEvent } from "@/types/database.types";

export default function SampleDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const sampleId = (params?.id as string) || "";

  const [sample, setSample] = useState<HealthcareLabSample | null>(null);
  const [custodyEvents, setCustodyEvents] = useState<SampleCustodyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDestination, setTransferDestination] = useState("Hematology Bench 2");
  const [transferNotes, setTransferNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reject Specimen Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<SampleRejectionReason>("INSUFFICIENT_SAMPLE");
  const [rejectionNotes, setRejectionNotes] = useState("");

  const refresh = () => {
    if (!sampleId) return;
    const smp = getSampleById(sampleId);
    setSample(smp);
    if (smp) {
      const trail = LabSampleService.getCustodyTrail(smp.id, user);
      if (trail.success && trail.events) {
        setCustodyEvents(trail.events);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [sampleId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        <FlaskConical className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
        Loading specimen record...
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Specimen Record Not Found</h2>
        <p className="text-slate-600 text-sm">No specimen found for sample reference: {sampleId}</p>
        <Link href="/lab">
          <Button variant="outline">Back to Lab Workspace</Button>
        </Link>
      </div>
    );
  }

  const handleTransfer = async (type: "SAMPLE_TRANSFERRED" | "SAMPLE_RECEIVED" | "SAMPLE_READY_FOR_TESTING") => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await LabSampleService.recordTransfer(
        sample.id,
        {
          event_type: type,
          destination_location: transferDestination,
          notes: transferNotes,
        },
        user
      );

      if (res.success) {
        setActionSuccess(`Specimen movement recorded: ${type.replace(/_/g, " ")}.`);
        setShowTransferModal(false);
        refresh();
      } else {
        setActionError(res.error || "Failed to record custody transfer.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSpecimen = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await LabSampleService.rejectSpecimen(sample.id, rejectionReason, rejectionNotes, user);
      if (res.success) {
        setActionSuccess(`Specimen ${sample.id} rejected. Status updated.`);
        setShowRejectModal(false);
        refresh();
      } else {
        setActionError(res.error || "Failed to reject specimen.");
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
            <Link href={`/lab/orders/${sample.lab_order_id}`}>
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Order View
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono">Specimen {sample.id}</h1>
                <Badge variant="secondary" className="text-xs">{sample.sample_type}</Badge>
                <StatusBadge status={sample.status} />
              </div>
              <p className="text-xs text-slate-500">Order Ref: {sample.lab_order_id} • Patient: {sample.patient_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sample.status !== "REJECTED" ? (
              <>
                <Button
                  onClick={() => handleTransfer("SAMPLE_READY_FOR_TESTING")}
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Ready for Testing
                </Button>
                <Button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isSubmitting}
                  size="sm"
                  variant="outline"
                  className="text-red-700 border-red-300 hover:bg-red-50 font-semibold rounded-xl text-xs"
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject Specimen
                </Button>
              </>
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
          {/* Main Custody Timeline */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" /> Specimen Chain of Custody Timeline
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">Immutable Provenance</Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {custodyEvents.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">No custody movement recorded yet.</p>
                ) : (
                  <div className="relative pl-6 border-l-2 border-purple-200 space-y-6">
                    {custodyEvents.map((evt) => (
                      <div key={evt.id} className="relative">
                        <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-purple-600 border-2 border-white" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{evt.event_type.replace(/_/g, " ")}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            By <span className="font-semibold text-slate-800">{evt.actor_name}</span> ({evt.actor_role})
                          </p>
                          {evt.source_location && <p className="text-[10px] text-slate-500">From: {evt.source_location}</p>}
                          {evt.destination_location && <p className="text-[10px] text-slate-500">To: {evt.destination_location}</p>}
                          {evt.notes && <p className="text-[10px] text-slate-600 italic mt-1 bg-slate-50 p-2 rounded-lg">{evt.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Metadata */}
          <div className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Specimen Metadata</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Barcode:</span>{" "}
                  <span className="font-mono font-bold text-purple-950">{sample.sample_barcode}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Specimen Type:</span>{" "}
                  <span className="font-semibold text-slate-800">{sample.sample_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Collector:</span>{" "}
                  <span className="font-semibold text-slate-800">{sample.collected_by_name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Collected Time:</span>{" "}
                  <span className="font-mono text-slate-700">{sample.collected_at ? new Date(sample.collected_at).toLocaleString() : "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal: Reject Specimen */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5 text-red-600" /> Reject Specimen
              </h3>
              <p className="text-xs text-slate-600">Document the rejection reason for specimen {sample.id}. The original record will be preserved for audit traceability.</p>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700">Rejection Reason *</label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value as SampleRejectionReason)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-2 mt-1 bg-white"
                  >
                    <option value="INSUFFICIENT_SAMPLE">Insufficient sample volume</option>
                    <option value="DAMAGED_SAMPLE">Damaged container / leakage</option>
                    <option value="WRONG_CONTAINER">Wrong container type used</option>
                    <option value="LABELING_ISSUE">Labeling discrepancy / unreadable barcode</option>
                    <option value="QUALITY_ISSUE">Quality issue / hemolyzed specimen</option>
                    <option value="OTHER">Other documented reason</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700">Notes / Instructions for Recollection</label>
                  <input
                    type="text"
                    placeholder="Details..."
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleRejectSpecimen} disabled={isSubmitting} className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl">
                  {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
