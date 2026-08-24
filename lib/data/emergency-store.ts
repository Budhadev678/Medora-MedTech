// ============================================================
// MEDORA — AUTHORITATIVE EMERGENCY & RAPID HOSPITAL RESPONSE STORE
// Pre-Alerts, Ambulance Ingress, ER Trauma Care Lifecycle (Step 2 of 5)
// ============================================================

import { appendAuditEvent } from "@/lib/data/audit-store";
import { findIdentityById } from "@/lib/data/identity-store";
import { requestAdmission } from "@/lib/data/admission-store";

export type EmergencyType =
  | "CHEST_PAIN"
  | "BREATHING_DIFFICULTY"
  | "UNCONSCIOUSNESS"
  | "MAJOR_INJURY"
  | "SEVERE_BLEEDING"
  | "STROKE_SYMPTOMS"
  | "SEIZURE"
  | "OTHER";

export type EmergencyPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export type EmergencyStatus =
  | "INCOMING"
  | "ACKNOWLEDGED"
  | "PREPARING"
  | "ARRIVED"
  | "EMERGENCY_CARE"
  | "ADMITTED"
  | "TRANSFERRED"
  | "DISCHARGED"
  | "CANCELLED"
  | "COMPLETED"
  | "INITIATED"
  | "HOSPITAL_NOTIFIED"
  | "HOSPITAL_ACKNOWLEDGED"
  | "EN_ROUTE"
  | "TRIAGE_STARTED"
  | "IN_TREATMENT";

export type TriagePriority = "red_critical" | "yellow_urgent" | "green_standard" | string;
export type EmergencySource = "AMBULANCE" | "HOSPITAL_STAFF" | "AUTHORIZED_WORKFLOW" | "OTHER";
export type EmergencyArrivalMethod = "AMBULANCE" | "WALK_IN" | "HOSPITAL_TRANSFER" | "OTHER";
export type AmbulanceStatus = "NOT_REQUESTED" | "EN_ROUTE" | "ARRIVED" | "COMPLETED";

export interface PreparationChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

export interface TeamAssignmentRecord {
  id: string;
  assigned_team: string;
  assigned_area?: string;
  assigned_staff_name?: string;
  assigned_by: string;
  timestamp: string;
  reason?: string;
}

export interface EmergencyTimelineEvent {
  id: string;
  status: EmergencyStatus;
  title: string;
  description: string;
  timestamp: string;
  actor_name: string;
  actor_role: string;
}

export interface PatientEmergencyCase {
  id: string; // e.g. EMG-1001
  case_number: string; // e.g. CASE-EMG-2026-1001
  hospital_id: string; // e.g. FAC-1001
  hospital_name: string;
  target_facility_id: string; // compatibility alias
  target_facility_name: string; // compatibility alias

  // Patient Identity (Known or Unknown)
  is_unknown_patient: boolean;
  patient_id: string; // "UNKNOWN" or e.g. "PAT-1001"
  patient_name: string; // "UNKNOWN PATIENT" or e.g. "Rahul Verma"
  patient_phone?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;

  // Emergency Clinical & Ingress Metadata
  emergency_type: EmergencyType;
  chief_complaint: string;
  description: string; // compatibility alias
  source: EmergencySource;
  arrival_method: EmergencyArrivalMethod;
  arriving_by_ambulance: boolean;
  ambulance_status: AmbulanceStatus;
  ambulance_id?: string;
  ambulance_agency?: string;
  ambulance_contact?: string;
  location?: string;
  eta_minutes?: number | null;
  priority: EmergencyPriority;
  triage_level?: TriagePriority;

  // Operational State & Response
  status: EmergencyStatus;
  assigned_team?: string;
  assigned_area?: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  assignment_history: TeamAssignmentRecord[];
  preparation_checklist: PreparationChecklistItem[];

  // Medical Snapshot
  medical_snapshot?: {
    blood_group?: string;
    emergency_contact?: string;
    known_allergies?: string[];
  };

  // Lifecycle Timestamps & Compatibility
  created_at: string;
  hospital_notified_at?: string;
  hospital_acknowledged_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  preparation_started_at?: string;
  arrived_at?: string;
  triage_started_at?: string;
  care_started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;

  // Handoff Details
  handoff_type?: "ADMISSION" | "TRANSFER" | "DISCHARGE" | "NORMAL_CARE";
  handoff_reference?: string;
  handoff_destination?: string;
  handoff_notes?: string;

  // Traceability & Concurrency
  timeline: EmergencyTimelineEvent[];
  version: number;
  updated_at: string;
}

export type EmergencyCase = PatientEmergencyCase;

export interface EmergencyResult {
  success: boolean;
  case?: PatientEmergencyCase;
  emergency?: PatientEmergencyCase;
  message: string;
  admissionId?: string;
  error?: string;
}

