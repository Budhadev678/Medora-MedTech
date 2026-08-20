"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { RoleSidebar } from "@/components/shared/role-sidebar";
import { RoleBottomNav } from "@/components/shared/role-bottom-nav";
import { UserRole } from "@/lib/constants";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // Detect active role from path
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Universal Navbar */}
      <Navbar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex w-full">
        {activeRole && <RoleSidebar role={activeRole} />}
        
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full ${activeRole === "patient" ? "pb-20 md:pb-8" : ""}`}>
          {children}
        </main>
      </div>

      {/* Patient Mobile Bottom Bar */}
      <RoleBottomNav />
    </div>
  );
}
