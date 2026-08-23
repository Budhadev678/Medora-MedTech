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
  Receipt,
  Calendar,
  FlaskConical,
  Check,
  ShieldAlert,
  CreditCard,
  FileText,
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/components/shared/role-guard";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getNotificationsForUser,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  NotificationCategory
} from "@/lib/data/notification-store";
import { PatientNotification } from "@/types/database.types";

export default function PatientNotificationCenterPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("ALL");
  const [filterReadStatus, setFilterReadStatus] = useState<"all" | "unread">("all");

  const refresh = () => {
    const userId = user?.identifier || user?.id || "PAT-1001";
    const list = getNotificationsForUser(userId, selectedCategory);
    setNotifications(list);
  };

  useEffect(() => {
    refresh();
  }, [user, selectedCategory]);

  const handleToggleRead = (n: PatientNotification) => {
    if (n.read_at) {
      markNotificationUnread(n.id);
    } else {
      markNotificationRead(n.id);
    }
    refresh();
  };

  const handleMarkAllRead = () => {
    const userId = user?.identifier || user?.id || "PAT-1001";
    markAllNotificationsRead(userId);
    refresh();
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const displayedNotifications =
    filterReadStatus === "unread"
      ? notifications.filter((n) => !n.read_at)
      : notifications;

  const getNotificationLink = (n: PatientNotification) => {
    const ref = (n.reference_type || "").toUpperCase();
    if (ref === "EMERGENCY") return `/patient/emergency`;
    if (ref === "APPOINTMENT") return `/patient/appointments`;
    if (ref === "PRESCRIPTION") return `/patient/health?tab=prescriptions`;
    if (ref === "LAB_REPORT") return `/patient/health?tab=lab_reports`;
    if (ref === "BILL") return `/patient/billing/${n.reference_id}`;
    if (ref === "PAYMENT" || ref === "DISPUTE") return `/patient/billing`;
    if (ref === "PHARMACY_ORDER") return `/patient/pharmacy/orders/${n.reference_id}`;
    return null;
  };

  const getCategoryIcon = (refType?: string, priority?: string) => {
    const ref = (refType || "").toUpperCase();
    if (priority === "CRITICAL" || ref === "EMERGENCY") {
      return <AlertTriangle className="h-4 w-4 text-rose-600" />;
    }
    if (ref === "APPOINTMENT") return <Calendar className="h-4 w-4 text-teal-600" />;
    if (ref === "LAB_REPORT") return <FlaskConical className="h-4 w-4 text-indigo-600" />;
    if (ref === "PRESCRIPTION" || ref === "PHARMACY_ORDER") return <Pill className="h-4 w-4 text-amber-600" />;
    if (ref === "BILL" || ref === "PAYMENT") return <Receipt className="h-4 w-4 text-emerald-600" />;
    if (ref === "SECURITY") return <ShieldAlert className="h-4 w-4 text-slate-700" />;
    return <Info className="h-4 w-4 text-slate-500" />;
  };

  return (
    <RoleGuard allowedRoles={["patient", "admin"]}>
      <div className="space-y-5 animate-in fade-in-50 duration-150 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/patient">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" /> Home
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" /> Notifications & Communications
              </h1>
              <p className="text-xs text-slate-500">
                Authoritative clinical, billing, appointment, and security updates
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs rounded-xl h-8 text-teal-800 border-teal-200 hover:bg-teal-50 gap-1 font-bold"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Mark All as Read</span>
            </Button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(["ALL", "APPOINTMENT", "HEALTHCARE", "BILLING", "EMERGENCY", "SECURITY"] as NotificationCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat === "ALL" ? "All Updates" : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Read / Unread Status Filter */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setFilterReadStatus("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterReadStatus === "all" ? "bg-white text-slate-900 font-bold shadow-xs" : "hover:text-slate-900"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterReadStatus("unread")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterReadStatus === "unread" ? "bg-white text-slate-900 font-bold shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          <span className="text-[11px] text-slate-400">Sorted by Priority & Event Time</span>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {displayedNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 text-xs space-y-1">
              <Bell className="h-8 w-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
              <p className="font-bold text-slate-600">No notifications in this view.</p>
              <p className="text-[11px]">All your healthcare events and records are up to date.</p>
            </div>
          ) : (
            displayedNotifications.map((n) => {
              const link = getNotificationLink(n);
              const isUnread = !n.read_at;
              const isCritical = n.priority === "CRITICAL";

              return (
                <Card
                  key={n.id}
                  className={`bg-white rounded-2xl shadow-xs transition-all ${
                    isCritical
                      ? "border-rose-300 bg-rose-50/40 ring-2 ring-rose-100"
                      : isUnread
                      ? "border-amber-300 ring-2 ring-amber-100/60"
                      : "border-slate-200 opacity-90"
                  }`}
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl mt-0.5 shrink-0">
                        {getCategoryIcon(n.reference_type, n.priority)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isCritical ? "emergency" : isUnread ? "warning" : "outline"}
                            className="text-[10px] font-bold"
                          >
                            {n.event_type.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(n.created_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRead(n)}
                        className="text-[11px] h-7 px-2 text-slate-500 hover:text-slate-900 rounded-lg"
                      >
                        {isUnread ? "Mark as Read" : "Mark Unread"}
                      </Button>

                      {link && (
                        <Link href={link}>
                          <Button
                            size="sm"
                            className="text-[11px] h-7 px-3 rounded-lg font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1"
                          >
                            <span>View Record</span>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
