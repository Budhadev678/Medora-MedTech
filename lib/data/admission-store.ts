// ============================================================
// MEDORA — AUTHORITATIVE ADMISSION & INPATIENT REPOSITORY
// Hospital Inpatient Admissions, Bed Allocation, and Discharge
// ============================================================

import { appendAuditEvent } from "@/lib/data/audit-store";
import { findIdentityById } from "@/lib/data/identity-store";

export type AdmissionStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "ADMITTED"
  | "INPATIENT"
  | "DISCHARGE_PENDING"
  | "DISCHARGED"
  | "CANCELLED";

export type AdmissionType = "EMERGENCY" | "PLANNED" | "DAY_CARE";

export type BedStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "UNAVAILABLE";

export interface HospitalBed {
  id: string;
  facility_id: string;
  facility_name: string;
  ward_name: string;
  room_number: string;
  bed_number: string;
  status: BedStatus;
  current_admission_id?: string;
  current_patient_name?: string;
}

export interface BedMovementRecord {
  id: string;
  admission_id: string;
  previous_bed: string;
  new_bed: string;
  transferred_at: string;
  transferred_by: string;
  reason?: string;
}

export interface HospitalAdmission {
  id: string;
  admission_reference: string;
  patient_id: string;
  patient_name: string;
  encounter_id?: string;
  doctor_id: string;
  doctor_name: string;
  department_name: string;
  facility_id: string;
  facility_name: string;
  admission_type: AdmissionType;
  status: AdmissionStatus;
  ward_name?: string;
  room_number?: string;
  bed_number?: string;
  bed_id?: string;
  reason_for_admission: string;
  requested_at: string;
  accepted_at?: string;
  admitted_at?: string;
  discharge_initiated_at?: string;
  discharged_at?: string;
  discharge_summary?: string;
  cancellation_reason?: string;
  movements: BedMovementRecord[];
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// SEEDED BEDS
// ------------------------------------------------------------
export const SEEDED_BEDS: HospitalBed[] = [
  { id: "BED-101", facility_id: "FAC-1001", facility_name: "City Hospital", ward_name: "Cardiology Inpatient Ward", room_number: "Room 301", bed_number: "Bed A", status: "OCCUPIED", current_admission_id: "ADM-1001", current_patient_name: "Rahul Verma" },
  { id: "BED-102", facility_id: "FAC-1001", facility_name: "City Hospital", ward_name: "Cardiology Inpatient Ward", room_number: "Room 301", bed_number: "Bed B", status: "AVAILABLE" },
  { id: "BED-103", facility_id: "FAC-1001", facility_name: "City Hospital", ward_name: "Cardiology ICU", room_number: "ICU Bay 1", bed_number: "Bed 1", status: "AVAILABLE" },
  { id: "BED-104", facility_id: "FAC-1001", facility_name: "City Hospital", ward_name: "General Medical Ward", room_number: "Room 205", bed_number: "Bed 1", status: "AVAILABLE" },
  { id: "BED-105", facility_id: "FAC-1001", facility_name: "City Hospital", ward_name: "General Medical Ward", room_number: "Room 205", bed_number: "Bed 2", status: "AVAILABLE" },
  { id: "BED-201", facility_id: "FAC-1004", facility_name: "Green Care Hospital", ward_name: "Cardiovascular Suite", room_number: "Room 401", bed_number: "Bed 1", status: "AVAILABLE" },
];

// ------------------------------------------------------------
// SEEDED ADMISSIONS
// ------------------------------------------------------------
export const SEEDED_ADMISSIONS: HospitalAdmission[] = [
  {
    id: "ADM-1001",
    admission_reference: "ADM-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    encounter_id: "ENC-1001",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    department_name: "Cardiology",
    facility_id: "FAC-1001",
    facility_name: "City Hospital",
    admission_type: "PLANNED",
    status: "INPATIENT",
    ward_name: "Cardiology Inpatient Ward",
    room_number: "Room 301",
    bed_number: "Bed A",
    bed_id: "BED-101",
    reason_for_admission: "Cardiac telemetry monitoring and blood pressure titration",
    requested_at: "2026-08-20T10:40:00Z",
    accepted_at: "2026-08-20T10:45:00Z",
    admitted_at: "2026-08-20T11:00:00Z",
    movements: [],
    created_at: "2026-08-20T10:40:00Z",
    updated_at: "2026-08-20T11:00:00Z",
  },
  {
    id: "ADM-1002",
    admission_reference: "ADM-1002",
    patient_id: "PAT-1002",
    patient_name: "Priya Patel",
    encounter_id: "ENC-1002",
    doctor_id: "DOC-1002",
    doctor_name: "Dr. Rajesh Sharma",
    department_name: "General Medicine",
    facility_id: "FAC-1001",
    facility_name: "City Hospital",
    admission_type: "EMERGENCY",
    status: "REQUESTED",
    reason_for_admission: "Acute dehydration and observation",
    requested_at: "2026-08-24T08:30:00Z",
    movements: [],
    created_at: "2026-08-24T08:30:00Z",
    updated_at: "2026-08-24T08:30:00Z",
  },
];

let inMemoryAdmissions: HospitalAdmission[] = [...SEEDED_ADMISSIONS];
let inMemoryBeds: HospitalBed[] = [...SEEDED_BEDS];

const STORAGE_KEY = "medora_hospital_admissions_v1";
const BEDS_STORAGE_KEY = "medora_hospital_beds_v1";

export function getAllAdmissions(): HospitalAdmission[] {
  if (typeof window === "undefined") return inMemoryAdmissions;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryAdmissions));
      return inMemoryAdmissions;
    }
    const parsed = JSON.parse(raw);
    inMemoryAdmissions = Array.isArray(parsed) ? parsed : inMemoryAdmissions;
    return inMemoryAdmissions;
  } catch {
    return inMemoryAdmissions;
  }
}

