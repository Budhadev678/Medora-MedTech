"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Stethoscope, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ShieldCheck,
  RotateCw,
  Activity,
  Layers
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  getDoctorContext, 
  setActiveDoctorAffiliation, 
  setDoctorDutyStatus, 
  DoctorActiveContext, 
  DoctorDutyStatus 
} from "@/lib/data/doctor-context-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DoctorContextHeader() {
  const { user, role } = useAuth();
  const [context, setContext] = useState<DoctorActiveContext | null>(null);
  const [isFacilityMenuOpen, setIsFacilityMenuOpen] = useState(false);
  const [isDutyMenuOpen, setIsDutyMenuOpen] = useState(false);

  const doctorId = user?.identifier || user?.id || "DOC-1001";

  const refreshContext = () => {
    if (role === "doctor" && user) {
      const resolved = getDoctorContext(doctorId);
      setContext(resolved);
    }
  };

  useEffect(() => {
    refreshContext();

    const handleContextChange = (e: any) => {
      if (e.detail) {
        setContext(e.detail);
      } else {
        refreshContext();
      }
    };

    window.addEventListener("medora-doctor-context-changed", handleContextChange);
    return () => window.removeEventListener("medora-doctor-context-changed", handleContextChange);
  }, [user, role]);

  if (role !== "doctor" || !context) {
    return null;
  }

  const handleSwitchFacility = (affId: string) => {
    setActiveDoctorAffiliation(doctorId, affId);
    setIsFacilityMenuOpen(false);
  };

  const handleSwitchDuty = (newStatus: DoctorDutyStatus) => {
    setDoctorDutyStatus(doctorId, newStatus);
    setIsDutyMenuOpen(false);
  };

  const getDutyBadge = (status: DoctorDutyStatus) => {
    switch (status) {
      case "AVAILABLE":
        return {
          label: "Available (Accepting Patients)",
          className: "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold",
          dotColor: "bg-emerald-500",
        };
      case "IN_CONSULTATION":
        return {
          label: "In Consultation",
          className: "bg-blue-50 text-blue-800 border-blue-300 font-bold",
          dotColor: "bg-blue-500",
        };
      case "ON_BREAK":
        return {
          label: "On Break",
          className: "bg-amber-50 text-amber-800 border-amber-300 font-bold",
          dotColor: "bg-amber-500",
        };
      case "OFF_DUTY":
        return {
          label: "Off Duty",
          className: "bg-slate-100 text-slate-700 border-slate-300 font-medium",
          dotColor: "bg-slate-400",
        };
    }
  };

  const dutyInfo = getDutyBadge(context.dutyStatus);

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 max-w-7xl mx-auto">
        
        {/* Left Side: Doctor Identity + Active Clinical Context */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Stethoscope className="h-5 w-5" />
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-slate-900 tracking-tight">
                {context.doctorName}
              </span>
              <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                {context.doctorId}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                • {context.specialization}
              </span>
            </div>

            {/* Active Facility Context Line */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <Building2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
              <span className="font-bold text-slate-900">{context.facilityName}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-700 font-medium">{context.departmentName}</span>
              <span className="text-slate-400">·</span>
              <span className="text-teal-800 font-mono font-semibold text-[11px] bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                {context.opdRoom}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Multi-Facility Switcher & Duty Status Controller */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          
          {/* Facility Switcher (Multi-Facility Support) */}
          {context.authorizedAffiliations.length > 1 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsFacilityMenuOpen(!isFacilityMenuOpen);
                  setIsDutyMenuOpen(false);
                }}
                className="h-8 text-xs font-semibold gap-1.5 border-slate-200 bg-white hover:bg-slate-50 rounded-xl"
              >
                <Building2 className="h-3.5 w-3.5 text-teal-700" />
                <span className="max-w-[130px] truncate">{context.facilityName}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </Button>

              {isFacilityMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Switch Active Facility Affiliation ({context.authorizedAffiliations.length})
                  </div>
                  {context.authorizedAffiliations.map((aff) => {
                    const isSelected = aff.id === context.activeAffiliationId;
                    return (
                      <button
                        key={aff.id}
                        type="button"
                        onClick={() => aff.id && handleSwitchFacility(aff.id)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          isSelected ? "bg-teal-50/70 text-teal-900 font-bold" : "text-slate-700"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="block truncate font-semibold">{aff.organizationName}</span>
                          <span className="block text-[10px] text-slate-500 truncate">{aff.departmentName} • {aff.opdRoom}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Operational Duty Status Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDutyMenuOpen(!isDutyMenuOpen);
                setIsFacilityMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all shadow-2xs ${dutyInfo.className}`}
            >
              <span className={`h-2 w-2 rounded-full ${dutyInfo.dotColor} animate-pulse`} />
              <span>{dutyInfo.label}</span>
              <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
            </button>

            {isDutyMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Update Operational Duty Status
                </div>
                
                <button
                  type="button"
                  onClick={() => handleSwitchDuty("AVAILABLE")}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-emerald-50 text-emerald-900"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold">Available (Accepting Patients)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchDuty("IN_CONSULTATION")}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-blue-50 text-blue-900"
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="font-semibold">In Consultation</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchDuty("ON_BREAK")}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-amber-50 text-amber-900"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-semibold">On Break</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchDuty("OFF_DUTY")}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 text-slate-700"
                >
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="font-medium">Off Duty</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}