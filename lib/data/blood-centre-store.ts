// ============================================================
// MEDORA — AUTHORITATIVE HOSPITAL BLOOD CENTRE REPOSITORY
// Specialized Hospital-Controlled Operational Module
// ============================================================

import { appendAuditEvent } from "@/lib/data/audit-store";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type RhType = "POSITIVE" | "NEGATIVE";
export type BloodComponentType = 
  | "WHOLE_BLOOD" 
  | "PACKED_RBC" 
  | "FRESH_FROZEN_PLASMA" 
  | "PLATELETS" 
  | "CRYOPRECIPITATE";

export type BloodUnitStatus = 
  | "COLLECTED"
  | "TESTING"
  | "AVAILABLE"
  | "RESERVED"
  | "ISSUED"
  | "TRANSFUSED"
  | "RETURNED"
  | "QUARANTINED"
  | "EXPIRED"
  | "DISCARDED";

export type BloodRequestPriority = "NORMAL" | "URGENT" | "EMERGENCY";

export type BloodRequestStatus = 
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "RESERVED"
  | "ISSUED"
  | "COMPLETED"
  | "CANCELLED";

export interface BloodUnitHistoryEvent {
  id: string;
  unit_id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  action: string;
  previous_status?: BloodUnitStatus;
  new_status: BloodUnitStatus;
  request_id?: string;
  patient_id?: string;
  notes?: string;
}

export interface HospitalBloodUnit {
  id: string;
  unit_code: string;
  hospital_id: string; // References Parent Hospital ID (e.g., "FAC-1001")
  blood_centre_id: string; // e.g., "BLC-1001"
  blood_group: BloodGroup;
  rh_type: RhType;
  component_type: BloodComponentType;
  volume_ml: number;
  collection_date: string;
  expiry_date: string;
  status: BloodUnitStatus;
  storage_location: string; // e.g., "Cold Storage Unit 2 - Shelf B"
  reserved_for_request_id?: string;
  reserved_for_patient_id?: string;
  reserved_at?: string;
  issued_at?: string;
  discard_reason?: string;
  quarantine_reason?: string;
  history: BloodUnitHistoryEvent[];
  created_at: string;
  updated_at: string;
}