const DEFAULT_CHECKLIST: PreparationChecklistItem[] = [
  { id: "chk-1", label: "Trauma / ER resuscitation bay prepared", completed: true },
  { id: "chk-2", label: "Rapid response medical team notified", completed: true },
  { id: "chk-3", label: "Required critical care equipment & monitor checked", completed: false },
  { id: "chk-4", label: "Priority diagnostic / lab standby alerted", completed: false },
  { id: "chk-5", label: "Known patient clinical snapshot reviewed", completed: false },
];

const SEEDED_EMERGENCIES: PatientEmergencyCase[] = [
  {
    id: "EMG-1001",
    case_number: "CASE-EMG-2026-1001",
    hospital_id: "FAC-1001",
    hospital_name: "City Hospital Trauma Center",
    target_facility_id: "FAC-1001",
    target_facility_name: "City Hospital Trauma Center",
    is_unknown_patient: false,
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    patient_phone: "+91 98765 43210",
    blood_group: "O+",
    emergency_contact_name: "Priya Verma",
    emergency_contact_phone: "+91 98765 43219",
    emergency_type: "CHEST_PAIN",
    chief_complaint: "Acute substernal chest pain with left arm radiation and diaphoresis",
    description: "Acute substernal chest pain with left arm radiation and diaphoresis",
    source: "AMBULANCE",
    arrival_method: "AMBULANCE",
    arriving_by_ambulance: true,
    ambulance_status: "EN_ROUTE",
    ambulance_id: "AMB-OD-02-108",
    ambulance_agency: "108 National Emergency Service",
    ambulance_contact: "+91 94370 12345",
    location: "Nayapalli, Bhubaneswar",
    eta_minutes: 8,
    priority: "CRITICAL",
    triage_level: "red_critical",
    status: "INCOMING",
    assigned_team: "Trauma Resuscitation Team A",
    assigned_area: "Trauma Bay 1",
    assignment_history: [
      {
        id: "ASG-1",
        assigned_team: "Trauma Resuscitation Team A",
        assigned_area: "Trauma Bay 1",
        assigned_by: "System Pre-Alert",
        timestamp: "2026-08-24T10:15:00Z",
      },
    ],
    preparation_checklist: [...DEFAULT_CHECKLIST],
    medical_snapshot: {
      blood_group: "O+",
      emergency_contact: "Priya Verma (+91 98765 43219)",
      known_allergies: ["Penicillin"],
    },
    created_at: "2026-08-24T10:15:00Z",
    hospital_notified_at: "2026-08-24T10:15:00Z",
    timeline: [
      {
        id: "TL-1",
        status: "INCOMING",
        title: "Emergency Pre-Alert Received",
        description: "Inbound ambulance dispatched with critical chest pain pre-alert. ETA: 8 minutes.",
        timestamp: "2026-08-24T10:15:00Z",
        actor_name: "Ambulance Dispatch #108",
        actor_role: "emergency_dispatcher",
      },
    ],
    version: 1,
    updated_at: "2026-08-24T10:15:00Z",
  },
  {
    id: "EMG-1002",
    case_number: "CASE-EMG-2026-1002",
    hospital_id: "FAC-1001",
    hospital_name: "City Hospital Trauma Center",
    target_facility_id: "FAC-1001",
    target_facility_name: "City Hospital Trauma Center",
    is_unknown_patient: true,
    patient_id: "UNKNOWN",
    patient_name: "UNKNOWN PATIENT (Male, ~35y)",
    emergency_type: "MAJOR_INJURY",
    chief_complaint: "Road traffic accident casualty with multiple lacerations and trauma",
    description: "Road traffic accident casualty with multiple lacerations and trauma",
    source: "AMBULANCE",
    arrival_method: "AMBULANCE",
    arriving_by_ambulance: true,
    ambulance_status: "EN_ROUTE",
    ambulance_id: "AMB-OD-02-112",
    ambulance_agency: "Highway Emergency Response",
    location: "NH-16 Khandagiri Bypass",
    eta_minutes: 14,
    priority: "CRITICAL",
    triage_level: "red_critical",
    status: "ACKNOWLEDGED",
    assigned_team: "Orthopaedic Trauma Rapid Unit",
    assigned_area: "Trauma Resuscitation Bay 2",
    assignment_history: [
      {
        id: "ASG-2",
        assigned_team: "Orthopaedic Trauma Rapid Unit",
        assigned_area: "Trauma Resuscitation Bay 2",
        assigned_by: "Hospital Emergency Desk",
        timestamp: "2026-08-24T10:20:00Z",
      },
    ],
    preparation_checklist: [
      { id: "chk-1", label: "Trauma / ER resuscitation bay prepared", completed: true },
      { id: "chk-2", label: "Rapid response medical team notified", completed: true },
      { id: "chk-3", label: "Required critical care equipment & monitor checked", completed: true },
      { id: "chk-4", label: "Priority diagnostic / lab standby alerted", completed: false },
      { id: "chk-5", label: "Known patient clinical snapshot reviewed", completed: false },
    ],
    created_at: "2026-08-24T10:18:00Z",
    hospital_notified_at: "2026-08-24T10:18:00Z",
    acknowledged_at: "2026-08-24T10:20:00Z",
    hospital_acknowledged_at: "2026-08-24T10:20:00Z",
    acknowledged_by: "Dr. Emergency Desk",
    timeline: [
      {
        id: "TL-1",
        status: "INCOMING",
        title: "Emergency Pre-Alert Received",
        description: "High-speed road collision inbound. Patient identity unconfirmed.",
        timestamp: "2026-08-24T10:18:00Z",
        actor_name: "Ambulance Dispatch #112",
        actor_role: "emergency_dispatcher",
      },
      {
        id: "TL-2",
        status: "ACKNOWLEDGED",
        title: "Hospital Pre-Alert Acknowledged",
        description: "Emergency desk acknowledged pre-alert and initiated trauma bay prep.",
        timestamp: "2026-08-24T10:20:00Z",
        actor_name: "Dr. Emergency Desk",
        actor_role: "hospital_staff",
      },
    ],
    version: 2,
    updated_at: "2026-08-24T10:20:00Z",
  },
];

