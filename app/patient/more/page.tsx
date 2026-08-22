"use client";

import React from "react";
import Link from "next/link";
import { 
  Bell,
  HelpCircle, 
  Settings, 
  Globe, 
  ShieldCheck, 
  ChevronRight, 
  LogOut,
  Activity,
  User,
  ArrowLeft
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PatientMorePage() {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: "Patient Utilities & Help",
      items: [
        { label: "Notifications & Alerts", href: "/patient/notifications", icon: Bell, color: "text-amber-700 bg-amber-50", desc: "View all clinical alerts, reminders and status updates" },
        { label: "Help Center & FAQs", href: "/patient/help", icon: HelpCircle, color: "text-blue-700 bg-blue-50", desc: "Guides, platform assistance and patient support" },
      ],
    },
    {
      title: "Privacy, Security & Preferences",
      items: [
        { label: "Privacy & Consent Settings", href: "/patient/consent", icon: ShieldCheck, color: "text-teal-700 bg-teal-50", desc: "Manage healthcare data sharing permissions" },
        { label: "Language Preferences", href: "/patient/language", icon: Globe, color: "text-indigo-700 bg-indigo-50", desc: "Select preferred communication & display language" },
        { label: "App & Security Settings", href: "/patient/settings", icon: Settings, color: "text-slate-700 bg-slate-100", desc: "Notification channels, password and active sessions" },
      ],
    },
    {
      title: "System Information",
      items: [
        { label: "About MEDORA Platform", href: "/patient/about", icon: Activity, color: "text-emerald-700 bg-emerald-50", desc: "Transparent connected healthcare ecosystem" },
      ],
    },
  ];

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 max-w-2xl mx-auto pb-24 animate-in fade-in-50 duration-150">
        <PageHeader
          title="Patient Services & Utilities"
          description={`Signed in as ${user?.fullName || "Patient"} (${user?.identifier || "PAT-1001"})`}
          breadcrumbs={[
            { label: "Patient Portal", href: "/patient" },
            { label: "Services & Utilities" },
          ]}
        />

        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              {section.title}
            </h2>

            <Card className="bg-white border-slate-200 divide-y divide-slate-100 rounded-2xl overflow-hidden shadow-xs">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${item.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-teal-700 transition-colors">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
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
          <Button
            type="button"
            variant="outline"
            onClick={logout}
            className="w-full py-3 h-11 rounded-2xl bg-red-50/50 hover:bg-red-100 text-red-700 border-red-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign Out of Patient Account
          </Button>
        </div>
      </div>
    </RoleGuard>
  );
}