export interface HospitalBloodRequest {
  id: string;
  request_number: string;
  hospital_id: string;
  blood_centre_id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  encounter_id?: string;
  admission_id?: string;
  emergency_id?: string;
  blood_group: BloodGroup;
  component_type: BloodComponentType;
  units_requested: number;
  priority: BloodRequestPriority;
  clinical_indication: string;
  status: BloodRequestStatus;
  reserved_unit_ids: string[];
  issued_unit_ids: string[];
  requested_at: string;
  reviewed_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BloodCentreEntity {
  id: string;
  hospital_id: string;
  name: string;
  status: "ACTIVE" | "MAINTENANCE" | "SUSPENDED";
  location: string;
  emergency_contact: string;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// SEEDED BLOOD CENTRES & INVENTORY
// ------------------------------------------------------------

export const SEEDED_BLOOD_CENTRES: BloodCentreEntity[] = [
  {
    id: "BLC-1001",
    hospital_id: "FAC-1001",
    name: "City Hospital Blood Transfusion Centre",
    status: "ACTIVE",
    location: "Block B, Level 1 (Adjacent to Trauma Care)",
    emergency_contact: "+91 674 2500 108",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "BLC-1002",
    hospital_id: "FAC-1004",
    name: "Green Care Blood Logistics Unit",
    status: "ACTIVE",
    location: "Ground Floor East Wing",
    emergency_contact: "+91 674 2599 200",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

export const SEEDED_BLOOD_UNITS: HospitalBloodUnit[] = [
  {
    id: "UNIT-1001",
    unit_code: "BLD-O-POS-1001",
    hospital_id: "FAC-1001",
    blood_centre_id: "BLC-1001",
    blood_group: "O+",
    rh_type: "POSITIVE",
    component_type: "PACKED_RBC",
    volume_ml: 350,
    collection_date: "2026-08-10T09:00:00Z",
    expiry_date: "2026-09-21T09:00:00Z",
    status: "AVAILABLE",
    storage_location: "Cold Vault A - Rack 1",
    history: [
      {
        id: "EVT-1",
        unit_id: "UNIT-1001",
        timestamp: "2026-08-10T09:00:00Z",
        actor_id: "STAFF-1001",
        actor_name: "Blood Centre Tech",
        action: "COLLECTION_COMPLETED",
        new_status: "COLLECTED",
      },
      {
        id: "EVT-2",
        unit_id: "UNIT-1001",
        timestamp: "2026-08-11T11:00:00Z",
        actor_id: "LAB-1001",
        actor_name: "Dr. B. Mohapatra",
        action: "TESTING_PASSED_SEROLOGY_CLEAR",
        previous_status: "TESTING",
        new_status: "AVAILABLE",
      },
    ],
    created_at: "2026-08-10T09:00:00Z",
    updated_at: "2026-08-11T11:00:00Z",
  },
  {
    id: "UNIT-1002",
    unit_code: "BLD-O-POS-1002",
    hospital_id: "FAC-1001",
    blood_centre_id: "BLC-1001",
    blood_group: "O+",
    rh_type: "POSITIVE",
    component_type: "PACKED_RBC",
    volume_ml: 350,
    collection_date: "2026-08-12T10:30:00Z",
    expiry_date: "2026-09-23T10:30:00Z",
    status: "AVAILABLE",
    storage_location: "Cold Vault A - Rack 1",
    history: [],
    created_at: "2026-08-12T10:30:00Z",
    updated_at: "2026-08-13T12:00:00Z",
  },
  {
    id: "UNIT-1003",
    unit_code: "BLD-A-POS-1001",
    hospital_id: "FAC-1001",
    blood_centre_id: "BLC-1001",
    blood_group: "A+",
    rh_type: "POSITIVE",
    component_type: "PACKED_RBC",
    volume_ml: 350,
    collection_date: "2026-08-14T14:00:00Z",
    expiry_date: "2026-09-25T14:00:00Z",
    status: "AVAILABLE",
    storage_location: "Cold Vault A - Rack 2",
    history: [],
    created_at: "2026-08-14T14:00:00Z",
    updated_at: "2026-08-15T09:00:00Z",
  },
  {
    id: "UNIT-1004",
    unit_code: "BLD-B-POS-1001",
    hospital_id: "FAC-1001",
    blood_centre_id: "BLC-1001",
    blood_group: "B+",
    rh_type: "POSITIVE",
    component_type: "WHOLE_BLOOD",
    volume_ml: 450,
    collection_date: "2026-08-08T11:00:00Z",
    expiry_date: "2026-09-12T11:00:00Z",
    status: "AVAILABLE",
    storage_location: "Cold Vault B - Rack 1",
    history: [],
    created_at: "2026-08-08T11:00:00Z",
    updated_at: "2026-08-09T10:00:00Z",
  },
  {
    id: "UNIT-1005",
    unit_code: "BLD-AB-POS-1001",
    hospital_id: "FAC-1001",
    blood_centre_id: "BLC-1001",
    blood_group: "AB+",
    rh_type: "POSITIVE",
    component_type: "FRESH_FROZEN_PLASMA",
    volume_ml: 200,
    collection_date: "2026-08-01T15:00:00Z",
    expiry_date: "2027-08-01T15:00:00Z",
    status: "AVAILABLE",
    storage_location: "Deep Freezer - Rack 3",
    history: [],
    created_at: "2026-08-01T15:00:00Z",
    updated_at: "2026-08-02T10:00:00Z",
  },
  {
    id: "UNIT-1006",
    unit_code: "BLD-O-NEG-1001",
    hospital_id: "FAC-1001",
    blood_centre_id: "BLC-1001",
    blood_group: "O-",
    rh_type: "NEGATIVE",
    component_type: "PACKED_RBC",
    volume_ml: 350,
    collection_date: "2026-08-16T12:00:00Z",
    expiry_date: "2026-09-27T12:00:00Z",
    status: "AVAILABLE",
    storage_location: "Emergency Universal Reserve - Bay 1",
    history: [],
    created_at: "2026-08-16T12:00:00Z",
    updated_at: "2026-08-17T11:00:00Z",
  },
  {
    id: "UNIT-2001",
    unit_code: "BLD-GREEN-O-POS-101",
    hospital_id: "FAC-1004", // Green Care Hospital
    blood_centre_id: "BLC-1002",
    blood_group: "O+",
    rh_type: "POSITIVE",
    component_type: "PACKED_RBC",
    volume_ml: 350,
    collection_date: "2026-08-15T10:00:00Z",
    expiry_date: "2026-09-26T10:00:00Z",
    status: "AVAILABLE",
    storage_location: "Cold Vault GC - 1",
    history: [],
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-15T10:00:00Z",
  },
];

export const SEEDED_BLOOD_REQUESTS: HospitalBloodRequest[] = [
  {
    id: "BREQ-1001",
    request_number: "BLD-REQ-1001",
    hospital_id: "FAC-1001",
    blood_centre_id: "BLC-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    admission_id: "ADM-1001",
    blood_group: "O+",
    component_type: "PACKED_RBC",
    units_requested: 1,
    priority: "URGENT",
    clinical_indication: "Pre-procedure cardiovascular standby and hemoglobin maintenance",
    status: "REQUESTED",
    reserved_unit_ids: [],
    issued_unit_ids: [],
    requested_at: "2026-08-24T09:00:00Z",
    created_at: "2026-08-24T09:00:00Z",
    updated_at: "2026-08-24T09:00:00Z",
  },
];

let inMemoryUnits: HospitalBloodUnit[] = [...SEEDED_BLOOD_UNITS];
let inMemoryRequests: HospitalBloodRequest[] = [...SEEDED_BLOOD_REQUESTS];

const UNITS_STORAGE_KEY = "medora_hospital_blood_units_v1";
const REQUESTS_STORAGE_KEY = "medora_hospital_blood_requests_v1";

// ------------------------------------------------------------
// PERSISTENCE GETTERS & SETTERS
// ------------------------------------------------------------

export function getAllBloodUnits(hospitalId?: string): HospitalBloodUnit[] {
  if (typeof window === "undefined") {
    if (!hospitalId) return inMemoryUnits;
    return inMemoryUnits.filter((u) => u.hospital_id === hospitalId);
  }
  try {
    const raw = localStorage.getItem(UNITS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(inMemoryUnits));
      return hospitalId ? inMemoryUnits.filter((u) => u.hospital_id === hospitalId) : inMemoryUnits;
    }
    const parsed = JSON.parse(raw);
    inMemoryUnits = Array.isArray(parsed) ? parsed : inMemoryUnits;
    return hospitalId ? inMemoryUnits.filter((u) => u.hospital_id === hospitalId) : inMemoryUnits;
  } catch {
    return hospitalId ? inMemoryUnits.filter((u) => u.hospital_id === hospitalId) : inMemoryUnits;
  }
}

export function saveBloodUnits(units: HospitalBloodUnit[]): void {
  inMemoryUnits = [...units];
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(units));
    window.dispatchEvent(new Event("medora-blood-units-updated"));
  } catch (e) {
    console.error("Failed to save blood units:", e);
  }
}

export function getAllBloodRequests(hospitalId?: string): HospitalBloodRequest[] {
  if (typeof window === "undefined") {
    if (!hospitalId) return inMemoryRequests;
    return inMemoryRequests.filter((r) => r.hospital_id === hospitalId);
  }
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(inMemoryRequests));
      return hospitalId ? inMemoryRequests.filter((r) => r.hospital_id === hospitalId) : inMemoryRequests;
    }
    const parsed = JSON.parse(raw);
    inMemoryRequests = Array.isArray(parsed) ? parsed : inMemoryRequests;
    return hospitalId ? inMemoryRequests.filter((r) => r.hospital_id === hospitalId) : inMemoryRequests;
  } catch {
    return hospitalId ? inMemoryRequests.filter((r) => r.hospital_id === hospitalId) : inMemoryRequests;
  }
}

