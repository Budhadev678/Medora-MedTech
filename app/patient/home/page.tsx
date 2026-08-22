"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/patient");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-xs text-slate-500 font-medium">
      Loading Patient Home...
    </div>
  );
}
