"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Download,
  Activity,
  QrCode,
  AlertTriangle,
  User,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getLabReportById } from "@/lib/data/lab-order-store";
import { HealthcareLabReport } from "@/types/database.types";

export default function ReportViewerPage() {
  const params = useParams();
  const { user } = useAuth();
  const reportId = (params?.reportId as string) || "";

  const [report, setReport] = useState<HealthcareLabReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      const rpt = getLabReportById(reportId);
      setReport(rpt);
    }
    setLoading(false);
  }, [reportId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        <FileText className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
        Loading diagnostic report...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Report Unavailable</h2>
        <p className="text-slate-600 text-sm">No report record found for ID: {reportId}</p>
        <Link href="/patient/reports">
          <Button variant="outline">Back to Reports</Button>
        </Link>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["patient", "doctor", "lab_staff", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient/reports">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Reports
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono">{report.id}</h1>
                <Badge className="bg-emerald-600 text-white text-xs">FINALIZED V{report.version}</Badge>
              </div>
              <p className="text-xs text-slate-500">Laboratory: {report.laboratory_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </div>
        </div>

        {/* Diagnostic Report Document View */}
        <Card className="bg-white rounded-2xl shadow-md border-slate-200">
          <CardHeader className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 rounded-t-2xl">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700">{report.laboratory_name}</p>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">OFFICIAL DIAGNOSTIC REPORT</h2>
              <p className="text-xs text-slate-500 mt-1">Finalized on {report.released_at ? new Date(report.released_at).toLocaleDateString() : "N/A"}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
              <ShieldCheck className="h-6 w-6 text-purple-600 mx-auto" />
              <span className="text-[9px] font-bold text-purple-900 uppercase block mt-1">MEDORA VERIFIED</span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Provenance & Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Patient Name</span>
                <span className="font-bold text-slate-900">{report.patient_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Patient ID</span>
                <span className="font-mono font-bold text-purple-900">{report.patient_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Ordering Doctor</span>
                <span className="font-semibold text-slate-800">{report.ordering_provider_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Order Reference</span>
                <span className="font-mono text-slate-700">{report.lab_order_id}</span>
              </div>
            </div>

            {/* Results Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" /> Laboratory Measurements
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Test / Parameter</th>
                      <th className="p-3">Result Value</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Reference Range</th>
                      <th className="p-3">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.results.map((res, i) => (
                      <tr key={res.id || i} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{res.test_name}</td>
                        <td className="p-3 font-mono font-bold text-purple-950">{res.value}</td>
                        <td className="p-3 font-mono text-slate-600">{res.unit}</td>
                        <td className="p-3 text-slate-600">{res.reference_range}</td>
                        <td className="p-3">
                          <Badge className={res.flag === "NORMAL" ? "bg-emerald-600 text-white text-[9px]" : "bg-amber-600 text-white text-[9px]"}>
                            {res.flag}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clinical Notes & Verification */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Verified By</span>
                <span className="font-semibold text-slate-800">{report.verified_by_name || "Authorized Laboratory Verifier"}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">Authenticity Check</span>
                <Link href={`/verify/report/RPT-VERIFY-${report.id.replace("RPT-", "")}`}>
                  <span className="font-mono text-purple-700 hover:underline font-bold">Verify Online</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
