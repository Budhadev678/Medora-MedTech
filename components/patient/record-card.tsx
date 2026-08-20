"use client";

import React from "react";
import Link from "next/link";
import { FileText, Calendar, Building2, Stethoscope, FlaskConical, Pill, ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type RecordCategory = "consultation" | "prescription" | "report" | "admission" | "emergency";

export interface PatientRecordProps {
  id: string;
  category: RecordCategory;
  title: string;
  doctorName?: string;
  facilityName: string;
  date: string;
  summary?: string;
  actionHref?: string;
  actionLabel?: string;
  status?: string;
}

export function RecordCard({
  id,
  category,
  title,
  doctorName,
  facilityName,
  date,
  summary,
  actionHref,
  actionLabel = "View Details",
  status = "Verified",
}: PatientRecordProps) {
  const getCategoryMeta = () => {
    switch (category) {
      case "consultation":
        return { icon: Stethoscope, label: "Consultation", color: "bg-teal-50 text-teal-700 border-teal-100" };
      case "prescription":
        return { icon: Pill, label: "Prescription", color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
      case "report":
        return { icon: FlaskConical, label: "Lab Report", color: "bg-blue-50 text-blue-700 border-blue-100" };
      case "emergency":
        return { icon: FileText, label: "Emergency Case", color: "bg-red-50 text-red-700 border-red-100" };
      default:
        return { icon: FileText, label: "Medical Record", color: "bg-slate-50 text-slate-700 border-slate-100" };
    }
  };

  const meta = getCategoryMeta();
  const Icon = meta.icon;

  return (
    <Card className="bg-white border-slate-200 hover:border-teal-300 transition-all shadow-2xs">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
              <Icon className="h-3 w-3" />
              <span>{meta.label}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">{id}</span>
          </div>
          <Badge variant="outline" className="text-[9px] py-0 text-slate-500 border-slate-200">
            {status}
          </Badge>
        </div>

        <CardTitle className="text-sm font-bold text-slate-900 mt-2 leading-snug">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
          {doctorName && <span>{doctorName}</span>}
          {doctorName && <span>•</span>}
          <span>{facilityName}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-1 space-y-2 text-xs text-slate-600">
        {summary && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
            {summary}
          </p>
        )}

        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{date}</span>
          </div>

          {actionHref && (
            <Link 
              href={actionHref} 
              className="flex items-center gap-1 text-teal-700 font-bold hover:underline group"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