let inMemoryEmergencies: PatientEmergencyCase[] = [...SEEDED_EMERGENCIES];
const STORAGE_KEY = "medora_emergency_cases_v2";

export function getAllEmergencies(facilityId?: string): PatientEmergencyCase[] {
  if (typeof window === "undefined") {
    if (!facilityId) return inMemoryEmergencies;
    return inMemoryEmergencies.filter(
      (e) => e.hospital_id === facilityId || e.target_facility_id === facilityId
    );
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryEmergencies));
      return facilityId
        ? inMemoryEmergencies.filter(
            (e) => e.hospital_id === facilityId || e.target_facility_id === facilityId
          )
        : inMemoryEmergencies;
    }
    const parsed = JSON.parse(raw);
    inMemoryEmergencies = Array.isArray(parsed) ? parsed : inMemoryEmergencies;
    return facilityId
      ? inMemoryEmergencies.filter(
          (e) => e.hospital_id === facilityId || e.target_facility_id === facilityId
        )
      : inMemoryEmergencies;
  } catch {
    return facilityId
      ? inMemoryEmergencies.filter(
          (e) => e.hospital_id === facilityId || e.target_facility_id === facilityId
        )
      : inMemoryEmergencies;
  }
}

export function saveEmergencies(emergencies: PatientEmergencyCase[]): void {
  inMemoryEmergencies = [...emergencies];
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencies));
    window.dispatchEvent(new Event("medora-emergencies-updated"));
  } catch (e) {
    console.error("Failed to save emergencies:", e);
  }
}

export function getEmergenciesForFacility(facilityId: string): PatientEmergencyCase[] {
  return getAllEmergencies(facilityId);
}

export function getEmergencyCaseById(id: string): PatientEmergencyCase | null {
  const all = getAllEmergencies();
  const clean = id.trim().toUpperCase();
  return all.find((e) => e.id.toUpperCase() === clean || e.case_number.toUpperCase() === clean) || null;
}

export function getEmergenciesForPatient(patientId: string): PatientEmergencyCase[] {
  const all = getAllEmergencies();
  if (!patientId || patientId === "UNKNOWN") return [];
  return all.filter((e) => e.patient_id.toLowerCase() === patientId.toLowerCase());
}

export function getActiveEmergencyForPatient(patientId: string): PatientEmergencyCase | null {
  if (!patientId || patientId === "UNKNOWN") return null;
  const all = getAllEmergencies();
  return (
    all.find(
      (e) =>
        e.patient_id.toLowerCase() === patientId.toLowerCase() &&
        e.status !== "COMPLETED" &&
        e.status !== "CANCELLED" &&
        e.status !== "DISCHARGED"
    ) || null
  );
}

