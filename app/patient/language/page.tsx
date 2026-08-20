"use client";

import React, { useState } from "react";
import { Globe, Check, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientLanguagePage() {
  const [selectedLang, setSelectedLang] = useState<"en" | "hi" | "or">("en");

  const languages = [
    { code: "en", name: "English", script: "English", note: "Default System Language" },
    { code: "hi", name: "Hindi", script: "हिन्दी", note: "National Language (Phase 19 Localization)" },
    { code: "or", name: "Odia", script: "ଓଡ଼ିଆ", note: "Regional Language (Phase 19 Localization)" },
  ];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Language Settings"
          description="Choose your preferred language for patient-facing notices, medical summaries, and advice."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Language" }]}
        />

        <div className="space-y-2">
          {languages.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <Card
                key={lang.code}
                onClick={() => setSelectedLang(lang.code as any)}
                className={`cursor-pointer transition-all ${
                  isSelected ? "border-teal-500 bg-teal-50/40 shadow-xs" : "hover:border-slate-300"
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{lang.name}</span>
                      <span className="text-xs text-teal-700 font-semibold">({lang.script})</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{lang.note}</span>
                  </div>

                  {isSelected && (
                    <div className="h-6 w-6 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </RoleGuard>
  );
}
