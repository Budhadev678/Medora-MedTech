"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  Home, 
  Calendar, 
  FileText, 
  Menu, 
  X, 
  AlertTriangle, 
  Pill, 
  FlaskConical, 
  Package, 
  Receipt, 
  User, 
  Stethoscope, 
  HeartPulse, 
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
        <Link href="/patient" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs">
            <Activity className="h-4 w-4" />
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

        <div className="flex items-center gap-1.5">
          <Link href="/patient/emergency">
            <div className="flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 transition-colors">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span>SOS</span>
            </div>
          </Link>
          <NotificationPanel />
          <UserMenu />
        </div>
      </header>

      {/* 2. Scrollable Mobile-First Patient Content Container */}
      <main className="flex-1 w-full max-w-xl md:max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-28 md:pb-16">
        {children}
      </main>

      {/* 3. Primary Mobile Bottom Navigation Bar */}
      <nav 
        aria-label="Patient Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 shadow-lg md:max-w-md md:mx-auto md:bottom-3 md:rounded-2xl md:border"
      >
        {PATIENT_PRIMARY_NAV.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          if (item.href === "/patient/emergency") {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-transform active:scale-95",
                  isActive ? "text-red-700 font-bold" : "text-red-600 hover:text-red-700"
                )}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors py-1 px-3 rounded-lg active:scale-95",
                isActive 
                  ? "text-teal-700 font-bold bg-teal-50/80" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-teal-700" : "text-slate-500")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* 4th Item: "More" Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors py-1 px-3 rounded-lg active:scale-95 text-slate-500 hover:text-slate-900",
            isMoreOpen ? "text-teal-700 font-bold bg-teal-50/80" : ""
          )}
        >
          <Menu className="h-4 w-4" />
          <span>More</span>
        </button>
      </nav>

      {/* 4. "More" Navigation Drawer / Modal */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="fixed inset-0" onClick={() => setIsMoreOpen(false)} />
          
          <div className="relative z-50 w-full max-w-lg mx-auto rounded-t-2xl border-t border-slate-200 bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  All Patient Healthcare Services
                </span>
                <span className="text-[11px] text-slate-500">
                  {user?.fullName || "Patient"} • {user?.identifier || "PAT-1001"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
                    className="flex items-center justify-between py-3 px-1 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-teal-700 transition-colors">
                            {item.label}
                          </span>
                          {item.comingSoon && (
                            <Badge variant="outline" className="text-[9px] py-0 text-slate-500 border-slate-200">
                              {item.phase || "Coming Soon"}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
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
                className="w-full py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out of Patient Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
