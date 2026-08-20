"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  HeartPulse, 
  Stethoscope, 
  AlertTriangle, 
  User 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RoleBottomNav() {
  const pathname = usePathname();

  // Only render on patient portal
  if (!pathname.startsWith("/patient")) return null;

  const items = [
    { label: "Home", href: "/patient", icon: Home, exact: true },
    { label: "Health", href: "/patient/health", icon: HeartPulse, exact: false },
    { label: "Care", href: "/patient/care", icon: Stethoscope, exact: false },
    { label: "Emergency", href: "/patient/emergency", icon: AlertTriangle, exact: false, isEmergency: true },
    { label: "Profile", href: "/patient/profile", icon: User, exact: false },
  ];

  return (
    <nav 
      aria-label="Patient Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 shadow-lg md:hidden"
    >
      {items.map((item) => {
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        if (item.isEmergency) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-transform active:scale-95",
                isActive ? "text-red-700 font-bold" : "text-red-600 hover:text-red-700"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-2xs">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors py-1 px-2.5 rounded-lg active:scale-95",
              isActive 
                ? "text-teal-700 font-bold bg-teal-50/80" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-teal-700" : "text-slate-500")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
