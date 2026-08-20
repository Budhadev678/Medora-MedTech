"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Calendar, 
  FileText, 
  Receipt, 
  User, 
  Users, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  AlertTriangle, 
  Building2, 
  ShieldCheck, 
  Droplet, 
  CreditCard,
  Clock,
  Layers,
  HeartPulse
} from "lucide-react";
import { UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface RoleSidebarProps {
  role: UserRole;
  className?: string;
}

export function RoleSidebar({ role, className }: RoleSidebarProps) {
  const pathname = usePathname();

  const getNavItems = (): SidebarItem[] => {
    switch (role) {
      case "patient":
        return [
          { label: "Patient Home", href: "/patient", icon: <Home className="h-4 w-4" /> },
          { label: "Appointments", href: "/patient/appointments", icon: <Calendar className="h-4 w-4" /> },
          { label: "Health Journey", href: "/patient/health", icon: <HeartPulse className="h-4 w-4" /> },
          { label: "Transparent Bills", href: "/patient/bills", icon: <Receipt className="h-4 w-4" /> },
          { label: "My Profile & ABHA", href: "/patient/profile", icon: <User className="h-4 w-4" /> },
        ];

      case "doctor":
        return [
          { label: "Clinical Queue", href: "/doctor", icon: <Users className="h-4 w-4" />, badge: "4 Waiting" },
          { label: "Consultation Suite", href: "/doctor/consult", icon: <Stethoscope className="h-4 w-4" /> },
          { label: "Prescription Builder", href: "/doctor/prescriptions", icon: <FileText className="h-4 w-4" /> },
          { label: "Lab Test Orders", href: "/doctor/lab-orders", icon: <FlaskConical className="h-4 w-4" /> },
          { label: "Availability & On-Call", href: "/doctor/availability", icon: <Clock className="h-4 w-4" /> },
        ];

      case "hospital_admin":
        return [
          { label: "Command Center", href: "/hospital", icon: <Building2 className="h-4 w-4" /> },
          { label: "Departments", href: "/hospital/departments", icon: <Layers className="h-4 w-4" /> },
          { label: "Doctor Roster", href: "/hospital/doctors", icon: <Users className="h-4 w-4" /> },
          { label: "Bed & Admissions", href: "/hospital/admissions", icon: <HeartPulse className="h-4 w-4" /> },
          { label: "Hospital Audit Logs", href: "/hospital/audit", icon: <ShieldCheck className="h-4 w-4" /> },
        ];

      case "lab_staff":
        return [
          { label: "Diagnostic Orders", href: "/lab", icon: <FlaskConical className="h-4 w-4" />, badge: "2 New" },
          { label: "Sample Intake", href: "/lab/samples", icon: <Layers className="h-4 w-4" /> },
          { label: "Report Approvals", href: "/lab/reports", icon: <FileText className="h-4 w-4" /> },
        ];

      case "pharmacy_staff":
        return [
          { label: "Prescription Queue", href: "/pharmacy", icon: <Pill className="h-4 w-4" />, badge: "3 Ready" },
          { label: "Patient Dispense Desk", href: "/pharmacy/dispense", icon: <Users className="h-4 w-4" /> },
          { label: "Dispensing History", href: "/pharmacy/history", icon: <Clock className="h-4 w-4" /> },
        ];

      case "emergency_staff":
        return [
          { label: "Emergency Triage Board", href: "/emergency", icon: <AlertTriangle className="h-4 w-4" />, badge: "1 Critical" },
          { label: "Doctor Availability & Escalation", href: "/emergency/escalation", icon: <Users className="h-4 w-4" /> },
          { label: "Blood Bank Link", href: "/blood-bank", icon: <Droplet className="h-4 w-4" /> },
        ];

      case "blood_staff":
        return [
          { label: "Urgent Blood Requests", href: "/blood-bank", icon: <Droplet className="h-4 w-4" />, badge: "2 Urgent" },
          { label: "Donor Matching Desk", href: "/blood-bank/donors", icon: <Users className="h-4 w-4" /> },
        ];

      case "finance_staff":
        return [
          { label: "Itemized Invoices", href: "/finance", icon: <Receipt className="h-4 w-4" /> },
          { label: "Insurance & Govt Split", href: "/finance/claims", icon: <CreditCard className="h-4 w-4" /> },
          { label: "Patient Bill Disputes", href: "/finance/disputes", icon: <AlertTriangle className="h-4 w-4" /> },
        ];

      case "admin":
        return [
          { label: "System Overview", href: "/admin", icon: <Building2 className="h-4 w-4" /> },
          { label: "Role & Permission Matrix", href: "/admin/roles", icon: <Users className="h-4 w-4" /> },
          { label: "Master Immutable Audit", href: "/admin/audit", icon: <ShieldCheck className="h-4 w-4" /> },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className={cn("hidden md:flex w-64 flex-col border-r border-border bg-slate-50/60 p-4 min-h-[calc(100vh-4rem)]", className)}>
      <div className="mb-4 px-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Module Navigation
        </span>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    isActive ? "bg-teal-700 text-white" : "bg-teal-100 text-teal-800"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Security & Audit notice */}
      <div className="mt-auto rounded-lg border border-slate-200 bg-white p-3 text-[11px] text-slate-500 shadow-2xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
          <span>Audit-Protected Session</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          All mutations generate immutable event logs.
        </p>
      </div>
    </aside>
  );
}
