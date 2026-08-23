"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Loader2, RotateCw, LogIn } from "lucide-react";
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
      className={`flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50 duration-150 ${
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

      {showRetry && (
        <div className="mt-5 flex items-center gap-2 animate-in fade-in-50 duration-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs font-semibold gap-1.5 h-8 rounded-xl"
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