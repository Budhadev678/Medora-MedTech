"use client";

// ============================================================
// MEDORA — PUBLIC DIGITAL PRESCRIPTION AUTHENTICITY VERIFICATION
// PHASE 7.2 VERIFICATION ENDPOINT
// ============================================================

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileCheck,
  Building2,
  User,
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPrescriptionByVerificationToken } from "@/lib/data/prescription-store";

export default function PublicPrescriptionVerificationPage() {
  const params = useParams();
  const idOrToken = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ReturnType<typeof getPrescriptionByVerificationToken> | null>(null);

  useEffect(() => {
    if (idOrToken) {
      const res = getPrescriptionByVerificationToken(idOrToken);
      setResult(res);
      setLoading(false);
    }
  }, [idOrToken]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-md mx-auto w-full space-y-6 animate-in fade-in-50 duration-200">
        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-teal-800 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-300" />
            <span>MEDORA Digital Verification</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Prescription Authenticity Check</h1>
          <p className="text-xs text-slate-500">
            Official cryptographic verification endpoint for MEDORA digital health prescriptions.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3 shadow-xs">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
            <p className="text-xs font-medium text-slate-600">Verifying prescription signature...</p>
          </div>
        ) : !result || !result.found ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <ShieldX className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-slate-900 text-sm">Prescription Record Not Found</h2>
              <p className="text-xs text-slate-500">
                Token <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{idOrToken}</code> was not found in the MEDORA verification registry.
              </p>
            </div>
            <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 text-xs py-1 px-3">
              NOT VALID
            </Badge>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
            {/* Authenticity Status Header */}
            <div
              className={`p-5 text-center space-y-2 border-b ${
                result.is_valid
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  : result.status === "VOIDED"
                  ? "bg-rose-50/80 border-rose-200 text-rose-950"
                  : "bg-amber-50/80 border-amber-200 text-amber-950"
              }`}
            >
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto shadow-2xs ${
                  result.is_valid
                    ? "bg-emerald-600 text-white"
                    : result.status === "VOIDED"
                    ? "bg-rose-600 text-white"
                    : "bg-amber-600 text-white"
                }`}
              >
                {result.is_valid ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : result.status === "VOIDED" ? (
                  <ShieldX className="h-6 w-6" />
                ) : (
                  <ShieldAlert className="h-6 w-6" />
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Verification Result</span>
                <h2 className="text-base font-extrabold">{result.message}</h2>
              </div>

              <Badge
                className={`text-xs font-bold px-3 py-0.5 ${
                  result.is_valid
                    ? "bg-emerald-700 text-white"
                    : result.status === "VOIDED"
                    ? "bg-rose-700 text-white"
                    : "bg-amber-700 text-white"
                }`}
              >
                STATUS: {result.status || (result.is_valid ? "VALID" : "INVALID")}
              </Badge>
            </div>

            {/* Public Verified Details (Minimal Privacy-Safe Context) */}
            <div className="p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Prescription Reference</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {result.prescription_reference}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Prescribing Doctor
                </span>
                <span className="font-bold text-slate-900">{result.prescriber_name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Healthcare Facility
                </span>
                <span className="font-semibold text-slate-800">{result.facility_name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Finalized Timestamp
                </span>
                <span className="font-medium text-slate-700">
                  {result.finalized_at
                    ? new Date(result.finalized_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </span>
              </div>

              {result.digital_signature_hash && (
                <div className="pt-1 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Cryptographic Signature Hash
                  </span>
                  <p className="font-mono text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200/80 break-all leading-tight">
                    {result.digital_signature_hash}
                  </p>
                </div>
              )}
            </div>

            {/* Privacy Protection Notice */}
            <div className="bg-slate-50 p-4 border-t border-slate-200/80 flex items-start gap-2 text-[11px] text-slate-600">
              <Lock className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Policy:</strong> Unauthenticated public verification displays minimum authenticity confirmation only. Full clinical records and detailed medication lists are restricted to authorized patient and clinical logins.
              </span>
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-slate-900 gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to MEDORA Platform</span>
            </Button>
          </Link>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-400 py-4">
        MEDORA — Transparent Connected Healthcare Ecosystem • ABDM Digital Trust Foundation
      </footer>
    </div>
  );
}
