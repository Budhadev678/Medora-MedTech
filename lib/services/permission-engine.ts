// ============================================================
// MEDORA — PERMISSION & CONTEXT ENGINE
// PHASE 5.3: ROLE-BASED ACCESS CONTROL & OPERATIONAL CONTEXT
// ============================================================

import type {
  MedoraPermission,
  AuthorizationDecision,
  AuthorizationResult,
} from "@/types/database.types";
import { getDoctorAffiliations, getUserStaffAffiliations } from "@/lib/data/affiliation-store";
import { getFacilityById, getOrganizationById } from "@/lib/data/facility-store";

export interface ActorContext {
  id: string;
  role: string;
  fullName?: string;
  organizationId?: string;
  facilityId?: string;
  departmentId?: string;
}

export interface ResourceContext {
  organizationId?: string;
  facilityId?: string;
  departmentId?: string;
  targetUserId?: string;
  targetRole?: string;
}

// ------------------------------------------------------------
// ROLE-TO-PERMISSION MAPPINGS (LEAST PRIVILEGE)
// ------------------------------------------------------------

const ROLE_PERMISSIONS: Record<string, MedoraPermission[]> = {
  admin: [
    "ORGANIZATION_VIEW",
    "ORGANIZATION_CREATE",
    "ORGANIZATION_UPDATE",
    "FACILITY_VIEW",
    "FACILITY_CREATE",
    "FACILITY_UPDATE",
    "FACILITY_MANAGE",
    "DEPARTMENT_VIEW",
    "DEPARTMENT_CREATE",
    "DEPARTMENT_UPDATE",
    "DEPARTMENT_MANAGE",
    "SERVICE_VIEW",
    "SERVICE_CREATE",
    "SERVICE_UPDATE",
    "SERVICE_MANAGE",
    "STAFF_VIEW",
    "STAFF_ASSIGN",
    "STAFF_MANAGE",
    "DOCTOR_AFFILIATION_MANAGE",
    "AFFILIATION_INVITE",
    "AFFILIATION_APPROVE",
    "AFFILIATION_SUSPEND",
    "AFFILIATION_END",
    "PERMISSION_MANAGE",
    "FACILITY_SWITCH_CONTEXT",
    "HEALTH_CHECK_VIEW",
    "AUDIT_VIEW",
    "AUDIT_EXPORT",
    "PLATFORM_MANAGE",
  ],
  hospital_admin: [
    "ORGANIZATION_VIEW",
    "FACILITY_VIEW",
    "FACILITY_UPDATE",
    "FACILITY_MANAGE",
    "DEPARTMENT_VIEW",
    "DEPARTMENT_CREATE",
    "DEPARTMENT_UPDATE",
    "DEPARTMENT_MANAGE",
    "SERVICE_VIEW",
    "SERVICE_CREATE",
    "SERVICE_UPDATE",
    "SERVICE_MANAGE",
    "STAFF_VIEW",
    "STAFF_ASSIGN",
    "STAFF_MANAGE",
    "DOCTOR_AFFILIATION_MANAGE",
    "AFFILIATION_INVITE",
    "AFFILIATION_APPROVE",
    "AFFILIATION_SUSPEND",
    "AFFILIATION_END",
    "FACILITY_SWITCH_CONTEXT",
    "HEALTH_CHECK_VIEW",
    "AUDIT_VIEW",
  ],
  FACILITY_ADMIN: [
    "FACILITY_VIEW",
    "FACILITY_UPDATE",
    "DEPARTMENT_VIEW",
    "DEPARTMENT_CREATE",
    "DEPARTMENT_UPDATE",
    "DEPARTMENT_MANAGE",
    "SERVICE_VIEW",
    "SERVICE_CREATE",
    "SERVICE_UPDATE",
    "SERVICE_MANAGE",
    "STAFF_VIEW",
    "STAFF_ASSIGN",
    "STAFF_MANAGE",
    "DOCTOR_AFFILIATION_MANAGE",
    "AFFILIATION_INVITE",
    "AFFILIATION_APPROVE",
    "AFFILIATION_SUSPEND",
    "AFFILIATION_END",
    "FACILITY_SWITCH_CONTEXT",
    "HEALTH_CHECK_VIEW",
    "AUDIT_VIEW",
  ],
  doctor: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "ENCOUNTER_VIEW",
    "ENCOUNTER_CREATE",
    "ENCOUNTER_UPDATE",
    "ENCOUNTER_COMPLETE",
    "CLINICAL_RECORD_VIEW",
    "CLINICAL_RECORD_CREATE",
    "CLINICAL_RECORD_AMEND",
    "PRESCRIPTION_VIEW",
    "PRESCRIPTION_CREATE",
    "PRESCRIPTION_ISSUE",
    "PRESCRIPTION_CANCEL",
    "LAB_ORDER_VIEW",
    "LAB_ORDER_CREATE",
    "LAB_ORDER_CANCEL",
    "LAB_REPORT_VIEW",
    "DOCUMENT_VIEW",
    "DOCUMENT_CREATE",
    "TIMELINE_VIEW",
    "FACILITY_SWITCH_CONTEXT",
  ],
  receptionist: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "APPOINTMENT_VIEW",
    "APPOINTMENT_CREATE",
    "APPOINTMENT_CANCEL",
    "APPOINTMENT_RESCHEDULE",
    "CHECKIN_VIEW",
    "CHECKIN_PERFORM",
    "QUEUE_VIEW",
    "TOKEN_GENERATE",
    "TOKEN_CALL",
    "FACILITY_SWITCH_CONTEXT",
  ],
  RECEPTIONIST: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "APPOINTMENT_VIEW",
    "APPOINTMENT_CREATE",
    "APPOINTMENT_CANCEL",
    "APPOINTMENT_RESCHEDULE",
    "CHECKIN_VIEW",
    "CHECKIN_PERFORM",
    "QUEUE_VIEW",
    "TOKEN_GENERATE",
    "TOKEN_CALL",
    "FACILITY_SWITCH_CONTEXT",
  ],
  nurse: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "ENCOUNTER_VIEW",
    "CLINICAL_RECORD_VIEW",
    "CHECKIN_VIEW",
    "CHECKIN_PERFORM",
    "QUEUE_VIEW",
    "LAB_SAMPLE_COLLECT",
    "FACILITY_SWITCH_CONTEXT",
  ],
  NURSE: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "ENCOUNTER_VIEW",
    "CLINICAL_RECORD_VIEW",
    "CHECKIN_VIEW",
    "CHECKIN_PERFORM",
    "QUEUE_VIEW",
    "LAB_SAMPLE_COLLECT",
    "FACILITY_SWITCH_CONTEXT",
  ],
  lab_tech: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "LAB_ORDER_VIEW",
    "LAB_SAMPLE_COLLECT",
    "LAB_SAMPLE_RECEIVE",
    "LAB_RESULT_ENTER",
    "LAB_REPORT_VIEW",
    "FACILITY_SWITCH_CONTEXT",
  ],
  LAB_STAFF: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "LAB_ORDER_VIEW",
    "LAB_SAMPLE_COLLECT",
    "LAB_SAMPLE_RECEIVE",
    "LAB_RESULT_ENTER",
    "LAB_REPORT_VIEW",
    "FACILITY_SWITCH_CONTEXT",
  ],
  pharmacist: [
    "FACILITY_VIEW",
    "PRESCRIPTION_VIEW",
    "FACILITY_SWITCH_CONTEXT",
  ],
  PHARMACY_STAFF: [
    "FACILITY_VIEW",
    "PRESCRIPTION_VIEW",
    "FACILITY_SWITCH_CONTEXT",
  ],
  billing_staff: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "BILL_VIEW",
    "BILL_CREATE",
    "BILL_UPDATE",
    "FACILITY_SWITCH_CONTEXT",
  ],
  BILLING_STAFF: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "BILL_VIEW",
    "BILL_CREATE",
    "BILL_UPDATE",
    "FACILITY_SWITCH_CONTEXT",
  ],
  staff: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "APPOINTMENT_VIEW",
    "CHECKIN_VIEW",
    "QUEUE_VIEW",
    "FACILITY_SWITCH_CONTEXT",
  ],
  STAFF: [
    "FACILITY_VIEW",
    "DEPARTMENT_VIEW",
    "SERVICE_VIEW",
    "APPOINTMENT_VIEW",
    "CHECKIN_VIEW",
    "QUEUE_VIEW",
    "FACILITY_SWITCH_CONTEXT",
  ],
  patient: [
    "APPOINTMENT_VIEW",
    "APPOINTMENT_CREATE",
    "APPOINTMENT_CANCEL",
    "APPOINTMENT_RESCHEDULE",
    "CHECKIN_PERFORM",
    "QUEUE_VIEW",
    "ENCOUNTER_VIEW",
    "CLINICAL_RECORD_VIEW",
    "PRESCRIPTION_VIEW",
    "LAB_ORDER_VIEW",
    "LAB_REPORT_VIEW",
    "DOCUMENT_VIEW",
    "DOCUMENT_CREATE",
    "TIMELINE_VIEW",
    "BILL_VIEW",
  ],
};

