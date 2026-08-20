export type UserRole =
  | "patient"
  | "doctor"
  | "hospital_admin"
  | "lab_staff"
  | "pharmacy_staff"
  | "emergency_staff"
  | "blood_staff"
  | "finance_staff"
  | "admin";

export interface DemoPersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  identifier: string;
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
    identifier: "MED-PAT-1001",
    organization: "Registered Patient",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    description: "Outpatient booking consultation, lab tests, and managing itemized transparent bills.",
  },
  {
    id: "doc-1001",
    name: "Dr. Rajesh Sharma",
    email: "doctor@medora.health",
    role: "doctor",
    identifier: "MED-DOC-1001",
    organization: "Cardiology Dept • Apex Multispeciality",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    description: "Chief of Cardiology diagnosing patients, building structured prescriptions & test orders.",
  },
  {
    id: "hosp-1001",
    name: "Apex Multispeciality Hospital",
    email: "admin@apex.health",
    role: "hospital_admin",
    identifier: "MED-HOSP-1001",
    organization: "Hospital Command & Operations",
    avatar: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=150&auto=format&fit=crop&q=80",
    description: "Hospital administration tracking beds, doctor rosters, admissions, and audit logs.",
  },
  {
    id: "lab-1001",
    name: "Apex Central Pathology Lab",
    email: "lab@medora.health",
    role: "lab_staff",
    identifier: "MED-LAB-1001",
    organization: "Diagnostics & Pathology Lab",
    avatar: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=150&auto=format&fit=crop&q=80",
    description: "Pathology team collecting samples, testing values, and issuing approved digital reports.",
  },
  {
    id: "pharm-1001",
    name: "Apex Hospital Pharmacy",
    email: "pharmacy@medora.health",
    role: "pharmacy_staff",
    identifier: "MED-PHARM-1001",
    organization: "In-Hospital Pharmacy Desk",
    avatar: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=150&auto=format&fit=crop&q=80",
    description: "Pharmacist queue preparing medications and verifying patient Medora ID upon physical pickup.",
  },
  {
    id: "emerg-1001",
    name: "Apex Emergency & Trauma Care",
    email: "emergency@medora.health",
    role: "emergency_staff",
    identifier: "MED-EMERG-1001",
    organization: "Emergency Triage Desk",
    avatar: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=150&auto=format&fit=crop&q=80",
    description: "Emergency triage team assigning priority tags, checking doctor availability, and escalating.",
  },
  {
    id: "blood-1001",
    name: "RedCross Blood Center",
    email: "bloodbank@medora.health",
    role: "blood_staff",
    identifier: "MED-BLOOD-1001",
    organization: "Blood Bank & Donor Coordinator",
    avatar: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=150&auto=format&fit=crop&q=80",
    description: "Coordinating urgent blood group matching, donor notifications, and fulfillment.",
  },
  {
    id: "fin-1001",
    name: "Apex Billing & Insurance Desk",
    email: "billing@medora.health",
    role: "finance_staff",
    identifier: "MED-FIN-1001",
    organization: "Finance & Claims Desk",
    avatar: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=150&auto=format&fit=crop&q=80",
    description: "Managing itemized bills, 'Why was I charged?' lineage, insurance splits, and disputes.",
  },
  {
    id: "admin-1001",
    name: "System SuperAdmin",
    email: "admin@medora.health",
    role: "admin",
    identifier: "MED-SYS-ADMIN",
    organization: "MEDORA Platform Governance",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    description: "Full system audit log explorer, platform configuration, and role authorization matrix.",
  },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  patient: "Patient",
  doctor: "Doctor / Specialist",
  hospital_admin: "Hospital Admin",
  lab_staff: "Diagnostic Lab Staff",
  pharmacy_staff: "Hospital Pharmacist",
  emergency_staff: "Emergency Care Lead",
  blood_staff: "Blood Bank Coordinator",
  finance_staff: "Billing & Claims Officer",
  admin: "System Administrator",
};

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  patient: "/patient",
  doctor: "/doctor",
  hospital_admin: "/hospital",
  lab_staff: "/lab",
  pharmacy_staff: "/pharmacy",
  emergency_staff: "/emergency",
  blood_staff: "/blood-bank",
  finance_staff: "/finance",
  admin: "/admin",
};
