"use client";

import React from "react";
import { Activity, Loader2 } from "lucide-react";

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
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${
        fullscreen ? "min-h-[70vh] w-full" : "py-16 w-full"
      }`}
    >
      <div className="relative mb-4">
        <div className="h-12 w-12 rounded-xl bg-teal-600/10 flex items-center justify-center text-teal-700 animate-pulse">
          <Activity className="h-6 w-6" />
        </div>
        <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 text-teal-600 animate-spin" />
      </div>

      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
        {message}
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
        {subtext}
      </p>
    </div>
  );
}
