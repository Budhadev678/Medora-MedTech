"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { PatientShell } from "@/components/shared/patient-shell";
import { ProfessionalShell } from "@/components/shared/professional-shell";
import { Navbar } from "@/components/shared/navbar";
import { LoadingState } from "@/components/shared/loading-state";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, role, isLoading } = useAuth();

  // Public & Verification routes do not require role-wrapped shell
  const isPublicRoute = 
    pathname === "/" || 
    pathname.startsWith("/login") || 
    pathname.startsWith("/register") || 
    pathname.startsWith("/verify") ||
    pathname.startsWith("/access-denied");

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-foreground flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
      </div>
    );
  }

  // Loading state during initial authentication hydration
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState fullscreen />
      </div>
    );
  }

  // Route-based or user-role-based Shell determination
  const isPatientRoute = pathname.startsWith("/patient") || role === "patient";

  if (isPatientRoute) {
    return <PatientShell>{children}</PatientShell>;
  }

  return <ProfessionalShell>{children}</ProfessionalShell>;
}
