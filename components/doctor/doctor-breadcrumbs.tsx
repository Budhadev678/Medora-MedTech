"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, Stethoscope } from "lucide-react";

export function DoctorBreadcrumbs() {
  const pathname = usePathname();

  if (!pathname.startsWith("/doctor")) {
    return null;
  }

  const getBreadcrumbItems = () => {
    const items: { label: string; href?: string }[] = [
      { label: "Doctor Workspace", href: "/doctor" }
    ];

    if (pathname === "/doctor") {
      items.push({ label: "Today / Queue" });
    } else if (pathname === "/doctor/consultations") {
      items.push({ label: "Consultation Suite" });
    } else if (pathname.startsWith("/doctor/consultations/")) {
      items.push({ label: "Consultation Suite", href: "/doctor/consultations" });
      items.push({ label: "Clinical Encounter" });
    } else if (pathname === "/doctor/patients") {
      items.push({ label: "Patient Registry" });
    } else if (pathname === "/doctor/appointments") {
      items.push({ label: "Appointments" });
    } else if (pathname.startsWith("/doctor/appointments/")) {
      items.push({ label: "Appointments", href: "/doctor/appointments" });
      items.push({ label: "Appointment Details" });
    } else if (pathname === "/doctor/prescriptions") {
      items.push({ label: "Prescriptions" });
    } else if (pathname === "/doctor/lab-orders") {
      items.push({ label: "Lab Test Orders" });
    } else if (pathname === "/doctor/schedule") {
      items.push({ label: "Schedule & Hours" });
    } else if (pathname === "/doctor/referrals") {
      items.push({ label: "Specialist Referrals" });
    } else if (pathname === "/doctor/profile") {
      items.push({ label: "Doctor Profile" });
    } else if (pathname === "/doctor/settings") {
      items.push({ label: "Workspace Settings" });
    } else {
      items.push({ label: "Clinical Operations" });
    }

    return items;
  };

  const breadcrumbs = getBreadcrumbItems();

  return (
    <nav aria-label="Doctor Workspace Breadcrumbs" className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 select-none">
      <Link href="/doctor" className="hover:text-teal-800 transition-colors flex items-center gap-1 text-slate-600">
        <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
        <span className="font-semibold">Doctor Workspace</span>
      </Link>
      
      {breadcrumbs.slice(1).map((item, index) => {
        const isLast = index === breadcrumbs.length - 2;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-teal-800 transition-colors font-medium text-slate-600">
                {item.label}
              </Link>
            ) : (
              <span className={`truncate font-bold ${isLast ? "text-slate-900" : "text-slate-600"}`}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}