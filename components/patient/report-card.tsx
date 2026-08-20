"use client";

import React from "react";
import Link from "next/link";
import { FlaskConical, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface LabResultParameter {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: "NORMAL" | "HIGH" | "LOW";
}

export interface PatientReportProps {
  id: string;
  testName: string;
  category: "Laboratory" | "Imaging" | "Pathology";
  labName: string;
  pathologistName: string;
  date: string;
  parameters?: LabResultParameter[];
  status: "certified" | "pending" | "processing";
}

export function ReportCard({
  id,
  testName,
  category,
  labName,
  pathologistName,
  date,
  parameters = [],
  status,
}: PatientReportProps) {
  return (
    <Card className="bg-white border-slate-200 hover:border-blue-300 transition-all shadow-2xs">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
            {id}
          </span>
          <Badge variant="success" className="text-[10px]">
            ● NABL Certified
          </Badge>
        </div>

        <CardTitle className="text-sm font-bold text-slate-900 mt-2 leading-snug">
          {testName}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          {labName} • Certified by {pathologistName}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-2.5 text-xs">
        {parameters.length > 0 && (
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-slate-700">
            {parameters.map((param, index) => (
              <div key={index} className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600">{param.name}:</span>
                <span className="font-bold text-slate-900">{param.value} {param.unit}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400 font-mono">Released: {date}</span>
          <Link href={`/verify/lab/LAB-1024`} target="_blank">
            <Button variant="outline" size="sm" className="h-7 text-xs font-semibold gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50">
              <FileText className="h-3 w-3" /> View Verified Slip
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
