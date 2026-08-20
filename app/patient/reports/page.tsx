"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FlaskConical, 
  FileText, 
  Filter, 
  Building2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  QrCode,
  Activity,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { ReportCard, PatientReportProps } from "@/components/patient/report-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { 
  HealthcareLabOrder, 
  getPatientLabOrders 
} from "@/lib/data/lab-order-store";

export default function PatientReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "orders" | "reports">("all");
  const [labOrders, setLabOrders] = useState<HealthcareLabOrder[]>([]);

  const refreshLabOrders = () => {
    if (!user) return;
    const data = getPatientLabOrders(user.identifier || user.id, false);
    setLabOrders(data);
  };

  useEffect(() => {
    refreshLabOrders();
    const handleUpdate = () => refreshLabOrders();
    window.addEventListener("medora-lab-orders-updated", handleUpdate);
    return () => window.removeEventListener("medora-lab-orders-updated", handleUpdate);
  }, [user]);

  const isRahul = user?.identifier === "PAT-1001";

  // Static/Auxiliary Certified Lab Reports for PAT-1001
  const certifiedReports: PatientReportProps[] = isRahul ? [
    {
      id: "RPT-1024",
      testName: "Complete Blood Count (CBC) with Differential",
      category: "Laboratory",
      labName: "ABC Diagnostics (LAB-1001)",
      pathologistName: "Dr. B. Mohapatra, MD (Pathology)",
      date: "20 Aug 2026",
      status: "certified",
      parameters: [
        { name: "Hemoglobin", value: "14.2", unit: "g/dL", referenceRange: "13.0 - 17.0", flag: "NORMAL" },
        { name: "Total Leukocyte Count (WBC)", value: "7,800", unit: "/uL", referenceRange: "4,000 - 11,000", flag: "NORMAL" },
        { name: "Platelet Count", value: "245,000", unit: "/uL", referenceRange: "150,000 - 450,000", flag: "NORMAL" },
      ],
    },
  ] : [];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Diagnostic Lab Orders & Reports"
          description="Clinician-ordered diagnostic tests, investigation status, and certified digital laboratory reports."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Lab Orders & Reports" }]}
        />

        {/* Patient Freedom & Open Lab Choice Banner */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
            <FlaskConical className="h-4 w-4 text-blue-700" />
            <span>Open Diagnostic Lab Choice Guaranteed</span>
          </div>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            In MEDORA, diagnostic lab orders are never locked to a single hospital facility. You are free to fulfill your doctor's diagnostic order at your hospital lab or any accredited independent diagnostic center of your choice.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "all" ? "bg-white text-blue-800 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            All Diagnostic Activity ({labOrders.length + certifiedReports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "orders" ? "bg-white text-blue-800 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Doctor Lab Orders ({labOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "reports" ? "bg-white text-blue-800 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Certified Reports ({certifiedReports.length})
          </button>
        </div>

        {/* Diagnostic Items Stream */}
        <div className="space-y-4">
          
          {/* Section A: Ordered Diagnostic Tests */}
          {(activeTab === "all" || activeTab === "orders") && labOrders.length > 0 && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Doctor-Ordered Diagnostic Tests ({labOrders.length})
              </span>
              {labOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                        {order.order_reference}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-800 border-blue-200">
                        {order.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-700">
                        {order.priority}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {new Date(order.ordered_at || order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Ordering Doctor */}
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-slate-900 block text-sm">
                      {order.ordering_provider_name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {order.ordering_provider_role} • {order.organization_name}
                    </span>
                  </div>

                  {/* Tests List */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Ordered Diagnostic Investigations ({order.items.length})
                    </span>
                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{item.test_name}</span>
                          {item.specimen_type && (
                            <Badge variant="outline" className="text-[10px] font-semibold bg-white">
                              {item.specimen_type}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                    <strong>Clinical Indication:</strong> {order.reason}
                  </p>

                  {order.instructions && (
                    <p className="text-[11px] text-blue-800 bg-blue-50/70 p-2 rounded-lg font-medium">
                      <strong>Special Instructions:</strong> {order.instructions}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      Clinician Authorized Order
                    </span>
                    <span className="italic">Ready for booking at accredited lab</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section B: Certified Lab Reports */}
          {(activeTab === "all" || activeTab === "reports") && certifiedReports.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Certified Pathology Reports ({certifiedReports.length})
              </span>
              {certifiedReports.map((rpt) => (
                <ReportCard key={rpt.id} {...rpt} />
              ))}
            </div>
          )}

          {labOrders.length === 0 && certifiedReports.length === 0 && (
            <EmptyState
              icon={<FlaskConical className="h-6 w-6 text-blue-600" />}
              title="No Diagnostic Orders or Reports"
              description="Lab investigations ordered during consultations will appear here automatically."
              phase="Phase 4.3 — Prescription & Lab Order Foundation"
              actionHref="/patient"
              actionLabel="Return to Patient Home"
            />
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
