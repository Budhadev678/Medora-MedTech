"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ShieldCheck,
  Award,
  Clock,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  Building2,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PharmacyStaffMember {
  id: string;
  fullName: string;
  qualification: string;
  role: string;
  regNumber: string;
  isSignatory: boolean;
  status: "ON_DUTY" | "ON_BREAK" | "SCHEDULED" | "OFF_DUTY";
  currentStation: string;
  phone: string;
  email: string;
  joinedDate: string;
}

const SEED_PHARMACY_STAFF: PharmacyStaffMember[] = [
  {
    id: "PHA-STAFF-1001",
    fullName: "Manoj Rath",
    qualification: "B.Pharm, R.Ph",
    role: "Chief Dispensing Pharmacist",
    regNumber: "OPC-2016-5519",
    isSignatory: true,
    status: "ON_DUTY",
    currentStation: "Prescription Validation Desk",
    phone: "+91 674 2550105",
    email: "manoj.rath@abcpharmacy.medora",
    joinedDate: "2021-04-10",
  },
  {
    id: "PHA-STAFF-1002",
    fullName: "Priya Sharma",
    qualification: "M.Pharm (Clinical Pharmacy)",
    role: "Clinical Verification Specialist",
    regNumber: "OPC-2019-8821",
    isSignatory: true,
    status: "ON_DUTY",
    currentStation: "Verification & Clarification Desk",
    phone: "+91 674 2550106",
    email: "priya.sharma@abcpharmacy.medora",
    joinedDate: "2022-08-15",
  },
  {
    id: "PHA-STAFF-1003",
    fullName: "Vikas Nayak",
    qualification: "D.Pharm",
    role: "Dispensing & Inventory Technician",
    regNumber: "OPC-2022-3104",
    isSignatory: false,
    status: "ON_DUTY",
    currentStation: "Counter #1 Handover & OTP",
    phone: "+91 674 2550107",
    email: "vikas.nayak@abcpharmacy.medora",
    joinedDate: "2023-02-01",
  },
  {
    id: "PHA-STAFF-1004",
    fullName: "Subrat Mohanty",
    qualification: "B.Pharm, R.Ph",
    role: "Night Shift Emergency Pharmacist",
    regNumber: "OPC-2020-6420",
    isSignatory: true,
    status: "SCHEDULED",
    currentStation: "Emergency Trauma Night Desk",
    phone: "+91 674 2550108",
    email: "subrat.m@abcpharmacy.medora",
    joinedDate: "2022-11-20",
  },
];

export default function PharmacyStaffPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");

  const filteredStaff = SEED_PHARMACY_STAFF.filter((staff) => {
    if (filterRole === "SIGNATORY" && !staff.isSignatory) return false;
    if (filterRole === "ON_DUTY" && staff.status !== "ON_DUTY") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = staff.fullName.toLowerCase().includes(q);
      const matchId = staff.id.toLowerCase().includes(q);
      const matchReg = staff.regNumber.toLowerCase().includes(q);
      const matchRole = staff.role.toLowerCase().includes(q);
      return matchName || matchId || matchReg || matchRole;
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={["hospital_admin", "pharmacy_staff", "staff", "admin", "doctor"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-24 font-sans p-4 sm:p-6 animate-in fade-in-50 duration-200">
        <PageHeader
          title="Registered Pharmacists & Dispensing Personnel"
          description="Authorized state-licensed pharmacists, dispensing technicians, and certified digital signatories."
          breadcrumbs={[{ label: "Pharmacy Desk", href: "/pharmacy" }, { label: "Staff Directory" }]}
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Staff</p>
                <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{SEED_PHARMACY_STAFF.length}</h3>
                <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Licensed Personnel</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Currently On Duty</p>
                <h3 className="text-2xl font-black text-emerald-900 font-mono mt-0.5">
                  {SEED_PHARMACY_STAFF.filter((s) => s.status === "ON_DUTY").length}
                </h3>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Active Counter Stations</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Authorized Signatories</p>
                <h3 className="text-2xl font-black text-indigo-900 font-mono mt-0.5">
                  {SEED_PHARMACY_STAFF.filter((s) => s.isSignatory).length}
                </h3>
                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Digital Rx Signers</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">State Council Reg</p>
                <h3 className="text-base font-black text-slate-900 font-mono mt-1">100% Verified</h3>
                <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Odisha Pharmacy Council</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <Button
              variant={filterRole === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterRole("ALL")}
              className={`text-xs rounded-lg h-7 font-bold ${filterRole === "ALL" ? "bg-teal-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              All Personnel ({SEED_PHARMACY_STAFF.length})
            </Button>
            <Button
              variant={filterRole === "ON_DUTY" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterRole("ON_DUTY")}
              className={`text-xs rounded-lg h-7 font-bold ${filterRole === "ON_DUTY" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              On Duty ({SEED_PHARMACY_STAFF.filter((s) => s.status === "ON_DUTY").length})
            </Button>
            <Button
              variant={filterRole === "SIGNATORY" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterRole("SIGNATORY")}
              className={`text-xs rounded-lg h-7 font-bold ${filterRole === "SIGNATORY" ? "bg-indigo-700 text-white shadow-xs" : "text-slate-600"}`}
            >
              Signatories ({SEED_PHARMACY_STAFF.filter((s) => s.isSignatory).length})
            </Button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Staff Name, License Reg, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
            />
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStaff.map((staff) => (
            <Card key={staff.id} className="bg-white rounded-2xl border-slate-200 shadow-xs hover:border-teal-300 transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm shadow-xs">
                      {staff.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-extrabold text-slate-900">
                          {staff.fullName}
                        </CardTitle>
                        <Badge variant="outline" className="text-[9px] font-mono text-teal-800 bg-teal-50 border-teal-200 font-bold">
                          {staff.id}
                        </Badge>
                      </div>
                      <p className="text-xs text-teal-700 font-semibold">{staff.qualification}</p>
                    </div>
                  </div>

                  {staff.status === "ON_DUTY" ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                      ● Active On Duty
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-200 font-medium">
                      Scheduled
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Designation:</span>
                    <strong className="text-slate-900">{staff.role}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Council Registration:</span>
                    <strong className="font-mono text-slate-800">{staff.regNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Current Station:</span>
                    <span className="font-semibold text-teal-800">{staff.currentStation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Digital Signing:</span>
                    {staff.isSignatory ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Authorized Signatory
                      </span>
                    ) : (
                      <span className="text-slate-400">Standard Dispenser</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 font-mono">
                    <Phone className="h-3 w-3 text-slate-400" /> {staff.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-400" /> {staff.email}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}

