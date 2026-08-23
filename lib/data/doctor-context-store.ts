// ============================================================
// MEDORA — CANONICAL DOCTOR CONTEXT & WORKSPACE STORE
// Single Authoritative Source for Doctor Identity, Facility Context,
// Duty Status, Session State, and Multi-Facility Affiliations
// ============================================================

import { 
  findIdentityById, 
  findIdentityByEmail, 
  StoredIdentity, 
  StoredDoctorAffiliation 
} from "@/lib/data/identity-store";

export type DoctorDutyStatus = "AVAILABLE" | "IN_CONSULTATION" | "ON_BREAK" | "OFF_DUTY";
export type DoctorSessionStatus = "ACTIVE" | "PAUSED" | "ENDED";

export interface DoctorActiveContext {
  doctorId: string; // e.g. DOC-1001
  doctorName: string;
  specialization: string;
  medicalRegNo: string;
  activeAffiliationId: string;
  facilityId: string; // e.g. HSP-1001
  facilityName: string;
  departmentName: string;
  roleTitle: string;
  opdRoom: string;
  scheduleNotes?: string;
  dutyStatus: DoctorDutyStatus;
  sessionStatus: DoctorSessionStatus;
  authorizedAffiliations: StoredDoctorAffiliation[];
}

// In-memory runtime state for active doctor context, duty status & session control
const doctorContextMap: Record<string, { activeAffiliationId: string; dutyStatus: DoctorDutyStatus; sessionStatus: DoctorSessionStatus }> = {};

/**
 * Resolves the canonical Doctor context for a given authenticated doctor identifier or UUID
 */
export function getDoctorContext(doctorIdentifierOrId: string): DoctorActiveContext | null {
  const identity = findIdentityById(doctorIdentifierOrId) || findIdentityByEmail(doctorIdentifierOrId);
  if (!identity || identity.role !== "doctor" || !identity.doctorData) {
    return null;
  }

  const doctorId = identity.identifier || identity.id;
  const affiliations = identity.doctorData.affiliations || [];

  if (affiliations.length === 0) {
    return {
      doctorId,
      doctorName: identity.fullName || "Medical Doctor",
      specialization: identity.doctorData.specialization || "General Medicine",
      medicalRegNo: identity.doctorData.medicalRegNo || "MCI-PENDING",
      activeAffiliationId: "",
      facilityId: "",
      facilityName: "No Affiliated Facility",
      departmentName: "Unassigned Department",
      roleTitle: "Medical Doctor",
      opdRoom: "N/A",
      dutyStatus: "OFF_DUTY",
      sessionStatus: "ACTIVE",
      authorizedAffiliations: [],
    };
  }

  // Retrieve or initialize active state
  let state = doctorContextMap[doctorId];
  if (!state || !affiliations.some((a) => a.id === state.activeAffiliationId)) {
    state = {
      activeAffiliationId: affiliations[0]?.id || "",
      dutyStatus: "AVAILABLE",
      sessionStatus: "ACTIVE",
    };
    doctorContextMap[doctorId] = state;
  }

  const activeAff = affiliations.find((a) => a.id === state.activeAffiliationId) || affiliations[0];

  return {
    doctorId,
    doctorName: identity.fullName || "Medical Doctor",
    specialization: identity.doctorData.specialization || "General Medicine",
    medicalRegNo: identity.doctorData.medicalRegNo || "MCI-PENDING",
    activeAffiliationId: activeAff?.id || "",
    facilityId: activeAff?.organizationIdentifier || activeAff?.organizationId || "",
    facilityName: activeAff?.organizationName || "Healthcare Facility",
    departmentName: activeAff?.departmentName || "General OPD",
    roleTitle: activeAff?.roleTitle || "Specialist",
    opdRoom: activeAff?.opdRoom || "OPD Room 1",
    scheduleNotes: activeAff?.scheduleNotes,
    dutyStatus: state.dutyStatus,
    sessionStatus: state.sessionStatus || "ACTIVE",
    authorizedAffiliations: affiliations,
  };
}

/**
 * Switches the active facility affiliation for an authenticated doctor.
 * Validates that the requested affiliation belongs strictly to the doctor (Anti-IDOR).
 */
