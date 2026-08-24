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
import { useLocalization } from "@/lib/localization";

export interface LiveQueueCardProps {
  queueEntry?: QueueEntry;
  onRefresh?: () => void;
}

export function LiveQueueCard({ queueEntry: initialEntry, onRefresh }: LiveQueueCardProps) {
  const { user } = useAuth();
  const { t, formatStatus } = useLocalization();
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
    <Card className={`overflow-hidden rounded-3xl border transition-all duration-300 shadow-xs ${
      isCalled 
        ? "bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 border-amber-300 shadow-amber-500/10 ring-2 ring-amber-400/40" 
        : isInConsultation
        ? "bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/40 border-teal-300 shadow-teal-700/5 ring-2 ring-teal-500/20"
        : "bg-white border-slate-200 hover:border-teal-300 shadow-slate-900/5"
    }`}>
      {/* Top Header Banner */}
      <div className={`px-5 py-3 flex items-center justify-between border-b ${
        isCalled 
          ? "border-amber-200/80 bg-amber-100/60 text-amber-950" 
          : isInConsultation 
          ? "border-teal-100 bg-teal-100/50 text-teal-950" 
          : "border-slate-100 bg-slate-50/70 text-slate-800"
      }`}>
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs ${
            isCalled 
              ? "bg-amber-600 text-white" 
              : isInConsultation 
              ? "bg-teal-700 text-white" 
              : "bg-teal-700 text-white"
          }`}>
            <Sparkles className="h-3 w-3" /> {t("queue.live_queue")}
          </span>
          <span className="text-xs font-bold text-slate-700">
            {entry.department_name}
          </span>
        </div>
        <Badge 
          variant={isCalled ? "warning" : isInConsultation ? "success" : "teal"} 
          className="text-xs font-bold px-2.5 py-0.5 shadow-2xs font-sans"
        >
          {formatStatus(entry.status)}
        </Badge>
      </div>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Token is Called Announcement Banner */}
        {isCalled && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex items-center gap-3.5 text-white shadow-md shadow-amber-500/20 animate-in fade-in-50">
            <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center flex-shrink-0 border border-white/30">
              <Volume2 className="h-6 w-6 animate-bounce" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-black tracking-tight block">
                {t("status.called")}!
              </span>
              <p className="text-xs text-amber-50 font-medium mt-0.5">
                Please proceed immediately to <strong className="text-white underline underline-offset-2 font-bold">{entry.room_number || "OPD Room 102"}</strong> for consultation.
              </p>
            </div>
          </div>
        )}

        {/* Active Consultation In-Progress Announcement Banner */}
        {isInConsultation && (
          <div className="rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-700 p-3.5 flex items-center gap-3 text-white shadow-md shadow-teal-800/15 animate-in fade-in-50">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center flex-shrink-0 border border-white/30">
              <Stethoscope className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black tracking-tight block">
                {t("status.in_consultation")}
              </span>
              <p className="text-[11px] text-teal-100 font-medium">
                {entry.doctor_name} is actively consulting with you in <strong className="text-white font-bold">{entry.room_number || "Room 102"}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Primary Token Display & Waiting Estimation Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
          {/* Token Box */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
              {t("queue.your_token")}
            </span>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900">
                #{entry.token_number}
              </span>
              <span className="text-xs font-bold text-teal-800 bg-teal-100/80 border border-teal-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                {entry.room_number || "Room 102"}
              </span>
            </div>
          </div>

          {/* Dynamic Waiting Estimate Box (Phase B.3) */}
          {isWaiting && estimate ? (
            <div className="sm:text-right p-3 rounded-xl bg-white border border-teal-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block flex items-center sm:justify-end gap-1">
                <Hourglass className="h-3.5 w-3.5 text-teal-600 animate-spin" /> {t("queue.estimated_wait")}
              </span>
              <span className="text-lg sm:text-xl font-black text-teal-950 block mt-0.5 font-mono">
                {estimate.display_text}
              </span>
              <span className="text-[11px] text-teal-700 font-semibold block mt-0.5">
                {estimate.people_ahead === 0 ? "Next in line" : `${estimate.people_ahead} ${t("queue.patients_ahead")}`}
              </span>
            </div>
          ) : (
            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Queue Status
              </span>
              <span className="text-sm font-extrabold text-slate-800 block mt-0.5">
                {isCalled ? "Ready for Entry" : isInConsultation ? "In Cabin" : "Checked In"}
              </span>
            </div>
          )}
        </div>

        {/* Doctor Delay Notice (if detected) */}
        {isWaiting && estimate?.delay_status === "DELAYED" && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2.5 text-xs text-amber-900 animate-in fade-in-50">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-medium">
              {estimate.delay_notice || "Doctor is running slightly behind schedule. Waiting time updated."}
            </span>
          </div>
        )}

        {/* Context Details Strip */}
        <div className="p-3.5 rounded-2xl text-xs space-y-2 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold text-slate-900">
              <div className="h-6 w-6 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                <Stethoscope className="h-3.5 w-3.5" />
              </div>
              {entry.doctor_name}
            </span>
            <span className="font-semibold text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {entry.organization_name}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {t("status.checked_in")}: {new Date(entry.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {estimate?.currently_serving_token && (
              <span className="font-semibold text-slate-700">
                Serving: <strong className="font-mono text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">#{estimate.currently_serving_token}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Phase B.4: Long Wait Option Discovery */}
        {isWaiting && estimate && estimate.estimated_upper_minutes >= 30 && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-xs text-slate-600">Want to check earlier slots or clinics?</span>
            <Link
              href="/patient/appointments/book"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline shrink-0"
            >
              <span>Explore Options</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Transparency & Non-Guarantee Note */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 italic pt-1">
          <span>
            {isCalled
              ? "Doctor is ready for your consultation."
              : isInConsultation
              ? "Clinical consultation currently in progress."
              : "Estimated waiting time adapts dynamically as consultations progress."}
          </span>
          <span className="not-italic text-slate-500 font-mono text-[10px] flex items-center gap-1.5 flex-shrink-0 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {lastUpdatedSec === 0 ? "Live" : `${lastUpdatedSec}s ago`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
