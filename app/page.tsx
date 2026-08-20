"use client";

import React from "react";
import Link from "next/link";
import { 
  Activity, 
  Users, 
  Stethoscope, 
  Building2, 
  FlaskConical, 
  Pill, 
  AlertTriangle, 
  Receipt, 
  Droplet, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  HeartPulse, 
  Clock, 
  Sparkles,
  FileCheck2,
  Lock,
  Share2,
  ChevronRight
} from "lucide-react";
import { 
  DEMO_PERSONAS, 
  ROLE_LABELS, 
  ROLE_DASHBOARD_ROUTES 
} from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PlatformGateway() {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "patient": return <Users className="h-5 w-5 text-teal-600" />;
      case "doctor": return <Stethoscope className="h-5 w-5 text-blue-600" />;
      case "hospital_admin": return <Building2 className="h-5 w-5 text-indigo-600" />;
      case "lab_staff": return <FlaskConical className="h-5 w-5 text-amber-600" />;
      case "pharmacy_staff": return <Pill className="h-5 w-5 text-emerald-600" />;
      case "emergency_staff": return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "blood_staff": return <Droplet className="h-5 w-5 text-rose-600" />;
      case "finance_staff": return <Receipt className="h-5 w-5 text-purple-600" />;
      case "admin": return <ShieldCheck className="h-5 w-5 text-slate-700" />;
      default: return <Activity className="h-5 w-5 text-teal-600" />;
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero / System Mission Header */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-b from-teal-50/70 via-white to-slate-50 p-6 sm:p-10 shadow-xs">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-teal-800 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            MEDORA — Unified Healthcare Connectivity Architecture
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Connecting every step of the patient’s healthcare journey.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Eliminating fragmentation and lack of transparency. Seamlessly bridging patients, doctors, hospitals, diagnostic labs, hospital pharmacies, emergency triage, and financial assistance into one auditable, connected ecosystem.
          </p>

          {/* Quick Stats / Core Differentiators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <span className="text-xs text-slate-500 block">Traceability</span>
              <span className="text-base font-bold text-teal-700">100% Itemized</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <span className="text-xs text-slate-500 block">Audit Trail</span>
              <span className="text-base font-bold text-slate-900">Append-Only</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <span className="text-xs text-slate-500 block">Connected Units</span>
              <span className="text-base font-bold text-slate-900">8 Key Roles</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <span className="text-xs text-slate-500 block">Emergency Escalation</span>
              <span className="text-base font-bold text-red-600">Multi-Tier Triage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Launchpad / Persona Quick-Access Grid */}
      <section id="modules" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Role Portals & Operational Desks
            </h2>
            <p className="text-xs text-slate-500">
              Select any persona to launch their dedicated interface and simulate connected healthcare events.
            </p>
          </div>
          <Badge variant="outline" className="self-start text-xs text-teal-700 border-teal-300">
            SIH Demonstration Mode
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_PERSONAS.map((persona) => {
            const route = ROLE_DASHBOARD_ROUTES[persona.role];
            return (
              <Card 
                key={persona.id} 
                className="group relative transition-all hover:border-teal-400 hover:shadow-md bg-white"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 transition-transform group-hover:scale-105">
                      {getRoleIcon(persona.role)}
                    </div>
                    <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {persona.identifier}
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold text-slate-900 mt-2">
                    {persona.name}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-teal-700">
                    {ROLE_LABELS[persona.role]} • {persona.organization}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0">
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-2">
                    {persona.description}
                  </p>

                  <Link href={route} className="block">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-between group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 transition-colors text-xs font-semibold"
                    >
                      <span>Open {ROLE_LABELS[persona.role].split(" ")[0]} Portal</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Connected Healthcare Journey Diagram */}
      <section id="traceability" className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">
              The Connected Healthcare Journey State Machine
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            How events link continuously from consultation to prescription, diagnostics, physical pharmacy dispensing, transparent billing, and follow-ups.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800 text-xs font-bold">1</span>
            <h4 className="text-xs font-bold text-slate-900">Appointment & Consultation</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Patient books slot $\rightarrow$ Doctor reviews authorized history $\rightarrow$ Records clinical diagnosis and creates structured digital prescription.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">2</span>
            <h4 className="text-xs font-bold text-slate-900">Laboratory Testing & Report</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Order `LAB-1001` dispatched $\rightarrow$ Sample `SMP-1001` collected $\rightarrow$ Pathologist approves report $\rightarrow$ Real-time notification to patient & doctor.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">3</span>
            <h4 className="text-xs font-bold text-slate-900">Hospital Pharmacy Dispensing</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Rx queue updated $\rightarrow$ Medication packaged $\rightarrow$ Patient Medora ID verified at desk $\rightarrow$ Physical dispense recorded on timeline.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-800 text-xs font-bold">4</span>
            <h4 className="text-xs font-bold text-slate-900">Transparent Billing & "Why Charged?"</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Itemized charges generated $\rightarrow$ Patient clicks any item to see order lineage $\rightarrow$ Insurance/Govt scheme split $\rightarrow$ Audit trail updated.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency Readiness & Multi-Tier Escalation */}
      <section id="emergency" className="rounded-2xl border border-red-200 bg-red-50/30 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Emergency Coordination & Staff Escalation
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Fast Emergency Intake with Staff Availability Fallback
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            When emergency trauma cases arrive, MEDORA triages priority levels, checks assigned doctor availability, automatically suggests available on-call specialists, and triggers urgent blood matching without blocking patient care.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link href="/emergency">
            <Button variant="emergency" className="w-full sm:w-auto gap-2">
              <AlertTriangle className="h-4 w-4" /> Open Emergency Triage Board
            </Button>
          </Link>
          <Link href="/blood-bank">
            <Button variant="outline" className="w-full sm:w-auto border-red-300 text-red-800 hover:bg-red-100">
              <Droplet className="h-4 w-4 mr-1 text-rose-600" /> Blood Coordinator Desk
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
