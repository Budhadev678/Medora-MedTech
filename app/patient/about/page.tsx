"use client";

import React from "react";
import Link from "next/link";
import { Activity, ShieldCheck, HeartPulse, Receipt, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/shared/role-guard";

export default function PatientAboutPage() {
  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-6 max-w-2xl mx-auto pb-24 animate-in fade-in duration-150">
        <PageHeader
          title="About MEDORA"
          description="Transparent, connected healthcare ecosystem for patients, clinicians, and health networks."
          breadcrumbs={[
            { label: "Patient Portal", href: "/patient" },
            { label: "About" },
          ]}
        />

        <Card className="bg-white border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">MEDORA Healthcare Platform</h2>
              <p className="text-xs text-slate-500">Connected Outpatient, Clinical Records & Financial Transparency</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            MEDORA connects hospital outpatients, clinical consultations, diagnostics, pharmacies, and itemized billing into a single, unified experience. Patients own their health data and can verify itemized costs with complete transparency.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-teal-800">
                <HeartPulse className="h-4 w-4 text-teal-600" />
                <span>My Health Hub</span>
              </div>
              <p className="text-[11px] text-slate-500">Continuous medical records, prescriptions, and certified lab reports.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <span>Transparent Billing</span>
              </div>
              <p className="text-[11px] text-slate-500">Itemized invoices, insurance deductions, and instant dispute filing.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-800">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Zero-Trust Privacy</span>
              </div>
              <p className="text-[11px] text-slate-500">ABHA-linked patient consent and end-to-end access authorization.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Link href="/patient">
              <Button variant="outline" size="sm" className="rounded-xl text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Return to Patient Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}
