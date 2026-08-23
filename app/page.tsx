"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, ShieldCheck, Sparkles, HeartPulse } from "lucide-react";

export default function SplashGatewayPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(20);
  const [statusMessage, setStatusMessage] = useState("Initializing Sovereign Identity...");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Stage 1: Facility Memberships
    const t1 = setTimeout(() => {
      setProgress(50);
      setStatusMessage("Verifying Facility & Organization Memberships...");
    }, 500);

    // Stage 2: RBAC & Permissions
    const t2 = setTimeout(() => {
      setProgress(85);
      setStatusMessage("Loading Multi-Factor Contextual Permissions...");
    }, 1100);

    // Stage 3: Ready
    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusMessage("MEDORA Ready — Launching Sign-In...");
    }, 1700);

    // Stage 4: Fade out
    const t4 = setTimeout(() => {
      setFading(true);
    }, 2200);

    // Stage 5: Automatically Navigate to /login
    const t5 = setTimeout(() => {
      router.replace("/login");
    }, 2600);

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
      className={`relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950 text-white overflow-hidden cursor-pointer select-none transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      title="Click anywhere to continue to Sign In"
    >
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-teal-900/10 blur-3xl pointer-events-none" />

      {/* Top Right Skip Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSkipOrClick();
        }}
        type="button"
        className="absolute top-6 right-6 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 hover:text-white transition-all backdrop-blur-md border border-white/10 shadow-lg group active:scale-95"
      >
        <span>Skip to Sign In</span>
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Center Splash Branding Container */}
      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center space-y-6">
        
        {/* Animated Medora Heartbeat Emblem */}
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-2xl shadow-teal-500/30 ring-4 ring-teal-500/20 animate-pulse">
            <Activity className="h-12 w-12 text-white stroke-[2.5]" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-teal-500/20 blur-xl animate-ping opacity-30 -z-10" />
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/20 text-[10px] font-bold uppercase tracking-widest text-teal-300">
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
              d="M0 30 H60 L75 10 L90 50 L105 20 L120 38 L135 30 H180 L195 10 L210 50 L225 20 L240 38 L255 30 H300"
              className="stroke-dasharray-anim"
            />
          </svg>
        </div>

        {/* Progress Bar & Real-Time Status Text */}
        <div className="w-full max-w-xs space-y-2.5">
          <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-sm shadow-teal-400/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
            <span className="truncate max-w-[220px]">{statusMessage}</span>
            <span className="font-mono text-teal-300 font-bold">{progress}%</span>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="pt-4 flex flex-col items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSkipOrClick();
            }}
            type="button"
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/40 hover:shadow-teal-700/50 transition-all active:scale-95"
          >
            <span>Enter MEDORA</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <span className="text-[10px] text-slate-400">Click anywhere to proceed</span>
        </div>

      </div>

      {/* Footer Sovereign Compliance Indicator */}
      <div className="absolute bottom-6 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
        <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
        <span>Strict Anti-IDOR Authorization • Real-Time Synchronization • ABDM Compliant</span>
      </div>

      <style jsx>{`
        .stroke-dasharray-anim {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: ecgDash 2s linear infinite;
        }
        @keyframes ecgDash {
          0% {
            stroke-dashoffset: 400;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}