export function setActiveDoctorAffiliation(
  doctorIdentifierOrId: string, 
  affiliationId: string
): { success: boolean; error?: string; context?: DoctorActiveContext } {
  const identity = findIdentityById(doctorIdentifierOrId) || findIdentityByEmail(doctorIdentifierOrId);
  if (!identity || identity.role !== "doctor" || !identity.doctorData) {
    return { success: false, error: "UNAUTHORIZED_DOCTOR" };
  }

  const doctorId = identity.identifier || identity.id;
  const affiliations = identity.doctorData.affiliations || [];
  const targetAff = affiliations.find((a) => a.id === affiliationId || a.organizationIdentifier === affiliationId);

  if (!targetAff) {
    return { 
      success: false, 
      error: "UNAUTHORIZED_FACILITY: Doctor is not affiliated with the requested facility." 
    };
  }

  if (!doctorContextMap[doctorId]) {
    doctorContextMap[doctorId] = { activeAffiliationId: targetAff.id || "", dutyStatus: "AVAILABLE", sessionStatus: "ACTIVE" };
  } else {
    doctorContextMap[doctorId].activeAffiliationId = targetAff.id || "";
  }

  const updatedContext = getDoctorContext(doctorId);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("medora-doctor-context-changed", { detail: updatedContext }));
  }

  return { success: true, context: updatedContext! };
}

/**
 * Updates the operational duty status for an authenticated doctor
 */
export function setDoctorDutyStatus(
  doctorIdentifierOrId: string, 
  status: DoctorDutyStatus
): { success: boolean; error?: string; dutyStatus?: DoctorDutyStatus } {
  const identity = findIdentityById(doctorIdentifierOrId) || findIdentityByEmail(doctorIdentifierOrId);
  if (!identity || identity.role !== "doctor") {
    return { success: false, error: "UNAUTHORIZED_DOCTOR" };
  }

  const doctorId = identity.identifier || identity.id;

  if (!doctorContextMap[doctorId]) {
    const defaultAff = identity.doctorData?.affiliations[0]?.id || "";
    doctorContextMap[doctorId] = { activeAffiliationId: defaultAff, dutyStatus: status, sessionStatus: "ACTIVE" };
  } else {
    doctorContextMap[doctorId].dutyStatus = status;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("medora-doctor-context-changed", { 
        detail: getDoctorContext(doctorId) 
      })
    );
  }

  return { success: true, dutyStatus: status };
}

/**
 * Updates the operational OPD session status (ACTIVE, PAUSED, ENDED)
 */
export function setDoctorSessionStatus(
  doctorIdentifierOrId: string,
  sessionStatus: DoctorSessionStatus
): { success: boolean; error?: string; sessionStatus?: DoctorSessionStatus } {
  const identity = findIdentityById(doctorIdentifierOrId) || findIdentityByEmail(doctorIdentifierOrId);
  if (!identity || identity.role !== "doctor") {
    return { success: false, error: "UNAUTHORIZED_DOCTOR" };
  }

  const doctorId = identity.identifier || identity.id;

  if (!doctorContextMap[doctorId]) {
    const defaultAff = identity.doctorData?.affiliations[0]?.id || "";
    doctorContextMap[doctorId] = { activeAffiliationId: defaultAff, dutyStatus: "AVAILABLE", sessionStatus };
  } else {
    doctorContextMap[doctorId].sessionStatus = sessionStatus;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("medora-doctor-context-changed", { 
        detail: getDoctorContext(doctorId) 
      })
    );
  }

  return { success: true, sessionStatus };
}

/**
 * Verifies whether a doctor is authorized to access a given facility/department
 */
export function isDoctorAuthorizedForFacility(
  doctorIdentifierOrId: string, 
  facilityIdentifier: string
): boolean {
  const identity = findIdentityById(doctorIdentifierOrId) || findIdentityByEmail(doctorIdentifierOrId);
  if (!identity || identity.role !== "doctor" || !identity.doctorData) {
    return false;
  }
  return identity.doctorData.affiliations.some(
    (a) => a.organizationIdentifier === facilityIdentifier || a.organizationId === facilityIdentifier
  );
}