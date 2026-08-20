"use client";

import React, { useState } from "react";
import { Pill, FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { PrescriptionCard, PatientPrescriptionProps } from "@/components/patient/prescription-card";
import { useAuth } from "@/lib/auth/auth-context";

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  const isRahul = user?.identifier === "PAT-1001";

  const prescriptions: PatientPrescriptionProps[] = isRahul ? [
    {
      id: "RX-1001",
      doctorName: "Dr. Ananya Sharma",
      doctorSpecialization: "Consultant Cardiologist",
      facilityName: "City Hospital (Bhubaneswar)",
      date: "20 Aug 2026",
      diagnosis: "Essential Hypertension & Preventative Regimen",
      status: "active",
      items: [
        {
          name: "Telmisartan",
          strength: "40 mg",
          dosage: "1 tablet",
          frequency: "Once daily (Morning)",
          duration: "30 Days",
          instructions: "Take orally with water after breakfast",
        },
        {
          name: "Aspirin",
          strength: "75 mg",
          dosage: "1 tablet",
          frequency: "Once daily (Night)",
          duration: "30 Days",
          instructions: "Take orally after dinner",
        },
      ],
    },
  ] : [];

  const filteredPrescriptions = prescriptions.filter(rx => 
    activeTab === "active" ? rx.status === "active" : rx.status !== "active"
  );

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Digital Prescriptions"
          description="Electronic prescriptions with verified doctor signatures, dosage instructions, and open pharmacy fulfillment."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Prescriptions" }]}
        />

        {/* Tab Filters */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "active" ? "bg-white text-teal-800 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Active Regimen ({prescriptions.filter(p => p.status === "active").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "past" ? "bg-white text-teal-800 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Past Prescriptions (0)
          </button>
        </div>

        {filteredPrescriptions.length > 0 ? (
          <div className="space-y-3">
            {filteredPrescriptions.map((rx) => (
              <PrescriptionCard key={rx.id} {...rx} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Pill className="h-6 w-6 text-teal-600" />}
            title={activeTab === "active" ? "No Active Prescriptions" : "No Past Prescriptions"}
            description="Prescriptions authored by your doctors during consultations will automatically appear here with verifiable QR codes."
            phase="Phase 7 — Digital Consultation & Prescription"
            actionHref="/patient"
            actionLabel="Return to Patient Home"
          />
        )}
      </div>
    </RoleGuard>
  );
}
