"use client";

import React, { useState, useEffect } from "react";
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
  Package,
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { RecordCard } from "@/components/patient/record-card";
import { findIdentityById, calculateProfileCompleteness, StoredIdentity, ProfileCompletenessResult } from "@/lib/data/identity-store";
import { getPatientEncounters } from "@/lib/data/encounter-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { QueueStore } from "@/lib/data/queue-store";
import { getBillsByPatient } from "@/lib/data/billing-store";
import { getPatientLabReports } from "@/lib/data/lab-order-store";
import { LiveQueueCard } from "@/components/patient/live-queue-card";
import { Appointment, QueueEntry, HealthcareBill, HealthcareLabReport } from "@/types/database.types";

export default function PatientHomePage() {
  const { user } = useAuth();
  const [livePatient, setLivePatient] = useState<StoredIdentity | null>(null);
  const [completeness, setCompleteness] = useState<ProfileCompletenessResult>({ 
    percentage: 100, 
    isComplete: true, 
    missingRequired: [], 
    missingRecommended: [], 
    missingOptional: [] 
  });
  const [recentEncounters, setRecentEncounters] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeQueue, setActiveQueue] = useState<QueueEntry | null>(null);
  const [unpaidBills, setUnpaidBills] = useState<HealthcareBill[]>([]);
  const [readyReports, setReadyReports] = useState<HealthcareLabReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshHomeData = () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const patientId = user.identifier || user.id || "PAT-1001";
    const live = findIdentityById(patientId) || user;
    setLivePatient(live);
    setCompleteness(calculateProfileCompleteness(live));
    setRecentEncounters(getPatientEncounters(patientId));
    
    // Load active appointments
    const allApts = AppointmentStore.getAppointmentsForPatient(patientId);
    const validUpcoming = allApts.filter(
      (a) => a.status === "CONFIRMED" || a.status === "CHECKED_IN" || a.status === "REQUESTED"
    );
    setAppointments(validUpcoming);

    // Active Live Queue (only if patient is checked in today)
    const queue = QueueStore.getPatientActiveQueueEntry(patientId);
    setActiveQueue(queue);

    // Real attention items
    const bills = getBillsByPatient(patientId);
    const dueBills = bills.filter(
      (b) => b.patient_responsibility > 0 && b.status !== "CANCELLED"
    );
    setUnpaidBills(dueBills);

    const reports = getPatientLabReports(patientId, false);
    const released = reports.filter((r) => r.status === "RELEASED" || r.status === "READY");
    setReadyReports(released);

    setIsLoading(false);
  };

  useEffect(() => {
    refreshHomeData();
    const handleUpdate = () => refreshHomeData();
    window.addEventListener("medora-identity-updated", handleUpdate);
    window.addEventListener("medora-encounters-updated", handleUpdate);
    window.addEventListener("medora-queue-updated", handleUpdate);
    window.addEventListener("medora-appointments-updated", handleUpdate);
    window.addEventListener("medora-bills-updated", handleUpdate);
    window.addEventListener("medora-lab-orders-updated", handleUpdate);

    return () => {
      window.removeEventListener("medora-identity-updated", handleUpdate);
      window.removeEventListener("medora-encounters-updated", handleUpdate);
      window.removeEventListener("medora-queue-updated", handleUpdate);
      window.removeEventListener("medora-appointments-updated", handleUpdate);
      window.removeEventListener("medora-bills-updated", handleUpdate);
      window.removeEventListener("medora-lab-orders-updated", handleUpdate);
    };
  }, [user]);

  // Determine nearest upcoming appointment
  const nearestAppointment = appointments.length > 0 ? appointments[0] : null;

  // Real conditions for Needs Attention
  const attentionItems = [];
  if (completeness.percentage < 100 || !completeness.isComplete) {
    const missingField = completeness.missingRequired[0] || completeness.missingRecommended[0] || completeness.missingOptional[0] || "ABHA Health ID";
    const isAbhaMissing = livePatient?.patientData?.abhaStatus !== "LINKED";
    attentionItems.push({
      id: "profile_incomplete",
      title: isAbhaMissing ? "Link ABHA Health ID" : "Complete Your Profile",
      description: isAbhaMissing
        ? "Link your 14-digit Ayushman Bharat Health Account (ABHA) for seamless longitudinal health records."
        : `Add ${missingField} to complete your verified healthcare profile.`,
      actionHref: isAbhaMissing ? "/patient/profile/abha" : "/patient/profile",
      actionLabel: isAbhaMissing ? "Link ABHA" : "Complete Profile",
      icon: isAbhaMissing ? QrCode : User,
      color: "border-amber-200 bg-amber-50/70 text-amber-900",
    });
  }
  if (unpaidBills.length > 0) {
    const firstBill = unpaidBills[0];
    attentionItems.push({
      id: `bill_${firstBill.id}`,
      title: "Payment Due",
      description: `₹${firstBill.patient_responsibility.toFixed(2)} remains payable for ${firstBill.facility_name}.`,
      actionHref: `/patient/billing/${firstBill.id}`,
      actionLabel: "View Bill",
      icon: Receipt,
      color: "border-purple-200 bg-purple-50/70 text-purple-900",
    });
  }
  if (readyReports.length > 0) {
    const latestReport = readyReports[0];
    attentionItems.push({
      id: `report_${latestReport.id}`,
      title: "Lab Report Ready",
      description: `Your verified diagnostic report from ${latestReport.laboratory_name} is available.`,
      actionHref: `/patient/health?tab=lab_reports`,
      actionLabel: "View Report",
      icon: FlaskConical,
      color: "border-indigo-200 bg-indigo-50/70 text-indigo-900",
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4 py-8 max-w-2xl mx-auto">
        <div className="h-6 w-40 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        <div className="h-40 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150 font-sans">
        
        {/* 1. Header Greeting / Patient Identity */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Good morning,
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {livePatient?.fullName || "Patient"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Your healthcare at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-mono text-teal-800 bg-teal-50/70 border-teal-200">
              {livePatient?.identifier || "PAT-1001"}
            </Badge>
          </div>
        </div>

        {/* 2. Active Queue Status (Visible only if patient is actively checked in) */}
        {activeQueue && (
          <section aria-label="Active Queue">
            <LiveQueueCard queueEntry={activeQueue} onRefresh={refreshHomeData} />
          </section>
        )}

        {/* 3. Upcoming Schedule Section */}
        <section aria-label="Upcoming Schedule">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Upcoming Schedule
            </h2>
            {appointments.length > 1 && (
              <Link href="/patient/appointments" className="text-xs font-bold text-teal-700 hover:underline">
                View All ({appointments.length})
              </Link>
            )}
          </div>

          {nearestAppointment ? (
            <AppointmentCard
              appointment={nearestAppointment}
              onRefresh={refreshHomeData}
            />
          ) : (
            <Card className="bg-white border-dashed border-slate-200 text-center p-5 rounded-2xl">
              <Calendar className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
              <span className="text-xs font-bold text-slate-700 block">No Upcoming Appointments</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                You do not have any consultations scheduled this week.
              </span>
              <Link href="/patient/appointments/book" className="mt-3 inline-block">
                <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl h-8">
                  Book Doctor Appointment →
                </Button>
              </Link>
            </Card>
          )}
        </section>

        {/* 4. Needs Your Attention (Rendered only when real action items exist) */}
        {attentionItems.length > 0 && (
          <section aria-label="Needs Your Attention" className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Needs Your Attention
            </h2>
            <div className="space-y-2">
              {attentionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-2xs transition-all ${item.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white/80 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{item.title}</span>
                        <span className="text-[11px] opacity-90 block leading-tight">{item.description}</span>
                      </div>
                    </div>
                    <Link href={item.actionHref}>
                      <Button size="sm" variant="outline" className="text-xs font-bold bg-white h-7 px-3 rounded-xl shrink-0">
                        {item.actionLabel} <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. 4 Canonical Quick Actions */}
        <section aria-label="Quick Actions">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link 
              href="/patient/appointments/book" 
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/30 transition-all active:scale-95 text-center group shadow-2xs"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:scale-105 transition-transform mb-1.5">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Book Appointment</span>
            </Link>

            <Link 
              href="/patient/appointments" 
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50/30 transition-all active:scale-95 text-center group shadow-2xs"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 group-hover:scale-105 transition-transform mb-1.5">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">My Appointments</span>
            </Link>

            <Link 
              href="/patient/health" 
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 transition-all active:scale-95 text-center group shadow-2xs"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition-transform mb-1.5">
                <HeartPulse className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">My Health</span>
            </Link>

            <Link 
              href="/patient/billing" 
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50/30 transition-all active:scale-95 text-center group shadow-2xs"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 group-hover:scale-105 transition-transform mb-1.5">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Bills & Payments</span>
            </Link>
          </div>
        </section>

        {/* 6. Recent Healthcare Activity Preview */}
        <section aria-label="Recent Healthcare Activity">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Activity
            </h2>
            <Link href="/patient/health?tab=timeline" className="text-xs font-bold text-teal-700 hover:underline">
              View Health Timeline
            </Link>
          </div>

          {recentEncounters.length > 0 ? (
            <div className="space-y-2.5">
              {recentEncounters.slice(0, 3).map((enc) => (
                <RecordCard
                  key={enc.id}
                  id={enc.id}
                  category="consultation"
                  title={`${enc.encounter_type?.replace(/_/g, " ") || "Consultation"} — ${enc.department_name || "Department"}`}
                  facilityName={enc.organization_name}
                  date={new Date(enc.started_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  summary={enc.reason_for_visit ? `Reason: ${enc.reason_for_visit}` : `Clinical visit attended by ${enc.provider_name}.`}
                  actionHref="/patient/health?tab=visits"
                  actionLabel="View Details"
                />
              ))}
            </div>
          ) : (
            <Card className="bg-white border-slate-200 text-center p-4 rounded-2xl">
              <span className="text-xs text-slate-500">No recent healthcare activity recorded yet.</span>
            </Card>
          )}
        </section>
      </div>
    </RoleGuard>
  );
}

