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
import { resolveWorkspace } from "@/lib/workspaces";

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
  { label: "Privacy, Consent & Access", href: "/patient/privacy", icon: ShieldCheck, description: "Manage healthcare consents & data sharing" },
  { label: "Vitals & Chronic Care", href: "/patient/health", icon: Activity, description: "BP, pulse, allergies & health metrics" },
  { label: "Care Plans & Advice", href: "/patient/care", icon: Stethoscope, description: "Active clinical care instructions" },
];

// 3. Doctor Workspace Navigation
export const DOCTOR_NAV: NavItem[] = [
  { label: "Clinical Overview", href: "/doctor", icon: Activity, exact: true },
  { label: "Encounter Workbench", href: "/doctor/consultations", icon: Stethoscope },
  { label: "Patient Registry", href: "/doctor/patients", icon: Users },
  { label: "Appointments", href: "/doctor/appointments", icon: Calendar, comingSoon: true, phase: "Phase 6" },
  { label: "Schedule & Hours", href: "/doctor/schedule", icon: Clock, comingSoon: true, phase: "Phase 4" },
  { label: "Prescriptions", href: "/doctor/prescriptions", icon: Pill, comingSoon: true, phase: "Phase 4.3" },
  { label: "Lab Test Orders", href: "/doctor/lab-orders", icon: FlaskConical, comingSoon: true, phase: "Phase 4.3" },
  { label: "Referrals", href: "/doctor/referrals", icon: Share2, comingSoon: true, phase: "Phase 7" },
  { label: "Doctor Profile", href: "/doctor/profile", icon: User },
];

// 4. Hospital Command Center Navigation
export const HOSPITAL_NAV: NavItem[] = [
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
  { label: "Insurance Desk", href: "/hospital/insurance", icon: Shield, comingSoon: true, phase: "Phase 12" },
  { label: "Staff Roster", href: "/hospital/staff", icon: Users, comingSoon: true, phase: "Phase 5" },
  { label: "Facility Settings", href: "/hospital/settings", icon: Settings },
];

// 5. Outpatient Clinic Navigation
export const CLINIC_NAV: NavItem[] = [
  { label: "Clinic Overview", href: "/clinic", icon: Building2, exact: true },
  { label: "Visiting Doctors", href: "/hospital/doctors", icon: Stethoscope },
  { label: "OPD Appointments", href: "/hospital/appointments", icon: Calendar, comingSoon: true, phase: "Phase 6" },
  { label: "OPD Billing & Receipts", href: "/hospital/billing", icon: Receipt, comingSoon: true, phase: "Phase 10" },
  { label: "Clinic Staff", href: "/hospital/staff", icon: Users, comingSoon: true, phase: "Phase 5" },
];

// 6. Diagnostic Laboratory Navigation
export const LAB_NAV: NavItem[] = [
  { label: "Work Queue", href: "/lab", icon: FlaskConical, exact: true },
  { label: "Test Orders Queue", href: "/lab/orders", icon: ClipboardList, comingSoon: true, phase: "Phase 8" },
  { label: "Sample Intake", href: "/lab/samples", icon: Layers, comingSoon: true, phase: "Phase 8" },
  { label: "Diagnostic Testing", href: "/lab/testing", icon: Clock, comingSoon: true, phase: "Phase 8" },
  { label: "Pathologist Verification", href: "/lab/verification", icon: FileCheck, comingSoon: true, phase: "Phase 8" },
  { label: "Certified Reports", href: "/lab/reports", icon: FileText, comingSoon: true, phase: "Phase 8" },
  { label: "Laboratory Staff", href: "/lab/staff", icon: Users },
  { label: "Lab Settings", href: "/lab/settings", icon: Settings },
];

// 7. Pharmacy Dispensing Desk Navigation
export const PHARMACY_NAV: NavItem[] = [
  { label: "Pharmacy Work Queue", href: "/pharmacy", icon: Pill, exact: true },
  { label: "Prescriptions Queue", href: "/pharmacy/prescriptions", icon: ClipboardList, comingSoon: true, phase: "Phase 9" },
  { label: "Orders", href: "/pharmacy/orders", icon: Package, comingSoon: true, phase: "Phase 9" },
  { label: "Preparation", href: "/pharmacy/preparation", icon: Clock, comingSoon: true, phase: "Phase 9" },
  { label: "Patient Pickup", href: "/pharmacy/pickup", icon: User, comingSoon: true, phase: "Phase 9" },
  { label: "Dispensing Desk", href: "/pharmacy/dispensing", icon: CheckCircle2, comingSoon: true, phase: "Phase 9" },
  { label: "Inventory", href: "/pharmacy/inventory", icon: Layers, comingSoon: true, phase: "Phase 9" },
  { label: "Pharmacy Staff", href: "/pharmacy/staff", icon: Users },
  { label: "Pharmacy Settings", href: "/pharmacy/settings", icon: Settings },
];

// 8. Insurance & Claims Desk Navigation
export const INSURANCE_NAV: NavItem[] = [
  { label: "Claims Overview", href: "/insurance", icon: Shield, exact: true },
  { label: "Active Policies", href: "/insurance/policies", icon: FileText, comingSoon: true, phase: "Phase 12" },
  { label: "Incoming Claims", href: "/insurance/claims", icon: ClipboardList, comingSoon: true, phase: "Phase 12" },
  { label: "Pre-Auth Review", href: "/insurance/review", icon: FileSearch, comingSoon: true, phase: "Phase 12" },
  { label: "Approvals & Rejections", href: "/insurance/approvals", icon: CheckCircle2, comingSoon: true, phase: "Phase 12" },
  { label: "Disbursements & Payments", href: "/insurance/payments", icon: CreditCard, comingSoon: true, phase: "Phase 12" },
  { label: "Insurance Settings", href: "/insurance/settings", icon: Settings },
];