// ------------------------------------------------------------
// CREATION
// ------------------------------------------------------------
export function createEmergencyCase(params: {
  hospitalId?: string;
  hospitalName?: string;
  facilityId?: string;
  facilityName?: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyType?: EmergencyType;
  chiefComplaint?: string;
  description?: string;
  source?: EmergencySource;
  arrivalMethod?: EmergencyArrivalMethod;
  arrivingByAmbulance?: boolean;
  ambulanceEnRoute?: boolean;
  ambulanceId?: string;
  ambulanceAgency?: string;
  etaMinutes?: number | null;
  location?: string;
  priority?: EmergencyPriority;
  organizationIdentifier?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
}): EmergencyResult {
  const all = getAllEmergencies();
  const isUnknown = !params.patientId || params.patientId === "UNKNOWN" || !params.patientName;
  const nowIso = new Date().toISOString();
  const newId = `EMG-${1000 + all.length + 1}`;

  const hospId = params.hospitalId || params.facilityId || "FAC-1001";
  const hospName = params.hospitalName || params.facilityName || "City Hospital Trauma Center";
  const chief = params.chiefComplaint || params.description || "Emergency Care Required";
  const isAmb = params.arrivingByAmbulance ?? params.ambulanceEnRoute ?? true;

  const newCase: PatientEmergencyCase = {
    id: newId,
    case_number: `CASE-${newId}`,
    hospital_id: hospId,
    hospital_name: hospName,
    target_facility_id: hospId,
    target_facility_name: hospName,
    is_unknown_patient: isUnknown,
    patient_id: isUnknown ? "UNKNOWN" : (params.patientId || "PAT-1001"),
    patient_name: isUnknown ? "UNKNOWN PATIENT" : (params.patientName || "Rahul Verma"),
    patient_phone: params.patientPhone,
    blood_group: params.bloodGroup,
    emergency_contact_name: params.emergencyContactName,
    emergency_contact_phone: params.emergencyContactPhone,
    emergency_type: params.emergencyType || "CHEST_PAIN",
    chief_complaint: chief,
    description: chief,
    source: params.source || "AMBULANCE",
    arrival_method: params.arrivalMethod || (isAmb ? "AMBULANCE" : "WALK_IN"),
    arriving_by_ambulance: isAmb,
    ambulance_status: isAmb ? "EN_ROUTE" : "NOT_REQUESTED",
    ambulance_id: params.ambulanceId,
    ambulance_agency: params.ambulanceAgency,
    location: params.location || "Bhubaneswar",
    eta_minutes: params.etaMinutes !== undefined ? params.etaMinutes : (isAmb ? 10 : null),
    priority: params.priority || "CRITICAL",
    triage_level: "red_critical",
    status: "INCOMING",
    assigned_team: "Emergency Trauma Response Team",
    assigned_area: "Trauma Bay 1",
    assignment_history: [
      {
        id: `ASG-${Date.now()}`,
        assigned_team: "Emergency Trauma Response Team",
        assigned_area: "Trauma Bay 1",
        assigned_by: params.actorName || "System Pre-Alert",
        timestamp: nowIso,
      },
    ],
    preparation_checklist: [...DEFAULT_CHECKLIST],
    medical_snapshot: !isUnknown
      ? {
          blood_group: params.bloodGroup,
          emergency_contact: params.emergencyContactName
            ? `${params.emergencyContactName} (${params.emergencyContactPhone || ""})`
            : undefined,
        }
      : undefined,
    created_at: nowIso,
    hospital_notified_at: nowIso,
    timeline: [
      {
        id: `TL-${Date.now()}`,
        status: "INCOMING",
        title: "Emergency Alert Received",
        description: `Emergency pre-alert initiated for ${chief}. Arrival: ${params.arrivalMethod || "AMBULANCE"}.`,
        timestamp: nowIso,
        actor_name: params.actorName || "Emergency Dispatcher",
        actor_role: params.actorRole || "emergency_dispatcher",
      },
    ],
    version: 1,
    updated_at: nowIso,
  };

  all.unshift(newCase);
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_CREATED",
    actor_id: params.actorId || "SYSTEM",
    actor_name: params.actorName || "System",
    actor_role: params.actorRole || "system",
    patient_id: isUnknown ? undefined : newCase.patient_id,
    organization_id: hospId,
    organization_name: hospName,
    summary: `Created emergency pre-alert ${newId} (${newCase.emergency_type}) for ${newCase.patient_name}`,
    reference_id: newId,
  });

  return { 
    success: true, 
    case: newCase, 
    emergency: newCase, 
    message: "Emergency pre-alert created successfully." 
  };
}

// ------------------------------------------------------------
// 1. ACKNOWLEDGE EMERGENCY
// ------------------------------------------------------------
export function acknowledgeEmergency(
  emergencyId: string,
  actorIdOrName?: string,
  actorName?: string,
  actorRole?: string
): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const finalActorName = actorName || actorIdOrName || "Hospital ER Desk";
  const finalActorId = actorName ? actorIdOrName || "STAFF" : "STAFF";
  const finalRole = actorRole || "emergency_staff";

  // Idempotency: if already acknowledged or progressed further, return success
  if (em.status !== "INCOMING" && em.status !== "HOSPITAL_NOTIFIED" && em.status !== "INITIATED") {
    return { success: true, case: em, emergency: em, message: `Emergency is already acknowledged (${em.status}).` };
  }

  const nowIso = new Date().toISOString();
  em.status = "ACKNOWLEDGED";
  em.acknowledged_at = nowIso;
  em.hospital_acknowledged_at = nowIso;
  em.acknowledged_by = finalActorName;
  em.version += 1;
  em.updated_at = nowIso;

  em.timeline.unshift({
    id: `TL-${Date.now()}`,
    status: "ACKNOWLEDGED",
    title: "Pre-Alert Acknowledged by Staff",
    description: `Emergency alert acknowledged by ${finalActorName} (${finalRole}). Response team mobilized.`,
    timestamp: nowIso,
    actor_name: finalActorName,
    actor_role: finalRole,
  });

  all[idx] = em;
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_ACKNOWLEDGED",
    actor_id: finalActorId,
    actor_name: finalActorName,
    actor_role: finalRole,
    patient_id: em.is_unknown_patient ? undefined : em.patient_id,
    organization_id: em.hospital_id,
    organization_name: em.hospital_name,
    summary: `Acknowledged emergency pre-alert ${em.id} for ${em.patient_name}`,
    reference_id: em.id,
  });

  return { success: true, case: em, emergency: em, message: "Emergency pre-alert acknowledged." };
}

