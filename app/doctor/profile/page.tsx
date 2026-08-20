"use client";

import React from "react";
import { User, Stethoscope, Building2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DoctorProfilePage() {
  const { user, affiliations } = useAuth();

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6">
        <PageHeader
          title="Doctor Professional Profile & Credentials"
          description="Verified registration, council certifications, and active healthcare facility affiliations."
          breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Profile" }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Card */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-lg">
                  {user?.fullName?.charAt(0) || "D"}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    {user?.fullName || "Dr. Ananya Sharma"}
                  </CardTitle>
                  <span className="font-mono text-xs font-semibold text-teal-700 block">
                    {user?.identifier || "DOC-1001"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Specialization:</span>
                <span className="font-semibold text-slate-900">{user?.doctorData?.specialization || "Cardiology"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Medical Reg No:</span>
                <span className="font-mono font-semibold text-slate-900">{user?.doctorData?.medicalRegNo || "MCI-2014-99214"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Medical Council:</span>
                <span className="font-medium text-slate-900">{user?.doctorData?.medicalCouncil || "Medical Council of India"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Qualifications:</span>
                <span className="font-medium text-slate-900">{user?.doctorData?.qualifications || "MBBS, MD, DM"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Connected Affiliations Card */}
          <div className="md:col-span-2 space-y-4">
            <Card className="bg-white border-slate-200">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-teal-600" />
                  Verified Hospital & Clinic Appointments ({affiliations.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Multiple workplace affiliations practicing under unified Doctor ID {user?.identifier || "DOC-1001"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                <div className="divide-y divide-slate-100 text-xs">
                  {affiliations.map((aff, index) => (
                    <div key={index} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{aff.organizationName}</span>
                        <span className="text-slate-500 text-[11px]">{aff.departmentName || "Cardiology"} • {aff.opdRoom || "OPD Room"}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="teal" className="text-[10px] block mb-1">
                          {aff.roleTitle}
                        </Badge>
                        <span className="text-[11px] font-bold text-slate-900">₹{aff.consultationFee} fee</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
