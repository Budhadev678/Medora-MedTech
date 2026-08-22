"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, ShieldCheck, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

export default function SplashGatewayPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState("Initializing Sovereign Identity...");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Stage 1: Verifying memberships
    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusMessage("Verifying Facility & Organization Memberships...");
    }, 450);

    // Stage 2: Evaluating RBAC
    const t2 = setTimeout(() => {
      setProgress(80);
      setStatusMessage("Loading Multi-Factor Contextual Permissions...");
    }, 950);

    // Stage 3: Ready
    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusMessage("MEDORA Ready — Launching Sign-In...");
    }, 1450);

    // Stage 4: Fade out
    const t4 = setTimeout(() => {
      setFading(true);
    }, 1800);

    // Stage 5: Automatically Navigate to /login
    const t5 = setTimeout(() => {
      router.replace("/login");
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [router]);

  const handleSkipOrClick = () => {
    setFading(true);
    router.replace("/login");
  };

  return (
    <div
      onClick={handleSkipOrClick}
      className={`relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-teal-950 text-white overflow-hidden cursor-pointer transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      title="Click anywhere to continue to Sign In"
    >
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-teal-900/10 blur-3xl pointer-events-none" />

      {/* Skip Button in Top Right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSkipOrClick();
        }}
        type="button"
        className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-all backdrop-blur-md border border-white/10"
      >
        <span>Skip to Sign In</span>
        <ArrowRight className="h-3 w-3" />
      </button>

      {/* Center Splash Branding */}
      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center space-y-6">
        
        {/* Animated Medora Heartbeat Emblem */}
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-2xl shadow-teal-500/30 ring-4 ring-teal-500/20 animate-pulse">
            <Activity className="h-12 w-12 text-white stroke-[2.5]" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-teal-500/20 blur-xl animate-ping opacity-30 -z-10" />
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-teal-500/10 border border-teal-400/20 text-[10px] font-bold uppercase tracking-widest text-teal-300">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
            National Healthcare Architecture
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
            MEDORA
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-sm mx-auto leading-relaxed">
            Transparent, Connected & Auditable Healthcare Platform
          </p>
        </div>

        {/* Animated Heartbeat ECG SVG Wave */}
        <div className="w-64 h-10 flex items-center justify-center overflow-hidden opacity-90 my-2">
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
              strokeDasharray="300"
              strokeDashoffset="0"
            />
          </svg>
        </div>

        {/* Animated Progress Bar & Live Stage Message */}
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

        {/* Bottom Hint */}
        <p className="text-[11px] text-slate-500 font-medium pt-2">
          Redirecting to Sign In automatically... (or tap anywhere)
        </p>

        {/* Feature Badges Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>ABDM Integrated</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Multi-Hospital</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Zero IDOR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
