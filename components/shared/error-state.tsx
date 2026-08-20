"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showLogout?: boolean;
}

export function ErrorState({
  title = "Unable to load your MEDORA account",
  message = "A communication or identity authorization error occurred while connecting to the MEDORA healthcare registry.",
  onRetry,
  showLogout = true,
}: ErrorStateProps) {
  const { logout } = useAuth();

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div className="h-12 w-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-xs">
        <ShieldAlert className="h-6 w-6" />
      </div>

      <h2 className="text-base font-bold text-slate-900 tracking-tight">
        {title}
      </h2>
      <p className="text-xs text-slate-500 mt-1.5 mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button size="sm" onClick={onRetry} className="text-xs font-semibold gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
          </Button>
        )}

        {showLogout && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => logout()}
            className="text-xs font-semibold gap-1.5 text-slate-700 hover:text-red-700"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
        )}
      </div>
    </div>
  );
}
