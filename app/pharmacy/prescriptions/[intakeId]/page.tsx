"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  Check,
  HelpCircle,
  Pill,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getIntakeById } from "@/lib/data/pharmacy-intake-store";
import { getPrescriptionById } from "@/lib/data/prescription-store";
import { PharmacyIntakeService } from "@/lib/services/pharmacy-intake-service";
import { PharmacyPrescriptionIntake, HealthcarePrescription } from "@/types/database.types";

export default function PrescriptionIntakeValidationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const intakeId = (params?.intakeId as string) || "";

  const [intake, setIntake] = useState<PharmacyPrescriptionIntake | null>(null);
  const [prescription, setPrescription] = useState<HealthcarePrescription | null>(null);
  const [loading, setLoading] = useState(true);

  // Clarification Modal state
  const [clarificationReason, setClarificationReason] = useState("");
  const [showClarificationModal, setShowClarificationModal] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = () => {
    if (!intakeId) return;
    const item = getIntakeById(intakeId);
    setIntake(item);
    if (item) {
      const rx = getPrescriptionById(item.prescription_id);
      setPrescription(rx);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [intakeId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium text-xs">
        <FileText className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
        Loading prescription intake...
      </div>
    );
  }

  if (!intake) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Intake Record Not Found</h2>
        <p className="text-slate-600 text-sm">No intake record found for ID: {intakeId}</p>
        <Link href="/pharmacy/prescriptions">
          <Button variant="outline">Back to Queue</Button>
        </Link>
      </div>
    );
  }

  const handleValidate = async (action: "MARK_VALID" | "MARK_INVALID" | "START_REVIEW") => {
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await PharmacyIntakeService.validateIntake(
        intake.id,
        action,
        action === "MARK_INVALID" ? "Validation check failed by pharmacist" : undefined,
        undefined,
        user
      );

      if (res.success && res.intake) {
        setActionSuccess(
          action === "MARK_VALID"
            ? "Prescription intake marked VALID."
            : action === "MARK_INVALID"
            ? "Prescription intake marked INVALID."
            : "Review started."
        );
        refresh();
      } else {
        setActionError(res.error || "Action failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestClarification = async () => {
    if (!clarificationReason.trim()) return;
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);
    try {
      const res = await PharmacyIntakeService.requestClarification(intake.id, clarificationReason, user);
      if (res.success) {
        setActionSuccess("Requested prescriber clarification successfully.");
        setShowClarificationModal(false);
        setClarificationReason("");
        refresh();
      } else {
        setActionError(res.error || "Failed to request clarification.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-5xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/pharmacy/prescriptions">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Intake Queue
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono">{intake.id}</h1>
                <Badge variant="outline" className="text-xs font-mono">{intake.prescription_id} V{intake.prescription_version}</Badge>
                <StatusBadge status={intake.status} />
              </div>
              <p className="text-xs text-slate-500">Facility: {intake.facility_id} • Received: {new Date(intake.received_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {intake.status !== "VALID" && intake.status !== "INVALID" && (
              <>
                <Button
                  onClick={() => handleValidate("MARK_VALID")}
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  <Check className="h-4 w-4 mr-1" /> Validate Intake
                </Button>
                <Button
                  onClick={() => setShowClarificationModal(true)}
                  disabled={isSubmitting}
                  size="sm"
                  variant="outline"
                  className="text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold rounded-xl text-xs"
                >
                  <HelpCircle className="h-4 w-4 mr-1" /> Request Clarification
                </Button>
                <Button
                  onClick={() => handleValidate("MARK_INVALID")}
                  disabled={isSubmitting}
                  size="sm"
                  variant="ghost"
                  className="text-red-700 hover:bg-red-50 text-xs rounded-xl"
                >
                  Mark Invalid
                </Button>
              </>
            )}
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
          {/* Main Read-Only Prescription View */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-emerald-600" /> Authoritative Digital Prescription (Read-Only)
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                  <Lock className="h-3 w-3 mr-1 text-slate-400" /> Immutable Clinical Record
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {prescription ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-500 font-medium block text-[10px]">Patient Name</span>
                        <span className="font-bold text-slate-900">{prescription.patient_name}</span>
                        <span className="font-mono text-purple-900 block text-[10px]">{prescription.patient_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block text-[10px]">Prescribing Doctor</span>
                        <span className="font-bold text-slate-900">{prescription.prescriber_name}</span>
                        <span className="text-slate-600 block text-[10px]">{prescription.organization_name}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Prescribed Medication Items</h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                            <tr>
                              <th className="p-2.5">Medicine</th>
                              <th className="p-2.5">Dosage / Frequency</th>
                              <th className="p-2.5">Duration</th>
                              <th className="p-2.5">Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {prescription.items.map((item, i) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="p-2.5 font-bold text-slate-900">{item.medicine_name}</td>
                                <td className="p-2.5 text-slate-700">{item.dosage || "1 tablet"} ({item.frequency || "TDS"})</td>
                                <td className="p-2.5 text-slate-700">{item.duration_days || 5} Days</td>
                                <td className="p-2.5 text-slate-500 italic">{item.instructions || "After meals"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">Prescription record details loaded.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Intake Provenance */}
          <div className="space-y-6">
            <Card className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">Intake Status & Metadata</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Intake ID:</span>{" "}
                  <span className="font-mono font-bold text-emerald-950">{intake.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Status:</span>{" "}
                  <StatusBadge status={intake.status} />
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Received By:</span>{" "}
                  <span className="font-semibold text-slate-800">{intake.received_by_name || "System"}</span>
                </div>
                {intake.validated_by_name && (
                  <div>
                    <span className="text-slate-500 font-medium">Validated By:</span>{" "}
                    <span className="font-semibold text-slate-800">{intake.validated_by_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal: Request Clarification */}
        {showClarificationModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-amber-700">
                <HelpCircle className="h-5 w-5 text-amber-600" /> Request Prescriber Clarification
              </h3>
              <p className="text-xs text-slate-600">Document the clinical ambiguity or operational question to send to Dr. {intake.prescriber_name}.</p>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700">Documented Clarification Reason *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dosage duration missing for Amoxicillin..."
                    value={clarificationReason}
                    onChange={(e) => setClarificationReason(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowClarificationModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleRequestClarification} disabled={isSubmitting} className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl">
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
