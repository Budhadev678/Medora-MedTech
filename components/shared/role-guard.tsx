"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole, ROLE_DASHBOARD_ROUTES } from "@/lib/constants";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole | UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, isAuthenticated, isLoading, hasRole, activePersona } = useAuth();

  const isAllowed = hasRole(allowedRoles);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-xs text-slate-500 font-medium">Verifying role permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    return null;
  }

  if (!isAllowed) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-sm">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied (403)</h2>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Your current persona (<strong className="text-slate-900">{activePersona.name} — {role.toUpperCase()}</strong>) does not have authorization to access this module.
        </p>
        <div className="flex gap-2">
          <Link href={ROLE_DASHBOARD_ROUTES[role]}>
            <Button size="sm" className="text-xs gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Return to My {role.toUpperCase()} Portal
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm" className="text-xs">
              Switch Persona
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