export class PermissionEngine {
  /**
   * Retrieves all permissions configured for a given user role.
   */
  public static getPermissionsForRole(role: string): MedoraPermission[] {
    if (!role) return [];
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[role.toLowerCase()] || [];
  }

  /**
   * Evaluates if an actor has the required permission within the specified operational context.
   */
  public static hasPermission(
    actor: ActorContext,
    permission: MedoraPermission,
    resourceContext?: ResourceContext
  ): AuthorizationResult {
    const evaluated_at = new Date().toISOString();

    if (!actor || !actor.id) {
      return {
        allowed: false,
        decision: "NOT_AUTHENTICATED",
        reason: "User is not authenticated.",
        evaluated_at,
      };
    }

    // Platform Super Admin bypasses organizational scopes
    if (actor.role === "admin" || actor.role === "PLATFORM_ADMIN") {
      const adminPerms = ROLE_PERMISSIONS.admin;
      if (adminPerms.includes(permission)) {
        return {
          allowed: true,
          decision: "ALLOW",
          reason: "Platform Administrator authorization granted.",
          actor_id: actor.id,
          role: actor.role,
          permission,
          evaluated_at,
        };
      }
    }

    // Role-level permission check
    const rolePerms = this.getPermissionsForRole(actor.role);
    if (!rolePerms.includes(permission)) {
      return {
        allowed: false,
        decision: "PERMISSION_DENIED",
        reason: `Role '${actor.role}' lacks permission '${permission}'.`,
        actor_id: actor.id,
        role: actor.role,
        permission,
        evaluated_at,
      };
    }

    // Organizational boundary check
    if (resourceContext?.organizationId && actor.organizationId) {
      const cleanActorOrg = actor.organizationId.toLowerCase();
      const cleanResOrg = resourceContext.organizationId.toLowerCase();
      if (cleanActorOrg !== cleanResOrg) {
        return {
          allowed: false,
          decision: "ORGANIZATION_MISMATCH",
          reason: "Cross-organization modification is strictly prohibited.",
          actor_id: actor.id,
          organization_id: resourceContext.organizationId,
          role: actor.role,
          permission,
          evaluated_at,
        };
      }
    }

    // Facility boundary check
    if (resourceContext?.facilityId && actor.facilityId) {
      const cleanActorFac = actor.facilityId.toLowerCase();
      const cleanResFac = resourceContext.facilityId.toLowerCase();
      if (cleanActorFac !== cleanResFac) {
        return {
          allowed: false,
          decision: "RESOURCE_MISMATCH",
          reason: "Operation restricted to user's affiliated facility.",
          actor_id: actor.id,
          role: actor.role,
          permission,
          evaluated_at,
        };
      }
    }

    // Department boundary check (if resource requires specific department match)
    if (
      resourceContext?.departmentId &&
      actor.departmentId &&
      actor.role !== "hospital_admin" &&
      actor.role !== "FACILITY_ADMIN"
    ) {
      const cleanActorDept = actor.departmentId.toLowerCase();
      const cleanResDept = resourceContext.departmentId.toLowerCase();
      if (cleanActorDept !== cleanResDept) {
        return {
          allowed: false,
          decision: "RESOURCE_MISMATCH",
          reason: "Operation restricted to user's assigned department.",
          actor_id: actor.id,
          role: actor.role,
          permission,
          evaluated_at,
        };
      }
    }

    // Privilege escalation guard: Non-admin actors cannot assign ADMIN roles
    if (
      resourceContext?.targetRole &&
      (resourceContext.targetRole === "admin" || resourceContext.targetRole === "hospital_admin") &&
      actor.role !== "admin"
    ) {
      return {
        allowed: false,
        decision: "ACTION_PROHIBITED",
        reason: "Only Platform Administrators can grant administrative roles.",
        actor_id: actor.id,
        role: actor.role,
        permission,
        evaluated_at,
      };
    }

    return {
      allowed: true,
      decision: "ALLOW",
      reason: "Operation authorized by role policy.",
      actor_id: actor.id,
      role: actor.role,
      permission,
      evaluated_at,
    };
  }

