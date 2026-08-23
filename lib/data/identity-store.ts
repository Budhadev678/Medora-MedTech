// ============================================================
// MEDORA — PERSISTENT IDENTITY & RELATIONSHIP STORE
// PHASE A.2: NORMALIZED IDENTITY & ORGANIZATION MEMBERSHIP STORE
// ============================================================

import type { 
  UserRole, 
  AccountStatus, 
  VerificationStatus, 
  OrganizationType,
  OrganizationEntity,
  OrganizationMembership,
  OrganizationMembershipStatus,
  PersonProfile,
  ProfessionalProfile,
  UserAccount
} from "@/types/database.types";

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
  organizationId?: string;
  organizationName?: string;
  organizationType?: OrganizationType;
  createdAt: string;
  avatarUrl?: string;
  // Role-specific payload
  patientData?: StoredPatientData;
  doctorData?: StoredDoctorData;
  staffData?: StoredStaffMembership[];
}

export const SEEDED_ORGANIZATIONS: OrganizationEntity[] = [
  {
    id: "11111111-1111-1111-1111-111111111101",
    medora_id: "HSP-1001",
    name: "City Hospital",
    type: "hospital",
    license_no: "HSP-OD-2018-092",
    address: "MG Road, Central District",
    city: "Bhubaneswar",
    phone: "+91 674 2550100",
    emergency_phone: "112",
    status: "active",
    verification_status: "verified",
    created_at: "2025-08-10T10:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111102",
    medora_id: "HSP-1002",
    name: "Green Care Hospital",
    type: "hospital",
    license_no: "HSP-OD-2020-144",
    address: "Ring Road, Cantonment",
    city: "Cuttack",
    phone: "+91 671 2440200",
    emergency_phone: "112",
    status: "active",
    verification_status: "verified",
    created_at: "2025-08-15T10:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111103",
    medora_id: "CLN-1001",
    name: "Green Care Clinic",
    type: "clinic",
    license_no: "CLN-OD-2021-055",
    address: "Cantonment Road",
    city: "Cuttack",
    phone: "+91 671 2440250",
    status: "active",
    verification_status: "verified",
    created_at: "2025-09-12T10:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111104",
    medora_id: "LAB-1001",
    name: "ABC Diagnostics",
    type: "diagnostic_lab",
    license_no: "LAB-OD-2019-112",
    address: "Janpath Road",
    city: "Bhubaneswar",
    phone: "+91 674 2550108",
    status: "active",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111105",
    medora_id: "PHA-1001",
    name: "ABC Pharmacy",
    type: "pharmacy",
    license_no: "PHA-OD-2019-883",
    address: "Janpath Commercial Complex",
    city: "Bhubaneswar",
    phone: "+91 674 2550105",
    status: "active",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111106",
    medora_id: "BLC-1001",
    name: "City Blood Centre",
    type: "blood_bank",
    license_no: "BLC-OD-2017-023",
    address: "Medical Enclave, Unit 4",
    city: "Bhubaneswar",
    phone: "+91 674 2550199",
    status: "active",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111107",
    medora_id: "INS-1001",
    name: "ABC Insurance",
    type: "insurance",
    license_no: "IRDAI-OD-2015-44",
    address: "Financial District",
    city: "Bhubaneswar",
    phone: "+91 674 2550188",
    status: "active",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111108",
    medora_id: "FIN-1001",
    name: "Healthcare Finance Partner",
    type: "financing_partner",
    license_no: "NBFC-OD-2022-77",
    address: "Finance Tower",
    city: "Bhubaneswar",
    phone: "+91 674 2550177",
    status: "active",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111109",
    medora_id: "GOV-1001",
    name: "Government Assistance Org",
    type: "government_assistance",
    license_no: "GOV-OD-2021-01",
    address: "Secretariat Road",
    city: "Bhubaneswar",
    phone: "+91 674 2550166",
    status: "active",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111110",
    medora_id: "AMB-1001",
    name: "ABC Ambulance Services",
    type: "ambulance_provider",
    license_no: "AMB-OD-2020-99",
    address: "Traffic HQ Enclave",
    city: "Bhubaneswar",
    phone: "+91 674 2550108",
    emergency_phone: "108",
    status: "active",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
  },
];

