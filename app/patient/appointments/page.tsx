"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Stethoscope, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");

  // User-scoped appointment records (e.g. PAT-1001 has active appointment)
  const isRahul = user?.identifier === "PAT-1001";

  const upcomingAppointments = isRahul ? [
    {
      id: "APT-1001",
      doctorName: "Dr. Ananya Sharma",
      specialization: "Consultant Cardiologist",
      hospitalName: "City Hospital (Bhubaneswar)",
      departmentName: "Cardiology OPD",
      date: "Today, 20 Aug 2026",
      time: "10:30 AM",
      tokenNumber: "02",
      opdRoom: "Room 102",
      status: "confirmed" as const,
      type: "In-Person OPD" as const,
    }
  ] : [];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="My Doctor Appointments"
          description="View your scheduled outpatient consultations, OPD queue tokens, and hospital visits."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Appointments" }]}
        />

        {/* Tab Filters */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "upcoming" ? "bg-white text-teal-800 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "past" ? "bg-white text-teal-800 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Past Consultations (0)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "cancelled" ? "bg-white text-teal-800 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Cancelled (0)
          </button>
        </div>

        {/* Appointment List / Empty State */}
        {activeTab === "upcoming" && upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <AppointmentCard key={apt.id} {...apt} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Calendar className="h-6 w-6 text-teal-600" />}
            title={activeTab === "upcoming" ? "No Upcoming Appointments" : `No ${activeTab} appointments`}
            description={
              activeTab === "upcoming"
                ? "You do not have any upcoming doctor appointments scheduled."
                : `No ${activeTab} appointment records found in your health history.`
            }
            phase="Phase 6 — Appointments & Token/Queue Engine"
            secondaryText="Specialist OPD slot booking, live token calls, and reschedule requests will become active in Phase 6."
            actionHref="/patient"
            actionLabel="Return to Patient Home"
          />
        )}
      </div>
    </RoleGuard>
  );
}