export function saveAdmissions(admissions: HospitalAdmission[]): void {
  inMemoryAdmissions = [...admissions];
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(admissions));
    window.dispatchEvent(new Event("medora-admissions-updated"));
  } catch (e) {
    console.error("Failed to save admissions:", e);
  }
}

export function getAllBeds(facilityId?: string): HospitalBed[] {
  if (typeof window === "undefined") {
    if (!facilityId) return inMemoryBeds;
    return inMemoryBeds.filter(b => b.facility_id === facilityId);
  }
  try {
    const raw = localStorage.getItem(BEDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BEDS_STORAGE_KEY, JSON.stringify(inMemoryBeds));
      return facilityId ? inMemoryBeds.filter(b => b.facility_id === facilityId) : inMemoryBeds;
    }
    const parsed = JSON.parse(raw);
    inMemoryBeds = Array.isArray(parsed) ? parsed : inMemoryBeds;
    return facilityId ? inMemoryBeds.filter(b => b.facility_id === facilityId) : inMemoryBeds;
  } catch {
    return facilityId ? inMemoryBeds.filter(b => b.facility_id === facilityId) : inMemoryBeds;
  }
}

export function saveBeds(beds: HospitalBed[]): void {
  inMemoryBeds = [...beds];
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BEDS_STORAGE_KEY, JSON.stringify(beds));
    window.dispatchEvent(new Event("medora-beds-updated"));
  } catch (e) {
    console.error("Failed to save beds:", e);
  }
}

export function getFacilityAdmissions(facilityId: string): HospitalAdmission[] {
  const all = getAllAdmissions();
  if (!facilityId) return all;
  return all.filter(a => a.facility_id === facilityId);
}

export const getAdmissionsForFacility = getFacilityAdmissions;

export function getPatientAdmissions(patientId: string): HospitalAdmission[] {
  const all = getAllAdmissions();
  return all.filter(a => a.patient_id.toLowerCase() === patientId.toLowerCase());
}

export function getAdmissionById(id: string): HospitalAdmission | null {
  const all = getAllAdmissions();
  const clean = id.trim().toUpperCase();
  return all.find(a => a.id === clean || a.admission_reference === clean) || null;
}

