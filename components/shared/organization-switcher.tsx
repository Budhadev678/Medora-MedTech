"use client";

import React, { useState } from "react";
import { Building2, ChevronDown, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Badge } from "@/components/ui/badge";

export function OrganizationSwitcher() {
  const { user, affiliations, staffMemberships } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState<string>(() => {
    if (affiliations && affiliations.length > 0) return affiliations[0].organizationId;
    if (staffMemberships && staffMemberships.length > 0) return staffMemberships[0].organizationId;
    return user?.identifier || "HSP-1001";
  });

  // Doctor affiliations
  if (user?.role === "doctor" && affiliations && affiliations.length > 0) {
    const currentAff = affiliations.find((a) => a.organizationId === activeOrgId) || affiliations[0];

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1.5 text-xs font-semibold text-slate-800 transition-all active:scale-98"
        >
          <Building2 className="h-3.5 w-3.5 text-teal-700 flex-shrink-0" />
          <div className="text-left">
            <span className="font-bold text-slate-900 block truncate max-w-[140px] sm:max-w-[180px]">
              {currentAff.organizationName}
            </span>
            <span className="text-[10px] text-slate-500 block font-normal -mt-0.5">
              {currentAff.roleTitle}
            </span>
          </div>
          <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in-50 duration-150">
              <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Switch Active Practice Context:
                </span>
                <span className="text-[11px] text-slate-500">
                  Practicing as {user.fullName} ({user.identifier})
                </span>
              </div>

              <div className="space-y-1">
                {affiliations.map((aff) => {
                  const isSelected = aff.organizationId === currentAff.organizationId;
                  return (
                    <button
                      key={aff.organizationId}
                      type="button"
                      onClick={() => {
                        setActiveOrgId(aff.organizationId);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                        isSelected ? "bg-teal-50 text-teal-900 font-bold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <span className="block font-semibold">{aff.organizationName}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {aff.roleTitle} • ₹{aff.consultationFee}
                        </span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Non-Doctor Hospital / Facility display
  if (user?.organizationName) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
        <Building2 className="h-3.5 w-3.5 text-teal-700" />
        <span className="truncate max-w-[180px]">{user.organizationName}</span>
        <Badge variant="outline" className="text-[10px] font-mono py-0 text-teal-800 bg-white">
          {user.identifier}
        </Badge>
      </div>
    );
  }

  return null;
}
