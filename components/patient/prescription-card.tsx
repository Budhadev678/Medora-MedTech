"use client";

import React from "react";
import Link from "next/link";
import { Pill, FileText, QrCode, ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PrescriptionItem {
  name: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface PatientPrescriptionProps {
  id: string;
  doctorName: string;
  doctorSpecialization: string;
  facilityName: string;
  date: string;
  diagnosis: string;
  items: PrescriptionItem[];
  status: "active" | "dispensed" | "expired";
}

export function PrescriptionCard({
  id,
  doctorName,
  doctorSpecialization,
  facilityName,
  date,
  diagnosis,
  items,
  status,
}: PatientPrescriptionProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <Badge variant="teal" className="text-[10px]">● Active</Badge>;
      case "dispensed":
        return <Badge variant="success" className="text-[10px]">● Dispensed</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">● Expired</Badge>;
    }
  };

  return (
    <Card className="bg-white border-slate-200 hover:border-teal-300 transition-all shadow-2xs">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
            {id}
          </span>
          {getStatusBadge()}
        </div>

        <CardTitle className="text-sm font-bold text-slate-900 mt-2 leading-snug">
          {diagnosis}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Prescribed by {doctorName} ({doctorSpecialization}) • {facilityName}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3 text-xs">
        {/* Medication List */}
        <div className="space-y-2 divide-y divide-slate-100">
          {items.map((item, index) => (
            <div key={index} className="pt-2 first:pt-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{item.name} {item.strength}</span>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50/60 px-1.5 py-0.2 rounded">
                  {item.duration}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {item.dosage} • {item.frequency} ({item.instructions})
              </p>
            </div>
          ))}
        </div>

        {/* Action Button: QR Verification Slip */}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">Issued: {date}</span>
          <Link href={`/verify/rx/${id}`} target="_blank">
            <Button variant="outline" size="sm" className="h-7 text-xs font-semibold gap-1.5 text-teal-700 border-teal-200 hover:bg-teal-50">
              <FileText className="h-3 w-3" /> View Verified Slip (QR)
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
