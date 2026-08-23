"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Phone, 
  Droplet, 
  Heart, 
  ShieldAlert, 
  Building2, 
  MapPin, 
  ArrowLeft,
  Info,
  Ambulance,
  CheckCircle2,
  Clock,
  Activity,
  AlertCircle,
  XCircle,
  Plus
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getActiveEmergencyForPatient,
  getEmergenciesForPatient,
  createEmergencyRequest,
  cancelEmergencyCase,
  PatientEmergencyCase,
  EmergencyType
} from "@/lib/data/emergency-store";

export default function PatientEmergencyPage() {
  const { user } = useAuth();
  const patientData = user?.patientData;

  const [activeCase, setActiveCase] = useState<PatientEmergencyCase | null>(null);
  const [historyCases, setHistoryCases] = useState<PatientEmergencyCase[]>([]);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<EmergencyType>("CHEST_PAIN");
  const [desc, setDesc] = useState("");
  const [byAmbulance, setByAmbulance] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const reloadData = () => {
    if (user?.identifier || user?.id) {
      const pId = user.identifier || user.id;
      const active = getActiveEmergencyForPatient(pId);
      const all = getEmergenciesForPatient(pId);
      setActiveCase(active);
      setHistoryCases(all.filter(c => c.status === "COMPLETED" || c.status === "CANCELLED"));
    }
  };

  useEffect(() => {
    reloadData();
  }, [user]);

  const handleInitiateEmergency = () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const pId = user.identifier || user.id || "PAT-1001";
      const res = createEmergencyRequest({
        patientId: pId,
        emergencyType: selectedType,
        description: desc,
        arrivingByAmbulance: byAmbulance,
        targetFacilityId: "FAC-1001",
        targetFacilityName: "Apex Multispeciality Hospital Trauma Center",
      });

      if (res.success && res.case) {
        setActiveCase(res.case);
        setShowInitiateModal(false);
        setSuccessMsg(`Emergency Pre-Alert ${res.case.case_number} sent to hospital trauma desk!`);
        reloadData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEmergency = (caseId: string) => {
    cancelEmergencyCase(caseId, "Patient resolved or no longer required");
    reloadData();
  };

  const bloodGroup = patientData?.bloodGroup || "—";
  const allergies = patientData?.allergies && patientData.allergies.length > 0 
    ? patientData.allergies.join(", ") 
    : "None Recorded";
  const emergencyContact = patientData?.emergencyContact 
    ? `${patientData.emergencyContact.name} (${patientData.emergencyContact.phone})`
    : "None Listed";

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-200 max-w-4xl mx-auto pb-24">
        {/* Top Emergency Action Header */}
        <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-6 w-6 text-rose-600 animate-pulse shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Emergency & Urgent Care
              </span>
            </div>
            <Badge variant="emergency" className="text-[10px] font-mono">24/7 Trauma Desk</Badge>
          </div>

          <h1 className="text-xl font-black text-rose-950 tracking-tight">
            Emergency Pre-Arrival Hospital Notification
          </h1>
          <p className="text-xs text-rose-900 leading-relaxed">
            In immediate life-threatening situations, call National Emergency 112 or alert the receiving hospital trauma team before arrival.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <a 
              href="tel:112"
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all"
            >
              <Phone className="h-4 w-4" />
              <span>National ER (112)</span>
            </a>
            <a 
              href="tel:108"
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black active:scale-95 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all"
            >
              <Ambulance className="h-4 w-4" />
              <span>Ambulance (108)</span>
            </a>
            {!activeCase && (
              <Button
                onClick={() => setShowInitiateModal(true)}
                className="col-span-2 sm:col-span-1 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs py-2.5 h-auto"
              >
                <Plus className="h-4 w-4 mr-1" /> Pre-Alert Hospital
              </Button>
            )}
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Active Emergency Tracker */}
        {activeCase && (
          <Card className="border-rose-300 bg-white rounded-2xl shadow-md overflow-hidden">
            <CardHeader className="p-4 bg-rose-50/50 border-b border-rose-100 flex flex-row items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Active Emergency Pre-Alert</span>
                <CardTitle className="text-sm font-bold text-slate-900 font-mono">
                  {activeCase.case_number} • {activeCase.target_facility_name}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelEmergency(activeCase.id)}
                className="text-xs text-rose-700 hover:bg-rose-100 rounded-xl h-8"
              >
                <XCircle className="h-4 w-4 mr-1" /> Cancel Case
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {/* Status Milestones */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900">
                  <span className="text-[10px] font-bold block">1. Alert Sent</span>
                  <span className="text-[11px] font-medium">✓ {new Date(activeCase.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${activeCase.hospital_acknowledged_at ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  <span className="text-[10px] font-bold block">2. Hospital Acknowledged</span>
                  <span className="text-[11px] font-medium">
                    {activeCase.hospital_acknowledged_at ? `✓ ${new Date(activeCase.hospital_acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Awaiting Ack"}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border ${activeCase.arrived_at ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                  <span className="text-[10px] font-bold block">3. Arrival / Ambulance</span>
                  <span className="text-[11px] font-medium">
                    {activeCase.arrived_at ? "✓ Arrived at ER" : activeCase.arriving_by_ambulance ? `En Route (~${activeCase.eta_minutes || 10}m)` : "In Transit"}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl border ${activeCase.status === "TRIAGE_STARTED" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  <span className="text-[10px] font-bold block">4. Trauma Triage</span>
                  <span className="text-[11px] font-medium">
                    {activeCase.status === "TRIAGE_STARTED" ? "✓ Triage Active" : "Pending Arrival"}
                  </span>
                </div>
              </div>

              {/* Case Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Emergency Reason:</span>
                  <span className="font-bold text-slate-900">{activeCase.emergency_type} — {activeCase.description}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Shared Location:</span>
                  <span className="font-bold text-slate-900">{typeof activeCase.location === "object" ? (activeCase.location as any)?.address || "Current Location" : activeCase.location || "Current Location"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency Health Snapshot (Life-Critical Data) */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-xs">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-600" />
              Emergency Medical Snapshot (Auto-Shared with Hospital ER)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] block">Blood Group</span>
                <span className="font-bold text-rose-700 text-sm">{bloodGroup}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] block">Severe Allergies</span>
                <span className="font-semibold text-slate-900 text-xs">{allergies}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                <span className="text-slate-400 text-[10px] block">Emergency Contact</span>
                <span className="font-semibold text-slate-900 text-xs">{emergencyContact}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nearest Connected Emergency Trauma Center */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-xs">
          <CardHeader className="p-4 pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-700" />
                Nearest Trauma Center
              </CardTitle>
              <Badge variant="emergency" className="text-[10px]">24/7 ER Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Apex Multispeciality Hospital Trauma Center</h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" /> Khandagiri, Bhubaneswar (2.4 km away)
            </p>
            <div className="pt-2 flex gap-2">
              <a 
                href="tel:06742550100" 
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 py-2 rounded-xl text-xs font-semibold"
              >
                <Phone className="h-3.5 w-3.5 text-rose-600" />
                <span>Call Trauma Desk Directly</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Past Emergency Cases History */}
        {historyCases.length > 0 && (
          <Card className="bg-white border-slate-200 rounded-2xl shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Emergency Case History ({historyCases.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 divide-y divide-slate-100">
              {historyCases.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{c.case_number}</span>
                    <span className="text-[11px] text-slate-500 block">
                      {c.emergency_type} • {c.target_facility_name} • {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Modal: Initiate Emergency Pre-Alert */}
        {showInitiateModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600" /> Pre-Alert Hospital Trauma Team
                </h3>
                <button onClick={() => setShowInitiateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emergency Category</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as EmergencyType)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-medium"
                  >
                    <option value="CHEST_PAIN">Chest Pain / Cardiac Emergency</option>
                    <option value="BREATHING_DIFFICULTY">Severe Breathing Difficulty</option>
                    <option value="SEVERE_BLEEDING">Severe Bleeding / Trauma</option>
                    <option value="MAJOR_INJURY">Major Physical Injury / Fracture</option>
                    <option value="UNCONSCIOUSNESS">Unconsciousness / Stroke Symptoms</option>
                    <option value="OTHER">Other Immediate Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Immediate Notes / Symptoms (Optional)</label>
                  <textarea
                    rows={2}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Brief description for ER doctors (e.g., severe chest tightness)..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="ambulanceCheck"
                    checked={byAmbulance}
                    onChange={(e) => setByAmbulance(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="ambulanceCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Arriving by Ambulance (Alert ER for bay preparation)
                  </label>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-900 space-y-1">
                  <span className="font-bold block">Hospital to be Alerted:</span>
                  <span>Apex Multispeciality Hospital Trauma Center (2.4 km away)</span>
                  <span className="block text-[10px] text-rose-700">Medical snapshot (Blood Group: {bloodGroup}, Allergies: {allergies}) will be shared.</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowInitiateModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleInitiateEmergency}
                  disabled={submitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
                >
                  {submitting ? "Alerting ER..." : "Send Emergency Pre-Alert"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

