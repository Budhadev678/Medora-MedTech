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
  LucideIcon
} from "lucide-react";
import { UserRole } from "@/types/database.types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
  comingSoon?: boolean;
  phase?: string;
  description?: string;
}

// 1. Patient Primary Bottom Navigation
export const PATIENT_PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/patient", icon: Home, exact: true },
  { label: "Appointments", href: "/patient/appointments", icon: Calendar, comingSoon: true, phase: "Phase 6" },
  { label: "Records", href: "/patient/records", icon: FileText, comingSoon: true, phase: "Phase 16" },
  { label: "Emergency", href: "/patient/emergency", icon: AlertTriangle, exact: false },
];

// 2. Patient "More" Navigation Drawer
export const PATIENT_MORE_NAV: NavItem[] = [
  { label: "Digital Prescriptions", href: "/patient/prescriptions", icon: Pill, comingSoon: true, phase: "Phase 7", description: "Verified e-prescriptions & pickup status" },
  { label: "Diagnostic Lab Reports", href: "/patient/reports", icon: FlaskConical, comingSoon: true, phase: "Phase 8", description: "Pathology & diagnostic test results" },
  { label: "Connected Pharmacy", href: "/patient/pharmacy", icon: Package, comingSoon: true, phase: "Phase 9", description: "Select pharmacy & dispense status" },
  { label: "Itemized Hospital Bills", href: "/patient/bills", icon: Receipt, comingSoon: true, phase: "Phase 10", description: "Transparent breakdown & 'Why Was I Charged?'" },
  { label: "Health Passport & ABHA", href: "/patient/profile", icon: User, description: "Demographics, emergency QR & ABHA link" },
  { label: "Vitals & Chronic Care", href: "/patient/health", icon: Activity, description: "BP, pulse, allergies & health metrics" },
  { label: "Care Plans & Advice", href: "/patient/care", icon: Stethoscope, description: "Active clinical care instructions" },
];

// 3. Doctor Workspace Navigation
export const DOCTOR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/doctor", icon: Activity, exact: true },
  { label: "Patients", href: "/doctor/patients", icon: Users, comingSoon: true, phase: "Phase 6" },
  { label: "Appointments", href: "/doctor/appointments", icon: Calendar, comingSoon: true, phase: "Phase 6" },
  { label: "Schedule & Hours", href: "/doctor/schedule", icon: Clock, comingSoon: true, phase: "Phase 4" },
  { label: "Consultation Suite", href: "/doctor/consultations", icon: Stethoscope, comingSoon: true, phase: "Phase 7" },
  { label: "Prescriptions", href: "/doctor/prescriptions", icon: Pill, comingSoon: true, phase: "Phase 7" },
  { label: "Lab Test Orders", href: "/doctor/lab-orders", icon: FlaskConical, comingSoon: true, phase: "Phase 8" },
  { label: "Referrals", href: "/doctor/referrals", icon: Share2, comingSoon: true, phase: "Phase 7" },
  { label: "Doctor Profile", href: "/doctor/profile", icon: User },
];

// 4. Hospital Command Center Navigation
export const HOSPITAL_NAV: NavItem[] = [
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
];

// 5. Diagnostic Laboratory Navigation
export const LAB_NAV: NavItem[] = [
  { label: "Lab Overview", href: "/lab", icon: FlaskConical, exact: true },
  { label: "Test Orders Queue", href: "/lab/orders", icon: ClipboardList, comingSoon: true, phase: "Phase 8" },
  { label: "Sample Intake", href: "/lab/samples", icon: Layers, comingSoon: true, phase: "Phase 8" },
  { label: "Diagnostic Testing", href: "/lab/testing", icon: Clock, comingSoon: true, phase: "Phase 8" },
  { label: "Pathologist Verification", href: "/lab/verification", icon: FileCheck, comingSoon: true, phase: "Phase 8" },
  { label: "Certified Reports", href: "/lab/reports", icon: FileText, comingSoon: true, phase: "Phase 8" },
  { label: "Laboratory Staff", href: "/lab/staff", icon: Users },
  { label: "Lab Settings", href: "/lab/settings", icon: Settings },
];