export const SEEDED_MEMBERSHIPS: OrganizationMembership[] = [
  // 1. Dr. Ananya Sharma @ City Hospital (HSP-1001)
  {
    id: "MEM-1001",
    person_id: "PER-DOC-1001",
    user_id: "b0000001-0000-0000-0000-000000000001",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    organization_type: "hospital",
    department_name: "Department of Cardiology",
    role_title: "Consultant Cardiologist",
    member_role: "doctor",
    employment_type: "consultant",
    consultation_fee: 500,
    opd_room: "OPD Room 102",
    schedule_notes: "Mon, Wed, Fri (09:00 AM - 01:00 PM)",
    start_date: "2025-01-01",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-01-01T09:00:00Z",
  },
  // 2. Dr. Ananya Sharma @ Green Care Hospital (HSP-1002)
  {
    id: "MEM-1002",
    person_id: "PER-DOC-1001",
    user_id: "b0000001-0000-0000-0000-000000000001",
    organization_id: "11111111-1111-1111-1111-111111111102",
    organization_identifier: "HSP-1002",
    organization_name: "Green Care Hospital",
    organization_type: "hospital",
    department_name: "Cardiovascular Outpatient Suite",
    role_title: "Visiting Specialist",
    member_role: "doctor",
    employment_type: "visiting",
    consultation_fee: 600,
    opd_room: "Visiting OPD 2",
    schedule_notes: "Tue, Thu (02:00 PM - 05:00 PM)",
    start_date: "2025-06-01",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-06-01T09:00:00Z",
  },
  // 3. Dr. Ananya Sharma @ Green Care Clinic (CLN-1001)
  {
    id: "MEM-1003",
    person_id: "PER-DOC-1001",
    user_id: "b0000001-0000-0000-0000-000000000001",
    organization_id: "11111111-1111-1111-1111-111111111103",
    organization_identifier: "CLN-1001",
    organization_name: "Green Care Clinic",
    organization_type: "clinic",
    department_name: "Specialist Clinic",
    role_title: "Consultant",
    member_role: "doctor",
    employment_type: "consultant",
    consultation_fee: 400,
    opd_room: "Clinic Suite 1",
    schedule_notes: "Sat (10:00 AM - 02:00 PM)",
    start_date: "2025-09-01",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
  },
  // 4. Dr. Rajesh Sharma @ City Hospital (HSP-1001)
  {
    id: "MEM-2001",
    person_id: "PER-DOC-1002",
    user_id: "b0000001-0000-0000-0000-000000000002",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    organization_type: "hospital",
    department_name: "General Medicine & OPD",
    role_title: "Senior Consultant",
    member_role: "doctor",
    employment_type: "full_time",
    consultation_fee: 500,
    opd_room: "OPD Room 101",
    schedule_notes: "Mon - Sat (08:00 AM - 02:00 PM)",
    start_date: "2024-01-01",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2024-01-01T08:00:00Z",
  },
  // 5. Dr. Priya Das @ City Hospital (HSP-1001 - Pending Request)
  {
    id: "MEM-3001",
    person_id: "PER-DOC-1003",
    user_id: "b0000001-0000-0000-0000-000000000003",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    organization_type: "hospital",
    department_name: "Department of General Surgery",
    role_title: "Visiting Surgeon",
    member_role: "doctor",
    employment_type: "visiting",
    consultation_fee: 700,
    opd_room: "Surgical OPD 3",
    schedule_notes: "Wed, Sat (03:00 PM - 06:00 PM)",
    start_date: "2026-08-20",
    status: "PENDING",
    verification_status: "pending",
    created_at: "2026-08-20T08:00:00Z",
  },
  // 6. Sunita Mohanty (STAFF-1001) @ City Hospital (HSP-1001)
  {
    id: "MEM-4001",
    person_id: "PER-STAFF-1001",
    user_id: "k0000001-0000-0000-0000-000000000001",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    organization_type: "hospital",
    department_name: "Patient Admissions & Records",
    role_title: "Admissions Officer",
    member_role: "staff",
    employment_type: "full_time",
    start_date: "2025-10-01",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-10-01T09:00:00Z",
  },
  // 7. Anita (STAFF-1002 - Multi-org receptionist) @ City Hospital (HSP-1001)
  {
    id: "MEM-5001",
    person_id: "PER-STAFF-1002",
    user_id: "k0000001-0000-0000-0000-000000000002",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    organization_type: "hospital",
    department_name: "Reception & Admissions",
    role_title: "Receptionist",
    member_role: "staff",
    employment_type: "part_time",
    start_date: "2026-01-01",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2026-01-01T09:00:00Z",
  },
  // 8. Anita (STAFF-1002 - Multi-org receptionist) @ Green Care Clinic (CLN-1001)
  {
    id: "MEM-5002",
    person_id: "PER-STAFF-1002",
    user_id: "k0000001-0000-0000-0000-000000000002",
    organization_id: "11111111-1111-1111-1111-111111111103",
    organization_identifier: "CLN-1001",
    organization_name: "Green Care Clinic",
    organization_type: "clinic",
    department_name: "Front Desk & Billing",
    role_title: "Receptionist",
    member_role: "staff",
    employment_type: "part_time",
    start_date: "2026-02-01",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2026-02-01T09:00:00Z",
  },
  // 9. Rahul Multi-Role @ City Hospital (Doctor)
  {
    id: "MEM-6001",
    person_id: "PER-MULTI-1001",
    user_id: "m0000001-0000-0000-0000-000000000001",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    organization_type: "hospital",
    department_name: "Department of Cardiology",
    role_title: "Junior Resident",
    member_role: "doctor",
    employment_type: "full_time",
    start_date: "2026-03-01",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2026-03-01T09:00:00Z",
  },
  // 10. Rahul Multi-Role @ Green Care Clinic (Administrator)
  {
    id: "MEM-6002",
    person_id: "PER-MULTI-1001",
    user_id: "m0000001-0000-0000-0000-000000000001",
    organization_id: "11111111-1111-1111-1111-111111111103",
    organization_identifier: "CLN-1001",
    organization_name: "Green Care Clinic",
    organization_type: "clinic",
    department_name: "Administration",
    role_title: "Clinic Administrator",
    member_role: "hospital_admin",
    employment_type: "part_time",
    start_date: "2026-04-01",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2026-04-01T09:00:00Z",
  },
];

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
        departmentName: "Patient Admissions & Records",
        roleTitle: "Admissions Officer",
        status: "active",
        verificationStatus: "verified",
      },
    ],
  },
  // 18. Staff: Anita Patel (STAFF-1002 - Multi-org Receptionist)
  {
    id: "k0000001-0000-0000-0000-000000000002",
    email: "anita@cityhospital.org",
    passwordHash: "Password@123",
    fullName: "Anita Patel",
    role: "staff",
    identifier: "STAFF-1002",
    phone: "+91 98765 22334",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "City Hospital",
    createdAt: "2026-01-01T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    staffData: [
      {
        organizationId: "11111111-1111-1111-1111-111111111101",
        organizationIdentifier: "HSP-1001",
        organizationName: "City Hospital",
        departmentName: "Reception & Admissions",
        roleTitle: "Receptionist",
        status: "active",
        verificationStatus: "verified",
      },
    ],
  },
  // 19. Multi-Role: Rahul (Doctor at City Hospital, Admin at Green Care Clinic)
  {
    id: "m0000001-0000-0000-0000-000000000001",
    email: "multirole@medora.health",
    passwordHash: "Password@123",
    fullName: "Rahul Multi-Role",
    role: "doctor",
    identifier: "MULTI-1001",
    phone: "+91 98765 33445",
    accountStatus: "active",
    verificationStatus: "verified",
    organizationName: "City Hospital",
    createdAt: "2026-03-01T09:00:00Z",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    doctorData: {
      medicalRegNo: "MCI-2018-77123",
      medicalCouncil: "Odisha Medical Council",
      specialization: "Cardiology",
      qualifications: "MBBS, MD",
      experienceYears: 4,
      affiliations: [
        {
          organizationId: "11111111-1111-1111-1111-111111111101",
          organizationName: "City Hospital",
          departmentName: "Department of Cardiology",
          roleTitle: "Junior Resident",
          consultationFee: 500,
          status: "active",
          verificationStatus: "verified",
        }
      ]
    }
  },
  // 20. Admin: Medora Platform Admin (ADM-1001)
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
const ORGANIZATIONS_STORAGE_KEY = "medora_organizations_store_v1";
const MEMBERSHIPS_STORAGE_KEY = "medora_memberships_store_v1";

