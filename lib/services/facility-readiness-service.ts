// ============================================================
// MEDORA — FACILITY OPERATIONAL READINESS & HEALTH CHECKER
// PHASE 5.4: CONNECTIVITY VALIDATION & INTEGRITY ENGINE
// ============================================================

import type {
  FacilityOperationalReadinessReport,
  ConfigurationIssue,
  HealthcareFacility,
} from "@/types/database.types";
import {
  getAllOrganizations,
  getAllFacilities,
  getFacilityById,
  getOrganizationById,
} from "@/lib/data/facility-store";
import {
  getAllDepartments,
  getDepartmentsForFacility,
  getDepartmentById,
} from "@/lib/data/department-store";
import {
  getAllServices,
  getServicesForFacility,
  getAllDoctorServiceAssignments,
  getDoctorAssignedServices,
  getServiceById,
} from "@/lib/data/service-store";
import {
  getAllDoctorAffiliations,
  getFacilityDoctors,
  getAllStaffAffiliations,
  getFacilityStaff,
} from "@/lib/data/affiliation-store";

export class FacilityReadinessService {
  /**
   * Performs an exhaustive operational readiness and connectivity audit on a specific healthcare facility.
   */
  public static evaluateFacilityReadiness(
    facilityIdOrCode: string
  ): FacilityOperationalReadinessReport | null {
    const facility = getFacilityById(facilityIdOrCode);
    if (!facility) return null;

    const parentOrg = getOrganizationById(facility.organization_id);
    const departments = getDepartmentsForFacility(facility.facility_code, true);
    const activeDepartments = departments.filter((d) => d.status === "ACTIVE");

    const services = getServicesForFacility(facility.facility_code, true);
    const activeServices = services.filter((s) => s.status === "ACTIVE");

    const doctors = getFacilityDoctors(facility.facility_code, true);
    const activeDoctors = doctors.filter((d) => d.status === "ACTIVE");

    const staff = getFacilityStaff(facility.facility_code, true);
    const activeStaff = staff.filter((s) => s.status === "ACTIVE");

    const allAssignments = getAllDoctorServiceAssignments();
    const facilityAssignments = allAssignments.filter(
      (a) =>
        a.facility_id.toLowerCase() === facility.id.toLowerCase() ||
        a.facility_id.toLowerCase() === facility.facility_code.toLowerCase()
    );

    const issues: ConfigurationIssue[] = [];
    const now = new Date().toISOString();

    // 1. Parent Organization Check
    let parentOrgValid = true;
    if (!parentOrg) {
      parentOrgValid = false;
      issues.push({
        id: `ISS-${Date.now()}-ORG-1`,
        severity: "CRITICAL",
        category: "RELATIONSHIP",
        title: "Missing Parent Organization",
        description: `Facility references non-existent parent organization '${facility.organization_id}'.`,
        affected_entity_id: facility.id,
        affected_entity_type: "FACILITY",
        suggested_action: "Link facility to a registered Healthcare Organization.",
        created_at: now,
      });
    } else if (parentOrg.status !== "ACTIVE") {
      issues.push({
        id: `ISS-${Date.now()}-ORG-2`,
        severity: "WARNING",
        category: "RELATIONSHIP",
        title: "Inactive Parent Organization",
        description: `Parent organization '${parentOrg.name}' is currently marked ${parentOrg.status}.`,
        affected_entity_id: parentOrg.id,
        affected_entity_type: "ORGANIZATION",
        suggested_action: "Verify parent organization licensing and activation.",
        created_at: now,
      });
    }

    // 2. Department Checks
    let deptsConfigured = activeDepartments.length > 0;
    if (!deptsConfigured) {
      issues.push({
        id: `ISS-${Date.now()}-DEP-1`,
        severity: "WARNING",
        category: "DEPARTMENT",
        title: "No Active Clinical Departments",
        description: "Facility does not have any active clinical departments.",
        affected_entity_id: facility.facility_code,
        affected_entity_type: "FACILITY",
        suggested_action: "Create at least one active clinical department.",
        created_at: now,
      });
    }

    // 3. Service Checks & Service-Department Consistency
    let servicesCataloged = activeServices.length > 0;
    if (!servicesCataloged) {
      issues.push({
        id: `ISS-${Date.now()}-SRV-1`,
        severity: "WARNING",
        category: "SERVICE",
        title: "No Active Healthcare Services",
        description: "Facility has no active healthcare services configured.",
        affected_entity_id: facility.facility_code,
        affected_entity_type: "FACILITY",
        suggested_action: "Add consultation or diagnostic services to the catalog.",
        created_at: now,
      });
    }

    let zeroOrphans = true;
    let zeroCrossTenant = true;

    for (const srv of services) {
      if (srv.department_id) {
        const dept = getDepartmentById(srv.department_id);
        if (!dept) {
          zeroOrphans = false;
          issues.push({
            id: `ISS-${Date.now()}-SRV-ORPHAN-${srv.id}`,
            severity: "CRITICAL",
            category: "SERVICE",
            title: `Service Linked to Non-existent Department: ${srv.name}`,
            description: `Service '${srv.name}' references non-existent department '${srv.department_id}'.`,
            affected_entity_id: srv.id,
            affected_entity_type: "SERVICE",
            suggested_action: "Reassign service to a valid department or make it facility-wide.",
            created_at: now,
          });
        } else if (
          dept.facility_id.toLowerCase() !== facility.id.toLowerCase() &&
          dept.facility_id.toLowerCase() !== facility.facility_code.toLowerCase()
        ) {
          zeroCrossTenant = false;
          issues.push({
            id: `ISS-${Date.now()}-SRV-CROSS-${srv.id}`,
            severity: "CRITICAL",
            category: "RELATIONSHIP",
            title: `Cross-Facility Department Mismatch: ${srv.name}`,
            description: `Service belongs to ${facility.name} but department belongs to foreign facility ${dept.facility_id}.`,
            affected_entity_id: srv.id,
            affected_entity_type: "SERVICE",
            suggested_action: "Assign service to a department belonging to this facility.",
            created_at: now,
          });
        }
      }
    }

    // 4. Doctor Affiliation & Department Checks
    let docsAffiliated = activeDoctors.length > 0;
    for (const doc of doctors) {
      if (doc.status === "ACTIVE" && doc.department_id) {
        const dept = getDepartmentById(doc.department_id);
        if (!dept) {
          zeroOrphans = false;
          issues.push({
            id: `ISS-${Date.now()}-DOC-DEP-ORPHAN-${doc.id}`,
            severity: "CRITICAL",
            category: "DOCTOR",
            title: `Doctor Assigned to Non-existent Department: ${doc.doctor_name}`,
            description: `Dr. ${doc.doctor_name} is assigned to non-existent department '${doc.department_id}'.`,
            affected_entity_id: doc.id,
            affected_entity_type: "AFFILIATION",
            suggested_action: "Reassign doctor to a valid active department.",
            created_at: now,
          });
        } else if (dept.status !== "ACTIVE") {
          issues.push({
            id: `ISS-${Date.now()}-DOC-DEP-INACTIVE-${doc.id}`,
            severity: "WARNING",
            category: "DOCTOR",
            title: `Doctor in Inactive Department: ${doc.doctor_name}`,
            description: `Dr. ${doc.doctor_name} is assigned to ${dept.name}, which is currently INACTIVE.`,
            affected_entity_id: doc.id,
            affected_entity_type: "AFFILIATION",
            suggested_action: "Reactivate department or reassign doctor.",
            created_at: now,
          });
        }
      }
    }

    // 5. Staff Affiliation & Department Checks
    let staffAssigned = activeStaff.length > 0;
    for (const st of staff) {
      if (st.status === "ACTIVE" && st.department_id) {
        const dept = getDepartmentById(st.department_id);
        if (!dept) {
          zeroOrphans = false;
          issues.push({
            id: `ISS-${Date.now()}-STAFF-DEP-ORPHAN-${st.id}`,
            severity: "CRITICAL",
            category: "STAFF",
            title: `Staff Assigned to Non-existent Department: ${st.staff_name}`,
            description: `Staff member ${st.staff_name} references non-existent department '${st.department_id}'.`,
            affected_entity_id: st.id,
            affected_entity_type: "AFFILIATION",
            suggested_action: "Update staff department assignment.",
            created_at: now,
          });
        } else if (
          dept.facility_id.toLowerCase() !== facility.id.toLowerCase() &&
          dept.facility_id.toLowerCase() !== facility.facility_code.toLowerCase()
        ) {
          zeroCrossTenant = false;
          issues.push({
            id: `ISS-${Date.now()}-STAFF-CROSS-${st.id}`,
            severity: "CRITICAL",
            category: "RELATIONSHIP",
            title: `Staff Cross-Facility Department Mismatch: ${st.staff_name}`,
            description: `Staff member belongs to ${facility.name} but department belongs to ${dept.facility_id}.`,
            affected_entity_id: st.id,
            affected_entity_type: "AFFILIATION",
            suggested_action: "Assign staff to a department within this facility.",
            created_at: now,
          });
        }
      }
    }

    // 6. Doctor Service Assignments Validation
    let docSrvCapabilitiesAssigned = facilityAssignments.length > 0;
    for (const dsa of facilityAssignments) {
      const doc = activeDoctors.find(
        (d) => d.doctor_id.toLowerCase() === dsa.doctor_id.toLowerCase()
      );
      if (!doc) {
        zeroOrphans = false;
        issues.push({
          id: `ISS-${Date.now()}-DSA-DOC-${dsa.id}`,
          severity: "CRITICAL",
          category: "SERVICE",
          title: `Service Assignment to Inactive/Missing Doctor: ${dsa.service_name}`,
          description: `Service '${dsa.service_name}' is assigned to doctor '${dsa.doctor_id}' who has no active affiliation at this facility.`,
          affected_entity_id: dsa.id,
          affected_entity_type: "SERVICE",
          suggested_action: "Affiliate the doctor with this facility or unassign the service.",
          created_at: now,
        });
      }

      const srv = activeServices.find((s) => s.id.toLowerCase() === dsa.service_id.toLowerCase());
      if (!srv) {
        zeroOrphans = false;
        issues.push({
          id: `ISS-${Date.now()}-DSA-SRV-${dsa.id}`,
          severity: "CRITICAL",
          category: "SERVICE",
          title: `Doctor Assigned to Inactive/Missing Service: ${dsa.doctor_name}`,
          description: `Dr. ${dsa.doctor_name} is assigned to service '${dsa.service_id}' which does not exist or is inactive.`,
          affected_entity_id: dsa.id,
          affected_entity_type: "SERVICE",
          suggested_action: "Reactivate service or remove provider assignment.",
          created_at: now,
        });
      }
    }

    // 7. Calculate Readiness Score
    let points = 0;
    if (parentOrgValid) points += 20;
    if (deptsConfigured) points += 15;
    if (servicesCataloged) points += 15;
    if (docsAffiliated) points += 15;
    if (staffAssigned) points += 15;
    if (docSrvCapabilitiesAssigned) points += 10;
    if (zeroOrphans) points += 5;
    if (zeroCrossTenant) points += 5;

    // Deduct for critical issues
    const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length;
    const readinessScore = Math.max(0, points - criticalCount * 25);
    const isReady = readinessScore >= 70 && criticalCount === 0;

    return {
      facility_id: facility.facility_code,
      facility_name: facility.name,
      organization_id: facility.organization_id,
      organization_name: parentOrg?.name || facility.organization_name || "",
      is_ready_for_phase6: isReady,
      readiness_score: readinessScore,
      metrics: {
        totalDepartments: departments.length,
        activeDepartments: activeDepartments.length,
        totalServices: services.length,
        activeServices: activeServices.length,
        totalDoctors: doctors.length,
        activeDoctors: activeDoctors.length,
        totalStaff: staff.length,
        activeStaff: activeStaff.length,
        doctorServiceMappings: facilityAssignments.length,
        scheduleContexts: activeDoctors.length,
      },
      checks: {
        parentOrganizationValid: parentOrgValid,
        departmentsConfigured: deptsConfigured,
        servicesCataloged: servicesCataloged,
        doctorsAffiliated: docsAffiliated,
        staffAssigned: staffAssigned,
        serviceCapabilitiesAssigned: docSrvCapabilitiesAssigned,
        schedulesLinked: docsAffiliated,
        zeroOrphanRecords: zeroOrphans,
        zeroCrossTenantMismatches: zeroCrossTenant,
      },
      issues,
      evaluated_at: now,
    };
  }

