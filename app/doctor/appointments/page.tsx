"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  Building2, 
  CheckCircle2, 
  Filter, 
  MapPin,
  Stethoscope,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { Appointment } from "@/types/database.types";

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<string>("all");

  const doctorId = user?.identifier || "DOC-1001";

  const loadAppointments = () => {
    const records = AppointmentStore.getAppointmentsForDoctor(doctorId);
    setAppointments(records);
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const filteredAppointments = appointments.filter((apt) => {
    const matchFacility = selectedFacility === "all" || apt.organization_identifier === selectedFacility;
    const matchSearch =
      apt.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.appointment_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.reason_for_visit && apt.reason_for_visit.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchFacility && matchSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="teal" className="text-[10px]">● Confirmed</Badge>;
      case "COMPLETED":
        return <Badge variant="success" className="text-[10px]">● Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive" className="text-[10px]">● Cancelled</Badge>;
      case "CHECKED_IN":
        return <Badge variant="warning" className="text-[10px]">● Checked In</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">● {status}</Badge>;
    }
  };

  return (
    <RoleGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150 max-w-5xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Outpatient Clinic Appointments"
            description="Operational roster of booked patients across affiliated hospital and clinic sessions."
            breadcrumbs={[{ label: "Doctor Workspace", href: "/doctor" }, { label: "Appointments" }]}
          />
          <Link href="/doctor/schedule">
            <Button variant="outline" className="rounded-2xl h-10 px-4 text-xs font-semibold">
              <Calendar className="h-4 w-4 mr-1.5 text-teal-600" />
              Manage Working Sessions & Capacity
            </Button>
          </Link>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name or APT ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-teal-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-600">Facility:</span>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="text-xs font-semibold p-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-teal-600"
            >
              <option value="all">All Facilities ({appointments.length})</option>
              <option value="HSP-1001">City Hospital</option>
              <option value="CLN-1001">Green Care Clinic</option>
              <option value="HSP-1002">Green Care Hospital</option>
            </select>
          </div>
        </div>

        {/* Appointments List */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-3xl">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">
                Scheduled Patients ({filteredAppointments.length})
              </CardTitle>
              <span className="text-xs text-slate-500 font-medium font-mono">
                Doctor: {doctorId}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-2.5">
            {filteredAppointments.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <Users className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No appointments found matching filter criteria.</p>
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-teal-400 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800 font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                      {apt.token_number ? `#${apt.token_number}` : "OPD"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{apt.patient_name}</span>
                        <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-semibold">
                          {apt.appointment_no}
                        </span>
                        {getStatusBadge(apt.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {apt.appointment_date}
                        </span>
                        <span>•</span>
                        <span className="font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {apt.slot_display_time}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {apt.organization_name} ({apt.opd_room || "Room 102"})
                        </span>
                      </div>

                      {apt.reason_for_visit && (
                        <p className="text-[11px] text-slate-600 italic">
                          "{apt.reason_for_visit}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/doctor/consultations?patientId=${apt.patient_id}&aptId=${apt.id}`}>
                      <Button size="sm" className="h-8 text-xs font-bold bg-teal-700 hover:bg-teal-800 rounded-xl">
                        <span>Open Clinical Note</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
