"use client";

import React, { useState } from "react";
import { Bell, CheckCircle2, ShieldCheck, Clock, Info, X } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "system" | "security" | "info";
  read: boolean;
}

export function NotificationPanel() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: "notif-1",
      title: "Welcome to MEDORA",
      message: `Signed in as ${user?.fullName || "User"} (${user?.identifier || "ID"}). Zero cross-account data leakage active.`,
      time: "Just now",
      type: "security",
      read: false,
    },
    {
      id: "notif-2",
      title: "National Health Registry Connected",
      message: "End-to-end Row Level Security (RLS) and verification active across all modules.",
      time: "Today",
      type: "system",
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-600 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in-50 duration-150 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-teal-50 px-1.5 py-0.2 text-[10px] font-bold text-teal-800">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-teal-700 hover:underline font-medium"
              >
                Mark all read
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto py-1">
              {notifications.map((n) => (
                <div key={n.id} className="py-2.5 px-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400">
                Phase 2 Notification Shell Active
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