// ------------------------------------------------------------
// 2. START OPERATIONAL PREPARATION
// ------------------------------------------------------------
export function startPreparation(
  emergencyId: string,
  actorId?: string,
  actorName?: string,
  actorRole?: string
): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  if (em.status === "CANCELLED" || em.status === "COMPLETED" || em.status === "DISCHARGED") {
    return { success: false, message: `Cannot start preparation for ${em.status} emergency.` };
  }

  const finalActorName = actorName || "Hospital ER Desk";
  const finalActorId = actorId || "STAFF";
  const finalRole = actorRole || "emergency_staff";
  const nowIso = new Date().toISOString();

  em.status = "PREPARING";
  em.preparation_started_at = nowIso;
  em.version += 1;
  em.updated_at = nowIso;

  em.timeline.unshift({
    id: `TL-${Date.now()}`,
    status: "PREPARING",
    title: "Operational Preparation Underway",
    description: `Trauma resuscitation bay and clinical readiness checklist initiated by ${finalActorName}.`,
    timestamp: nowIso,
    actor_name: finalActorName,
    actor_role: finalRole,
  });

  all[idx] = em;
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_PREPARATION_STARTED",
    actor_id: finalActorId,
    actor_name: finalActorName,
    actor_role: finalRole,
    patient_id: em.is_unknown_patient ? undefined : em.patient_id,
    organization_id: em.hospital_id,
    organization_name: em.hospital_name,
    summary: `Started operational preparation for emergency ${em.id}`,
    reference_id: em.id,
  });

  return { success: true, case: em, emergency: em, message: "Preparation started." };
}

// ------------------------------------------------------------
// 3. TOGGLE CHECKLIST ITEM
// ------------------------------------------------------------
export function toggleChecklistItem(
  emergencyId: string,
  itemId: string,
  completed: boolean,
  actorName: string
): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const item = em.preparation_checklist.find((c) => c.id === itemId);
  if (!item) return { success: false, message: "Checklist item not found." };

  item.completed = completed;
  item.completed_at = completed ? new Date().toISOString() : undefined;
  item.completed_by = completed ? actorName : undefined;
  em.updated_at = new Date().toISOString();

  all[idx] = em;
  saveEmergencies(all);

  return { success: true, case: em, emergency: em, message: "Checklist updated." };
}

// ------------------------------------------------------------
// 4. ASSIGN TEAM / AREA
// ------------------------------------------------------------
export function assignEmergencyTeam(params: {
  emergencyId: string;
  assignedTeam: string;
  assignedArea?: string;
  assignedStaffName?: string;
  reason?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === params.emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const nowIso = new Date().toISOString();

  const record: TeamAssignmentRecord = {
    id: `ASG-${Date.now()}`,
    assigned_team: params.assignedTeam,
    assigned_area: params.assignedArea,
    assigned_staff_name: params.assignedStaffName,
    assigned_by: params.actorName,
    timestamp: nowIso,
    reason: params.reason,
  };

  em.assigned_team = params.assignedTeam;
  if (params.assignedArea) em.assigned_area = params.assignedArea;
  if (params.assignedStaffName) em.assigned_staff_name = params.assignedStaffName;
  em.assignment_history = [...(em.assignment_history || []), record];
  em.version += 1;
  em.updated_at = nowIso;

  em.timeline.unshift({
    id: `TL-${Date.now()}`,
    status: em.status,
    title: "Team / Bay Assigned",
    description: `Assigned to ${params.assignedTeam}${params.assignedArea ? ` (${params.assignedArea})` : ""} by ${params.actorName}.`,
    timestamp: nowIso,
    actor_name: params.actorName,
    actor_role: params.actorRole,
  });

  all[idx] = em;
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_TEAM_ASSIGNED",
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    patient_id: em.is_unknown_patient ? undefined : em.patient_id,
    organization_id: em.hospital_id,
    organization_name: em.hospital_name,
    summary: `Assigned emergency ${em.id} to ${params.assignedTeam} (${params.assignedArea || "Bay"})`,
    reference_id: em.id,
  });

  return { success: true, case: em, emergency: em, message: "Team assignment updated." };
}

