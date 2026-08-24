"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReceptionRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/hospital/appointments");
  }, [router]);

  return null;
}
