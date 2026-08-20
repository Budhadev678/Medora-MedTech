// ============================================================
// MEDORA — PERSISTENT IDENTITY & RELATIONSHIP STORE
// PHASE 1: COMPLETE ECOSYSTEM IDENTITY & MULTI-ORGANIZATION BASE
// ============================================================

import type { UserRole, AccountStatus, VerificationStatus, OrganizationType } from "@/types/database.types";

export type AffiliationStatus = "active" | "pending" | "rejected" | "suspended" | "ended";

export interface StoredDoctorAffiliation {
  id?: string;
  organizationId: string;
  organizationName: string;
  organizationIdentifier?: string; // e.g. HSP-1001, HSP-1002, CLN-1001
  facilityId?: string;
  facilityName?: string;
  departmentName?: string;
  roleTitle: string; // e.g. "Consultant Cardiologist", "Visiting Specialist"
  employmentType?: "full_time" | "part_time" | "consultant" | "visiting" | "contract";
  consultationFee: number;
  opdRoom?: string;
  scheduleNotes?: string;
  startDate?: string;
  endDate?: string;
  status: AffiliationStatus;
  verificationStatus: VerificationStatus;
}

export interface StoredStaffMembership {
  id?: string;
  organizationId: string;
  organizationName: string;
  organizationIdentifier?: string;
  facilityId?: string;
  facilityName?: string;
  departmentName?: string;
  roleTitle: string; // e.g. "Head Nurse", "Chief Pharmacist"
  status: AccountStatus;
  verificationStatus: VerificationStatus;
}

export interface StoredFacility {
  id: string;
  organizationId: string;
  facilityCode: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  emergencyPhone?: string;
  status: AccountStatus;
  verificationStatus: VerificationStatus;
}

export interface StoredPatientData {
  dob: string;
  gender: "male" | "female" | "other";
  bloodGroup: string;
  bloodGroupSource?: "patient_reported" | "clinical_verified";
  bloodGroupVerifiedBy?: string;
  aadhaarMasked?: string;
  abhaId?: string;
  abhaNumber?: string;
  abhaAddress?: string;
  abhaStatus?: "NOT_LINKED" | "VERIFICATION_PENDING" | "VERIFIED" | "LINKED" | "LINK_FAILED" | "IDENTITY_MISMATCH" | "ALREADY_LINKED" | "UNLINKED";
  abhaLinkedAt?: string;
  allergies: string[];
  chronicConditions: string[];
  address?: {
    line1: string;
    line2?: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relation?: string;
    altPhone?: string;
    isPrimary?: boolean;
  };
  preferredLanguage?: "en" | "hi" | "or";
}

export interface StoredDoctorData {
  medicalRegNo: string;
  medicalCouncil: string;
  specialization: string;
  qualifications: string;
  experienceYears: number;
  affiliations: StoredDoctorAffiliation[];
}

export interface StoredIdentity {
  id: string; // UUID primary key
  email: string;
  passwordHash: string; // Default 'Password@123'
  fullName: string;
  role: UserRole;
  identifier: string; // Human-readable e.g. PAT-1001, DOC-1001, HSP-1001
  phone?: string;
  accountStatus: AccountStatus;
  verificationStatus: VerificationStatus;
  organizationName?: string;
  organizationType?: OrganizationType;
  createdAt: string;
  avatarUrl?: string;
  // Role-specific payload
  patientData?: StoredPatientData;
  doctorData?: StoredDoctorData;
  staffData?: StoredStaffMembership[];
}

export const SEEDED_FACILITIES: StoredFacility[] = [
  {
    id: "fac-1001-bbsr",
    organizationId: "11111111-1111-1111-1111-111111111101",
    facilityCode: "HSP-1001-BBSR",
    name: "City Hospital — Bhubaneswar Main Hub",
    city: "Bhubaneswar",
    address: "MG Road, Central District",
    phone: "+91 674 2550100",
    emergencyPhone: "112",
    status: "active",
    verificationStatus: "verified",
  },
  {
    id: "fac-1001-rou",
    organizationId: "11111111-1111-1111-1111-111111111101",
    facilityCode: "HSP-1001-ROU",
    name: "City Hospital — Rourkela Branch",
    city: "Rourkela",
    address: "Civil Township, Sector 2",
    phone: "+91 661 2500100",
    emergencyPhone: "112",
    status: "active",
    verificationStatus: "verified",
  },
  {
    id: "fac-1001-ctc",
    organizationId: "11111111-1111-1111-1111-111111111101",
    facilityCode: "HSP-1001-CTC",
    name: "City Hospital — Cuttack Specialty Center",
    city: "Cuttack",
    address: "Ring Road, Cantonment",
    phone: "+91 671 2300100",
    emergencyPhone: "112",
    status: "active",
    verificationStatus: "verified",
  },
];

