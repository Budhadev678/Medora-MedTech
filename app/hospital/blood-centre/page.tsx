"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Droplet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  Plus,
  RefreshCw,
  X,
  FileText,
  Building2,
  Activity,
  Layers,
  ArrowRight,
  Archive,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getFacilityById } from "@/lib/data/facility-store";
import {
  BloodGroup,
  BloodComponentType,
  HospitalBloodUnit,
  HospitalBloodRequest,
  getAllBloodUnits,
  getAllBloodRequests,
  getBloodInventorySummary,
  getBloodCentre,
  reserveBloodUnit,
  issueBloodUnits,
  quarantineBloodUnit,
  discardBloodUnit,
  saveBloodUnits
} from "@/lib/data/blood-centre-store";

export default function HospitalBloodCentrePage() {
  const { user } = useAuth();
  const facilityCode = user?.identifier || user?.organizationId || "FAC-1001";
  const facility = getFacilityById(facilityCode) || getFacilityById("FAC-1001");
  const targetFacId = facility?.facility_code || "FAC-1001";

  const [units, setUnits] = useState<HospitalBloodUnit[]>([]);
  const [requests, setRequests] = useState<HospitalBloodRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"inventory" | "requests" | "units" | "alerts">("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals State
  const [reserveModalRequest, setReserveModalRequest] = useState<HospitalBloodRequest | null>(null);
  const [selectedUnitIdForReserve, setSelectedUnitIdForReserve] = useState<string>("");

  const [quarantineModalUnit, setQuarantineModalUnit] = useState<HospitalBloodUnit | null>(null);
  const [quarantineReason, setQuarantineReason] = useState("");

  const [discardModalUnit, setDiscardModalUnit] = useState<HospitalBloodUnit | null>(null);
  const [discardReason, setDiscardReason] = useState("");

  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newGroup, setNewGroup] = useState<BloodGroup>("O+");
  const [newComponent, setNewComponent] = useState<BloodComponentType>("PACKED_RBC");
  const [newVolume, setNewVolume] = useState<number>(350);
  const [newStorage, setNewStorage] = useState<string>("Cold Vault A - Rack 1");

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bloodCentre = useMemo(() => getBloodCentre(targetFacId), [targetFacId]);

  const refreshData = () => {
    setIsRefreshing(true);
    setUnits(getAllBloodUnits(targetFacId));
    setRequests(getAllBloodRequests(targetFacId));
    setTimeout(() => setIsRefreshing(false), 200);
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener("medora-blood-units-updated", handleUpdate);
    window.addEventListener("medora-blood-requests-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-blood-units-updated", handleUpdate);
      window.removeEventListener("medora-blood-requests-updated", handleUpdate);
    };
  }, [targetFacId]);

  const summary = useMemo(() => getBloodInventorySummary(targetFacId), [targetFacId, units]);

  const emergencyRequests = useMemo(
    () => requests.filter((r) => r.priority === "EMERGENCY" && r.status !== "COMPLETED" && r.status !== "CANCELLED"),
    [requests]
  );
  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "REQUESTED" || r.status === "RESERVED"),
    [requests]
  );

  const expiringUnits = useMemo(() => {
    const now = new Date();
    const soon = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // within 15 days
    return units.filter((u) => {
      const exp = new Date(u.expiry_date);
      return exp > now && exp <= soon && u.status === "AVAILABLE";
    });
  }, [units]);

  const filteredUnits = useMemo(() => {
    let list = units;
    if (groupFilter !== "ALL") {
      list = list.filter((u) => u.blood_group === groupFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.unit_code.toLowerCase().includes(q) ||
          u.blood_group.toLowerCase().includes(q) ||
          u.component_type.toLowerCase().includes(q) ||
          u.storage_location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [units, groupFilter, searchQuery]);

  // ------------------------------------------------------------
  // 1. RESERVE UNIT FOR REQUEST
  // ------------------------------------------------------------
  const handleExecuteReserve = () => {
    if (!reserveModalRequest || !selectedUnitIdForReserve || !user) return;

    setIsSubmitting(true);
    try {
      const res = reserveBloodUnit({
        requestId: reserveModalRequest.id,
        unitId: selectedUnitIdForReserve,
        actorId: user.identifier || user.id,
        actorName: user.fullName,
        actorRole: user.role,
      });

      if (res.success && res.unit) {
        setFeedbackMsg({
          type: "success",
          text: `Unit ${res.unit.unit_code} (${res.unit.blood_group}) reserved for request #${reserveModalRequest.request_number}`,
        });
        setReserveModalRequest(null);
        setSelectedUnitIdForReserve("");
        refreshData();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to reserve unit." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // 2. ISSUE RESERVED UNITS
  // ------------------------------------------------------------
  const handleExecuteIssue = (req: HospitalBloodRequest) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const res = issueBloodUnits({
        requestId: req.id,
        actorId: user.identifier || user.id,
        actorName: user.fullName,
        actorRole: user.role,
      });

      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: `Issued blood units for ${req.patient_name} (Request #${req.request_number}). Clinical team notified.`,
        });
        refreshData();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to issue blood units." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // 3. QUARANTINE UNIT
  // ------------------------------------------------------------
  const handleExecuteQuarantine = () => {
    if (!quarantineModalUnit || !user || !quarantineReason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = quarantineBloodUnit({
        unitId: quarantineModalUnit.id,
        reason: quarantineReason.trim(),
        actorId: user.identifier || user.id,
        actorName: user.fullName,
        actorRole: user.role,
      });

      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: `Unit ${quarantineModalUnit.unit_code} placed in quarantine. Locked from general distribution.`,
        });
        setQuarantineModalUnit(null);
        setQuarantineReason("");
        refreshData();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to quarantine unit." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // 4. DISCARD UNIT
  // ------------------------------------------------------------
  const handleExecuteDiscard = () => {
    if (!discardModalUnit || !user || !discardReason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = discardBloodUnit({
        unitId: discardModalUnit.id,
        reason: discardReason.trim(),
        actorId: user.identifier || user.id,
        actorName: user.fullName,
        actorRole: user.role,
      });

      if (res.success) {
        setFeedbackMsg({
          type: "success",
          text: `Unit ${discardModalUnit.unit_code} discarded with audit reason recorded.`,
        });
        setDiscardModalUnit(null);
        setDiscardReason("");
        refreshData();
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Failed to discard unit." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // 5. INTAKE NEW TESTED UNIT
  // ------------------------------------------------------------
  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const allUnits = getAllBloodUnits();
      const now = new Date();
      const exp = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000); // 35 days for RBC
      const newId = `UNIT-${1000 + allUnits.length + 1}`;
      const code = `BLD-${newGroup.replace("+", "POS").replace("-", "NEG")}-${1000 + allUnits.length + 1}`;

      const newUnit: HospitalBloodUnit = {
        id: newId,
        unit_code: code,
        hospital_id: targetFacId,
        blood_centre_id: bloodCentre?.id || "BLC-1001",
        blood_group: newGroup,
        rh_type: newGroup.includes("+") ? "POSITIVE" : "NEGATIVE",
        component_type: newComponent,
        volume_ml: newVolume,
        collection_date: now.toISOString(),
        expiry_date: exp.toISOString(),
        status: "AVAILABLE",
        storage_location: newStorage,
        history: [
          {
            id: `EVT-${Date.now()}`,
            unit_id: newId,
            timestamp: now.toISOString(),
            actor_id: user.identifier || user.id,
            actor_name: user.fullName,
            action: "TESTED_AND_ACCESSIONED",
            new_status: "AVAILABLE",
            notes: "Accessioned into hospital cold storage inventory.",
          },
        ],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      allUnits.unshift(newUnit);
      saveBloodUnits(allUnits);

      setFeedbackMsg({
        type: "success",
        text: `Blood unit ${code} (${newGroup} ${newComponent}) accessioned into inventory.`,
      });
      setShowAddUnitModal(false);
      refreshData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const bloodGroupsList: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin", "blood_staff", "doctor", "emergency_staff"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200 max-w-7xl mx-auto pb-24 font-sans p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Droplet className="h-5 w-5 text-rose-600 fill-rose-600" /> Hospital Blood Centre & Transfusion Desk
              </h1>
              <Badge variant="outline" className="text-xs font-mono bg-rose-50 text-rose-800 border-rose-200 font-bold">
                {targetFacId}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold">
                <ShieldCheck className="h-3 w-3 inline mr-1 text-emerald-600" /> Official Hospital Module
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time blood stock inventory, emergency clinical requests, cross-matching & cold-vault traceability • {facility?.name || "City Hospital"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddUnitModal(true)}
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs gap-1.5"
            >
              <Plus className="h-4 w-4" /> Accession Tested Unit
            </Button>
            <Button size="sm" variant="outline" onClick={refreshData} className="rounded-xl text-xs gap-1">
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-rose-600" : ""}`} /> Refresh
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

        {/* Emergency Blood Alerts Banner */}
        {emergencyRequests.length > 0 && (
          <Card className="bg-rose-500 text-white p-4 rounded-2xl shadow-md border-0 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-white shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide flex items-center gap-2">
                    🚨 URGENT EMERGENCY BLOOD REQUESTS ({emergencyRequests.length} PENDING)
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5">
                    Critical trauma patients in ER require immediate blood component release.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("requests")}
                className="bg-white text-rose-700 px-3.5 py-1.5 rounded-xl font-black text-xs shadow-xs hover:bg-rose-50 transition-colors shrink-0"
              >
                Respond Immediately →
              </button>
            </div>
          </Card>
        )}

        {/* 4-Stat Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Available Units</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-emerald-700 font-mono">{summary.totalAvailable}</span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                Cold Storage
              </Badge>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Reserved Units</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-amber-950 font-mono">{summary.totalReserved}</span>
              <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-900 border-amber-300 font-bold">
                Locked
              </Badge>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">Quarantine / Hold</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-purple-950 font-mono">{summary.totalQuarantined}</span>
              <Badge variant="outline" className="text-[10px] bg-purple-100 text-purple-900 border-purple-300 font-bold">
                Quality Review
              </Badge>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Expiring / Expired</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-rose-950 font-mono">
                {expiringUnits.length + summary.totalExpired}
              </span>
              <Badge variant="outline" className="text-[10px] bg-rose-100 text-rose-900 border-rose-300 font-bold">
                {expiringUnits.length} Soon
              </Badge>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "inventory"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Blood Group Inventory Grid
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "requests"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Clinical Blood Requests ({pendingRequests.length})
            </button>

            <button
              onClick={() => setActiveTab("units")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "units"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Traceable Units Ledger ({units.length})
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "alerts"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Expiring & Quarantine Alerts ({expiringUnits.length + summary.totalQuarantined})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search code, group, component..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* TAB 1: BLOOD GROUP INVENTORY GRID */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {bloodGroupsList.map((bg) => {
                const data = summary.byGroup[bg];
                const isLow = data.available <= 1;
                return (
                  <Card
                    key={bg}
                    className={`p-4 rounded-2xl border transition-all ${
                      isLow ? "bg-amber-50/40 border-amber-300" : "bg-white border-slate-200 hover:border-rose-300"
                    } shadow-xs space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-rose-100 text-rose-800 font-black text-sm">
                          {bg}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {bg.includes("+") ? "Rh Positive" : "Rh Negative"}
                        </span>
                      </div>
                      {isLow && (
                        <Badge variant="warning" className="text-[9px] font-black uppercase">
                          Low Stock
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Available</span>
                        <span className="font-mono font-black text-emerald-700 text-base">{data.available}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Reserved</span>
                        <span className="font-mono font-bold text-amber-700 text-base">{data.reserved}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CLINICAL BLOOD REQUESTS */}
        {activeTab === "requests" && (
          <div className="space-y-3">
            {requests.length > 0 ? (
              requests.map((req) => (
                <Card
                  key={req.id}
                  className={`p-4 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors ${
                    req.priority === "EMERGENCY"
                      ? "bg-rose-50/70 border-rose-300"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                        {req.request_number}
                      </span>
                      <Badge
                        variant={req.priority === "EMERGENCY" ? "emergency" : req.priority === "URGENT" ? "warning" : "default"}
                        className="text-[10px] font-black uppercase"
                      >
                        ● {req.priority} PRIORITY
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-slate-50 font-bold">
                        {req.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{req.patient_name}</h3>
                      <span className="text-xs text-slate-500 font-mono">({req.patient_id})</span>
                    </div>

                    <p className="text-slate-700 text-xs">
                      <strong>Requirement:</strong> {req.units_requested}x Unit(s) of{" "}
                      <strong className="text-rose-700">{req.blood_group}</strong> ({req.component_type}) •{" "}
                      <strong>Clinical Indication:</strong> {req.clinical_indication}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Doctor: <strong>{req.doctor_name}</strong></span>
                      <span>•</span>
                      <span>Requested: {new Date(req.requested_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {req.reserved_unit_ids.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-800 font-bold">{req.reserved_unit_ids.length} Unit(s) Reserved</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === "REQUESTED" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setReserveModalRequest(req);
                          const eligible = units.find(
                            (u) => u.blood_group === req.blood_group && u.status === "AVAILABLE"
                          );
                          setSelectedUnitIdForReserve(eligible?.id || "");
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl h-8 shadow-xs"
                      >
                        Reserve Unit →
                      </Button>
                    )}

                    {req.status === "RESERVED" && (
                      <Button
                        size="sm"
                        onClick={() => handleExecuteIssue(req)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl h-8 shadow-xs gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Issue for Transfusion
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 space-y-1 bg-white rounded-2xl border border-slate-200">
                <Droplet className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">No pending blood requests</p>
                <p>New physician orders from Operating Rooms, Wards, and Emergency will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRACEABLE UNITS LEDGER */}
        {activeTab === "units" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-600">Filter Blood Group:</span>
              {["ALL", ...bloodGroupsList].map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupFilter(g)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                    groupFilter === g
                      ? "bg-rose-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <Card className="bg-white border-slate-200 shadow-xs rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                {filteredUnits.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {filteredUnits.map((u) => (
                      <div
                        key={u.id}
                        className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-rose-950 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {u.unit_code}
                            </span>
                            <span className="font-black text-rose-700 text-sm">{u.blood_group}</span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {u.component_type}
                            </Badge>
                            <Badge
                              variant={
                                u.status === "AVAILABLE"
                                  ? "default"
                                  : u.status === "RESERVED"
                                  ? "warning"
                                  : u.status === "ISSUED"
                                  ? "teal"
                                  : "emergency"
                              }
                              className="text-[10px] uppercase font-bold"
                            >
                              ● {u.status}
                            </Badge>
                          </div>

                          <p className="text-slate-600 text-[11px]">
                            Volume: <strong>{u.volume_ml} mL</strong> • Location: <strong>{u.storage_location}</strong> • Collected:{" "}
                            {new Date(u.collection_date).toLocaleDateString()}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono">
                            <span>Expires: {new Date(u.expiry_date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{u.history.length} audit lifecycle event(s) recorded</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {u.status === "AVAILABLE" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setQuarantineModalUnit(u);
                                  setQuarantineReason("Serology confirmation review hold");
                                }}
                                className="text-xs rounded-xl font-bold h-8 text-purple-700 border-purple-200 hover:bg-purple-50"
                              >
                                <Archive className="h-3.5 w-3.5 mr-1" /> Quarantine
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDiscardModalUnit(u);
                                  setDiscardReason("Expired shelf-life / quality integrity compromise");
                                }}
                                className="text-xs rounded-xl font-bold h-8 text-rose-700 border-rose-200 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Discard
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-1">
                    <Droplet className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">No blood units matching filter criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: ALERTS */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Expiring Units */}
              <Card className="bg-white border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" /> Units Expiring Soon ({expiringUnits.length})
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    &lt; 15 Days
                  </Badge>
                </div>
                {expiringUnits.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {expiringUnits.map((u) => (
                      <div key={u.id} className="py-2 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-mono font-bold text-slate-900">{u.unit_code}</span> ({u.blood_group})
                          <p className="text-[11px] text-slate-500">Expires: {new Date(u.expiry_date).toLocaleDateString()}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDiscardModalUnit(u);
                            setDiscardReason("Shelf life expired");
                          }}
                          className="text-xs rounded-xl h-7 font-bold text-rose-700 border-rose-200"
                        >
                          Discard
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No units approaching configured expiry threshold.</p>
                )}
              </Card>

              {/* Quarantined Units */}
              <Card className="bg-white border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <Archive className="h-4 w-4 text-purple-600" /> Units on Quarantine Hold ({summary.totalQuarantined})
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Restricted
                  </Badge>
                </div>
                {units.filter((u) => u.status === "QUARANTINED").length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {units
                      .filter((u) => u.status === "QUARANTINED")
                      .map((u) => (
                        <div key={u.id} className="py-2 flex items-center justify-between gap-3">
                          <div>
                            <span className="font-mono font-bold text-slate-900">{u.unit_code}</span> ({u.blood_group})
                            <p className="text-[11px] text-purple-800">Reason: {u.quarantine_reason || "Under quality review"}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No units currently placed on quarantine hold.</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Modal: Reserve Unit */}
        {reserveModalRequest && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Droplet className="h-5 w-5 text-rose-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Reserve Blood Unit</h3>
                </div>
                <button onClick={() => setReserveModalRequest(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900">{reserveModalRequest.patient_name}</div>
                  <div className="text-[11px] text-slate-600">
                    Required: <strong>{reserveModalRequest.blood_group}</strong> ({reserveModalRequest.component_type})
                  </div>
                  <div className="text-[10px] text-rose-800 font-mono">
                    Req ID: {reserveModalRequest.id} • Indication: {reserveModalRequest.clinical_indication}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Available Unit in Storage *</label>
                  {units.filter((u) => u.blood_group === reserveModalRequest.blood_group && u.status === "AVAILABLE").length > 0 ? (
                    <select
                      value={selectedUnitIdForReserve}
                      onChange={(e) => setSelectedUnitIdForReserve(e.target.value)}
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-bold"
                    >
                      {units
                        .filter((u) => u.blood_group === reserveModalRequest.blood_group && u.status === "AVAILABLE")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.unit_code} — {u.component_type} ({u.storage_location})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <p className="text-rose-600 font-bold text-xs">
                      No available units matching {reserveModalRequest.blood_group} in this hospital.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReserveModalRequest(null)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExecuteReserve}
                    disabled={!selectedUnitIdForReserve || isSubmitting}
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Confirm Reservation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Quarantine Unit */}
        {quarantineModalUnit && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-purple-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Place Unit on Quarantine Hold</h3>
                </div>
                <button onClick={() => setQuarantineModalUnit(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-mono font-bold text-slate-900">{quarantineModalUnit.unit_code}</span>
                  <p className="text-[11px] text-slate-500">
                    {quarantineModalUnit.blood_group} • {quarantineModalUnit.component_type}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quarantine Justification *</label>
                  <textarea
                    rows={3}
                    value={quarantineReason}
                    onChange={(e) => setQuarantineReason(e.target.value)}
                    placeholder="e.g. Repeated serology confirmation required"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" onClick={() => setQuarantineModalUnit(null)} className="text-xs rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExecuteQuarantine}
                    disabled={!quarantineReason.trim() || isSubmitting}
                    size="sm"
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Confirm Quarantine
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Discard Unit */}
        {discardModalUnit && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-rose-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Discard Blood Unit</h3>
                </div>
                <button onClick={() => setDiscardModalUnit(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-mono font-bold text-slate-900">{discardModalUnit.unit_code}</span>
                  <p className="text-[11px] text-slate-500">
                    {discardModalUnit.blood_group} • {discardModalUnit.component_type}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mandatory Discard Reason *</label>
                  <textarea
                    rows={3}
                    value={discardReason}
                    onChange={(e) => setDiscardReason(e.target.value)}
                    placeholder="e.g. Exceeded maximum shelf life / cold chain breach"
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-slate-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" onClick={() => setDiscardModalUnit(null)} className="text-xs rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExecuteDiscard}
                    disabled={!discardReason.trim() || isSubmitting}
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Confirm Biohazard Discard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Accession New Unit */}
        {showAddUnitModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Droplet className="h-5 w-5 text-rose-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Accession Tested Blood Unit</h3>
                </div>
                <button onClick={() => setShowAddUnitModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddUnit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Blood Group *</label>
                    <select
                      value={newGroup}
                      onChange={(e) => setNewGroup(e.target.value as any)}
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-bold"
                    >
                      {bloodGroupsList.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Component Type *</label>
                    <select
                      value={newComponent}
                      onChange={(e) => setNewComponent(e.target.value as any)}
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-bold"
                    >
                      <option value="PACKED_RBC">PACKED_RBC (Packed Red Blood Cells)</option>
                      <option value="WHOLE_BLOOD">WHOLE_BLOOD</option>
                      <option value="FRESH_FROZEN_PLASMA">FRESH_FROZEN_PLASMA</option>
                      <option value="PLATELETS">PLATELETS</option>
                      <option value="CRYOPRECIPITATE">CRYOPRECIPITATE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Volume (mL) *</label>
                    <input
                      type="number"
                      value={newVolume}
                      onChange={(e) => setNewVolume(Number(e.target.value))}
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50 font-bold font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Storage Location *</label>
                    <input
                      type="text"
                      value={newStorage}
                      onChange={(e) => setNewStorage(e.target.value)}
                      className="w-full text-xs h-9 rounded-xl border border-slate-300 px-3 bg-slate-50"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                  <strong>Serology Sign-off:</strong> By accessioning, the blood centre certifies that serology, viral screening, and cross-matching eligibility have passed institutional laboratory standards.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddUnitModal(false)} className="text-xs rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {isSubmitting ? "Accessioning..." : "Add to Cold Storage"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
