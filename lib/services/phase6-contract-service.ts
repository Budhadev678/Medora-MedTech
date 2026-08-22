// ============================================================
// MEDORA — PHASE 6 INTEGRATION CONTRACT SERVICE
// PHASE 5.4: DISCOVERY INTERFACES FOR APPOINTMENT & QUEUE FLOW
// ============================================================

import type {
  Phase6DiscoveryFacility,
  Phase6DiscoveryDepartment,
  Phase6DiscoveryService,
  Phase6DiscoveryDoctor,
  HealthcareDoctorAffiliation,
} from "@/types/database.types";
import { getAllFacilities, getFacilityById } from "@/lib/data/facility-store";
import { getDepartmentsForFacility } from "@/lib/data/department-store";
import {
  getServicesForFacility,
  getServiceById,
  getAllDoctorServiceAssignments,
} from "@/lib/data/service-store";
import { getFacilityDoctors, getDoctorAffiliations } from "@/lib/data/affiliation-store";

export class Phase6ContractService {
  /**
   * Discovers all active healthcare facilities available for patient appointments and care.
   */
  public static getDiscoverableFacilities(filters?: {
    city?: string;
    type?: string;
    organizationId?: string;
  }): Phase6DiscoveryFacility[] {
    const all = getAllFacilities();
    return all
      .filter((f) => {
        if (f.status !== "ACTIVE") return false;
        if (filters?.city && f.city.toLowerCase() !== filters.city.toLowerCase()) return false;
        if (filters?.type && f.type.toLowerCase() !== filters.type.toLowerCase()) return false;
        if (
          filters?.organizationId &&
          f.organization_id.toLowerCase() !== filters.organizationId.toLowerCase()
        )
          return false;
        return true;
      })
      .map((f) => {
        const depts = getDepartmentsForFacility(f.facility_code, false);
        const srvs = getServicesForFacility(f.facility_code, false);
        const docs = getFacilityDoctors(f.facility_code, false);

        return {
          facility_id: f.id,
          facility_code: f.facility_code,
          organization_id: f.organization_id,
          organization_name: f.organization_name || "",
          name: f.name,
          type: f.type,
          address: f.address,
          city: f.city,
          state: f.state,
          postal_code: f.postal_code,
          phone: f.phone,
          emergency_phone: f.emergency_phone,
          operating_hours: f.operating_hours,
          departments_count: depts.length,
          services_count: srvs.length,
          doctors_count: docs.length,
        };
      });
  }

  /**
   * Discovers active clinical departments within a specific facility.
   */
  public static getDiscoverableDepartments(
    facilityIdOrCode: string
  ): Phase6DiscoveryDepartment[] {
    const fac = getFacilityById(facilityIdOrCode);
    if (!fac || fac.status !== "ACTIVE") return [];

    const depts = getDepartmentsForFacility(fac.facility_code, false);
    const srvs = getServicesForFacility(fac.facility_code, false);
    const docs = getFacilityDoctors(fac.facility_code, false);

    return depts.map((d) => {
      const deptSrvs = srvs.filter((s) => s.department_id?.toLowerCase() === d.id.toLowerCase());
      const deptDocs = docs.filter((doc) => doc.department_id?.toLowerCase() === d.id.toLowerCase());

      return {
        department_id: d.id,
        facility_id: d.facility_id,
        name: d.name,
        code: d.code,
        description: d.description,
        head_doctor_name: d.head_doctor_name,
        services_count: deptSrvs.length,
        doctors_count: deptDocs.length,
      };
    });
  }

