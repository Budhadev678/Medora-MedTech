"use client";

import React from "react";
import Link from "next/link";
import { 
  Pill, 
  FlaskConical, 
  Package, 
  Receipt, 
  AlertTriangle, 
  User, 
  Settings, 
  Globe, 
  ShieldCheck, 
  HelpCircle, 
  ChevronRight, 
  LogOut,
  Sparkles,
  HeartPulse,
  Stethoscope,
  FolderOpen,
  Landmark,
  CreditCard
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatientMorePage() {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: "Health Records & Clinical Care",
      items: [
        { label: "My Health Journey", href: "/patient/health", icon: HeartPulse, color: "text-rose-700 bg-rose-50", badge: "Timeline" },
        { label: "Medical Documents Vault", href: "/patient/documents", icon: FolderOpen, color: "text-teal-700 bg-teal-50", badge: "Vault" },
        { label: "Digital Prescriptions", href: "/patient/prescriptions", icon: Pill, color: "text-emerald-700 bg-emerald-50", badge: "Active" },
        { label: "Diagnostic Lab Reports", href: "/patient/reports", icon: FlaskConical, color: "text-blue-700 bg-blue-50", badge: "Verified" },
      ],
    },
    {
      title: "Financial & Welfare Services",
      items: [
        { label: "Itemized Hospital Bills", href: "/patient/bills", icon: Receipt, color: "text-purple-700 bg-purple-50", badge: "Invoices" },
        { label: "Insurance & Pre-Authorizations", href: "/patient/insurance", icon: ShieldCheck, color: "text-blue-700 bg-blue-50", badge: "Coverage" },
        { label: "Government Schemes (BSKY)", href: "/patient/government", icon: Landmark, color: "text-emerald-700 bg-emerald-50", badge: "Subsidy" },
        { label: "CarePay Treatment Financing", href: "/patient/finance", icon: CreditCard, color: "text-indigo-700 bg-indigo-50", badge: "0% EMI" },
      ],
    },
    {
      title: "Emergency & Safety",
      items: [
        { label: "Emergency Card & SOS", href: "/patient/emergency", icon: AlertTriangle, color: "text-red-700 bg-red-50", badge: "Critical" },
      ],
    },
    {
      title: "Account & Preferences",
      items: [
        { label: "Health Passport & ABHA", href: "/patient/profile", icon: User, color: "text-slate-700 bg-slate-100" },
        { label: "Privacy, Consent & Access", href: "/patient/privacy", icon: ShieldCheck, color: "text-teal-700 bg-teal-50", badge: "Active" },
        { label: "Language Settings", href: "/patient/language", icon: Globe, color: "text-blue-700 bg-blue-50" },
        { label: "App & Security Settings", href: "/patient/settings", icon: Settings, color: "text-slate-700 bg-slate-100" },
      ],
    },
    {
      title: "Support & Help",
      items: [
        { label: "Help & FAQs", href: "/patient/help", icon: HelpCircle, color: "text-slate-700 bg-slate-100" },
      ],
    },
  ];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="All Patient Services"
          description={`Signed in as ${user?.fullName || "Patient"} (${user?.identifier || "PAT-1001"})`}
        />

        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              {section.title}
            </h2>

            <Card className="bg-white border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 border-slate-200 text-slate-500">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </Card>
          </div>
        ))}

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full py-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-red-200"
          >
            <LogOut className="h-4 w-4" /> Sign Out of Patient Account
          </button>
        </div>
      </div>
    </RoleGuard>
  );
}
