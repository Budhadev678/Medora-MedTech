"use client";

import React from "react";
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
  Info
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export default function PatientEmergencyPage() {
  const { user } = useAuth();
  const patientData = user?.patientData;

  const bloodGroup = patientData?.bloodGroup || "—";
  const allergies = patientData?.allergies && patientData.allergies.length > 0 
    ? patientData.allergies.join(", ") 
    : "None Reported";
  const conditions = patientData?.chronicConditions && patientData.chronicConditions.length > 0
    ? patientData.chronicConditions.join(", ")
    : "None Reported";
  const emergencyContact = patientData?.emergencyContact 
    ? `${patientData.emergencyContact.name} (${patientData.emergencyContact.phone})`
    : "None Listed";

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-200">
        {/* Top Alert Banner */}
        <div className="rounded-2xl border border-red-300 bg-red-50/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Emergency Medical Quick Access
            </span>
          </div>
          <h1 className="text-xl font-black text-red-950 tracking-tight">
            MEDORA Emergency Helpline & Pre-Alert
          </h1>
          <p className="text-xs text-red-900 leading-relaxed">
            In immediate life-threatening situations, use one-tap emergency call buttons or alert nearest hospital emergency departments.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <a 
              href="tel:112"
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white py-3 rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <Phone className="h-4 w-4" />
              <span>National ER (112)</span>
            </a>
            <a 
              href="tel:108"
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black active:scale-95 text-white py-3 rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <Phone className="h-4 w-4" />
              <span>Ambulance (108)</span>
            </a>
          </div>
        </div>

        {/* Emergency Health Snapshot (Life-Critical Data) */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-600" />
              Your Emergency Medical Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Blood Group</span>
              <span className="font-bold text-rose-700 text-sm">{bloodGroup}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Severe Allergies</span>
              <span className="font-semibold text-slate-900">{allergies}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Chronic Conditions</span>
              <span className="font-semibold text-slate-900">{conditions}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Primary Emergency Contact</span>
              <span className="font-semibold text-slate-900">{emergencyContact}</span>
            </div>
          </CardContent>
        </Card>

        {/* Nearest Connected Emergency Trauma Center */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-700" />
                Nearest Trauma Center
              </CardTitle>
              <Badge variant="emergency" className="text-[10px]">24/7 ER Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Apex Multispeciality Hospital</h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" /> Khandagiri, Bhubaneswar (2.4 km away)
            </p>
            <div className="pt-2 flex gap-2">
              <a 
                href="tel:06742550100" 
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 py-2 rounded-lg text-xs font-semibold"
              >
                <Phone className="h-3.5 w-3.5 text-red-600" />
                <span>Call Hospital ER Desk</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Phase Guidance Note */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>Full real-time road accident simulation and automated ER doctor availability escalation will be connected in Phase 13 and Phase 18.</span>
        </div>
      </div>
    </RoleGuard>
  );
}
