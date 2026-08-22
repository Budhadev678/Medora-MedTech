// ============================================================
// MEDORA — WORKSPACE NAVIGATION ARCHITECTURE
// Server-Authoritative Navigation Links & Route Mapping
// ============================================================

import { 
  Home, 
  Calendar, 
  FileText, 
  FolderOpen,
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
  HeartPulse,
  Globe,
  LucideIcon
} from "lucide-react";
import { UserRole } from "@/lib/constants";
import { StoredIdentity } from "@/lib/data/identity-store";
import type { OrganizationMembership } from "@/types/database.types";

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

// 1. Patient Primary Navigation (5 Canonical Workspaces)
export const PATIENT_PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/patient", icon: Home, exact: true },
  { label: "Appointments", href: "/patient/appointments", icon: Calendar },
  { label: "My Health", href: "/patient/health", icon: HeartPulse, exact: false },
  { label: "Bills & Payments", href: "/patient/billing", icon: Receipt, exact: false },
  { label: "Profile", href: "/patient/profile", icon: User, exact: false },
];

// 2. Patient Secondary Utilities Navigation (Genuinely Secondary Functions)
export const PATIENT_MORE_NAV: NavItem[] = [
  { label: "Notifications", href: "/patient/notifications", icon: Bell, description: "Alerts, clinical updates & reminders" },
  { label: "Help & Support", href: "/patient/help", icon: HelpCircle, description: "Patient guides, FAQs & assistance" },
  { label: "App & Security Settings", href: "/patient/settings", icon: Settings, description: "Notification channels & account security" },
  { label: "Privacy & Consent", href: "/patient/consent", icon: ShieldCheck, description: "Healthcare data sharing & authorization" },
  { label: "Language Settings", href: "/patient/language", icon: Globe, description: "Preferred communication & display language" },
  { label: "About MEDORA", href: "/patient/about", icon: Activity, description: "Transparent connected healthcare ecosystem" },
];

// 3. Doctor Clinical Workspace Navigation
export const DOCTOR_NAV: NavItem[] = [
  { label: "Today / Queue", href: "/doctor", icon: Activity, exact: true },
  { label: "Consultation Suite", href: "/doctor/consultations", icon: Stethoscope },
  { label: "Patient Registry", href: "/doctor/patients", icon: Users },
  { label: "Appointments", href: "/doctor/appointments", icon: Calendar },
  { label: "Prescriptions", href: "/doctor/prescriptions", icon: Pill },
  { label: "Lab Test Orders", href: "/doctor/lab-orders", icon: FlaskConical },
  { label: "Schedule & Hours", href: "/doctor/schedule", icon: Clock },
  { label: "Specialist Referrals", href: "/doctor/referrals", icon: Share2 },
  { label: "Doctor Profile", href: "/doctor/profile", icon: User },
];

// 4. Receptionist Front-Desk Navigation
export const RECEPTION_NAV: NavItem[] = [
  { label: "Today's Queue", href: "/hospital/appointments", icon: Activity, exact: true },
  { label: "Appointments Desk", href: "/hospital/appointments", icon: Calendar },
  { label: "Patient Registration", href: "/hospital/admissions", icon: Users },
  { label: "OPD Billing Desk", href: "/hospital/billing", icon: Receipt },
  { label: "Staff Roster", href: "/hospital/doctors", icon: User },
];