export function saveBloodRequests(requests: HospitalBloodRequest[]): void {
  inMemoryRequests = [...requests];
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new Event("medora-blood-requests-updated"));
  } catch (e) {
    console.error("Failed to save blood requests:", e);
  }
}

export function getBloodCentre(hospitalId: string): BloodCentreEntity | null {
  return SEEDED_BLOOD_CENTRES.find((b) => b.hospital_id === hospitalId) || SEEDED_BLOOD_CENTRES[0];
}

// ------------------------------------------------------------
// INVENTORY COMPUTATION & EXPIRY FILTERING
// ------------------------------------------------------------

export function getBloodInventorySummary(hospitalId: string): {
  byGroup: Record<BloodGroup, { available: number; reserved: number; quarantined: number; expired: number }>;
  totalAvailable: number;
  totalReserved: number;
  totalQuarantined: number;
  totalExpired: number;
} {
  const units = getAllBloodUnits(hospitalId);
  const now = new Date();

  const groups: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const byGroup: any = {};
  groups.forEach((g) => {
    byGroup[g] = { available: 0, reserved: 0, quarantined: 0, expired: 0 };
  });

  let totalAvailable = 0;
  let totalReserved = 0;
  let totalQuarantined = 0;
  let totalExpired = 0;

  units.forEach((u) => {
    const isExpired = new Date(u.expiry_date) < now;
    if (u.status === "DISCARDED") return;

    if (isExpired || u.status === "EXPIRED") {
      byGroup[u.blood_group].expired += 1;
      totalExpired += 1;
    } else if (u.status === "QUARANTINED") {
      byGroup[u.blood_group].quarantined += 1;
      totalQuarantined += 1;
    } else if (u.status === "RESERVED") {
      byGroup[u.blood_group].reserved += 1;
      totalReserved += 1;
    } else if (u.status === "AVAILABLE") {
      byGroup[u.blood_group].available += 1;
      totalAvailable += 1;
    }
  });

  return { byGroup, totalAvailable, totalReserved, totalQuarantined, totalExpired };
}

