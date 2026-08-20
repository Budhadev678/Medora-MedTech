"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  Stethoscope, 
  Building2, 
  Calendar, 
  Clock, 
  HeartPulse, 
  ArrowRight,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllIdentities, StoredIdentity } from "@/lib/data/identity-store";
import { getPatientEncounters, HealthcareEncounter } from "@/lib/data/encounter-store";
import { AccessEngine } from "@/lib/services/access-engine";

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<StoredIdentity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const all = getAllIdentities().filter((u) => u.role === "patient");
    setPatients(all);
  }, []);

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      (p.identifier && p.identifier.toLowerCase().includes(q))
    );
  });

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Clinical Patients Registry"
            description="Active patients with healthcare relationships, recorded encounters, or active consent grants across your affiliated hospitals."
            breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Patients" }]}
          />
          <Link href="/doctor/consultations">
            <Button className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2">
              <Stethoscope className="h-4 w-4" />
              <span>Encounter Workbench</span>
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, PAT ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filteredPatients.length} patient(s) registered
          </span>
        </div>

        {/* Patient Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatients.map((patient) => {
            const encounters = getPatientEncounters(patient.identifier || patient.id);
            const latestEncounter = encounters[0];
            const hasActiveEncounter = encounters.some((e) => e.status === "ACTIVE");

            // Evaluate Access Engine
            const accessCheck = user ? AccessEngine.evaluateAccess({
              actor: user,
              targetPatientId: patient.identifier || patient.id,
              organizationId: "HSP-1001",
              purpose: "treatment",
              requiredScope: "medical_history",
            }) : null;

            return (
              <Card key={patient.id} className="border-slate-200 hover:border-slate-300 transition-all shadow-2xs">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-slate-900">
                          {patient.fullName}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-mono text-teal-800 bg-teal-50 border-teal-200">
                          {patient.identifier}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        DOB: {patient.patientData?.dob || "N/A"} • Gender: {patient.patientData?.gender || "N/A"}
                      </CardDescription>
                    </div>

                    {patient.patientData?.bloodGroup && (
                      <span className="rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-bold text-red-700">
                        {patient.patientData.bloodGroup}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Healthcare Visits Summary */}
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Encounter History ({encounters.length} visits)
                    </span>
                    {latestEncounter ? (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-800 font-medium truncate max-w-[200px]">
                          {latestEncounter.reason_for_visit}
                        </span>
                        <Badge variant={latestEncounter.status === "ACTIVE" ? "default" : "outline"} className="text-[10px] py-0">
                          {latestEncounter.status}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">No clinical encounters recorded yet.</span>
                    )}
                  </div>

                  {/* Access & ABHA Status */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {accessCheck?.allowed ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          Consent Active
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          Consent Pending
                        </span>
                      )}
                    </div>

                    <Link href="/doctor/consultations">
                      <Button size="sm" variant="ghost" className="text-xs text-teal-700 hover:text-teal-800 font-bold p-0 h-auto gap-1">
                        <span>Open Workbench</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </RoleGuard>
  );
}