  /**
   * Validates if a user is authorized to switch their active operational context to target facility.
   */
  public static validateFacilityContext(
    userId: string,
    targetFacilityIdOrCode: string
  ): { valid: boolean; role?: string; departmentId?: string; error?: string } {
    if (!userId || !targetFacilityIdOrCode) {
      return { valid: false, error: "User and facility reference are required." };
    }

    const fac = getFacilityById(targetFacilityIdOrCode);
    if (!fac) {
      return { valid: false, error: `Facility '${targetFacilityIdOrCode}' not found.` };
    }

    // Check doctor affiliations
    const docAffs = getDoctorAffiliations(userId, false);
    const docAff = docAffs.find(
      (a) =>
        (a.facility_id.toLowerCase() === fac.id.toLowerCase() ||
          a.facility_id.toLowerCase() === fac.facility_code.toLowerCase()) &&
        a.status === "ACTIVE"
    );
    if (docAff) {
      return {
        valid: true,
        role: "doctor",
        departmentId: docAff.department_id,
      };
    }

    // Check staff affiliations
    const staffAffs = getUserStaffAffiliations(userId, false);
    const staffAff = staffAffs.find(
      (s) =>
        (s.facility_id.toLowerCase() === fac.id.toLowerCase() ||
          s.facility_id.toLowerCase() === fac.facility_code.toLowerCase()) &&
        s.status === "ACTIVE"
    );
    if (staffAff) {
      return {
        valid: true,
        role: staffAff.staff_role,
        departmentId: staffAff.department_id,
      };
    }

    return {
      valid: false,
      error: `User '${userId}' has no active affiliation with ${fac.name}.`,
    };
  }

