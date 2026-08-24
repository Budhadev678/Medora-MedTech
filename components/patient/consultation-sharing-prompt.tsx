"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  X,
  FileText,
  Stethoscope,
  Activity,
  Pill,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getConsultationSharingDecision,
  recordConsultationSharingDecision,
  ConsultationSharingDecision,
} from "@/lib/data/consent-store";
import { useLocalization } from "@/lib/localization";

export interface ConsultationSharingPromptProps {
  encounterId: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName: string;
  organizationId: string;
  organizationName: string;
  onDecisionChange?: (decision: "SHARE" | "DONT_SHARE") => void;
}

export function ConsultationSharingPrompt({
  encounterId,
  patientId,
  patientName = "Patient",
  doctorId,
  doctorName,
  organizationId,
  organizationName,
  onDecisionChange,
}: ConsultationSharingPromptProps) {
  const { t } = useLocalization();
  const [decision, setDecision] = useState<ConsultationSharingDecision | null>(null);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showWhatSharedModal, setShowWhatSharedModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDecision = () => {
    if (!encounterId) return;
    const d = getConsultationSharingDecision(encounterId, patientId);
    setDecision(d);
  };

  useEffect(() => {
    loadDecision();
    const handleUpdate = () => loadDecision();
    window.addEventListener("medora-sharing-decision-updated", handleUpdate);
    window.addEventListener("medora-consent-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-sharing-decision-updated", handleUpdate);
      window.removeEventListener("medora-consent-updated", handleUpdate);
    };
  }, [encounterId, patientId]);

  const handleSelectDecision = (choice: "SHARE" | "DONT_SHARE") => {
    if (choice === "SHARE") {
      setShowScopeModal(true);
    } else {
      setIsSubmitting(true);
      const res = recordConsultationSharingDecision({
        encounterId,
        patientId,
        patientName,
        doctorId,
        doctorName,
        organizationId,
        organizationName,
        decision: "DONT_SHARE",
      });
      setDecision(res.decision);
      setIsSubmitting(false);
      if (onDecisionChange) onDecisionChange("DONT_SHARE");
    }
  };

  const handleConfirmShare = () => {
    setIsSubmitting(true);
    const res = recordConsultationSharingDecision({
      encounterId,
      patientId,
      patientName,
      doctorId,
      doctorName,
      organizationId,
      organizationName,
      decision: "SHARE",
    });
    setDecision(res.decision);
    setShowScopeModal(false);
    setIsSubmitting(false);
    if (onDecisionChange) onDecisionChange("SHARE");
  };

  return (
    <>
      <Card className="rounded-3xl border shadow-xs overflow-hidden transition-all bg-white border-indigo-100">
        <div className="p-4 sm:p-5 space-y-3">
          
          {/* Header Badge & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  {t("sharing.share_previous_records")}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {organizationName} • {doctorName}
                </p>
              </div>
            </div>

            {decision?.decision === "SHARE" ? (
              <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200 text-[10px] font-bold">
                ✓ Records Shared
              </Badge>
            ) : decision?.decision === "DONT_SHARE" ? (
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                Not Shared
              </Badge>
            ) : decision?.requested_by_doctor ? (
              <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] font-bold animate-pulse">
                Action Requested
              </Badge>
            ) : (
              <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[10px] font-bold">
                Contextual Consent
              </Badge>
            )}
          </div>

          {/* STATE 1: ALREADY SHARED */}
          {decision?.decision === "SHARE" && (
            <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{t("sharing.records_shared_title")}</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Your previous consultations, prescriptions, and diagnostic reports have been authorized for {doctorName} during this active consultation session.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowWhatSharedModal(true)}
                  className="h-7 text-[11px] font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 rounded-xl"
                >
                  <Eye className="h-3 w-3 mr-1" /> View What Was Shared
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSelectDecision("DONT_SHARE")}
                  className="h-7 text-[11px] font-bold text-slate-500 hover:text-rose-700 rounded-xl"
                >
                  Revoke / Stop Sharing
                </Button>
              </div>
            </div>
          )}

          {/* STATE 2: DON'T SHARE SELECTED */}
          {decision?.decision === "DONT_SHARE" && !decision?.requested_by_doctor && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Lock className="h-4 w-4 text-slate-500 shrink-0" />
                <span>{t("sharing.records_not_shared_title")}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {t("sharing.records_not_shared_desc")}
              </p>
              <div className="pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSelectDecision("SHARE")}
                  className="h-7 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs"
                >
                  <Share2 className="h-3 w-3 mr-1" /> Share Previous Records Instead
                </Button>
              </div>
            </div>
          )}

          {/* STATE 3: PENDING DECISION / DOCTOR REQUESTED */}
          {(!decision || (decision?.decision === "DONT_SHARE" && decision?.requested_by_doctor)) && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {decision?.requested_by_doctor ? (
                  <span className="font-bold text-slate-900 block mb-1">
                    {doctorName} has requested access to your previous medical records for this consultation.
                  </span>
                ) : null}
                Your previous medical records are available to share with this doctor for this consultation. Would you like to share them?
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleSelectDecision("DONT_SHARE")}
                  className="flex-1 text-xs font-bold rounded-2xl h-9 text-slate-700 border-slate-300 hover:bg-slate-100"
                >
                  {t("sharing.dont_share")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleSelectDecision("SHARE")}
                  className="flex-1 text-xs font-bold rounded-2xl h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t("sharing.share_previous_records")}
                </Button>
              </div>
            </div>
          )}

        </div>
      </Card>

      {/* MODAL 1: WHAT WILL BE SHARED (SCOPE CONFIRMATION) */}
      {showScopeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {t("sharing.share_previous_records")}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Recipient: {doctorName} ({organizationName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScopeModal(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Scope Breakdown */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                {t("sharing.what_will_be_shared")}
              </span>
              
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{t("sharing.scope_consultations")}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{t("sharing.scope_prescriptions")}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{t("sharing.scope_lab_reports")}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{t("sharing.scope_clinical_history")}</span>
                </div>
              </div>

              {/* Exclusions Note */}
              <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100 text-[11px] text-rose-800 flex items-center gap-2">
                <Info className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{t("sharing.scope_excluded")}</span>
              </div>

              <div className="p-2 bg-indigo-50/50 rounded-xl text-[11px] text-indigo-900 flex justify-between">
                <span className="text-slate-500">Sharing Scope:</span>
                <span className="font-bold">Active Consultation Session (24h)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowScopeModal(false)}
                className="text-xs rounded-xl text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting}
                onClick={handleConfirmShare}
                className="text-xs font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs"
              >
                {t("sharing.confirm_share")}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: VIEW WHAT WAS SHARED */}
      {showWhatSharedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">Active Consultation Scope</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatSharedModal(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-emerald-800">Authorized Doctor:</span>
                <span className="font-bold text-emerald-950">{doctorName}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-emerald-800">Facility:</span>
                <span className="font-bold text-emerald-950">{organizationName}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-emerald-800">Encounter ID:</span>
                <span className="font-mono font-bold text-emerald-950">{encounterId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800">Authorized Scopes:</span>
                <span className="font-bold text-emerald-950">Consultations, Prescriptions, Lab Reports</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowWhatSharedModal(false)}
                className="text-xs font-bold rounded-2xl bg-slate-900 hover:bg-slate-800 text-white"
              >
                Close
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