export const SEEDED_IDENTITIES: StoredIdentity[] = [
  // 1. Patient A: Rahul Verma (ABHA Linked)
  {
    id: "a0000001-0000-0000-0000-000000000001",
    email: "patient@medora.health",
    passwordHash: "Password@123",
    fullName: "Rahul Verma",
    role: "patient",
    identifier: "PAT-1001",
    phone: "+91 98765 43210",
    accountStatus: "active",
    verificationStatus: "verified",
    createdAt: "2026-01-15T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    patientData: {
      dob: "1995-05-14",
      gender: "male",
      bloodGroup: "O+",
      bloodGroupSource: "patient_reported",
      aadhaarMasked: "XXXX XXXX 5892",
      abhaId: "rahulverma@abdm",
      abhaNumber: "91-4589-2041-5892",
      abhaAddress: "rahulverma@abdm",
      abhaStatus: "LINKED",
      abhaLinkedAt: "2026-01-20T10:30:00Z",
      allergies: ["Penicillin", "Peanuts"],
      chronicConditions: ["Mild Hypertension"],
      address: {
        line1: "Plot 42, Saheed Nagar",
        line2: "Near High School",
        city: "Bhubaneswar",
        district: "Khordha",
        state: "Odisha",
        pincode: "751007",
        country: "India",
      },
      emergencyContact: {
        name: "Anita Verma",
        phone: "+91 98765 43210",
        relation: "Mother",
        altPhone: "+91 98765 43211",
        isPrimary: true,
      },
      preferredLanguage: "en",
    },
  },
  // 2. Patient B: Priya Sharma (ABHA Unlinked - Ready for Linking)
  {
    id: "a0000001-0000-0000-0000-000000000002",
    email: "priya@medora.health",
    passwordHash: "Password@123",
    fullName: "Priya Sharma",
    role: "patient",
    identifier: "PAT-1002",
    phone: "+91 91234 56780",
    accountStatus: "active",
    verificationStatus: "verified",
    createdAt: "2026-02-10T11:30:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    patientData: {
      dob: "1998-09-22",
      gender: "female",
      bloodGroup: "B+",
      bloodGroupSource: "clinical_verified",
      bloodGroupVerifiedBy: "City Hospital Pathology Lab",
      aadhaarMasked: "XXXX XXXX 8821",
      abhaStatus: "NOT_LINKED",
      allergies: ["Sulfa drugs"],
      chronicConditions: ["Asthma"],
      address: {
        line1: "House 12, Cantonment Road",
        city: "Cuttack",
        district: "Cuttack",
        state: "Odisha",
        pincode: "753001",
        country: "India",
      },
      emergencyContact: {
        name: "Rohan Sharma",
        phone: "+91 91234 56781",
        relation: "Brother",
        isPrimary: true,
      },
      preferredLanguage: "or",
    },
  },
  // 3. Patient C: Amit Das (ABHA Unlinked)
  {
    id: "a0000001-0000-0000-0000-000000000003",
    email: "amit@medora.health",
    passwordHash: "Password@123",
    fullName: "Amit Das",
    role: "patient",
    identifier: "PAT-1003",
    phone: "+91 99887 76655",
    accountStatus: "active",
    verificationStatus: "verified",
    createdAt: "2026-03-05T14:15:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    patientData: {
      dob: "1982-12-03",
      gender: "male",
      bloodGroup: "A+",
      bloodGroupSource: "patient_reported",
      aadhaarMasked: "XXXX XXXX 3319",
      abhaStatus: "NOT_LINKED",
      allergies: [],
      chronicConditions: ["Type 2 Diabetes"],
      address: {
        line1: "Marine Drive, Sea Beach Road",
        city: "Puri",
        district: "Puri",
        state: "Odisha",
        pincode: "752001",
        country: "India",
      },
      emergencyContact: {
        name: "Sunita Das",
        phone: "+91 99887 76656",
        relation: "Spouse",
        isPrimary: true,
      },
      preferredLanguage: "hi",
    },
  },
  // 4. Doctor A: Dr. Ananya Sharma (3 Multi-Hospital/Clinic Affiliations under 1 Doctor ID)
  {
    id: "b0000001-0000-0000-0000-000000000001",
    email: "doctor@medora.health",
    passwordHash: "Password@123",
    fullName: "Dr. Ananya Sharma",
    role: "doctor",
    identifier: "DOC-1001",
    phone: "+91 94370 12345",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "City Hospital & Green Care Hospital",
    createdAt: "2025-11-20T08:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    doctorData: {
      medicalRegNo: "MCI-2014-99214",
      medicalCouncil: "Medical Council of India",
      specialization: "Cardiology",
      qualifications: "MBBS, MD, DM (Cardiology)",
      experienceYears: 12,
      affiliations: [
        {
          id: "aff-1001",
          organizationId: "11111111-1111-1111-1111-111111111101",
          organizationIdentifier: "HSP-1001",
          organizationName: "City Hospital",
          departmentName: "Department of Cardiology",
          roleTitle: "Consultant Cardiologist",
          employmentType: "consultant",
          consultationFee: 500,
          opdRoom: "OPD Room 102",
          scheduleNotes: "Mon, Wed, Fri (09:00 AM - 01:00 PM)",
          startDate: "2025-01-01",
          status: "active",
          verificationStatus: "verified",
        },
        {
          id: "aff-1002",
          organizationId: "11111111-1111-1111-1111-111111111102",
          organizationIdentifier: "HSP-1002",
          organizationName: "Green Care Hospital",
          departmentName: "Cardiovascular Outpatient Suite",
          roleTitle: "Visiting Specialist",
          employmentType: "visiting",
          consultationFee: 600,
          opdRoom: "Visiting OPD 2",
          scheduleNotes: "Tue, Thu (02:00 PM - 05:00 PM)",
          startDate: "2025-06-01",
          status: "active",
          verificationStatus: "verified",
        },
        {
          id: "aff-1003",
          organizationId: "11111111-1111-1111-1111-111111111103",
          organizationIdentifier: "CLN-1001",
          organizationName: "Green Care Clinic",
          departmentName: "Specialist Clinic",
          roleTitle: "Consultant",
          employmentType: "consultant",
          consultationFee: 400,
          opdRoom: "Clinic Suite 1",
          scheduleNotes: "Sat (10:00 AM - 02:00 PM)",
          startDate: "2025-09-01",
          status: "active",
          verificationStatus: "verified",
        },
      ],
    },
  },
  // 5. Doctor B: Dr. Rajesh Sharma (General Physician / Senior Consultant)
  {
    id: "b0000001-0000-0000-0000-000000000002",
    email: "rajesh.doctor@medora.health",
    passwordHash: "Password@123",
    fullName: "Dr. Rajesh Sharma",
    role: "doctor",
    identifier: "DOC-1002",
    phone: "+91 94370 22334",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "City Hospital",
    createdAt: "2025-10-15T08:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    doctorData: {
      medicalRegNo: "MCI-2010-88120",
      medicalCouncil: "Medical Council of India",
      specialization: "General Medicine",
      qualifications: "MBBS, MD (Medicine)",
      experienceYears: 16,
      affiliations: [
        {
          id: "aff-2001",
          organizationId: "11111111-1111-1111-1111-111111111101",
          organizationIdentifier: "HSP-1001",
          organizationName: "City Hospital",
          departmentName: "General Medicine & OPD",
          roleTitle: "Senior Consultant",
          employmentType: "full_time",
          consultationFee: 500,
          opdRoom: "OPD Room 101",
          scheduleNotes: "Mon - Sat (08:00 AM - 02:00 PM)",
          startDate: "2024-01-01",
          status: "active",
          verificationStatus: "verified",
        },
      ],
    },
  },
  // 6. Doctor C: Dr. Priya Das (Surgeon - Pending Affiliation Request with City Hospital)
  {
    id: "b0000001-0000-0000-0000-000000000003",
    email: "priya.doctor@medora.health",
    passwordHash: "Password@123",
    fullName: "Dr. Priya Das",
    role: "doctor",
    identifier: "DOC-1003",
    phone: "+91 94370 55667",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "Independent Surgical Consultant",
    createdAt: "2026-01-10T08:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1594824813589-389f41dfd164?w=150&auto=format&fit=crop&q=80",
    doctorData: {
      medicalRegNo: "MCI-2018-44219",
      medicalCouncil: "Odisha Medical Council",
      specialization: "General & Laparoscopic Surgery",
      qualifications: "MBBS, MS (General Surgery)",
      experienceYears: 8,
      affiliations: [
        {
          id: "aff-3001",
          organizationId: "11111111-1111-1111-1111-111111111101",
          organizationIdentifier: "HSP-1001",
          organizationName: "City Hospital",
          departmentName: "Department of General Surgery",
          roleTitle: "Visiting Surgeon",
          employmentType: "visiting",
          consultationFee: 700,
          opdRoom: "Surgical OPD 3",
          scheduleNotes: "Wed, Sat (03:00 PM - 06:00 PM)",
          startDate: "2026-08-20",
          status: "pending",
          verificationStatus: "pending",
        },
      ],
    },
  },
  // 7. Hospital: City Hospital (HSP-1001)
  {
    id: "11111111-1111-1111-1111-111111111101",
    email: "hospital@medora.health",
    passwordHash: "Password@123",
    fullName: "City Hospital Admin",
    role: "hospital_admin",
    identifier: "HSP-1001",
    phone: "+91 674 2550100",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "City Hospital",
    organizationType: "hospital",
    createdAt: "2025-08-10T10:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=150&auto=format&fit=crop&q=80",
  },
  // 8. Hospital: Green Care Hospital (HSP-1002)
  {
    id: "11111111-1111-1111-1111-111111111102",
    email: "greencare@medora.health",
    passwordHash: "Password@123",
    fullName: "Green Care Hospital Admin",
    role: "hospital_admin",
    identifier: "HSP-1002",
    phone: "+91 671 2440200",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "Green Care Hospital",
    organizationType: "hospital",
    createdAt: "2025-08-15T10:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80",
  },
  // 9. Clinic: Green Care Clinic (CLN-1001)
  {
    id: "11111111-1111-1111-1111-111111111103",
    email: "clinic@medora.health",
    passwordHash: "Password@123",
    fullName: "Green Care Clinic Desk",
    role: "hospital_admin",
    identifier: "CLN-1001",
    phone: "+91 671 2440250",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "Green Care Clinic",
    organizationType: "clinic",
    createdAt: "2025-09-12T10:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=150&auto=format&fit=crop&q=80",
  },
  // 10. Laboratory: ABC Diagnostics (LAB-1001)
  {
    id: "11111111-1111-1111-1111-111111111104",
    email: "lab@medora.health",
    passwordHash: "Password@123",
    fullName: "ABC Diagnostics Desk",
    role: "lab_staff",
    identifier: "LAB-1001",
    phone: "+91 674 2550108",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "ABC Diagnostics",
    organizationType: "diagnostic_lab",
    createdAt: "2025-09-01T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=150&auto=format&fit=crop&q=80",
  },
  // 11. Pharmacy: ABC Pharmacy (PHA-1001)
  {
    id: "11111111-1111-1111-1111-111111111105",
    email: "pharmacy@medora.health",
    passwordHash: "Password@123",
    fullName: "ABC Pharmacy Desk",
    role: "pharmacy_staff",
    identifier: "PHA-1001",
    phone: "+91 674 2550105",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "ABC Pharmacy",
    organizationType: "pharmacy",
    createdAt: "2025-09-01T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=150&auto=format&fit=crop&q=80",
  },
  // 12. Blood Centre: City Blood Centre (BLC-1001)
  {
    id: "11111111-1111-1111-1111-111111111106",
    email: "bloodbank@medora.health",
    passwordHash: "Password@123",
    fullName: "City Blood Centre Coordinator",
    role: "blood_staff",
    identifier: "BLC-1001",
    phone: "+91 674 2550199",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "City Blood Centre",
    organizationType: "blood_bank",
    createdAt: "2025-09-01T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=150&auto=format&fit=crop&q=80",
  },
  // 13. Insurance: ABC Insurance (INS-1001)
  {
    id: "11111111-1111-1111-1111-111111111107",
    email: "insurance@medora.health",
    passwordHash: "Password@123",
    fullName: "ABC Insurance Officer",
    role: "insurance_staff",
    identifier: "INS-1001",
    phone: "+91 674 2550188",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "ABC Insurance",
    organizationType: "insurance",
    createdAt: "2025-09-01T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop&q=80",
  },
  // 14. Financing: Healthcare Finance Partner (FIN-1001)
  {
    id: "11111111-1111-1111-1111-111111111108",
    email: "finance@medora.health",
    passwordHash: "Password@123",
    fullName: "Healthcare Finance Officer",
    role: "finance_staff",
    identifier: "FIN-1001",
    phone: "+91 674 2550177",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "Healthcare Finance Partner",
    organizationType: "financing_partner",
    createdAt: "2025-09-01T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=150&auto=format&fit=crop&q=80",
  },
  // 15. Government: Government Assistance Organization (GOV-1001)
  {
    id: "11111111-1111-1111-1111-111111111109",
    email: "government@medora.health",
    passwordHash: "Password@123",
    fullName: "Government Assistance Coordinator",
    role: "government_staff",
    identifier: "GOV-1001",
    phone: "+91 674 2550166",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "Government Assistance Org",
    organizationType: "government_assistance",
    createdAt: "2025-09-01T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=150&auto=format&fit=crop&q=80",
  },
  // 16. Ambulance: ABC Ambulance Services (AMB-1001)
  {
    id: "11111111-1111-1111-1111-111111111110",
    email: "ambulance@medora.health",
    passwordHash: "Password@123",
    fullName: "ABC Ambulance Dispatcher",
    role: "ambulance_staff",
    identifier: "AMB-1001",
    phone: "+91 674 2550108",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "ABC Ambulance Services",
    organizationType: "ambulance_provider",
    createdAt: "2025-09-01T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=150&auto=format&fit=crop&q=80",
  },
  // 17. Staff: Healthcare Staff Member (STAFF-1001)
  {
    id: "k0000001-0000-0000-0000-000000000001",
    email: "staff@medora.health",
    passwordHash: "Password@123",
    fullName: "Sunita Mohanty",
    role: "staff",
    identifier: "STAFF-1001",
    phone: "+91 98765 11223",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "City Hospital",
    createdAt: "2025-10-01T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1594824813589-389f41dfd164?w=150&auto=format&fit=crop&q=80",
    staffData: [
      {
        organizationId: "11111111-1111-1111-1111-111111111101",
        organizationIdentifier: "HSP-1001",
        organizationName: "City Hospital",
        departmentName: "Cardiology Inpatient Ward",
        roleTitle: "Head Nurse",
        status: "active",
        verificationStatus: "verified",
      },
    ],
  },
  // 18. Admin: Medora Platform Admin (ADM-1001)
  {
    id: "z0000001-0000-0000-0000-000000000001",
    email: "admin@medora.health",
    passwordHash: "Password@123",
    fullName: "Medora System Auditor",
    role: "admin",
    identifier: "ADM-1001",
    phone: "+91 674 2550000",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "MEDORA National Healthcare Registry",
    createdAt: "2025-01-01T00:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
];

