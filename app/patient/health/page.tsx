"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  HeartPulse, 
  FileText, 
  FlaskConical, 
  Pill, 
  Clock, 
  FolderOpen,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Share2,
  Stethoscope,
  Building2,
  Calendar,
  Store,
  QrCode
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Timeline, type TimelineItemData } from "@/components/ui/timeline";
import { useAuth } from "@/lib/auth/auth-context";
import { getPatientEncounters, HealthcareEncounter } from "@/lib/data/encounter-store";
import { getPatientPrescriptions, HealthcarePrescription } from "@/lib/data/prescription-store";
import { getPatientLabOrders, HealthcareLabOrder } from "@/lib/data/lab-order-store";

export default function PatientHealthPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"timeline" | "prescriptions" | "reports" | "records">("timeline");
  const [encounters, setEncounters] = useState<HealthcareEncounter[]>([]);
  const [prescriptions, setPrescriptions] = useState<HealthcarePrescription[]>([]);
  const [labOrders, setLabOrders] = useState<HealthcareLabOrder[]>([]);

  const refreshData = () => {
    if (!user) return;
    const pId = user.identifier || user.id;
    setEncounters(getPatientEncounters(pId));
    setPrescriptions(getPatientPrescriptions(pId, false));
    setLabOrders(getPatientLabOrders(pId, false));
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener("medora-encounters-updated", handleUpdate);
    window.addEventListener("medora-prescriptions-updated", handleUpdate);
    window.addEventListener("medora-lab-orders-updated", handleUpdate);
    return () => {
      window.removeEventListener("medora-encounters-updated", handleUpdate);
      window.removeEventListener("medora-prescriptions-updated", handleUpdate);
      window.removeEventListener("medora-lab-orders-updated", handleUpdate);
    };
  }, [user]);

  const isRahul = user?.identifier === "PAT-1001";

  const dynamicTimeline: TimelineItemData[] = encounters.map((enc) => ({
    id: enc.id,
    type: "consultation",
    title: `${enc.encounter_type.replace(/_/g, " ")} (${enc.status})`,
    summary: `${enc.provider_name} conducted a ${enc.encounter_type.toLowerCase()} for: "${enc.reason_for_visit}" at ${enc.department_name}.`,
    timestamp: enc.started_at,
    actor: enc.provider_name,
    organization: enc.organization_name,
  }));

  const sampleTimeline: TimelineItemData[] = dynamicTimeline.length > 0 ? dynamicTimeline : [
    {
      id: "tl-1",
      type: "consultation",
      title: "Consultation Completed",
      summary: "Dr. Ananya Sharma recorded clinical assessment for mild hypertension and created RX-1001.",
      timestamp: "2026-08-20T10:30:00Z",
      actor: "Dr. Ananya Sharma",
      organization: "City Hospital",
    },
  ];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-200">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Health Hub</span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-teal-600" />
              Your Longitudinal Health
            </h1>
          </div>
          <Link href="/patient/records">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 text-teal-800 border-teal-200">
              <FileText className="h-3.5 w-3.5" />
              <span>Full Medical Records</span>
            </Button>
          </Link>
        </div>

        {/* Structural Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "timeline"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Care Timeline ({encounters.length})
          </button>
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "prescriptions"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Prescriptions ({prescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "reports"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Lab Orders ({labOrders.length + (isRahul ? 1 : 0)})
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
              activeTab === "records"
                ? "bg-teal-700 text-white font-bold shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Encounters ({encounters.length})
          </button>
        </div>

        {/* Tab 1: Timeline */}
        {activeTab === "timeline" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Authoritative Health Milestones
              </h2>
              <Badge variant="teal" className="text-[10px]">Verifiable Events</Badge>
            </div>
            <Timeline items={sampleTimeline} />
          </div>
        )}

        {/* Tab 2: Prescriptions */}
        {activeTab === "prescriptions" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Prescriptions
              </h2>
              <Link href="/patient/prescriptions" className="text-xs font-bold text-teal-700 hover:underline">
                View All & Fulfill $\rightarrow$
              </Link>
            </div>
            {prescriptions.length > 0 ? (
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        {rx.prescription_reference}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-800">
                        {rx.status}
                      </Badge>
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">{rx.prescriber_name}</span>
                      <span className="text-[11px] text-slate-500">{rx.organization_name}</span>
                    </div>
                    <div className="space-y-1 pt-1">
                      {rx.items.map((item, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{item.medicine_name} {item.strength && `(${item.strength})`}</span>
                          <span className="text-[11px] text-slate-500">{item.dosage}, {item.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Pill className="h-6 w-6 text-teal-600" />}
                title="No Active Prescriptions"
                description="Prescriptions authored during doctor visits will aggregate here."
              />
            )}
          </div>
        )}

        {/* Tab 3: Lab Orders */}
        {activeTab === "reports" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Diagnostic Lab Orders
              </h2>
              <Link href="/patient/reports" className="text-xs font-bold text-blue-700 hover:underline">
                View All & Book $\rightarrow$
              </Link>
            </div>
            {labOrders.length > 0 ? (
              <div className="space-y-3">
                {labOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                        {order.order_reference}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-800">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">{order.ordering_provider_name}</span>
                      <span className="text-[11px] text-slate-500">{order.organization_name}</span>
                    </div>
                    <div className="space-y-1 pt-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{item.test_name}</span>
                          {item.specimen_type && <span className="text-[10px] text-slate-500">{item.specimen_type}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FlaskConical className="h-6 w-6 text-blue-600" />}
                title="No Lab Orders"
                description="Diagnostic tests requested during consultations will appear here."
              />
            )}
          </div>
        )}

        {/* Tab 4: All Encounters */}
        {activeTab === "records" && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Healthcare Encounters ({encounters.length})
            </h2>
            {encounters.map((enc) => (
              <div key={enc.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{enc.encounter_type.replace(/_/g, " ")} — {enc.department_name}</span>
                  <StatusBadge status={enc.status.toLowerCase() as any} />
                </div>
                <p className="text-slate-600"><strong>Doctor:</strong> {enc.provider_name} ({enc.organization_name})</p>
                <p className="text-slate-500 text-[11px]">Reason: {enc.reason_for_visit}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