// ------------------------------------------------------------
// WORKFLOW ACTIONS
// ------------------------------------------------------------

/**
 * 1. Create a Blood Request (Doctor / Emergency Team)
 */
export function createBloodRequest(params: {
  hospitalId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  encounterId?: string;
  admissionId?: string;
  emergencyId?: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  unitsRequested: number;
  priority: BloodRequestPriority;
  clinicalIndication: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; request?: HospitalBloodRequest; error?: string } {
  const allReqs = getAllBloodRequests();
  const nowIso = new Date().toISOString();
  const reqNum = 1000 + allReqs.length + 1;
  const newId = `BREQ-${reqNum}`;

  const newRequest: HospitalBloodRequest = {
    id: newId,
    request_number: `BLD-REQ-${reqNum}`,
    hospital_id: params.hospitalId,
    blood_centre_id: `BLC-${params.hospitalId.replace("FAC-", "")}`,
    patient_id: params.patientId,
    patient_name: params.patientName,
    doctor_id: params.doctorId,
    doctor_name: params.doctorName,
    encounter_id: params.encounterId,
    admission_id: params.admissionId,
    emergency_id: params.emergencyId,
    blood_group: params.bloodGroup,
    component_type: params.componentType,
    units_requested: params.unitsRequested,
    priority: params.priority,
    clinical_indication: params.clinicalIndication,
    status: "REQUESTED",
    reserved_unit_ids: [],
    issued_unit_ids: [],
    requested_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };

  allReqs.unshift(newRequest);
  saveBloodRequests(allReqs);

  appendAuditEvent(
    "BLOOD_REQUEST_CREATED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Created ${params.priority} blood request #${newId} for ${params.patientName} (${params.unitsRequested}x ${params.bloodGroup} ${params.componentType})`,
    params.patientId,
    params.hospitalId,
    undefined,
    newId
  );

  return { success: true, request: newRequest };
}

/**
 * 2. Reserve a Blood Unit for a Request (with Double-Reservation Lock)
 */
export function reserveBloodUnit(params: {
  requestId: string;
  unitId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; unit?: HospitalBloodUnit; error?: string } {
  const units = getAllBloodUnits();
  const requests = getAllBloodRequests();

  const reqIdx = requests.findIndex((r) => r.id === params.requestId);
  if (reqIdx < 0) return { success: false, error: "Blood request not found." };

  const unitIdx = units.findIndex((u) => u.id === params.unitId);
  if (unitIdx < 0) return { success: false, error: "Blood unit not found." };

  const unit = units[unitIdx];
  const req = requests[reqIdx];

  // Cross-Hospital Isolation Check
  if (unit.hospital_id !== req.hospital_id) {
    return { success: false, error: "Access Denied: Unit belongs to a different hospital organization." };
  }

  // Double Reservation Protection & Expiry Check
  if (unit.status !== "AVAILABLE") {
    return { success: false, error: `Unit ${unit.unit_code} is ${unit.status} and no longer available.` };
  }
  if (new Date(unit.expiry_date) < new Date()) {
    return { success: false, error: `Unit ${unit.unit_code} is expired and cannot be reserved.` };
  }

  const nowIso = new Date().toISOString();

  // Mutate Unit
  unit.status = "RESERVED";
  unit.reserved_for_request_id = req.id;
  unit.reserved_for_patient_id = req.patient_id;
  unit.reserved_at = nowIso;
  unit.updated_at = nowIso;
  unit.history.push({
    id: `EVT-${Date.now()}`,
    unit_id: unit.id,
    timestamp: nowIso,
    actor_id: params.actorId,
    actor_name: params.actorName,
    action: "UNIT_RESERVED",
    previous_status: "AVAILABLE",
    new_status: "RESERVED",
    request_id: req.id,
    patient_id: req.patient_id,
    notes: `Reserved for ${req.patient_name} (${req.request_number})`,
  });

  units[unitIdx] = unit;
  saveBloodUnits(units);

  // Mutate Request
  if (!req.reserved_unit_ids.includes(unit.id)) {
    req.reserved_unit_ids.push(unit.id);
  }
  req.status = "RESERVED";
  req.reviewed_at = nowIso;
  req.updated_at = nowIso;
  requests[reqIdx] = req;
  saveBloodRequests(requests);

  appendAuditEvent(
    "BLOOD_UNIT_RESERVED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Reserved blood unit ${unit.unit_code} (${unit.blood_group}) for request #${req.request_number}`,
    req.patient_id,
    req.hospital_id,
    undefined,
    unit.id
  );

  return { success: true, unit };
}

/**
 * 3. Issue Reserved Blood Units (Release for Transfusion)
 */
export function issueBloodUnits(params: {
  requestId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; request?: HospitalBloodRequest; error?: string } {
  const units = getAllBloodUnits();
  const requests = getAllBloodRequests();

  const reqIdx = requests.findIndex((r) => r.id === params.requestId);
  if (reqIdx < 0) return { success: false, error: "Blood request not found." };

  const req = requests[reqIdx];
  if (req.reserved_unit_ids.length === 0) {
    return { success: false, error: "No units have been reserved for this request." };
  }

  const nowIso = new Date().toISOString();

  // Transition all reserved units to ISSUED
  req.reserved_unit_ids.forEach((uId) => {
    const uIdx = units.findIndex((u) => u.id === uId);
    if (uIdx >= 0) {
      units[uIdx].status = "ISSUED";
      units[uIdx].issued_at = nowIso;
      units[uIdx].updated_at = nowIso;
      units[uIdx].history.push({
        id: `EVT-${Date.now()}-${uId}`,
        unit_id: uId,
        timestamp: nowIso,
        actor_id: params.actorId,
        actor_name: params.actorName,
        action: "UNIT_ISSUED_FOR_TRANSFUSION",
        previous_status: "RESERVED",
        new_status: "ISSUED",
        request_id: req.id,
        patient_id: req.patient_id,
        notes: `Issued to clinical team for ${req.patient_name}`,
      });
      if (!req.issued_unit_ids.includes(uId)) {
        req.issued_unit_ids.push(uId);
      }
    }
  });

  saveBloodUnits(units);

  req.status = "ISSUED";
  req.completed_at = nowIso;
  req.updated_at = nowIso;
  requests[reqIdx] = req;
  saveBloodRequests(requests);

  appendAuditEvent(
    "BLOOD_UNITS_ISSUED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Issued ${req.issued_unit_ids.length} blood unit(s) for ${req.patient_name} (Request #${req.request_number})`,
    req.patient_id,
    req.hospital_id,
    undefined,
    req.id
  );

  return { success: true, request: req };
}

/**
 * 4. Quarantine Blood Unit (Quality / Serology Hold)
 */
export function quarantineBloodUnit(params: {
  unitId: string;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; unit?: HospitalBloodUnit; error?: string } {
  const units = getAllBloodUnits();
  const unitIdx = units.findIndex((u) => u.id === params.unitId);
  if (unitIdx < 0) return { success: false, error: "Blood unit not found." };

  const unit = units[unitIdx];
  const prevStatus = unit.status;
  const nowIso = new Date().toISOString();

  unit.status = "QUARANTINED";
  unit.quarantine_reason = params.reason;
  unit.updated_at = nowIso;
  unit.history.push({
    id: `EVT-${Date.now()}`,
    unit_id: unit.id,
    timestamp: nowIso,
    actor_id: params.actorId,
    actor_name: params.actorName,
    action: "UNIT_PLACED_IN_QUARANTINE",
    previous_status: prevStatus,
    new_status: "QUARANTINED",
    notes: params.reason,
  });

  units[unitIdx] = unit;
  saveBloodUnits(units);

  appendAuditEvent(
    "BLOOD_UNIT_QUARANTINED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Placed unit ${unit.unit_code} in quarantine: ${params.reason}`,
    undefined,
    unit.hospital_id,
    undefined,
    unit.id
  );

  return { success: true, unit };
}

/**
 * 5. Discard Blood Unit (Biohazard Waste & Reason)
 */
export function discardBloodUnit(params: {
  unitId: string;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; unit?: HospitalBloodUnit; error?: string } {
  const units = getAllBloodUnits();
  const unitIdx = units.findIndex((u) => u.id === params.unitId);
  if (unitIdx < 0) return { success: false, error: "Blood unit not found." };

  const unit = units[unitIdx];
  const prevStatus = unit.status;
  const nowIso = new Date().toISOString();

  unit.status = "DISCARDED";
  unit.discard_reason = params.reason;
  unit.updated_at = nowIso;
  unit.history.push({
    id: `EVT-${Date.now()}`,
    unit_id: unit.id,
    timestamp: nowIso,
    actor_id: params.actorId,
    actor_name: params.actorName,
    action: "UNIT_DISCARDED",
    previous_status: prevStatus,
    new_status: "DISCARDED",
    notes: params.reason,
  });

  units[unitIdx] = unit;
  saveBloodUnits(units);

  appendAuditEvent(
    "BLOOD_UNIT_DISCARDED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Discarded blood unit ${unit.unit_code} (${unit.blood_group}): ${params.reason}`,
    undefined,
    unit.hospital_id,
    undefined,
    unit.id
  );

  return { success: true, unit };
}