let inMemoryIdentities: StoredIdentity[] = [...SEEDED_IDENTITIES];
let inMemoryOrganizations: OrganizationEntity[] = [...SEEDED_ORGANIZATIONS];
let inMemoryMemberships: OrganizationMembership[] = [...SEEDED_MEMBERSHIPS];

// ============================================================
// PHASE A.2: NORMALIZED ORGANIZATIONS STORE
// ============================================================

export function getAllOrganizations(): OrganizationEntity[] {
  if (typeof window === "undefined") {
    return inMemoryOrganizations;
  }
  try {
    const raw = localStorage.getItem(ORGANIZATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(inMemoryOrganizations));
      return inMemoryOrganizations;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryOrganizations;
  } catch {
    return inMemoryOrganizations;
  }
}

export function saveOrganization(org: OrganizationEntity): void {
  const index = inMemoryOrganizations.findIndex(
    (o) => o.id === org.id || o.medora_id.toUpperCase() === org.medora_id.toUpperCase()
  );
  if (index >= 0) {
    inMemoryOrganizations[index] = org;
  } else {
    inMemoryOrganizations.push(org);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(inMemoryOrganizations));
      window.dispatchEvent(new Event("medora-organization-updated"));
    } catch (e) {}
  }
}

export function getOrganizationById(idOrMedoraId: string): OrganizationEntity | null {
  const all = getAllOrganizations();
  const search = idOrMedoraId.trim().toUpperCase();
  return all.find((o) => o.id === idOrMedoraId || o.medora_id.toUpperCase() === search) || null;
}

