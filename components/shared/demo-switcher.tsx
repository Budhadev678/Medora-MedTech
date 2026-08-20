"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  DEMO_PERSONAS, 
  ROLE_LABELS, 
  ROLE_DASHBOARD_ROUTES, 
  type DemoPersona,
  type UserRole 
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

export function DemoSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0]);

  // Sync active persona based on current route prefix
  useEffect(() => {
    const matched = DEMO_PERSONAS.find(p => pathname?.startsWith(ROLE_DASHBOARD_ROUTES[p.role]));
    if (matched) {
      setCurrentPersona(matched);
      localStorage.setItem("medora_active_persona", JSON.stringify(matched));
    } else {
      const stored = localStorage.getItem("medora_active_persona");
      if (stored) {
        try {
          setCurrentPersona(JSON.parse(stored));
        } catch {
          // Ignore
        }
      }
    }
  }, [pathname]);

  const handleSelectPersona = (persona: DemoPersona) => {
    setCurrentPersona(persona);
    localStorage.setItem("medora_active_persona", JSON.stringify(persona));
    setIsOpen(false);
    const targetRoute = ROLE_DASHBOARD_ROUTES[persona.role];
    router.push(targetRoute);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50/90 px-2.5 py-1.5 text-xs font-medium text-teal-900 transition-all hover:bg-teal-100 focus:outline-none"
        title="Switch Demo Persona for SIH Demonstration"
      >
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-teal-800">Persona:</span>
        <span className="max-w-[130px] truncate text-teal-950 font-medium">
          {currentPersona.name} ({ROLE_LABELS[currentPersona.role].split(" ")[0]})
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-teal-700" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-white p-2 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                  SIH Demo Persona Switcher
                </span>
                <Badge variant="teal" className="text-[10px] py-0 px-1.5">
                  Live Sync
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Switch user role to simulate connected healthcare workflows.
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1 py-1">
              {DEMO_PERSONAS.map((persona) => {
                const isSelected = currentPersona.id === persona.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona)}
                    className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? "bg-teal-50 text-teal-950 font-medium border border-teal-200"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 truncate">
                          {persona.name}
                        </span>
                        <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 rounded">
                          {persona.identifier}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {persona.organization}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-teal-600 flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 mt-1 px-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/");
                }}
                className="w-full text-center text-[11px] font-medium text-slate-600 hover:text-teal-700 py-1 flex items-center justify-center gap-1"
              >
                Go to Portal Gateway Overview <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
