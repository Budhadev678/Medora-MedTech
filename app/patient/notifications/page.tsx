"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ChevronRight,
  Pill,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import { getNotificationsForUser, markNotificationRead } from "@/lib/data/notification-store";
import { PatientNotification } from "@/types/database.types";

export default function PatientNotificationCenterPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);

  const refresh = () => {
    const userId = user?.identifier || user?.id || "PAT-1001";
    const list = getNotificationsForUser(userId);
    setNotifications(list);
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    refresh();
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Portal
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" /> Patient Notification Center
              </h1>
              <p className="text-xs text-slate-500">Real-time alerts for prescription fulfillment, order ready & dispensing updates</p>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
              No notifications found.
            </div>
          ) : (
            notifications.map((n) => (
              <Card
                key={n.id}
                className={`bg-white rounded-2xl shadow-xs border transition-all ${
                  n.read_at ? "border-slate-200 opacity-80" : "border-amber-300 ring-2 ring-amber-100"
                }`}
              >
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          n.priority === "IMPORTANT" || n.priority === "CRITICAL"
                            ? "bg-amber-600 text-white text-[9px]"
                            : "bg-slate-100 text-slate-700 text-[9px]"
                        }
                      >
                        {n.priority}
                      </Badge>
                      <h4 className="font-bold text-slate-900 text-xs">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{n.message}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!n.read_at && (
                      <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)} className="text-[10px] rounded-xl text-slate-500">
                        Mark Read
                      </Button>
                    )}
                    {n.reference_type === "PHARMACY_ORDER" && (
                      <Link href={`/patient/pharmacy/orders/${n.reference_id}`}>
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded-xl font-bold">
                          View Order <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
