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
  FileSearch, 
  Landmark, 
  Shield, 
  Bell, 
  Activity,
  Truck,
  FileSpreadsheet,
  HandHeart,
  LucideIcon
} from "lucide-react";
import { UserRole } from "@/lib/constants";
import { StoredIdentity } from "@/lib/data/identity-store";
import { NavItem } from "@/lib/navigation";

export type WorkspaceType =
  | "patient_mobile"
  | "doctor_clinical"
  | "hospital_command"
  | "clinic_operations"
  | "laboratory_workbench"
  | "pharmacy_operations"
  | "insurance_claims"
  | "government_assistance"
  | "healthcare_financing"
  | "ambulance_dispatch"
  | "blood_coordination"
  | "staff_workspace"
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

// 1. Patient Mobile Application
export const PATIENT_WORKSPACE: WorkspaceDefinition = {
  id: "patient_mobile",
  displayName: "Patient Health Portal",
  workspaceType: "Mobile Healthcare Application",
  landingRoute: "/patient",
  allowedRoles: ["patient"],
  badgeText: "Patient App",
  navItems: [
    { label: "Home", href: "/patient", icon: Home, exact: true },
    { label: "Appointments", href: "/patient/appointments", icon: Calendar, comingSoon: true, phase: "Phase 6" },
    { label: "Records", href: "/patient/records", icon: FileText, comingSoon: true, phase: "Phase 16" },
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
  navItems: [
    { label: "Clinical Overview", href: "/doctor", icon: Activity, exact: true },
    { label: "Patients", href: "/doctor/patients", icon: Users, comingSoon: true, phase: "Phase 6" },
    { label: "Appointments", href: "/doctor/appointments", icon: Calendar, comingSoon: true, phase: "Phase 6" },
    { label: "Schedule & Hours", href: "/doctor/schedule", icon: Clock, comingSoon: true, phase: "Phase 4" },
    { label: "Consultation Suite", href: "/doctor/consultations", icon: Stethoscope, comingSoon: true, phase: "Phase 7" },
    { label: "Prescriptions", href: "/doctor/prescriptions", icon: Pill, comingSoon: true, phase: "Phase 7" },
    { label: "Lab Test Orders", href: "/doctor/lab-orders", icon: FlaskConical, comingSoon: true, phase: "Phase 8" },
    { label: "Referrals", href: "/doctor/referrals", icon: Share2, comingSoon: true, phase: "Phase 7" },
    { label: "Doctor Profile", href: "/doctor/profile", icon: User },
  ],
};

// 3. Hospital Command Center
export const HOSPITAL_WORKSPACE: WorkspaceDefinition = {
  id: "hospital_command",
  displayName: "Hospital Command Center",
  workspaceType: "Facility Operations Hub",
  landingRoute: "/hospital",
  allowedRoles: ["hospital_admin"],
  badgeText: "Hospital Operations",
  navItems: [
    { label: "Command Center", href: "/hospital", icon: Building2, exact: true },
    { label: "Patients", href: "/hospital/patients", icon: Users, comingSoon: true, phase: "Phase 6" },
    { label: "Medical Staff & Doctors", href: "/hospital/doctors", icon: Stethoscope },
    { label: "Departments", href: "/hospital/departments", icon: Layers, comingSoon: true, phase: "Phase 5" },
    { label: "Appointments", href: "/hospital/appointments", icon: Calendar, comingSoon: true, phase: "Phase 6" },
    { label: "Bed & Admissions", href: "/hospital/admissions", icon: BedDouble, comingSoon: true, phase: "Phase 5" },
    { label: "Emergency Trauma Unit", href: "/hospital/emergency", icon: AlertTriangle, comingSoon: true, phase: "Phase 13" },
    { label: "Hospital Laboratory", href: "/hospital/laboratory", icon: FlaskConical, comingSoon: true, phase: "Phase 8" },
    { label: "Hospital Pharmacy", href: "/hospital/pharmacy", icon: Pill, comingSoon: true, phase: "Phase 9" },
    { label: "Billing & Invoices", href: "/hospital/billing", icon: Receipt, comingSoon: true, phase: "Phase 10" },
    { label: "Insurance Desk", href: "/hospital/insurance", icon: Shield, comingSoon: true, phase: "Phase 12" },
    { label: "Staff Roster", href: "/hospital/staff", icon: Users, comingSoon: true, phase: "Phase 5" },
    { label: "Facility Settings", href: "/hospital/settings", icon: Settings },
  ],
};

// 4. Outpatient Clinic Operations
export const CLINIC_WORKSPACE: WorkspaceDefinition = {
  id: "clinic_operations",
  displayName: "Outpatient Clinic Operations",
  workspaceType: "Day Clinic Management",
  landingRoute: "/clinic",
  allowedRoles: ["hospital_admin"],
  badgeText: "Clinic Operations",
  navItems: [
    { label: "Clinic Overview", href: "/clinic", icon: Building2, exact: true },
    { label: "Visiting Doctors", href: "/hospital/doctors", icon: Stethoscope },
    { label: "OPD Appointments", href: "/hospital/appointments", icon: Calendar, comingSoon: true, phase: "Phase 6" },
    { label: "OPD Billing & Receipts", href: "/hospital/billing", icon: Receipt, comingSoon: true, phase: "Phase 10" },
    { label: "Clinic Staff", href: "/hospital/staff", icon: Users, comingSoon: true, phase: "Phase 5" },
  ],
};

// 5. Laboratory Workbench
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

// 6. Pharmacy Operations Desk
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

// 7. Insurance Claims Workspace
export const INSURANCE_WORKSPACE: WorkspaceDefinition = {
  id: "insurance_claims",
  displayName: "Insurance Claims & Pre-Auth Desk",
  workspaceType: "Payer & Policy Administration",
  landingRoute: "/insurance",
  allowedRoles: ["insurance_staff"],
  badgeText: "Claims Workspace",
  navItems: [
    { label: "Claims Overview", href: "/insurance", icon: Shield, exact: true },
    { label: "Active Policies", href: "/insurance/policies", icon: FileText, comingSoon: true, phase: "Phase 12" },
    { label: "Incoming Claims", href: "/insurance/claims", icon: ClipboardList, comingSoon: true, phase: "Phase 12" },
    { label: "Pre-Auth Review", href: "/insurance/review", icon: FileSearch, comingSoon: true, phase: "Phase 12" },
    { label: "Approvals & Rejections", href: "/insurance/approvals", icon: CheckCircle2, comingSoon: true, phase: "Phase 12" },
    { label: "Disbursements & Payments", href: "/insurance/payments", icon: CreditCard, comingSoon: true, phase: "Phase 12" },
    { label: "Insurance Settings", href: "/insurance/settings", icon: Settings },
  ],
};

// 8. Government Assistance Desk
export const GOVERNMENT_WORKSPACE: WorkspaceDefinition = {
  id: "government_assistance",
  displayName: "Government Health Assistance Desk",
  workspaceType: "State & National Scheme Administration",
  landingRoute: "/government",
  allowedRoles: ["government_staff"],
  badgeText: "Government Assistance",
  navItems: [
    { label: "Assistance Overview", href: "/government", icon: Landmark, exact: true },
    { label: "Assistance Cases", href: "/government/cases", icon: ClipboardList, comingSoon: true, phase: "Phase 12" },
    { label: "Scheme Applications", href: "/government/applications", icon: FileText, comingSoon: true, phase: "Phase 12" },
    { label: "Beneficiaries", href: "/government/beneficiaries", icon: Users, comingSoon: true, phase: "Phase 12" },
    { label: "Subsidy Approvals", href: "/government/approvals", icon: CheckCircle2, comingSoon: true, phase: "Phase 12" },
    { label: "Disbursements", href: "/government/disbursements", icon: CreditCard, comingSoon: true, phase: "Phase 12" },
    { label: "Scheme Settings", href: "/government/settings", icon: Settings },
  ],
};

// 9. Healthcare Financing Partner Workspace
export const FINANCE_WORKSPACE: WorkspaceDefinition = {
  id: "healthcare_financing",
  displayName: "Healthcare Financing & Split Settlement",
  workspaceType: "Treatment Financing & Cost-Split",
  landingRoute: "/finance",
  allowedRoles: ["finance_staff"],
  badgeText: "Financing Workspace",
  navItems: [
    { label: "Financing Overview", href: "/finance", icon: CreditCard, exact: true },
    { label: "Patient Applications", href: "/finance/applications", icon: FileSpreadsheet, comingSoon: true, phase: "Phase 12" },
    { label: "Micro-Financing Plans", href: "/finance/plans", icon: HandHeart, comingSoon: true, phase: "Phase 12" },
    { label: "Multi-Source Splits", href: "/finance/splits", icon: Receipt, comingSoon: true, phase: "Phase 10" },
    { label: "Disbursement Ledger", href: "/finance/ledger", icon: CheckCircle2, comingSoon: true, phase: "Phase 12" },
  ],
};

// 10. Ambulance Emergency Dispatch Console
export const AMBULANCE_WORKSPACE: WorkspaceDefinition = {
  id: "ambulance_dispatch",
  displayName: "Emergency Dispatch Console",
  workspaceType: "Emergency Transit & Dispatch",
  landingRoute: "/ambulance",
  allowedRoles: ["ambulance_staff", "emergency_staff"],
  badgeText: "Emergency Dispatch",
  navItems: [
    { label: "Dispatch Console", href: "/ambulance", icon: Truck, exact: true },
    { label: "Emergency Queue", href: "/ambulance/queue", icon: AlertTriangle, comingSoon: true, phase: "Phase 18" },
    { label: "Available Fleet", href: "/ambulance/fleet", icon: Activity, comingSoon: true, phase: "Phase 18" },
    { label: "Active Trips & Transit", href: "/ambulance/trips", icon: Clock, comingSoon: true, phase: "Phase 18" },
    { label: "Hospital Transfers", href: "/ambulance/transfers", icon: Building2, comingSoon: true, phase: "Phase 18" },
    { label: "Dispatcher Settings", href: "/ambulance/settings", icon: Settings },
  ],
};

// 11. Blood Coordination Workspace
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
    { label: "Dispatch Logistics", href: "/blood-bank/dispatch", icon: Truck, comingSoon: true, phase: "Phase 14" },
  ],
};

