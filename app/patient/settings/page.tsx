"use client";

import React, { useState } from "react";
import { Settings, Bell, Shield, Globe, Lock, LogOut, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PatientSettingsPage() {
  const { user, logout } = useAuth();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = () => {
    setSavedMessage("Settings saved successfully.");
    setTimeout(() => setSavedMessage(null), 2500);
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150">
        <PageHeader
          title="App & Security Settings"
          description="Manage notifications, emergency alerts, and security preferences."
          breadcrumbs={[{ label: "Patient Portal", href: "/patient" }, { label: "Settings" }]}
        />

        {savedMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{savedMessage}</span>
          </div>
        )}

        {/* Notifications Card */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-600" />
              Notification Channels
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Receive instant updates when lab reports are released or tokens are called.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-semibold text-slate-900 block">Email Alerts</span>
                <span className="text-slate-500 text-[11px]">Send summaries to {user?.email}</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center justify-between py-1 border-t border-slate-100">
              <div>
                <span className="font-semibold text-slate-900 block">SMS & Critical Alerts</span>
                <span className="text-slate-500 text-[11px]">Direct SMS for appointment tokens and SOS</span>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </div>
            <Button size="sm" onClick={handleSave} className="w-full text-xs font-bold mt-2">
              Save Notification Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Security & Isolation */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-600" />
              Account Security & Data Isolation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 text-xs text-slate-600 space-y-2">
            <p>
              Your health data is protected by strict Supabase Row Level Security (RLS) policies. Only authorized healthcare providers with active consultation encounters or explicit consent grants can access your records.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px]">
              Patient Identifier: <strong>{user?.identifier || "PAT-1001"}</strong>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          onClick={() => logout()} 
          className="w-full text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out of MEDORA
        </Button>
      </div>
    </RoleGuard>
  );
}
