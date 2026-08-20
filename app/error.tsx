"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in dev mode
    console.error("Healthcare portal boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-sm">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Something Went Wrong</h1>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        We encountered a temporary issue while loading this healthcare workspace. Your session and patient data remain secure.
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Try Again
        </Button>
        <Link href="/">
          <Button className="gap-2 bg-teal-700 hover:bg-teal-800">
            <Home className="h-4 w-4" /> Return to Gateway
          </Button>
        </Link>
      </div>
    </div>
  );
}
