"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole, ROLE_DASHBOARD_ROUTES } from "@/lib/constants";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LoadingState } from "@/components/shared/loading-state";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole | UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isAuthenticated, isLoading, hasRole, logout } = useAuth();

  const isAllowed = hasRole(allowedRoles);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return <LoadingState message="Verifying workspace permissions..." subtext="Checking authenticated role..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAllowed) {
    const userRole = role || "patient";
    const homeRoute = ROLE_DASHBOARD_ROUTES[userRole] || "/patient";

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto animate-in fade-in-50 duration-150">
        <div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-xs">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1.5">Access Restricted</h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Your active account (<strong>{user?.fullName} • {userRole.replace("_", " ").toUpperCase()}</strong>) does not have permission to access this workspace.
        </p>
        <div className="flex items-center gap-3">
          <Link href={homeRoute}>
            <Button size="sm" className="text-xs font-semibold gap-1.5 h-8">
              <ArrowLeft className="h-3.5 w-3.5" /> Return to My Workspace
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => logout()}
            className="text-xs font-semibold gap-1.5 h-8 text-slate-700 hover:text-red-700"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
