"use client";

import React from "react";
import { ShieldCheck, Lock, Share2, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientConsentPage() {
  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Consent & Medical Record Sharing"
          description="Control which doctors and hospitals can view your health records, and set time-bound access limits."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Consent & Privacy" }]}
        />

        {/* Active Consent Preview */}
        <Card className="bg-white border-teal-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                CNS-1001
              </span>
              <Badge variant="teal" className="text-[10px]">● Active Grant</Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              City Hospital — Cardiology OPD Desk
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Granted to Dr. Ananya Sharma (DOC-1001) for Outpatient Encounter
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between text-[11px]">
              <span>Permitted Scope: <strong>Consultations, Lab Reports, Prescriptions</strong></span>
              <span className="text-teal-700 font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3" /> Valid for 24h
              </span>
            </div>
          </CardContent>
        </Card>

        <EmptyState
          icon={<ShieldCheck className="h-6 w-6 text-teal-600" />}
          title="Patient-Controlled Consent Guard"
          description="Generate time-bound medical record sharing links with granular permission scopes (Prescriptions only, Labs only, or Full timeline)."
          phase="Phase 15 — Patient Record Sharing & Access Guard"
          actionHref="/patient"
          actionLabel="Return to Patient Home"
        />
      </div>
    </RoleGuard>
  );
}
