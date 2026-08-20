"use client";

import React from "react";
import Link from "next/link";
import { ClipboardList, Pill, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PharmacyPrescriptionsPage() {
  return (
    <RoleGuard allowedRoles={["pharmacy_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Incoming Digital Prescription Queue"
          description="E-prescriptions submitted for verification, stock availability check, and fulfillment."
          breadcrumbs={[{ label: "Pharmacy Desk", href: "/pharmacy" }, { label: "Prescriptions" }]}
        />

        {/* Sample Incoming Prescription */}
        <Card className="bg-white border-emerald-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                RX-1001
              </span>
              <Badge variant="teal" className="text-[10px]">
                ● Ready for Dispensing
              </Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              Patient: Rahul Verma (PAT-1001)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Prescribed by Dr. Ananya Sharma (DOC-1001) • Telmisartan 40mg + Aspirin 75mg
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Link href="/verify/rx/RX-1001" target="_blank">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                <FileText className="h-3.5 w-3.5" /> Verify Prescription Digital Signature (QR)
              </Button>
            </Link>
          </CardContent>
        </Card>

        <EmptyState
          icon={<ClipboardList className="h-6 w-6 text-emerald-600" />}
          title="Prescription Dispensing Intake Desk"
          description="Digital prescriptions chosen for pickup at this pharmacy counter will appear here with automatic inventory availability check."
          phase="Phase 9 — Connected Pharmacy & Pickup"
          actionHref="/pharmacy"
          actionLabel="Return to Pharmacy Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