// 12. Healthcare Staff Workspace
export const STAFF_WORKSPACE: WorkspaceDefinition = {
  id: "staff_workspace",
  displayName: "Healthcare Staff Duty Workspace",
  workspaceType: "Operational Task Management",
  landingRoute: "/staff",
  allowedRoles: ["staff"],
  badgeText: "Staff Workspace",
  navItems: [
    { label: "Shift Workspace", href: "/staff", icon: Activity, exact: true },
    { label: "Clinical Handover Tasks", href: "/staff/tasks", icon: ClipboardList, comingSoon: true, phase: "Phase 5" },
    { label: "Assigned Inpatients", href: "/staff/patients", icon: Users, comingSoon: true, phase: "Phase 5" },
    { label: "Staff Profile & ID", href: "/staff/profile", icon: User },
  ],
};

// 13. Platform Administration
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
 * Resolves the exact workspace based on the authenticated user's actual role,
 * organization, and membership context.
 * 
 * NEVER falls back to Doctor workspace.
 */
export function resolveWorkspace(user: StoredIdentity | null, role: UserRole | null): WorkspaceDefinition | null {
  if (!user && !role) return null;

  const effectiveRole = user?.role || role;

  // 1. Patient
  if (effectiveRole === "patient") {
    return PATIENT_WORKSPACE;
  }

  // 2. Doctor
  if (effectiveRole === "doctor") {
    return DOCTOR_WORKSPACE;
  }

  // 3. Hospital / Clinic
  if (effectiveRole === "hospital_admin") {
    // Check if the organization/identifier corresponds to a Clinic
    if (user?.identifier?.startsWith("CLN-") || user?.organizationName?.toLowerCase().includes("clinic")) {
      return CLINIC_WORKSPACE;
    }
    return HOSPITAL_WORKSPACE;
  }

  // 4. Laboratory
  if (effectiveRole === "lab_staff") {
    return LAB_WORKSPACE;
  }

  // 5. Pharmacy
  if (effectiveRole === "pharmacy_staff") {
    return PHARMACY_WORKSPACE;
  }

  // 6. Insurance
  if (effectiveRole === "insurance_staff") {
    return INSURANCE_WORKSPACE;
  }

  // 7. Government Assistance
  if (effectiveRole === "government_staff") {
    return GOVERNMENT_WORKSPACE;
  }

  // 8. Healthcare Financing
  if (effectiveRole === "finance_staff") {
    return FINANCE_WORKSPACE;
  }

  // 9. Ambulance / Dispatch
  if (effectiveRole === "ambulance_staff" || effectiveRole === "emergency_staff") {
    return AMBULANCE_WORKSPACE;
  }

  // 10. Blood Centre
  if (effectiveRole === "blood_staff") {
    return BLOOD_WORKSPACE;
  }

  // 11. Staff
  if (effectiveRole === "staff") {
    return STAFF_WORKSPACE;
  }

  // 12. Admin
  if (effectiveRole === "admin") {
    return ADMIN_WORKSPACE;
  }

  // Unknown role: return null (do NOT fallback to Doctor)
  return null;
}
