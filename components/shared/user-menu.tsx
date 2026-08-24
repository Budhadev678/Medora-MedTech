"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Globe, 
  HelpCircle, 
  ChevronDown,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useLocalization } from "@/lib/localization";
import { Badge } from "@/components/ui/badge";

export function UserMenu() {
  const { user, role, logout } = useAuth();
  const { language, changeLanguage, languages } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const profileHref = role === "patient" ? "/patient/profile" : `/${role === "hospital_admin" ? "hospital" : role}/profile`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 transition-colors active:scale-98"
      >
        <div className="h-8 w-8 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-xs overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
          ) : (
            user.fullName.charAt(0)
          )}
        </div>
        <div className="hidden lg:block text-left">
          <span className="font-bold text-xs text-slate-900 block leading-tight">
            {user.fullName}
          </span>
          <span className="text-[10px] text-teal-700 font-mono font-semibold block">
            {user.identifier}
          </span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 hidden lg:block transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in-50 duration-150 text-xs">
            {/* User Header */}
            <div className="p-2.5 border-b border-slate-100 mb-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 block truncate">
                  {user.fullName}
                </span>
                <Badge variant="teal" className="text-[9px] py-0">
                  {user.identifier}
                </Badge>
              </div>
              <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                {user.email}
              </span>
              <span className="text-[10px] font-mono text-slate-400 capitalize block mt-1">
                Role: {user.role.replace("_", " ")}
              </span>
            </div>

            {/* Menu Links */}
            <div className="space-y-0.5 py-1">
              <Link
                href={profileHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>My Profile & ID</span>
              </Link>

              <Link
                href={`/${role === "hospital_admin" ? "hospital" : role}/settings`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Account & Preferences</span>
              </Link>
            </div>

            {/* Language Switcher in User Menu */}
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 my-1">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="h-3 w-3 text-teal-600" /> Language / ଭାଷା
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => changeLanguage(l.code)}
                    className={`py-1 rounded-lg text-[11px] font-bold transition-all ${
                      language === l.code
                        ? "bg-teal-700 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {l.nativeName}
                  </button>
                ))}
              </div>
            </div>

            {/* Sign Out Action */}
            <div className="pt-1.5 border-t border-slate-100 mt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-semibold text-left"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>Sign Out of MEDORA</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
