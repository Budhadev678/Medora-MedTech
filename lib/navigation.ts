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

// 1. Patient Primary Bottom Navigation (4 Core Mobile Tabs)
export const PATIENT_PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/patient", icon: Home, exact: true },
  { label: "Appointments", href: "/patient/appointments", icon: Calendar },
  { label: "Health", href: "/patient/health", icon: Activity, exact: false },
];

// 2. Patient "More" Navigation Drawer (Comprehensive Patient Services)
export const PATIENT_MORE_NAV: NavItem[] = [
  { label: "Health Timeline", href: "/patient/health", icon: Activity, description: "Chronological medical history & care timeline" },
  { label: "Medical Documents Vault", href: "/patient/documents", icon: FolderOpen, description: "Certified clinical documents & patient uploads" },
  { label: "Digital Prescriptions", href: "/patient/pharmacy", icon: Pill, description: "Verified e-prescriptions & pickup status" },
  { label: "Diagnostic Lab Reports", href: "/patient/lab", icon: FlaskConical, description: "Pathology & diagnostic test results" },
  { label: "Itemized Hospital Bills", href: "/patient/billing", icon: Receipt, description: "Transparent breakdown & 'Why Was I Charged?'" },
  { label: "Insurance & Benefits", href: "/patient/billing", icon: Shield, description: "Policy coverage, pre-auth & verified claims" },
  { label: "Government Schemes", href: "/patient/billing", icon: Landmark, description: "BSKY, PM-JAY & subsidy assistance status" },
  { label: "Financial Support & Receipts", href: "/patient/billing/payments", icon: CreditCard, description: "Payment receipts & transaction history" },
  { label: "Billing Disputes & Questions", href: "/patient/billing/disputes", icon: HelpCircle, description: "File billing inquiries with full evidence tracking" },
  { label: "Health Passport & Profile", href: "/patient/profile", icon: User, description: "Demographics, emergency QR & ABHA link" },
  { label: "Emergency & SOS", href: "/patient/emergency", icon: AlertTriangle, description: "Emergency hospital contacts & break-glass pathway" },
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
