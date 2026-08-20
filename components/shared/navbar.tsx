"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  Bell, 
  Globe, 
  ShieldCheck, 
  Menu, 
  X,
  AlertTriangle,
  FileHeart,
  ChevronRight,
  LogOut,
  LogIn
} from "lucide-react";
import { DemoSwitcher } from "@/components/shared/demo-switcher";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export function Navbar() {
  const pathname = usePathname();
  const { user, activePersona, logout } = useAuth();
  const [currentLang, setCurrentLang] = useState<"EN" | "HI" | "OR">("EN");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-border bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Brand Identity */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs transition-transform group-hover:scale-105">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                MEDORA
              </span>
              <span className="rounded bg-teal-100 px-1.5 py-0.2 text-[10px] font-bold text-teal-800 tracking-wide uppercase">
                Prototype
              </span>
            </div>
            <span className="text-[10px] text-slate-500 tracking-tight block -mt-0.5">
              Connected Healthcare Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Center / Navigation Links for Public View */}
      {pathname === "/" && (
        <nav className="hidden md:flex items-center gap-6 ml-8 text-xs font-medium text-slate-600">
          <Link href="/#modules" className="hover:text-teal-600 transition-colors">
            Connected Modules
          </Link>
          <Link href="/#traceability" className="hover:text-teal-600 transition-colors">
            Traceability & Billing
          </Link>
          <Link href="/#emergency" className="hover:text-teal-600 transition-colors">
            Emergency Network
          </Link>
        </nav>
      )}

      {/* Right Action Tools */}
      <div className="ml-auto flex items-center gap-3">
        {/* Language Selector */}
        <div className="hidden sm:flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium text-slate-600">
          <button
            onClick={() => setCurrentLang("EN")}
            className={`px-2 py-1 rounded transition-colors ${
              currentLang === "EN" ? "bg-white text-teal-700 shadow-xs font-semibold" : "hover:text-slate-900"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setCurrentLang("HI")}
            className={`px-2 py-1 rounded transition-colors ${
              currentLang === "HI" ? "bg-white text-teal-700 shadow-xs font-semibold" : "hover:text-slate-900"
            }`}
          >
            हिन्दी
          </button>
          <button
            onClick={() => setCurrentLang("OR")}
            className={`px-2 py-1 rounded transition-colors ${
              currentLang === "OR" ? "bg-white text-teal-700 shadow-xs font-semibold" : "hover:text-slate-900"
            }`}
          >
            ଓଡ଼ିଆ
          </button>
        </div>

        {/* Demo Persona Switcher */}
        <DemoSwitcher />

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">
              3
            </span>
          </button>

          {notificationsOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setNotificationsOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-white p-3 shadow-xl z-50 animate-in fade-in-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Live System Feed
                  </span>
                  <Badge variant="teal" className="text-[10px]">Realtime</Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-100">
                    <span className="font-semibold text-teal-900 block">Lab Report Approved</span>
                    <span className="text-slate-600 text-[11px]">CBC report approved by Central Pathology Lab.</span>
                    <span className="text-[10px] text-slate-400 block mt-1">2 mins ago</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                    <span className="font-semibold text-blue-900 block">Pharmacy Pickup Ready</span>
                    <span className="text-slate-600 text-[11px]">RX-1001 packaged at Hospital Pharmacy Desk.</span>
                    <span className="text-[10px] text-slate-400 block mt-1">15 mins ago</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                    <span className="font-semibold text-amber-900 block">New Item Added to Bill</span>
                    <span className="text-slate-600 text-[11px]">CBC diagnostic charge (₹600) added to BILL-1001.</span>
                    <span className="text-[10px] text-slate-400 block mt-1">25 mins ago</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Auth Link / Logout Button */}
        {isAuthPage ? (
          <Link href="/">
            <button className="text-xs font-semibold text-slate-600 hover:text-teal-700 px-2 py-1">
              Gateway
            </button>
          </Link>
        ) : (
          <button
            onClick={logout}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
            title="Log Out / Return to Sign In"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
}
