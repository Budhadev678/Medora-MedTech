"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  Users,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  XCircle,
  ArrowRight,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { AppointmentCard } from "@/components/appointment/appointment-card";
import { AppointmentFilterBar } from "@/components/appointment/appointment-filter-bar";
import { RescheduleModal } from "@/components/appointment/reschedule-modal";
import { CancelModal } from "@/components/appointment/cancel-modal";
import { FrontendAppointmentService } from "@/lib/services/frontend-appointment-service";
import { QueueManagementService } from "@/lib/services/queue-management-service";
import { useAuth } from "@/lib/auth/auth-context";
import { Appointment, AppointmentStatus } from "@/types/database.types";
import { Button } from "@/components/ui/button";

export default function HospitalAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Modals state
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null);

  const orgIdentifier = user?.organizationId || "HSP-1001";

  const loadAppointments = async () => {
    setIsLoading(true);
    const records = await FrontendAppointmentService.getAppointments({
      organizationIdentifier: orgIdentifier.includes("HSP-") ? "HSP-1001" : undefined,
      status: statusFilter,
      searchQuery: searchQuery,
      date: dateFilter || undefined,
    });
    setAppointments(records);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, [user, statusFilter, dateFilter, searchQuery]);

  const handleCheckIn = async (appointment: Appointment) => {
    if (!user) return;
    try {
      const result = await QueueManagementService.checkInAppointment(
        {
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
        },
        user
      );
      if (result.success) {
        loadAppointments();
      } else {
        alert(result.message || "Failed to check in patient.");
      }
    } catch (err: any) {
      alert(err.message || "Check-in failed.");
    }
  };

  return (
    <RoleGuard allowedRoles={["hospital_admin", "staff", "receptionist", "admin"]}>
      <div className="space-y-6 max-w-6xl mx-auto px-4 py-6 sm:py-8 animate-in fade-in-50 duration-150">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="Hospital OPD Appointments & Queue Desk"
            description="Manage facility-wide patient check-ins, appointment schedules, and doctor queue allocations."
            breadcrumbs={[
              { label: "Hospital Operations", href: "/hospital" },
              { label: "Appointments Desk" },
            ]}
          />
          <Link href="/hospital/doctors">
            <Button variant="outline" className="rounded-2xl h-10 px-4 text-xs font-semibold">
              <Stethoscope className="h-4 w-4 mr-1.5 text-teal-600" />
              Doctor Roster & Schedules
            </Button>
          </Link>
        </div>

        {/* Filter Bar */}
        <AppointmentFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          placeholder="Filter by patient name, doctor, or APT ID..."
        />

        {/* Content List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Appointments Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no patient appointments matching the selected filters for this facility.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                role="hospital"
                onCheckIn={handleCheckIn}
                onReschedule={(a) => setRescheduleAppointment(a)}
                onCancel={(a) => setCancelAppointment(a)}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <RescheduleModal
          appointment={rescheduleAppointment}
          isOpen={Boolean(rescheduleAppointment)}
          onClose={() => setRescheduleAppointment(null)}
          onSuccess={() => loadAppointments()}
        />

        <CancelModal
          appointment={cancelAppointment}
          isOpen={Boolean(cancelAppointment)}
          onClose={() => setCancelAppointment(null)}
          onSuccess={() => loadAppointments()}
        />
      </div>
    </RoleGuard>
  );
}
