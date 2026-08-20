"use client";

import React from "react";
import Link from "next/link";
import { Pill, FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DoctorPrescriptionsPage() {
  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Digital Prescription Authoring"
          description="Author verifiable electronic prescriptions with dosage, frequency, and tamper-evident digital signatures."
          breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Prescriptions" }]}
        />

        {/* Recently Authored Sample Prescription */}
        <Card className="bg-white border-teal-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                RX-1001
              </span>
              <Badge variant="teal" className="text-[10px]">
                ● Signed & Issued
              </Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              Patient: Rahul Verma (PAT-1001)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              City Hospital OPD • Telmisartan 40mg + Aspirin 75mg
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Link href="/verify/rx/RX-1001" target="_blank">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 text-teal-700 border-teal-200 hover:bg-teal-50">
                <FileText className="h-3.5 w-3.5" /> View Signed Digital Prescription Slip (QR)
              </Button>
            </Link>
          </CardContent>
        </Card>

        <EmptyState
          icon={<Pill className="h-6 w-6 text-teal-600" />}
          title="Prescription Authoring Suite"
          description="Interactive medication catalog, dosage scheduler, allergy conflict detection, and digital signature issuing will become active in Phase 7."
          phase="Phase 7 — Digital Consultation & Prescription"
          actionHref="/doctor"
          actionLabel="Return to Clinical Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
