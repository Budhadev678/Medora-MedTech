"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  ChevronRight,
  Share2,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getPatientLabReports, getReportSharesForPatient, revokeReportShare } from "@/lib/data/lab-order-store";
import { LabReportService } from "@/lib/services/lab-report-service";
import { HealthcareLabReport } from "@/types/database.types";

export default function PatientReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<HealthcareLabReport[]>([]);
  const [shares, setShares] = useState<any[]>([]);

  // Share modal state
  const [selectedReport, setSelectedReport] = useState<HealthcareLabReport | null>(null);
  const [recipientName, setRecipientName] = useState("Dr. Ananya Sharma");
  const [recipientId, setRecipientId] = useState("DOC-1001");
  const [permission, setPermission] = useState<"VIEW" | "DOWNLOAD">("VIEW");
  const [durationHours, setDurationHours] = useState(24);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  const refresh = () => {
    const patientId = user?.identifier || user?.id || "PAT-1001";
    const rpts = getPatientLabReports(patientId, false);
    setReports(rpts);
    setShares(getReportSharesForPatient(patientId));
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const handleCreateShare = async () => {
    if (!selectedReport) return;
    setShareSuccess(null);
    const res = await LabReportService.shareReport(
      selectedReport.id,
      recipientId,
      recipientName,
      permission,
      durationHours,
      user
    );

    if (res.success) {
      setShareSuccess(`Shared report ${selectedReport.id} with ${recipientName} for ${durationHours} hours.`);
      setShowShareModal(false);
      refresh();
    }
  };

  const handleRevokeShare = (shareId: string) => {
    const patientId = user?.identifier || user?.id || "PAT-1001";
    revokeReportShare(shareId, patientId);
    refresh();
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Portal
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" /> My Diagnostic Reports
              </h1>
              <p className="text-xs text-slate-500">Official, verified laboratory diagnostic reports & record sharing</p>
            </div>
          </div>
        </div>

        {shareSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {shareSuccess}
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Finalized Diagnostic Reports</h2>
          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
              No released laboratory reports found for your profile.
            </div>
          ) : (
            reports.map((rpt) => (
              <Card key={rpt.id} className="bg-white rounded-2xl shadow-xs border-slate-200 hover:border-purple-200 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-950 text-xs">{rpt.id}</span>
                      <Badge className="bg-emerald-600 text-white text-[9px]">FINALIZED V{rpt.version}</Badge>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{rpt.laboratory_name}</p>
                    <p className="text-[10px] text-slate-500">
                      Finalized: {rpt.released_at ? new Date(rpt.released_at).toLocaleDateString() : "N/A"} • Doctor: {rpt.ordering_provider_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setSelectedReport(rpt);
                        setShowShareModal(true);
                      }}
                      size="sm"
                      variant="outline"
                      className="text-purple-700 border-purple-300 font-bold rounded-xl text-xs"
                    >
                      <Share2 className="h-4 w-4 mr-1 text-purple-600" /> Share
                    </Button>
                    <Link href={`/reports/${rpt.id}`}>
                      <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs">
                        <Eye className="h-4 w-4 mr-1" /> View Report
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Active Shares List */}
        {shares.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Record Grants & Shares</h2>
            <div className="space-y-2">
              {shares.map((s) => (
                <div key={s.id} className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{s.recipient_name}</span>
                      <Badge variant="outline" className="text-[9px]">{s.permission}</Badge>
                      <Badge className={s.status === "ACTIVE" ? "bg-emerald-600 text-white text-[9px]" : "bg-slate-400 text-white text-[9px]"}>
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Report {s.report_id} • Expires: {new Date(s.expires_at).toLocaleString()}</p>
                  </div>

                  {s.status === "ACTIVE" && (
                    <Button
                      onClick={() => handleRevokeShare(s.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-700 hover:bg-red-50 text-xs rounded-xl"
                    >
                      Revoke Access
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Share Report */}
        {showShareModal && selectedReport && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-purple-600" /> Share Report {selectedReport.id}
              </h3>
              <p className="text-xs text-slate-600">Grant time-bound access to doctor or healthcare provider.</p>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700">Recipient Name *</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700">Access Duration (Hours) *</label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseInt(e.target.value))}
                    className="w-full text-xs h-9 rounded-xl border border-input px-2 mt-1 bg-white"
                  >
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={72}>72 Hours (3 Days)</option>
                    <option value={168}>7 Days</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowShareModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateShare} className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl">
                  Grant Access
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
