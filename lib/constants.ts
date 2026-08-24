// ============================================================
// MEDORA — PLATFORM CONSTANTS & CONFIGURATION
// ============================================================

export type UserRole =
  | "patient"
  | "doctor"
  | "hospital_admin"
  | "lab_staff"
  | "pharmacy_staff"
  | "emergency_staff"
  | "blood_staff"
  | "finance_staff"
  | "insurance_staff"
  | "government_staff"
  | "ambulance_staff"
  | "staff"
  | "admin";

export interface DemoPersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  identifier: string; // e.g. PAT-1001, DOC-1001, HSP-1001, CLN-1001, LAB-1001, etc.
  organization: string;
  avatar: string;
  description: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "pat-1001",
    name: "Rahul Verma",
    email: "patient@medora.health",
    role: "patient",
    identifier: "PAT-1001",
    organization: "Sovereign Patient Account (Bhubaneswar)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    description: "Patient A — Mobile health journey, ABHA linked passport, verified e-prescriptions, and diagnostic records.",
  },
  {
    id: "pat-1002",
    name: "Priya Sharma",
    email: "priya@medora.health",
    role: "patient",
    identifier: "PAT-1002",
    organization: "Sovereign Patient Account (Cuttack)",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    description: "Patient B — Independent medical profile with 100% cross-account zero data leakage isolation.",
  },
  {
    id: "doc-1001",
    name: "Dr. Ananya Sharma",
    email: "doctor@medora.health",
    role: "doctor",
    identifier: "DOC-1001",
    organization: "City Hospital & Green Care Clinic (Cardiology)",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    description: "Multi-Facility Doctor — Practicing across hospitals and outpatient clinics with unified clinical examination pad.",
  },
  {
    id: "hosp-1001",
    name: "City Hospital",
    email: "admin@cityhospital.org",
    role: "hospital_admin",
    identifier: "HSP-1001",
    organization: "Multispeciality Hospital Operations Hub",
    avatar: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=150&auto=format&fit=crop&q=80",
    description: "Hospital Command — Operations command center, bed admissions, departments, and medical staff roster.",
  },
  {
    id: "cln-1001",
    name: "Green Care Clinic",
    email: "clinic@medora.health",
    role: "hospital_admin",
    identifier: "CLN-1001",
    organization: "Day-Care Outpatient Specialist Clinic",
    avatar: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=150&auto=format&fit=crop&q=80",
    description: "Outpatient Clinic — Day-care consultations, OPD token queue, visiting physicians, and clinic receipts.",
  },
  {
    id: "lab-1001",
    name: "ABC Diagnostics",
    email: "lab@medora.health",
    role: "lab_staff",
    identifier: "LAB-1001",
    organization: "Central Pathology & Diagnostic Lab",
    avatar: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=150&auto=format&fit=crop&q=80",
    description: "Laboratory — Diagnostic test work queue, barcode sample intake, and pathologist-certified reports.",
  },
  {
    id: "pharm-1001",
    name: "ABC Pharmacy",
    email: "pharmacy@medora.health",
    role: "pharmacy_staff",
    identifier: "PHA-1001",
    organization: "Connected Dispensing & Medication Desk",
    avatar: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=150&auto=format&fit=crop&q=80",
    description: "Pharmacy Desk — Digital prescription verification, order preparation, patient pickup, and dispensing.",
  },
  {
    id: "blc-1001",
    name: "City Blood Centre",
    email: "bloodbank@medora.health",
    role: "blood_staff",
    identifier: "BLC-1001",
    organization: "Hospital Blood Centre & Transfusion Unit",
    avatar: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=150&auto=format&fit=crop&q=80",
    description: "Blood Coordination — Real-time blood unit inventory, donor registry, cross-matching, and dispatch.",
  },
  {
    id: "admin-1001",
    name: "Medora Platform Admin",
    email: "admin@medora.health",
    role: "admin",
    identifier: "ADM-1001",
    organization: "Medora Ecosystem Governance Desk",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    description: "Platform Admin — Ecosystem governance, facility verification, role security, and immutable audit ledger.",
  },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  patient: "Patient Portal",
  doctor: "Doctor Clinical Workspace",
  hospital_admin: "Hospital Operations Desk",
  lab_staff: "Laboratory Diagnostic Workbench",
  pharmacy_staff: "Pharmacy Dispensing Desk",
  emergency_staff: "Emergency Trauma Unit",
  blood_staff: "Hospital Blood Centre",
  finance_staff: "Healthcare Financing Workspace",
  insurance_staff: "Insurance Claims & Pre-Auth",
  government_staff: "Government Assistance Desk",
  ambulance_staff: "Emergency Dispatch Console",
  staff: "Healthcare Staff Duty Desk",
  admin: "Medora Platform Governance",
};

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  patient: "/patient",
  doctor: "/doctor",
  hospital_admin: "/hospital",
  lab_staff: "/lab",
  pharmacy_staff: "/pharmacy",
  emergency_staff: "/emergency",
  blood_staff: "/hospital/blood-centre",
  finance_staff: "/finance",
  insurance_staff: "/insurance",
  government_staff: "/government",
  ambulance_staff: "/ambulance",
  staff: "/staff",
  admin: "/admin",
};

export const NAVIGATION_LINKS = [
  { name: "Patient Portal", href: "/patient", role: "patient" },
  { name: "Doctor Workspace", href: "/doctor", role: "doctor" },
  { name: "Hospital Command", href: "/hospital", role: "hospital_admin" },
  { name: "Outpatient Clinic", href: "/clinic", role: "hospital_admin" },
  { name: "Diagnostic Lab", href: "/lab", role: "lab_staff" },
  { name: "Pharmacy Desk", href: "/pharmacy", role: "pharmacy_staff" },
  { name: "Emergency Dispatch", href: "/ambulance", role: "ambulance_staff" },
  { name: "Blood Centre", href: "/hospital/blood-centre", role: "blood_staff" },
  { name: "Government Desk", href: "/government", role: "government_staff" },
  { name: "Healthcare Finance", href: "/finance", role: "finance_staff" },
  { name: "Insurance Portal", href: "/insurance", role: "insurance_staff" },
  { name: "Staff Workspace", href: "/staff", role: "staff" },
  { name: "Platform Admin", href: "/admin", role: "admin" },
];
