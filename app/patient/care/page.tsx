"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  Calendar, 
  Building2, 
  Search, 
  Clock, 
  MapPin, 
  Star, 
  ArrowRight,
  Info,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

export default function PatientCarePage() {
  const [careTab, setCareTab] = useState<"doctors" | "hospitals" | "appointments">("doctors");

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Care & Discovery</span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-teal-600" />
              Find Care & Appointments
            </h1>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search doctors, hospitals, or specialties..."
            className="pl-9 bg-white text-xs"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setCareTab("doctors")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              careTab === "doctors" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Doctors
          </button>
          <button
            onClick={() => setCareTab("hospitals")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              careTab === "hospitals" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hospitals
          </button>
          <button
            onClick={() => setCareTab("appointments")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              careTab === "appointments" ? "bg-white text-teal-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Visits (1)
          </button>
        </div>

        {/* Doctors Directory Skeleton */}
        {careTab === "doctors" && (
          <div className="space-y-3">
            <Card className="bg-white hover:border-teal-300 transition-all shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-800 flex-shrink-0">
                      DR
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Dr. Rajesh Sharma</h3>
                      <p className="text-xs text-teal-700 font-medium">MD (Cardiology) • 14 yrs exp</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Apex Multispeciality Hospital
                      </p>
                    </div>
                  </div>
                  <Badge variant="teal" className="text-[10px]">Available</Badge>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Fee: ₹500</span>
                  <Button size="sm" className="h-8 text-xs font-semibold">
                    Book Token
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white hover:border-teal-300 transition-all shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-800 flex-shrink-0">
                      DR
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Dr. Ananya Iyer</h3>
                      <p className="text-xs text-blue-700 font-medium">MS, Emergency & Trauma Lead • 10 yrs exp</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Apex Trauma Center
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-slate-600">On-Call</Badge>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Fee: ₹600</span>
                  <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hospitals Directory Skeleton */}
        {careTab === "hospitals" && (
          <div className="space-y-3">
            <Card className="bg-white shadow-xs">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Apex Multispeciality Hospital</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-400" /> Khandagiri, Bhubaneswar
                    </p>
                  </div>
                  <Badge variant="teal" className="text-[10px]">250 Beds</Badge>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Cardiology</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Pathology Lab</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">24/7 ER</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Pharmacy</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Emergency: +91 674 2550100</span>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    Select Facility
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Appointments Skeleton */}
        {careTab === "appointments" && (
          <div className="space-y-3">
            <Card className="bg-white border-teal-200">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700">Token #04</span>
                  <StatusBadge status="booked" size="sm" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-1">
                  Dr. Rajesh Sharma (Cardiology)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Apex Multispeciality • OPD Room 102
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 text-xs space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between text-slate-800">
                  <span>Scheduled Time: <strong>Today, 10:00 AM</strong></span>
                  <span className="text-teal-700 font-semibold">Confirmed</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                    Reschedule
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-red-600 hover:bg-red-50">
                    Cancel Visit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Phase notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>Full appointment booking and live queue token tracking will be enabled in Phase 6.</span>
        </div>
      </div>
    </RoleGuard>
  );
}
