// ============================================================
// MEDORA — HEALTHCARE AFFILIATIONS STORE
// PHASE 5.1 & 5.2: DOCTOR & STAFF FACILITY AFFILIATIONS
// ============================================================

import type {
  HealthcareDoctorAffiliation,
  HealthcareStaffAffiliation,
  VerificationStatus,
  AffiliationInvitation,
  DepartmentHeadAssignment,
  AffiliationStatus,
} from "@/types/database.types";
import { getFacilityById } from "./facility-store";
import { getDepartmentById } from "./department-store";

const DOCTOR_AFFILIATIONS_KEY = "medora_doctor_affiliations_v5";
const STAFF_AFFILIATIONS_KEY = "medora_staff_affiliations_v5";

export const DEFAULT_DOCTOR_AFFILIATIONS: HealthcareDoctorAffiliation[] = [
  // 1. Dr. Ananya Sharma @ City Hospital — Bhubaneswar Main Campus (FAC-1001)
  {
    id: "AFF-DOC-1001",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    specialization: "Cardiology",
    medical_reg_no: "MCI-OD-2015-8821",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_name: "City Healthcare Group",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1001",
    department_name: "Cardiology & Cath Lab",
    role_title: "Consultant Cardiologist",
    consultation_fee: 500,
    opd_room: "OPD Room 102",
    schedule_notes: "Mon, Wed, Fri (09:00 AM - 01:00 PM)",
    status: "ACTIVE",
    verification_status: "verified",
    start_date: "2025-01-01",
    created_at: "2025-01-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // 2. Dr. Ananya Sharma @ Green Care Hospital — Cuttack (FAC-1004)
  {
    id: "AFF-DOC-1002",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    specialization: "Cardiology",
    medical_reg_no: "MCI-OD-2015-8821",
    organization_id: "11111111-1111-1111-1111-111111111102",
    organization_name: "Green Care Healthcare",
    facility_id: "FAC-1004",
    facility_name: "Green Care Hospital — Cuttack Campus",
    department_id: "DEP-1010",
    department_name: "Cardiovascular Outpatient Suite",
    role_title: "Visiting Specialist",
    consultation_fee: 600,
    opd_room: "Specialist Suite 204",
    schedule_notes: "Tue, Thu (02:00 PM - 05:00 PM)",
    status: "ACTIVE",
    verification_status: "verified",
    start_date: "2025-03-01",
    created_at: "2025-03-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // 3. Dr. Ananya Sharma @ Green Care Clinic — Cantonment (FAC-2001)
  {
    id: "AFF-DOC-1003",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    specialization: "Cardiology",
    medical_reg_no: "MCI-OD-2015-8821",
    organization_id: "11111111-1111-1111-1111-111111111103",
    organization_name: "Green Care Primary Care Network",
    facility_id: "FAC-2001",
    facility_name: "Green Care Clinic — Cantonment Branch",
    department_id: "DEP-2003",
    department_name: "Visiting Specialty & Cardiology Clinic",
    role_title: "Visiting Consultant",
    consultation_fee: 500,
    opd_room: "Consultation Room 1",
    schedule_notes: "Tue, Thu (05:00 PM - 07:00 PM)",
    status: "ACTIVE",
    verification_status: "verified",
    start_date: "2025-06-01",
    created_at: "2025-06-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // 4. Dr. Rajesh Sharma (DOC-1002) @ City Hospital (FAC-1001)
  {
    id: "AFF-DOC-1004",
    doctor_id: "DOC-1002",
    doctor_name: "Dr. Rajesh Sharma",
    specialization: "Neurology",
    medical_reg_no: "MCI-OD-2012-4419",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_name: "City Healthcare Group",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1004",
    department_name: "Neurology & Stroke Unit",
    role_title: "Senior Consultant Neurologist",
    consultation_fee: 600,
    opd_room: "OPD Room 105",
    schedule_notes: "Mon - Sat (10:00 AM - 02:00 PM)",
    status: "ACTIVE",
    verification_status: "verified",
    start_date: "2024-01-01",
    created_at: "2024-01-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // 5. Dr. Rahul Verma (DOC-1003) @ City Hospital (FAC-1001)
  {
    id: "AFF-DOC-1005",
    doctor_id: "DOC-1003",
    doctor_name: "Dr. Rahul Verma",
    specialization: "Orthopedics",
    medical_reg_no: "MCI-OD-2016-7731",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_name: "City Healthcare Group",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1005",
    department_name: "Orthopedics & Joint Replacement",
    role_title: "Consultant Orthopedic Surgeon",
    consultation_fee: 500,
    opd_room: "OPD Room 108",
    schedule_notes: "Mon, Tue, Thu (09:00 AM - 01:00 PM)",
    status: "ACTIVE",
    verification_status: "verified",
    start_date: "2025-01-01",
    created_at: "2025-01-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

export const DEFAULT_STAFF_AFFILIATIONS: HealthcareStaffAffiliation[] = [
  // Anita Receptionist @ City Hospital (FAC-1001)
  {
    id: "AFF-STAFF-1001",
    user_id: "STAFF-1002",
    staff_name: "Anita Mishra",
    email: "anita@cityhospital.org",
    phone: "+91 674 2550102",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_name: "City Healthcare Group",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1002",
    department_name: "Emergency & Trauma Care",
    role_title: "Head OPD Receptionist",
    staff_role: "RECEPTIONIST",
    status: "ACTIVE",
    start_date: "2025-01-01",
    created_at: "2025-01-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // Anita Receptionist @ Green Care Clinic (FAC-2001)
  {
    id: "AFF-STAFF-1002",
    user_id: "STAFF-1002",
    staff_name: "Anita Mishra",
    email: "anita@cityhospital.org",
    phone: "+91 674 2550102",
    organization_id: "11111111-1111-1111-1111-111111111103",
    organization_name: "Green Care Primary Care Network",
    facility_id: "FAC-2001",
    facility_name: "Green Care Clinic — Cantonment Branch",
    department_id: "DEP-2001",
    department_name: "General Medicine & Outpatient Suite",
    role_title: "Visiting Front Desk Coordinator",
    staff_role: "RECEPTIONIST",
    status: "ACTIVE",
    start_date: "2025-06-01",
    created_at: "2025-06-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // Prakash Lab Technician @ ABC Diagnostics (FAC-3001)
  {
    id: "AFF-STAFF-1003",
    user_id: "LAB-TECH-1001",
    staff_name: "Prakash Diagnostic Tech",
    email: "prakash@abcdiagnostics.com",
    phone: "+91 674 2550108",
    organization_id: "11111111-1111-1111-1111-111111111104",
    organization_name: "ABC Diagnostic Laboratories",
    facility_id: "FAC-3001",
    facility_name: "ABC Diagnostics — Central Reference Lab",
    department_id: "DEP-3001",
    department_name: "Hematology & Clinical Pathology",
    role_title: "Senior Laboratory Technician",
    staff_role: "LAB_STAFF",
    status: "ACTIVE",
    start_date: "2025-01-01",
    created_at: "2025-01-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // Suresh Facility Admin @ City Hospital (FAC-1001)
  {
    id: "AFF-STAFF-1004",
    user_id: "ADM-1001",
    staff_name: "Suresh Mohapatra",
    email: "admin@cityhospital.org",
    phone: "+91 674 2550101",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_name: "City Healthcare Group",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    role_title: "Facility Operations Director",
    staff_role: "FACILITY_ADMIN",
    status: "ACTIVE",
    start_date: "2024-01-01",
    created_at: "2024-01-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

let memoryDoctorAffiliations: HealthcareDoctorAffiliation[] = [...DEFAULT_DOCTOR_AFFILIATIONS];
let memoryStaffAffiliations: HealthcareStaffAffiliation[] = [...DEFAULT_STAFF_AFFILIATIONS];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

// ------------------------------------------------------------
// DOCTOR AFFILIATIONS REPOSITORY
// ------------------------------------------------------------

export function getAllDoctorAffiliations(): HealthcareDoctorAffiliation[] {
  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(DOCTOR_AFFILIATIONS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(DOCTOR_AFFILIATIONS_KEY, JSON.stringify(DEFAULT_DOCTOR_AFFILIATIONS));
    } catch (e) {}
  }
  return memoryDoctorAffiliations;
}

export function getFacilityDoctors(
  facilityIdOrCode: string,
  includeInactive: boolean = false
): HealthcareDoctorAffiliation[] {
  if (!facilityIdOrCode) return [];
  const clean = facilityIdOrCode.trim().toLowerCase();
  const fac = getFacilityById(facilityIdOrCode);
  const facId = fac?.id.toLowerCase() || clean;
  const facCode = fac?.facility_code.toLowerCase() || clean;

  const all = getAllDoctorAffiliations();
  return all.filter((a) => {
    const match =
      a.facility_id.toLowerCase() === facId ||
      a.facility_id.toLowerCase() === facCode;
    if (!match) return false;
    return includeInactive ? true : a.status === "ACTIVE";
  });
}

export function getDoctorAffiliations(
  doctorId: string,
  includeInactive: boolean = false
): HealthcareDoctorAffiliation[] {
  if (!doctorId) return [];
  const clean = doctorId.trim().toLowerCase();
  const all = getAllDoctorAffiliations();
  return all.filter((a) => {
    const match = a.doctor_id.toLowerCase() === clean;
    if (!match) return false;
    return includeInactive ? true : a.status === "ACTIVE";
  });
}

export function saveDoctorAffiliations(affs: HealthcareDoctorAffiliation[]): void {
  memoryDoctorAffiliations = affs;
  if (isBrowser()) {
    try {
      localStorage.setItem(DOCTOR_AFFILIATIONS_KEY, JSON.stringify(affs));
    } catch (e) {}
  }
}

export function createDoctorAffiliation(
  data: Omit<HealthcareDoctorAffiliation, "id" | "created_at" | "updated_at"> & { id?: string }
): { success: boolean; affiliation?: HealthcareDoctorAffiliation; error?: string } {
  if (!data.doctor_id || !data.doctor_id.trim()) {
    return { success: false, error: "Doctor reference is required." };
  }
  if (!data.facility_id || !data.facility_id.trim()) {
    return { success: false, error: "Facility reference is required." };
  }

  const facility = getFacilityById(data.facility_id);
  if (!facility) {
    return { success: false, error: `Facility '${data.facility_id}' not found.` };
  }

  let deptName = "";
  if (data.department_id) {
    const dept = getDepartmentById(data.department_id);
    deptName = dept?.name || "";
  }

  const all = getAllDoctorAffiliations();
  const existing = all.find(
    (a) =>
      a.doctor_id.toLowerCase() === data.doctor_id.toLowerCase() &&
      a.facility_id.toLowerCase() === facility.facility_code.toLowerCase() &&
      a.status === "ACTIVE"
  );

  if (existing) {
    return {
      success: false,
      error: `Doctor is already actively affiliated with ${facility.name}.`,
    };
  }

  const now = new Date().toISOString();
  const newAff: HealthcareDoctorAffiliation = {
    id: data.id || `AFF-DOC-${(1000 + all.length + 1).toString()}`,
    doctor_id: data.doctor_id.trim().toUpperCase(),
    doctor_name: data.doctor_name || "Doctor",
    specialization: data.specialization || "General Medicine",
    medical_reg_no: data.medical_reg_no || "",
    organization_id: facility.organization_id,
    organization_name: facility.organization_name,
    facility_id: facility.facility_code,
    facility_name: facility.name,
    department_id: data.department_id || undefined,
    department_name: deptName || undefined,
    role_title: data.role_title || "Consulting Physician",
    consultation_fee: data.consultation_fee !== undefined ? data.consultation_fee : 500,
    opd_room: data.opd_room || "OPD Room 1",
    schedule_notes: data.schedule_notes || "",
    status: data.status || "ACTIVE",
    verification_status: data.verification_status || "verified",
    start_date: data.start_date || new Date().toISOString().split("T")[0],
    created_at: now,
    updated_at: now,
  };

  all.push(newAff);
  saveDoctorAffiliations(all);
  return { success: true, affiliation: newAff };
}

export function approveDoctorAffiliation(
  facilityIdOrCode: string,
  doctorIdentifier: string
): { success: boolean; affiliation?: HealthcareDoctorAffiliation; error?: string } {
  const all = getAllDoctorAffiliations();
  const fac = getFacilityById(facilityIdOrCode);
  const targetFac = fac?.facility_code.toLowerCase() || facilityIdOrCode.trim().toLowerCase();

  const index = all.findIndex(
    (a) =>
      a.doctor_id.toLowerCase() === doctorIdentifier.toLowerCase() &&
      a.facility_id.toLowerCase() === targetFac
  );

  if (index >= 0) {
    all[index].status = "ACTIVE";
    all[index].verification_status = "verified";
    all[index].updated_at = new Date().toISOString();
    saveDoctorAffiliations(all);
    return { success: true, affiliation: all[index] };
  }

  // Create new active affiliation
  return createDoctorAffiliation({
    doctor_id: doctorIdentifier,
    doctor_name: doctorIdentifier,
    facility_id: facilityIdOrCode,
    organization_id: fac?.organization_id || "11111111-1111-1111-1111-111111111101",
    role_title: "Consulting Physician",
    status: "ACTIVE",
    verification_status: "verified",
  });
}

export function rejectDoctorAffiliation(
  facilityIdOrCode: string,
  doctorIdentifier: string
): { success: boolean; error?: string } {
  const all = getAllDoctorAffiliations();
  const fac = getFacilityById(facilityIdOrCode);
  const targetFac = fac?.facility_code.toLowerCase() || facilityIdOrCode.trim().toLowerCase();

  const index = all.findIndex(
    (a) =>
      a.doctor_id.toLowerCase() === doctorIdentifier.toLowerCase() &&
      a.facility_id.toLowerCase() === targetFac
  );

  if (index >= 0) {
    all[index].status = "REJECTED";
    all[index].verification_status = "rejected";
    all[index].updated_at = new Date().toISOString();
    saveDoctorAffiliations(all);
  }
  return { success: true };
}

export function endDoctorAffiliation(
  facilityIdOrCode: string,
  doctorIdentifier: string,
  reason?: string
): { success: boolean; affiliation?: HealthcareDoctorAffiliation; error?: string } {
  const all = getAllDoctorAffiliations();
  const fac = getFacilityById(facilityIdOrCode);
  const targetFac = fac?.facility_code.toLowerCase() || facilityIdOrCode.trim().toLowerCase();

  const index = all.findIndex(
    (a) =>
      a.doctor_id.toLowerCase() === doctorIdentifier.toLowerCase() &&
      a.facility_id.toLowerCase() === targetFac &&
      a.status === "ACTIVE"
  );

  if (index >= 0) {
    all[index].status = "ENDED";
    all[index].end_date = new Date().toISOString().split("T")[0];
    all[index].updated_at = new Date().toISOString();
    saveDoctorAffiliations(all);
    return { success: true, affiliation: all[index] };
  }

  return { success: false, error: "Active doctor affiliation was not found." };
}

// ------------------------------------------------------------
// STAFF AFFILIATIONS REPOSITORY
// ------------------------------------------------------------

export function getAllStaffAffiliations(): HealthcareStaffAffiliation[] {
  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(STAFF_AFFILIATIONS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STAFF_AFFILIATIONS_KEY, JSON.stringify(DEFAULT_STAFF_AFFILIATIONS));
    } catch (e) {}
  }
  return memoryStaffAffiliations;
}

export function getFacilityStaff(
  facilityIdOrCode: string,
  includeInactive: boolean = false
): HealthcareStaffAffiliation[] {
  if (!facilityIdOrCode) return [];
  const clean = facilityIdOrCode.trim().toLowerCase();
  const fac = getFacilityById(facilityIdOrCode);
  const facId = fac?.id.toLowerCase() || clean;
  const facCode = fac?.facility_code.toLowerCase() || clean;

  const all = getAllStaffAffiliations();
  return all.filter((s) => {
    const match =
      s.facility_id.toLowerCase() === facId ||
      s.facility_id.toLowerCase() === facCode;
    if (!match) return false;
    return includeInactive ? true : s.status === "ACTIVE";
  });
}

export function getUserStaffAffiliations(
  userId: string,
  includeInactive: boolean = false
): HealthcareStaffAffiliation[] {
  if (!userId) return [];
  const clean = userId.trim().toLowerCase();
  const all = getAllStaffAffiliations();
  return all.filter((s) => {
    const match = s.user_id.toLowerCase() === clean;
    if (!match) return false;
    return includeInactive ? true : s.status === "ACTIVE";
  });
}

export function saveStaffAffiliations(staffList: HealthcareStaffAffiliation[]): void {
  memoryStaffAffiliations = staffList;
  if (isBrowser()) {
    try {
      localStorage.setItem(STAFF_AFFILIATIONS_KEY, JSON.stringify(staffList));
    } catch (e) {}
  }
}

export function createStaffAffiliation(
  data: Omit<HealthcareStaffAffiliation, "id" | "created_at" | "updated_at"> & { id?: string }
): { success: boolean; affiliation?: HealthcareStaffAffiliation; error?: string } {
  if (!data.user_id || !data.user_id.trim()) {
    return { success: false, error: "Staff user reference is required." };
  }
  if (!data.facility_id || !data.facility_id.trim()) {
    return { success: false, error: "Facility reference is required." };
  }

  const facility = getFacilityById(data.facility_id);
  if (!facility) {
    return { success: false, error: `Facility '${data.facility_id}' not found.` };
  }

  let deptName = "";
  if (data.department_id) {
    const dept = getDepartmentById(data.department_id);
    deptName = dept?.name || "";
  }

  const all = getAllStaffAffiliations();
  const existing = all.find(
    (s) =>
      s.user_id.toLowerCase() === data.user_id.toLowerCase() &&
      s.facility_id.toLowerCase() === facility.facility_code.toLowerCase() &&
      s.status === "ACTIVE"
  );

  if (existing) {
    return {
      success: false,
      error: `Staff member already has an active role at ${facility.name}.`,
    };
  }

  const now = new Date().toISOString();
  const newStaff: HealthcareStaffAffiliation = {
    id: data.id || `AFF-STAFF-${(1000 + all.length + 1).toString()}`,
    user_id: data.user_id.trim().toUpperCase(),
    staff_name: data.staff_name || "Staff Member",
    email: data.email || "",
    phone: data.phone || "",
    organization_id: facility.organization_id,
    organization_name: facility.organization_name,
    facility_id: facility.facility_code,
    facility_name: facility.name,
    department_id: data.department_id || undefined,
    department_name: deptName || undefined,
    role_title: data.role_title || "Hospital Staff",
    staff_role: data.staff_role || "STAFF",
    status: data.status || "ACTIVE",
    start_date: data.start_date || new Date().toISOString().split("T")[0],
    created_at: now,
    updated_at: now,
  };

  all.push(newStaff);
  saveStaffAffiliations(all);
  return { success: true, affiliation: newStaff };
}

export function endStaffAffiliation(
  facilityIdOrCode: string,
  userId: string,
  reason?: string
): { success: boolean; affiliation?: HealthcareStaffAffiliation; error?: string } {
  const all = getAllStaffAffiliations();
  const fac = getFacilityById(facilityIdOrCode);
  const targetFac = fac?.facility_code.toLowerCase() || facilityIdOrCode.trim().toLowerCase();

  const index = all.findIndex(
    (s) =>
      s.user_id.toLowerCase() === userId.toLowerCase() &&
      s.facility_id.toLowerCase() === targetFac &&
      s.status === "ACTIVE"
  );

  if (index >= 0) {
    all[index].status = "ENDED";
    all[index].end_date = new Date().toISOString().split("T")[0];
    all[index].updated_at = new Date().toISOString();
    saveStaffAffiliations(all);
    return { success: true, affiliation: all[index] };
  }

  return { success: false, error: "Active staff affiliation was not found." };
}

// ------------------------------------------------------------
// SUSPENSION & REACTIVATION LIFECYCLE (PHASE 5.3)
// ------------------------------------------------------------

export function suspendDoctorAffiliation(
  facilityIdOrCode: string,
  doctorId: string,
  reason?: string
): { success: boolean; affiliation?: HealthcareDoctorAffiliation; error?: string } {
  const all = getAllDoctorAffiliations();
  const fac = getFacilityById(facilityIdOrCode);
  const targetFac = fac?.facility_code.toLowerCase() || facilityIdOrCode.trim().toLowerCase();

  const index = all.findIndex(
    (a) =>
      a.doctor_id.toLowerCase() === doctorId.toLowerCase() &&
      a.facility_id.toLowerCase() === targetFac &&
      a.status === "ACTIVE"
  );

  if (index >= 0) {
    all[index].status = "SUSPENDED";
    all[index].updated_at = new Date().toISOString();
    saveDoctorAffiliations(all);
    return { success: true, affiliation: all[index] };
  }

  return { success: false, error: "Active doctor affiliation not found." };
}

export function reactivateDoctorAffiliation(
  facilityIdOrCode: string,
  doctorId: string
): { success: boolean; affiliation?: HealthcareDoctorAffiliation; error?: string } {
  const all = getAllDoctorAffiliations();
  const fac = getFacilityById(facilityIdOrCode);
  const targetFac = fac?.facility_code.toLowerCase() || facilityIdOrCode.trim().toLowerCase();

  const index = all.findIndex(
    (a) =>
      a.doctor_id.toLowerCase() === doctorId.toLowerCase() &&
      a.facility_id.toLowerCase() === targetFac &&
      a.status === "SUSPENDED"
  );

  if (index >= 0) {
    all[index].status = "ACTIVE";
    all[index].updated_at = new Date().toISOString();
    saveDoctorAffiliations(all);
    return { success: true, affiliation: all[index] };
  }

  return { success: false, error: "Suspended doctor affiliation not found." };
}

export function suspendStaffAffiliation(
  facilityIdOrCode: string,
  userId: string,
  reason?: string
): { success: boolean; affiliation?: HealthcareStaffAffiliation; error?: string } {
  const all = getAllStaffAffiliations();
  const fac = getFacilityById(facilityIdOrCode);
  const targetFac = fac?.facility_code.toLowerCase() || facilityIdOrCode.trim().toLowerCase();

  const index = all.findIndex(
    (s) =>
      s.user_id.toLowerCase() === userId.toLowerCase() &&
      s.facility_id.toLowerCase() === targetFac &&
      s.status === "ACTIVE"
  );

  if (index >= 0) {
    all[index].status = "SUSPENDED";
    all[index].updated_at = new Date().toISOString();
    saveStaffAffiliations(all);
    return { success: true, affiliation: all[index] };
  }

  return { success: false, error: "Active staff affiliation not found." };
}

export function reactivateStaffAffiliation(
  facilityIdOrCode: string,
  userId: string
): { success: boolean; affiliation?: HealthcareStaffAffiliation; error?: string } {
  const all = getAllStaffAffiliations();
  const fac = getFacilityById(facilityIdOrCode);
  const targetFac = fac?.facility_code.toLowerCase() || facilityIdOrCode.trim().toLowerCase();

  const index = all.findIndex(
    (s) =>
      s.user_id.toLowerCase() === userId.toLowerCase() &&
      s.facility_id.toLowerCase() === targetFac &&
      s.status === "SUSPENDED"
  );

  if (index >= 0) {
    all[index].status = "ACTIVE";
    all[index].updated_at = new Date().toISOString();
    saveStaffAffiliations(all);
    return { success: true, affiliation: all[index] };
  }

  return { success: false, error: "Suspended staff affiliation not found." };
}

// ------------------------------------------------------------
// INVITATION ARCHITECTURE (PHASE 5.3)
// ------------------------------------------------------------

const INVITATIONS_STORAGE_KEY = "medora_affiliation_invitations_v5";

export const DEFAULT_AFFILIATION_INVITATIONS: AffiliationInvitation[] = [
  {
    id: "INV-1001",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_name: "City Healthcare Group",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1002",
    department_name: "General Medicine & Internal Care",
    target_user_id: "DOC-1003",
    target_name: "Dr. Sunita Rao",
    target_email: "sunita@cityhospital.org",
    role_type: "DOCTOR",
    role_title: "Senior Consultant",
    specialization: "General Medicine",
    consultation_fee: 450,
    opd_room: "OPD Room 108",
    invited_by_id: "USR-ADMIN-1001",
    invited_by_name: "Hospital Super Administrator",
    status: "PENDING",
    expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    created_at: "2026-01-10T10:00:00Z",
  },
  {
    id: "INV-1002",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_name: "City Healthcare Group",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1006",
    department_name: "Pathology & Central Diagnostic Lab",
    target_user_id: "STAFF-1004",
    target_name: "Debashis Panda",
    target_email: "debashis@cityhospital.org",
    role_type: "STAFF",
    role_title: "Senior Hematology Lab Technician",
    staff_role: "LAB_STAFF",
    invited_by_id: "USR-ADMIN-1001",
    invited_by_name: "Hospital Super Administrator",
    status: "PENDING",
    expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    created_at: "2026-01-10T11:00:00Z",
  },
];

let memoryInvitations: AffiliationInvitation[] = [...DEFAULT_AFFILIATION_INVITATIONS];

export function getAllAffiliationInvitations(): AffiliationInvitation[] {
  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(INVITATIONS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_AFFILIATION_INVITATIONS));
    } catch (e) {}
  }
  return memoryInvitations;
}

export function saveAffiliationInvitations(invites: AffiliationInvitation[]): void {
  memoryInvitations = invites;
  if (isBrowser()) {
    try {
      localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invites));
    } catch (e) {}
  }
}

export function getFacilityInvitations(facilityIdOrCode: string): AffiliationInvitation[] {
  if (!facilityIdOrCode) return [];
  const clean = facilityIdOrCode.trim().toLowerCase();
  const fac = getFacilityById(facilityIdOrCode);
  const facId = fac?.id.toLowerCase() || clean;
  const facCode = fac?.facility_code.toLowerCase() || clean;

  const all = getAllAffiliationInvitations();
  return all.filter(
    (inv) =>
      inv.facility_id.toLowerCase() === facId ||
      inv.facility_id.toLowerCase() === facCode
  );
}

export function getPendingInvitationsForUser(userIdOrEmail: string): AffiliationInvitation[] {
  if (!userIdOrEmail) return [];
  const clean = userIdOrEmail.trim().toLowerCase();
  const all = getAllAffiliationInvitations();
  const now = new Date().toISOString();

  return all.filter((inv) => {
    const isTarget =
      inv.target_user_id?.toLowerCase() === clean ||
      inv.target_email?.toLowerCase() === clean;
    if (!isTarget) return false;
    if (inv.status !== "PENDING") return false;
    return inv.expires_at > now;
  });
}

export function createAffiliationInvitation(
  data: Omit<
    AffiliationInvitation,
    | "id"
    | "created_at"
    | "updated_at"
    | "organization_id"
    | "organization_name"
    | "facility_name"
    | "status"
    | "expires_at"
    | "role_title"
    | "invited_by_name"
  > & {
    id?: string;
    organization_id?: string;
    organization_name?: string;
    facility_name?: string;
    status?: AffiliationInvitation["status"];
    expires_at?: string;
    role_title?: string;
    invited_by_name?: string;
  }
): { success: boolean; invitation?: AffiliationInvitation; error?: string } {
  if (!data.facility_id || !data.facility_id.trim()) {
    return { success: false, error: "Facility reference is required." };
  }
  if (!data.target_user_id && !data.target_email) {
    return { success: false, error: "Target user ID or email is required." };
  }

  const fac = getFacilityById(data.facility_id);
  if (!fac) {
    return { success: false, error: `Facility '${data.facility_id}' not found.` };
  }

  const all = getAllAffiliationInvitations();
  const existingPending = all.find(
    (inv) =>
      inv.facility_id.toLowerCase() === fac.facility_code.toLowerCase() &&
      inv.target_user_id?.toLowerCase() === data.target_user_id?.toLowerCase() &&
      inv.status === "PENDING"
  );

  if (existingPending) {
    return { success: false, error: "A pending invitation already exists for this person at this facility." };
  }

  const now = new Date().toISOString();
  const newInvite: AffiliationInvitation = {
    id: data.id || `INV-${(1000 + all.length + 1).toString()}`,
    organization_id: fac.organization_id,
    organization_name: fac.organization_name || "",
    facility_id: fac.facility_code,
    facility_name: fac.name,
    department_id: data.department_id || undefined,
    department_name: data.department_name || undefined,
    target_user_id: data.target_user_id?.trim().toUpperCase(),
    target_name: data.target_name || "Invited Professional",
    target_email: data.target_email || "",
    role_type: data.role_type || "DOCTOR",
    role_title: data.role_title || "Practitioner",
    staff_role: data.staff_role || undefined,
    specialization: data.specialization || undefined,
    consultation_fee: data.consultation_fee,
    opd_room: data.opd_room,
    invited_by_id: data.invited_by_id,
    invited_by_name: data.invited_by_name || "Administrator",
    status: "PENDING",
    expires_at: data.expires_at || new Date(Date.now() + 14 * 86400000).toISOString(),
    created_at: now,
    updated_at: now,
  };

  all.push(newInvite);
  saveAffiliationInvitations(all);
  return { success: true, invitation: newInvite };
}

export function acceptAffiliationInvitation(
  invitationId: string,
  actor: { id: string; name?: string }
): { success: boolean; invitation?: AffiliationInvitation; error?: string } {
  const all = getAllAffiliationInvitations();
  const index = all.findIndex((i) => i.id.toLowerCase() === invitationId.trim().toLowerCase());

  if (index < 0) {
    return { success: false, error: "Invitation not found." };
  }

  const invite = all[index];
  if (invite.status !== "PENDING") {
    return { success: false, error: `Cannot accept invitation with status '${invite.status}'.` };
  }

  if (new Date(invite.expires_at) < new Date()) {
    invite.status = "EXPIRED";
    saveAffiliationInvitations(all);
    return { success: false, error: "Invitation has expired." };
  }

  invite.status = "ACCEPTED";
  invite.updated_at = new Date().toISOString();
  saveAffiliationInvitations(all);

  // Automatically create the active affiliation
  if (invite.role_type === "DOCTOR") {
    createDoctorAffiliation({
      doctor_id: invite.target_user_id || actor.id,
      doctor_name: invite.target_name || actor.name || "Doctor",
      specialization: invite.specialization || "General Medicine",
      organization_id: invite.organization_id,
      facility_id: invite.facility_id,
      department_id: invite.department_id,
      role_title: invite.role_title,
      consultation_fee: invite.consultation_fee || 500,
      opd_room: invite.opd_room || "OPD Room 1",
      status: "ACTIVE",
      verification_status: "verified",
    });
  } else {
    createStaffAffiliation({
      user_id: invite.target_user_id || actor.id,
      staff_name: invite.target_name || actor.name || "Staff Member",
      email: invite.target_email || "",
      organization_id: invite.organization_id,
      facility_id: invite.facility_id,
      department_id: invite.department_id,
      role_title: invite.role_title,
      staff_role: invite.staff_role || "STAFF",
      status: "ACTIVE",
    });
  }

  return { success: true, invitation: invite };
}

export function rejectAffiliationInvitation(
  invitationId: string,
  actor: { id: string; name?: string },
  reason?: string
): { success: boolean; invitation?: AffiliationInvitation; error?: string } {
  const all = getAllAffiliationInvitations();
  const index = all.findIndex((i) => i.id.toLowerCase() === invitationId.trim().toLowerCase());

  if (index < 0) {
    return { success: false, error: "Invitation not found." };
  }

  const invite = all[index];
  if (invite.status !== "PENDING") {
    return { success: false, error: `Cannot reject invitation with status '${invite.status}'.` };
  }

  invite.status = "REJECTED";
  invite.updated_at = new Date().toISOString();
  saveAffiliationInvitations(all);
  return { success: true, invitation: invite };
}

export function revokeAffiliationInvitation(
  invitationId: string,
  actor: { id: string; name?: string },
  reason?: string
): { success: boolean; invitation?: AffiliationInvitation; error?: string } {
  const all = getAllAffiliationInvitations();
  const index = all.findIndex((i) => i.id.toLowerCase() === invitationId.trim().toLowerCase());

  if (index < 0) {
    return { success: false, error: "Invitation not found." };
  }

  const invite = all[index];
  if (invite.status !== "PENDING") {
    return { success: false, error: `Cannot revoke invitation with status '${invite.status}'.` };
  }

  invite.status = "REVOKED";
  invite.updated_at = new Date().toISOString();
  saveAffiliationInvitations(all);
  return { success: true, invitation: invite };
}

// ------------------------------------------------------------
// DEPARTMENT HEAD ASSIGNMENT ENGINE (PHASE 5.3)
// ------------------------------------------------------------

const DEPT_HEAD_STORAGE_KEY = "medora_dept_head_assignments_v5";

export const DEFAULT_DEPARTMENT_HEAD_ASSIGNMENTS: DepartmentHeadAssignment[] = [
  {
    id: "DHA-1001",
    facility_id: "FAC-1001",
    department_id: "DEP-1001",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    status: "ACTIVE",
    start_date: "2025-01-01",
    assigned_by_id: "USR-ADMIN-1001",
    assigned_by_name: "Hospital Administration",
    created_at: "2025-01-01T09:00:00Z",
  },
  {
    id: "DHA-1002",
    facility_id: "FAC-1001",
    department_id: "DEP-1004",
    doctor_id: "DOC-1002",
    doctor_name: "Dr. Rajesh Sharma",
    status: "ACTIVE",
    start_date: "2025-01-01",
    assigned_by_id: "USR-ADMIN-1001",
    assigned_by_name: "Hospital Administration",
    created_at: "2025-01-01T09:00:00Z",
  },
];

let memoryDeptHeads: DepartmentHeadAssignment[] = [...DEFAULT_DEPARTMENT_HEAD_ASSIGNMENTS];

export function getAllDepartmentHeadAssignments(): DepartmentHeadAssignment[] {
  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(DEPT_HEAD_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(DEPT_HEAD_STORAGE_KEY, JSON.stringify(DEFAULT_DEPARTMENT_HEAD_ASSIGNMENTS));
    } catch (e) {}
  }
  return memoryDeptHeads;
}

export function saveDepartmentHeadAssignments(assignments: DepartmentHeadAssignment[]): void {
  memoryDeptHeads = assignments;
  if (isBrowser()) {
    try {
      localStorage.setItem(DEPT_HEAD_STORAGE_KEY, JSON.stringify(assignments));
    } catch (e) {}
  }
}

export function getDepartmentHead(departmentId: string): DepartmentHeadAssignment | null {
  if (!departmentId) return null;
  const clean = departmentId.trim().toLowerCase();
  const all = getAllDepartmentHeadAssignments();
  return (
    all.find((a) => a.department_id.toLowerCase() === clean && a.status === "ACTIVE") || null
  );
}

export function getDepartmentHeadHistory(departmentId: string): DepartmentHeadAssignment[] {
  if (!departmentId) return [];
  const clean = departmentId.trim().toLowerCase();
  const all = getAllDepartmentHeadAssignments();
  return all.filter((a) => a.department_id.toLowerCase() === clean);
}

export function assignDepartmentHead(
  facilityIdOrCode: string,
  departmentId: string,
  doctorId: string,
  assignedBy: { id: string; name: string }
): { success: boolean; assignment?: DepartmentHeadAssignment; error?: string } {
  const dept = getDepartmentById(departmentId);
  if (!dept) {
    return { success: false, error: `Department '${departmentId}' not found.` };
  }

  const fac = getFacilityById(facilityIdOrCode);
  if (!fac) {
    return { success: false, error: `Facility '${facilityIdOrCode}' not found.` };
  }

  // Check doctor has active affiliation at this facility
  const docAffs = getFacilityDoctors(fac.facility_code);
  const docAff = docAffs.find(
    (a) => a.doctor_id.toLowerCase() === doctorId.trim().toLowerCase() && a.status === "ACTIVE"
  );
  if (!docAff) {
    return { success: false, error: `Doctor '${doctorId}' is not actively affiliated with ${fac.name}.` };
  }

  const all = getAllDepartmentHeadAssignments();
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  // End any currently active head assignment for this department
  for (const a of all) {
    if (a.department_id.toLowerCase() === dept.id.toLowerCase() && a.status === "ACTIVE") {
      a.status = "ENDED";
      a.end_date = today;
      a.updated_at = now;
    }
  }

  const newAssignment: DepartmentHeadAssignment = {
    id: `DHA-${(1000 + all.length + 1).toString()}`,
    facility_id: fac.facility_code,
    department_id: dept.id,
    doctor_id: docAff.doctor_id,
    doctor_name: docAff.doctor_name,
    status: "ACTIVE",
    start_date: today,
    assigned_by_id: assignedBy.id,
    assigned_by_name: assignedBy.name,
    created_at: now,
    updated_at: now,
  };

  all.push(newAssignment);
  saveDepartmentHeadAssignments(all);
  return { success: true, assignment: newAssignment };
}

// ------------------------------------------------------------
// AFFILIATION VALIDATION HELPERS (PHASE 5.3 & 5.4)
// ------------------------------------------------------------

export function isDoctorActiveAtFacility(doctorId: string, facilityIdOrCode: string): boolean {
  if (!doctorId || !facilityIdOrCode) return false;
  const docs = getFacilityDoctors(facilityIdOrCode, false);
  return docs.some((d) => d.doctor_id.toLowerCase() === doctorId.trim().toLowerCase() && d.status === "ACTIVE");
}

export function isStaffActiveAtFacility(userId: string, facilityIdOrCode: string): boolean {
  if (!userId || !facilityIdOrCode) return false;
  const staff = getFacilityStaff(facilityIdOrCode, false);
  return staff.some((s) => s.user_id.toLowerCase() === userId.trim().toLowerCase() && s.status === "ACTIVE");
}

export function getDoctorAffiliationHistory(doctorId: string): HealthcareDoctorAffiliation[] {
  return getDoctorAffiliations(doctorId, true);
}

export function getStaffAffiliationHistory(userId: string): HealthcareStaffAffiliation[] {
  return getUserStaffAffiliations(userId, true);
}

export function resetAffiliationStore(): void {
  memoryDoctorAffiliations = [...DEFAULT_DOCTOR_AFFILIATIONS];
  memoryStaffAffiliations = [...DEFAULT_STAFF_AFFILIATIONS];
  memoryInvitations = [...DEFAULT_AFFILIATION_INVITATIONS];
  memoryDeptHeads = [...DEFAULT_DEPARTMENT_HEAD_ASSIGNMENTS];
  if (isBrowser()) {
    try {
      localStorage.setItem(DOCTOR_AFFILIATIONS_KEY, JSON.stringify(DEFAULT_DOCTOR_AFFILIATIONS));
      localStorage.setItem(STAFF_AFFILIATIONS_KEY, JSON.stringify(DEFAULT_STAFF_AFFILIATIONS));
      localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_AFFILIATION_INVITATIONS));
      localStorage.setItem(DEPT_HEAD_STORAGE_KEY, JSON.stringify(DEFAULT_DEPARTMENT_HEAD_ASSIGNMENTS));
    } catch (e) {}
  }
}

