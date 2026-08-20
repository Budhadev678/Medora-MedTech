"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/constants";

export default function AccessDeniedPage() {
  const { role, activePersona } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto">
      <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-sm">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Restricted Access</h1>
      <p className="text-xs text-slate-600 mb-6 leading-relaxed">
        You are authenticated as <strong className="text-slate-900">{activePersona.name} ({role})</strong>. This area is restricted to authorized personnel in accordance with MEDORA security and clinical governance policies.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href={ROLE_DASHBOARD_ROUTES[role]}>
          <Button size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" /> Go to {role.toUpperCase()} Dashboard
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Users className="h-4 w-4" /> Switch Role Persona
          </Button>
        </Link>
      </div>
    </div>
  );
}
