"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Clock, 
  Sparkles, 
  Building2, 
  Stethoscope, 
  Volume2, 
  RefreshCw, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Tv
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { WaitingTimeEstimationService } from "@/lib/services/waiting-time-service";
import { QueueEntry, WaitingEstimateResult } from "@/types/database.types";
import { LiveQueueCard } from "@/components/patient/live-queue-card";

export default function QueueDisplayPage() {
  const { user } = useAuth();
  const [selectedFacility, setSelectedFacility] = useState("HSP-1001");
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [activePatientEntry, setActivePatientEntry] = useState<QueueEntry | null>(null);
  const [viewMode, setViewMode] = useState<"patient" | "public_board">("patient");
  const todayStr = getTodayDateStr();

  const loadData = () => {
    const queue = QueueStore.getQueueForFacility(selectedFacility, todayStr);
    setQueueEntries(queue);

    if (user && user.role === "patient") {
      const patientQueue = QueueStore.getPatientActiveQueueEntry(user.identifier || user.id);
      setActivePatientEntry(patientQueue);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("medora-queue-updated", handleUpdate);
    return () => window.removeEventListener("medora-queue-updated", handleUpdate);
  }, [user, selectedFacility]);

  const inConsultEntries = queueEntries.filter((q) => q.status === "IN_CONSULTATION");
  const calledEntries = queueEntries.filter((q) => q.status === "CALLED");
  const waitingEntries = queueEntries.filter((q) => q.status === "WAITING");

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Live OPD Queue & Token Board</h1>
            <Badge variant="teal" className="text-xs font-mono">{selectedFacility}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Server-authoritative queue movement with deterministic sequential tokens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "patient" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("patient")}
            className="text-xs rounded-xl"
          >
            My Queue Token
          </Button>
          <Button
            variant={viewMode === "public_board" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("public_board")}
            className="text-xs rounded-xl gap-1.5"
          >
            <Tv className="h-3.5 w-3.5" /> Public Display Board
          </Button>
        </div>
      </div>

      {/* Mode 1: Patient Personal Queue Card */}
      {viewMode === "patient" && (
        <div className="space-y-4">
          {activePatientEntry ? (
            <LiveQueueCard queueEntry={activePatientEntry} onRefresh={loadData} />
          ) : (
            <Card className="bg-white border-slate-200 rounded-3xl p-8 text-center">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Active Queue Token</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                You do not have a checked-in token in the active queue today. Book an appointment or check in at the reception desk upon arrival.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Link href="/patient/appointments/book">
                  <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-xs rounded-2xl">
                    Book Appointment
                  </Button>
                </Link>
                <Link href="/patient/appointments">
                  <Button size="sm" variant="outline" className="text-xs rounded-2xl">
                    View Appointments
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Mode 2: Public Display Board (Tokens only, zero patient name exposure) */}
      {viewMode === "public_board" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Now Serving / Called */}
            <Card className="bg-amber-500 text-white rounded-3xl border-amber-600 shadow-md p-6">
              <span className="text-[11px] font-black uppercase tracking-wider block text-amber-100">
                NOW SERVING / CALLED
              </span>
              {calledEntries.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {calledEntries.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border-b border-amber-400/40 pb-2">
                      <span className="text-3xl font-black font-mono tracking-tight">{c.token_number}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold block">{c.room_number || "Room 102"}</span>
                        <span className="text-[11px] text-amber-100">{c.doctor_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : inConsultEntries.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {inConsultEntries.map((c) => (
                    <div key={c.id} className="flex items-center justify-between border-b border-amber-400/40 pb-2">
                      <span className="text-3xl font-black font-mono tracking-tight">{c.token_number}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold block">{c.room_number || "Room 102"}</span>
                        <span className="text-[11px] text-amber-100">{c.doctor_name} (In Consult)</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-center text-amber-100 text-xs">
                  No patient currently called. Doctor will call the next token shortly.
                </div>
              )}
            </Card>

            {/* Next in Line */}
            <Card className="bg-teal-900 text-white rounded-3xl border-teal-800 shadow-md p-6">
              <span className="text-[11px] font-black uppercase tracking-wider block text-teal-200">
                NEXT IN LINE
              </span>
              {waitingEntries.length > 0 ? (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-3xl font-black font-mono tracking-tight text-teal-100">
                    {waitingEntries[0].token_number}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-bold block">{waitingEntries[0].room_number || "Room 102"}</span>
                    <span className="text-[11px] text-teal-300">{waitingEntries[0].doctor_name}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-center text-teal-300 text-xs">
                  No waiting patients in queue.
                </div>
              )}
            </Card>
          </div>

          {/* Waiting Tokens Grid */}
          <Card className="bg-white border-slate-200 rounded-3xl shadow-xs">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Waiting Tokens ({waitingEntries.length})
                </CardTitle>
                <span className="text-xs text-slate-400 font-medium">Privacy-safe: Token numbers only</span>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {waitingEntries.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  All waiting tokens have been called.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {waitingEntries.map((w, idx) => (
                    <div
                      key={w.id}
                      className={`p-3 rounded-2xl border text-center font-mono ${
                        idx === 0
                          ? "bg-teal-50 border-teal-300 text-teal-900 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="text-base font-bold block">{w.token_number}</span>
                      <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                        Pos #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