// 6. Pharmacy Dispensing Desk Navigation
export const PHARMACY_NAV: NavItem[] = [
  { label: "Pharmacy Overview", href: "/pharmacy", icon: Pill, exact: true },
  { label: "Prescriptions Queue", href: "/pharmacy/prescriptions", icon: ClipboardList, comingSoon: true, phase: "Phase 9" },
  { label: "Orders", href: "/pharmacy/orders", icon: Package, comingSoon: true, phase: "Phase 9" },
  { label: "Preparation", href: "/pharmacy/preparation", icon: Clock, comingSoon: true, phase: "Phase 9" },
  { label: "Patient Pickup", href: "/pharmacy/pickup", icon: User, comingSoon: true, phase: "Phase 9" },
  { label: "Dispensing Desk", href: "/pharmacy/dispensing", icon: CheckCircle2, comingSoon: true, phase: "Phase 9" },
  { label: "Inventory", href: "/pharmacy/inventory", icon: Layers, comingSoon: true, phase: "Phase 9" },
  { label: "Pharmacy Staff", href: "/pharmacy/staff", icon: Users },
  { label: "Pharmacy Settings", href: "/pharmacy/settings", icon: Settings },
];

// 7. Insurance & Claims Desk Navigation
export const INSURANCE_NAV: NavItem[] = [
  { label: "Claims Overview", href: "/insurance", icon: Shield, exact: true },
  { label: "Active Policies", href: "/insurance/policies", icon: FileText, comingSoon: true, phase: "Phase 12" },
  { label: "Incoming Claims", href: "/insurance/claims", icon: ClipboardList, comingSoon: true, phase: "Phase 12" },
  { label: "Pre-Auth Review", href: "/insurance/review", icon: FileSearch, comingSoon: true, phase: "Phase 12" },
  { label: "Approvals & Rejections", href: "/insurance/approvals", icon: CheckCircle2, comingSoon: true, phase: "Phase 12" },
  { label: "Disbursements & Payments", href: "/insurance/payments", icon: CreditCard, comingSoon: true, phase: "Phase 12" },
  { label: "Insurance Settings", href: "/insurance/settings", icon: Settings },
];

// 8. Healthcare Staff Navigation
export const STAFF_NAV: NavItem[] = [
  { label: "Staff Dashboard", href: "/staff", icon: Activity, exact: true },
  { label: "My Clinical Tasks", href: "/staff/tasks", icon: ClipboardList, comingSoon: true, phase: "Phase 5" },
  { label: "Assigned Patients", href: "/staff/patients", icon: Users, comingSoon: true, phase: "Phase 5" },
  { label: "Staff Profile", href: "/staff/profile", icon: User },
];

// 9. Platform Admin Navigation
export const ADMIN_NAV: NavItem[] = [
  { label: "Governance Overview", href: "/admin", icon: ShieldCheck, exact: true },
  { label: "User Accounts", href: "/admin/users", icon: Users, comingSoon: true, phase: "Phase 5" },
  { label: "Organizations", href: "/admin/organizations", icon: Building2, comingSoon: true, phase: "Phase 5" },
  { label: "Facilities & Branches", href: "/admin/facilities", icon: Layers, comingSoon: true, phase: "Phase 5" },
  { label: "License Verification", href: "/admin/verification", icon: FileCheck, comingSoon: true, phase: "Phase 5" },
  { label: "Immutable Audit Ledger", href: "/admin/audit", icon: ShieldCheck, comingSoon: true, phase: "Phase 11" },
  { label: "Platform Settings", href: "/admin/settings", icon: Settings },
];

export function getNavigationForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "patient": return PATIENT_PRIMARY_NAV;
    case "doctor": return DOCTOR_NAV;
    case "hospital_admin": return HOSPITAL_NAV;
    case "lab_staff": return LAB_NAV;
    case "pharmacy_staff": return PHARMACY_NAV;
    case "insurance_staff": return INSURANCE_NAV;
    case "staff": return STAFF_NAV;
    case "admin": return ADMIN_NAV;
    default: return DOCTOR_NAV;
  }
}
