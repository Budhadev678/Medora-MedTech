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
    organization: "Registered Patient A (Bhubaneswar)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    description: "Patient A — Outpatient consultations, verified digital prescriptions, and lab history.",
  },
  {
    id: "pat-1002",
    name: "Priya Sharma",
    email: "priya@medora.health",
    role: "patient",
    identifier: "PAT-1002",
    organization: "Registered Patient B (Cuttack)",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    description: "Patient B — Independent medical identity with zero cross-account data leakage.",
  },
  {
    id: "pat-1003",
    name: "Amit Das",
    email: "amit@medora.health",
    role: "patient",
    identifier: "PAT-1003",
    organization: "Registered Patient C (Puri)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    description: "Patient C — Isolated health records and chronic care profile.",
  },
  {
    id: "doc-1001",
    name: "Dr. Ananya Sharma",
    email: "doctor@medora.health",
    role: "doctor",
    identifier: "DOC-1001",
    organization: "City Hospital & Green Care Hospital (Cardiologist)",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    description: "Doctor A — Practicing across multiple hospitals & clinics under one unified doctor identity.",
  },
  {
    id: "hosp-1001",
    name: "City Hospital",
    email: "hospital@medora.health",
    role: "hospital_admin",
    identifier: "HSP-1001",
    organization: "City Hospital Command Center",
    avatar: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=150&auto=format&fit=crop&q=80",
    description: "Hospital — Multispeciality hospital facility & clinical operations hub.",
  },
  {
    id: "cln-1001",
    name: "Green Care Clinic",
    email: "clinic@medora.health",
    role: "hospital_admin",
    identifier: "CLN-1001",
    organization: "Green Care Outpatient Clinic",
    avatar: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=150&auto=format&fit=crop&q=80",
    description: "Clinic — Outpatient specialist clinic with visiting doctor privileges.",
  },
  {
    id: "lab-1001",
    name: "ABC Diagnostics",
    email: "lab@medora.health",
    role: "lab_staff",
    identifier: "LAB-1001",
    organization: "ABC Diagnostics & Pathology Lab",
    avatar: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=150&auto=format&fit=crop&q=80",
    description: "Laboratory — Diagnostic testing, sample intake, and verified digital lab reports.",
  },
  {
    id: "pharm-1001",
    name: "ABC Pharmacy",
    email: "pharmacy@medora.health",
    role: "pharmacy_staff",
    identifier: "PHA-1001",
    organization: "ABC Pharmacy & Dispensing Desk",
    avatar: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=150&auto=format&fit=crop&q=80",
    description: "Pharmacy — Prescription verification & medication pickup fulfillment.",
  },
  {
    id: "blc-1001",
    name: "City Blood Centre",
    email: "bloodbank@medora.health",
    role: "blood_staff",
    identifier: "BLC-1001",
    organization: "City Blood Centre & Donor Network",
    avatar: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=150&auto=format&fit=crop&q=80",
    description: "Blood Centre — Emergency cross-matching, donor coordination, and inventory.",
  },
  {
    id: "ins-1001",
    name: "ABC Insurance",
    email: "insurance@medora.health",
    role: "insurance_staff",
    identifier: "INS-1001",
    organization: "ABC Health Insurance Corporation",
    avatar: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop&q=80",
    description: "Insurance — Policy verification, pre-authorization, and transparent claims settlement.",
  },
  {
    id: "fin-1001",
    name: "Healthcare Finance Partner",
    email: "finance@medora.health",
    role: "finance_staff",
    identifier: "FIN-1001",
    organization: "CarePay Healthcare Financing",
    avatar: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=150&auto=format&fit=crop&q=80",
    description: "Financing Partner — Patient treatment micro-financing and transparent cost splitting.",
  },
  {
    id: "gov-1001",
    name: "Government Assistance Org",
    email: "government@medora.health",
    role: "government_staff",
    identifier: "GOV-1001",
    organization: "Swasthya Assistance Directorate",
    avatar: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=150&auto=format&fit=crop&q=80",
    description: "Government — State & National healthcare scheme subsidy coordination.",
  },
  {
    id: "amb-1001",
    name: "ABC Ambulance Services",
    email: "ambulance@medora.health",
    role: "ambulance_staff",
    identifier: "AMB-1001",
    organization: "FastTrack Emergency Transit",
    avatar: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=150&auto=format&fit=crop&q=80",
    description: "Ambulance Provider — Emergency patient transport and hospital pre-alert.",
  },
  {
    id: "staff-1001",
    name: "Healthcare Staff Member",
    email: "staff@medora.health",
    role: "staff",
    identifier: "STAFF-1001",
    organization: "City Hospital (Head Nurse / Clinical Staff)",
    avatar: "https://images.unsplash.com/photo-1594824813589-389f41dfd164?w=150&auto=format&fit=crop&q=80",
    description: "Staff — Healthcare clinical staff with organization membership.",
  },
  {
    id: "admin-1001",
    name: "Medora Admin",
    email: "admin@medora.health",
    role: "admin",
    identifier: "ADM-1001",
    organization: "MEDORA National Healthcare Registry",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    description: "Platform Admin — Ecosystem governance, facility verification, and immutable audit stream.",
  },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  patient: "Patient Portal",
  doctor: "Doctor Clinical Workspace",
  hospital_admin: "Hospital Operations Desk",
  lab_staff: "Laboratory Diagnostic Workbench",
  pharmacy_staff: "Pharmacy Dispensing Desk",
  emergency_staff: "Emergency Trauma Unit",
  blood_staff: "Blood Coordination Desk",
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
  emergency_staff: "/ambulance",
  blood_staff: "/blood-bank",
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
  { name: "Blood Centre", href: "/blood-bank", role: "blood_staff" },
  { name: "Government Desk", href: "/government", role: "government_staff" },
  { name: "Healthcare Finance", href: "/finance", role: "finance_staff" },
  { name: "Insurance Portal", href: "/insurance", role: "insurance_staff" },
  { name: "Staff Workspace", href: "/staff", role: "staff" },
  { name: "Platform Admin", href: "/admin", role: "admin" },
];