export function createOrganization(data: {
  medora_id: string;
  name: string;
  type: OrganizationType;
  license_no: string;
  address: string;
  city: string;
  phone: string;
  emergency_phone?: string;
}): { success: boolean; organization?: OrganizationEntity; error?: string } {
  if (!data.medora_id.trim() || !data.name.trim()) {
    return { success: false, error: "Organization medora_id and name are required." };
  }

  const existing = getOrganizationById(data.medora_id);
  if (existing) {
    return { success: false, error: `An organization with ID ${data.medora_id} already exists.` };
  }

  const newOrg: OrganizationEntity = {
    id: `org-uuid-${Date.now()}`,
    medora_id: data.medora_id.trim().toUpperCase(),
    name: data.name.trim(),
    type: data.type,
    license_no: data.license_no.trim() || `LIC-${Date.now()}`,
    address: data.address.trim(),
    city: data.city.trim(),
    phone: data.phone.trim(),
    emergency_phone: data.emergency_phone?.trim(),
    status: "active",
    verification_status: "verified",
    created_at: new Date().toISOString(),
  };

  saveOrganization(newOrg);
  return { success: true, organization: newOrg };
}

// ============================================================
// PHASE A.2: NORMALIZED ORGANIZATION MEMBERSHIPS STORE
// ============================================================

export function getAllMemberships(): OrganizationMembership[] {
  if (typeof window === "undefined") {
    return inMemoryMemberships;
  }
  try {
    const raw = localStorage.getItem(MEMBERSHIPS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEMBERSHIPS_STORAGE_KEY, JSON.stringify(inMemoryMemberships));
      return inMemoryMemberships;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryMemberships;
  } catch {
    return inMemoryMemberships;
  }
}

