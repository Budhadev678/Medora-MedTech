"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientConsentRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/patient/privacy");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-xs text-slate-500">
      Redirecting to Privacy & Consent Control Center...
    </div>
  );
}