  /**
   * Returns all facilities a user has active practitioner or staff privileges at.
   */
  public static getAccessibleFacilitiesForUser(userId: string): Array<{
    facilityId: string;
    facilityName: string;
    organizationId: string;
    role: string;
    roleTitle: string;
    departmentId?: string;
    departmentName?: string;
  }> {
    if (!userId) return [];
    const results: Array<{
      facilityId: string;
      facilityName: string;
      organizationId: string;
      role: string;
      roleTitle: string;
      departmentId?: string;
      departmentName?: string;
    }> = [];

    // Doctor affiliations
    const docAffs = getDoctorAffiliations(userId, false);
    for (const d of docAffs) {
      if (d.status === "ACTIVE") {
        results.push({
          facilityId: d.facility_id,
          facilityName: d.facility_name || d.facility_id,
          organizationId: d.organization_id,
          role: "doctor",
          roleTitle: d.role_title,
          departmentId: d.department_id,
          departmentName: d.department_name,
        });
      }
    }

    // Staff affiliations
    const staffAffs = getUserStaffAffiliations(userId, false);
    for (const s of staffAffs) {
      if (s.status === "ACTIVE") {
        results.push({
          facilityId: s.facility_id,
          facilityName: s.facility_name || s.facility_id,
          organizationId: s.organization_id,
          role: s.staff_role,
          roleTitle: s.role_title,
          departmentId: s.department_id,
          departmentName: s.department_name,
        });
      }
    }

    return results;
  }

  /**
   * Returns a human-readable list of allowed and prohibited actions for a role template.
   */
  public static getRoleTemplateSummary(role: string): {
    allowed: string[];
    prohibited: string[];
  } {
    const perms = this.getPermissionsForRole(role);
    const allKeyActions: Array<{ action: string; perm: MedoraPermission }> = [
      { action: "Manage check-in & OPD tokens", perm: "CHECKIN_PERFORM" },
      { action: "View live patient queue", perm: "QUEUE_VIEW" },
      { action: "Author clinical consultation encounters", perm: "ENCOUNTER_CREATE" },
      { action: "Prescribe medicines & regimens", perm: "PRESCRIPTION_CREATE" },
      { action: "Order diagnostic lab investigations", perm: "LAB_ORDER_CREATE" },
      { action: "Verify & release laboratory reports", perm: "LAB_RESULT_ENTER" },
      { action: "Assign facility staff & departments", perm: "STAFF_ASSIGN" },
      { action: "Manage corporate organization settings", perm: "ORGANIZATION_UPDATE" },
      { action: "View immutable audit ledger", perm: "AUDIT_VIEW" },
    ];

    const allowed = allKeyActions.filter((a) => perms.includes(a.perm)).map((a) => a.action);
    const prohibited = allKeyActions.filter((a) => !perms.includes(a.perm)).map((a) => a.action);

    return { allowed, prohibited };
  }
}
