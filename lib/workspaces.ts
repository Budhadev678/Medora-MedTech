// ============================================================
// MEDORA — WORKSPACE RESOLUTION & DEFINITION ARCHITECTURE
// MODIFICATION PHASE A.4 (NURSE REMOVED)
// ============================================================

import { 
  Home, 
  Calendar, 
  FileText, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  Receipt, 
  AlertTriangle, 
  User, 
  Settings, 
  HelpCircle, 
  Users, 
  Building2, 
  Layers, 
  BedDouble, 
  ShieldCheck, 
  Droplet, 
  Clock, 
  Share2, 
  Sparkles, 
  ClipboardList, 
  FileCheck, 
  Package, 
  CheckCircle2, 
  CreditCard, 
  Activity,
  FolderOpen
} from "lucide-react";
import { UserRole } from "@/lib/constants";
import { StoredIdentity } from "@/lib/data/identity-store";
import type { OrganizationMembership } from "@/types/database.types";
import { NavItem, DOCTOR_NAV } from "@/lib/navigation";

export type WorkspaceType =
  | "patient_mobile"
  | "doctor_clinical"
  | "reception_workspace"
  | "hospital_command"
  | "clinic_operations"
  | "laboratory_workbench"
  | "pharmacy_operations"
  | "blood_coordination"
  | "platform_admin";

export interface WorkspaceDefinition {
  id: WorkspaceType;
  displayName: string;
  workspaceType: string;
  landingRoute: string;
  navItems: NavItem[];
  allowedRoles: UserRole[];
  badgeText: string;
}

// 1. Patient Mobile Application Workspace
export const PATIENT_WORKSPACE: WorkspaceDefinition = {
  id: "patient_mobile",
  displayName: "Patient Health Portal",
  workspaceType: "Mobile Healthcare Application",
  landingRoute: "/patient",
  allowedRoles: ["patient"],
  badgeText: "Patient App",
  navItems: [
    { label: "Home", href: "/patient", icon: Home, exact: true },
    { label: "Appointments", href: "/patient/appointments", icon: Calendar },
    { label: "Health", href: "/patient/health", icon: Activity, exact: false },
    { label: "Emergency", href: "/patient/emergency", icon: AlertTriangle },
  ],
};

// 2. Doctor Clinical Workspace
export const DOCTOR_WORKSPACE: WorkspaceDefinition = {
  id: "doctor_clinical",
  displayName: "Doctor Clinical Workspace",
  workspaceType: "Clinical Healthcare Suite",
  landingRoute: "/doctor",
  allowedRoles: ["doctor"],
  badgeText: "Clinical Workspace",
  navItems: DOCTOR_NAV,
};

// 3. Receptionist Front-Desk Workspace
export const RECEPTION_WORKSPACE: WorkspaceDefinition = {
  id: "reception_workspace",
  displayName: "Front Desk & Reception Desk",
  workspaceType: "Patient Flow & Front Desk Management",
  landingRoute: "/reception",
  allowedRoles: ["staff", "receptionist" as any, "hospital_admin"],
  badgeText: "Front Desk Desk",
  navItems: [
    { label: "Today's Queue", href: "/reception", icon: Activity, exact: true },
    { label: "Appointments", href: "/reception/appointments", icon: Calendar },
    { label: "Patient Check-in", href: "/reception/checkin", icon: ClipboardList, comingSoon: true, phase: "Phase 5" },
    { label: "Patient Registration", href: "/reception/patients", icon: Users, comingSoon: true, phase: "Phase 5" },
    { label: "OPD Billing", href: "/reception/billing", icon: Receipt, comingSoon: true, phase: "Phase 10" },
    { label: "Staff Profile", href: "/staff/profile", icon: User },
  ],
};

// 4. Hospital Command Center Workspace
export const HOSPITAL_WORKSPACE: WorkspaceDefinition = {
  id: "hospital_command",
  displayName: "Hospital Command Center",
  workspaceType: "Facility Operations Hub",
  landingRoute: "/hospital",
  allowedRoles: ["hospital_admin"],
  badgeText: "Hospital Operations",
  navItems: [
    { label: "Command Center", href: "/hospital", icon: Building2, exact: true },
    { label: "Operational Encounters", href: "/hospital/encounters", icon: Activity },
    { label: "Patients", href: "/hospital/patients", icon: Users, comingSoon: true, phase: "Phase 6" },
    { label: "Medical Staff & Doctors", href: "/hospital/doctors", icon: Stethoscope },
    { label: "Departments", href: "/hospital/departments", icon: Layers, comingSoon: true, phase: "Phase 5" },
    { label: "Appointments", href: "/hospital/appointments", icon: Calendar, comingSoon: true, phase: "Phase 6" },
    { label: "Bed & Admissions", href: "/hospital/admissions", icon: BedDouble, comingSoon: true, phase: "Phase 5" },
    { label: "Emergency Trauma Unit", href: "/hospital/emergency", icon: AlertTriangle, comingSoon: true, phase: "Phase 13" },
    { label: "Hospital Laboratory", href: "/hospital/laboratory", icon: FlaskConical, comingSoon: true, phase: "Phase 8" },
    { label: "Hospital Pharmacy", href: "/hospital/pharmacy", icon: Pill, comingSoon: true, phase: "Phase 9" },
    { label: "Billing & Invoices", href: "/hospital/billing", icon: Receipt, comingSoon: true, phase: "Phase 10" },
    { label: "Members & Staff", href: "/hospital/staff", icon: Users, comingSoon: true, phase: "Phase 5" },
    { label: "Facility Settings", href: "/hospital/settings", icon: Settings },
  ],
};

