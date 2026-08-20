"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  AlertTriangle,
  X,
  FileText,
  Activity
} from "lucide-react";
import { RoleGuard } from "@/components/shared/role-guard";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { getOrganizationEncounters, HealthcareEncounter } from "@/lib/data/encounter-store";

export default function HospitalEncountersPage() {
  const { user } = useAuth();
  const currentOrgId = user?.identifier || "HSP-1001";
  const [encounters, setEncounters] = useState<HealthcareEncounter[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEncounter, setSelectedEncounter] = useState<HealthcareEncounter | null>(null);

  const refreshData = () => {
    const data = getOrganizationEncounters(currentOrgId);
    setEncounters(data);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("medora-encounters-updated", refreshData);
    return () => window.removeEventListener("medora-encounters-updated", refreshData);
  }, [currentOrgId]);

  const filteredEncounters = encounters.filter((e) => {
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.patient_name.toLowerCase().includes(q) ||
        e.patient_id.toLowerCase().includes(q) ||
        e.provider_name.toLowerCase().includes(q) ||
        e.department_name?.toLowerCase().includes(q) ||
        e.reason_for_visit.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = encounters.filter(e => e.status === "ACTIVE").length;
  const completedCount = encounters.filter(e => e.status === "COMPLETED").length;

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Hospital Operational Encounters"
          description="Real-time clinical encounters, OPD consultation sessions, and department visit logs."
          breadcrumbs={[{ label: "Hospital Command", href: "/hospital" }, { label: "Encounters" }]}
        />

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 block">Total Hospital Visits</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{encounters.length}</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 block">Active OPD Sessions</span>
            <span className="text-2xl font-extrabold text-teal-700 mt-1 block">{activeCount}</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 block">Completed Today</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{completedCount}</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
            {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? "bg-slate-900 text-white font-bold"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search patient, doctor, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>

        {/* Table / List View */}
        {filteredEncounters.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Encounter ID</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Doctor</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Reason for Visit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEncounters.map((enc) => (
                    <tr key={enc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-teal-800">
                        {enc.encounter_reference || enc.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{enc.patient_name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{enc.patient_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{enc.provider_name}</div>
                        <div className="text-[10px] text-slate-500">{enc.provider_role}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {enc.department_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {enc.reason_for_visit}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={enc.status.toLowerCase() as any} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <div>{new Date(enc.started_at).toLocaleDateString("en-IN")}</div>
                        <div className="text-[10px]">{new Date(enc.started_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEncounter(enc)}
                          className="text-[11px] h-7 px-2.5"
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-teal-600" />}
            title="No Hospital Encounters Found"
            description="Operational patient encounters will appear here as doctors conduct consultations across hospital OPD departments."
          />
        )}

        {/* Modal Detail Sheet */}
        {selectedEncounter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                    {selectedEncounter.encounter_reference || selectedEncounter.id}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    {selectedEncounter.patient_name} • {selectedEncounter.department_name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEncounter(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Attending Doctor</span>
                  <span className="font-bold text-slate-800">{selectedEncounter.provider_name}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
                  <StatusBadge status={selectedEncounter.status.toLowerCase() as any} />
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Location</span>
                  <span className="font-bold text-slate-800">{selectedEncounter.location || "OPD Room"}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Encounter Type</span>
                  <span className="font-bold text-slate-800">{selectedEncounter.encounter_type}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Chief Reason for Visit</span>
                <p className="text-slate-800 font-medium">{selectedEncounter.reason_for_visit}</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => setSelectedEncounter(null)}
                  className="bg-slate-900 text-white font-bold text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