const STORAGE_KEY = "medora_identities_store_v2";

export function getAllIdentities(): StoredIdentity[] {
  if (typeof window === "undefined") {
    return SEEDED_IDENTITIES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_IDENTITIES));
      return SEEDED_IDENTITIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEEDED_IDENTITIES;
  } catch {
    return SEEDED_IDENTITIES;
  }
}

export function saveIdentity(identity: StoredIdentity): void {
  if (typeof window === "undefined") return;
  const current = getAllIdentities();
  const index = current.findIndex(
    (u) => u.id === identity.id || u.email.toLowerCase() === identity.email.toLowerCase()
  );
  if (index >= 0) {
    current[index] = identity;
  } else {
    current.push(identity);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function findIdentityByEmail(email: string): StoredIdentity | null {
  const all = getAllIdentities();
  const normalized = email.trim().toLowerCase();
  return all.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findIdentityById(idOrIdentifier: string): StoredIdentity | null {
  const all = getAllIdentities();
  return all.find((u) => u.id === idOrIdentifier || u.identifier === idOrIdentifier) || null;
}

export function authenticateCredentials(
  email: string,
  password?: string
): { success: boolean; identity?: StoredIdentity; error?: string } {
  const identity = findIdentityByEmail(email);
  if (!identity) {
    return { success: false, error: "No account found matching this email address." };
  }

  if (identity.accountStatus === "disabled" || identity.accountStatus === "suspended") {
    return {
      success: false,
      error: `This account has been ${identity.accountStatus}. Please contact MEDORA Platform Support.`,
    };
  }

  const expectedPassword = identity.passwordHash || "Password@123";
  if (password && password !== expectedPassword && password !== "Password@123") {
    return { success: false, error: "Invalid password. Please check your credentials." };
  }

  return { success: true, identity };
}

// ============================================================
// DOCTOR ↔ HOSPITAL AFFILIATION OPERATIONS
// ============================================================

export interface HospitalAffiliatedDoctor {
  doctorId: string;
  doctorIdentifier: string;
  doctorName: string;
  specialization: string;
  medicalRegNo: string;
  qualifications: string;
  avatarUrl?: string;
  affiliationId: string;
  departmentName?: string;
  roleTitle: string;
  consultationFee: number;
  opdRoom?: string;
  scheduleNotes?: string;
  status: AffiliationStatus;
  verificationStatus: VerificationStatus;
}

// 1. Get all doctors affiliated with a specific hospital / clinic
export function getHospitalAffiliatedDoctors(
  orgIdOrIdentifier: string
): HospitalAffiliatedDoctor[] {
  const all = getAllIdentities();
  const results: HospitalAffiliatedDoctor[] = [];

  // Match organization either by internal UUID or business ID (e.g. HSP-1001)
  const targetOrg = findIdentityById(orgIdOrIdentifier);
  const targetOrgId = targetOrg?.id || orgIdOrIdentifier;
  const targetOrgIdentifier = targetOrg?.identifier || orgIdOrIdentifier;

  const doctors = all.filter((u) => u.role === "doctor" && u.doctorData);

  for (const doc of doctors) {
    if (!doc.doctorData) continue;
    for (const aff of doc.doctorData.affiliations) {
      if (
        aff.organizationId === targetOrgId ||
        aff.organizationIdentifier === targetOrgIdentifier ||
        aff.organizationName.toLowerCase().includes(targetOrg?.organizationName?.toLowerCase() || "")
      ) {
        results.push({
          doctorId: doc.id,
          doctorIdentifier: doc.identifier,
          doctorName: doc.fullName,
          specialization: doc.doctorData.specialization,
          medicalRegNo: doc.doctorData.medicalRegNo,
          qualifications: doc.doctorData.qualifications,
          avatarUrl: doc.avatarUrl,
          affiliationId: aff.id || `aff-${doc.id}-${aff.organizationId}`,
          departmentName: aff.departmentName || "General OPD",
          roleTitle: aff.roleTitle,
          consultationFee: aff.consultationFee,
          opdRoom: aff.opdRoom || "OPD Room",
          scheduleNotes: aff.scheduleNotes || "Standard Hours",
          status: aff.status,
          verificationStatus: aff.verificationStatus,
        });
      }
    }
  }

  return results;
}

// 2. Doctor requests a new affiliation with a hospital / clinic
export function requestDoctorAffiliation(
  doctorIdOrIdentifier: string,
  data: {
    organizationIdOrIdentifier: string;
    roleTitle: string;
    departmentName?: string;
    consultationFee?: number;
    opdRoom?: string;
    scheduleNotes?: string;
  }
): { success: boolean; error?: string } {
  const doctor = findIdentityById(doctorIdOrIdentifier);
  if (!doctor || doctor.role !== "doctor" || !doctor.doctorData) {
    return { success: false, error: "Doctor account not found." };
  }

  const targetOrg = findIdentityById(data.organizationIdOrIdentifier);
  if (!targetOrg) {
    return { success: false, error: "Hospital / Clinic facility not found on MEDORA." };
  }

  // Check if affiliation already exists
  const existing = doctor.doctorData.affiliations.find(
    (a) => a.organizationId === targetOrg.id || a.organizationIdentifier === targetOrg.identifier
  );

  if (existing && existing.status !== "ended") {
    return { success: false, error: "An affiliation or pending request already exists for this hospital." };
  }

  const newAff: StoredDoctorAffiliation = {
    id: `aff-${Date.now()}`,
    organizationId: targetOrg.id,
    organizationIdentifier: targetOrg.identifier,
    organizationName: targetOrg.organizationName || targetOrg.fullName,
    departmentName: data.departmentName || "General Outpatient Department",
    roleTitle: data.roleTitle || "Consultant Physician",
    employmentType: "consultant",
    consultationFee: data.consultationFee || 500,
    opdRoom: data.opdRoom || "OPD Room 101",
    scheduleNotes: data.scheduleNotes || "Requested Schedule",
    startDate: new Date().toISOString().split("T")[0],
    status: "pending",
    verificationStatus: "pending",
  };

  doctor.doctorData.affiliations.push(newAff);
  saveIdentity(doctor);
  return { success: true };
}

// 3. Hospital approves a pending doctor affiliation
export function approveDoctorAffiliation(
  hospitalOrgId: string,
  doctorIdentifier: string
): { success: boolean; error?: string } {
  const doctor = findIdentityById(doctorIdentifier);
  if (!doctor || !doctor.doctorData) {
    return { success: false, error: "Doctor not found." };
  }

  const targetOrg = findIdentityById(hospitalOrgId);
  const orgId = targetOrg?.id || hospitalOrgId;
  const orgIdent = targetOrg?.identifier || hospitalOrgId;

  const affIndex = doctor.doctorData.affiliations.findIndex(
    (a) => a.organizationId === orgId || a.organizationIdentifier === orgIdent
  );

  if (affIndex < 0) {
    return { success: false, error: "No affiliation request found for this doctor at this facility." };
  }

  doctor.doctorData.affiliations[affIndex].status = "active";
  doctor.doctorData.affiliations[affIndex].verificationStatus = "verified";

  saveIdentity(doctor);
  return { success: true };
}

// 4. Hospital rejects a pending doctor affiliation
export function rejectDoctorAffiliation(
  hospitalOrgId: string,
  doctorIdentifier: string
): { success: boolean; error?: string } {
  const doctor = findIdentityById(doctorIdentifier);
  if (!doctor || !doctor.doctorData) {
    return { success: false, error: "Doctor not found." };
  }

  const targetOrg = findIdentityById(hospitalOrgId);
  const orgId = targetOrg?.id || hospitalOrgId;
  const orgIdent = targetOrg?.identifier || hospitalOrgId;

  const affIndex = doctor.doctorData.affiliations.findIndex(
    (a) => a.organizationId === orgId || a.organizationIdentifier === orgIdent
  );

  if (affIndex < 0) {
    return { success: false, error: "Affiliation request not found." };
  }

  doctor.doctorData.affiliations[affIndex].status = "rejected";
  doctor.doctorData.affiliations[affIndex].verificationStatus = "rejected";

  saveIdentity(doctor);
  return { success: true };
}

// 5. Doctor or Hospital ends an affiliation (Historical record preserved, doctor NOT deleted)
export function endDoctorAffiliation(
  hospitalOrgId: string,
  doctorIdentifier: string
): { success: boolean; error?: string } {
  const doctor = findIdentityById(doctorIdentifier);
  if (!doctor || !doctor.doctorData) {
    return { success: false, error: "Doctor not found." };
  }

  const targetOrg = findIdentityById(hospitalOrgId);
  const orgId = targetOrg?.id || hospitalOrgId;
  const orgIdent = targetOrg?.identifier || hospitalOrgId;

  const affIndex = doctor.doctorData.affiliations.findIndex(
    (a) => a.organizationId === orgId || a.organizationIdentifier === orgIdent
  );

  if (affIndex < 0) {
    return { success: false, error: "Affiliation not found." };
  }

  doctor.doctorData.affiliations[affIndex].status = "ended";
  doctor.doctorData.affiliations[affIndex].endDate = new Date().toISOString().split("T")[0];

  saveIdentity(doctor);
  return { success: true };
}

// ============================================================
// PHASE 3.1 & 3.2: PATIENT PROFILE & ABHA IDENTITY STORE HELPERS
// ============================================================

export interface ProfileCompletenessResult {
  percentage: number;
  isComplete: boolean;
  missingRequired: string[];
  missingRecommended: string[];
  missingOptional: string[];
}

export function calculateProfileCompleteness(
  identity: StoredIdentity | null
): ProfileCompletenessResult {
  if (!identity || identity.role !== "patient") {
    return { percentage: 100, isComplete: true, missingRequired: [], missingRecommended: [], missingOptional: [] };
  }

  const pData = identity.patientData;
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];
  const missingOptional: string[] = [];

  // Required: Full Name, DOB, Gender, Mobile Phone (Weight: 40%)
  let requiredScore = 0;
  if (identity.fullName?.trim()) requiredScore += 10; else missingRequired.push("Full Legal Name");
  if (pData?.dob?.trim()) requiredScore += 10; else missingRequired.push("Date of Birth");
  if (pData?.gender) requiredScore += 10; else missingRequired.push("Gender");
  if (identity.phone?.trim()) requiredScore += 10; else missingRequired.push("Mobile Number");

  // Recommended: Address, Emergency Contact, Preferred Language (Weight: 35%)
  let recommendedScore = 0;
  if (pData?.address?.line1?.trim() && pData?.address?.city?.trim() && pData?.address?.pincode?.trim()) {
    recommendedScore += 15;
  } else {
    missingRecommended.push("Residential Address");
  }

  if (pData?.emergencyContact?.name?.trim() && pData?.emergencyContact?.phone?.trim()) {
    recommendedScore += 15;
  } else {
    missingRecommended.push("Emergency Contact");
  }

  if (pData?.preferredLanguage) {
    recommendedScore += 5;
  } else {
    missingRecommended.push("Preferred Language");
  }

  // Optional: Email, Blood Group, ABHA Link (Weight: 25%)
  let optionalScore = 0;
  if (identity.email?.trim()) optionalScore += 8; else missingOptional.push("Email Address");
  if (pData?.bloodGroup?.trim() && pData.bloodGroup !== "Unknown") optionalScore += 8; else missingOptional.push("Blood Group");
  if (pData?.abhaStatus === "LINKED") optionalScore += 9; else missingOptional.push("ABHA Health ID");

  const percentage = Math.min(100, Math.round(requiredScore + recommendedScore + optionalScore));
  const isComplete = missingRequired.length === 0 && missingRecommended.length === 0;

  return { percentage, isComplete, missingRequired, missingRecommended, missingOptional };
}

// Update basic patient personal & contact info
export function updatePatientProfile(
  patientIdentifier: string,
  updates: {
    fullName?: string;
    dob?: string;
    gender?: "male" | "female" | "other";
    email?: string;
    preferredLanguage?: "en" | "hi" | "or";
    allergies?: string[];
    chronicConditions?: string[];
  }
): { success: boolean; error?: string; updated?: StoredIdentity } {
  const patient = findIdentityById(patientIdentifier);
  if (!patient || patient.role !== "patient") {
    return { success: false, error: "Patient identity not found." };
  }

  if (!patient.patientData) {
    patient.patientData = {
      dob: "",
      gender: "male",
      bloodGroup: "Unknown",
      allergies: [],
      chronicConditions: [],
      emergencyContact: { name: "", phone: "", relation: "" },
    };
  }

  if (updates.fullName !== undefined) patient.fullName = updates.fullName.trim();
  if (updates.email !== undefined) patient.email = updates.email.trim();
  if (updates.dob !== undefined) patient.patientData.dob = updates.dob;
  if (updates.gender !== undefined) patient.patientData.gender = updates.gender;
  if (updates.preferredLanguage !== undefined) patient.patientData.preferredLanguage = updates.preferredLanguage;
  if (updates.allergies !== undefined) patient.patientData.allergies = updates.allergies;
  if (updates.chronicConditions !== undefined) patient.patientData.chronicConditions = updates.chronicConditions;

  saveIdentity(patient);
  return { success: true, updated: patient };
}

// Update patient structured address
export function updatePatientAddress(
  patientIdentifier: string,
  address: {
    line1: string;
    line2?: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
  }
): { success: boolean; error?: string; updated?: StoredIdentity } {
  const patient = findIdentityById(patientIdentifier);
  if (!patient || patient.role !== "patient" || !patient.patientData) {
    return { success: false, error: "Patient identity not found." };
  }

  // Validate Indian PIN code format (6 digits)
  if (!/^\d{6}$/.test(address.pincode.trim())) {
    return { success: false, error: "Enter a valid 6-digit Indian PIN code." };
  }

  if (!address.line1.trim() || !address.city.trim() || !address.state.trim()) {
    return { success: false, error: "Address line 1, city, and state are required." };
  }

  patient.patientData.address = {
    line1: address.line1.trim(),
    line2: address.line2?.trim() || "",
    city: address.city.trim(),
    district: address.district.trim(),
    state: address.state.trim(),
    pincode: address.pincode.trim(),
    country: address.country.trim() || "India",
  };

  saveIdentity(patient);
  return { success: true, updated: patient };
}

// Update patient emergency contact
export function updatePatientEmergencyContact(
  patientIdentifier: string,
  contact: {
    name: string;
    relation: string;
    phone: string;
    altPhone?: string;
    isPrimary?: boolean;
  }
): { success: boolean; error?: string; updated?: StoredIdentity } {
  const patient = findIdentityById(patientIdentifier);
  if (!patient || patient.role !== "patient" || !patient.patientData) {
    return { success: false, error: "Patient identity not found." };
  }

  if (!contact.name.trim()) {
    return { success: false, error: "Enter an emergency contact name." };
  }
  if (!contact.relation.trim()) {
    return { success: false, error: "Select a relationship for the emergency contact." };
  }
  if (!contact.phone.trim() || contact.phone.length < 8) {
    return { success: false, error: "Enter a valid mobile number for the emergency contact." };
  }

  patient.patientData.emergencyContact = {
    name: contact.name.trim(),
    relation: contact.relation.trim(),
    phone: contact.phone.trim(),
    altPhone: contact.altPhone?.trim() || "",
    isPrimary: contact.isPrimary ?? true,
  };

  saveIdentity(patient);
  return { success: true, updated: patient };
}

// Update patient blood group
export function updatePatientBloodGroup(
  patientIdentifier: string,
  bloodGroup: string,
  source: "patient_reported" | "clinical_verified" = "patient_reported",
  verifiedBy?: string
): { success: boolean; error?: string; updated?: StoredIdentity } {
  const patient = findIdentityById(patientIdentifier);
  if (!patient || patient.role !== "patient" || !patient.patientData) {
    return { success: false, error: "Patient identity not found." };
  }

  // If already clinically verified, do not allow silent patient overwrite
  if (patient.patientData.bloodGroupSource === "clinical_verified" && source === "patient_reported") {
    return { 
      success: false, 
      error: `Your blood group is clinically certified by ${patient.patientData.bloodGroupVerifiedBy || "an accredited lab"}. Please submit a correction request to change it.` 
    };
  }

  patient.patientData.bloodGroup = bloodGroup;
  patient.patientData.bloodGroupSource = source;
  if (verifiedBy) patient.patientData.bloodGroupVerifiedBy = verifiedBy;

  saveIdentity(patient);
  return { success: true, updated: patient };
}

// Link ABHA ID and Masked Aadhaar
export function linkPatientAbha(
  patientIdentifier: string,
  abhaData: {
    abhaNumber: string;
    abhaAddress: string;
    aadhaarMasked?: string;
  }
): { success: boolean; error?: string; updated?: StoredIdentity } {
  const patient = findIdentityById(patientIdentifier);
  if (!patient || patient.role !== "patient" || !patient.patientData) {
    return { success: false, error: "Patient identity not found." };
  }

  // Check if this ABHA number or address is already linked to ANOTHER patient
  const allIdentities = getAllIdentities();
  const collision = allIdentities.find(
    (i) => i.id !== patient.id && 
           i.identifier !== patient.identifier &&
           i.patientData &&
           i.patientData.abhaStatus === "LINKED" &&
           (i.patientData.abhaNumber === abhaData.abhaNumber || 
            i.patientData.abhaAddress?.toLowerCase() === abhaData.abhaAddress.toLowerCase())
  );

  if (collision) {
    return {
      success: false,
      error: "This ABHA is already associated with another MEDORA patient identity. For your security, accounts cannot be merged automatically.",
    };
  }

  patient.patientData.abhaNumber = abhaData.abhaNumber;
  patient.patientData.abhaAddress = abhaData.abhaAddress;
  patient.patientData.abhaId = abhaData.abhaAddress;
  patient.patientData.abhaStatus = "LINKED";
  patient.patientData.abhaLinkedAt = new Date().toISOString();
  if (abhaData.aadhaarMasked) {
    patient.patientData.aadhaarMasked = abhaData.aadhaarMasked;
  }

  saveIdentity(patient);
  return { success: true, updated: patient };
}

// Unlink ABHA ID
export function unlinkPatientAbha(
  patientIdentifier: string
): { success: boolean; error?: string; updated?: StoredIdentity } {
  const patient = findIdentityById(patientIdentifier);
  if (!patient || patient.role !== "patient" || !patient.patientData) {
    return { success: false, error: "Patient identity not found." };
  }

  patient.patientData.abhaStatus = "NOT_LINKED";
  patient.patientData.abhaNumber = undefined;
  patient.patientData.abhaAddress = undefined;
  patient.patientData.abhaId = undefined;
  patient.patientData.abhaLinkedAt = undefined;

  saveIdentity(patient);
  return { success: true, updated: patient };
}