  /**
   * Discovers active healthcare services offered by a facility.
   */
  public static getDiscoverableServices(
    facilityIdOrCode: string,
    departmentId?: string
  ): Phase6DiscoveryService[] {
    const fac = getFacilityById(facilityIdOrCode);
    if (!fac || fac.status !== "ACTIVE") return [];

    const srvs = getServicesForFacility(fac.facility_code, false);
    const allAssignments = getAllDoctorServiceAssignments();
    const facilityAssignments = allAssignments.filter(
      (a) =>
        a.facility_id.toLowerCase() === fac.facility_code.toLowerCase() &&
        a.status === "ACTIVE"
    );

    return srvs
      .filter((s) => {
        if (departmentId && s.department_id?.toLowerCase() !== departmentId.toLowerCase()) {
          return false;
        }
        return true;
      })
      .map((s) => {
        const eligibleDocs = facilityAssignments.filter(
          (a) => a.service_id.toLowerCase() === s.id.toLowerCase()
        );

        return {
          service_id: s.id,
          facility_id: s.facility_id,
          department_id: s.department_id,
          department_name: s.department_name,
          name: s.name,
          code: s.code,
          category: s.category,
          duration_minutes: s.duration_minutes || 15,
          base_price: s.base_price || 0,
          eligible_doctors_count: eligibleDocs.length,
        };
      });
  }

  /**
   * Discovers active doctors eligible and authorized to provide a specific service at a facility.
   */
  public static getEligibleDoctorsForService(
    facilityIdOrCode: string,
    serviceId: string
  ): Phase6DiscoveryDoctor[] {
    const fac = getFacilityById(facilityIdOrCode);
    if (!fac || fac.status !== "ACTIVE") return [];

    const activeDocs = getFacilityDoctors(fac.facility_code, false);
    const allAssignments = getAllDoctorServiceAssignments();

    const matchingDocIds = allAssignments
      .filter(
        (a) =>
          a.facility_id.toLowerCase() === fac.facility_code.toLowerCase() &&
          a.service_id.toLowerCase() === serviceId.toLowerCase() &&
          a.status === "ACTIVE"
      )
      .map((a) => a.doctor_id.toLowerCase());

    return activeDocs
      .filter((d) => matchingDocIds.includes(d.doctor_id.toLowerCase()))
      .map((d) => {
        const assignedServices = allAssignments
          .filter(
            (a) =>
              a.doctor_id.toLowerCase() === d.doctor_id.toLowerCase() &&
              a.facility_id.toLowerCase() === fac.facility_code.toLowerCase() &&
              a.status === "ACTIVE"
          )
          .map((a) => ({ service_id: a.service_id, service_name: a.service_name }));

        return {
          doctor_id: d.doctor_id,
          doctor_name: d.doctor_name,
          specialization: d.specialization || "General Medicine",
          medical_reg_no: d.medical_reg_no,
          facility_id: d.facility_id,
          facility_name: d.facility_name || fac.name,
          department_id: d.department_id,
          department_name: d.department_name,
          role_title: d.role_title,
          consultation_fee: d.consultation_fee || 500,
          opd_room: d.opd_room,
          schedule_notes: d.schedule_notes,
          assigned_services: assignedServices,
        };
      });
  }

  /**
   * Returns a doctor's active operational context and schedule notes at a specific facility.
   */
  public static getDoctorFacilityScheduleContext(
    doctorId: string,
    facilityIdOrCode: string
  ): {
    doctor: HealthcareDoctorAffiliation | null;
    is_active: boolean;
    facility_name: string;
    department_name: string;
    consultation_fee: number;
    opd_room: string;
    schedule_notes: string;
  } | null {
    const fac = getFacilityById(facilityIdOrCode);
    if (!fac) return null;

    const affs = getDoctorAffiliations(doctorId, false);
    const aff = affs.find(
      (a) =>
        a.facility_id.toLowerCase() === fac.id.toLowerCase() ||
        a.facility_id.toLowerCase() === fac.facility_code.toLowerCase()
    );

    if (!aff || aff.status !== "ACTIVE") {
      return {
        doctor: null,
        is_active: false,
        facility_name: fac.name,
        department_name: "",
        consultation_fee: 0,
        opd_room: "",
        schedule_notes: "",
      };
    }

    return {
      doctor: aff,
      is_active: true,
      facility_name: aff.facility_name || fac.name,
      department_name: aff.department_name || "",
      consultation_fee: aff.consultation_fee || 500,
      opd_room: aff.opd_room || "OPD Chamber 1",
      schedule_notes: aff.schedule_notes || "Mon - Sat: 09:00 AM - 01:00 PM",
    };
  }
}
