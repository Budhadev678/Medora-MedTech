"use client";

import React from "react";
import { HelpCircle, Phone, Mail, FileText, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PatientHelpPage() {
  const faqs = [
    { q: "How do I show my prescription at the pharmacy?", a: "Open 'Prescriptions' from the More menu or tap on your active prescription. Show the digital QR code slip to the pharmacist for instant fulfillment." },
    { q: "Is my medical data shared with hospitals automatically?", a: "No. You have complete control over record sharing. Only doctors conducting active consultations have temporary access, and every access is permanently logged in the audit ledger." },
    { q: "What is 'Why Was I Charged?' on my bill?", a: "Every charge on your MEDORA hospital bill is directly connected to the exact medical encounter, lab order, or prescription that was prescribed. Tap on any bill to see the full breakdown." },
  ];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Patient Help & FAQs"
          description="Find answers to common questions about using your MEDORA patient portal."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Help & Support" }]}
        />

        {/* Contact Support */}
        <Card className="bg-teal-50/60 border-teal-200">
          <CardContent className="p-4 space-y-2 text-xs">
            <h3 className="font-bold text-teal-950 flex items-center gap-2">
              <Phone className="h-4 w-4 text-teal-700" />
              National Healthcare Support Desk
            </h3>
            <p className="text-slate-600">
              Helpline: <strong>1800-MEDORA (1800-633-672)</strong> • Toll-Free 24/7 Support
            </p>
          </CardContent>
        </Card>

        {/* FAQs */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Frequently Asked Questions
          </h3>

          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white border-slate-200">
                <CardHeader className="p-4 pb-1">
                  <CardTitle className="text-xs font-bold text-slate-900 leading-snug">
                    {faq.q}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-slate-600 leading-relaxed">
                  {faq.a}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
