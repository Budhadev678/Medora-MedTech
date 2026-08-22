"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientRecordsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/patient/health");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-xs text-slate-500 font-medium">
      Loading My Health Records...
    </div>
  );
}
