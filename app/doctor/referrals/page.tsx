"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Share2, Users, Search, CheckCircle2, Building2, Stethoscope, Plus, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllReferrals } from "@/lib/data/referral-store";
import { ReferralService } from "@/lib/services/referral-service";
import { HealthcareReferral, ReferralPriority } from "@/types/database.types";

export default function DoctorReferralsPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<HealthcareReferral[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patientName, setPatientName] = useState("Rahul Verma");
  const [specialty, setSpecialty] = useState("Cardiology Specialist Evaluation");
  const [reason, setReason] = useState("Further evaluation for ST segment elevation and hypertension consultation.");
  const [priority, setPriority] = useState<ReferralPriority>("URGENT");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => {
    setReferrals(getAllReferrals());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreateReferral = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await ReferralService.finalizeReferral(
        "ENC-1001",
        {
          destination_type: "SPECIALTY",
          destination_specialty_name: specialty,
          priority,
          reason,
        },
        user
      );

      if (res.success && res.referral) {
        setMessage(`Created and finalized specialist referral ${res.referral.referral_reference}!`);
        setShowCreateModal(false);
        refresh();
      } else {
        setMessage(res.error || "Failed to create referral.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = referrals.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.patient_name.toLowerCase().includes(q) ||
      r.referral_reference.toLowerCase().includes(q) ||
      (r.destination_specialty_name || "").toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    );
  });

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-24 p-4 sm:p-6">
        <PageHeader
          title="Clinical Specialist Referrals Workspace"
          description="Issue and track inter-specialist referral handovers, sub-specialty consults, and hospital transfer recommendations."
          breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Referrals" }]}
          actions={
            <Button onClick={() => setShowCreateModal(true)} size="sm" className="bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs gap-1.5">
              <Plus className="h-4 w-4" /> Create Clinical Referral
            </Button>
          }
        />

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {message}
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search referrals by patient, reference ID, specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs h-9 rounded-xl border border-slate-200 pl-9 pr-3 text-slate-800"
            />
          </div>
        </div>

        {/* Referrals list */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Clinical Referrals ({filtered.length})</h2>
          {filtered.map((r) => (
            <Card key={r.id} className="bg-white rounded-2xl shadow-xs border-slate-200">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-950 text-xs">{r.referral_reference}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{r.destination_specialty_name}</Badge>
                    <Badge className={r.priority === "URGENT" ? "bg-amber-100 text-amber-800 text-[10px]" : "bg-sky-100 text-sky-800 text-[10px]"}>
                      {r.priority}
                    </Badge>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs font-bold text-slate-900">Patient: {r.patient_name} <span className="text-slate-400 font-mono text-[10px]">({r.patient_id})</span></p>
                  <p className="text-xs text-slate-600">{r.reason}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                    <span>Referring Doctor: <strong>{r.referring_doctor_name}</strong></span>
                    <span>•</span>
                    <span>Facility: <strong>{r.source_facility_name}</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 text-teal-800 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-teal-600" /> Create Specialist Referral Handoff
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Patient Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Destination Specialty / Department *</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Priority Level *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs h-9 rounded-xl border border-input px-3 mt-1 font-bold bg-white"
                  >
                    <option value="ROUTINE">ROUTINE</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Clinical Reason & Observations *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full text-xs rounded-xl border border-input p-3 mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)} className="text-xs rounded-xl">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateReferral} disabled={isSubmitting} className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl">
                  Finalize & Issue Referral
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
