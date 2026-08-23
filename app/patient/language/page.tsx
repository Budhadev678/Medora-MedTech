"use client";

import React from "react";
import { Globe, Check, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLocalization, LanguageCode } from "@/lib/localization";

export default function PatientLanguagePage() {
  const { language, changeLanguage, languages } = useLocalization();

  const languageNotes: Record<LanguageCode, string> = {
    en: "Default System Language across all interfaces",
    hi: "National Language (Hindi Localization)",
    or: "Regional Language (Odisha Health Network)",
  };

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
            const isSelected = language === lang.code;
            return (
              <Card
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`cursor-pointer transition-all ${
                  isSelected ? "border-teal-500 bg-teal-50/40 shadow-xs" : "hover:border-slate-300"
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{lang.name}</span>
                      <span className="text-xs text-teal-700 font-semibold">({lang.nativeName})</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {languageNotes[lang.code]}
                    </span>
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
