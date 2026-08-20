"use client";

import React from "react";
import Link from "next/link";
import { FlaskConical, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DoctorLabOrdersPage() {
  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-4">
        <PageHeader
          title="Diagnostic Investigation Orders"
          description="Order diagnostic laboratory tests, track sample intake, and review certified digital pathology reports."
          breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Lab Orders" }]}
        />

        {/* Recently Ordered Sample Test */}
        <Card className="bg-white border-blue-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                LAB-ORD-1024
              </span>
              <Badge variant="success" className="text-[10px]">
                ● Report Released
              </Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">
              Complete Blood Count (CBC) — Patient: Rahul Verma
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Target Lab: ABC Diagnostics (LAB-1001) • Sample: SMP-1024
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Link href="/verify/lab/LAB-1024" target="_blank">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50">
                <FileText className="h-3.5 w-3.5" /> View Pathologist Certified Report (Slip)
              </Button>
            </Link>
          </CardContent>
        </Card>

        <EmptyState
          icon={<FlaskConical className="h-6 w-6 text-blue-600" />}
          title="Diagnostic Investigation Desk"
          description="Send diagnostic requests to internal or external laboratories, track sample collection status, and receive real-time critical value alerts."
          phase="Phase 8 — Connected Laboratory System"
          actionHref="/doctor"
          actionLabel="Return to Clinical Dashboard"
        />
      </div>
    </RoleGuard>
  );
}
