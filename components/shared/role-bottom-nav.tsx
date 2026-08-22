"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PATIENT_PRIMARY_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function RoleBottomNav() {
  const pathname = usePathname();

  // Only render on patient portal
  if (!pathname.startsWith("/patient")) return null;

  return (
    <nav 
      aria-label="Patient Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-1 shadow-lg md:hidden"
    >
      {PATIENT_PRIMARY_NAV.map((item) => {
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors py-1.5 px-1 rounded-xl active:scale-95",
              isActive 
                ? "text-teal-700 font-extrabold bg-teal-50/80" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-teal-700 stroke-[2.5]" : "text-slate-500")} aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