// 5. Outpatient Clinic Operations Workspace
export const CLINIC_WORKSPACE: WorkspaceDefinition = {
  id: "clinic_operations",
  displayName: "Outpatient Clinic Operations",
  workspaceType: "Day Clinic Management",
  landingRoute: "/clinic",
  allowedRoles: ["hospital_admin"],
  badgeText: "Clinic Operations",
  navItems: [
    { label: "Clinic Overview", href: "/clinic", icon: Building2, exact: true },
    { label: "Clinic Encounters", href: "/clinic/encounters", icon: Activity },
    { label: "Visiting Doctors", href: "/hospital/doctors", icon: Stethoscope },
    { label: "OPD Appointments", href: "/hospital/appointments", icon: Calendar, comingSoon: true, phase: "Phase 6" },
    { label: "OPD Billing & Receipts", href: "/hospital/billing", icon: Receipt, comingSoon: true, phase: "Phase 10" },
    { label: "Clinic Members", href: "/hospital/staff", icon: Users, comingSoon: true, phase: "Phase 5" },
  ],
};

// 6. Laboratory Workbench Workspace
export const LAB_WORKSPACE: WorkspaceDefinition = {
  id: "laboratory_workbench",
  displayName: "Laboratory Diagnostic Workbench",
  workspaceType: "Diagnostic Testing Operations",
  landingRoute: "/lab",
  allowedRoles: ["lab_staff"],
  badgeText: "Diagnostic Workbench",
  navItems: [
    { label: "Work Queue", href: "/lab", icon: FlaskConical, exact: true },
    { label: "Test Orders Queue", href: "/lab/orders", icon: ClipboardList, comingSoon: true, phase: "Phase 8" },
    { label: "Sample Intake", href: "/lab/samples", icon: Layers, comingSoon: true, phase: "Phase 8" },
    { label: "Diagnostic Testing", href: "/lab/testing", icon: Clock, comingSoon: true, phase: "Phase 8" },
    { label: "Pathologist Verification", href: "/lab/verification", icon: FileCheck, comingSoon: true, phase: "Phase 8" },
    { label: "Certified Reports", href: "/lab/reports", icon: FileText, comingSoon: true, phase: "Phase 8" },
    { label: "Laboratory Staff", href: "/lab/staff", icon: Users },
    { label: "Lab Settings", href: "/lab/settings", icon: Settings },
  ],
};

// 7. Pharmacy Dispensing Workspace
export const PHARMACY_WORKSPACE: WorkspaceDefinition = {
  id: "pharmacy_operations",
  displayName: "Pharmacy Dispensing Desk",
  workspaceType: "Prescription & Medication Operations",
  landingRoute: "/pharmacy",
  allowedRoles: ["pharmacy_staff"],
  badgeText: "Pharmacy Operations",
  navItems: [
    { label: "Pharmacy Work Queue", href: "/pharmacy", icon: Pill, exact: true },
    { label: "Prescriptions Queue", href: "/pharmacy/prescriptions", icon: ClipboardList, comingSoon: true, phase: "Phase 9" },
    { label: "Orders", href: "/pharmacy/orders", icon: Package, comingSoon: true, phase: "Phase 9" },
    { label: "Preparation", href: "/pharmacy/preparation", icon: Clock, comingSoon: true, phase: "Phase 9" },
    { label: "Patient Pickup", href: "/pharmacy/pickup", icon: User, comingSoon: true, phase: "Phase 9" },
    { label: "Dispensing Desk", href: "/pharmacy/dispensing", icon: CheckCircle2, comingSoon: true, phase: "Phase 9" },
    { label: "Inventory", href: "/pharmacy/inventory", icon: Layers, comingSoon: true, phase: "Phase 9" },
    { label: "Pharmacy Staff", href: "/pharmacy/staff", icon: Users },
    { label: "Pharmacy Settings", href: "/pharmacy/settings", icon: Settings },
  ],
};

