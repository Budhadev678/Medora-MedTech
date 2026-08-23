// ============================================================
// MEDORA â€” WORKSPACE NAVIGATION ARCHITECTURE
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
  section?: string;
}

// 1. Patient Primary Navigation (5 Canonical Workspaces)
export const PATIENT_PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/patient", icon: Home, exact: true },
  { label: "Find Care", href: "/patient/care", icon: Stethoscope },
  { label: "Appointments", href: "/patient/appointments", icon: Calendar },
  { label: "My Health", href: "/patient/health", icon: Activity },
  { label: "Bills & Payments", href: "/patient/billing", icon: Receipt },
];

// 2. Patient Action Hub Navigation
export const PATIENT_ACTION_NAV: NavItem[] = [
  { label: "Book Appointment", href: "/patient/appointments/book", icon: Calendar },
  { label: "Find Specialist", href: "/patient/care", icon: Stethoscope },
  { label: "Emergency Assist", href: "/patient/emergency", icon: AlertTriangle },
  { label: "Medical Timeline", href: "/patient/health", icon: Activity },
  { label: "Digital Prescriptions", href: "/patient/health", icon: Pill },
  { label: "Diagnostic Lab Reports", href: "/patient/health", icon: FlaskConical },
  { label: "Billing & Receipts", href: "/patient/billing", icon: Receipt },
  { label: "Notification Center", href: "/patient/notifications", icon: Bell },
  { label: "Patient Profile", href: "/patient/profile", icon: User },
];

// 3. Doctor Clinical Workspace Navigation (Grouped into 4 Canonical Sections)
export const DOCTOR_NAV: NavItem[] = [
  // CLINICAL WORK
  { label: "Today / Queue", href: "/doctor", icon: Activity, exact: true, section: "CLINICAL WORK" },
  { label: "Consultation Suite", href: "/doctor/consultations", icon: Stethoscope, section: "CLINICAL WORK" },
  { label: "Patient Registry", href: "/doctor/patients", icon: Users, section: "CLINICAL WORK" },

  // OPERATIONS
  { label: "Appointments", href: "/doctor/appointments", icon: Calendar, section: "OPERATIONS" },
  { label: "Schedule & Hours", href: "/doctor/schedule", icon: Clock, section: "OPERATIONS" },

  // CLINICAL OUTPUTS
  { label: "Prescriptions", href: "/doctor/prescriptions", icon: Pill, section: "CLINICAL OUTPUTS" },
  { label: "Lab Test Orders", href: "/doctor/lab-orders", icon: FlaskConical, section: "CLINICAL OUTPUTS" },
  { label: "Specialist Referrals", href: "/doctor/referrals", icon: Share2, section: "CLINICAL OUTPUTS" },

  // ACCOUNT
  { label: "Doctor Profile", href: "/doctor/profile", icon: User, section: "ACCOUNT" },
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
  { label: "Revenue & Billing", href: "/hospital/billing", icon: Receipt },
  { label: "Compliance & Security", href: "/admin/telemetry", icon: ShieldCheck },
];

// 6. Clinic Operations Navigation
export const CLINIC_NAV: NavItem[] = [
  { label: "Front Desk & Queue", href: "/clinic", icon: Building2, exact: true },
  { label: "Appointments", href: "/clinic/appointments", icon: Calendar },
  { label: "Clinical Encounters", href: "/clinic/encounters", icon: Stethoscope },
  { label: "Billing & Invoicing", href: "/clinic/billing", icon: Receipt },
  { label: "Practitioners", href: "/clinic/doctors", icon: User },
];

// 7. Laboratory Workbench Navigation
export const LAB_NAV: NavItem[] = [
  { label: "Active Orders Queue", href: "/lab", icon: FlaskConical, exact: true },
  { label: "Sample Accessioning", href: "/lab", icon: Layers },
  { label: "Verified Test Reports", href: "/lab", icon: FileCheck },
  { label: "Diagnostic Catalog", href: "/lab", icon: Package },
];

// 8. Pharmacy Operations Navigation
export const PHARMACY_NAV: NavItem[] = [
  { label: "Prescription Queue", href: "/pharmacy", icon: Pill, exact: true },
  { label: "Dispensing Desk", href: "/pharmacy", icon: CheckCircle2 },
  { label: "Drug Inventory (FEFO)", href: "/pharmacy/inventory", icon: Package },
  { label: "Batch Master & Expiry", href: "/pharmacy/inventory", icon: Clock },
];

// 9. Blood Coordination Navigation
export const BLOOD_NAV: NavItem[] = [
  { label: "Blood Stock Dashboard", href: "/blood-bank", icon: Droplet, exact: true },
  { label: "Compatible Crossmatch", href: "/blood-bank", icon: HeartPulse },
  { label: "Donation Camp Drive", href: "/blood-bank", icon: Calendar },
  { label: "Emergency Dispatch", href: "/blood-bank", icon: Truck },
];

// 10. Platform Administration Navigation
export const ADMIN_NAV: NavItem[] = [
  { label: "Global Telemetry", href: "/admin", icon: Activity, exact: true },
  { label: "Verified Registry", href: "/admin/users", icon: Users },
  { label: "Healthcare Facilities", href: "/admin/facilities", icon: Building2 },
  { label: "Identity & Roles", href: "/admin/users", icon: ShieldCheck },
  { label: "Tamper-Evident Ledger", href: "/admin/telemetry", icon: Shield },
];
export const PATIENT_MORE_NAV: NavItem[] = PATIENT_ACTION_NAV;
