"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  Menu, 
  X, 
  AlertTriangle, 
  ChevronRight, 
  LogOut,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { NotificationPanel } from "@/components/shared/notification-panel";
import { UserMenu } from "@/components/shared/user-menu";
import { PATIENT_PRIMARY_NAV, PATIENT_MORE_NAV } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PatientShellProps {
  children: React.ReactNode;
}

export function PatientShell({ children }: PatientShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-foreground flex flex-col font-sans">
      {/* 1. Mobile-First Patient Top Header */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md">
        <Link href="/patient" className="flex items-center gap-2 group" aria-label="MEDORA Patient Home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-slate-900">
                MEDORA
              </span>
              <span className="rounded bg-teal-50 px-1 py-0.2 text-[9px] font-bold text-teal-800 uppercase font-mono">
                {user?.identifier || "PAT-1001"}
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Primary Navigation Links */}
        <nav aria-label="Desktop Patient Navigation" className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
          {PATIENT_PRIMARY_NAV.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-800 font-extrabold"
                    : "hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link href="/patient/emergency" aria-label="Emergency and Urgent Care Assistance">
            <div className="flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 transition-colors">
              <AlertTriangle className="h-3 w-3 text-red-600" aria-hidden="true" />
              <span>SOS</span>
            </div>
          </Link>
          <NotificationPanel />
          <UserMenu />
        </div>
      </header>

      {/* 2. Scrollable Mobile-First Patient Content Container */}
      <main className="flex-1 w-full max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 sm:py-6 pb-28 md:pb-16">
        {children}
      </main>

      {/* 3. Primary Mobile Bottom Navigation Bar (5 Core Items) */}
      <nav 
        aria-label="Patient Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-1 shadow-lg md:hidden"
      >
        {PATIENT_PRIMARY_NAV.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors py-1.5 px-0.5 rounded-xl active:scale-95",
                isActive 
                  ? "text-teal-700 font-extrabold bg-teal-50/80" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-teal-700 stroke-[2.5]" : "text-slate-500")} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 4. Secondary Drawer / Utilities Modal */}
      {isMoreOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in-50 duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="patient-more-title"
        >
          <div className="fixed inset-0" onClick={() => setIsMoreOpen(false)} />
          
          <div className="relative z-50 w-full max-w-lg mx-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <span className="font-extrabold text-sm text-slate-900 block" id="patient-more-title">
                  Patient Services & Utilities
                </span>
                <span className="text-[11px] text-slate-500">
                  {user?.fullName || "Patient"} • {user?.identifier || "PAT-1001"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Links List */}
            <div className="divide-y divide-slate-100 py-2">
              {PATIENT_MORE_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center justify-between py-3 px-1 hover:bg-slate-50 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-teal-700 transition-colors">
                            {item.label}
                          </span>
                        </div>
                        {item.description && (
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>

            {/* Sign Out Button in Drawer */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  logout();
                }}
                className="w-full py-3 rounded-2xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign Out of Patient Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
