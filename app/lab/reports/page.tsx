"use client";

import React from "react";
import Link from "next/link";
import { FileText, ArrowRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LabReportsPage() {
  return (
    <RoleGuard allowedRoles={["lab_staff", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Certified Pathology Reports Archive"
          description="Released NABL diagnostic reports with verifiable QR verification codes."
          breadcrumbs={[{ label: "Diagnostic Lab", href: "/lab" }, { label: "Reports" }]}
        />

        {/* Recently Released Sample Report */}
        <Card className="bg-white border-blue-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                RPT-1024
              </span>
              <Badge variant="success" className="text-[10px]">
                ● Released to Patient & Doctor
              </Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              Complete Blood Count (CBC) — Patient: Rahul Verma (PAT-1001)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Verified by Dr. B. Mohapatra, MD (Pathology) • ABC Diagnostics (LAB-1001)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Link href="/verify/lab/LAB-1024" target="_blank">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50">
                <FileText className="h-3.5 w-3.5" /> View Public Verification Slip (RPT-1024)
              </Button>
            </Link>
          </CardContent>
        </Card>

        <EmptyState
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          title="Diagnostic Report Archive"
          description="Released pathology reports are permanently accessible via patient medical records and public QR verification slips."
          phase="Phase 8 — Connected Laboratory System"
          actionHref="/lab"
          actionLabel="Return to Lab Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