export function saveMembership(membership: OrganizationMembership): void {
  const index = inMemoryMemberships.findIndex((m) => m.id === membership.id);
  if (index >= 0) {
    inMemoryMemberships[index] = { ...membership, updated_at: new Date().toISOString() };
  } else {
    inMemoryMemberships.push(membership);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MEMBERSHIPS_STORAGE_KEY, JSON.stringify(inMemoryMemberships));
      window.dispatchEvent(new Event("medora-membership-updated"));
    } catch (e) {}
  }
}

export function getMembershipById(membershipId: string): OrganizationMembership | null {
  const all = getAllMemberships();
  return all.find((m) => m.id === membershipId) || null;
}

export function getPersonMemberships(personIdOrUserId: string): OrganizationMembership[] {
  const all = getAllMemberships();
  return all.filter(
    (m) => m.person_id === personIdOrUserId || m.user_id === personIdOrUserId
  );
}

export function getOrganizationMemberships(orgIdOrMedoraId: string): OrganizationMembership[] {
  const all = getAllMemberships();
  const search = orgIdOrMedoraId.trim().toUpperCase();
  return all.filter(
    (m) => m.organization_id === orgIdOrMedoraId || m.organization_identifier.toUpperCase() === search
  );
}

/**
 * Creates or invites a member to an organization.
 * CRITICAL RULE: Uses existing user_id and person_id without creating a new auth user account.
 */
