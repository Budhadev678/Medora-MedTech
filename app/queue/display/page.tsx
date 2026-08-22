"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Stethoscope, 
  Volume2, 
  Clock, 
  Users, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { WaitingTimeEstimationService } from "@/lib/services/waiting-time-service";
import { QueueEntry } from "@/types/database.types";

export default function PublicQueueDisplayPage() {
  const todayStr = getTodayDateStr();
  const [selectedFacility, setSelectedFacility] = useState("HSP-1001");
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);

  const loadQueue = () => {
    const queue = QueueStore.getQueueForFacility(selectedFacility, todayStr);
    setQueueEntries(queue);
  };

  useEffect(() => {
    loadQueue();
    const handleUpdate = () => loadQueue();
    window.addEventListener("medora-queue-updated", handleUpdate);
    const interval = setInterval(loadQueue, 5000); // 5s fallback polling
    return () => {
      window.removeEventListener("medora-queue-updated", handleUpdate);
      clearInterval(interval);
    };
  }, [selectedFacility]);

  // Group by doctor
  const doctors = Array.from(new Set(queueEntries.map((q) => q.doctor_name)));

  const activeCalled = queueEntries.filter((q) => q.status === "CALLED" || q.status === "IN_CONSULTATION");
  const waitingTokens = queueEntries.filter((q) => q.status === "WAITING");
  const skippedTokens = queueEntries.filter((q) => q.status === "SKIPPED");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between font-sans">
      {/* Display Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {selectedFacility === "HSP-1001" ? "City Hospital Main OPD" : "Green Care Clinic"}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Live Outpatient Queue Board • OPD Hours • {todayStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 focus:outline-teal-500 cursor-pointer"
          >
            <option value="HSP-1001">City Hospital (HSP-1001)</option>
            <option value="CLN-1001">Green Care Clinic (CLN-1001)</option>
          </select>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-mono text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE SYNC</span>
          </div>
        </div>
      </header>

      {/* Main Calling Section */}
      <main className="my-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Call Announcement */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-teal-400 flex items-center gap-2">
              <Volume2 className="h-4 w-4" /> Now Calling / In Consultation
            </h2>
            <span className="text-xs text-slate-400">Proceed when your token is called</span>
          </div>

          {activeCalled.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500">
              <Clock className="h-10 w-10 mx-auto text-slate-600 mb-2" />
              <p className="text-base font-bold text-slate-400">No active consultation calls at this moment.</p>
              <span className="text-xs text-slate-500">Doctors will call the next tokens shortly.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCalled.map((entry) => {
                const isCallingNow = entry.status === "CALLED";
                return (
                  <div
                    key={entry.id}
                    className={`rounded-3xl p-6 border transition-all ${
                      isCallingNow
                        ? "bg-amber-500/20 border-amber-500/60 ring-2 ring-amber-500/30 animate-pulse text-amber-100"
                        : "bg-teal-900/40 border-teal-700/60 text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full">
                        {isCallingNow ? "Calling Now" : "In Consultation"}
                      </span>
                      <span className="text-xs font-bold text-teal-300 font-mono">
                        {entry.department_name}
                      </span>
                    </div>

                    <div className="my-4">
                      <span className="text-5xl font-black font-mono tracking-tight block">
                        #{entry.token_number}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Doctor</span>
                        <strong className="text-white">{entry.doctor_name}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Location</span>
                        <strong className="text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-800">
                          {entry.room_number || "Room 102"}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Waiting & Skipped Tokens Strip */}
        <div className="space-y-6">
          {/* Waiting Tokens */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-teal-400" /> Next In Line
              </h3>
              <Badge variant="teal" className="text-xs font-mono">
                {waitingTokens.length} Waiting
              </Badge>
            </div>

            {waitingTokens.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">Waiting list is empty.</p>
            ) : (
              <div className="space-y-2 pt-1">
                {waitingTokens.slice(0, 8).map((w, idx) => {
                  const est = WaitingTimeEstimationService.calculatePatientWaitingEstimate(w.id, null);
                  return (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-teal-300">
                          #{w.token_number}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {idx === 0 ? "Next in Line" : `${idx} ahead`}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-teal-200 bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-800/50">
                        {est.display_text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Skipped Tokens */}
          {skippedTokens.length > 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Missed / Recalled Tokens
                </h3>
                <span className="text-[10px] text-slate-400">Report to Reception Desk</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {skippedTokens.map((s) => (
                  <span
                    key={s.id}
                    className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300"
                  >
                    #{s.token_number}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Strip */}
      <footer className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>MEDORA Intelligent Outpatient Queue Engine • Phase B.2</span>
        <span>Strict HIPAA/DISHA Patient Privacy Compliant (No Personal Data Broadcast)</span>
      </footer>
    </div>
  );
}
