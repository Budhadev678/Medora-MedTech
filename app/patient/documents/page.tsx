"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientDocumentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/patient/health?tab=documents");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirecting to Health Documents...
    </div>
  );
}
