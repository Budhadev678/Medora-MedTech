"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldCheck, XCircle, CheckCircle2, AlertTriangle, Building2, Calendar, FileText, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LabReportService } from "@/lib/services/lab-report-service";

export default function ReportVerificationPage() {
  const params = useParams();
  const token = (params?.token as string) || "";
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const res = LabReportService.verifyReportByToken(token);
      setVerificationResult(res);
    }
    setLoading(false);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center text-slate-500 font-medium text-xs">
          <ShieldCheck className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
          Verifying MEDORA Report Authenticity...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <ShieldCheck className="h-10 w-10 text-purple-600 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">MEDORA Diagnostic Report Verification</h1>
          <p className="text-xs text-slate-500 font-mono">Token: {token}</p>
        </div>

        {verificationResult?.valid ? (
          <Card className="bg-white rounded-2xl shadow-xl border-emerald-200 border-2">
            <CardHeader className="p-4 border-b border-emerald-100 bg-emerald-50/50 rounded-t-2xl text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-base">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" /> AUTHENTIC MEDORA REPORT
              </div>
              <p className="text-xs text-emerald-700 mt-1">This report is genuine and issued by a connected laboratory.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Report Reference:</span>
                <span className="font-mono font-bold text-purple-950">{verificationResult.reportSummary.report_id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Issuing Laboratory:</span>
                <span className="font-semibold text-slate-800">{verificationResult.reportSummary.laboratory_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Report Version:</span>
                <span className="font-mono font-bold text-slate-900">V{verificationResult.reportSummary.version}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Version Status:</span>
                <Badge className={verificationResult.reportSummary.is_current ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}>
                  {verificationResult.reportSummary.is_current ? "CURRENT VERSION" : "SUPERSEDED VERSION"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Finalized Date:</span>
                <span className="font-mono text-slate-700">{new Date(verificationResult.reportSummary.finalized_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white rounded-2xl shadow-xl border-red-200 border-2">
            <CardHeader className="p-4 border-b border-red-100 bg-red-50/50 rounded-t-2xl text-center">
              <div className="flex items-center justify-center gap-2 text-red-800 font-bold text-base">
                <XCircle className="h-6 w-6 text-red-600" /> REPORT COULD NOT BE VERIFIED
              </div>
              <p className="text-xs text-red-700 mt-1">{verificationResult?.error || "Invalid verification token."}</p>
            </CardHeader>
            <CardContent className="p-6 text-center text-slate-500 text-xs">
              Please double check the verification link or barcode on your official MEDORA report slip.
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-slate-600 rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-1" /> Return to MEDORA Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
