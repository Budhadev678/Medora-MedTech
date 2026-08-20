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
  FileText
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

export default function ClinicEncountersPage() {
  const { user } = useAuth();
  const currentOrgId = user?.identifier || "CLN-1001";
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

  return (
    <RoleGuard allowedRoles={["hospital_admin", "doctor", "staff", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Outpatient Clinic Encounters"
          description="Daily outpatient consultation visits, walk-in tokens, and clinical interaction logs."
          breadcrumbs={[{ label: "Clinic Workspace", href: "/clinic" }, { label: "Encounters" }]}
        />

        {/* Encounters Table */}
        {filteredEncounters.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Consulting Doctor</th>
                    <th className="px-4 py-3">Reason</th>
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
                        <div className="text-[10px] text-slate-500">{enc.department_name}</div>
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
            title="No Clinic Encounters Recorded"
            description="Consultation encounters initiated by visiting specialists or clinic physicians will be listed here."
          />
        )}
      </div>
    </RoleGuard>
  );
}
