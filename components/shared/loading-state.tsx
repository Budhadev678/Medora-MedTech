"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, RotateCw, LogIn, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  message?: string;
  subtext?: string;
  fullscreen?: boolean;
}

export function LoadingState({
  message = "Loading your MEDORA workspace...",
  subtext = "Resolving authenticated healthcare identity...",
  fullscreen = false,
}: LoadingStateProps) {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50 duration-200 font-sans ${
        fullscreen ? "min-h-[70vh] w-full" : "py-16 w-full"
      }`}
    >
      {/* Premium MEDORA Brand Animated Loading Emblem */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Soft Background Radar Pulse */}
        <div className="absolute h-20 w-20 rounded-3xl bg-teal-500/15 animate-ping opacity-75" />
        
        {/* Orbit Spinner Ring */}
        <div className="absolute h-18 w-18 rounded-3xl border-2 border-dashed border-teal-500/40 animate-spin" style={{ animationDuration: "6s" }} />

        {/* Center Brand Emblem Squircle */}
        <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white shadow-lg shadow-teal-700/20 flex items-center justify-center border border-teal-400/30">
          <Activity className="h-7 w-7 stroke-[2.5] text-white animate-pulse" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
          {message}
        </h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          {subtext}
        </p>
      </div>

      {showRetry && (
        <div className="mt-5 flex items-center gap-2 animate-in fade-in-50 duration-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs font-semibold gap-1.5 h-8 rounded-xl border-slate-200 hover:bg-slate-50"
          >
            <RotateCw className="h-3 w-3" />
            Reload Workspace
          </Button>
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold gap-1.5 h-8 text-slate-600 hover:text-slate-900 rounded-xl"
            >
              <LogIn className="h-3 w-3" />
              Return to Login
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}