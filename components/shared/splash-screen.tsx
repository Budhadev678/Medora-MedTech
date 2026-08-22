"use client";

import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

interface SplashScreenProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function SplashScreen({ onComplete, forceShow = false }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState("Initializing Sovereign Identity...");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Check if user already saw splash screen this session (unless forced)
    if (typeof window !== "undefined" && !forceShow) {
      const hasSeen = sessionStorage.getItem("medora_splash_seen");
      if (hasSeen === "true") {
        setVisible(false);
        onComplete?.();
        return;
      }
    }

    const t1 = setTimeout(() => {
      setProgress(40);
      setStatusMessage("Verifying Facility & Organization Memberships...");
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(75);
      setStatusMessage("Evaluating Contextual RBAC & Least-Privilege Policies...");
    }, 900);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusMessage("MEDORA Gateway Ready.");
    }, 1400);

    const t4 = setTimeout(() => {
      setFading(true);
    }, 1750);

    const t5 = setTimeout(() => {
      setVisible(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("medora_splash_seen", "true");
      }
      onComplete?.();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [forceShow, onComplete]);

  const handleSkip = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("medora_splash_seen", "true");
      }
      onComplete?.();
    }, 250);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-500 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Loading Medora Healthcare Platform"
    >
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-teal-900/10 blur-3xl pointer-events-none" />

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        type="button"
        className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-all backdrop-blur-md border border-white/10"
      >
        <span>Skip Intro</span>
        <ArrowRight className="h-3 w-3" />
      </button>

      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        {/* Animated Medora Heartbeat Icon */}
        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-2xl shadow-teal-500/30 ring-4 ring-teal-500/20 animate-pulse">
            <Activity className="h-10 w-10 text-white stroke-[2.5]" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-teal-500/20 blur-lg animate-ping opacity-30 -z-10" />
        </div>

        {/* Brand Title */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-400/20 text-[10px] font-bold uppercase tracking-widest text-teal-300">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
            National Healthcare Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
            MEDORA
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-sm">
            Transparent, Connected & Auditable Healthcare Platform
          </p>
        </div>

        {/* Animated Heartbeat ECG SVG Wave */}
        <div className="w-64 h-12 my-6 flex items-center justify-center overflow-hidden">
          <svg
            className="w-full h-full text-teal-400"
            viewBox="0 0 300 60"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M 0,30 L 70,30 L 85,10 L 95,50 L 110,15 L 120,38 L 130,30 L 200,30 L 215,8 L 225,52 L 240,20 L 250,30 L 300,30"
              className="animate-dash"
              strokeDasharray="300"
              strokeDashoffset="0"
            />
          </svg>
        </div>

        {/* Progress Bar & Status Message */}
        <div className="w-full max-w-xs space-y-2.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 p-0.5 backdrop-blur-sm">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-300 ease-out shadow-xs shadow-teal-400/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="truncate max-w-[220px]">{statusMessage}</span>
            <span className="font-bold text-teal-300">{progress}%</span>
          </div>
        </div>

        {/* Security & Integrity Badges */}
        <div className="mt-8 flex items-center gap-4 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
            <span>ABDM Integrated</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Zero IDOR</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>Multi-Hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
}