// 5. Hospital Command Center Navigation
export const HOSPITAL_NAV: NavItem[] = [
  { label: "Command Center", href: "/hospital", icon: Building2, exact: true },
  { label: "Operational Encounters", href: "/clinic/encounters", icon: Activity },
  { label: "Medical Staff & Doctors", href: "/hospital/doctors", icon: Stethoscope },
  { label: "Departments", href: "/hospital/departments", icon: Layers },
  { label: "Appointments Desk", href: "/hospital/appointments", icon: Calendar },
  { label: "Bed & Admissions", href: "/hospital/admissions", icon: BedDouble },
  { label: "Hospital Laboratory", href: "/lab", icon: FlaskConical },
  { label: "Hospital Pharmacy", href: "/pharmacy", icon: Pill },
  { label: "Billing & Charges", href: "/hospital/billing", icon: Receipt },
  { label: "Cashier & Payments", href: "/hospital/billing/payments", icon: CreditCard },
  { label: "3-Way Reconciliation", href: "/hospital/finance/reconciliation", icon: Layers },
  { label: "Financial Disputes", href: "/hospital/finance/disputes", icon: HelpCircle },
  { label: "Hospital Audit Logs", href: "/admin/audit", icon: ShieldCheck },
];

// 7. Outpatient Clinic Navigation
export const CLINIC_NAV: NavItem[] = [
  { label: "Clinic Overview", href: "/clinic", icon: Building2, exact: true },
  { label: "Clinic Encounters", href: "/clinic/encounters", icon: Activity },
  { label: "Visiting Doctors", href: "/hospital/doctors", icon: Stethoscope },
  { label: "OPD Appointments", href: "/hospital/appointments", icon: Calendar },
  { label: "OPD Billing & Receipts", href: "/hospital/billing", icon: Receipt },
  { label: "Clinic Members", href: "/hospital/doctors", icon: Users },
];

// 8. Diagnostic Laboratory Navigation
export const LAB_NAV: NavItem[] = [
  { label: "Work Queue", href: "/lab", icon: FlaskConical, exact: true },
  { label: "Test Orders Queue", href: "/lab", icon: ClipboardList },
  { label: "Sample Custody", href: "/lab/samples/SMP-1001", icon: Layers },
  { label: "Diagnostic Testing", href: "/lab", icon: Clock },
  { label: "Pathologist Verification", href: "/lab", icon: FileCheck },
  { label: "Patient Lab Portal", href: "/patient/lab", icon: FileText },
];

// 9. Pharmacy Dispensing Desk Navigation
export const PHARMACY_NAV: NavItem[] = [
  { label: "Prescription Intake Queue", href: "/pharmacy", icon: Pill, exact: true },
  { label: "Inventory & FEFO Batches", href: "/pharmacy/inventory", icon: Layers },
  { label: "Dispense Orders Desk", href: "/pharmacy/orders", icon: Package },
  { label: "Patient Verification OTP", href: "/pharmacy/orders", icon: CheckCircle2 },
  { label: "Patient Pharmacy Portal", href: "/patient/pharmacy", icon: User },
];

// 10. Blood Coordination Navigation
export const BLOOD_NAV: NavItem[] = [
  { label: "Blood Request Queue", href: "/blood-bank", icon: Droplet, exact: true },
  { label: "Blood Inventory", href: "/blood-bank/inventory", icon: Layers, comingSoon: true, phase: "Phase 14" },
  { label: "Donor Registry", href: "/blood-bank/donors", icon: Users, comingSoon: true, phase: "Phase 14" },
  { label: "Cross-Match Requests", href: "/blood-bank/matching", icon: FlaskConical, comingSoon: true, phase: "Phase 14" },
  { label: "Dispatch Logistics", href: "/blood-bank/dispatch", icon: Building2, comingSoon: true, phase: "Phase 14" },
];

// 11. Platform Administration Navigation
export const ADMIN_NAV: NavItem[] = [
  { label: "Governance Overview", href: "/admin", icon: ShieldCheck, exact: true },
  { label: "Organizations", href: "/admin/organizations", icon: Building2 },
  { label: "Facilities & Branches", href: "/admin/facilities", icon: Layers },
  { label: "User Identity Registry", href: "/admin/users", icon: Users },
  { label: "License Verification", href: "/admin/verification", icon: FileCheck },
  { label: "Immutable Audit Ledger", href: "/admin/audit", icon: ShieldCheck },
];
