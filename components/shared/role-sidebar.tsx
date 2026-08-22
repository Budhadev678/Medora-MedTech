"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  AlertTriangle, 
  Building2, 
  ShieldCheck, 
  Droplet, 
  Receipt,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  HelpCircle
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
  const [collapsed, setCollapsed] = useState(false);

  // PATIENT DOES NOT USE THE DESKTOP ENTERPRISE SIDEBAR (Section 0 & 4: Mobile-First Consumer UX)
  if (role === "patient") {
    return null;
  }

  const getNavItems = (): SidebarItem[] => {
    switch (role) {
      case "doctor":
        return [
          { label: "Today's Overview", href: "/doctor", icon: <Stethoscope className="h-4 w-4" /> },
          { label: "Clinical Queue", href: "/doctor/appointments", icon: <Users className="h-4 w-4" />, badge: "4 Active" },
          { label: "Consultation Suite", href: "/doctor/consultations", icon: <Layers className="h-4 w-4" /> },
          { label: "Prescriptions", href: "/doctor/prescriptions", icon: <Pill className="h-4 w-4" /> },
          { label: "Lab Test Orders", href: "/doctor/lab-orders", icon: <FlaskConical className="h-4 w-4" /> },
          { label: "Schedule & Appointments", href: "/doctor/schedule", icon: <Clock className="h-4 w-4" /> },
          { label: "My Patients", href: "/doctor/patients", icon: <Users className="h-4 w-4" /> },
        ];

      case "hospital_admin":
        return [
          { label: "Command Center", href: "/hospital", icon: <Building2 className="h-4 w-4" /> },
          { label: "Appointments Desk", href: "/hospital/appointments", icon: <Clock className="h-4 w-4" /> },
          { label: "Billing & Charges", href: "/hospital/billing", icon: <Receipt className="h-4 w-4" /> },
          { label: "Cashier & Payments", href: "/hospital/billing/payments", icon: <Receipt className="h-4 w-4" /> },
          { label: "Departments", href: "/hospital/departments", icon: <Layers className="h-4 w-4" /> },
          { label: "Doctor & Staff Roster", href: "/hospital/doctors", icon: <Users className="h-4 w-4" /> },
          { label: "Bed & Admissions", href: "/hospital/admissions", icon: <Building2 className="h-4 w-4" /> },
          { label: "Hospital Audit Logs", href: "/admin/audit", icon: <ShieldCheck className="h-4 w-4" /> },
        ];

      case "lab_staff":
        return [
          { label: "Test Orders Queue", href: "/lab/orders", icon: <FlaskConical className="h-4 w-4" />, badge: "2 New" },
          { label: "Sample Custody Desk", href: "/lab/samples", icon: <Layers className="h-4 w-4" /> },
          { label: "Diagnostic Testing Desk", href: "/lab/testing", icon: <Clock className="h-4 w-4" /> },
          { label: "Report Verification", href: "/lab/verification", icon: <ShieldCheck className="h-4 w-4" /> },
          { label: "Released Reports", href: "/lab/reports", icon: <FlaskConical className="h-4 w-4" /> },
        ];

      case "pharmacy_staff":
        return [
          { label: "Prescription Intakes", href: "/pharmacy/prescriptions", icon: <Pill className="h-4 w-4" />, badge: "3 Ready" },
          { label: "Order Preparation", href: "/pharmacy/preparation", icon: <Clock className="h-4 w-4" /> },
          { label: "Ready for Pickup", href: "/pharmacy/pickup", icon: <Users className="h-4 w-4" /> },
          { label: "Dispensing Desk", href: "/pharmacy/dispensing", icon: <ShieldCheck className="h-4 w-4" /> },
          { label: "Inventory & FEFO Batches", href: "/pharmacy/inventory", icon: <Layers className="h-4 w-4" /> },
        ];

      case "emergency_staff":
        return [
          { label: "Triage Command Board", href: "/emergency", icon: <AlertTriangle className="h-4 w-4" />, badge: "1 Critical" },
          { label: "Staff Availability", href: "/doctor/schedule", icon: <Users className="h-4 w-4" /> },
          { label: "Blood Coordinator Link", href: "/blood-bank", icon: <Droplet className="h-4 w-4" /> },
        ];

      case "blood_staff":
        return [
          { label: "Urgent Blood Requests", href: "/blood-bank", icon: <Droplet className="h-4 w-4" />, badge: "2 Urgent" },
          { label: "Donor Matching Desk", href: "/blood-bank/donors", icon: <Users className="h-4 w-4" /> },
        ];

      case "finance_staff":
        return [
          { label: "Hospital Billing Console", href: "/hospital/billing", icon: <Receipt className="h-4 w-4" /> },
          { label: "Cashier & Payments", href: "/hospital/billing/payments", icon: <Receipt className="h-4 w-4" /> },
          { label: "3-Way Reconciliation", href: "/hospital/finance/reconciliation", icon: <Layers className="h-4 w-4" /> },
          { label: "Financial Disputes & Evidence", href: "/hospital/finance/disputes", icon: <AlertTriangle className="h-4 w-4" /> },
        ];

      case "admin":
        return [
          { label: "System Overview", href: "/admin", icon: <Building2 className="h-4 w-4" /> },
          { label: "Organizations", href: "/admin/organizations", icon: <Building2 className="h-4 w-4" /> },
          { label: "Facilities Network", href: "/admin/facilities", icon: <Building2 className="h-4 w-4" /> },
          { label: "User Identity Registry", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
          { label: "Staff Verification", href: "/admin/verification", icon: <ShieldCheck className="h-4 w-4" /> },
          { label: "Immutable Audit Log", href: "/admin/audit", icon: <ShieldCheck className="h-4 w-4" /> },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col border-r border-slate-200 bg-slate-50/70 p-3 min-h-[calc(100vh-4rem)] transition-all duration-200 select-none",
        collapsed ? "w-16" : "w-60",
        className
      )}
    >
      {/* Workspace Header */}
      <div className="flex items-center justify-between px-2 py-1 mb-3">
        {!collapsed && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {role.replace("_", " ")} Workspace
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors ml-auto"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg text-xs font-medium transition-colors group",
                collapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5",
                isActive
                  ? "bg-teal-700 text-white shadow-xs font-semibold"
                  : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-950"
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <span className={cn("flex-shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800")}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && item.badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.2 text-[10px] font-semibold",
                    isActive ? "bg-teal-800 text-white" : "bg-teal-100 text-teal-800"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Operational Session Box */}
      {!collapsed && (
        <div className="mt-auto rounded-xl border border-slate-200/80 bg-white p-3 text-[11px] text-slate-500 shadow-2xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-0.5">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>Audited Clinical Session</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Role: <strong className="text-slate-700 capitalize">{role.replace("_", " ")}</strong>
          </p>
        </div>
      )}
    </aside>
  );
}