// ------------------------------------------------------------
// 5. MARK PATIENT ARRIVED
// ------------------------------------------------------------
export function markPatientArrived(
  emergencyId: string,
  actorId?: string,
  actorName?: string,
  actorRole?: string
): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const finalActorName = actorName || "Hospital ER Desk";
  const finalActorId = actorId || "STAFF";
  const finalRole = actorRole || "emergency_staff";
  const nowIso = new Date().toISOString();

  em.status = "ARRIVED";
  em.arrived_at = nowIso;
  em.eta_minutes = 0;
  em.ambulance_status = "ARRIVED";
  em.version += 1;
  em.updated_at = nowIso;

  em.timeline.unshift({
    id: `TL-${Date.now()}`,
    status: "ARRIVED",
    title: "Patient Physically Arrived at Trauma Bay",
    description: `Patient arrival confirmed by ${finalActorName}. Handed over to ER medical team.`,
    timestamp: nowIso,
    actor_name: finalActorName,
    actor_role: finalRole,
  });

  all[idx] = em;
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_PATIENT_ARRIVED",
    actor_id: finalActorId,
    actor_name: finalActorName,
    actor_role: finalRole,
    patient_id: em.is_unknown_patient ? undefined : em.patient_id,
    organization_id: em.hospital_id,
    organization_name: em.hospital_name,
    summary: `Patient ${em.patient_name} arrived at emergency trauma bay (${em.id})`,
    reference_id: em.id,
  });

  return { success: true, case: em, emergency: em, message: "Patient arrival recorded." };
}

// ------------------------------------------------------------
// 6. START EMERGENCY CARE / TRIAGE
// ------------------------------------------------------------
export function startEmergencyCare(
  emergencyId: string,
  actorId?: string,
  actorName?: string,
  actorRole?: string
): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const finalActorName = actorName || "Attending ER Doctor";
  const finalActorId = actorId || "DOC-1001";
  const finalRole = actorRole || "doctor";
  const nowIso = new Date().toISOString();

  em.status = "EMERGENCY_CARE";
  em.care_started_at = nowIso;
  em.triage_started_at = nowIso;
  em.version += 1;
  em.updated_at = nowIso;

  em.timeline.unshift({
    id: `TL-${Date.now()}`,
    status: "EMERGENCY_CARE",
    title: "Emergency Care & Clinical Resuscitation Started",
    description: `Clinical assessment and vital stabilization started by ${finalActorName}. Attending doctor assumes clinical lead.`,
    timestamp: nowIso,
    actor_name: finalActorName,
    actor_role: finalRole,
  });

  all[idx] = em;
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_CARE_STARTED",
    actor_id: finalActorId,
    actor_name: finalActorName,
    actor_role: finalRole,
    patient_id: em.is_unknown_patient ? undefined : em.patient_id,
    organization_id: em.hospital_id,
    organization_name: em.hospital_name,
    summary: `Emergency medical care started for ${em.patient_name} (${em.id})`,
    reference_id: em.id,
  });

  return { success: true, case: em, emergency: em, message: "Emergency care started." };
}

export function startEmergencyTriage(
  emergencyId: string,
  triageLevel?: TriagePriority,
  actorId?: string,
  actorName?: string,
  actorRole?: string
): EmergencyResult {
  const res = startEmergencyCare(emergencyId, actorId, actorName, actorRole);
  if (res.emergency) {
    if (triageLevel) res.emergency.triage_level = triageLevel;
    res.emergency.status = "TRIAGE_STARTED";
    res.case = res.emergency;
    saveEmergencies(getAllEmergencies());
  }
  return res;
}

// ------------------------------------------------------------
// 7. UNKNOWN PATIENT -> CANONICAL PATIENT LINKING
// ------------------------------------------------------------
export function linkEmergencyPatient(params: {
  emergencyId: string;
  patientId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === params.emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const canonicalPatient = findIdentityById(params.patientId);
  if (!canonicalPatient) {
    return { success: false, message: `Canonical patient ID ${params.patientId} not found in verified registry.` };
  }

  const nowIso = new Date().toISOString();
  const oldPatientLabel = em.patient_name;

  em.is_unknown_patient = false;
  em.patient_id = canonicalPatient.identifier || canonicalPatient.id;
  em.patient_name = canonicalPatient.fullName;
  em.patient_phone = canonicalPatient.phone || em.patient_phone;
  if (canonicalPatient.patientData?.bloodGroup) {
    em.blood_group = canonicalPatient.patientData.bloodGroup;
  }
  const emgContact = canonicalPatient.patientData?.emergencyContact;
  em.medical_snapshot = {
    blood_group: em.blood_group || "O+",
    emergency_contact: emgContact ? `${emgContact.name} (${emgContact.phone})` : undefined,
    known_allergies: canonicalPatient.patientData?.allergies || [],
  };
  em.version += 1;
  em.updated_at = nowIso;

  em.timeline.unshift({
    id: `TL-${Date.now()}`,
    status: em.status,
    title: "Patient Identity Verified & Linked",
    description: `Linked ${oldPatientLabel} to canonical profile ${em.patient_name} (${em.patient_id}) by ${params.actorName}.`,
    timestamp: nowIso,
    actor_name: params.actorName,
    actor_role: params.actorRole,
  });

  all[idx] = em;
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_PATIENT_LINKED",
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    patient_id: em.patient_id,
    organization_id: em.hospital_id,
    organization_name: em.hospital_name,
    summary: `Linked unknown emergency ${em.id} to verified patient ${em.patient_name} (${em.patient_id})`,
    reference_id: em.id,
  });

  return { success: true, case: em, emergency: em, message: `Successfully linked to patient ${em.patient_name}.` };
}

