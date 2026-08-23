// ============================================================
// MEDORA — AUTHORITATIVE EMERGENCY & URGENT CARE STORE
// Pre-Alerts, Ambulance Ingress, ER Hospital Triage Lifecycle
// ============================================================

export type EmergencyType =
  | "CHEST_PAIN"
  | "BREATHING_DIFFICULTY"
  | "UNCONSCIOUSNESS"
  | "MAJOR_INJURY"
  | "SEVERE_BLEEDING"
  | "OTHER";

export type EmergencyStatus =
  | "INITIATED"
  | "HOSPITAL_NOTIFIED"
  | "HOSPITAL_ACKNOWLEDGED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "TRIAGE_STARTED"
  | "IN_TREATMENT"
  | "ADMITTED"
  | "COMPLETED"
  | "CANCELLED";

export type AmbulanceStatus = "NOT_REQUESTED" | "EN_ROUTE" | "ARRIVED" | "COMPLETED";

export type TriagePriority = "red_critical" | "yellow_urgent" | "green_standard";

export interface PatientEmergencyCase {
  id: string;
  case_number: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  blood_group?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_type: EmergencyType;
  description: string;
  arriving_by_ambulance: boolean;
  ambulance_status: AmbulanceStatus;
  target_facility_id: string;
  target_facility_name: string;
  status: EmergencyStatus;
  triage_level?: TriagePriority;
  location?: string;
  eta_minutes?: number;
  medical_snapshot?: {
    blood_group?: string;
    emergency_contact?: string;
    known_allergies?: string[];
  };
  hospital_notified_at?: string;
  hospital_acknowledged_at?: string;
  acknowledged_by?: string;
  arrived_at?: string;
  triage_started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export type EmergencyCase = PatientEmergencyCase;

let EMERGENCIES_STORE: PatientEmergencyCase[] = [
  {
    id: "EMR-1001",
    case_number: "CASE-EMR-2026-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    patient_phone: "+91 98765 43210",
    blood_group: "O+",
    emergency_contact_name: "Priya Verma",
    emergency_contact_phone: "+91 98765 43219",
    emergency_type: "CHEST_PAIN",
    description: "Acute Chest Pain with Radiating Left Arm Pain and Shortness of Breath",
    arriving_by_ambulance: false,
    ambulance_status: "ARRIVED",
    target_facility_id: "FAC-1001",
    target_facility_name: "City Hospital Trauma Center",
    status: "ARRIVED",
    triage_level: "red_critical",
    location: "Bhubaneswar",
    eta_minutes: 0,
    medical_snapshot: {
      blood_group: "O+",
      emergency_contact: "Priya Verma (+91 98765 43219)",
      known_allergies: ["Penicillin"],
    },
    hospital_notified_at: "2026-08-20T10:15:00Z",
    hospital_acknowledged_at: "2026-08-20T10:17:00Z",
    acknowledged_by: "Dr. Emergency Desk",
    arrived_at: "2026-08-20T10:35:00Z",
    triage_started_at: "2026-08-20T10:37:00Z",
    created_at: "2026-08-20T10:15:00Z",
    updated_at: "2026-08-20T10:37:00Z",
  },
];

export function getAllEmergencies(): PatientEmergencyCase[] {
  return [...EMERGENCIES_STORE];
}

export function getEmergencyCaseById(id: string): PatientEmergencyCase | null {
  if (!id) return null;
  return EMERGENCIES_STORE.find((e) => e.id === id) || null;
}

export function getEmergenciesForPatient(patientId: string): PatientEmergencyCase[] {
  if (!patientId) return [];
  return EMERGENCIES_STORE.filter((e) => e.patient_id === patientId);
}

export function getActiveEmergencyForPatient(patientId: string): PatientEmergencyCase | null {
  if (!patientId) return null;
  return (
    EMERGENCIES_STORE.find(
      (e) => e.patient_id === patientId && e.status !== "COMPLETED" && e.status !== "CANCELLED"
    ) || null
  );
}

export function getEmergenciesForFacility(facilityId: string): PatientEmergencyCase[] {
  if (!facilityId) return [];
  return EMERGENCIES_STORE.filter((e) => e.target_facility_id === facilityId);
}

export function createEmergencyRequest(params: {
  patientId: string;
  emergencyType: EmergencyType;
  description: string;
  arrivingByAmbulance?: boolean;
  targetFacilityId?: string;
  targetFacilityName?: string;
  location?: string;
}): { success: boolean; case?: PatientEmergencyCase; message: string } {
  const existing = getActiveEmergencyForPatient(params.patientId);
  if (existing) {
    return {
      success: true,
      case: existing,
      message: "An active emergency case is already in progress.",
    };
  }

  const now = new Date().toISOString();
  const caseId = `EMR-${Date.now()}`;
  const isAmb = params.arrivingByAmbulance ?? true;

  const newCase: PatientEmergencyCase = {
    id: caseId,
    case_number: `CASE-${caseId}`,
    patient_id: params.patientId,
    patient_name: "Rahul Verma",
    patient_phone: "+91 98765 43210",
    blood_group: "O+",
    emergency_contact_name: "Priya Verma",
    emergency_contact_phone: "+91 98765 43219",
    emergency_type: params.emergencyType,
    description: params.description,
    arriving_by_ambulance: isAmb,
    ambulance_status: isAmb ? "EN_ROUTE" : "NOT_REQUESTED",
    target_facility_id: params.targetFacilityId || "FAC-1001",
    target_facility_name: params.targetFacilityName || "City Hospital Trauma Center",
    status: "HOSPITAL_NOTIFIED",
    location: params.location || "Bhubaneswar",
    eta_minutes: isAmb ? 15 : 0,
    medical_snapshot: {
      blood_group: "O+",
      emergency_contact: "Priya Verma (+91 98765 43219)",
      known_allergies: ["Penicillin"],
    },
    hospital_notified_at: now,
    created_at: now,
    updated_at: now,
  };

  EMERGENCIES_STORE.unshift(newCase);
  return {
    success: true,
    case: newCase,
    message: "Emergency assistance initiated. Hospital trauma desk alerted.",
  };
}

export function createEmergencyCase(params: {
  patientId: string;
  patientName: string;
  patientPhone: string;
  bloodGroup?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  facilityId: string;
  facilityName: string;
  organizationIdentifier: string;
  chiefComplaint: string;
  ambulanceEnRoute: boolean;
  etaMinutes?: number;
}): PatientEmergencyCase {
  const res = createEmergencyRequest({
    patientId: params.patientId,
    emergencyType: "CHEST_PAIN",
    description: params.chiefComplaint,
    arrivingByAmbulance: params.ambulanceEnRoute,
    targetFacilityId: params.facilityId,
    targetFacilityName: params.facilityName,
  });
  return res.case!;
}

export function acknowledgeEmergency(
  emergencyId: string,
  acknowledgedBy: string
): { success: boolean; case?: PatientEmergencyCase; message: string } {
  const em = EMERGENCIES_STORE.find((e) => e.id === emergencyId);
  if (!em) return { success: false, message: "Emergency case not found." };
  em.status = "HOSPITAL_ACKNOWLEDGED";
  em.acknowledged_by = acknowledgedBy;
  em.hospital_acknowledged_at = new Date().toISOString();
  em.updated_at = new Date().toISOString();
  return { success: true, case: em, message: "Hospital acknowledged pre-alert." };
}

export function acknowledgeHospitalPreAlert(emergencyId: string): PatientEmergencyCase | null {
  const res = acknowledgeEmergency(emergencyId, "Hospital ER Desk");
  return res.case || null;
}

export function markPatientArrived(
  emergencyId: string
): { success: boolean; case?: PatientEmergencyCase; message: string } {
  const em = EMERGENCIES_STORE.find((e) => e.id === emergencyId);
  if (!em) return { success: false, message: "Emergency case not found." };
  em.status = "ARRIVED";
  em.ambulance_status = "ARRIVED";
  em.arrived_at = new Date().toISOString();
  em.updated_at = new Date().toISOString();
  return { success: true, case: em, message: "Patient arrived at trauma bay." };
}

export function startEmergencyTriage(
  emergencyId: string,
  triageLevel: TriagePriority
): { success: boolean; case?: PatientEmergencyCase; message: string } {
  const em = EMERGENCIES_STORE.find((e) => e.id === emergencyId);
  if (!em) return { success: false, message: "Emergency case not found." };
  em.status = "TRIAGE_STARTED";
  em.triage_level = triageLevel;
  em.triage_started_at = new Date().toISOString();
  em.updated_at = new Date().toISOString();
  return { success: true, case: em, message: "Emergency triage started." };
}

export function completeEmergencyCase(
  emergencyId: string
): { success: boolean; case?: PatientEmergencyCase; message: string } {
  const em = EMERGENCIES_STORE.find((e) => e.id === emergencyId);
  if (!em) return { success: false, message: "Emergency case not found." };
  em.status = "COMPLETED";
  em.completed_at = new Date().toISOString();
  em.updated_at = new Date().toISOString();
  return { success: true, case: em, message: "Emergency case completed." };
}

export function cancelEmergencyCase(
  emergencyId: string,
  reason: string
): { success: boolean; case?: PatientEmergencyCase; message: string } {
  const em = EMERGENCIES_STORE.find((e) => e.id === emergencyId);
  if (!em) return { success: false, message: "Emergency case not found." };
  em.status = "CANCELLED";
  em.cancellation_reason = reason;
  em.cancelled_at = new Date().toISOString();
  em.updated_at = new Date().toISOString();
  return { success: true, case: em, message: "Emergency case cancelled." };
}