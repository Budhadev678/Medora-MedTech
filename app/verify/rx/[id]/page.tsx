"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, 
  Pill, 
  Stethoscope, 
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

export default function PublicVerifyPrescriptionPage() {
  const params = useParams();
  const rawId = params?.id;
  const rxId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "RX-1001";

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Verification Status Banner */}
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                MEDORA Digital Verification Seal
              </span>
              <h1 className="text-sm font-extrabold text-emerald-950">
                Official Digitally Signed Medical Prescription
              </h1>
            </div>
          </div>
          <Badge variant="success" className="text-xs px-2.5 py-1">
            Valid & Authentic
          </Badge>
        </div>

        {/* Prescription Document Card */}
        <div className="rounded-2xl border border-slate-300 bg-white p-6 sm:p-8 shadow-sm space-y-6 print:shadow-none print:border-none">
          {/* Header & Doctor Details */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase">
                City Hospital • Department of Cardiology
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Dr. Ananya Sharma, MD, DM (Cardiology)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Reg No: <strong className="text-slate-900 font-mono">MCI-2014-99214</strong> • OPD Room 102
              </p>
              <p className="text-xs text-slate-500">
                City Hospital (HSP-1001) & Green Care Hospital (HSP-1002) • Contact: +91 674 2550100
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="font-mono text-sm font-black text-slate-900 block">
                {rxId.toUpperCase()}
              </span>
              <span className="text-xs text-slate-500 block">
                Date: <strong>20 Aug 2026, 10:35 AM</strong>
              </span>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> Tamper-Proof Audit
              </div>
            </div>
          </div>

          {/* Patient Details Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Patient Name</span>
              <span className="font-bold text-slate-900">Rahul Verma</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Patient Medora ID</span>
              <span className="font-mono font-semibold text-teal-700">PAT-1001</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Age / Gender</span>
              <span className="font-semibold text-slate-900">29 yrs / Male</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Blood Group</span>
              <span className="font-bold text-rose-700">O Positive (O+)</span>
            </div>
          </div>

          {/* Clinical Assessment / Diagnosis */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Clinical Assessment
            </span>
            <p className="text-xs font-semibold text-slate-800">
              Mild Essential Hypertension with routine checkup evaluation. Advised low sodium diet.
            </p>
          </div>

          {/* Prescribed Medications Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-teal-600" />
                Prescribed Medicines (Rx)
              </span>
              <span className="text-[11px] text-slate-400">Take as per prescribed regimen</span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Medicine Name & Strength</th>
                    <th className="p-3">Dosage & Frequency</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3 text-right">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr className="bg-white">
                    <td className="p-3 font-mono font-bold">1</td>
                    <td className="p-3 font-bold text-slate-900">Amoxicillin 500mg</td>
                    <td className="p-3">1 Capsule (1-0-1)</td>
                    <td className="p-3">5 Days</td>
                    <td className="p-3 text-right text-slate-600">After Food</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 font-mono font-bold">2</td>
                    <td className="p-3 font-bold text-slate-900">Paracetamol 650mg</td>
                    <td className="p-3">1 Tablet (SOS)</td>
                    <td className="p-3">As needed</td>
                    <td className="p-3 text-right text-slate-600">For mild headache/fever</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Doctor Signature & Security Verification Box */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                <QrCode className="h-10 w-10 text-slate-800" />
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-semibold text-slate-800 block">Universal Verification QR</span>
                <span>Any chemist or hospital can scan to verify dosage validity and doctor registration.</span>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="font-serif italic font-bold text-slate-800 text-sm">Dr. Ananya Sharma</div>
              <span className="text-[10px] font-mono text-teal-700 block font-semibold">Digitally Signed on MEDORA</span>
              <span className="text-[10px] text-slate-400">Timestamp: 2026-08-20 10:35:00 UTC</span>
            </div>
          </div>
        </div>

        {/* Public Action Controls (Print, Download, Portal Link) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button 
            onClick={() => window.print()}
            variant="outline" 
            size="sm" 
            className="gap-2 text-xs font-semibold bg-white"
          >
            <Printer className="h-4 w-4" /> Print / Save PDF Slip
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