// ------------------------------------------------------------
// 8. HANDOFF TO ADMISSION (STEP 4 HANDOFF)
// ------------------------------------------------------------
export function handoffToAdmission(params: {
  emergencyId: string;
  doctorId: string;
  doctorName: string;
  departmentName: string;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === params.emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const nowIso = new Date().toISOString();

  // Create canonical admission request in AdmissionStore
  const admRes = requestAdmission({
    patientId: em.patient_id,
    patientName: em.patient_name,
    doctorId: params.doctorId,
    doctorName: params.doctorName,
    departmentName: params.departmentName,
    facilityId: em.hospital_id,
    facilityName: em.hospital_name,
    admissionType: "EMERGENCY",
    reason: `Emergency admission handoff: ${params.reason}`,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
  });

  const admId = admRes.admission?.id || `ADM-EMG-${Date.now()}`;

  em.status = "ADMITTED";
  em.handoff_type = "ADMISSION";
  em.handoff_reference = admId;
  em.handoff_notes = params.reason;
  em.completed_at = nowIso;
  em.version += 1;
  em.updated_at = nowIso;

  em.timeline.unshift({
    id: `TL-${Date.now()}`,
    status: "ADMITTED",
    title: "Handed Off to Inpatient Admission",
    description: `Emergency care transitioned to Inpatient Admission #${admId} under ${params.doctorName} (${params.departmentName}).`,
    timestamp: nowIso,
    actor_name: params.actorName,
    actor_role: params.actorRole,
  });

  all[idx] = em;
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_HANDOFF_ADMISSION",
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    patient_id: em.is_unknown_patient ? undefined : em.patient_id,
    organization_id: em.hospital_id,
    organization_name: em.hospital_name,
    summary: `Emergency ${em.id} handed off to inpatient admission ${admId}`,
    reference_id: em.id,
  });

  return { 
    success: true, 
    case: em, 
    emergency: em, 
    admissionId: admId, 
    message: "Emergency handed off to inpatient admission." 
  };
}

// ------------------------------------------------------------
// 9. HANDOFF TO FACILITY TRANSFER
// ------------------------------------------------------------
export function handoffTransfer(params: {
  emergencyId: string;
  destinationFacility: string;
  transferReason: string;
  ambulanceRef?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === params.emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const nowIso = new Date().toISOString();

  em.status = "TRANSFERRED";
  em.handoff_type = "TRANSFER";
  em.handoff_destination = params.destinationFacility;
  em.handoff_reference = params.ambulanceRef;
  em.handoff_notes = params.transferReason;
  em.completed_at = nowIso;
  em.version += 1;
  em.updated_at = nowIso;

  em.timeline.unshift({
    id: `TL-${Date.now()}`,
    status: "TRANSFERRED",
    title: "Patient Transferred to External Facility",
    description: `Transferred to ${params.destinationFacility}. Reason: ${params.transferReason}. Vehicle Ref: ${params.ambulanceRef || "Dispatched Ambulance"}.`,
    timestamp: nowIso,
    actor_name: params.actorName,
    actor_role: params.actorRole,
  });

  all[idx] = em;
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_TRANSFERRED",
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    patient_id: em.is_unknown_patient ? undefined : em.patient_id,
    organization_id: em.hospital_id,
    organization_name: em.hospital_name,
    summary: `Transferred emergency patient ${em.patient_name} to ${params.destinationFacility}`,
    reference_id: em.id,
  });

  return { success: true, case: em, emergency: em, message: `Patient transferred to ${params.destinationFacility}.` };
}

// ------------------------------------------------------------
// 10. DISCHARGE / NORMAL HOSPITAL CARE COMPLETION
// ------------------------------------------------------------
export function handoffDischarge(params: {
  emergencyId: string;
  dischargeNotes?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
}): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === params.emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const finalActorName = params.actorName || "ER Doctor";
  const finalActorId = params.actorId || "DOC-1001";
  const finalRole = params.actorRole || "doctor";
  const nowIso = new Date().toISOString();

  em.status = "DISCHARGED";
  em.handoff_type = "DISCHARGE";
  em.handoff_notes = params.dischargeNotes || "Emergency care completed. Patient stabilized.";
  em.completed_at = nowIso;
  em.version += 1;
  em.updated_at = nowIso;

  em.timeline.unshift({
    id: `TL-${Date.now()}`,
    status: "DISCHARGED",
    title: "Emergency Care Stabilized & Patient Discharged",
    description: `Emergency treatment completed and patient safely discharged. Summary: ${em.handoff_notes}`,
    timestamp: nowIso,
    actor_name: finalActorName,
    actor_role: finalRole,
  });

  all[idx] = em;
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_DISCHARGED",
    actor_id: finalActorId,
    actor_name: finalActorName,
    actor_role: finalRole,
    patient_id: em.is_unknown_patient ? undefined : em.patient_id,
    organization_id: em.hospital_id,
    organization_name: em.hospital_name,
    summary: `Discharged emergency patient ${em.patient_name} after stabilization (${em.id})`,
    reference_id: em.id,
  });

  return { success: true, case: em, emergency: em, message: "Emergency care completed and patient discharged." };
}