// 8. Blood Coordination Workspace
export const BLOOD_WORKSPACE: WorkspaceDefinition = {
  id: "blood_coordination",
  displayName: "Blood Coordination & Donor Network",
  workspaceType: "Emergency Blood Logistics",
  landingRoute: "/blood-bank",
  allowedRoles: ["blood_staff"],
  badgeText: "Blood Centre",
  navItems: [
    { label: "Blood Request Queue", href: "/blood-bank", icon: Droplet, exact: true },
    { label: "Blood Inventory", href: "/blood-bank/inventory", icon: Layers, comingSoon: true, phase: "Phase 14" },
    { label: "Donor Registry", href: "/blood-bank/donors", icon: Users, comingSoon: true, phase: "Phase 14" },
    { label: "Cross-Match Requests", href: "/blood-bank/matching", icon: FlaskConical, comingSoon: true, phase: "Phase 14" },
    { label: "Dispatch Logistics", href: "/blood-bank/dispatch", icon: Building2, comingSoon: true, phase: "Phase 14" },
  ],
};

// 9. Platform Administration Workspace
export const ADMIN_WORKSPACE: WorkspaceDefinition = {
  id: "platform_admin",
  displayName: "Medora Platform Administration",
  workspaceType: "Ecosystem Governance",
  landingRoute: "/admin",
  allowedRoles: ["admin"],
  badgeText: "Platform Governance",
  navItems: [
    { label: "Governance Overview", href: "/admin", icon: ShieldCheck, exact: true },
    { label: "User Accounts", href: "/admin/users", icon: Users, comingSoon: true, phase: "Phase 5" },
    { label: "Organizations", href: "/admin/organizations", icon: Building2, comingSoon: true, phase: "Phase 5" },
    { label: "Facilities & Branches", href: "/admin/facilities", icon: Layers, comingSoon: true, phase: "Phase 5" },
    { label: "License Verification", href: "/admin/verification", icon: FileCheck, comingSoon: true, phase: "Phase 5" },
    { label: "Immutable Audit Ledger", href: "/admin/audit", icon: ShieldCheck, comingSoon: true, phase: "Phase 11" },
    { label: "Platform Settings", href: "/admin/settings", icon: Settings },
  ],
};

/**
 * Authoritatively resolves the workspace based on:
 * Authenticated Identity -> Organization Membership -> Contextual Role -> Workspace Definition.
 * NEVER falls back to generic doctor or demo workspace.
 */
export function resolveWorkspace(
  user: StoredIdentity | null, 
  activeMembership?: OrganizationMembership | null,
  role?: UserRole | null
): WorkspaceDefinition | null {
  if (!user && !role) return null;

  // 1. Patient sovereign workspace
  if (user?.role === "patient" || role === "patient") {
    return PATIENT_WORKSPACE;
  }

  // 2. Platform Admin
  if (user?.role === "admin" || role === "admin") {
    return ADMIN_WORKSPACE;
  }

  // 3. Organization Membership Scoped Resolution
  if (activeMembership && activeMembership.status === "ACTIVE") {
    const memRole = activeMembership.member_role?.toLowerCase();
    const roleTitle = activeMembership.role_title?.toLowerCase() || "";

    if (memRole === "doctor") {
      return DOCTOR_WORKSPACE;
    }

    if (roleTitle.includes("receptionist") || memRole === "receptionist" || memRole === "staff") {
      return RECEPTION_WORKSPACE;
    }

    if (memRole === "hospital_admin" || memRole === "clinic_admin") {
      if (
        activeMembership.organization_type === "clinic" || 
        activeMembership.organization_identifier?.startsWith("CLN-") ||
        activeMembership.organization_name?.toLowerCase().includes("clinic")
      ) {
        return CLINIC_WORKSPACE;
      }
      return HOSPITAL_WORKSPACE;
    }

    if (memRole === "lab_technician" || memRole === "lab_staff" || memRole === "pathologist") {
      return LAB_WORKSPACE;
    }

    if (memRole === "pharmacist" || memRole === "pharmacy_staff") {
      return PHARMACY_WORKSPACE;
    }

    if (memRole === "blood_staff") {
      return BLOOD_WORKSPACE;
    }
  }

  // 4. Standalone Role Resolution (for standalone seeded entities)
  const effectiveRole = user?.role || role;

  if (effectiveRole === "doctor") {
    return DOCTOR_WORKSPACE;
  }

  if (effectiveRole === "hospital_admin") {
    if (user?.identifier?.startsWith("CLN-") || user?.organizationName?.toLowerCase().includes("clinic")) {
      return CLINIC_WORKSPACE;
    }
    return HOSPITAL_WORKSPACE;
  }

  if (effectiveRole === "lab_staff") {
    return LAB_WORKSPACE;
  }

  if (effectiveRole === "pharmacy_staff") {
    return PHARMACY_WORKSPACE;
  }

  if (effectiveRole === "blood_staff") {
    return BLOOD_WORKSPACE;
  }

  if (effectiveRole === "staff" || effectiveRole === ("receptionist" as any)) {
    return RECEPTION_WORKSPACE;
  }

  return null;
}
