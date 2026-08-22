"use client";

import React, { useState } from "react";
import { Building2, ChevronDown, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Badge } from "@/components/ui/badge";

export function OrganizationSwitcher() {
  const { user, memberships, activeMembership, setActiveMembershipId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // If user has multiple organization memberships (e.g. Dr. Ananya, Anita, Rahul Multi-Role)
  if (memberships && memberships.length > 1) {
    const current = activeMembership || memberships[0];

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Switch organization context"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 transition-all shadow-2xs active:scale-98"
        >
          <div className="h-5 w-5 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="text-left">
            <span className="font-bold text-slate-900 block truncate max-w-[130px] sm:max-w-[180px]">
              {current.organization_name}
            </span>
            <span className="text-[10px] text-slate-500 block font-normal -mt-0.5">
              {current.role_title}
            </span>
          </div>
          <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in-50 duration-150">
              <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Active Practice / Facility Context:
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  {user?.fullName} ({user?.identifier})
                </span>
              </div>

              <div className="space-y-1">
                {memberships.map((mem) => {
                  const isSelected = mem.id === current.id;
                  const isActive = mem.status === "ACTIVE";

                  return (
                    <button
                      key={mem.id}
                      type="button"
                      disabled={!isActive}
                      onClick={() => {
                        if (isActive) {
                          setActiveMembershipId(mem.id);
                          setIsOpen(false);
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(new Event("medora-organization-switched"));
                          }
                        }
                      }}
                      className={`w-full text-left flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                        isSelected 
                          ? "bg-teal-50 text-teal-900 font-bold border border-teal-200" 
                          : isActive 
                            ? "text-slate-700 hover:bg-slate-50" 
                            : "text-slate-400 bg-slate-50 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="block font-semibold">{mem.organization_name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-600 font-normal">
                            {mem.organization_identifier}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal block">
                          {mem.role_title} {mem.consultation_fee ? `• ₹${mem.consultation_fee}` : ""}
                        </span>
                        {mem.status !== "ACTIVE" && (
                          <span className="text-[9px] font-bold text-red-600 uppercase mt-0.5 block">
                            Status: {mem.status}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-teal-600 flex-shrink-0" />}
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

  // Single membership display
  if (activeMembership || user?.organizationName) {
    const orgName = activeMembership?.organization_name || user?.organizationName;
    const orgIdent = activeMembership?.organization_identifier || user?.identifier;
    const roleTitle = activeMembership?.role_title;

    return (
      <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
        <Building2 className="h-3.5 w-3.5 text-teal-700" />
        <div className="text-left">
          <span className="truncate max-w-[160px] block font-bold text-slate-900">{orgName}</span>
          {roleTitle && <span className="text-[10px] text-slate-500 block font-normal -mt-0.5">{roleTitle}</span>}
        </div>
        <Badge variant="outline" className="text-[10px] font-mono py-0 text-teal-800 bg-white ml-1">
          {orgIdent}
        </Badge>
      </div>
    );
  }

  return null;
}
