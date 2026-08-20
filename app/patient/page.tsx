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
  Plus
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Timeline, type TimelineItemData } from "@/components/ui/timeline";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PatientDashboard() {
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
      summary: "Prescribed Amoxicillin 500mg (5 days) & Paracetamol 650mg SOS. Sent to Hospital Pharmacy.",
      timestamp: "2026-08-19T10:35:00Z",
      actor: "Dr. Rajesh Sharma",
      organization: "Apex Multispeciality Hospital",
    },
    {
      id: "tl-3",
      type: "lab_order",
      title: "Diagnostic Test Order LAB-1001 Dispatched",
      summary: "Complete Blood Count (CBC) ordered. Sample collection scheduled at Central Pathology.",
      timestamp: "2026-08-19T10:40:00Z",
      actor: "Dr. Rajesh Sharma",
      organization: "Central Pathology Lab",
    },
    {
      id: "tl-4",
      type: "pharmacy_dispense",
      title: "Medication Packaging Complete",
      summary: "Apex Hospital Pharmacy verified Rx and marked medicines ready for physical pickup.",
      timestamp: "2026-08-19T11:15:00Z",
      actor: "Pharmacy Desk",
      organization: "Apex Pharmacy",
    },
  ];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-6">
      {/* Patient Greeting & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-teal-200 bg-teal-50/50 p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Welcome back, Rahul Verma
            </h1>
            <Badge variant="teal" className="text-xs">
              MED-PAT-1001
            </Badge>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Simulated ABHA ID: <span className="font-mono text-teal-800 font-semibold">91-4521-8890-1234</span> • Aadhaar: <span className="font-mono text-slate-700">XXXX XXXX 8912</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="emergency" size="sm" className="gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" /> Emergency SOS
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs bg-white">
            <Share2 className="h-3.5 w-3.5 text-teal-600" /> Share Records (24h)
          </Button>
        </div>
      </div>

      {/* Action Banners / Pending Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Next Appointment */}
        <Card className="border-teal-200 bg-white">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-teal-600" /> Upcoming Visit
              </span>
              <StatusBadge status="booked" size="sm" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              Dr. Rajesh Sharma
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Cardiology • Apex Multispeciality Hospital
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="rounded-md bg-slate-50 p-2 text-xs text-slate-700 my-2">
              <span className="font-semibold block">Today • 10:00 AM</span>
              <span className="text-[11px] text-slate-500">Token Number: #04 (Room 102)</span>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs">
              View Appointment Details
            </Button>
          </CardContent>
        </Card>

        {/* Pharmacy Ready for Pickup */}
        <Card className="border-emerald-200 bg-white">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-emerald-600" /> Pharmacy Pickup
              </span>
              <StatusBadge status="ready_for_pickup" size="sm" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              RX-1001 (2 Medicines)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Packaged at Hospital Pharmacy Desk
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-900 my-2">
              <span className="font-semibold block">Medora ID required: MED-PAT-1001</span>
              <span className="text-[11px] text-emerald-700">Present ID at Counter 3</span>
            </div>
            <Button variant="default" size="sm" className="w-full text-xs bg-emerald-700 hover:bg-emerald-800">
              Show Pickup QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Transparent Bill Overview */}
        <Card className="border-purple-200 bg-white">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-purple-600" /> Outstanding Bill
              </span>
              <StatusBadge status="generated" size="sm" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              Invoice BILL-1001: ₹1,550
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Consultation + CBC Test + Medicines
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="rounded-md bg-purple-50 p-2 text-xs text-purple-900 my-2">
              <span className="font-semibold block">Patient Responsibility: ₹1,550</span>
              <span className="text-[11px] text-purple-700">Itemized Breakdown & Traceability Available</span>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs border-purple-300 text-purple-900 hover:bg-purple-100">
              Inspect "Why Was I Charged?"
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Connected Healthcare Journey Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-teal-600" />
              Connected Healthcare Journey Timeline
            </h2>
            <Badge variant="outline" className="text-xs text-slate-600">
              Traceable Events
            </Badge>
          </div>

          <Timeline items={sampleTimeline} />
        </div>

        {/* Quick Health Summary & Vitals Card */}
        <div className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-700" />
              Emergency Health Snapshot
            </h2>
          </div>

          <Card className="bg-white">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Blood Group</span>
                <span className="font-bold text-rose-700">O Positive (O+)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Known Allergies</span>
                <span className="font-semibold text-slate-900">Penicillin, Peanuts</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Chronic Conditions</span>
                <span className="font-semibold text-slate-900">Mild Hypertension</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Emergency Contact</span>
                <span className="font-semibold text-slate-900">Anita Verma (+91 98765 43210)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </RoleGuard>
  );
}
