"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Activity,
  ArrowLeftRight,
  ShieldCheck,
  Stethoscope,
  Receipt,
  Plus
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { getFacilityById } from "@/lib/data/facility-store";
import { 
  HospitalAdmission, 
  HospitalBed, 
  getAllAdmissions, 
  getAllBeds, 
  getFacilityAdmissions,
  requestAdmission,
  acceptAdmission, 
  confirmAdmission, 
  transferBed, 
  initiateDischarge, 
  completeDischarge 
} from "@/lib/data/admission-store";
import { getFacilityBills } from "@/lib/data/billing-store";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";

export default function HospitalAdmissionsPage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode) || getFacilityById("FAC-1001");
  const targetFacId = facility?.facility_code || "FAC-1001";

  const [admissions, setAdmissions] = useState<HospitalAdmission[]>([]);
  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "inpatients" | "discharge" | "beds">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Admission Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqPatientId, setReqPatientId] = useState("PAT-1001");
  const [reqPatientName, setReqPatientName] = useState("Rahul Verma");
  const [reqDoctorName, setReqDoctorName] = useState("Dr. Ananya Sharma");
  const [reqDepartment, setReqDepartment] = useState("Cardiology");
  const [reqType, setReqType] = useState<"PLANNED" | "EMERGENCY" | "DAY_CARE">("PLANNED");
  const [reqReason, setReqReason] = useState("Inpatient telemetry monitoring and clinical stabilization");

  // Assign Bed Modal
  const [selectedAdmissionForBed, setSelectedAdmissionForBed] = useState<HospitalAdmission | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string>("");

  // Transfer Bed Modal
  const [transferModal, setTransferModal] = useState<HospitalAdmission | null>(null);
  const [transferNewBedId, setTransferNewBedId] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");

  // Discharge Modal
  const [dischargeModal, setDischargeModal] = useState<HospitalAdmission | null>(null);
  const [dischargeSummary, setDischargeSummary] = useState<string>("");

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    const admList = getFacilityAdmissions(targetFacId);
    setAdmissions(admList.length > 0 ? admList : getAllAdmissions());
    setBeds(getAllBeds(targetFacId));
    setTimeout(() => setIsRefreshing(false), 200);
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
  }, [targetFacId]);

  const pendingAdmissions = useMemo(
    () => admissions.filter((a) => a.status === "REQUESTED" || a.status === "ACCEPTED"),
    [admissions]
  );
  const activeInpatients = useMemo(
    () => admissions.filter((a) => a.status === "INPATIENT" || a.status === "ADMITTED"),
    [admissions]
  );
  const pendingDischarge = useMemo(
    () => admissions.filter((a) => a.status === "DISCHARGE_PENDING"),
    [admissions]
  );

  const availableBeds = useMemo(() => beds.filter((b) => b.status === "AVAILABLE"), [beds]);
  const occupiedBeds = useMemo(() => beds.filter((b) => b.status === "OCCUPIED"), [beds]);

  // ------------------------------------------------------------
  // 1. CREATE ADMISSION REQUEST
  // ------------------------------------------------------------
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqPatientId.trim() || !reqPatientName.trim() || !reqReason.trim()) {
      setFeedbackMsg({ type: "error", text: "Patient ID, Name, and Clinical Reason are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = requestAdmission({
        patientId: reqPatientId.trim().toUpperCase(),
        patientName: reqPatientName.trim(),
        doctorId: user?.identifier || user?.id || "DOC-1001",
        doctorName: reqDoctorName.trim(),
        departmentName: reqDepartment.trim(),
        facilityId: targetFacId,
        facilityName: facility?.name || "City Hospital",
        admissionType: reqType,
        reason: reqReason.trim(),
        actorId: user?.identifier || user?.id || "DOC-1001",
        actorName: user?.fullName || "Dr. Attending",
        actorRole: user?.role || "doctor",
      });

      if (res.success && res.admission) {
        setFeedbackMsg({
          type: "success",
          text: `Inpatient Admission Request #${res.admission.id} created for ${res.admission.patient_name}`,
        });
        setShowRequestModal(false);
        refreshData();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to create admission request." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // 2. ACCEPT ADMISSION REQUEST
  // ------------------------------------------------------------
  const handleAcceptRequest = (admId: string) => {
    if (!user) return;
    const res = acceptAdmission(admId, user.identifier || user.id, user.fullName, user.role);
    if (res.success) {
      setFeedbackMsg({ type: "success", text: `Admission request #${admId} accepted by hospital desk.` });
      refreshData();
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Failed to accept request." });
    }
  };

  // ------------------------------------------------------------
  // 3. ASSIGN BED & ADMIT
  // ------------------------------------------------------------
  const handleAssignBed = () => {
    if (!user || !selectedAdmissionForBed || !selectedBedId) {
      setFeedbackMsg({ type: "error", text: "Please select an available bed." });
      return;
    }
    const res = confirmAdmission({
      admissionId: selectedAdmissionForBed.id,
      bedId: selectedBedId,
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });
    if (res.success && res.admission) {
      setFeedbackMsg({
        type: "success",
        text: `Patient ${res.admission.patient_name} admitted to ${res.admission.ward_name} (${res.admission.room_number} - ${res.admission.bed_number})`,
      });
      setSelectedAdmissionForBed(null);
      setSelectedBedId("");
      refreshData();
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Failed to assign bed." });
    }
  };

  // ------------------------------------------------------------
  // 4. TRANSFER BED
  // ------------------------------------------------------------
  const handleTransferBed = () => {
    if (!user || !transferModal || !transferNewBedId) {
      setFeedbackMsg({ type: "error", text: "Please select a destination bed." });
      return;
    }
    const res = transferBed({
      admissionId: transferModal.id,
      newBedId: transferNewBedId,
      reason: transferReason.trim() || "Clinical ward / step-down transfer",
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });
    if (res.success && res.admission) {
      setFeedbackMsg({
        type: "success",
        text: `Patient ${res.admission.patient_name} transferred to ${res.admission.room_number} (${res.admission.bed_number})`,
      });
      setTransferModal(null);
      setTransferNewBedId("");
      setTransferReason("");
      refreshData();
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Failed to transfer bed." });
    }
  };

  // ------------------------------------------------------------
  // 5. INITIATE DISCHARGE
  // ------------------------------------------------------------
  const handleInitiateDischarge = (adm: HospitalAdmission) => {
    if (!user) return;
    const res = initiateDischarge(
      adm.id,
      user.identifier || user.id,
      user.fullName,
      user.role
    );
    if (res.success) {
      setFeedbackMsg({
        type: "success",
        text: `Discharge workflow initiated for ${adm.patient_name}. Record moved to Discharge Clearance Desk.`,
      });
      refreshData();
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Failed to initiate discharge." });
    }
  };

  // ------------------------------------------------------------
  // 6. COMPLETE DISCHARGE
  // ------------------------------------------------------------
  const handleCompleteDischarge = () => {
    if (!user || !dischargeModal) return;
    const res = completeDischarge({
      admissionId: dischargeModal.id,
      dischargeSummary: dischargeSummary.trim() || "Patient stabilized. Discharged with follow-up prescription advice.",
      actorId: user.identifier || user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });
    if (res.success && res.admission) {
      setFeedbackMsg({
        type: "success",
        text: `Discharge completed for ${res.admission.patient_name}. Inpatient stay closed and bed released.`,
      });
      setDischargeModal(null);
      setDischargeSummary("");
      refreshData();
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Failed to complete discharge." });
    }
  };

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "doctor", "receptionist"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200 max-w-7xl mx-auto pb-24 font-sans p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-teal-600" /> Inpatient Care & Bed Management
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-teal-50 text-teal-800 border-teal-200">
                {targetFacId}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold">
                <ShieldCheck className="h-3 w-3 inline mr-1 text-emerald-600" /> Multi-Ward Isolation (Step 4)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Clinical admission requests, bed assignments, ward movements, and multi-department discharge clearance • {facility?.name || "City Hospital"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowRequestModal(true)}
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-xs gap-1.5"
            >
              <Plus className="h-4 w-4" /> Request Inpatient Admission
            </Button>
            <Link href="/hospital/discharge">
              <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" /> Discharge Desk
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={refreshData} className="rounded-xl text-xs gap-1">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-teal-600" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Operational Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Admission Requests</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-amber-700 font-mono">{pendingAdmissions.length}</span>
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                Pending Desk
              </Badge>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">Active Inpatients</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-teal-950 font-mono">{activeInpatients.length}</span>
              <Badge variant="outline" className="text-[10px] bg-teal-100 text-teal-900 border-teal-300">
                In Ward Care
              </Badge>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Discharge Queue</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-blue-950 font-mono">{pendingDischarge.length}</span>
              <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-900 border-blue-300">
                Clearance Desk
              </Badge>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Bed Occupancy</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-slate-900 font-mono">
                {occupiedBeds.length} / {beds.length}
              </span>
              <Badge variant="outline" className="text-[10px] text-emerald-800 bg-emerald-50 border-emerald-200 font-bold">
                {availableBeds.length} Available
              </Badge>
            </div>
          </Card>
        </div>

        {/* Tab Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "pending"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Pending Requests ({pendingAdmissions.length})
            </button>

            <button
              onClick={() => setActiveTab("inpatients")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "inpatients"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Current Inpatients ({activeInpatients.length})
            </button>

            <button
              onClick={() => setActiveTab("discharge")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "discharge"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Discharge Clearance ({pendingDischarge.length})
            </button>

            <button
              onClick={() => setActiveTab("beds")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "beds"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Bed Occupancy Grid ({beds.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search patient, admission ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* TAB 1: PENDING ADMISSION REQUESTS */}
        {activeTab === "pending" && (
          <div className="space-y-3">
            {pendingAdmissions.length > 0 ? (
              pendingAdmissions.map((adm) => (
                <Card key={adm.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {adm.admission_reference}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          adm.admission_type === "EMERGENCY"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        {adm.admission_type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50 border-amber-200 font-bold">
                        ● {adm.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{adm.patient_name}</h3>
                      <span className="text-xs text-slate-500 font-mono">({adm.patient_id})</span>
                    </div>

                    <p className="text-slate-700 text-xs">
                      <strong>Clinical Indication:</strong> {adm.reason_for_admission}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Doctor: <strong>{adm.doctor_name}</strong> ({adm.department_name})</span>
                      <span>•</span>
                      <span>Requested: {new Date(adm.requested_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {adm.status === "REQUESTED" && (
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(adm.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-8 shadow-xs"
                      >
                        Accept Request
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedAdmissionForBed(adm);
                        setSelectedBedId(availableBeds[0]?.id || "");
                      }}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl h-8 shadow-xs"
                    >
                      Assign Bed & Admit →
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 space-y-1 bg-white rounded-2xl border border-slate-200">
                <Users className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">No pending admission requests</p>
                <p>New physician orders and emergency handoffs will appear here for administrative triage.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CURRENT INPATIENTS */}
        {activeTab === "inpatients" && (
          <div className="space-y-3">
            {activeInpatients.length > 0 ? (
              activeInpatients.map((adm) => (
                <Card key={adm.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {adm.admission_reference}
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-900 border-teal-200 font-bold">
                        ● INPATIENT STAY
                      </Badge>
                      <span className="font-mono text-[11px] text-purple-900 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {adm.ward_name} • {adm.room_number} ({adm.bed_number})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{adm.patient_name}</h3>
                      <span className="text-xs text-slate-500 font-mono">({adm.patient_id})</span>
                    </div>

                    <p className="text-slate-700 text-xs">
                      <strong>Diagnosis / Condition:</strong> {adm.reason_for_admission}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Attending Physician: <strong>{adm.doctor_name}</strong></span>
                      <span>•</span>
                      <span>Admitted: {new Date(adm.admitted_at || adm.created_at).toLocaleString()}</span>
                      {adm.movements && adm.movements.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-teal-700 font-bold">{adm.movements.length} Bed Transfer(s)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTransferModal(adm);
                        setTransferNewBedId(availableBeds[0]?.id || "");
                      }}
                      className="text-xs rounded-xl font-bold h-8 gap-1 text-slate-700"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" /> Transfer Bed
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleInitiateDischarge(adm)}
                      className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl h-8 shadow-xs gap-1"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Initiate Discharge
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 space-y-1 bg-white rounded-2xl border border-slate-200">
                <BedDouble className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">No active inpatients in wards</p>
                <p>Admitted patients assigned to physical hospital beds will be managed here.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DISCHARGE CLEARANCE */}
        {activeTab === "discharge" && (
          <div className="space-y-3">
            {pendingDischarge.length > 0 ? (
              pendingDischarge.map((adm) => (
                <Card key={adm.id} className="p-4 rounded-2xl border border-blue-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {adm.admission_reference}
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-900 border-blue-300 font-bold">
                        ● DISCHARGE CLEARANCE PENDING
                      </Badge>
                      <span className="font-mono text-[11px] text-slate-600">
                        {adm.ward_name} ({adm.bed_number})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{adm.patient_name}</h3>
                      <span className="text-xs text-slate-500 font-mono">({adm.patient_id})</span>
                    </div>

                    <p className="text-slate-700 text-xs">
                      <strong>Physician:</strong> {adm.doctor_name} • <strong>Discharge Initiated:</strong>{" "}
                      {adm.discharge_initiated_at ? new Date(adm.discharge_initiated_at).toLocaleTimeString() : "Today"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => {
                        setDischargeModal(adm);
                        setDischargeSummary(
                          `Patient ${adm.patient_name} medically stabilized. Completed inpatient care under ${adm.doctor_name}. Follow-up prescription provided.`
                        );
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl h-8 shadow-xs gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Finalize Discharge & Release Bed
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 space-y-1 bg-white rounded-2xl border border-slate-200">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-700">No patients pending discharge clearance</p>
                <p>All cleared patients have been safely discharged and physical beds returned to availability.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BED OCCUPANCY GRID */}
        {activeTab === "beds" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {beds.map((bed) => (
              <Card
                key={bed.id}
                className={`p-4 rounded-2xl border shadow-xs space-y-2 text-xs transition-all ${
                  bed.status === "OCCUPIED"
                    ? "bg-rose-50/40 border-rose-200"
                    : "bg-white border-slate-200 hover:border-teal-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">{bed.room_number}</span>
                  <Badge
                    variant={bed.status === "AVAILABLE" ? "default" : "emergency"}
                    className="text-[9px] uppercase font-bold"
                  >
                    {bed.status}
                  </Badge>
                </div>

                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">{bed.bed_number}</div>
                  <div className="text-[11px] text-slate-500">{bed.ward_name}</div>
                </div>

                {bed.status === "OCCUPIED" ? (
                  <div className="p-2 rounded-xl bg-white border border-rose-200 text-[11px] space-y-0.5">
                    <span className="text-slate-400 block text-[10px]">Current Patient:</span>
                    <strong className="text-slate-900 font-bold block">{bed.current_patient_name}</strong>
                    <span className="font-mono text-[10px] text-teal-700">{bed.current_admission_id}</span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-400 italic">
                    Ready for inpatient assignment
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Request Admission */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-teal-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Request Inpatient Admission</h3>
                </div>
                <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient ID *</label>
                  <input
                    type="text"
                    value={reqPatientId}
                    onChange={(e) => setReqPatientId(e.target.value)}
                    placeholder="e.g. PAT-1001"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    value={reqPatientName}
                    onChange={(e) => setReqPatientName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Attending Doctor *</label>
                    <input
                      type="text"
                      value={reqDoctorName}
                      onChange={(e) => setReqDoctorName(e.target.value)}
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Department *</label>
                    <input
                      type="text"
                      value={reqDepartment}
                      onChange={(e) => setReqDepartment(e.target.value)}
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Admission Type *</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value as any)}
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-medium"
                  >
                    <option value="PLANNED">PLANNED (Doctor Consultation / Scheduled Stay)</option>
                    <option value="EMERGENCY">EMERGENCY (Trauma / Acute Observation)</option>
                    <option value="DAY_CARE">DAY_CARE (Single Day Surgical / Medical Care)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clinical Indication / Reason *</label>
                  <textarea
                    rows={2}
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                    placeholder="Medical necessity for inpatient bed stay"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRequestModal(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Admission Request"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Assign Bed */}
        {selectedAdmissionForBed && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-teal-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Allocate Ward Bed & Admit</h3>
                </div>
                <button onClick={() => setSelectedAdmissionForBed(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900">{selectedAdmissionForBed.patient_name}</div>
                  <div className="text-[11px] text-slate-600">
                    Reason: {selectedAdmissionForBed.reason_for_admission}
                  </div>
                  <div className="text-[10px] text-teal-800 font-mono">
                    Req ID: {selectedAdmissionForBed.id} • Ref: {selectedAdmissionForBed.admission_reference}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Available Bed *</label>
                  {availableBeds.length > 0 ? (
                    <select
                      value={selectedBedId}
                      onChange={(e) => setSelectedBedId(e.target.value)}
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-bold"
                    >
                      {availableBeds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.ward_name} — {b.room_number} ({b.bed_number})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-rose-600 font-bold text-xs">
                      No beds currently available in this facility. Please step down existing inpatients or add beds.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAdmissionForBed(null)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignBed}
                    disabled={availableBeds.length === 0}
                    size="sm"
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Confirm Inpatient Admission
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Transfer Bed */}
        {transferModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-teal-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Transfer Inpatient Bed</h3>
                </div>
                <button onClick={() => setTransferModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900">{transferModal.patient_name}</div>
                  <div className="text-[11px] text-slate-600">
                    Current Bed: <strong>{transferModal.ward_name}</strong> ({transferModal.room_number} - {transferModal.bed_number})
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Destination Available Bed *</label>
                  {availableBeds.length > 0 ? (
                    <select
                      value={transferNewBedId}
                      onChange={(e) => setTransferNewBedId(e.target.value)}
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-bold"
                    >
                      {availableBeds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.ward_name} — {b.room_number} ({b.bed_number})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-rose-600 font-bold text-xs">No available destination beds.</p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clinical Transfer Reason *</label>
                  <input
                    type="text"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="e.g. Stepped down from ICU to step-down recovery"
                    className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTransferModal(null)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTransferBed}
                    disabled={availableBeds.length === 0}
                    size="sm"
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Execute Bed Transfer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Finalize Discharge */}
        {dischargeModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Finalize Inpatient Discharge</h3>
                </div>
                <button onClick={() => setDischargeModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900">{dischargeModal.patient_name}</div>
                  <div className="text-[11px] text-slate-600">
                    Releasing Bed: <strong>{dischargeModal.ward_name}</strong> ({dischargeModal.room_number} - {dischargeModal.bed_number})
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Clinical Discharge Summary / Advice *</label>
                  <textarea
                    rows={3}
                    value={dischargeSummary}
                    onChange={(e) => setDischargeSummary(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50"
                  />
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                  <strong>Bed Release:</strong> Finalizing discharge will close the inpatient record and immediately release the physical bed to AVAILABLE status.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDischargeModal(null)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCompleteDischarge}
                    size="sm"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Complete Discharge
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}