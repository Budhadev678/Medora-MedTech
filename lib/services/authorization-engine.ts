// ============================================================
// MEDORA — COMPREHENSIVE ROLE, PERMISSION & AUTHORIZATION ENGINE
// MODIFICATION PHASE A.3
// ============================================================

import { 
  StoredIdentity, 
  getPersonMemberships, 
  getMembershipById,
  findIdentityById
} from "@/lib/data/identity-store";
import { getPatientConsents } from "@/lib/data/consent-store";
import { getPatientOrganizationRelationships } from "@/lib/data/relationship-store";
import { getPatientEncounters } from "@/lib/data/encounter-store";
import { logAuditEvent } from "@/lib/data/audit-store";
import type { 
  MedoraPermission, 
  AuthorizationResult, 
  AuthorizationDecision,
  EmergencyAccessLog,
  ConsentPurpose,
  ConsentDataScope
} from "@/types/database.types";
import type { UserRole } from "@/lib/constants";

// ============================================================
// 1. ROLE TO PERMISSION MATRIX (LEAST PRIVILEGE)
// ============================================================

export const ROLE_PERMISSIONS_MAP: Record<string, MedoraPermission[]> = {
  patient: [
    "PATIENT_VIEW",
    "PATIENT_UPDATE",
    "APPOINTMENT_VIEW",
    "APPOINTMENT_CREATE",
    "APPOINTMENT_CANCEL",
    "ENCOUNTER_VIEW",
    "CLINICAL_RECORD_VIEW",
    "PRESCRIPTION_VIEW",
    "LAB_ORDER_VIEW",
    "LAB_RESULT_VIEW",
    "BILL_VIEW",
    "BILL_DISPUTE_MANAGE",
    "AUDIT_VIEW",
  ],

  doctor: [
    "PATIENT_VIEW",
    "APPOINTMENT_VIEW",
    "APPOINTMENT_CREATE",
    "APPOINTMENT_UPDATE",
    "APPOINTMENT_CANCEL",
    "ENCOUNTER_VIEW",
    "ENCOUNTER_CREATE",
    "ENCOUNTER_UPDATE",
    "ENCOUNTER_COMPLETE",
    "ENCOUNTER_CANCEL",
    "CLINICAL_RECORD_VIEW",
    "CLINICAL_RECORD_CREATE",
    "CLINICAL_RECORD_UPDATE",
    "CLINICAL_RECORD_AMEND",
    "PRESCRIPTION_VIEW",
    "PRESCRIPTION_CREATE",
    "PRESCRIPTION_UPDATE",
    "PRESCRIPTION_CANCEL",
    "LAB_ORDER_VIEW",
    "LAB_ORDER_CREATE",
    "LAB_ORDER_CANCEL",
    "LAB_RESULT_VIEW",
    "EMERGENCY_ACCESS_TRIGGER",
    "EMERGENCY_ACCESS_VIEW",
    "AUDIT_VIEW",
  ],

  receptionist: [
    "PATIENT_VIEW",
    "PATIENT_UPDATE",
    "APPOINTMENT_VIEW",
    "APPOINTMENT_CREATE",
    "APPOINTMENT_UPDATE",
    "APPOINTMENT_CANCEL",
    "ENCOUNTER_VIEW",
    "ENCOUNTER_CREATE",
    "BILL_VIEW",
    "BILL_CREATE",
    "AUDIT_VIEW",
  ],

  pharmacist: [
    "PRESCRIPTION_VIEW",
    "PHARMACY_ORDER_VIEW",
    "PHARMACY_DISPENSE",
    "BILL_VIEW",
    "BILL_CREATE",
    "AUDIT_VIEW",
  ],

  pharmacy_staff: [
    "PRESCRIPTION_VIEW",
    "PHARMACY_ORDER_VIEW",
    "PHARMACY_DISPENSE",
    "BILL_VIEW",
    "BILL_CREATE",
    "AUDIT_VIEW",
  ],

  lab_technician: [
    "LAB_ORDER_VIEW",
    "LAB_SAMPLE_COLLECT",
    "LAB_RESULT_CREATE",
    "LAB_RESULT_VIEW",
    "BILL_VIEW",
    "BILL_CREATE",
    "AUDIT_VIEW",
  ],

  lab_staff: [
    "LAB_ORDER_VIEW",
    "LAB_SAMPLE_COLLECT",
    "LAB_RESULT_CREATE",
    "LAB_RESULT_VIEW",
    "BILL_VIEW",
    "BILL_CREATE",
    "AUDIT_VIEW",
  ],

  pathologist: [
    "LAB_ORDER_VIEW",
    "LAB_RESULT_CREATE",
    "LAB_RESULT_VERIFY",
    "LAB_RESULT_VIEW",
    "AUDIT_VIEW",
  ],

  hospital_admin: [
    "ORGANIZATION_VIEW",
    "ORGANIZATION_UPDATE",
    "MEMBER_VIEW",
    "MEMBER_INVITE",
    "MEMBER_UPDATE",
    "MEMBER_REVOKE",
    "APPOINTMENT_VIEW",
    "ENCOUNTER_VIEW",
    "BILL_VIEW",
    "BILL_CREATE",
    "BILL_UPDATE",
    "AUDIT_VIEW",
  ],

  clinic_admin: [
    "ORGANIZATION_VIEW",
    "ORGANIZATION_UPDATE",
    "MEMBER_VIEW",
    "MEMBER_INVITE",
    "MEMBER_UPDATE",
    "MEMBER_REVOKE",
    "APPOINTMENT_VIEW",
    "ENCOUNTER_VIEW",
    "BILL_VIEW",
    "BILL_CREATE",
    "BILL_UPDATE",
    "AUDIT_VIEW",
  ],

  pharmacy_admin: [
    "ORGANIZATION_VIEW",
    "ORGANIZATION_UPDATE",
    "MEMBER_VIEW",
    "MEMBER_INVITE",
    "MEMBER_UPDATE",
    "MEMBER_REVOKE",
    "PHARMACY_ORDER_VIEW",
    "BILL_VIEW",
    "AUDIT_VIEW",
  ],

  lab_admin: [
    "ORGANIZATION_VIEW",
    "ORGANIZATION_UPDATE",
    "MEMBER_VIEW",
    "MEMBER_INVITE",
    "MEMBER_UPDATE",
    "MEMBER_REVOKE",
    "LAB_ORDER_VIEW",
    "BILL_VIEW",
    "AUDIT_VIEW",
  ],

  blood_bank_staff: [
    "ORGANIZATION_VIEW",
    "MEMBER_VIEW",
    "AUDIT_VIEW",
  ],

  ambulance_staff: [
    "EMERGENCY_ACCESS_VIEW",
    "AUDIT_VIEW",
  ],

  insurance_staff: [
    "PATIENT_VIEW",
    "BILL_VIEW",
    "BILL_UPDATE",
    "AUDIT_VIEW",
  ],

  finance_staff: [
    "BILL_VIEW",
    "BILL_CREATE",
    "BILL_UPDATE",
    "BILL_DISPUTE_MANAGE",
    "AUDIT_VIEW",
  ],

  admin: [
    "PLATFORM_MANAGE",
    "ORGANIZATION_VIEW",
    "ORGANIZATION_UPDATE",
    "MEMBER_VIEW",
    "MEMBER_INVITE",
    "MEMBER_UPDATE",
    "MEMBER_REVOKE",
    "AUDIT_VIEW",
    "AUDIT_EXPORT",
  ],

  staff: [
    "PATIENT_VIEW",
    "APPOINTMENT_VIEW",
    "ENCOUNTER_VIEW",
    "AUDIT_VIEW",
  ]
};

