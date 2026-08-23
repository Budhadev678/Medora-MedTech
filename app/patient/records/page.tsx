"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientRecordsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/patient/health");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirecting to My Health...
    </div>
  );
}
