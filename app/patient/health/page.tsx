"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  HeartPulse, 
  FileText, 
  FlaskConical, 
  Pill, 
  Clock, 
  FolderOpen,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Share2
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Timeline, type TimelineItemData } from "@/components/ui/timeline";

export default function PatientHealthPage() {
  const [activeTab, setActiveTab] = useState<"timeline" | "prescriptions" | "reports" | "records">("timeline");

  const sampleTimeline: TimelineItemData[] = [
    {
      id: "tl-1",
      type: "consultation",
      title: "Consultation Completed",
      summary: "Dr. Rajesh Sharma recorded clinical assessment for mild hypertension and created RX-1001.",
      timestamp: "2026-08-19T10:30:00Z",
      actor: "Dr. Rajesh Sharma",
      organization: "Apex Multispeciality Hospital",
    },
    {
      id: "tl-2",
      type: "prescription",
      title: "Digital Prescription RX-1001 Issued",
      summary: "Prescribed Amoxicillin 500mg & Paracetamol 650mg. Transmitted to Hospital Pharmacy.",
      timestamp: "2026-08-19T10:35:00Z",
      actor: "Dr. Rajesh Sharma",
      organization: "Apex Multispeciality Hospital",
    },
    {
      id: "tl-3",
      type: "lab_order",
      title: "Complete Blood Count (CBC) Ordered",
      summary: "Diagnostic order LAB-1001 generated for routine hematology examination.",
      timestamp: "2026-08-19T10:40:00Z",
      actor: "Dr. Rajesh Sharma",
      organization: "Central Pathology Lab",
    },
  ];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-200">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Health Hub</span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-teal-600" />
              Your Health Records
            </h1>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
            <Share2 className="h-3.5 w-3.5 text-teal-600" />
            <span>Share (24h)</span>
          </Button>
        </div>

        {/* Structural Navigation Tabs (Mobile-Friendly Pill Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "timeline"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Journey Timeline
          </button>
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "prescriptions"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Prescriptions (1)
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "reports"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Lab Reports (1)
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "records"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Records
          </button>
        </div>

        {/* Tab 1: Timeline */}
        {activeTab === "timeline" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Connected Medical Milestones
              </h2>
              <Badge variant="teal" className="text-[10px]">Traceable Events</Badge>
            </div>
            <Timeline items={sampleTimeline} />
          </div>
        )}

        {/* Tab 2: Prescriptions */}
        {activeTab === "prescriptions" && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Prescriptions
            </h2>
            <Card className="bg-white border-teal-200">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">RX-1001</span>
                  <StatusBadge status="ready_for_pickup" size="sm" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-1">
                  Dr. Rajesh Sharma (Cardiology)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Apex Multispeciality Hospital • Issued 19 Aug 2026
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 text-xs text-slate-700 space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold block text-slate-900">1. Amoxicillin 500mg</span>
                  <span className="text-[11px] text-slate-500">1 Capsule • 3x Daily • After Food • 5 Days</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold block text-slate-900">2. Paracetamol 650mg</span>
                  <span className="text-[11px] text-slate-500">1 Tablet • SOS (as needed for fever)</span>
                </div>
                <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                  Pickup Status: <strong className="text-teal-800">Packaged at Counter 3</strong>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Lab Reports */}
        {activeTab === "reports" && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Diagnostic & Pathology Reports
            </h2>
            <Card className="bg-white border-amber-200">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">LAB-1001</span>
                  <StatusBadge status="sample_collected" size="sm" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-1">
                  Complete Blood Count (CBC)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Central Pathology Lab • Sample SMP-1001 Collected
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 text-xs text-slate-600 space-y-2">
                <p className="text-[11px] leading-relaxed">
                  Sample received and undergoing automated hematology analyzer processing. Pathologist review pending.
                </p>
                <div className="p-2 rounded-lg bg-amber-50 text-[11px] text-amber-900 font-medium">
                  ⏳ Estimated approval time: 45 minutes
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: All Records Empty State */}
        {activeTab === "records" && (
          <EmptyState
            icon={<FolderOpen className="h-6 w-6 text-teal-600" />}
            title="Archived Hospital Records"
            description="Historical discharge summaries, imaging DICOM files, and previous clinic encounters will appear here."
          />
        )}
      </div>
    </RoleGuard>
  );
}
