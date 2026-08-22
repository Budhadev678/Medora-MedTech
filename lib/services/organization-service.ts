// ============================================================
// MEDORA — HEALTHCARE ORGANIZATION & FACILITY SERVICE
// PHASE 5.1 & 5.2: ORGANIZATION, FACILITY, DEPARTMENT & SERVICE ENGINE
// ============================================================

import {
  HealthcareOrganization,
  HealthcareFacility,
  HealthcareDepartment,
  HealthcareService,
  HealthcareDoctorAffiliation,
  HealthcareStaffAffiliation,
  HealthcareDoctorServiceAssignment,
} from "@/types/database.types";
import {
  getAllOrganizations,
  getOrganizationById,
  createOrganization as createOrgStore,
  updateOrganization as updateOrgStore,
  deactivateOrganization as deactivateOrgStore,
  getAllFacilities,
  getFacilityById,
  getFacilitiesForOrganization,
  createFacility as createFacStore,
  updateFacility as updateFacStore,
  deactivateFacility as deactivateFacStore,
} from "@/lib/data/facility-store";
import {
  getAllDepartments,
  getDepartmentsForFacility,
  getDepartmentById,
  createDepartment as createDeptStore,
  updateDepartment as updateDeptStore,
  deactivateDepartment as deactivateDeptStore,
} from "@/lib/data/department-store";
import {
  getAllServices,
  getServicesForFacility,
  getServicesForDepartment,
  getServiceById,
  createService as createSrvStore,
  updateService as updateSrvStore,
  deactivateService as deactivateSrvStore,
  getDoctorAssignedServices,
  assignDoctorToService as assignDocSrvStore,
  removeDoctorFromService as removeDocSrvStore,
} from "@/lib/data/service-store";
import {
  getFacilityDoctors,
  getDoctorAffiliations,
  createDoctorAffiliation as createDocAffStore,
  approveDoctorAffiliation as approveDocAffStore,
  rejectDoctorAffiliation as rejectDocAffStore,
  endDoctorAffiliation as endDocAffStore,
  suspendDoctorAffiliation as suspendDocAffStore,
  reactivateDoctorAffiliation as reactivateDocAffStore,
  getFacilityStaff,
  getUserStaffAffiliations,
  createStaffAffiliation as createStaffAffStore,
  endStaffAffiliation as endStaffAffStore,
  suspendStaffAffiliation as suspendStaffAffStore,
  reactivateStaffAffiliation as reactivateStaffAffStore,
  createAffiliationInvitation as createInviteStore,
  acceptAffiliationInvitation as acceptInviteStore,
  rejectAffiliationInvitation as rejectInviteStore,
  revokeAffiliationInvitation as revokeInviteStore,
  assignDepartmentHead as assignDeptHeadStore,
  getDepartmentHead,
  getDepartmentHeadHistory,
} from "@/lib/data/affiliation-store";
import type {
  AffiliationInvitation,
  DepartmentHeadAssignment,
  FacilityOperationalReadinessReport,
} from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";
import { FacilityReadinessService } from "@/lib/services/facility-readiness-service";
import { PermissionEngine } from "@/lib/services/permission-engine";

export interface OrganizationDashboardMetrics {
  organization: HealthcareOrganization;
  totalFacilities: number;
  activeFacilities: number;
  pendingFacilities: number;
  totalDepartments: number;
  totalDoctors: number;
  totalStaff: number;
  totalServices: number;
}

export interface FacilityDashboardMetrics {
  facility: HealthcareFacility;
  parentOrganization: HealthcareOrganization | null;
  departmentsCount: number;
  doctorsCount: number;
  staffCount: number;
  servicesCount: number;
}

export class OrganizationService {
  // ------------------------------------------------------------
  // ORGANIZATION OPERATIONS (PHASE 5.1)
  // ------------------------------------------------------------

  public static createOrganization(
    actor: { id: string; role: string; fullName?: string },
    data: Omit<HealthcareOrganization, "id" | "identifier" | "created_at" | "updated_at"> & {
      id?: string;
      identifier?: string;
    }
  ): { success: boolean; organization?: HealthcareOrganization; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot create organizations." };
    }

