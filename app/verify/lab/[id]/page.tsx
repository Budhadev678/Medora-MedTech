"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, 
  FlaskConical, 
  Calendar, 
  Building2, 
  Printer, 
  CheckCircle2, 
  Download,
  AlertCircle,
  FileCheck2,
  Phone,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PublicVerifyLabReportPage() {
  const params = useParams();
  const rawId = params?.id;
  const labId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "LAB-1001";

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Verification Banner */}
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                MEDORA Diagnostic Verification Seal
              </span>
              <h1 className="text-sm font-extrabold text-emerald-950">
                Official Certified Pathology Laboratory Report
              </h1>
            </div>
          </div>
          <Badge variant="success" className="text-xs px-2.5 py-1">
            Certified Approved
          </Badge>
        </div>

        {/* Diagnostic Report Slip */}
        <div className="rounded-2xl border border-slate-300 bg-white p-6 sm:p-8 shadow-sm space-y-6 print:shadow-none print:border-none">
          {/* Header & Lab Details */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase">
                Central Diagnostic Pathology Lab (NABL Accredited)
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Complete Blood Count (CBC) Automated Analysis
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Lab Reg: <strong className="text-slate-900 font-mono">LAB-NABL-88120</strong> • Sample ID: <strong className="text-teal-700 font-mono">SMP-1001</strong>
              </p>
              <p className="text-xs text-slate-500">
                Ordering Physician: Dr. Ananya Sharma, MD, DM • City Hospital
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="font-mono text-sm font-black text-slate-900 block">
                {labId.toUpperCase()}
              </span>
              <span className="text-xs text-slate-500 block">
                Approved: <strong>20 Aug 2026, 11:15 AM</strong>
              </span>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Patient Name</span>
              <span className="font-bold text-slate-900">Rahul Verma</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Medora ID</span>
              <span className="font-mono font-semibold text-teal-700">PAT-1001</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Age / Gender</span>
              <span className="font-semibold text-slate-900">29 yrs / Male</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Specimen</span>
              <span className="font-semibold text-slate-900">EDTA Whole Blood</span>
            </div>
          </div>

          {/* Test Results Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FlaskConical className="h-4 w-4 text-amber-600" />
              Automated Hematology Analyzer Values
            </span>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Test Parameter</th>
                    <th className="p-3">Observed Result</th>
                    <th className="p-3">Reference Range</th>
                    <th className="p-3 text-right">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr className="bg-white">
                    <td className="p-3 font-semibold">Hemoglobin (Hb)</td>
                    <td className="p-3 font-bold text-slate-900">14.5 g/dL</td>
                    <td className="p-3 text-slate-500">13.0 - 17.0 g/dL</td>
                    <td className="p-3 text-right text-emerald-700 font-semibold">Normal</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 font-semibold">Total Leucocyte Count (WBC)</td>
                    <td className="p-3 font-bold text-slate-900">7,200 /µL</td>
                    <td className="p-3 text-slate-500">4,000 - 11,000 /µL</td>
                    <td className="p-3 text-right text-emerald-700 font-semibold">Normal</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 font-semibold">Platelet Count</td>
                    <td className="p-3 font-bold text-slate-900">2.45 Lakhs /µL</td>
                    <td className="p-3 text-slate-500">1.50 - 4.50 Lakhs /µL</td>
                    <td className="p-3 text-right text-emerald-700 font-semibold">Normal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pathologist Stamp & Verification QR */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                <QrCode className="h-10 w-10 text-slate-800" />
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-semibold text-slate-800 block">Universal Lab Report QR</span>
                <span>Any doctor, hospital, or insurance auditor can scan to verify authenticity.</span>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="font-serif italic font-bold text-slate-800 text-sm">Dr. S. K. Patnaik, MD (Path)</div>
              <span className="text-[10px] font-mono text-teal-700 block font-semibold">Certified Pathologist Sign-Off</span>
              <span className="text-[10px] text-slate-400">MEDORA Audit Hash: 0x8a92f...7e1</span>
            </div>
          </div>
        </div>

        {/* Public Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button 
            onClick={() => window.print()}
            variant="outline" 
            size="sm" 
            className="gap-2 text-xs font-semibold bg-white"
          >
            <Printer className="h-4 w-4" /> Print / Save Diagnostic PDF
          </Button>

          <Link href="/login">
            <Button size="sm" className="gap-2 text-xs font-bold">
              <span>Sign In to MEDORA Health Portal</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
