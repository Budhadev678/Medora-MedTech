"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Pill, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Ban, 
  X, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  HealthcarePrescription, 
  getDoctorPrescriptions, 
  cancelPrescription 
} from "@/lib/data/prescription-store";

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth();
  const doctorAffiliations = user?.doctorData?.affiliations?.filter(a => a.status === "active") || [];
  
  const [selectedOrgId, setSelectedOrgId] = useState<string>(() => {
    return doctorAffiliations[0]?.organizationIdentifier || doctorAffiliations[0]?.organizationId || "HSP-1001";
  });

  const [prescriptions, setPrescriptions] = useState<HealthcarePrescription[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ISSUED" | "DRAFT" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRx, setSelectedRx] = useState<HealthcarePrescription | null>(null);

  // Cancellation Modal
  const [showCancelModal, setShowCancelModal] = useState<HealthcarePrescription | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshPrescriptions = () => {
    if (!user) return;
    const data = getDoctorPrescriptions(user.identifier || user.id, selectedOrgId || undefined);
    setPrescriptions(data);
  };

  useEffect(() => {
    refreshPrescriptions();
    const handleUpdate = () => refreshPrescriptions();
    window.addEventListener("medora-prescriptions-updated", handleUpdate);
    return () => window.removeEventListener("medora-prescriptions-updated", handleUpdate);
  }, [user, selectedOrgId]);

  const filteredPrescriptions = prescriptions.filter(rx => {
    if (statusFilter !== "ALL" && rx.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPatient = rx.patient_name.toLowerCase().includes(q) || rx.patient_id.toLowerCase().includes(q);
      const matchRef = rx.prescription_reference.toLowerCase().includes(q);
      const matchMedicine = rx.items.some(i => i.medicine_name.toLowerCase().includes(q));
      if (!matchPatient && !matchRef && !matchMedicine) return false;
    }
    return true;
  });

  const handleCancelPrescription = () => {
    if (!user || !showCancelModal || !cancelReason.trim()) return;
    setIsSubmitting(true);
    const res = cancelPrescription(
      showCancelModal.id,
      cancelReason.trim(),
      user.identifier || user.id,
      user.fullName,
      user.role
    );
    setIsSubmitting(false);
    setShowCancelModal(null);
    setCancelReason("");
    if (res.success) {
      refreshPrescriptions();
      if (selectedRx?.id === showCancelModal.id) {
        setSelectedRx(res.prescription || null);
      }
    } else {
      alert(res.error || "Failed to cancel prescription.");
    }
  };

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Prescriptions Desk"
            description="Manage and review clinician-authorized medication orders issued during outpatient consultations."
            breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Prescriptions" }]}
          />
          <Link href="/doctor/consultations">
            <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold gap-2 text-xs shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Prescribe via Encounter</span>
            </Button>
          </Link>
        </div>

        {/* Facility Context Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 flex-shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Prescribing Facility Scope
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {doctorAffiliations.find(a => (a.organizationIdentifier === selectedOrgId || a.organizationId === selectedOrgId))?.organizationName || "City Hospital"}
              </span>
              <span className="text-[11px] font-mono text-teal-700 ml-2">({selectedOrgId})</span>
            </div>
          </div>

          {doctorAffiliations.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Switch Facility:</span>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                aria-label="Switch Facility"
                className="text-xs font-bold rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {doctorAffiliations.map(aff => (
                  <option key={aff.organizationIdentifier || aff.organizationId} value={aff.organizationIdentifier || aff.organizationId}>
                    {aff.organizationName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "ALL" ? "bg-slate-900 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Prescriptions ({prescriptions.length})
            </button>
            <button
              onClick={() => setStatusFilter("ISSUED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "ISSUED" ? "bg-teal-700 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Issued ({prescriptions.filter(r => r.status === "ISSUED").length})
            </button>
            <button
              onClick={() => setStatusFilter("DRAFT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "DRAFT" ? "bg-slate-800 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Drafts ({prescriptions.filter(r => r.status === "DRAFT").length})
            </button>
            <button
              onClick={() => setStatusFilter("CANCELLED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === "CANCELLED" ? "bg-red-700 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Cancelled ({prescriptions.filter(r => r.status === "CANCELLED").length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search medicine, patient, RX ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>

        {/* Prescriptions List */}
        {filteredPrescriptions.length > 0 ? (
          <div className="space-y-3">
            {filteredPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                      {rx.prescription_reference}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        rx.status === "ISSUED" 
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : rx.status === "DRAFT"
                          ? "bg-blue-50 text-blue-800 border-blue-300"
                          : "bg-red-50 text-red-800 border-red-300"
                      }`}
                    >
                      {rx.status}
                    </Badge>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Encounter: {rx.encounter_id}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(rx.issued_at || rx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{rx.patient_name}</h3>
                    <Badge variant="outline" className="text-[10px] font-mono text-slate-600">
                      {rx.patient_id}
                    </Badge>
                  </div>

                  {/* Medicines Preview */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {rx.items.map((item, idx) => (
                      <span key={idx} className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.medicine_name} {item.strength && `(${item.strength})`} — {item.dosage}, {item.frequency}
                      </span>
                    ))}
                  </div>

                  {rx.cancellation_reason && (
                    <p className="text-[11px] font-semibold text-red-700 bg-red-50 p-1.5 rounded border border-red-200">
                      <strong>Cancellation Reason:</strong> {rx.cancellation_reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRx(rx)}
                    className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 h-8"
                  >
                    View Details
                  </Button>
                  {rx.status === "ISSUED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCancelModal(rx);
                        setCancelReason("");
                      }}
                      className="text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 h-8"
                    >
                      Cancel RX
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Pill className="h-8 w-8 text-teal-600" />}
            title="No Prescriptions Found"
            description="Prescriptions authored during clinical encounters will aggregate here."
            actionLabel="Go to Encounter Workbench"
            actionHref="/doctor/consultations"
          />
        )}

        {/* ============================================================ */}
        {/* PRESCRIPTION DETAILS DRAWER / MODAL */}
        {/* ============================================================ */}
        {selectedRx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">
                        Prescription {selectedRx.prescription_reference}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          selectedRx.status === "ISSUED" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                        }`}
                      >
                        {selectedRx.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Encounter: {selectedRx.encounter_id} • Issued by {selectedRx.prescriber_name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRx(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-900 block">{selectedRx.patient_name} ({selectedRx.patient_id})</span>
                  <span className="text-slate-500 text-[11px]">
                    Prescribed at {selectedRx.organization_name} ({selectedRx.department_name}) on {new Date(selectedRx.issued_at || selectedRx.created_at).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                    Prescribed Medications ({selectedRx.items.length})
                  </span>
                  {selectedRx.items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          {item.medicine_name} {item.strength && `(${item.strength})`}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {item.route}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-slate-700 text-xs">
                        <span><strong>Dosage:</strong> {item.dosage}</span>
                        <span><strong>Frequency:</strong> {item.frequency}</span>
                        <span><strong>Duration:</strong> {item.duration}</span>
                      </div>
                      {item.instructions && (
                        <p className="text-[11px] text-teal-800 bg-teal-50/70 p-1.5 rounded font-medium mt-1">
                          <strong>Instructions:</strong> {item.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {selectedRx.notes && (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Clinician Advice / Notes</span>
                    <p className="text-slate-800 font-medium">{selectedRx.notes}</p>
                  </div>
                )}

                <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-900 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-teal-700" />
                    Cryptographic Provenance
                  </span>
                  <span className="font-mono text-[10px] text-teal-800">
                    Signed by {selectedRx.prescriber_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  size="sm"
                  onClick={() => setSelectedRx(null)}
                  className="bg-slate-900 text-white font-bold text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CANCEL PRESCRIPTION MODAL */}
        {/* ============================================================ */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <Ban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Cancel Electronic Prescription</h3>
                  <span className="text-xs text-slate-500">
                    {showCancelModal.prescription_reference} • {showCancelModal.patient_name}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Cancelling this prescription will revoke digital dispensing authorization and record a cancellation entry in the audit ledger.
              </p>

              <div className="space-y-1.5">
                <Label className="font-bold text-slate-900 text-xs">
                  Documented Cancellation Reason <span className="text-red-500">*</span>
                </Label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Dosage revision required after reviewing kidney function test."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(null)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleCancelPrescription}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