  /**
   * Evaluates operational health across all facilities in an organization.
   */
  public static evaluateOrganizationReadiness(orgIdOrIdentifier: string): {
    organization: any;
    facilitiesCount: number;
    readyFacilitiesCount: number;
    totalIssuesCount: number;
    facilityReports: FacilityOperationalReadinessReport[];
  } | null {
    const org = getOrganizationById(orgIdOrIdentifier);
    if (!org) return null;

    const allFacs = getAllFacilities();
    const orgFacs = allFacs.filter(
      (f) =>
        f.organization_id.toLowerCase() === org.id.toLowerCase() ||
        f.organization_id.toLowerCase() === org.identifier.toLowerCase()
    );

    const facilityReports: FacilityOperationalReadinessReport[] = [];
    let readyCount = 0;
    let totalIssues = 0;

    for (const fac of orgFacs) {
      const report = this.evaluateFacilityReadiness(fac.facility_code);
      if (report) {
        facilityReports.push(report);
        if (report.is_ready_for_phase6) readyCount++;
        totalIssues += report.issues.length;
      }
    }

    return {
      organization: org,
      facilitiesCount: orgFacs.length,
      readyFacilitiesCount: readyCount,
      totalIssuesCount: totalIssues,
      facilityReports,
    };
  }
}
