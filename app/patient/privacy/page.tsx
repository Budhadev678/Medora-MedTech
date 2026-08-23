"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientPrivacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/patient/consent");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirecting to Consent & Privacy...
    </div>
  );
}