    const result = createOrgStore(data);
    if (result.success && result.organization) {
      try {
        appendAuditEvent({
          event_type: "ORGANIZATION_CREATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "System Admin",
          actor_role: actor.role,
          organization_id: result.organization.id,
          organization_name: result.organization.name,
          summary: `Created healthcare organization: ${result.organization.name} (${result.organization.identifier})`,
          metadata: {
            organizationType: result.organization.type,
            city: result.organization.city,
          },
        });
      } catch (e) {}
    }
    return result;
  }

  public static updateOrganization(
    actor: { id: string; role: string; organizationId?: string; fullName?: string },
    orgIdOrIdentifier: string,
    updates: Partial<HealthcareOrganization>
  ): { success: boolean; organization?: HealthcareOrganization; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot update organizations." };
    }

    const targetOrg = getOrganizationById(orgIdOrIdentifier);
    if (!targetOrg) {
      return { success: false, error: "Organization not found." };
    }

    // Role check: Only admin or authorized org admin
    if (
      actor.role !== "admin" &&
      actor.organizationId &&
      actor.organizationId.toLowerCase() !== targetOrg.id.toLowerCase() &&
      actor.organizationId.toLowerCase() !== targetOrg.identifier.toLowerCase()
    ) {
      return { success: false, error: "Forbidden: Cannot update another organization." };
    }

    const result = updateOrgStore(orgIdOrIdentifier, updates);
    if (result.success && result.organization) {
      try {
        appendAuditEvent({
          event_type: "ORGANIZATION_UPDATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          organization_id: result.organization.id,
          organization_name: result.organization.name,
          summary: `Updated organization settings: ${result.organization.name}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static deactivateOrganization(
    actor: { id: string; role: string; fullName?: string },
    orgIdOrIdentifier: string,
    reason?: string
  ): { success: boolean; organization?: HealthcareOrganization; error?: string } {
    if (actor.role !== "admin") {
      return { success: false, error: "Unauthorized: Platform Administrator privilege required." };
    }

    const result = deactivateOrgStore(orgIdOrIdentifier, reason);
    if (result.success && result.organization) {
      try {
        appendAuditEvent({
          event_type: "ORGANIZATION_STATUS_CHANGED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          organization_id: result.organization.id,
          organization_name: result.organization.name,
          summary: `Deactivated organization: ${result.organization.name}. Reason: ${reason || "Not specified"}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static getOrganizationDashboardMetrics(
    orgIdOrIdentifier: string
  ): OrganizationDashboardMetrics | null {
    const org = getOrganizationById(orgIdOrIdentifier);
    if (!org) return null;

    const facilities = getFacilitiesForOrganization(org.id);
    const activeFacilities = facilities.filter((f) => f.status === "ACTIVE").length;
    const pendingFacilities = facilities.filter((f) => f.status === "PENDING_VERIFICATION").length;

    let totalDepartments = 0;
    let totalDoctors = 0;
    let totalStaff = 0;
    let totalServices = 0;

    for (const fac of facilities) {
      const depts = getDepartmentsForFacility(fac.facility_code);
      totalDepartments += depts.length;

      const docs = getFacilityDoctors(fac.facility_code);
      totalDoctors += docs.length;

      const staff = getFacilityStaff(fac.facility_code);
      totalStaff += staff.length;

      const srvs = getServicesForFacility(fac.facility_code);
      totalServices += srvs.length;
    }

    return {
      organization: org,
      totalFacilities: facilities.length,
      activeFacilities,
      pendingFacilities,
      totalDepartments,
      totalDoctors,
      totalStaff,
      totalServices,
    };
  }

  // ------------------------------------------------------------
  // FACILITY OPERATIONS (PHASE 5.1)
  // ------------------------------------------------------------

  public static createFacility(
    actor: { id: string; role: string; organizationId?: string; fullName?: string },
    data: Omit<HealthcareFacility, "id" | "facility_code" | "created_at" | "updated_at"> & {
      id?: string;
      facility_code?: string;
    }
  ): { success: boolean; facility?: HealthcareFacility; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot create facilities." };
    }

    const parentOrg = getOrganizationById(data.organization_id);
    if (!parentOrg) {
      return { success: false, error: `Parent organization '${data.organization_id}' not found.` };
    }

    // Role check: If actor is org admin, ensure creating under own org
    if (
      actor.role !== "admin" &&
      actor.organizationId &&
      actor.organizationId.toLowerCase() !== parentOrg.id.toLowerCase() &&
      actor.organizationId.toLowerCase() !== parentOrg.identifier.toLowerCase()
    ) {
      return { success: false, error: "Forbidden: Cannot create facility under another organization." };
    }

    const result = createFacStore(data);
    if (result.success && result.facility) {
      try {
        appendAuditEvent({
          event_type: "FACILITY_CREATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          organization_id: parentOrg.id,
          organization_name: parentOrg.name,
          summary: `Created healthcare facility: ${result.facility.name} (${result.facility.facility_code}) under ${parentOrg.name}`,
          metadata: {
            facilityType: result.facility.type,
            city: result.facility.city,
          },
        });
      } catch (e) {}
    }
    return result;
  }

  public static updateFacility(
    actor: { id: string; role: string; organizationId?: string; facilityId?: string; fullName?: string },
    idOrCode: string,
    updates: Partial<HealthcareFacility>
  ): { success: boolean; facility?: HealthcareFacility; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot update facilities." };
    }

    const targetFac = getFacilityById(idOrCode);
    if (!targetFac) {
      return { success: false, error: "Facility not found." };
    }

    // Role checks
    if (actor.role !== "admin") {
      if (
        actor.organizationId &&
        actor.organizationId.toLowerCase() !== targetFac.organization_id.toLowerCase() &&
        actor.organizationId.toLowerCase() !== targetFac.organization_identifier?.toLowerCase()
      ) {
        return { success: false, error: "Forbidden: Cannot update facility of another organization." };
      }
      if (
        actor.role === "facility_admin" &&
        actor.facilityId &&
        actor.facilityId.toLowerCase() !== targetFac.id.toLowerCase() &&
        actor.facilityId.toLowerCase() !== targetFac.facility_code.toLowerCase()
      ) {
        return { success: false, error: "Forbidden: Facility Admin cannot manage a different facility branch." };
      }
    }

    const result = updateFacStore(idOrCode, updates);
    if (result.success && result.facility) {
      try {
        appendAuditEvent({
          event_type: "FACILITY_UPDATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          organization_id: targetFac.organization_id,
          organization_name: targetFac.organization_name,
          summary: `Updated facility details: ${result.facility.name} (${result.facility.facility_code})`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static deactivateFacility(
    actor: { id: string; role: string; organizationId?: string; fullName?: string },
    idOrCode: string,
    reason?: string
  ): { success: boolean; facility?: HealthcareFacility; error?: string } {
    const targetFac = getFacilityById(idOrCode);
    if (!targetFac) {
      return { success: false, error: "Facility not found." };
    }

    if (actor.role !== "admin" && actor.role !== "hospital_admin" && actor.role !== "organization_admin") {
      return { success: false, error: "Unauthorized: Administrator permissions required to deactivate a facility." };
    }

    const result = deactivateFacStore(idOrCode, reason);
    if (result.success && result.facility) {
      try {
        appendAuditEvent({
          event_type: "FACILITY_STATUS_CHANGED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          organization_id: targetFac.organization_id,
          organization_name: targetFac.organization_name,
          summary: `Deactivated facility: ${result.facility.name} (${result.facility.facility_code}). Reason: ${reason || "Not specified"}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static getFacilityDashboardMetrics(
    facilityIdOrCode: string
  ): FacilityDashboardMetrics | null {
    const fac = getFacilityById(facilityIdOrCode);
    if (!fac) return null;

    const parentOrg = getOrganizationById(fac.organization_id);
    const depts = getDepartmentsForFacility(fac.facility_code);
    const docs = getFacilityDoctors(fac.facility_code);
    const staff = getFacilityStaff(fac.facility_code);
    const srvs = getServicesForFacility(fac.facility_code);

    return {
      facility: fac,
      parentOrganization: parentOrg,
      departmentsCount: depts.length,
      doctorsCount: docs.length,
      staffCount: staff.length,
      servicesCount: srvs.length,
    };
  }

  // ------------------------------------------------------------
  // DEPARTMENT OPERATIONS (PHASE 5.2)
  // ------------------------------------------------------------

  public static createDepartment(
    actor: { id: string; role: string; facilityId?: string; fullName?: string },
    data: Omit<HealthcareDepartment, "id" | "created_at" | "updated_at">
  ): { success: boolean; department?: HealthcareDepartment; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot create departments." };
    }

    const facility = getFacilityById(data.facility_id);
    if (!facility) {
      return { success: false, error: `Facility '${data.facility_id}' not found.` };
    }

    // Role check
    if (
      actor.role === "facility_admin" &&
      actor.facilityId &&
      actor.facilityId.toLowerCase() !== facility.id.toLowerCase() &&
      actor.facilityId.toLowerCase() !== facility.facility_code.toLowerCase()
    ) {
      return { success: false, error: "Forbidden: Cannot create department in a different facility branch." };
    }

    const result = createDeptStore(data);
    if (result.success && result.department) {
      try {
        appendAuditEvent({
          event_type: "DEPARTMENT_CREATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          organization_id: facility.organization_id,
          organization_name: facility.organization_name,
          summary: `Created clinical department: ${result.department.name} in ${facility.name}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static updateDepartment(
    actor: { id: string; role: string; fullName?: string },
    deptId: string,
    updates: Partial<HealthcareDepartment>
  ): { success: boolean; department?: HealthcareDepartment; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot update departments." };
    }

    const targetDept = getDepartmentById(deptId);
    if (!targetDept) {
      return { success: false, error: "Department not found." };
    }

    const result = updateDeptStore(deptId, updates);
    if (result.success && result.department) {
      try {
        appendAuditEvent({
          event_type: "DEPARTMENT_UPDATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          organization_id: targetDept.organization_id,
          summary: `Updated department: ${result.department.name} (${result.department.id})`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static deactivateDepartment(
    actor: { id: string; role: string; fullName?: string },
    deptId: string,
    reason?: string
  ): { success: boolean; department?: HealthcareDepartment; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot deactivate departments." };
    }

    const targetDept = getDepartmentById(deptId);
    if (!targetDept) {
      return { success: false, error: "Department not found." };
    }

    const result = deactivateDeptStore(deptId, reason);
    if (result.success && result.department) {
      try {
        appendAuditEvent({
          event_type: "DEPARTMENT_STATUS_CHANGED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          organization_id: targetDept.organization_id,
          summary: `Deactivated department: ${result.department.name}. Reason: ${reason || "Not specified"}`,
        });
      } catch (e) {}
    }
    return result;
  }

  // ------------------------------------------------------------
  // HEALTHCARE SERVICES OPERATIONS (PHASE 5.2)
  // ------------------------------------------------------------

  public static createService(
    actor: { id: string; role: string; fullName?: string },
    data: Omit<HealthcareService, "id" | "created_at" | "updated_at">
  ): { success: boolean; service?: HealthcareService; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot create healthcare services." };
    }

    const facility = getFacilityById(data.facility_id);
    if (!facility) {
      return { success: false, error: `Facility '${data.facility_id}' not found.` };
    }

    const result = createSrvStore(data);
    if (result.success && result.service) {
      try {
        appendAuditEvent({
          event_type: "SERVICE_CREATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          organization_id: facility.organization_id,
          organization_name: facility.organization_name,
          summary: `Created healthcare service: ${result.service.name} (${result.service.code}) in ${facility.name}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static updateService(
    actor: { id: string; role: string; fullName?: string },
    serviceId: string,
    updates: Partial<HealthcareService>
  ): { success: boolean; service?: HealthcareService; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot update healthcare services." };
    }

    const targetSrv = getServiceById(serviceId);
    if (!targetSrv) {
      return { success: false, error: "Service not found." };
    }

    const result = updateSrvStore(serviceId, updates);
    if (result.success && result.service) {
      try {
        appendAuditEvent({
          event_type: "SERVICE_UPDATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          organization_id: targetSrv.facility_id,
          summary: `Updated service: ${result.service.name} (${result.service.id})`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static deactivateService(
    actor: { id: string; role: string; fullName?: string },
    serviceId: string,
    reason?: string
  ): { success: boolean; service?: HealthcareService; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot deactivate healthcare services." };
    }

    const targetSrv = getServiceById(serviceId);
    if (!targetSrv) {
      return { success: false, error: "Service not found." };
    }

    const result = deactivateSrvStore(serviceId, reason);
    if (result.success && result.service) {
      try {
        appendAuditEvent({
          event_type: "SERVICE_STATUS_CHANGED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Deactivated healthcare service: ${result.service.name}. Reason: ${reason || "Not specified"}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static assignDoctorToService(
    actor: { id: string; role: string; fullName?: string },
    doctorId: string,
    doctorName: string,
    facilityIdOrCode: string,
    serviceId: string
  ): { success: boolean; assignment?: HealthcareDoctorServiceAssignment; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot assign doctors to services." };
    }

    const result = assignDocSrvStore(doctorId, doctorName, facilityIdOrCode, serviceId);
    if (result.success && result.assignment) {
      try {
        appendAuditEvent({
          event_type: "SERVICE_ASSIGNMENT_CREATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Assigned doctor ${doctorName} (${doctorId}) to service ${result.assignment.service_name}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static removeDoctorFromService(
    actor: { id: string; role: string; fullName?: string },
    doctorId: string,
    facilityIdOrCode: string,
    serviceId: string
  ): { success: boolean; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot alter service assignments." };
    }

    const result = removeDocSrvStore(doctorId, facilityIdOrCode, serviceId);
    if (result.success) {
      try {
        appendAuditEvent({
          event_type: "SERVICE_ASSIGNMENT_UPDATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Deactivated service assignment for doctor ${doctorId} on service ${serviceId}`,
        });
      } catch (e) {}
    }
    return result;
  }

  // ------------------------------------------------------------
  // DOCTOR & STAFF AFFILIATION OPERATIONS (PHASE 5.1 & 5.2)
  // ------------------------------------------------------------

  public static inviteDoctorAffiliation(
    actor: { id: string; role: string; fullName?: string },
    data: Omit<HealthcareDoctorAffiliation, "id" | "created_at" | "updated_at">
  ): { success: boolean; affiliation?: HealthcareDoctorAffiliation; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot invite doctors." };
    }

    const result = createDocAffStore(data);
    if (result.success && result.affiliation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_CREATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Invited doctor ${result.affiliation.doctor_name} (${result.affiliation.doctor_id}) to ${result.affiliation.facility_name}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static approveDoctorAffiliation(
    actor: { id: string; role: string; fullName?: string },
    facilityIdOrCode: string,
    doctorIdentifier: string
  ): { success: boolean; affiliation?: HealthcareDoctorAffiliation; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot approve doctor affiliations." };
    }

    const result = approveDocAffStore(facilityIdOrCode, doctorIdentifier);
    if (result.success && result.affiliation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_UPDATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Approved and activated doctor affiliation: ${doctorIdentifier} at ${facilityIdOrCode}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static rejectDoctorAffiliation(
    actor: { id: string; role: string; fullName?: string },
    facilityIdOrCode: string,
    doctorIdentifier: string
  ): { success: boolean; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot reject affiliations." };
    }

    const result = rejectDocAffStore(facilityIdOrCode, doctorIdentifier);
    if (result.success) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_UPDATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Rejected doctor affiliation request: ${doctorIdentifier} at ${facilityIdOrCode}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static endDoctorAffiliation(
    actor: { id: string; role: string; fullName?: string },
    facilityIdOrCode: string,
    doctorIdentifier: string,
    reason?: string
  ): { success: boolean; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot end doctor affiliations." };
    }

    const result = endDocAffStore(facilityIdOrCode, doctorIdentifier, reason);
    if (result.success) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_ENDED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Ended doctor affiliation: ${doctorIdentifier} at ${facilityIdOrCode}. Reason: ${reason || "Not specified"}. Historical records preserved.`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static assignStaff(
    actor: { id: string; role: string; fullName?: string },
    data: Omit<HealthcareStaffAffiliation, "id" | "created_at" | "updated_at">
  ): { success: boolean; affiliation?: HealthcareStaffAffiliation; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot assign staff." };
    }

    const result = createStaffAffStore(data);
    if (result.success && result.affiliation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_CREATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Assigned staff member ${result.affiliation.staff_name} (${result.affiliation.user_id}) as ${result.affiliation.role_title} at ${result.affiliation.facility_name}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static endStaffAffiliation(
    actor: { id: string; role: string; fullName?: string },
    facilityIdOrCode: string,
    userId: string,
    reason?: string
  ): { success: boolean; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot end staff affiliations." };
    }

    const result = endStaffAffStore(facilityIdOrCode, userId, reason);
    if (result.success) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_ENDED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Ended staff affiliation for ${userId} at ${facilityIdOrCode}. Reason: ${reason || "Not specified"}. Historical actions preserved.`,
        });
      } catch (e) {}
    }
    return result;
  }

  // ------------------------------------------------------------
  // SUSPENSION & REACTIVATION LIFECYCLE (PHASE 5.3)
  // ------------------------------------------------------------

  public static suspendDoctorAffiliation(
    actor: { id: string; role: string; fullName?: string },
    facilityIdOrCode: string,
    doctorId: string,
    reason?: string
  ): { success: boolean; affiliation?: HealthcareDoctorAffiliation; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot suspend doctor affiliations." };
    }

    const result = suspendDocAffStore(facilityIdOrCode, doctorId, reason);
    if (result.success && result.affiliation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_SUSPENDED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Suspended doctor affiliation: ${doctorId} at ${facilityIdOrCode}. Reason: ${reason || "Not specified"}. Operational access blocked.`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static reactivateDoctorAffiliation(
    actor: { id: string; role: string; fullName?: string },
    facilityIdOrCode: string,
    doctorId: string
  ): { success: boolean; affiliation?: HealthcareDoctorAffiliation; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot reactivate doctor affiliations." };
    }

    const result = reactivateDocAffStore(facilityIdOrCode, doctorId);
    if (result.success && result.affiliation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_REACTIVATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Reactivated doctor affiliation: ${doctorId} at ${facilityIdOrCode}. Operational access restored.`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static suspendStaffAffiliation(
    actor: { id: string; role: string; fullName?: string },
    facilityIdOrCode: string,
    userId: string,
    reason?: string
  ): { success: boolean; affiliation?: HealthcareStaffAffiliation; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot suspend staff affiliations." };
    }

    const result = suspendStaffAffStore(facilityIdOrCode, userId, reason);
    if (result.success && result.affiliation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_SUSPENDED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Suspended staff affiliation for ${userId} at ${facilityIdOrCode}. Reason: ${reason || "Not specified"}.`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static reactivateStaffAffiliation(
    actor: { id: string; role: string; fullName?: string },
    facilityIdOrCode: string,
    userId: string
  ): { success: boolean; affiliation?: HealthcareStaffAffiliation; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot reactivate staff affiliations." };
    }

    const result = reactivateStaffAffStore(facilityIdOrCode, userId);
    if (result.success && result.affiliation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_REACTIVATED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Reactivated staff affiliation for ${userId} at ${facilityIdOrCode}.`,
        });
      } catch (e) {}
    }
    return result;
  }

  // ------------------------------------------------------------
  // INVITATION ARCHITECTURE (PHASE 5.3)
  // ------------------------------------------------------------

  public static createInvitation(
    actor: { id: string; role: string; fullName?: string },
    data: Omit<AffiliationInvitation, "id" | "invited_by_id" | "invited_by_name" | "status" | "created_at" | "updated_at">
  ): { success: boolean; invitation?: AffiliationInvitation; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot send affiliations invitations." };
    }

    const result = createInviteStore({
      ...data,
      invited_by_id: actor.id,
      invited_by_name: actor.fullName || "Administrator",
      status: "PENDING",
    });

    if (result.success && result.invitation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_INVITED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Invited ${result.invitation.role_type} ${result.invitation.target_name} (${result.invitation.target_user_id || result.invitation.target_email}) as ${result.invitation.role_title} at ${result.invitation.facility_name}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static acceptInvitation(
    actor: { id: string; role?: string; fullName?: string },
    invitationId: string
  ): { success: boolean; invitation?: AffiliationInvitation; error?: string } {
    const result = acceptInviteStore(invitationId, { id: actor.id, name: actor.fullName });
    if (result.success && result.invitation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_ACCEPTED",
          actor_id: actor.id,
          actor_name: actor.fullName || "User",
          actor_role: actor.role || "user",
          summary: `Accepted affiliation invitation: ${invitationId} at ${result.invitation.facility_name}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static rejectInvitation(
    actor: { id: string; role?: string; fullName?: string },
    invitationId: string,
    reason?: string
  ): { success: boolean; invitation?: AffiliationInvitation; error?: string } {
    const result = rejectInviteStore(invitationId, { id: actor.id, name: actor.fullName }, reason);
    if (result.success && result.invitation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_REJECTED",
          actor_id: actor.id,
          actor_name: actor.fullName || "User",
          actor_role: actor.role || "user",
          summary: `Rejected affiliation invitation: ${invitationId}. Reason: ${reason || "Declined by user"}`,
        });
      } catch (e) {}
    }
    return result;
  }

  public static revokeInvitation(
    actor: { id: string; role: string; fullName?: string },
    invitationId: string,
    reason?: string
  ): { success: boolean; invitation?: AffiliationInvitation; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot revoke invitations." };
    }

    const result = revokeInviteStore(invitationId, { id: actor.id, name: actor.fullName }, reason);
    if (result.success && result.invitation) {
      try {
        appendAuditEvent({
          event_type: "AFFILIATION_REVOKED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Revoked affiliation invitation: ${invitationId} for ${result.invitation.target_name}. Reason: ${reason || "Revoked by admin"}`,
        });
      } catch (e) {}
    }
    return result;
  }

  // ------------------------------------------------------------
  // DEPARTMENT HEAD ASSIGNMENT (PHASE 5.3)
  // ------------------------------------------------------------

  public static assignDepartmentHead(
    actor: { id: string; role: string; fullName?: string },
    facilityIdOrCode: string,
    departmentId: string,
    doctorId: string
  ): { success: boolean; assignment?: DepartmentHeadAssignment; error?: string } {
    if (actor.role === "patient") {
      return { success: false, error: "Unauthorized: Patients cannot assign department heads." };
    }

    const result = assignDeptHeadStore(
      facilityIdOrCode,
      departmentId,
      doctorId,
      { id: actor.id, name: actor.fullName || "Administrator" }
    );

    if (result.success && result.assignment) {
      try {
        appendAuditEvent({
          event_type: "DEPARTMENT_HEAD_ASSIGNED",
          actor_id: actor.id,
          actor_name: actor.fullName || "Admin",
          actor_role: actor.role,
          summary: `Assigned Dr. ${result.assignment.doctor_name} (${result.assignment.doctor_id}) as Head of Department ${result.assignment.department_id} at ${result.assignment.facility_id}`,
        });
      } catch (e) {}
    }
    return result;
  }

  // ------------------------------------------------------------
  // OPERATIONAL READINESS & CONTEXT (PHASE 5.4)
  // ------------------------------------------------------------

  public static evaluateFacilityReadiness(
    facilityIdOrCode: string
  ): FacilityOperationalReadinessReport | null {
    return FacilityReadinessService.evaluateFacilityReadiness(facilityIdOrCode);
  }

  public static evaluateOrganizationReadiness(orgIdOrIdentifier: string) {
    return FacilityReadinessService.evaluateOrganizationReadiness(orgIdOrIdentifier);
  }

  public static validateFacilityContext(userId: string, targetFacilityIdOrCode: string) {
    return PermissionEngine.validateFacilityContext(userId, targetFacilityIdOrCode);
  }

  public static getUserAccessibleFacilities(userId: string) {
    return PermissionEngine.getAccessibleFacilitiesForUser(userId);
  }
}
