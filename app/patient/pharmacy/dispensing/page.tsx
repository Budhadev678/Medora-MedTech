"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Calendar,
  Pill,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getDispensingRecordsByPatient } from "@/lib/data/dispensing-store";
import { DispensingRecord } from "@/types/database.types";

export default function PatientDispensingHistoryPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<DispensingRecord[]>([]);

  useEffect(() => {
    const patientId = user?.identifier || user?.id || "PAT-1001";
    const list = getDispensingRecordsByPatient(patientId);
    setRecords(list);
  }, [user]);

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient/pharmacy">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Pharmacy Hub
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-purple-600" /> Digital Dispensing Receipts
              </h1>
              <p className="text-xs text-slate-500">Authoritative records of medicines handed over by connected pharmacies</p>
            </div>
          </div>
        </div>

        {/* Dispensing Receipts List */}
        <div className="space-y-4">
          {records.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
              No dispensing receipts found.
            </div>
          ) : (
            records.map((rec) => (
              <Card key={rec.id} className="bg-white rounded-2xl shadow-xs border-slate-200">
                <CardHeader className="p-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-2 font-mono">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> {rec.id}
                  </CardTitle>
                  <StatusBadge status={rec.status} />
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between text-slate-600 gap-2 border-b border-slate-100 pb-2">
                    <span>Pharmacy: <strong className="text-slate-900">{rec.facility_name}</strong></span>
                    <span>Date: <strong className="text-slate-800">{new Date(rec.dispensed_at).toLocaleString()}</strong></span>
                    <span>Pharmacist: <strong>{rec.pharmacist_name}</strong></span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dispensed Items</h4>
                    {rec.items.map((item, i) => (
                      <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{item.medicine_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Batch: {item.batch_number || "PCM-2026-01"} • Dispensed: {item.quantity_dispensed} of {item.quantity_prescribed}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-purple-950">₹{item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Total Dispensed Amount:</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">₹{rec.total_dispensed_amount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
