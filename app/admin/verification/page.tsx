"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileCheck, ShieldCheck, CheckCircle2, AlertTriangle, Building2, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";

interface VerificationRecord {
  id: string;
  name: string;
  type: "DOCTOR_LICENSE" | "HOSPITAL_PERMIT" | "LAB_NABL" | "PHARMACY_DRUG_LICENSE";
  registrationNumber: string;
  council: string;
  status: "VERIFIED" | "PENDING_REVIEW" | "REJECTED";
  submittedAt: string;
}

export default function AdminVerificationPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<VerificationRecord[]>([
    {
      id: "VERIF-1001",
      name: "Dr. Ananya Roy",
      type: "DOCTOR_LICENSE",
      registrationNumber: "MCI-2018-88229",
      council: "Medical Council of India / Odisha Medical Council",
      status: "VERIFIED",
      submittedAt: "2026-08-15T10:00:00Z",
    },
    {
      id: "VERIF-1002",
      name: "City Hospital — Rourkela Central",
      type: "HOSPITAL_PERMIT",
      registrationNumber: "CEA-OD-2024-0091",
      council: "Clinical Establishments Act Odisha",
      status: "VERIFIED",
      submittedAt: "2026-08-14T09:00:00Z",
    },
    {
      id: "VERIF-1003",
      name: "Central Pathology Lab — City Hospital",
      type: "LAB_NABL",
      registrationNumber: "NABL-MC-5590",
      council: "National Accreditation Board for Testing Laboratories",
      status: "VERIFIED",
      submittedAt: "2026-08-16T11:30:00Z",
    },
    {
      id: "VERIF-1004",
      name: "ABC Pharmacy — Rourkela Central",
      type: "PHARMACY_DRUG_LICENSE",
      registrationNumber: "DL-OD-20B-1882",
      council: "Odisha State Drugs Control Administration",
      status: "VERIFIED",
      submittedAt: "2026-08-18T14:20:00Z",
    },
  ]);

  const [message, setMessage] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "VERIFIED" } : r))
    );
    setMessage(`Verified credentials for ${id} successfully!`);
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-24 p-4 sm:p-6">
        <PageHeader
          title="Practitioner License & Facility Credential Verification"
          description="Verify doctor medical council registration numbers (NMC/MCI), hospital Clinical Establishment Act permits, lab NABL accreditations, and pharmacy drug licenses."
          breadcrumbs={[{ label: "Admin Console", href: "/admin" }, { label: "Verification Desk" }]}
        />

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {message}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Submitted Clinical Credentials & Permits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {records.map((r) => (
              <Card key={r.id} className="bg-white rounded-2xl shadow-xs border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-teal-950 text-xs">{r.id}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{r.type.replace(/_/g, " ")}</Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{r.name}</h3>
                    <p className="text-xs text-slate-600 font-mono pt-0.5">Reg No: <strong>{r.registrationNumber}</strong></p>
                    <p className="text-[11px] text-slate-400">{r.council}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <ShieldCheck className="h-3 w-3 mr-1" /> {r.status}
                    </Badge>

                    {r.status === "PENDING_REVIEW" && (
                      <Button size="sm" onClick={() => handleApprove(r.id)} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl">
                        Approve License
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
