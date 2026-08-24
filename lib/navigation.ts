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
  { label: "Appointments", href: "/patient/appointments", icon: Calendar },
  { label: "My Health", href: "/patient/health", icon: HeartPulse },
  { label: "Bills & Payments", href: "/patient/billing", icon: Receipt },
  { label: "Profile", href: "/patient/profile", icon: User },
];

// 2. Patient Secondary / Utilities Navigation
export const PATIENT_MORE_NAV: NavItem[] = [
  { label: "Financial Support", href: "/patient/financial-support", icon: Landmark, description: "Insurance, government health schemes & relief aid" },
  { label: "Notifications", href: "/patient/notifications", icon: Bell, description: "Alerts, clinical updates & reminders" },
  { label: "Help & Support", href: "/patient/help", icon: HelpCircle, description: "Patient guides, FAQs & assistance" },
  { label: "Settings", href: "/patient/settings", icon: Settings, description: "Notification channels & account security" },
  { label: "Privacy & Consent", href: "/patient/consent", icon: ShieldCheck, description: "Healthcare data sharing & authorization" },
  { label: "Language", href: "/patient/language", icon: Globe, description: "Preferred communication & display language" },
  { label: "About MEDORA", href: "/patient/about", icon: Activity, description: "Connected healthcare ecosystem" },
];

// 3. Patient Action Hub Navigation
export const PATIENT_ACTION_NAV: NavItem[] = [
  { label: "Book Appointment", href: "/patient/appointments/book", icon: Calendar },
  { label: "Find Specialist", href: "/patient/care", icon: Stethoscope },
  { label: "Emergency Assist", href: "/patient/emergency", icon: AlertTriangle },
  { label: "Financial Support", href: "/patient/financial-support", icon: Landmark },
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

// 5. Hospital Control Center Navigation (Step 1 of 5 Canonical Hierarchy)
export const HOSPITAL_NAV: NavItem[] = [
  // CONTROL
  { label: "Control Center", href: "/hospital", icon: Building2, exact: true, section: "CONTROL" },

  // OPERATIONS
  { label: "Patients", href: "/hospital/patients", icon: Users, section: "OPERATIONS" },
  { label: "Appointments / Arrival", href: "/hospital/appointments", icon: Calendar, section: "OPERATIONS" },
  { label: "Emergency", href: "/hospital/emergency", icon: AlertTriangle, section: "OPERATIONS" },
  { label: "Admissions", href: "/hospital/admissions", icon: BedDouble, section: "OPERATIONS" },
  { label: "Discharge", href: "/hospital/discharge", icon: CheckCircle2, section: "OPERATIONS" },

  // FINANCE
  { label: "Billing", href: "/hospital/billing", icon: Receipt, section: "FINANCE" },
  { label: "Transactions", href: "/hospital/billing/payments", icon: CreditCard, section: "FINANCE" },
  { label: "Disputes", href: "/hospital/finance/disputes", icon: Shield, section: "FINANCE" },

  // OVERSIGHT
  { label: "Audit", href: "/admin/audit", icon: ShieldCheck, section: "OVERSIGHT" },
  { label: "Reports / Activity", href: "/hospital/activity", icon: Activity, section: "OVERSIGHT" },

  // INTEGRATIONS
  { label: "Doctors", href: "/hospital/doctors", icon: Stethoscope, section: "INTEGRATIONS" },
  { label: "Pharmacy", href: "/pharmacy", icon: Pill, section: "INTEGRATIONS" },
  { label: "Laboratory", href: "/lab", icon: FlaskConical, section: "INTEGRATIONS" },
  { label: "Blood Centre", href: "/hospital/blood-centre", icon: Droplet, section: "INTEGRATIONS" },

  // SYSTEM
  { label: "Hospital Settings", href: "/hospital/settings", icon: Settings, section: "SYSTEM" },
  { label: "Staff / Roles", href: "/hospital/staff", icon: User, section: "SYSTEM" },
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

// 8. Pharmacy Operations Navigation (9 Canonical Modules)
export const PHARMACY_NAV: NavItem[] = [
  // OPERATIONS
  { label: "Pharmacy Work Queue", href: "/pharmacy", icon: Pill, exact: true, section: "OPERATIONS" },
  { label: "Prescriptions Queue", href: "/pharmacy/prescriptions", icon: ClipboardList, section: "OPERATIONS" },
  { label: "Orders", href: "/pharmacy/orders", icon: Package, section: "OPERATIONS" },

  // FULFILLMENT
  { label: "Preparation", href: "/pharmacy/preparation", icon: Clock, section: "FULFILLMENT" },
  { label: "Patient Pickup", href: "/pharmacy/pickup", icon: User, section: "FULFILLMENT" },
  { label: "Dispensing Desk", href: "/pharmacy/dispensing", icon: CheckCircle2, section: "FULFILLMENT" },

  // MANAGEMENT
  { label: "Inventory", href: "/pharmacy/inventory", icon: Layers, section: "MANAGEMENT" },
  { label: "Pharmacy Staff", href: "/pharmacy/staff", icon: Users, section: "MANAGEMENT" },
  { label: "Pharmacy Settings", href: "/pharmacy/settings", icon: Settings, section: "MANAGEMENT" },
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