// 9. Government Assistance Desk Navigation
export const GOVERNMENT_NAV: NavItem[] = [
  { label: "Assistance Overview", href: "/government", icon: Landmark, exact: true },
  { label: "Assistance Cases", href: "/government/cases", icon: ClipboardList, comingSoon: true, phase: "Phase 12" },
  { label: "Scheme Applications", href: "/government/applications", icon: FileText, comingSoon: true, phase: "Phase 12" },
  { label: "Beneficiaries", href: "/government/beneficiaries", icon: Users, comingSoon: true, phase: "Phase 12" },
  { label: "Subsidy Approvals", href: "/government/approvals", icon: CheckCircle2, comingSoon: true, phase: "Phase 12" },
  { label: "Disbursements", href: "/government/disbursements", icon: CreditCard, comingSoon: true, phase: "Phase 12" },
  { label: "Scheme Settings", href: "/government/settings", icon: Settings },
];

// 10. Healthcare Financing Partner Navigation
export const FINANCE_NAV: NavItem[] = [
  { label: "Financing Overview", href: "/finance", icon: CreditCard, exact: true },
  { label: "Patient Applications", href: "/finance/applications", icon: FileSpreadsheet, comingSoon: true, phase: "Phase 12" },
  { label: "Micro-Financing Plans", href: "/finance/plans", icon: HandHeart, comingSoon: true, phase: "Phase 12" },
  { label: "Multi-Source Splits", href: "/finance/splits", icon: Receipt, comingSoon: true, phase: "Phase 10" },
  { label: "Disbursement Ledger", href: "/finance/ledger", icon: CheckCircle2, comingSoon: true, phase: "Phase 12" },
];

// 11. Ambulance Emergency Dispatch Navigation
export const AMBULANCE_NAV: NavItem[] = [
  { label: "Dispatch Console", href: "/ambulance", icon: Truck, exact: true },
  { label: "Emergency Queue", href: "/ambulance/queue", icon: AlertTriangle, comingSoon: true, phase: "Phase 18" },
  { label: "Available Fleet", href: "/ambulance/fleet", icon: Activity, comingSoon: true, phase: "Phase 18" },
  { label: "Active Trips & Transit", href: "/ambulance/trips", icon: Clock, comingSoon: true, phase: "Phase 18" },
  { label: "Hospital Transfers", href: "/ambulance/transfers", icon: Building2, comingSoon: true, phase: "Phase 18" },
  { label: "Dispatcher Settings", href: "/ambulance/settings", icon: Settings },
];

// 12. Blood Centre Navigation
export const BLOOD_NAV: NavItem[] = [
  { label: "Blood Request Queue", href: "/blood-bank", icon: Droplet, exact: true },
  { label: "Blood Inventory", href: "/blood-bank/inventory", icon: Layers, comingSoon: true, phase: "Phase 14" },
  { label: "Donor Registry", href: "/blood-bank/donors", icon: Users, comingSoon: true, phase: "Phase 14" },
  { label: "Cross-Match Requests", href: "/blood-bank/matching", icon: FlaskConical, comingSoon: true, phase: "Phase 14" },
  { label: "Dispatch Logistics", href: "/blood-bank/dispatch", icon: Truck, comingSoon: true, phase: "Phase 14" },
];

// 13. Healthcare Staff Navigation
export const STAFF_NAV: NavItem[] = [
  { label: "Shift Workspace", href: "/staff", icon: Activity, exact: true },
  { label: "Clinical Handover Tasks", href: "/staff/tasks", icon: ClipboardList, comingSoon: true, phase: "Phase 5" },
  { label: "Assigned Inpatients", href: "/staff/patients", icon: Users, comingSoon: true, phase: "Phase 5" },
  { label: "Staff Profile & ID", href: "/staff/profile", icon: User },
];

// 14. Platform Admin Navigation
export const ADMIN_NAV: NavItem[] = [
  { label: "Governance Overview", href: "/admin", icon: ShieldCheck, exact: true },
  { label: "User Accounts", href: "/admin/users", icon: Users, comingSoon: true, phase: "Phase 5" },
  { label: "Organizations", href: "/admin/organizations", icon: Building2, comingSoon: true, phase: "Phase 5" },
  { label: "Facilities & Branches", href: "/admin/facilities", icon: Layers, comingSoon: true, phase: "Phase 5" },
  { label: "License Verification", href: "/admin/verification", icon: FileCheck, comingSoon: true, phase: "Phase 5" },
  { label: "Immutable Audit Ledger", href: "/admin/audit", icon: ShieldCheck, comingSoon: true, phase: "Phase 11" },
  { label: "Platform Settings", href: "/admin/settings", icon: Settings },
];

export function getNavigationForUser(user: StoredIdentity | null, role: UserRole | null): NavItem[] {
  const workspace = resolveWorkspace(user, role);
  if (!workspace) {
    return [];
  }
  return workspace.navItems;
}

export function getNavigationForRole(role: UserRole): NavItem[] {
  return getNavigationForUser(null, role);
}
