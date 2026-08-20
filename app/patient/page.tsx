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
  QrCode
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";

export default function PatientHomePage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-200">
        {/* Mobile Header / Patient Greeting */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              Welcome back,
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {user?.fullName || "Patient"}
            </h1>
          </div>
          <Link href="/patient/emergency">
            <button className="flex items-center gap-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs transition-all">
              <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
              <span>SOS</span>
            </button>
          </Link>
        </div>

        {/* Digital Medora ID Card (Mobile-First) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-teal-950 p-5 text-white shadow-md">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-teal-600/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-100">
                  Patient Health ID
                </span>
                <span className="text-[10px] font-semibold text-teal-200">MEDORA Network</span>
              </div>
              <span className="font-mono text-lg font-extrabold tracking-wider block mt-2">
                {user?.identifier || "PAT-1001"}
              </span>
              <span className="text-xs text-teal-100/90 font-medium block">
                {user?.fullName || "Patient"}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
              <QrCode className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-600/40 flex items-center justify-between text-[11px] text-teal-200 relative z-10">
            <span>Blood Group: <strong className="text-white">{user?.patientData?.bloodGroup || "O+"}</strong></span>
            <span>Status: <strong className="text-emerald-300">Verified Active</strong></span>
          </div>

          {/* Decorative background glow */}
          <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
        </div>

        {/* Mobile Quick Action Pills (Large Touch Targets) */}
        <section aria-label="Quick Actions">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            <Link 
              href="/patient/care" 
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/40 transition-all active:scale-95 text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">Find Doctor</span>
            </Link>

            <Link 
              href="/patient/care" 
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/40 transition-all active:scale-95 text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">Hospitals</span>
            </Link>

            <Link 
              href="/patient/health" 
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/40 transition-all active:scale-95 text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <FlaskConical className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">Reports</span>
            </Link>

            <Link 
              href="/patient/health" 
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/40 transition-all active:scale-95 text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Pill className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">Medicines</span>
            </Link>
          </div>
        </section>

        {/* Upcoming Appointments Section */}
        <section aria-label="Upcoming Care">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Upcoming Care
            </h2>
            <Link href="/patient/care" className="text-[11px] font-semibold text-teal-700 hover:underline">
              View All
            </Link>
          </div>

          <Card className="border-teal-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    DR
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Dr. Rajesh Sharma</h3>
                    <p className="text-xs text-slate-500">Cardiology • Apex Multispeciality</p>
                  </div>
                </div>
                <StatusBadge status="booked" size="sm" />
              </div>

              <div className="mt-3.5 rounded-xl bg-slate-50 border border-slate-100 p-2.5 flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                  <span className="font-semibold">Today, 10:00 AM</span>
                </div>
                <span className="font-mono text-slate-500 font-medium">Token #04</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent Healthcare Activity */}
        <section aria-label="Recent Activity">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Activity
            </h2>
            <Link href="/patient/health" className="text-[11px] font-semibold text-teal-700 hover:underline">
              Full Timeline
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">RX-1001 Ready for Pickup</span>
                  <span className="text-[11px] text-slate-500">Apex Hospital Pharmacy Desk</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">CBC Diagnostic Ordered</span>
                  <span className="text-[11px] text-slate-500">Sample Collection Pending</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </section>

        {/* Important Notice & Guidance */}
        <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-3 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            All medical events in MEDORA are cryptographically linked to your patient identity and audit trail.
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}
