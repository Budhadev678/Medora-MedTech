"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Calendar, 
  HeartPulse, 
  Receipt, 
  User,
  AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RoleBottomNav() {
  const pathname = usePathname();

  // Only render on patient portal
  if (!pathname.startsWith("/patient")) return null;

  const items = [
    { label: "Home", href: "/patient", icon: <Home className="h-5 w-5" /> },
    { label: "Appts", href: "/patient/appointments", icon: <Calendar className="h-5 w-5" /> },
    { label: "Timeline", href: "/patient/health", icon: <HeartPulse className="h-5 w-5" /> },
    { label: "Bills", href: "/patient/bills", icon: <Receipt className="h-5 w-5" /> },
    { label: "Profile", href: "/patient/profile", icon: <User className="h-5 w-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-white px-2 shadow-lg md:hidden">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              isActive ? "text-teal-600 font-bold" : "text-slate-500 hover:text-slate-900"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
