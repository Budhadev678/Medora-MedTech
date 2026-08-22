"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Clock, 
  Users, 
  MapPin, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  Volume2,
  RefreshCw,
  Hourglass,
  AlertTriangle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueueEntry, WaitingEstimateResult } from "@/types/database.types";
import { WaitingTimeEstimationService } from "@/lib/services/waiting-time-service";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { useAuth } from "@/lib/auth/auth-context";

export interface LiveQueueCardProps {
  queueEntry?: QueueEntry;
  onRefresh?: () => void;
}

export function LiveQueueCard({ queueEntry: initialEntry, onRefresh }: LiveQueueCardProps) {
  const { user } = useAuth();
  const [entry, setEntry] = useState<QueueEntry | null>(initialEntry || null);
  const [estimate, setEstimate] = useState<WaitingEstimateResult | null>(null);
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0);

  const loadLatestState = () => {
    let targetEntry: QueueEntry | null = null;
    if (initialEntry) {
      targetEntry = QueueStore.getQueueEntryById(initialEntry.id) || initialEntry;
    } else if (user) {
      targetEntry = QueueStore.getPatientActiveQueueEntry(user.identifier || user.id);
    }

    setEntry(targetEntry);
    if (targetEntry) {
      const est = WaitingTimeEstimationService.calculatePatientWaitingEstimate(targetEntry.id, user);
      setEstimate(est);
      setLastUpdatedSec(0);
    }
  };

  useEffect(() => {
    loadLatestState();
    const handleUpdate = () => loadLatestState();
    window.addEventListener("medora-queue-updated", handleUpdate);

    // Dynamic second counter for freshness display
    const secTimer = setInterval(() => {
      setLastUpdatedSec((prev) => prev + 10);
    }, 10000);

    return () => {
      window.removeEventListener("medora-queue-updated", handleUpdate);
      clearInterval(secTimer);
    };
  }, [user, initialEntry]);

  if (!entry) return null;

  const isCalled = entry.status === "CALLED";
  const isInConsultation = entry.status === "IN_CONSULTATION";
  const isWaiting = entry.status === "WAITING";

  return (
    <Card className={`overflow-hidden rounded-3xl border transition-all shadow-md ${
      isCalled 
        ? "bg-amber-500 text-white border-amber-600 ring-4 ring-amber-400/30 animate-pulse" 
        : isInConsultation
        ? "bg-teal-900 text-white border-teal-800"
        : "bg-white border-teal-300 shadow-teal-700/5"
    }`}>
      {/* Header Banner */}
      <div className={`p-4 flex items-center justify-between border-b ${
        isCalled ? "border-amber-400/50 bg-amber-600/30" : isInConsultation ? "border-teal-800 bg-teal-950/40" : "border-slate-100 bg-teal-50/70"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
            isCalled ? "bg-white text-amber-900" : isInConsultation ? "bg-teal-700 text-white" : "bg-teal-700 text-white"
          }`}>
            <Sparkles className="h-3 w-3" /> Live OPD Queue
          </span>
          <span className={`text-xs font-semibold ${isCalled || isInConsultation ? "text-white/90" : "text-slate-600"}`}>
            {entry.department_name}
          </span>
        </div>
        <Badge variant={isCalled ? "warning" : isInConsultation ? "success" : "teal"} className="text-xs font-bold font-mono">
          {entry.status}
        </Badge>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Token & Called Announcement Strip */}
        {isCalled && (
          <div className="rounded-2xl bg-white/20 p-3 flex items-center gap-3 border border-white/30 text-white">
            <div className="h-10 w-10 rounded-2xl bg-white text-amber-600 flex items-center justify-center flex-shrink-0">
              <Volume2 className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-extrabold block">Your Token is Being Called!</span>
              <span className="text-[11px] opacity-90 block">
                Please proceed immediately to <strong>{entry.room_number || "OPD Room 102"}</strong>.
              </span>
            </div>
          </div>
        )}

        {/* Primary Token Display & Waiting Estimation Box */}
        <div className="grid grid-cols-2 gap-3 items-center">
          {/* Token Box */}
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isCalled || isInConsultation ? "text-white/80" : "text-slate-400"
            }`}>
              Your Token
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                isCalled || isInConsultation ? "text-white" : "text-slate-900"
              }`}>
                #{entry.token_number}
              </span>
              <span className={`text-[11px] font-semibold ${
                isCalled || isInConsultation ? "text-white/80" : "text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md"
              }`}>
                {entry.room_number || "Room 102"}
              </span>
            </div>
          </div>

          {/* Dynamic Waiting Estimate Box (Phase B.3) */}
          {isWaiting && estimate && (
            <div className="text-right p-2.5 rounded-2xl bg-teal-50/90 border border-teal-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block flex items-center justify-end gap-1">
                <Hourglass className="h-3 w-3 text-teal-600 animate-spin" /> Estimated Wait
              </span>
              <span className="text-lg sm:text-xl font-black text-teal-950 block mt-0.5">
                {estimate.display_text}
              </span>
              <span className="text-[10px] text-teal-700 font-medium block">
                {estimate.people_ahead === 0 ? "You're next in line" : `${estimate.people_ahead} people ahead`}
              </span>
            </div>
          )}
        </div>

        {/* Doctor Delay Notice (if detected) */}
        {isWaiting && estimate?.delay_status === "DELAYED" && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-2.5 flex items-center gap-2 text-xs text-amber-800 animate-in fade-in-50">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-[11px] font-medium">
              {estimate.delay_notice || "Doctor is running slightly behind schedule. Waiting time updated."}
            </span>
          </div>
        )}

        {/* Context Details Strip */}
        <div className={`p-3 rounded-2xl text-xs space-y-1.5 border ${
          isCalled 
            ? "bg-amber-600/20 border-amber-400/40 text-white" 
            : isInConsultation 
            ? "bg-teal-800/50 border-teal-700/50 text-teal-100" 
            : "bg-slate-50 border-slate-200 text-slate-700"
        }`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Stethoscope className="h-3.5 w-3.5 opacity-70" />
              {entry.doctor_name}
            </span>
            <span className="font-semibold text-[11px] opacity-80">{entry.organization_name}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-current/10 text-[11px]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 opacity-70" />
              Checked-in: {new Date(entry.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {estimate?.currently_serving_token && (
              <span className="font-semibold">
                Serving: <strong className="font-mono">#{estimate.currently_serving_token}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Phase B.4: Long Wait Option Discovery */}
        {isWaiting && estimate && estimate.estimated_upper_minutes >= 30 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[11px] text-slate-600">Want to check earlier slots or clinics?</span>
            <Link
              href="/patient/appointments/book"
              className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline shrink-0"
            >
              <span>Explore Options</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Transparency & Non-Guarantee Note */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 italic pt-0.5">
          <span>
            {isCalled
              ? "Doctor is ready for your consultation."
              : isInConsultation
              ? "Clinical consultation currently in progress."
              : "Estimated waiting time adapts dynamically as consultations progress."}
          </span>
          <span className="not-italic text-slate-400 font-mono flex items-center gap-1 flex-shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {lastUpdatedSec === 0 ? "Live" : `${lastUpdatedSec}s ago`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