// ------------------------------------------------------------
// 11. CANCEL EMERGENCY
// ------------------------------------------------------------
export function cancelEmergencyCase(
  emergencyIdOrParams: string | {
    emergencyId: string;
    reason?: string;
    actorId?: string;
    actorName?: string;
    actorRole?: string;
  },
  reasonArg?: string,
  actorIdArg?: string,
  actorNameArg?: string,
  actorRoleArg?: string
): EmergencyResult {
  const targetId = typeof emergencyIdOrParams === "string" ? emergencyIdOrParams : emergencyIdOrParams.emergencyId;
  const reasonText = (typeof emergencyIdOrParams === "object" ? emergencyIdOrParams.reason : reasonArg)?.trim() || "Emergency cancelled by staff.";
  const finalActorId = typeof emergencyIdOrParams === "object" ? emergencyIdOrParams.actorId || "STAFF" : actorIdArg || "STAFF";
  const finalActorName = typeof emergencyIdOrParams === "object" ? emergencyIdOrParams.actorName || "Hospital ER Desk" : actorNameArg || "Hospital ER Desk";
  const finalRole = typeof emergencyIdOrParams === "object" ? emergencyIdOrParams.actorRole || "emergency_staff" : actorRoleArg || "emergency_staff";

  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === targetId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const nowIso = new Date().toISOString();

  em.status = "CANCELLED";
  em.cancellation_reason = reasonText;
  em.cancelled_at = nowIso;
  em.version += 1;
  em.updated_at = nowIso;

  em.timeline.unshift({
    id: `TL-${Date.now()}`,
    status: "CANCELLED",
    title: "Emergency Ingress Cancelled",
    description: `Emergency alert cancelled by ${finalActorName}. Reason: ${reasonText}`,
    timestamp: nowIso,
    actor_name: finalActorName,
    actor_role: finalRole,
  });

  all[idx] = em;
  saveEmergencies(all);

  appendAuditEvent({
    event_type: "EMERGENCY_CANCELLED",
    actor_id: finalActorId,
    actor_name: finalActorName,
    actor_role: finalRole,
    patient_id: em.is_unknown_patient ? undefined : em.patient_id,
    organization_id: em.hospital_id,
    organization_name: em.hospital_name,
    summary: `Cancelled emergency ${em.id}. Reason: ${reasonText}`,
    reference_id: em.id,
  });

  return { success: true, case: em, emergency: em, message: "Emergency case cancelled." };
}

// Compatibility exports
export function completeEmergencyCase(
  emergencyId: string,
  actorId?: string,
  actorName?: string,
  actorRole?: string
): EmergencyResult {
  const all = getAllEmergencies();
  const idx = all.findIndex((e) => e.id === emergencyId);
  if (idx < 0) return { success: false, message: "Emergency case not found." };

  const em = all[idx];
  const nowIso = new Date().toISOString();
  em.status = "COMPLETED";
  em.completed_at = nowIso;
  em.version += 1;
  em.updated_at = nowIso;

  all[idx] = em;
  saveEmergencies(all);

  return { success: true, case: em, emergency: em, message: "Emergency case completed." };
}

export const markEmergencyArrived = (emergencyId: string, actorId?: string, actorName?: string, actorRole?: string) =>
  markPatientArrived(emergencyId, actorId || "STAFF", actorName || "Staff", actorRole || "emergency_staff");

export const cancelEmergency = (emergencyId: string, reason?: string, actorId?: string, actorName?: string, actorRole?: string) =>
  cancelEmergencyCase({ emergencyId, reason, actorId, actorName, actorRole });

export function acknowledgeHospitalPreAlert(emergencyId: string): PatientEmergencyCase | null {
  const res = acknowledgeEmergency(emergencyId, "STAFF", "Hospital ER Desk", "emergency_staff");
  return res.case || null;
}

export function createEmergencyRequest(params: {
  patientId: string;
  emergencyType: EmergencyType;
  description: string;
  arrivingByAmbulance?: boolean;
  targetFacilityId?: string;
  targetFacilityName?: string;
  location?: string;
}): EmergencyResult {
  const existing = getActiveEmergencyForPatient(params.patientId);
  if (existing) {
    return {
      success: true,
      case: existing,
      emergency: existing,
      message: "An active emergency case is already in progress.",
    };
  }

  return createEmergencyCase({
    hospitalId: params.targetFacilityId || "FAC-1001",
    hospitalName: params.targetFacilityName || "City Hospital Trauma Center",
    patientId: params.patientId,
    patientName: "Rahul Verma",
    emergencyType: params.emergencyType || "CHEST_PAIN",
    chiefComplaint: params.description || "Emergency Assistance Call",
    arrivalMethod: params.arrivingByAmbulance ? "AMBULANCE" : "WALK_IN",
    location: params.location,
    actorId: params.patientId || "PAT-1001",
    actorName: "Rahul Verma",
    actorRole: "patient",
  });
}