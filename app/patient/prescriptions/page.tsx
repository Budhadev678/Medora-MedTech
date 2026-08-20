"use client";

import React from "react";
import Link from "next/link";
import { Pill, FileText, ArrowRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PatientPrescriptionsPage() {
  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Digital Prescriptions"
          description="Verified electronic prescriptions issued by doctors with open pharmacy fulfillment."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Prescriptions" }]}
        />

        {/* Active Sample Prescription Card (Sample Slip Preview) */}
        <Card className="bg-white border-teal-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                RX-1001
              </span>
              <Badge variant="teal" className="text-[10px]">
                ● Active
              </Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              Cardiology Follow-Up & Blood Pressure Regimen
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Prescribed by Dr. Ananya Sharma (DOC-1001) • City Hospital (HSP-1001)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-xs text-slate-600 space-y-1 mb-3">
              <p>• <strong>Telmisartan 40mg</strong> — 1 tab daily (Morning after breakfast) for 30 days</p>
              <p>• <strong>Aspirin 75mg</strong> — 1 tab daily (Post dinner) for 30 days</p>
            </div>
            <Link href="/verify/rx/RX-1001" target="_blank">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 text-teal-700 border-teal-200 hover:bg-teal-50">
                <FileText className="h-3.5 w-3.5" /> View Verified Digital Prescription Slip (QR)
              </Button>
            </Link>
          </CardContent>
        </Card>

        <EmptyState
          icon={<Pill className="h-6 w-6 text-teal-600" />}
          title="Prescription Archival Workspace"
          description="Digital prescriptions generated during clinical consultations will appear here with instant QR verification and open pharmacy fulfillment."
          phase="Phase 7 — Digital Consultation & Prescription"
          actionHref="/patient"
          actionLabel="Return to Patient Home"
        />
      </div>
    </RoleGuard>
  );
}