export function requestAdmission(params: {
  patientId: string;
  patientName: string;
  encounterId?: string;
  doctorId: string;
  doctorName: string;
  departmentName: string;
  facilityId: string;
  facilityName: string;
  admissionType: AdmissionType;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; admission?: HospitalAdmission; error?: string } {
  const all = getAllAdmissions();
  const nowIso = new Date().toISOString();
  const newId = `ADM-${1000 + all.length + 1}`;

  const newAdmission: HospitalAdmission = {
    id: newId,
    admission_reference: newId,
    patient_id: params.patientId,
    patient_name: params.patientName,
    encounter_id: params.encounterId,
    doctor_id: params.doctorId,
    doctor_name: params.doctorName,
    department_name: params.departmentName,
    facility_id: params.facilityId,
    facility_name: params.facilityName,
    admission_type: params.admissionType,
    status: "REQUESTED",
    reason_for_admission: params.reason,
    requested_at: nowIso,
    movements: [],
    created_at: nowIso,
    updated_at: nowIso,
  };

  all.unshift(newAdmission);
  saveAdmissions(all);

  appendAuditEvent(
    "ADMISSION_REQUESTED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Requested inpatient admission ${newId} for patient ${params.patientName}`,
    params.patientId,
    params.facilityId,
    params.facilityName,
    newId
  );

  return { success: true, admission: newAdmission };
}

export function acceptAdmission(
  admissionId: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; admission?: HospitalAdmission; error?: string } {
  const all = getAllAdmissions();
  const idx = all.findIndex(a => a.id === admissionId);
  if (idx < 0) return { success: false, error: "Admission record not found." };

  const admission = all[idx];
  if (admission.status !== "REQUESTED") {
    return { success: false, error: `Admission is ${admission.status} and cannot be accepted.` };
  }

  const nowIso = new Date().toISOString();
  admission.status = "ACCEPTED";
  admission.accepted_at = nowIso;
  admission.updated_at = nowIso;

  all[idx] = admission;
  saveAdmissions(all);

  appendAuditEvent(
    "ADMISSION_ACCEPTED",
    actorId,
    actorName,
    actorRole,
    `Accepted admission request ${admissionId}`,
    admission.patient_id,
    admission.facility_id,
    admission.facility_name,
    admissionId
  );

  return { success: true, admission };
}

export function confirmAdmission(params: {
  admissionId: string;
  bedId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; admission?: HospitalAdmission; error?: string } {
  const all = getAllAdmissions();
  const idx = all.findIndex(a => a.id === params.admissionId);
  if (idx < 0) return { success: false, error: "Admission record not found." };

  const beds = getAllBeds();
  const bedIdx = beds.findIndex(b => b.id === params.bedId);
  if (bedIdx < 0) return { success: false, error: "Selected bed not found." };

  const bed = beds[bedIdx];
  if (bed.status !== "AVAILABLE") {
    return { success: false, error: `Bed ${bed.bed_number} in ${bed.room_number} is currently ${bed.status}.` };
  }

  const admission = all[idx];
  const nowIso = new Date().toISOString();

  // Update Bed
  bed.status = "OCCUPIED";
  bed.current_admission_id = admission.id;
  bed.current_patient_name = admission.patient_name;
  beds[bedIdx] = bed;
  saveBeds(beds);

  // Update Admission
  admission.status = "INPATIENT";
  admission.admitted_at = nowIso;
  admission.bed_id = bed.id;
  admission.ward_name = bed.ward_name;
  admission.room_number = bed.room_number;
  admission.bed_number = bed.bed_number;
  admission.updated_at = nowIso;

  all[idx] = admission;
  saveAdmissions(all);

  appendAuditEvent(
    "PATIENT_ADMITTED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Admitted patient ${admission.patient_name} to ${bed.ward_name} (${bed.room_number}, ${bed.bed_number})`,
    admission.patient_id,
    admission.facility_id,
    admission.facility_name,
    admission.id
  );

  return { success: true, admission };
}

export function transferBed(params: {
  admissionId: string;
  newBedId: string;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; admission?: HospitalAdmission; error?: string } {
  const all = getAllAdmissions();
  const idx = all.findIndex(a => a.id === params.admissionId);
  if (idx < 0) return { success: false, error: "Admission record not found." };

  const beds = getAllBeds();
  const newBedIdx = beds.findIndex(b => b.id === params.newBedId);
  if (newBedIdx < 0) return { success: false, error: "Destination bed not found." };

  const newBed = beds[newBedIdx];
  if (newBed.status !== "AVAILABLE") {
    return { success: false, error: `Destination bed is currently ${newBed.status}.` };
  }

  const admission = all[idx];
  const oldBedId = admission.bed_id;
  const oldBedDesc = `${admission.ward_name} • ${admission.room_number} • ${admission.bed_number}`;
  const nowIso = new Date().toISOString();

  // Release old bed
  if (oldBedId) {
    const oldBedIdx = beds.findIndex(b => b.id === oldBedId);
    if (oldBedIdx >= 0) {
      beds[oldBedIdx].status = "AVAILABLE";
      beds[oldBedIdx].current_admission_id = undefined;
      beds[oldBedIdx].current_patient_name = undefined;
    }
  }

  // Occupy new bed
  newBed.status = "OCCUPIED";
  newBed.current_admission_id = admission.id;
  newBed.current_patient_name = admission.patient_name;
  beds[newBedIdx] = newBed;
  saveBeds(beds);

  // Record Movement
  const movement: BedMovementRecord = {
    id: `MOV-${Date.now()}`,
    admission_id: admission.id,
    previous_bed: oldBedDesc,
    new_bed: `${newBed.ward_name} • ${newBed.room_number} • ${newBed.bed_number}`,
    transferred_at: nowIso,
    transferred_by: params.actorName,
    reason: params.reason,
  };

  admission.movements = [...(admission.movements || []), movement];
  admission.bed_id = newBed.id;
  admission.ward_name = newBed.ward_name;
  admission.room_number = newBed.room_number;
  admission.bed_number = newBed.bed_number;
  admission.updated_at = nowIso;

  all[idx] = admission;
  saveAdmissions(all);

  appendAuditEvent(
    "BED_TRANSFERRED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Transferred patient ${admission.patient_name} from ${oldBedDesc} to ${newBed.room_number} (${newBed.bed_number}): ${params.reason}`,
    admission.patient_id,
    admission.facility_id,
    admission.facility_name,
    admission.id
  );

  return { success: true, admission };
}

export function initiateDischarge(
  admissionId: string,
  actorId: string,
  actorName: string,
  actorRole: string
): { success: boolean; admission?: HospitalAdmission; error?: string } {
  const all = getAllAdmissions();
  const idx = all.findIndex(a => a.id === admissionId);
  if (idx < 0) return { success: false, error: "Admission record not found." };

  const admission = all[idx];
  if (admission.status !== "INPATIENT" && admission.status !== "ADMITTED") {
    return { success: false, error: `Cannot initiate discharge for admission in status ${admission.status}.` };
  }

  const nowIso = new Date().toISOString();
  admission.status = "DISCHARGE_PENDING";
  admission.discharge_initiated_at = nowIso;
  admission.updated_at = nowIso;

  all[idx] = admission;
  saveAdmissions(all);

  appendAuditEvent(
    "DISCHARGE_INITIATED",
    actorId,
    actorName,
    actorRole,
    `Initiated discharge workflow for patient ${admission.patient_name}`,
    admission.patient_id,
    admission.facility_id,
    admission.facility_name,
    admissionId
  );

  return { success: true, admission };
}

export function completeDischarge(params: {
  admissionId: string;
  dischargeSummary: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; admission?: HospitalAdmission; error?: string } {
  const all = getAllAdmissions();
  const idx = all.findIndex(a => a.id === params.admissionId);
  if (idx < 0) return { success: false, error: "Admission record not found." };

  const admission = all[idx];
  if (admission.status === "DISCHARGED") {
    return { success: false, error: "This patient is already discharged." };
  }

  const nowIso = new Date().toISOString();

  // Release bed
  if (admission.bed_id) {
    const beds = getAllBeds();
    const bedIdx = beds.findIndex(b => b.id === admission.bed_id);
    if (bedIdx >= 0) {
      beds[bedIdx].status = "AVAILABLE";
      beds[bedIdx].current_admission_id = undefined;
      beds[bedIdx].current_patient_name = undefined;
      saveBeds(beds);
    }
  }

  admission.status = "DISCHARGED";
  admission.discharged_at = nowIso;
  admission.discharge_summary = params.dischargeSummary;
  admission.updated_at = nowIso;

  all[idx] = admission;
  saveAdmissions(all);

  appendAuditEvent(
    "PATIENT_DISCHARGED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Completed inpatient discharge for ${admission.patient_name}. Bed released.`,
    admission.patient_id,
    admission.facility_id,
    admission.facility_name,
    admission.id
  );

  return { success: true, admission };
}