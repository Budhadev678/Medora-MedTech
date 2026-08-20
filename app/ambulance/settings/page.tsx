"use client";

import React from "react";
import { Truck, Settings } from "lucide-react";
import { WorkspaceHeader } from "@/components/professional/workspace-header";
import { RoleGuard } from "@/components/shared/role-guard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function AmbulanceSettingsPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["ambulance_staff", "emergency_staff", "admin"]}>
      <div className="space-y-6 animate-in fade-in-50 duration-150">
        <WorkspaceHeader
          title="Emergency Dispatch Settings"
          description="Ambulance provider licensing, base station locations, and trauma hospital priority routes."
          badgeText="Dispatcher Settings"
          breadcrumbs={[{ label: "Ambulance Console", href: "/ambulance" }, { label: "Settings" }]}
        />

        <Card className="bg-white">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-red-600" />
              Emergency Dispatch Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 text-xs text-slate-600 space-y-2">
            <p>
              Provider Organization: <strong>{user?.organizationName || "FastTrack Emergency Transit"}</strong>
            </p>
            <p className="font-mono text-slate-400">
              Dispatcher Identity: {user?.identifier || "AMB-1001"}
            </p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