// ============================================================
// 2. BREAK-GLASS EMERGENCY ACCESS IN-MEMORY STORE
// ============================================================

const EMERGENCY_STORAGE_KEY = "medora_emergency_access_v1";

let inMemoryEmergencyAccesses: EmergencyAccessLog[] = [
  {
    id: "EMG-ACC-1001",
    actor_id: "DOC-1001",
    actor_name: "Dr. Ananya Sharma",
    actor_role: "doctor",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    organization_id: "HSP-1001",
    reason: "Severe acute chest pain with acute diaphoresis in Emergency Trauma Care.",
    resource_accessed: "EMERGENCY_MEDICAL_SNAPSHOT",
    triggered_at: "2026-08-20T10:00:00Z",
    expires_at: "2026-08-20T14:00:00Z",
    status: "ACTIVE",
  }
];

export function getAllEmergencyAccessLogs(): EmergencyAccessLog[] {
  if (typeof window === "undefined") {
    return inMemoryEmergencyAccesses;
  }
  try {
    const raw = localStorage.getItem(EMERGENCY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(inMemoryEmergencyAccesses));
      return inMemoryEmergencyAccesses;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : inMemoryEmergencyAccesses;
  } catch {
    return inMemoryEmergencyAccesses;
  }
}

export function saveEmergencyAccessLog(log: EmergencyAccessLog): void {
  const index = inMemoryEmergencyAccesses.findIndex((l) => l.id === log.id);
  if (index >= 0) {
    inMemoryEmergencyAccesses[index] = log;
  } else {
    inMemoryEmergencyAccesses.push(log);
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(inMemoryEmergencyAccesses));
    } catch {}
  }
}

