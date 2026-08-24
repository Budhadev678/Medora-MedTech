"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BedDouble, 
  Users, 
  Search, 
  CheckCircle2, 
  Building2, 
  Clock, 
  ArrowRight, 
  Layers, 
  UserPlus, 
  LogOut, 
  RefreshCw,
  AlertCircle,
  X,
  FileText,
  Activity
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  HospitalAdmission, 
  HospitalBed, 
  getAllAdmissions, 
  getAllBeds, 
  acceptAdmission, 
  confirmAdmission, 
  transferBed, 
  initiateDischarge, 
  completeDischarge 
} from "@/lib/data/admission-store";

export default function HospitalAdmissionsPage() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState<HospitalAdmission[]>([]);
  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "inpatients" | "discharge" | "beds">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [selectedAdmissionForBed, setSelectedAdmissionForBed] = useState<HospitalAdmission | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string>("");
  const [transferModal, setTransferModal] = useState<HospitalAdmission | null>(null);
  const [transferNewBedId, setTransferNewBedId] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");
  const [dischargeModal, setDischargeModal] = useState<HospitalAdmission | null>(null);
  const [dischargeSummary, setDischargeSummary] = useState<string>("");

  const refreshData = () => {
    setAdmissions(getAllAdmissions());
    setBeds(getAllBeds());
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener("medora-admissions-updated", handleUpdate);
    window.addEventListener("medora-beds-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-admissions-updated", handleUpdate);
      window.removeEventListener("medora-beds-updated", handleUpdate);
    };
  }, []);

  const pendingAdmissions = admissions.filter(a => a.status === "REQUESTED" || a.status === "ACCEPTED");
  const activeInpatients = admissions.filter(a => a.status === "INPATIENT" || a.status === "ADMITTED");
  const pendingDischarge = admissions.filter(a => a.status === "DISCHARGE_PENDING");

  const handleAcceptRequest = (admId: string) => {
    if (!user) return;
    const res = acceptAdmission(admId, user.identifier || user.id, user.fullName, user.role);
    if (res.success) refreshData();
  };

  const handleAssignBed = () => {
    if (!user || !selectedAdmissionForBed || !selectedBedId) return;
    const res = confirmAdmission({
      admissionId: selectedAdmissionForBed.id,
      bedId: selectedBedId,
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });
    if (res.success) {
      setSelectedAdmissionForBed(null);
      setSelectedBedId("");
      refreshData();
    } else {
      alert(res.error || "Failed to assign bed.");
    }
  };

  const handleTransferBed = () => {
    if (!user || !transferModal || !transferNewBedId) return;
    const res = transferBed({
      admissionId: transferModal.id,
      newBedId: transferNewBedId,
      reason: transferReason.trim() || "Clinical ward transfer",
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });
    if (res.success) {
      setTransferModal(null);
      setTransferNewBedId("");
      setTransferReason("");
      refreshData();
    } else {
      alert(res.error || "Failed to transfer bed.");
    }
  };

  const handleCompleteDischarge = () => {
    if (!user || !dischargeModal) return;
    const res = completeDischarge({
      admissionId: dischargeModal.id,
      dischargeSummary: dischargeSummary.trim() || "Patient condition stabilized. Discharged with follow-up advice.",
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });
    if (res.success) {
      setDischargeModal(null);
      setDischargeSummary("");
      refreshData();
    } else {
      alert(res.error || "Failed to complete discharge.");
    }
  };

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150 max-w-7xl mx-auto pb-24 p-4 sm:p-6">
        <PageHeader
          title="Inpatient Ward & Admissions Command"
          description="Manage clinical admission requests, bed assignments, inpatient movements, and discharge clearance."
          breadcrumbs={[{ label: "Hospital", href: "/hospital" }, { label: "Admissions" }]}
        />

        {/* Operational Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Admission Requests</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-amber-700">{pendingAdmissions.length}</span>
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">Pending</Badge>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Active Inpatients</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-teal-800">{activeInpatients.length}</span>
              <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-800 border-teal-200">In Ward</Badge>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Discharge Queue</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-blue-700">{pendingDischarge.length}</span>
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-800 border-blue-200">Pending</Badge>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Bed Occupancy</span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-slate-900">
                {beds.filter(b => b.status === "OCCUPIED").length} / {beds.length}
              </span>
              <Badge variant="outline" className="text-[10px] text-slate-600">
                {beds.filter(b => b.status === "AVAILABLE").length} free
              </Badge>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "pending" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Pending Requests ({pendingAdmissions.length})
            </button>
            <button
              onClick={() => setActiveTab("inpatients")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "inpatients" ? "bg-teal-700 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Current Inpatients ({activeInpatients.length})
            </button>
            <button
              onClick={() => setActiveTab("discharge")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "discharge" ? "bg-blue-700 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Discharge Clearance ({pendingDischarge.length})
            </button>
            <button
              onClick={() => setActiveTab("beds")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "beds" ? "bg-slate-700 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Bed Availability ({beds.length})
            </button>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search patient, admission ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        {/* TAB 1: PENDING REQUESTS */}
        {activeTab === "pending" && (
          <div className="space-y-3">
            {pendingAdmissions.length > 0 ? (
              pendingAdmissions.map((adm) => (
                <div key={adm.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {adm.admission_reference}
                      </span>
                      <Badge variant="outline" className={`text-[10px] font-bold ${adm.admission_type === "EMERGENCY" ? "bg-red-50 text-red-800 border-red-200" : "bg-blue-50 text-blue-800 border-blue-200"}`}>
                        {adm.admission_type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50">
                        {adm.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{adm.patient_name}</h3>
                      <span className="text-xs text-slate-500 font-mono">({adm.patient_id})</span>
                    </div>
                    <p className="text-xs text-slate-700">
                      <strong>Reason:</strong> {adm.reason_for_admission}
                    </p>
                    <span className="text-[11px] text-slate-500 block">
                      Requested by {adm.doctor_name} ({adm.department_name}) on {new Date(adm.requested_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {adm.status === "REQUESTED" && (
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(adm.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8"
                      >
                        Accept Request
                      </Button>
                    )}
                    {adm.status === "ACCEPTED" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAdmissionForBed(adm);
                          setSelectedBedId(beds.find(b => b.status === "AVAILABLE")?.id || "");
                        }}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-8"
                      >
                        Assign Bed & Admit
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<UserPlus className="h-8 w-8 text-teal-600" />}
                title="No Pending Admission Requests"
                description="Clinical admission orders requested by attending physicians will appear here."
              />
            )}
          </div>
        )}

        {/* TAB 2: INPATIENTS */}
        {activeTab === "inpatients" && (
          <div className="space-y-3">
            {activeInpatients.length > 0 ? (
              activeInpatients.map((adm) => (
                <div key={adm.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {adm.admission_reference}
                      </span>
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                        INPATIENT
                      </Badge>
                      <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {adm.ward_name} • {adm.room_number} • {adm.bed_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{adm.patient_name}</h3>
                      <span className="text-xs text-slate-500 font-mono">({adm.patient_id})</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Attending: <strong>{adm.doctor_name}</strong> • Admitted: {new Date(adm.admitted_at || adm.created_at).toLocaleString("en-IN")}
                    </span>

                    {adm.movements && adm.movements.length > 0 && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                        <strong>Transfers:</strong> {adm.movements.map(m => `${m.previous_bed} → ${m.new_bed}`).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTransferModal(adm);
                        setTransferNewBedId(beds.find(b => b.status === "AVAILABLE")?.id || "");
                        setTransferReason("");
                      }}
                      className="text-xs font-bold text-slate-700 h-8"
                    >
                      Transfer Bed
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!user) return;
                        initiateDischarge(adm.id, user.identifier || user.id, user.fullName, user.role);
                        refreshData();
                      }}
                      className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs h-8"
                    >
                      Initiate Discharge
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<BedDouble className="h-8 w-8 text-teal-600" />}
                title="No Current Inpatients"
                description="Patients currently admitted to inpatient wards will appear here."
              />
            )}
          </div>
        )}

        {/* TAB 3: DISCHARGE QUEUE */}
        {activeTab === "discharge" && (
          <div className="space-y-3">
            {pendingDischarge.length > 0 ? (
              pendingDischarge.map((adm) => (
                <div key={adm.id} className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                        {adm.admission_reference}
                      </span>
                      <Badge className="bg-blue-100 text-blue-900 border-blue-300 text-[10px] font-bold">
                        DISCHARGE PENDING
                      </Badge>
                      <span className="text-xs text-slate-600 font-medium">
                        Bed: {adm.room_number} • {adm.bed_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{adm.patient_name}</h3>
                      <span className="text-xs text-slate-500 font-mono">({adm.patient_id})</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Discharge initiated on {new Date(adm.discharge_initiated_at || adm.updated_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                      size="sm"
                      onClick={() => {
                        setDischargeModal(adm);
                        setDischargeSummary("");
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-8"
                    >
                      Clear & Complete Discharge
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<LogOut className="h-8 w-8 text-blue-600" />}
                title="No Patients Pending Discharge"
                description="Inpatients with physician discharge clearance will appear here for administrative wrap-up."
              />
            )}
          </div>
        )}

        {/* TAB 4: BED AVAILABILITY */}
        {activeTab === "beds" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {beds.map((bed) => (
              <div key={bed.id} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{bed.ward_name}</span>
                  <Badge variant="outline" className={`text-[10px] font-bold ${bed.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-800 border-red-300"}`}>
                    {bed.status}
                  </Badge>
                </div>
                <div className="text-sm font-extrabold text-slate-800">
                  {bed.room_number} • {bed.bed_number}
                </div>
                {bed.current_patient_name && (
                  <span className="text-xs text-slate-600 block">
                    Occupant: <strong>{bed.current_patient_name}</strong> ({bed.current_admission_id})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MODAL: ASSIGN BED */}
        {selectedAdmissionForBed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-slate-900">Assign Bed & Confirm Admission</h3>
                <button onClick={() => setSelectedAdmissionForBed(null)}><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <p>Admitting patient <strong>{selectedAdmissionForBed.patient_name}</strong> for {selectedAdmissionForBed.reason_for_admission}.</p>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-900">Select Available Bed</Label>
                  <select
                    value={selectedBedId}
                    onChange={(e) => setSelectedBedId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                  >
                    {beds.filter(b => b.status === "AVAILABLE").map(b => (
                      <option key={b.id} value={b.id}>{b.ward_name} — {b.room_number} ({b.bed_number})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedAdmissionForBed(null)}>Cancel</Button>
                <Button size="sm" onClick={handleAssignBed} className="bg-teal-700 text-white font-bold">Confirm Bed Assignment</Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TRANSFER BED */}
        {transferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-slate-900">Inpatient Bed Transfer</h3>
                <button onClick={() => setTransferModal(null)}><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <p>Transferring <strong>{transferModal.patient_name}</strong> from {transferModal.room_number} ({transferModal.bed_number}).</p>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-900">Select Destination Bed</Label>
                  <select
                    value={transferNewBedId}
                    onChange={(e) => setTransferNewBedId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                  >
                    {beds.filter(b => b.status === "AVAILABLE").map(b => (
                      <option key={b.id} value={b.id}>{b.ward_name} — {b.room_number} ({b.bed_number})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-900">Transfer Reason</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Stepped down from ICU to General Ward"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setTransferModal(null)}>Cancel</Button>
                <Button size="sm" onClick={handleTransferBed} className="bg-teal-700 text-white font-bold">Confirm Transfer</Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: COMPLETE DISCHARGE */}
        {dischargeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-slate-900">Finalize Inpatient Discharge</h3>
                <button onClick={() => setDischargeModal(null)}><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <p>Completing discharge for <strong>{dischargeModal.patient_name}</strong> will release bed <strong>{dischargeModal.bed_number}</strong> and close the inpatient encounter.</p>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-900">Discharge Summary & Instructions</Label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Stable vitals, discharged on oral antihypertensives. Follow-up in 2 weeks."
                    value={dischargeSummary}
                    onChange={(e) => setDischargeSummary(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setDischargeModal(null)}>Cancel</Button>
                <Button size="sm" onClick={handleCompleteDischarge} className="bg-emerald-700 text-white font-bold">Finalize Discharge</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}