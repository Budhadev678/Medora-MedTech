"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DEMO_PERSONAS, 
  ROLE_LABELS, 
  type DemoPersona 
} from "@/lib/constants";
import { 
  Users, 
  ChevronDown, 
  Check, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export function DemoSwitcher() {
  const router = useRouter();
  const { user, activePersona, switchPersona } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = user?.fullName || activePersona?.name || "Select Persona";
  const displayRole = user?.role ? ROLE_LABELS[user.role].split(" ")[0] : "Guest";

  const handleSelectPersona = (persona: DemoPersona) => {
    switchPersona(persona.identifier);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50/90 px-2.5 py-1.5 text-xs font-medium text-teal-900 transition-all hover:bg-teal-100 focus:outline-none"
        title="Switch Account / Persona"
      >
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-teal-800">Persona:</span>
        <span className="max-w-[140px] truncate text-teal-950 font-medium">
          {displayName} ({displayRole})
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-teal-700" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 z-50 focus:outline-none overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
            <div className="bg-slate-50 p-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Switch Active Account
                </span>
                <Badge variant="teal" className="text-[10px]">
                  Phase 1 Isolated Auth
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Select any registered test account to verify complete data and role isolation.
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-50">
              {DEMO_PERSONAS.map((persona) => {
                const isSelected = user?.identifier === persona.identifier || user?.email === persona.email;
                return (
                  <button
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona)}
                    className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected 
                        ? "bg-teal-50/80 border border-teal-200" 
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {persona.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {persona.name}
                          </span>
                          <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1 rounded font-semibold">
                            {persona.identifier}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {persona.organization}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <Check className="h-4 w-4 text-teal-600 flex-shrink-0 ml-2" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400">
                Data is isolated by UUID & Role. No cross-account leakage.
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