export function triggerEmergencyAccess(params: {
  actor: StoredIdentity;
  targetPatientId: string;
  organizationId: string;
  reason: string;
  resourceAccessed?: string;
}): { success: boolean; accessLog?: EmergencyAccessLog; error?: string } {
  if (!params.actor || params.actor.accountStatus !== "active") {
    return { success: false, error: "Unauthenticated or inactive practitioner cannot trigger emergency access." };
  }

  if (!params.reason.trim() || params.reason.length < 10) {
    return { success: false, error: "A detailed clinical justification (at least 10 characters) is required for break-glass emergency access." };
  }

  const patient = findIdentityById(params.targetPatientId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours emergency window

  const newLog: EmergencyAccessLog = {
    id: `EMG-ACC-${Date.now()}`,
    actor_id: params.actor.identifier || params.actor.id,
    actor_name: params.actor.fullName,
    actor_role: params.actor.role,
    patient_id: params.targetPatientId,
    patient_name: patient?.fullName || "Emergency Patient",
    organization_id: params.organizationId,
    reason: params.reason.trim(),
    resource_accessed: params.resourceAccessed || "EMERGENCY_MEDICAL_SNAPSHOT",
    triggered_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: "ACTIVE",
  };

  saveEmergencyAccessLog(newLog);

  // Log in authoritative audit store
  logAuditEvent({
    event_type: "EMERGENCY_ACCESS_TRIGGERED",
    actor_id: params.actor.id,
    actor_name: params.actor.fullName,
    actor_role: params.actor.role,
    patient_id: params.targetPatientId,
    organization_id: params.organizationId,
    summary: `BREAK-GLASS EMERGENCY ACCESS: Practitioner ${params.actor.fullName} triggered emergency access for patient ${params.targetPatientId}. Reason: ${params.reason}`,
    reference_id: newLog.id,
  });

  return { success: true, accessLog: newLog };
}

export function hasActiveEmergencyAccess(actorIdOrIdent: string, patientId: string): boolean {
  const logs = getAllEmergencyAccessLogs();
  const now = Date.now();
  return logs.some(
    (l) => (l.actor_id === actorIdOrIdent || l.actor_id.toUpperCase() === actorIdOrIdent.toUpperCase()) &&
           l.patient_id === patientId &&
           l.status === "ACTIVE" &&
           new Date(l.expires_at).getTime() > now
  );
}

// ============================================================
// 3. AUTHORIZATION ENGINE CORE EVALUATOR
// ============================================================

export interface OperationRequest {
  actor: StoredIdentity | null;
  requiredPermission: MedoraPermission;
  action: "VIEW" | "CREATE" | "UPDATE" | "DELETE" | "AMEND" | "DISPENSE" | "CANCEL" | "VERIFY" | "INVITE" | "REVOKE";
  resourceType: 
    | "patient_profile" 
    | "clinical_record" 
    | "encounter" 
    | "appointment" 
    | "prescription" 
    | "lab_order" 
    | "lab_result" 
    | "pharmacy_dispensing" 
    | "bill" 
    | "organization" 
    | "organization_membership" 
    | "audit_log" 
    | "emergency_access" 
    | "platform";
  organizationContextId?: string; // Explicit organization context (e.g. HSP-1001)
  targetResourceId?: string;
  targetPatientId?: string;
  targetDoctorId?: string;
  targetOrganizationId?: string;
  targetMembershipId?: string;
}

export class AuthorizationEngine {
  /**
   * Evaluates if an actor is authorized to perform an operation on a resource in a given organization context.
   * Enforces: Authentication -> Account Status -> Action Prohibition -> Org Membership & Status -> Role Permissions -> Resource Scoping / IDOR -> Consent / Emergency.
   */
  public static evaluateOperation(req: OperationRequest): AuthorizationResult {
    const now = new Date().toISOString();
    const { actor, requiredPermission, action, resourceType, organizationContextId, targetPatientId } = req;

    // 1. Authentication Check
    if (!actor) {
      return {
        allowed: false,
        decision: "NOT_AUTHENTICATED",
        reason: "User is not authenticated. Session credentials required.",
        evaluated_at: now,
        permission: requiredPermission,
      };
    }

    // 2. Account Status Check
    if (actor.accountStatus === "disabled" || actor.accountStatus === "suspended") {
      return {
        allowed: false,
        decision: "NOT_AUTHENTICATED",
        reason: `Account is ${actor.accountStatus}. Access is suspended.`,
        actor_id: actor.identifier,
        evaluated_at: now,
        permission: requiredPermission,
      };
    }

    // 3. Healthcare Sensitive Record Protection: Block Hard Deletion
    if (action === "DELETE" && [
      "clinical_record", 
      "encounter", 
      "prescription", 
      "lab_order", 
      "lab_result", 
      "audit_log"
    ].includes(resourceType)) {
      return {
        allowed: false,
        decision: "ACTION_PROHIBITED",
        reason: `Hard deletion of ${resourceType} is prohibited under healthcare compliance regulations. Use controlled status cancellation/revocation.`,
        actor_id: actor.identifier,
        evaluated_at: now,
        permission: requiredPermission,
      };
    }

    // 4. Resolve Contextual Organization Role & Active Membership
    let resolvedRole: string = actor.role;
    let verifiedOrgId: string | undefined = organizationContextId;

    if (actor.role !== "patient" && actor.role !== "admin") {
      const userMemberships = getPersonMemberships(actor.id);

      if (userMemberships.length > 0) {
        if (organizationContextId) {
          const matchingMem = userMemberships.find(
            (m) => m.organization_id === organizationContextId ||
                   m.organization_identifier.toUpperCase() === organizationContextId.toUpperCase()
          );

          if (!matchingMem) {
            return {
              allowed: false,
              decision: "ORGANIZATION_MISMATCH",
              reason: `Practitioner does not have a membership in organization ${organizationContextId}.`,
              actor_id: actor.identifier,
              organization_id: organizationContextId,
              evaluated_at: now,
              permission: requiredPermission,
            };
          }

          if (matchingMem.status !== "ACTIVE") {
            return {
              allowed: false,
              decision: "MEMBERSHIP_INACTIVE",
              reason: `Membership at ${organizationContextId} is ${matchingMem.status}. Only ACTIVE memberships grant operational permissions.`,
              actor_id: actor.identifier,
              organization_id: organizationContextId,
              evaluated_at: now,
              permission: requiredPermission,
            };
          }

          if (matchingMem.role_title?.toLowerCase().includes("receptionist")) {
            resolvedRole = "receptionist";
          } else {
            resolvedRole = matchingMem.member_role;
          }
          verifiedOrgId = matchingMem.organization_identifier;
        } else {
          // No explicit org context passed: check if practitioner has an active membership
          const activeMems = userMemberships.filter((m) => m.status === "ACTIVE");
          if (activeMems.length > 0) {
            if (activeMems[0].role_title?.toLowerCase().includes("receptionist")) {
              resolvedRole = "receptionist";
            } else {
              resolvedRole = activeMems[0].member_role;
            }
            verifiedOrgId = activeMems[0].organization_identifier;
          }
        }
      } else {
        // Practitioner/staff roles MUST have a verified membership in organizationContextId
        if (["doctor", "receptionist", "staff"].includes(actor.role)) {
          return {
            allowed: false,
            decision: "ORGANIZATION_MISMATCH",
            reason: `Practitioner ${actor.identifier || actor.id} has no verified active membership at organization ${organizationContextId || "requested facility"}.`,
            actor_id: actor.identifier,
            organization_id: organizationContextId,
            evaluated_at: now,
            permission: requiredPermission,
          };
        }

        // Standalone or org account
        if (organizationContextId && actor.identifier && actor.identifier !== organizationContextId) {
          if (["hospital_admin", "clinic_admin", "lab_admin", "pharmacy_admin"].includes(actor.role)) {
            return {
              allowed: false,
              decision: "ORGANIZATION_MISMATCH",
              reason: `Organization admin cannot manage an unrelated organization (${organizationContextId}).`,
              actor_id: actor.identifier,
              organization_id: organizationContextId,
              evaluated_at: now,
              permission: requiredPermission,
            };
          }
        }
        resolvedRole = actor.role;
        verifiedOrgId = organizationContextId || actor.identifier;
      }
    }

    // 5. Role-Level Permission Check
    const allowedPermissions = ROLE_PERMISSIONS_MAP[resolvedRole] || [];
    if (!allowedPermissions.includes(requiredPermission)) {
      return {
        allowed: false,
        decision: "PERMISSION_DENIED",
        reason: `Role '${resolvedRole}' does not possess required permission '${requiredPermission}'.`,
        actor_id: actor.identifier,
        organization_id: verifiedOrgId,
        role: resolvedRole,
        permission: requiredPermission,
        evaluated_at: now,
      };
    }

    // 6. Resource-Level & IDOR Scoping Checks

    // Case A: Patient Self-Service Scoping
    if (resolvedRole === "patient") {
      if (targetPatientId && targetPatientId !== actor.identifier && targetPatientId !== actor.id) {
        return {
          allowed: false,
          decision: "RESOURCE_MISMATCH",
          reason: `Patient account ${actor.identifier} cannot access data belonging to patient ${targetPatientId}.`,
          actor_id: actor.identifier,
          evaluated_at: now,
          permission: requiredPermission,
        };
      }
      // Patients cannot modify diagnosis or prescriptions
      if (action === "CREATE" && ["clinical_record", "prescription", "lab_result"].includes(resourceType)) {
        return {
          allowed: false,
          decision: "PERMISSION_DENIED",
          reason: "Patients cannot author clinical records, prescriptions, or laboratory diagnostic results.",
          actor_id: actor.identifier,
          evaluated_at: now,
          permission: requiredPermission,
        };
      }
    }

    // Case B: Doctor Clinical Scoping & Consent Check
    if (resolvedRole === "doctor") {
      // If doctor is accessing a specific patient record
      if (targetPatientId && targetPatientId !== actor.identifier) {
        // Check if active break-glass emergency access exists
        const hasEmergency = hasActiveEmergencyAccess(actor.identifier || actor.id, targetPatientId);
        
        if (!hasEmergency) {
          // Check for active care relationship / active encounter or patient consent
          const patientConsents = getPatientConsents(targetPatientId);
          const activeConsent = patientConsents.find(
            (c) => (c.organization_id === verifiedOrgId || c.requester_id === actor.identifier) &&
                   c.status === "GRANTED" &&
                   new Date(c.expires_at).getTime() >= Date.now()
          );

          const encounters = getPatientEncounters(targetPatientId);
          const hasActiveEncounterWithDoc = encounters.some(
            (e) => (e.provider_id === actor.identifier || e.provider_id === actor.id) &&
                   e.status === "ACTIVE"
          );

          // If doctor has neither active consent, nor active encounter, nor emergency break-glass -> DENY
          if (!activeConsent && !hasActiveEncounterWithDoc && action === "VIEW" && resourceType === "clinical_record") {
            // Check if patient has any relationships with this hospital
            const orgRel = getPatientOrganizationRelationships(targetPatientId).find(
              (r) => (r.organization_id === verifiedOrgId) && r.status === "ACTIVE"
            );

            if (!orgRel) {
              return {
                allowed: false,
                decision: "DENY",
                reason: `Doctor has no clinical relationship or authorized consent for patient ${targetPatientId}.`,
                actor_id: actor.identifier,
                organization_id: verifiedOrgId,
                role: resolvedRole,
                permission: requiredPermission,
                evaluated_at: now,
              };
            }

            return {
              allowed: false,
              decision: "CONSENT_REQUIRED",
              reason: `Explicit patient consent is required for Dr. ${actor.fullName} to access medical history of patient ${targetPatientId}.`,
              actor_id: actor.identifier,
              organization_id: verifiedOrgId,
              role: resolvedRole,
              permission: requiredPermission,
              evaluated_at: now,
            };
          }
        }
      }
    }

    // Case C: Receptionist Scoping (Cannot modify clinical records, diagnoses, or prescriptions)
    if (resolvedRole === "receptionist") {
      if (["clinical_record", "prescription", "lab_result"].includes(resourceType) && action !== "VIEW") {
        return {
          allowed: false,
          decision: "PERMISSION_DENIED",
          reason: "Receptionist role is restricted to demographic registration, appointment scheduling, and front-desk billing.",
          actor_id: actor.identifier,
          organization_id: verifiedOrgId,
          role: resolvedRole,
          permission: requiredPermission,
          evaluated_at: now,
        };
      }
    }

    // Case D: Pharmacy Scoping (Cannot access private clinical consultation notes)
    if (["pharmacist", "pharmacy_staff"].includes(resolvedRole)) {
      if (resourceType === "clinical_record" && action === "VIEW") {
        return {
          allowed: false,
          decision: "PERMISSION_DENIED",
          reason: "Pharmacy staff may access digital prescriptions and dispensing orders, but not complete clinical consultation history.",
          actor_id: actor.identifier,
          organization_id: verifiedOrgId,
          role: resolvedRole,
          permission: requiredPermission,
          evaluated_at: now,
        };
      }
    }

    // Case E: Laboratory Scoping (Cannot view unrelated medical records or alter prescriptions)
    if (["lab_technician", "lab_staff"].includes(resolvedRole)) {
      if (resourceType === "prescription" || (resourceType === "clinical_record" && action !== "VIEW")) {
        return {
          allowed: false,
          decision: "PERMISSION_DENIED",
          reason: "Laboratory staff access is restricted to diagnostic orders, specimens, and laboratory result entry.",
          actor_id: actor.identifier,
          organization_id: verifiedOrgId,
          role: resolvedRole,
          permission: requiredPermission,
          evaluated_at: now,
        };
      }
    }

    // Case F: Hospital Admin Scoping (Cannot issue prescriptions or clinical diagnoses)
    if (["hospital_admin", "clinic_admin"].includes(resolvedRole)) {
      if (["prescription", "clinical_record", "lab_result"].includes(resourceType) && (action === "CREATE" || action === "AMEND")) {
        return {
          allowed: false,
          decision: "PERMISSION_DENIED",
          reason: "Hospital Administrator role is limited to operational, member, and facility management. Clinical actions require a medical practitioner role.",
          actor_id: actor.identifier,
          organization_id: verifiedOrgId,
          role: resolvedRole,
          permission: requiredPermission,
          evaluated_at: now,
        };
      }
      if (requiredPermission === "PLATFORM_MANAGE") {
        return {
          allowed: false,
          decision: "PERMISSION_DENIED",
          reason: "Organization administrators cannot access platform-wide governance controls.",
          actor_id: actor.identifier,
          organization_id: verifiedOrgId,
          role: resolvedRole,
          permission: requiredPermission,
          evaluated_at: now,
        };
      }
    }

    // ALL CHECKS PASSED: ALLOW
    return {
      allowed: true,
      decision: "ALLOW",
      reason: `Operation authorized for role '${resolvedRole}' under permission '${requiredPermission}'.`,
      actor_id: actor.identifier,
      organization_id: verifiedOrgId,
      role: resolvedRole,
      permission: requiredPermission,
      evaluated_at: now,
    };
  }
}
