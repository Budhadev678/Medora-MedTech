"use client";

import React from "react";
import Link from "next/link";
import { 
  Calendar, 
  HeartPulse, 
  Receipt, 
  FileText, 
  FlaskConical, 
  Pill, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Share2,
  User,
  Search,
  Building2,
  Stethoscope,
  ChevronRight,
  Bell,
  Sparkles,
  QrCode,
  Package
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { RecordCard } from "@/components/patient/record-card";
import { findIdentityById, calculateProfileCompleteness, StoredIdentity } from "@/lib/data/identity-store";
import { getPatientEncounters } from "@/lib/data/encounter-store";
import { getPatientMedicalDocuments } from "@/lib/data/medical-document-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { QueueStore } from "@/lib/data/queue-store";
import { LiveQueueCard } from "@/components/patient/live-queue-card";
import { Appointment, QueueEntry } from "@/types/database.types";

export default function PatientHomePage() {
  const { user } = useAuth();
  const [livePatient, setLivePatient] = React.useState<StoredIdentity | null>(() => {
    return user ? findIdentityById(user.identifier) || user : null;
  });
  const [completeness, setCompleteness] = React.useState(() => calculateProfileCompleteness(livePatient));
  const [recentEncounters, setRecentEncounters] = React.useState(() => {
    return user ? getPatientEncounters(user.identifier || user.id) : [];
  });
  const [appointments, setAppointments] = React.useState<Appointment[]>(() => {
    return user ? AppointmentStore.getAppointmentsForPatient(user.identifier || user.id).filter(a => a.status === "CONFIRMED" || a.status === "CHECKED_IN") : [];
  });
  const [activeQueue, setActiveQueue] = React.useState<QueueEntry | null>(() => {
    return user ? QueueStore.getPatientActiveQueueEntry(user.identifier || user.id) : null;
  });

  React.useEffect(() => {
    const refresh = () => {
      if (user) {
        const live = findIdentityById(user.identifier) || user;
        setLivePatient(live);
        setCompleteness(calculateProfileCompleteness(live));
        setRecentEncounters(getPatientEncounters(user.identifier || user.id));
        setAppointments(AppointmentStore.getAppointmentsForPatient(user.identifier || user.id).filter(a => a.status === "CONFIRMED" || a.status === "CHECKED_IN"));
        setActiveQueue(QueueStore.getPatientActiveQueueEntry(user.identifier || user.id));
      }
    };
    refresh();
    window.addEventListener("medora-identity-updated", refresh);
    window.addEventListener("medora-encounters-updated", refresh);
    window.addEventListener("medora-queue-updated", refresh);
    return () => {
      window.removeEventListener("medora-identity-updated", refresh);
      window.removeEventListener("medora-encounters-updated", refresh);
      window.removeEventListener("medora-queue-updated", refresh);
    };
  }, [user]);

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        {/* 1. Header Greeting */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Good morning,
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {livePatient?.fullName || "Patient"}
            </h1>
          </div>
          <Link href="/patient/emergency">
            <button className="flex items-center gap-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs transition-all">
              <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
              <span>SOS</span>
            </button>
          </Link>
        </div>

        {/* Live Queue Banner if Checked-In Today */}
        {activeQueue && (
          <section aria-label="Live Queue Status">
            <LiveQueueCard queueEntry={activeQueue} />
          </section>
        )}

        {/* 2. Digital MEDORA ID Passport Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-teal-950 p-5 text-white shadow-md">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-teal-600/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-100">
                  Verified Health ID
                </span>
                <span className="text-[10px] font-semibold text-teal-200">MEDORA Network</span>
              </div>
              <span className="font-mono text-lg font-extrabold tracking-wider block mt-2">
                {livePatient?.identifier || "PAT-1001"}
              </span>
              <span className="text-xs text-teal-100/90 font-medium block">
                {livePatient?.fullName || "Patient"}
              </span>
            </div>
            <Link href="/patient/profile" className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <QrCode className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-600/40 flex items-center justify-between text-[11px] text-teal-200 relative z-10">
            <span>Blood Group: <strong className="text-white">{livePatient?.patientData?.bloodGroup || "O+"}</strong></span>
            <span>
              ABHA: <strong className={livePatient?.patientData?.abhaStatus === "LINKED" ? "text-emerald-300" : "text-amber-300"}>
                {livePatient?.patientData?.abhaStatus === "LINKED" ? "Linked" : "Not Linked"}
              </strong>
            </span>
          </div>

          <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
        </div>

        {/* Profile Completeness Alert (if incomplete) */}
        {!completeness.isComplete && (
          <Link href="/patient/profile">
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold font-mono flex-shrink-0">
                  {completeness.percentage}%
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Complete Your Profile</span>
                  <span className="text-[11px] text-slate-500 block">
                    Add {completeness.missingRecommended[0] || "missing details"} to enable instant admissions
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        )}

        {/* 3. Important Upcoming Item */}
        <section aria-label="Important Information">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Upcoming Schedule
            </h2>
            <Link href="/patient/appointments" className="text-xs font-bold text-teal-700 hover:underline">
              View All
            </Link>
          </div>

          {appointments.length > 0 ? (
            <AppointmentCard
              appointment={appointments[0]}
              onRefresh={() => {}}
            />
          ) : (
            <Card className="bg-white border-dashed border-slate-200 text-center p-4 rounded-2xl">
              <span className="text-xs text-slate-500 block">No upcoming appointments scheduled.</span>
              <Link href="/patient/appointments/book" className="text-xs font-bold text-teal-700 hover:underline mt-1 inline-block">
                Book a doctor consultation →
              </Link>
            </Card>
          )}
        </section>

        {/* 4. Quick Actions Grid */}
        <section aria-label="Quick Actions">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Link 
              href="/patient/appointments" 
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/30 transition-all active:scale-95 text-center group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:scale-105 transition-transform mb-1.5">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Appointments</span>
            </Link>

            <Link 
              href="/patient/pharmacy" 
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 transition-all active:scale-95 text-center group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition-transform mb-1.5">
                <Pill className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Pharmacy</span>
            </Link>

            <Link 
              href="/patient/lab" 
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/30 transition-all active:scale-95 text-center group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform mb-1.5">
                <FlaskConical className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Lab Reports</span>
            </Link>

            <Link 
              href="/patient/billing" 
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50/30 transition-all active:scale-95 text-center group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 group-hover:scale-105 transition-transform mb-1.5">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Billing</span>
            </Link>
          </div>
        </section>

        {/* 5. Recent Healthcare Activity */}
        <section aria-label="Recent Healthcare Activity">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Activity
            </h2>
            <Link href="/patient/records" className="text-xs font-bold text-teal-700 hover:underline">
              View Timeline
            </Link>
          </div>

          {recentEncounters.length > 0 ? (
            <div className="space-y-2.5">
              {recentEncounters.slice(0, 3).map((enc) => (
                <RecordCard
                  key={enc.id}
                  id={enc.id}
                  category="consultation"
                  title={`${enc.encounter_type.replace(/_/g, " ")} — ${enc.department_name}`}
                  facilityName={enc.organization_name}
                  date={new Date(enc.started_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  summary={enc.reason_for_visit ? `Reason: ${enc.reason_for_visit}` : `Clinical visit attended by ${enc.provider_name}.`}
                  actionHref="/patient/records"
                  actionLabel="View Details"
                />
              ))}
            </div>
          ) : (
            <Card className="bg-white border-slate-200 text-center p-4">
              <span className="text-xs text-slate-500">No healthcare activity recorded yet.</span>
            </Card>
          )}
        </section>

        {/* 6. Emergency SOS Banner */}
        <section aria-label="Emergency Access">
          <Card className="bg-red-50/60 border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-red-950">Emergency Assistance</h3>
                  <p className="text-[11px] text-red-700">Instant SOS card, emergency contacts & blood info.</p>
                </div>
              </div>
              <Link href="/patient/emergency">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold h-8">
                  Open SOS
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </RoleGuard>
  );
}