export function createMembership(params: {
  personId: string;
  userId: string;
  organizationId: string;
  organizationIdentifier?: string;
  organizationName?: string;
  organizationType?: OrganizationType;
  facilityId?: string;
  facilityName?: string;
  departmentName?: string;
  roleTitle: string;
  memberRole: UserRole | string;
  employmentType?: "full_time" | "part_time" | "consultant" | "visiting" | "contract";
  consultationFee?: number;
  opdRoom?: string;
  scheduleNotes?: string;
  status?: OrganizationMembershipStatus;
  startDate?: string;
}): { success: boolean; membership?: OrganizationMembership; error?: string } {
  const org = getOrganizationById(params.organizationId) || 
    getOrganizationById(params.organizationIdentifier || "");

  const orgId = org?.id || params.organizationId;
  const orgIdent = org?.medora_id || params.organizationIdentifier || "HSP-1001";
  const orgName = org?.name || params.organizationName || "Healthcare Facility";
  const orgType = org?.type || params.organizationType || "hospital";

  // Check unique constraint: Same person cannot have multiple ACTIVE memberships in the same organization
  const existingActive = getAllMemberships().find(
    (m) => (m.person_id === params.personId || m.user_id === params.userId) &&
           (m.organization_id === orgId || m.organization_identifier === orgIdent) &&
           m.status === "ACTIVE"
  );

  if (existingActive) {
    return {
      success: false,
      error: `This person already has an active membership (${existingActive.id}) at ${orgName}.`,
    };
  }

  const membershipId = `MEM-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
  const now = new Date().toISOString();

  const newMembership: OrganizationMembership = {
    id: membershipId,
    person_id: params.personId,
    user_id: params.userId,
    organization_id: orgId,
    organization_identifier: orgIdent,
    organization_name: orgName,
    organization_type: orgType,
    facility_id: params.facilityId,
    facility_name: params.facilityName,
    department_name: params.departmentName || "General Department",
    role_title: params.roleTitle,
    member_role: params.memberRole,
    employment_type: params.employmentType || "consultant",
    consultation_fee: params.consultationFee,
    opd_room: params.opdRoom,
    schedule_notes: params.scheduleNotes,
    status: params.status || "ACTIVE",
    verification_status: "verified",
    start_date: params.startDate || now.split("T")[0],
    created_at: now,
  };

  saveMembership(newMembership);
  return { success: true, membership: newMembership };
}

export function inviteUserToOrganization(params: {
  personId: string;
  userId: string;
  organizationId: string;
  roleTitle: string;
  memberRole: UserRole | string;
  departmentName?: string;
  consultationFee?: number;
}): { success: boolean; membership?: OrganizationMembership; error?: string } {
  return createMembership({
    ...params,
    status: "INVITED",
  });
}

export function acceptMembership(membershipId: string): { success: boolean; membership?: OrganizationMembership; error?: string } {
  const membership = getMembershipById(membershipId);
  if (!membership) {
    return { success: false, error: "Membership record not found." };
  }
  if (membership.status !== "INVITED" && membership.status !== "PENDING") {
    return { success: false, error: `Cannot accept membership with status: ${membership.status}` };
  }

  membership.status = "ACTIVE";
  membership.verification_status = "verified";
  membership.start_date = new Date().toISOString().split("T")[0];
  membership.updated_at = new Date().toISOString();

  saveMembership(membership);
  return { success: true, membership };
}

export function revokeMembership(
  membershipId: string, 
  reason = "Membership ended by organization or practitioner"
): { success: boolean; membership?: OrganizationMembership; error?: string } {
  const membership = getMembershipById(membershipId);
  if (!membership) {
    return { success: false, error: "Membership record not found." };
  }

  membership.status = "REVOKED";
  membership.end_date = new Date().toISOString().split("T")[0];
  membership.revocation_reason = reason;
  membership.revoked_at = new Date().toISOString();
  membership.updated_at = new Date().toISOString();

  saveMembership(membership);
  return { success: true, membership };
}

export function suspendMembership(
  membershipId: string, 
  reason = "Membership temporarily suspended"
): { success: boolean; membership?: OrganizationMembership; error?: string } {
  const membership = getMembershipById(membershipId);
  if (!membership) {
    return { success: false, error: "Membership record not found." };
  }

  membership.status = "SUSPENDED";
  membership.revocation_reason = reason;
  membership.updated_at = new Date().toISOString();

  saveMembership(membership);
  return { success: true, membership };
}

// ============================================================
// AUTHORITATIVE USER IDENTITY STORE
// ============================================================

export function getAllIdentities(): StoredIdentity[] {
  if (typeof window === "undefined") {
    return inMemoryIdentities;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryIdentities));
      return inMemoryIdentities;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryIdentities;
  } catch {
    return inMemoryIdentities;
  }
}

export function saveIdentity(identity: StoredIdentity): void {
  const index = inMemoryIdentities.findIndex(
    (u) => u.id === identity.id || u.email.toLowerCase() === identity.email.toLowerCase()
  );
  if (index >= 0) {
    inMemoryIdentities[index] = identity;
  } else {
    inMemoryIdentities.push(identity);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryIdentities));
      window.dispatchEvent(new Event("medora-identity-updated"));
    } catch (e) {}
  }
}

export function findIdentityByEmail(email: string): StoredIdentity | null {
  const all = getAllIdentities();
  const normalized = email.trim().toLowerCase();
  
  // 1. Direct match by email
  const direct = all.find((u) => u.email.toLowerCase() === normalized);
  if (direct) return direct;

  // 2. Direct match by identifier (e.g. "HSP-1001", "DOC-1001", "PAT-1001", "ADM-1001")
  const byIdentifier = all.find((u) => u.identifier.toLowerCase() === normalized);
  if (byIdentifier) return byIdentifier;

  // 3. Known aliases for test accounts and institutional emails
  const EMAIL_ALIASES: Record<string, string> = {
    "admin@cityhospital.org": "hospital@medora.health",
    "admin@cityhospital.com": "hospital@medora.health",
    "cityhospital@medora.health": "hospital@medora.health",
    "admin@greencare.org": "greencare@medora.health",
    "admin@greencareclinic.org": "clinic@medora.health",
    "reception@cityhospital.org": "anita@cityhospital.org",
    "anita@medora.health": "anita@cityhospital.org",
    "rahul@medora.health": "patient@medora.health",
    "ananya@medora.health": "doctor@medora.health",
    "admin@medora.org": "admin@medora.health",
  };

  const aliased = EMAIL_ALIASES[normalized];
  if (aliased) {
    return all.find((u) => u.email.toLowerCase() === aliased.toLowerCase()) || null;
  }

  return null;
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
    district?: string;
    state: string;
    pincode: string;
    country?: string;
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
    district: address.district?.trim() || address.city.trim(),
    state: address.state.trim(),
    pincode: address.pincode.trim(),
    country: address.country?.trim() || "India",
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

