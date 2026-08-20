"use client";

import React from "react";
import Link from "next/link";
import { FlaskConical, FileText, ArrowRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PatientReportsPage() {
  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Diagnostic Laboratory Reports"
          description="NABL-certified pathology reports, specimen analysis, and diagnostic test results."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Lab Reports" }]}
        />

        {/* Sample Report Slip Card */}
        <Card className="bg-white border-blue-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                RPT-1024
              </span>
              <Badge variant="success" className="text-[10px]">
                ● NABL Certified
              </Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              Complete Blood Count (CBC) with Differential
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              ABC Diagnostics (LAB-1001) • Verified by Dr. B. Mohapatra, MD (Path)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-xs text-slate-600 space-y-1 mb-3">
              <p>• <strong>Hemoglobin:</strong> 14.2 g/dL (Normal: 13.0 - 17.0)</p>
              <p>• <strong>Total WBC Count:</strong> 7,800 /uL (Normal: 4,000 - 11,000)</p>
              <p>• <strong>Platelet Count:</strong> 245,000 /uL (Normal: 150,000 - 450,000)</p>
            </div>
            <Link href="/verify/lab/LAB-1024" target="_blank">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50">
                <FileText className="h-3.5 w-3.5" /> View Certified Digital Pathology Report (Slip)
              </Button>
            </Link>
          </CardContent>
        </Card>

        <EmptyState
          icon={<FlaskConical className="h-6 w-6 text-blue-600" />}
          title="Diagnostic Report Repository"
          description="Certified pathology results and imaging reports will be delivered directly here upon laboratory verification."
          phase="Phase 8 — Connected Laboratory System"
          actionHref="/patient"
          actionLabel="Return to Patient Home"
        />
      </div>
    </RoleGuard>
  );
}
