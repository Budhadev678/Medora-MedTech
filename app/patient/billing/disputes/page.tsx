"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Building2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getDisputesByPatient } from "@/lib/data/dispute-store";
import { DisputeInvestigationService } from "@/lib/services/dispute-investigation-service";
import { FinancialDispute, DisputeCategory } from "@/types/database.types";

export default function PatientDisputePortalPage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<FinancialDispute[]>([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [billId, setBillId] = useState("BILL-1001");
  const [category, setCategory] = useState<DisputeCategory>("UNRECOGNIZED_CHARGE");
  const [description, setDescription] = useState("I would like to clarify the clinical reason and order source for this charge.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => {
    const patientId = user?.identifier || user?.id || "PAT-1001";
    const list = getDisputesByPatient(patientId);
    setDisputes(list);
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const handleFileDispute = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const patientId = user?.identifier || user?.id || "PAT-1001";
      const patientName = user?.fullName || "Rahul Verma";
      const res = DisputeInvestigationService.submitDispute({
        patientId,
        patientName,
        billId,
        category,
        description,
        actor: user,
      });

      if (res.success && res.dispute) {
        setMessage(`Submitted dispute ${res.dispute.dispute_number} successfully. Hospital investigation initiated.`);
        setShowFileModal(false);
        refresh();
      } else {
        setMessage(res.error || "Failed to submit dispute.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient/billing">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Bills
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-emerald-600" /> Patient Billing Questions & Dispute Center
              </h1>
              <p className="text-xs text-slate-500">File a billing question or inquiry with full evidence graph tracking</p>
            </div>
          </div>

          <Button onClick={() => setShowFileModal(true)} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs">
            <Plus className="h-4 w-4 mr-1" /> Ask Question / File Dispute
          </Button>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {message}
          </div>
        )}

        {/* Disputes List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Submitted Disputes & Inquiries</h2>
          {disputes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
              No active billing inquiries filed.
            </div>
          ) : (
            disputes.map((d) => (
              <Card key={d.id} className="bg-white rounded-2xl shadow-xs border-slate-200">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-950 text-xs">{d.dispute_number}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{d.category.replace(/_/g, " ")}</Badge>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-xs text-slate-700">{d.description}</p>
                    <span className="text-[10px] text-slate-400 font-mono">Bill: {d.bill_id} • Filed: {new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Modal: File Dispute */}
        {showFileModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 text-emerald-700 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-emerald-600" /> Ask Question / File Billing Dispute
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Bill ID *</label>
                  <input
                    type="text"
                    value={billId}
                    onChange={(e) => setBillId(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Question Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 bg-white font-semibold"
                  >
                    <option value="UNRECOGNIZED_CHARGE">I don't recognize this charge</option>
                    <option value="DUPLICATE_CHARGE">I was charged twice</option>
                    <option value="INCORRECT_AMOUNT">The amount looks wrong</option>
                    <option value="PAYMENT_NOT_RECORDED">I already paid this</option>
                    <option value="INSURANCE_COVERAGE_DISPUTE">My insurance coverage is missing</option>
                    <option value="REFUND_NOT_RECEIVED">I did not receive my refund</option>
                    <option value="OTHER">Something else</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Description / What seems wrong? *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full text-xs rounded-xl border border-input p-3 mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowFileModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleFileDispute} disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl">
                  Submit Question / Dispute
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
