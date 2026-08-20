"use client";

import React, { useState } from "react";
import { Receipt, ChevronDown, ShieldCheck, CreditCard, HelpCircle, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface BillLineItem {
  name: string;
  eventType: "consultation" | "lab_order" | "prescription" | "room";
  eventId: string;
  amount: number;
}

export interface PatientBillProps {
  id: string;
  facilityName: string;
  encounterId: string;
  date: string;
  totalGross: number;
  insuranceCovered: number;
  governmentSubsidy: number;
  patientPaid: number;
  status: "settled" | "pending" | "disputed";
  items: BillLineItem[];
}

export function BillCard({
  id,
  facilityName,
  encounterId,
  date,
  totalGross,
  insuranceCovered,
  governmentSubsidy,
  patientPaid,
  status,
  items,
}: PatientBillProps) {
  const [showLineage, setShowLineage] = useState(false);

  return (
    <Card className="bg-white border-slate-200 hover:border-purple-300 transition-all shadow-2xs">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
            {id}
          </span>
          <Badge variant="teal" className="text-[10px]">
            ● {status === "settled" ? "Settled via UPI" : "Pending Payment"}
          </Badge>
        </div>

        <CardTitle className="text-sm font-bold text-slate-900 mt-2 leading-snug">
          {facilityName} — Outpatient Encounter
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Encounter: {encounterId} • Date: {date}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3 text-xs">
        {/* Settlement Split Summary */}
        <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-700">
            <span>Total Gross Charges:</span>
            <span className="font-semibold">₹{totalGross.toFixed(2)}</span>
          </div>
          {insuranceCovered > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Insurance Coverage (Cashless):</span>
              <span className="font-semibold">-₹{insuranceCovered.toFixed(2)}</span>
            </div>
          )}
          {governmentSubsidy > 0 && (
            <div className="flex justify-between text-blue-700">
              <span>Government Assistance (BSKY):</span>
              <span className="font-semibold">-₹{governmentSubsidy.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-purple-200 text-xs">
            <span>Patient Net Payable:</span>
            <span className="text-purple-900">₹{patientPaid.toFixed(2)}</span>
          </div>
        </div>

        {/* "Why Was I Charged?" Interactive Lineage Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowLineage(!showLineage)}
            className="w-full flex items-center justify-between py-1 text-xs font-bold text-purple-800 hover:text-purple-950 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
              Why Was I Charged? (Lineage Breakdown)
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showLineage ? "rotate-180" : ""}`} />
          </button>

          {showLineage && (
            <div className="mt-2 space-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 divide-y divide-slate-100 animate-in fade-in-50 duration-150">
              {items.map((item, index) => (
                <div key={index} className="pt-1.5 first:pt-0 flex justify-between items-center text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-800 block">{item.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">Linked to {item.eventId}</span>
                  </div>
                  <span className="font-bold text-slate-900">₹{item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
