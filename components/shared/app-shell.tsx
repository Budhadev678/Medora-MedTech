"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { RoleSidebar } from "@/components/shared/role-sidebar";
import { RoleBottomNav } from "@/components/shared/role-bottom-nav";
import { UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // Detect active role from route path
  const getActiveRole = (): UserRole | null => {
    if (pathname.startsWith("/patient")) return "patient";
    if (pathname.startsWith("/doctor")) return "doctor";
    if (pathname.startsWith("/hospital")) return "hospital_admin";
    if (pathname.startsWith("/lab")) return "lab_staff";
    if (pathname.startsWith("/pharmacy")) return "pharmacy_staff";
    if (pathname.startsWith("/emergency")) return "emergency_staff";
    if (pathname.startsWith("/blood-bank")) return "blood_staff";
    if (pathname.startsWith("/finance")) return "finance_staff";
    if (pathname.startsWith("/admin")) return "admin";
    return null;
  };

  const activeRole = getActiveRole();
  const isPatient = activeRole === "patient";

  return (
    <div className="min-h-screen bg-slate-50/60 text-foreground flex flex-col font-sans">
      {/* Top Universal Header */}
      <Navbar />

      {/* Main Role Container */}
      <div className="flex-1 flex w-full">
        {/* Operational Desktop Sidebar (Hidden for Patient role) */}
        {activeRole && <RoleSidebar role={activeRole} />}
        
        {/* Main Content Area */}
        <main
          className={cn(
            "flex-1 w-full",
            isPatient
              ? "max-w-xl md:max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-24 md:pb-12" // Mobile-First Patient Container
              : "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" // High-Density Operational Workspace
          )}
        >
          {children}
        </main>
      </div>

      {/* Patient Mobile-First Bottom Navigation */}
      {isPatient && <RoleBottomNav />}
    </div>
  );
}
