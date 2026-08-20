"use client";

import React, { useState } from "react";
import { Receipt, HelpCircle, ShieldCheck, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGuard } from "@/components/shared/role-guard";
import { BillCard, PatientBillProps } from "@/components/patient/bill-card";
import { useAuth } from "@/lib/auth/auth-context";

export default function PatientBillsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");

  const isRahul = user?.identifier === "PAT-1001";

  const bills: PatientBillProps[] = isRahul ? [
    {
      id: "BIL-1001",
      facilityName: "City Hospital (Bhubaneswar)",
      encounterId: "ENC-1001",
      date: "20 Aug 2026",
      totalGross: 1770.0,
      insuranceCovered: 1200.0,
      governmentSubsidy: 300.0,
      patientPaid: 270.0,
      status: "settled",
      items: [
        { name: "Specialist OPD Consultation (Dr. Ananya Sharma)", eventType: "consultation", eventId: "ENC-1001", amount: 500.0 },
        { name: "Complete Blood Count Lab Panel", eventType: "lab_order", eventId: "LAB-ORD-1024", amount: 850.0 },
        { name: "Pharmacy Medications Dispensed (Telmisartan + Aspirin)", eventType: "prescription", eventId: "RX-1001", amount: 420.0 },
      ],
    },
  ] : [];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Hospital Invoices & Payments"
          description="Transparent, itemized billing with explicit medical event lineage and 'Why Was I Charged?' auditability."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Bills & Payments" }]}
        />

        {/* Tab Filters */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "current" ? "bg-white text-purple-900 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Settled Invoices ({bills.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === "past" ? "bg-white text-purple-900 font-bold shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Pending Payment (0)
          </button>
        </div>

        {bills.length > 0 ? (
          <div className="space-y-3">
            {bills.map((bill) => (
              <BillCard key={bill.id} {...bill} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Receipt className="h-6 w-6 text-purple-600" />}
            title="No Invoices Available"
            description="Itemized hospital bills with multi-source split settlement (Insurance + Govt Subsidy + Patient Contribution) will appear here after clinical encounters."
            phase="Phase 10 — Itemized Billing & Why Charged"
            actionHref="/patient"
            actionLabel="Return to Patient Home"
          />
        )}
      </div>
    </RoleGuard>
  );
}
