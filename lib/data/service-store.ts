// ============================================================
// MEDORA — HEALTHCARE SERVICES & DOCTOR SERVICE ASSIGNMENT STORE
// PHASE 5.2: SERVICES & CAPABILITY ASSIGNMENTS
// ============================================================

import type {
  HealthcareService,
  HealthcareServiceStatus,
  HealthcareDoctorServiceAssignment,
} from "@/types/database.types";
import { getFacilityById } from "./facility-store";
import { getDepartmentById } from "./department-store";

const SERVICES_STORAGE_KEY = "medora_services_v5";
const SERVICE_ASSIGNMENTS_STORAGE_KEY = "medora_service_assignments_v5";

export const DEFAULT_SERVICES: HealthcareService[] = [
  // City Hospital — Bhubaneswar Main Campus (FAC-1001)
  {
    id: "SRV-1001",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1001",
    department_name: "Cardiology & Cath Lab",
    name: "Cardiology OPD Consultation",
    code: "CARD-CONS",
    category: "CONSULTATION",
    description: "Comprehensive cardiac clinical evaluation, blood pressure assessment, and treatment planning.",
    duration_minutes: 20,
    base_price: 500,
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "SRV-1002",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1001",
    department_name: "Cardiology & Cath Lab",
    name: "12-Lead Electrocardiogram (ECG)",
    code: "CARD-ECG",
    category: "DIAGNOSTIC",
    description: "Standard 12-lead digital electrocardiogram with immediate rhythm strip analysis.",
    duration_minutes: 15,
    base_price: 350,
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "SRV-1003",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1001",
    department_name: "Cardiology & Cath Lab",
    name: "2D Transthoracic Echocardiography (Echo)",
    code: "CARD-ECHO",
    category: "DIAGNOSTIC",
    description: "Color Doppler 2D echocardiography for valvular, structural, and ejection fraction assessment.",
    duration_minutes: 30,
    base_price: 1800,
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "SRV-1004",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: null, // Facility-level service
    name: "Emergency Level-1 Resuscitation & Triage",
    code: "EMERG-TRIAGE",
    category: "EMERGENCY",
    description: "Immediate airway, breathing, circulation triage and emergency stabilization.",
    duration_minutes: 15,
    base_price: 0,
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "SRV-1005",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1003",
    department_name: "General Medicine & Inpatient Ward",
    name: "General Internal Medicine Consultation",
    code: "MED-CONS",
    category: "CONSULTATION",
    description: "General medical checkup, chronic disease management, and initial diagnostic review.",
    duration_minutes: 15,
    base_price: 400,
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "SRV-1006",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1004",
    department_name: "Neurology & Stroke Unit",
    name: "Neurology Specialist Evaluation",
    code: "NEURO-CONS",
    category: "CONSULTATION",
    description: "Neurological clinical workup for headache, epilepsy, tremors, stroke prevention, and neuropathy.",
    duration_minutes: 25,
    base_price: 600,
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "SRV-1007",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1005",
    department_name: "Orthopedics & Joint Replacement",
    name: "Orthopedic & Joint Consultation",
    code: "ORTHO-CONS",
    category: "CONSULTATION",
    description: "Assessment of osteoarthritis, spine disorders, sports ligament tears, and fracture healing.",
    duration_minutes: 20,
    base_price: 500,
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "SRV-1008",
    facility_id: "FAC-1001",
    facility_name: "City Hospital — Bhubaneswar Main Campus",
    department_id: "DEP-1006",
    department_name: "Diagnostic Pathology & Imaging",
    name: "Digital Radiography (Chest X-Ray PA)",
    code: "RAD-XRAY",
    category: "IMAGING",
    description: "Digital high-resolution single-view chest radiography.",
    duration_minutes: 10,
    base_price: 450,
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // Green Care Clinic — Day Outpatient Branch (FAC-2001)
  {
    id: "SRV-2001",
    facility_id: "FAC-2001",
    facility_name: "Green Care Clinic — Cantonment Branch",
    department_id: "DEP-2001",
    department_name: "General Medicine & Outpatient Suite",
    name: "Day Outpatient Primary Care Consult",
    code: "CLN-PRIM-CONS",
    category: "CONSULTATION",
    description: "Outpatient primary evaluation, prescription renewals, and minor illness care.",
    duration_minutes: 15,
    base_price: 300,
    status: "ACTIVE",
    created_at: "2025-09-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "SRV-2002",
    facility_id: "FAC-2001",
    facility_name: "Green Care Clinic — Cantonment Branch",
    department_id: "DEP-2002",
    department_name: "Pediatrics & Immunization Desk",
    name: "Pediatric Well-Child & Vaccination",
    code: "PED-VAX",
    category: "CONSULTATION",
    description: "Pediatric wellness examination, milestone assessment, and vaccination administration.",
    duration_minutes: 20,
    base_price: 350,
    status: "ACTIVE",
    created_at: "2025-09-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "SRV-2003",
    facility_id: "FAC-2001",
    facility_name: "Green Care Clinic — Cantonment Branch",
    department_id: "DEP-2003",
    department_name: "Visiting Specialty & Cardiology Clinic",
    name: "Visiting Consultant Cardiology Evaluation",
    code: "CLN-CARD-CONS",
    category: "CONSULTATION",
    description: "Evening specialty cardiology consultation by visiting consultant.",
    duration_minutes: 20,
    base_price: 600,
    status: "ACTIVE",
    created_at: "2025-09-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // ABC Diagnostics — Central Lab (FAC-3001)
  {
    id: "SRV-3001",
    facility_id: "FAC-3001",
    facility_name: "ABC Diagnostics — Central Reference Lab",
    department_id: "DEP-3001",
    department_name: "Hematology & Clinical Pathology",
    name: "Complete Blood Count with Differential (CBC)",
    code: "LAB-CBC",
    category: "DIAGNOSTIC",
    description: "Automated 5-part differential complete blood count.",
    duration_minutes: 120,
    base_price: 350,
    status: "ACTIVE",
    created_at: "2025-09-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "SRV-3002",
    facility_id: "FAC-3001",
    facility_name: "ABC Diagnostics — Central Reference Lab",
    department_id: "DEP-3002",
    department_name: "Biochemistry & Immunodiagnostics",
    name: "Lipid Profile Panel (Cholesterol, Triglycerides, HDL, LDL)",
    code: "LAB-LIPID",
    category: "DIAGNOSTIC",
    description: "Complete cardiovascular lipid risk profile.",
    duration_minutes: 180,
    base_price: 650,
    status: "ACTIVE",
    created_at: "2025-09-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

export const DEFAULT_SERVICE_ASSIGNMENTS: HealthcareDoctorServiceAssignment[] = [
  // Dr. Ananya Sharma (DOC-1001) @ City Hospital (FAC-1001)
  {
    id: "DSA-1001",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    facility_id: "FAC-1001",
    department_id: "DEP-1001",
    service_id: "SRV-1001",
    service_name: "Cardiology OPD Consultation",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DSA-1002",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    facility_id: "FAC-1001",
    department_id: "DEP-1001",
    service_id: "SRV-1002",
    service_name: "12-Lead Electrocardiogram (ECG)",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "DSA-1003",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    facility_id: "FAC-1001",
    department_id: "DEP-1001",
    service_id: "SRV-1003",
    service_name: "2D Transthoracic Echocardiography (Echo)",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // Dr. Ananya Sharma (DOC-1001) @ Green Care Clinic (FAC-2001)
  {
    id: "DSA-2001",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    facility_id: "FAC-2001",
    department_id: "DEP-2003",
    service_id: "SRV-2003",
    service_name: "Visiting Consultant Cardiology Evaluation",
    status: "ACTIVE",
    created_at: "2025-09-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // Dr. Rajesh Sharma (DOC-1002) @ City Hospital (FAC-1001)
  {
    id: "DSA-1004",
    doctor_id: "DOC-1002",
    doctor_name: "Dr. Rajesh Sharma",
    facility_id: "FAC-1001",
    department_id: "DEP-1004",
    service_id: "SRV-1006",
    service_name: "Neurology Specialist Evaluation",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },

  // Dr. Rahul Verma (DOC-1003) @ City Hospital (FAC-1001)
  {
    id: "DSA-1005",
    doctor_id: "DOC-1003",
    doctor_name: "Dr. Rahul Verma",
    facility_id: "FAC-1001",
    department_id: "DEP-1005",
    service_id: "SRV-1007",
    service_name: "Orthopedic & Joint Consultation",
    status: "ACTIVE",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

let memoryServices: HealthcareService[] = [...DEFAULT_SERVICES];
let memoryAssignments: HealthcareDoctorServiceAssignment[] = [...DEFAULT_SERVICE_ASSIGNMENTS];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAllServices(): HealthcareService[] {
  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(SERVICES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
    } catch (e) {}
  }
  return memoryServices;
}

export function getServicesForFacility(
  facilityIdOrCode: string,
  includeInactive: boolean = false
): HealthcareService[] {
  if (!facilityIdOrCode) return [];
  const clean = facilityIdOrCode.trim().toLowerCase();
  const fac = getFacilityById(facilityIdOrCode);
  const facId = fac?.id.toLowerCase() || clean;
  const facCode = fac?.facility_code.toLowerCase() || clean;

  const all = getAllServices();
  return all.filter((s) => {
    const matchesFac =
      s.facility_id.toLowerCase() === facId ||
      s.facility_id.toLowerCase() === facCode ||
      (s as any).facilityId?.toLowerCase() === facId ||
      (s as any).facilityId?.toLowerCase() === facCode;
    if (!matchesFac) return false;
    return includeInactive ? true : s.status === "ACTIVE";
  });
}

export function getServicesForDepartment(
  deptId: string,
  includeInactive: boolean = false
): HealthcareService[] {
  if (!deptId) return [];
  const clean = deptId.trim().toLowerCase();
  const all = getAllServices();
  return all.filter((s) => {
    if (!s.department_id) return false;
    const matchesDept = s.department_id.toLowerCase() === clean;
    if (!matchesDept) return false;
    return includeInactive ? true : s.status === "ACTIVE";
  });
}

export function getServiceById(id: string): HealthcareService | null {
  if (!id) return null;
  const clean = id.trim().toLowerCase();
  const all = getAllServices();
  return all.find((s) => s.id.toLowerCase() === clean) || null;
}

export function saveServices(services: HealthcareService[]): void {
  memoryServices = services;
  if (isBrowser()) {
    try {
      localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
    } catch (e) {}
  }
}

export function createService(
  data: Omit<HealthcareService, "id" | "created_at" | "updated_at"> & { id?: string }
): { success: boolean; service?: HealthcareService; error?: string } {
  if (!data.name || !data.name.trim()) {
    return { success: false, error: "Service name is required." };
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
    if (!dept) {
      return { success: false, error: `Department '${data.department_id}' not found.` };
    }
    deptName = dept.name;
  }

  const all = getAllServices();
  const nextId = `SRV-${(1000 + all.length + 1).toString()}`;
  const now = new Date().toISOString();

  const newService: HealthcareService = {
    id: data.id || nextId,
    facility_id: facility.facility_code,
    facility_name: facility.name,
    department_id: data.department_id || null,
    department_name: deptName || undefined,
    name: data.name.trim(),
    code: data.code?.trim().toUpperCase() || data.name.substring(0, 4).toUpperCase(),
    category: data.category || "CONSULTATION",
    description: data.description?.trim() || "",
    duration_minutes: data.duration_minutes || 15,
    base_price: data.base_price !== undefined ? data.base_price : 0,
    status: data.status || "ACTIVE",
    created_at: now,
    updated_at: now,
  };

  all.push(newService);
  saveServices(all);
  return { success: true, service: newService };
}

export function updateService(
  id: string,
  updates: Partial<HealthcareService>
): { success: boolean; service?: HealthcareService; error?: string } {
  const all = getAllServices();
  const index = all.findIndex((s) => s.id.toLowerCase() === id.toLowerCase());

  if (index < 0) {
    return { success: false, error: "Service not found." };
  }

  const current = all[index];
  const updated: HealthcareService = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  all[index] = updated;
  saveServices(all);
  return { success: true, service: updated };
}

export function deactivateService(
  id: string,
  reason?: string
): { success: boolean; service?: HealthcareService; error?: string } {
  return updateService(id, {
    status: "INACTIVE",
  });
}

// ------------------------------------------------------------
// DOCTOR SERVICE ASSIGNMENTS REPOSITORY
// ------------------------------------------------------------

export function getAllDoctorServiceAssignments(): HealthcareDoctorServiceAssignment[] {
  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(SERVICE_ASSIGNMENTS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(SERVICE_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(DEFAULT_SERVICE_ASSIGNMENTS));
    } catch (e) {}
  }
  return memoryAssignments;
}

export function getDoctorAssignedServices(
  doctorId: string,
  facilityIdOrCode?: string
): HealthcareDoctorServiceAssignment[] {
  if (!doctorId) return [];
  const cleanDoc = doctorId.trim().toLowerCase();
  const all = getAllDoctorServiceAssignments();
  return all.filter((a) => {
    const docMatch = a.doctor_id.toLowerCase() === cleanDoc;
    if (!docMatch) return false;
    if (facilityIdOrCode) {
      const cleanFac = facilityIdOrCode.trim().toLowerCase();
      return a.facility_id.toLowerCase() === cleanFac;
    }
    return a.status === "ACTIVE";
  });
}

export function assignDoctorToService(
  doctorId: string,
  doctorName: string,
  facilityIdOrCode: string,
  serviceId: string
): { success: boolean; assignment?: HealthcareDoctorServiceAssignment; error?: string } {
  const service = getServiceById(serviceId);
  if (!service) {
    return { success: false, error: "Service not found." };
  }

  const all = getAllDoctorServiceAssignments();
  const existingIndex = all.findIndex(
    (a) =>
      a.doctor_id.toLowerCase() === doctorId.toLowerCase() &&
      a.facility_id.toLowerCase() === facilityIdOrCode.toLowerCase() &&
      a.service_id.toLowerCase() === serviceId.toLowerCase()
  );

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    all[existingIndex].status = "ACTIVE";
    all[existingIndex].updated_at = now;
    saveDoctorServiceAssignments(all);
    return { success: true, assignment: all[existingIndex] };
  }

  const newAssignment: HealthcareDoctorServiceAssignment = {
    id: `DSA-${(1000 + all.length + 1).toString()}`,
    doctor_id: doctorId,
    doctor_name: doctorName,
    facility_id: facilityIdOrCode,
    department_id: service.department_id || undefined,
    service_id: service.id,
    service_name: service.name,
    status: "ACTIVE",
    created_at: now,
    updated_at: now,
  };

  all.push(newAssignment);
  saveDoctorServiceAssignments(all);
  return { success: true, assignment: newAssignment };
}

export function removeDoctorFromService(
  doctorId: string,
  facilityIdOrCode: string,
  serviceId: string
): { success: boolean; error?: string } {
  const all = getAllDoctorServiceAssignments();
  const index = all.findIndex(
    (a) =>
      a.doctor_id.toLowerCase() === doctorId.toLowerCase() &&
      a.facility_id.toLowerCase() === facilityIdOrCode.toLowerCase() &&
      a.service_id.toLowerCase() === serviceId.toLowerCase()
  );

  if (index >= 0) {
    all[index].status = "INACTIVE";
    all[index].updated_at = new Date().toISOString();
    saveDoctorServiceAssignments(all);
  }
  return { success: true };
}

export function saveDoctorServiceAssignments(assignments: HealthcareDoctorServiceAssignment[]): void {
  memoryAssignments = assignments;
  if (isBrowser()) {
    try {
      localStorage.setItem(SERVICE_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
    } catch (e) {}
  }
}

export function resetServiceStore(): void {
  memoryServices = [...DEFAULT_SERVICES];
  memoryAssignments = [...DEFAULT_SERVICE_ASSIGNMENTS];
  if (isBrowser()) {
    try {
      localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
      localStorage.setItem(SERVICE_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(DEFAULT_SERVICE_ASSIGNMENTS));
    } catch (e) {}
  }
}
