"use client";

import React from "react";
import { 
  Building2, 
  Pill, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Activity,
  Layers
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllPharmacyFacilities } from "@/lib/data/pharmacy-organization-store";
import { Badge } from "@/components/ui/badge";

export function PharmacyContextHeader() {
  const { user, role, activeMembership } = useAuth();

  if (role !== "pharmacy_staff" && role !== "admin") {
    return null;
  }

  const facilities = getAllPharmacyFacilities();
  const activeFac = facilities[0] || {
    id: "PHARM-FAC-1001",
    name: "ABC Pharmacy — Rourkela Central",
    organization_name: "ABC Pharmacy Group",
    operational_status: "ACTIVE",
  };

  const pharmacyName = activeMembership?.organization_name || user?.organizationName || activeFac.name || "ABC Pharmacy";
  const pharmacyId = activeMembership?.organization_identifier || user?.organizationId || activeFac.id;
  const staffName = user?.fullName || "ABC Pharmacy Desk";

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 max-w-7xl mx-auto">
        
        {/* Left Side: Pharmacy Identity + Active Facility Context */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Pill className="h-5 w-5" />
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-slate-900 tracking-tight">
                {pharmacyName}
              </span>
              <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                {pharmacyId}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                • Pharmacy Dispensing Desk
              </span>
            </div>

            {/* Staff Line */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <Building2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              <span className="font-bold text-slate-900">{staffName}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-700 font-medium">PHARMACY STAFF</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-800 font-mono font-semibold text-[11px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Dispensing Bay 1
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Operational Status Indicator */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational (Accepting Prescriptions)</span>
          </div>
        </div>

      </div>
    </div>
  );
}