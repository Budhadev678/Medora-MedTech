"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Pill, 
  FileText, 
  Plus, 
  Building2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Sparkles,
  ChevronRight,
  Store,
  QrCode
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  HealthcarePrescription, 
  getPatientPrescriptions 
} from "@/lib/data/prescription-store";

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [prescriptions, setPrescriptions] = useState<HealthcarePrescription[]>([]);
  const [selectedRx, setSelectedRx] = useState<HealthcarePrescription | null>(null);

  const refreshPrescriptions = () => {
    if (!user) return;
    const data = getPatientPrescriptions(user.identifier || user.id, false);
    setPrescriptions(data);
  };

  useEffect(() => {
    refreshPrescriptions();
    const handleUpdate = () => refreshPrescriptions();
    window.addEventListener("medora-prescriptions-updated", handleUpdate);
    return () => window.removeEventListener("medora-prescriptions-updated", handleUpdate);
  }, [user]);

  const activePrescriptions = prescriptions.filter(p => p.status === "ISSUED");
  const pastPrescriptions = prescriptions.filter(p => p.status === "COMPLETED" || p.status === "CANCELLED" || p.status === "EXPIRED");

  const displayedPrescriptions = activeTab === "active" ? activePrescriptions : pastPrescriptions;

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Digital Prescriptions"
          description="Clinician-prescribed medications with dosage instructions, administration frequency, and open pharmacy choice."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Prescriptions" }]}
        />

        {/* Patient Freedom & Open Pharmacy Choice Banner */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
            <Store className="h-4 w-4 text-teal-700" />
            <span>Open Pharmacy Choice Guaranteed</span>
          </div>
          <p className="text-[11px] text-teal-800 leading-relaxed">
            In MEDORA, you are never locked to a hospital pharmacy. You may fulfill your digital prescription at any registered hospital pharmacy, local retail chemist, or licensed online pharmacy of your choice.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "active" ? "bg-white text-teal-800 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Active Regimen ({activePrescriptions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "past" ? "bg-white text-teal-800 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Past / Inactive Prescriptions ({pastPrescriptions.length})
          </button>
        </div>

        {/* Prescriptions List */}
        {displayedPrescriptions.length > 0 ? (
          <div className="space-y-3.5">
            {displayedPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      {rx.prescription_reference}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        rx.status === "ISSUED" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {rx.status}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {new Date(rx.issued_at || rx.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Doctor & Facility */}
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-slate-900 block text-sm">
                    {rx.prescriber_name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {rx.prescriber_role} • {rx.organization_name}
                  </span>
                </div>

                {/* Prescribed Medicines */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Prescribed Medicines ({rx.items.length})
                  </span>
                  <div className="space-y-2">
                    {rx.items.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">
                            {item.medicine_name} {item.strength && `(${item.strength})`}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {item.route}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-600">
                          <span><strong>Dosage:</strong> {item.dosage}</span>
                          <span><strong>Frequency:</strong> {item.frequency}</span>
                          <span><strong>Duration:</strong> {item.duration}</span>
                        </div>
                        {item.instructions && (
                          <p className="text-[11px] text-teal-800 font-medium pt-0.5">
                            <strong>Note:</strong> {item.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {rx.notes && (
                  <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg">
                    <strong>Doctor's Advice:</strong> {rx.notes}
                  </p>
                )}

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Digitally Certified</span>
                  </div>
                  <Link href={`/verify/rx/${rx.id}`} target="_blank">
                    <Button variant="outline" size="sm" className="text-xs font-bold text-teal-700 border-teal-200 hover:bg-teal-50 h-7 gap-1">
                      <QrCode className="h-3 w-3" />
                      <span>View QR Slip</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Pill className="h-6 w-6 text-teal-600" />}
            title={activeTab === "active" ? "No Active Prescriptions" : "No Past Prescriptions"}
            description="Prescriptions authored by your doctors during consultations will automatically appear here with verifiable QR slips."
            phase="Phase 4.3 — Prescription & Lab Order Foundation"
            actionHref="/patient"
            actionLabel="Return to Patient Home"
          />
        )}
      </div>
    </RoleGuard>
  );
}
