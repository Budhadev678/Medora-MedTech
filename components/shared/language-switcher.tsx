"use client";

import React, { useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLocalization, LanguageCode } from "@/lib/localization";

interface LanguageSwitcherProps {
  variant?: "pill" | "dropdown" | "compact";
  className?: string;
}

export function LanguageSwitcher({ variant = "pill", className = "" }: LanguageSwitcherProps) {
  const { language, changeLanguage, languages } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "compact") {
    return (
      <div className={`flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-semibold ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => changeLanguage(lang.code)}
            className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
              language === lang.code
                ? "bg-white text-teal-800 font-extrabold shadow-xs border border-slate-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
            title={lang.name}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors shadow-xs"
        aria-label="Select Language"
      >
        <Globe className="h-3.5 w-3.5 text-teal-600" />
        <span>{languages.find((l) => l.code === language)?.nativeName || "English"}</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-50 animate-in fade-in-50 duration-150">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Language / ଭାଷା
            </div>
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left ${
                    isSelected
                      ? "bg-teal-50 text-teal-900 font-extrabold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{lang.name}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

