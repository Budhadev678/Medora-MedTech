// ============================================================
// MEDORA — HEALTHCARE DEPARTMENT STORE
// PHASE 5.2: DEPARTMENTS & CLINICAL UNITS
// ============================================================

import type { HealthcareDepartment, HealthcareDepartmentStatus } from "@/types/database.types";
import { getFacilityById } from "./facility-store";

const DEPARTMENTS_STORAGE_KEY = "medora_departments_v5";

export const DEFAULT_DEPARTMENTS: HealthcareDepartment[] = [
  // City Hospital — Bhubaneswar Main Campus (FAC-1001)
  {
    id: "DEP-1001",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "Cardiology & Cath Lab",
    code: "CARD",
    description: "Interventional cardiology, non-invasive diagnostics (ECG, 2D Echo, TMT), and cardiac critical care.",
    head_doctor_id: "DOC-1001",
    head_doctor_name: "Dr. Ananya Sharma",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-1002",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "Emergency & Trauma Care",
    code: "EMERG",
    description: "24/7 Level-1 trauma resuscitation, acute cardiac triage, and emergency observation bay.",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-1003",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "General Medicine & Inpatient Ward",
    code: "GENMED",
    description: "Internal medicine, infectious diseases, geriatric care, and metabolic disorder management.",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-1004",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "Neurology & Stroke Unit",
    code: "NEURO",
    description: "Comprehensive neurological evaluations, stroke management, EEG, and neuromuscular disorder care.",
    head_doctor_id: "DOC-1002",
    head_doctor_name: "Dr. Rajesh Sharma",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-1005",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "Orthopedics & Joint Replacement",
    code: "ORTHO",
    description: "Complex arthroplasty, fracture trauma management, sports injury rehabilitation, and arthroscopy.",
    head_doctor_id: "DOC-1003",
    head_doctor_name: "Dr. Rahul Verma",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-1006",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "Diagnostic Pathology & Imaging",
    code: "PATH",
    description: "Automated hematology, clinical chemistry, digital radiography, ultrasonography, and CT diagnostics.",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // City Hospital — Rourkela Trauma Center (FAC-1002)
  {
    id: "DEP-1007",
    facility_id: "FAC-1002",
    facility_name: "City Hospital — Rourkela Trauma Center",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "Emergency & Critical Care",
    code: "EMERG",
    description: "Regional trauma reception, ICU stabilization, and emergency triage.",
    status: "ACTIVE",
    created_at: "2025-08-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-1008",
    facility_id: "FAC-1002",
    facility_name: "City Hospital — Rourkela Trauma Center",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "General Medicine OPD",
    code: "GENMED",
    description: "Outpatient clinical consultation and chronic disease monitoring.",
    status: "ACTIVE",
    created_at: "2025-08-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-1009",
    facility_id: "FAC-1002",
    facility_name: "City Hospital — Rourkela Trauma Center",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "Orthopedics & Fracture Clinic",
    code: "ORTHO",
    description: "Trauma bone fixation, plaster room, and post-fracture physical rehabilitation.",
    status: "ACTIVE",
    created_at: "2025-08-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // City Hospital — Cuttack Specialty Center (FAC-1003)
  {
    id: "DEP-1010",
    facility_id: "FAC-1003",
    facility_name: "City Hospital — Cuttack Specialty Center",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "Cardiovascular Outpatient Suite",
    code: "CARD",
    description: "Outpatient cardiac evaluations, non-invasive diagnostics, and preventive checkups.",
    head_doctor_id: "DOC-1001",
    head_doctor_name: "Dr. Ananya Sharma",
    status: "ACTIVE",
    created_at: "2025-08-15T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-1011",
    facility_id: "FAC-1003",
    facility_name: "City Hospital — Cuttack Specialty Center",
    organization_id: "11111111-1111-1111-1111-111111111101",
    name: "General Medicine & Preventive Health",
    code: "GENMED",
    description: "Executive health checkups, diabetic care, and lifestyle medicine counseling.",
    status: "ACTIVE",
    created_at: "2025-08-15T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // Green Care Clinic — Day Outpatient Branch (FAC-2001)
  {
    id: "DEP-2001",
    facility_id: "FAC-2001",
    facility_name: "Green Care Clinic — Cantonment Branch",
    organization_id: "11111111-1111-1111-1111-111111111103",
    name: "General Medicine & Outpatient Suite",
    code: "GENMED",
    description: "Day clinic primary consultations, viral fever care, and health screening.",
    status: "ACTIVE",
    created_at: "2025-09-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-2002",
    facility_id: "FAC-2001",
    facility_name: "Green Care Clinic — Cantonment Branch",
    organization_id: "11111111-1111-1111-1111-111111111103",
    name: "Pediatrics & Immunization Desk",
    code: "PED",
    description: "Well-baby clinic, universal immunization schedules, and developmental tracking.",
    status: "ACTIVE",
    created_at: "2025-09-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-2003",
    facility_id: "FAC-2001",
    facility_name: "Green Care Clinic — Cantonment Branch",
    organization_id: "11111111-1111-1111-1111-111111111103",
    name: "Visiting Specialty & Cardiology Clinic",
    code: "CARD",
    description: "Evening specialty consultations with visiting consultant physicians.",
    head_doctor_id: "DOC-1001",
    head_doctor_name: "Dr. Ananya Sharma",
    status: "ACTIVE",
    created_at: "2025-09-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // ABC Diagnostics — Central Reference Lab (FAC-3001)
  {
    id: "DEP-3001",
    facility_id: "FAC-3001",
    facility_name: "ABC Diagnostics — Central Reference Lab",
    organization_id: "11111111-1111-1111-1111-111111111104",
    name: "Hematology & Clinical Pathology",
    code: "HEM",
    description: "Complete blood counts, peripheral blood smears, coagulation, and ESR testing.",
    status: "ACTIVE",
    created_at: "2025-09-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DEP-3002",
    facility_id: "FAC-3001",
    facility_name: "ABC Diagnostics — Central Reference Lab",
    organization_id: "11111111-1111-1111-1111-111111111104",
    name: "Biochemistry & Immunodiagnostics",
    code: "BIO",
    description: "Automated serum chemistry, liver/kidney panels, lipids, HbA1c, and hormones.",
    status: "ACTIVE",
    created_at: "2025-09-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

let memoryDepartments: HealthcareDepartment[] = [...DEFAULT_DEPARTMENTS];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAllDepartments(): HealthcareDepartment[] {
  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(DEFAULT_DEPARTMENTS));
    } catch (e) {}
  }
  return memoryDepartments;
}

export function getDepartmentsForFacility(
  facilityIdOrCode: string,
  includeInactive: boolean = false
): HealthcareDepartment[] {
  if (!facilityIdOrCode) return [];
  const clean = facilityIdOrCode.trim().toLowerCase();
  const fac = getFacilityById(facilityIdOrCode);
  const facId = fac?.id.toLowerCase() || clean;
  const facCode = fac?.facility_code.toLowerCase() || clean;

  const all = getAllDepartments();
  return all.filter((d) => {
    const matchesFac =
      d.facility_id.toLowerCase() === facId ||
      d.facility_id.toLowerCase() === facCode ||
      (d as any).facilityId?.toLowerCase() === facId ||
      (d as any).facilityId?.toLowerCase() === facCode;
    if (!matchesFac) return false;
    return includeInactive ? true : d.status === "ACTIVE";
  });
}

export function getDepartmentById(id: string): HealthcareDepartment | null {
  if (!id) return null;
  const clean = id.trim().toLowerCase();
  const all = getAllDepartments();
  return all.find((d) => d.id.toLowerCase() === clean) || null;
}

export function saveDepartments(depts: HealthcareDepartment[]): void {
  memoryDepartments = depts;
  if (isBrowser()) {
    try {
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(depts));
    } catch (e) {}
  }
}

export function checkDepartmentNameUnique(
  facilityIdOrCode: string,
  name: string,
  excludeDeptId?: string
): boolean {
  const existing = getDepartmentsForFacility(facilityIdOrCode, true);
  const cleanName = name.trim().toLowerCase();
  return !existing.some(
    (d) =>
      d.name.trim().toLowerCase() === cleanName &&
      (!excludeDeptId || d.id.toLowerCase() !== excludeDeptId.toLowerCase()) &&
      d.status === "ACTIVE"
  );
}

export function createDepartment(
  data: Omit<HealthcareDepartment, "id" | "created_at" | "updated_at"> & { id?: string }
): { success: boolean; department?: HealthcareDepartment; error?: string } {
  if (!data.name || !data.name.trim()) {
    return { success: false, error: "Department name is required." };
  }
  if (!data.facility_id || !data.facility_id.trim()) {
    return { success: false, error: "Facility reference is required." };
  }

  const facility = getFacilityById(data.facility_id);
  if (!facility) {
    return { success: false, error: `Facility '${data.facility_id}' was not found.` };
  }

  // Enforce unique department name within the same facility
  if (!checkDepartmentNameUnique(facility.id, data.name)) {
    return {
      success: false,
      error: `An active department named '${data.name}' already exists in ${facility.name}.`,
    };
  }

  const all = getAllDepartments();
  const nextId = `DEP-${(1000 + all.length + 1).toString()}`;
  const now = new Date().toISOString();

  const newDept: HealthcareDepartment = {
    id: data.id || nextId,
    facility_id: facility.facility_code,
    facility_name: facility.name,
    organization_id: facility.organization_id,
    name: data.name.trim(),
    code: data.code?.trim().toUpperCase() || data.name.substring(0, 4).toUpperCase(),
    description: data.description?.trim() || "",
    head_doctor_id: data.head_doctor_id,
    head_doctor_name: data.head_doctor_name,
    status: data.status || "ACTIVE",
    created_at: now,
    updated_at: now,
  };

  all.push(newDept);
  saveDepartments(all);
  return { success: true, department: newDept };
}

export function updateDepartment(
  id: string,
  updates: Partial<HealthcareDepartment>
): { success: boolean; department?: HealthcareDepartment; error?: string } {
  const all = getAllDepartments();
  const index = all.findIndex((d) => d.id.toLowerCase() === id.toLowerCase());

  if (index < 0) {
    return { success: false, error: "Department not found." };
  }

  const current = all[index];

  // If renaming, check uniqueness in the same facility
  if (updates.name && updates.name.trim().toLowerCase() !== current.name.toLowerCase()) {
    if (!checkDepartmentNameUnique(current.facility_id, updates.name, current.id)) {
      return {
        success: false,
        error: `Another active department in this facility already uses the name '${updates.name}'.`,
      };
    }
  }

  const updated: HealthcareDepartment = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  all[index] = updated;
  saveDepartments(all);
  return { success: true, department: updated };
}

export function deactivateDepartment(
  id: string,
  reason?: string
): { success: boolean; department?: HealthcareDepartment; error?: string } {
  return updateDepartment(id, {
    status: "INACTIVE",
  });
}

export function resetDepartmentStore(): void {
  memoryDepartments = [...DEFAULT_DEPARTMENTS];
  if (isBrowser()) {
    try {
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(DEFAULT_DEPARTMENTS));
    } catch (e) {}
  }
}
