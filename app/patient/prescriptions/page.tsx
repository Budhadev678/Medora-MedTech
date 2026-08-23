"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientPrescriptionsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/patient/health?tab=prescriptions");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirecting to My Health Prescriptions...
    </div>
  );
}
