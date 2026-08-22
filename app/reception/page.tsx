"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  Receipt, 
  UserPlus, 
  Search, 
  Building2, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ClipboardCheck
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { getAllIdentities, StoredIdentity } from "@/lib/data/identity-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { QueueStore, getTodayDateStr } from "@/lib/data/queue-store";
import { QueueEntry } from "@/types/database.types";

export default function ReceptionWorkspacePage() {
  const { user, activeMembership } = useAuth();
  const orgName = activeMembership?.organization_name || user?.organizationName || "City Hospital";
  const orgIdent = activeMembership?.organization_identifier || user?.identifier || "HSP-1001";
  const todayStr = getTodayDateStr();

  const [patients, setPatients] = useState<StoredIdentity[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = () => {
    const allPatients = getAllIdentities().filter(i => i.role === "patient");
    setPatients(allPatients);

    const queue = QueueStore.getQueueForFacility(orgIdent, todayStr);
    setQueueEntries(queue);

    const apts = AppointmentStore.getAllAppointments().filter(
      (a) => a.organization_identifier === orgIdent && a.appointment_date === todayStr
    );
    setAppointmentsCount(apts.length);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("medora-queue-updated", handleUpdate);
    return () => window.removeEventListener("medora-queue-updated", handleUpdate);
  }, [activeMembership]);

  const waitingCount = queueEntries.filter((q) => q.status === "WAITING").length;
  const inConsultCount = queueEntries.filter((q) => q.status === "IN_CONSULTATION").length;
  const completedCount = queueEntries.filter((q) => q.status === "COMPLETED").length;

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.identifier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery)
  );

  return (
    <RoleGuard allowedRoles={["staff", "receptionist" as any, "hospital_admin", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150 pb-12">
        <PageHeader
          title="Front Desk & Reception Desk"
          description={`Patient intake, OPD queue management, and demographic verification for ${orgName}.`}
          badgeText={orgIdent}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/reception/checkin">
                <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-xs font-semibold gap-1.5 h-9 rounded-2xl shadow-xs">
                  <ClipboardCheck className="h-4 w-4" /> Patient Check-in Desk
                </Button>
              </Link>
            </div>
          }
        />

        {/* 1. Reception Operations Banner */}
        <Card className="bg-teal-50/50 border-teal-200 shadow-2xs rounded-3xl">
          <CardHeader className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-teal-700" />
                  <span className="text-sm font-bold text-slate-900">{orgName}</span>
                  <Badge variant="teal" className="text-[10px] font-mono">{orgIdent}</Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Active Operator: <strong>{user?.fullName}</strong> ({activeMembership?.role_title || "Receptionist"})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white text-xs text-slate-700 border-teal-200">
                  Today's Queue: <strong>{queueEntries.length} Total Checked-in</strong>
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 2. Operational Metrics & Queue Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Waiting in Queue</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{waitingCount}</span>
            <span className="text-[11px] text-teal-700 font-medium">Active Waiting Hall</span>
          </Card>
          <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">In Consultation</span>
            <span className="text-2xl font-black text-teal-900 mt-1 block">{inConsultCount}</span>
            <span className="text-[11px] text-slate-500">Doctors Actively Seeing</span>
          </Card>
          <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Completed Today</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{completedCount}</span>
            <span className="text-[11px] text-slate-500">Consultations Finished</span>
          </Card>
          <Card className="p-4 bg-white border-slate-200 rounded-2xl shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Booked Today</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{appointmentsCount}</span>
            <span className="text-[11px] text-slate-500">Appointments in Roster</span>
          </Card>
        </div>

        {/* 3. Fast Actions Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Link href="/reception/checkin">
            <Card className="p-5 bg-white border-slate-200 hover:border-teal-400 rounded-3xl transition-all shadow-xs group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Check-In Desk & Token Dispenser</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Verify arriving patients, issue tokens & register walk-ins</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/reception/appointments">
            <Card className="p-5 bg-white border-slate-200 hover:border-teal-400 rounded-3xl transition-all shadow-xs group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Facility Appointment Queue</h3>
                    <p className="text-xs text-slate-500 mt-0.5">View all upcoming booked appointments and front-desk booking</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Card>
          </Link>
        </div>

        {/* 4. Patient Search & Quick Registry Lookup */}
        <Card className="border-slate-200 bg-white rounded-3xl shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Patient Search & Fast Directory
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Verify patient identity, ABHA health ID, or issue OPD consultation token.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-teal-600"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPatients.length === 0 ? (
              <EmptyState
                icon={<Users className="h-6 w-6 text-slate-400" />}
                title="No patients found"
                description="No patient matching your search query was found in the hospital registry."
                className="py-8"
              />
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {filteredPatients.slice(0, 5).map((pt) => (
                  <div key={pt.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-800 font-mono font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {pt.identifier?.replace("PAT-", "P") || "PT"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{pt.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-500">({pt.identifier})</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {pt.phone || "+91 98765 00000"} • ABHA: {pt.patientData?.abhaStatus === "LINKED" ? "Linked" : "Not Linked"}
                        </span>
                      </div>
                    </div>

                    <Link href={`/reception/checkin?patientId=${pt.identifier || pt.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-semibold rounded-xl text-teal-700 border-teal-200">
                        Fast Check-in
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
