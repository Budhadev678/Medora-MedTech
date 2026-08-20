"use client";

import React from "react";
import Link from "next/link";
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  QrCode, 
  Lock, 
  Globe, 
  LogOut,
  ChevronRight,
  Info,
  Heart,
  FileCheck
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export default function PatientProfilePage() {
  const { user, logout } = useAuth();

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-200">
        {/* Profile Header */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="h-14 w-14 rounded-full bg-teal-100 border-2 border-teal-500 flex items-center justify-center text-teal-800 font-extrabold text-lg flex-shrink-0">
            {(user?.fullName || "Patient").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold text-slate-900 truncate">
              {user?.fullName || "Patient"}
            </h1>
            <span className="font-mono text-xs font-semibold text-teal-700 block">
              {user?.identifier || "PAT-1001"}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="teal" className="text-[10px] py-0 px-1.5 capitalize">
                Role: {user?.role || "Patient"}
              </Badge>
              <Badge variant="success" className="text-[10px] py-0 px-1.5 capitalize">
                Status: {user?.accountStatus || "Active"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Identity & Basic Info Section */}
        <Card className="bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
              </span>
              <span className="font-medium text-slate-900">{user?.email || "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone Number
              </span>
              <span className="font-medium text-slate-900">{user?.phone || "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Gender & DOB</span>
              <span className="font-medium text-slate-900 capitalize">
                {user?.patientData?.gender || "—"} • {user?.patientData?.dob || "—"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Blood Group</span>
              <span className="font-bold text-rose-700">{user?.patientData?.bloodGroup || "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Structural Sections Placeholder Menu */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <QrCode className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">ABHA & National Health ID</span>
                <span className="text-[11px] text-slate-500">View linked ABHA card & QR check-in</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Privacy & Timed Record Sharing</span>
                <span className="text-[11px] text-slate-500">Manage 24h access tokens and clinical logs</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Sign Out Button */}
        <Button 
          variant="outline" 
          onClick={logout}
          className="w-full text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 h-10 gap-1.5"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of Patient Account</span>
        </Button>

        {/* Phase notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>Full patient profile editing, ABHA linking, and vitals tracking will be implemented in Phase 3.</span>
        </div>
      </div>
    </RoleGuard>
  );
}
