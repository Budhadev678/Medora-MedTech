"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Pill } from "lucide-react";

export function PharmacyBreadcrumbs() {
  const pathname = usePathname();

  if (!pathname.startsWith("/pharmacy")) {
    return null;
  }

  const getBreadcrumbItems = () => {
    const items: { label: string; href?: string }[] = [
      { label: "Pharmacy Desk", href: "/pharmacy" }
    ];

    if (pathname === "/pharmacy") {
      items.push({ label: "Pharmacy Work Queue" });
    } else if (pathname === "/pharmacy/prescriptions") {
      items.push({ label: "Prescriptions Queue" });
    } else if (pathname.startsWith("/pharmacy/prescriptions/")) {
      items.push({ label: "Prescriptions Queue", href: "/pharmacy/prescriptions" });
      items.push({ label: "Prescription Intake Verification" });
    } else if (pathname === "/pharmacy/orders") {
      items.push({ label: "Orders" });
    } else if (pathname.startsWith("/pharmacy/orders/")) {
      items.push({ label: "Orders", href: "/pharmacy/orders" });
      items.push({ label: "Order Details" });
    } else if (pathname === "/pharmacy/preparation") {
      items.push({ label: "Preparation" });
    } else if (pathname === "/pharmacy/pickup") {
      items.push({ label: "Patient Pickup" });
    } else if (pathname === "/pharmacy/dispensing") {
      items.push({ label: "Dispensing Desk" });
    } else if (pathname === "/pharmacy/inventory") {
      items.push({ label: "Inventory" });
    } else if (pathname === "/pharmacy/staff") {
      items.push({ label: "Pharmacy Staff" });
    } else if (pathname === "/pharmacy/settings") {
      items.push({ label: "Pharmacy Settings" });
    } else {
      items.push({ label: "Operational Queue" });
    }

    return items;
  };

  const breadcrumbs = getBreadcrumbItems();

  return (
    <nav aria-label="Pharmacy Workspace Breadcrumbs" className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 select-none">
      <Link href="/pharmacy" className="hover:text-emerald-800 transition-colors flex items-center gap-1 text-slate-600">
        <Pill className="h-3.5 w-3.5 text-emerald-700" />
        <span className="font-semibold">Pharmacy Desk</span>
      </Link>
      
      {breadcrumbs.slice(1).map((item, index) => {
        const isLast = index === breadcrumbs.length - 2;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-emerald-800 transition-colors font-medium text-slate-600">
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