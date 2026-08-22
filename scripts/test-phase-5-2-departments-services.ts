// ============================================================
// MEDORA TEST SUITE — PHASE 5.2
// DEPARTMENTS, SERVICES, DOCTOR & STAFF FACILITY RELATIONSHIPS
// ============================================================

import {
  getAllDepartments,
  getDepartmentsForFacility,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
  resetDepartmentStore,
} from "../lib/data/department-store";
import {
  getAllServices,
  getServicesForFacility,
  getServicesForDepartment,
  getServiceById,
  createService,
  updateService,
  deactivateService,
  assignDoctorToService,
  removeDoctorFromService,
  getDoctorAssignedServices,
  resetServiceStore,
} from "../lib/data/service-store";
import {
  getAllDoctorAffiliations,
  getFacilityDoctors,
  getDoctorAffiliations,
  createDoctorAffiliation,
  approveDoctorAffiliation,
  endDoctorAffiliation,
  getAllStaffAffiliations,
  getFacilityStaff,
  createStaffAffiliation,
  endStaffAffiliation,
  resetAffiliationStore,
} from "../lib/data/affiliation-store";
import { OrganizationService } from "../lib/services/organization-service";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${details ? ` - ${details}` : ""}`);
    failed++;
  }
}

console.log("\n============================================================");
console.log("RUNNING MEDORA PHASE 5.2 TEST SUITE: DEPARTMENTS & SERVICES");
console.log("============================================================\n");

// Reset stores
resetDepartmentStore();
resetServiceStore();
resetAffiliationStore();

const adminActor = { id: "ADM-9999", role: "admin", fullName: "Platform Admin" };
const patientActor = { id: "PAT-1001", role: "patient", fullName: "Rahul Verma" };

// ------------------------------------------------------------
// SECTION 1: DEPARTMENT CREATION & FACILITY SCOPING
// ------------------------------------------------------------
console.log("--- SECTION 1: Department Creation & Facility Scoping ---");

const bbsrDepts = getDepartmentsForFacility("FAC-1001");
assert(bbsrDepts.length >= 6, "FAC-1001 (Bhubaneswar Hub) has 6 seeded departments", `Found: ${bbsrDepts.length}`);

const cardDept = bbsrDepts.find((d) => d.code === "CARD");
assert(cardDept !== undefined, "Found Cardiology department in FAC-1001");
assert(cardDept?.head_doctor_id === "DOC-1001", "Cardiology head doctor is Dr. Ananya Sharma (DOC-1001)");

// Cross-facility department isolation: Clinic (FAC-2001) also has a Cardiology clinic without collision
const clinicDepts = getDepartmentsForFacility("FAC-2001");
assert(clinicDepts.length >= 3, "FAC-2001 (Clinic) has 3 seeded departments");

const clinicCard = clinicDepts.find((d) => d.code === "CARD");
assert(clinicCard !== undefined, "FAC-2001 has its own separate Cardiology department");
assert(clinicCard?.id !== cardDept?.id, "Department IDs are distinct between facilities");

// Duplicate department name in SAME facility is rejected
const duplicateDeptRes = createDepartment({
  facility_id: "FAC-1001",
  name: "Cardiology & Cath Lab",
  code: "CARD2",
  description: "Duplicate test",
  status: "ACTIVE",
});
assert(!duplicateDeptRes.success, "Duplicate department name in the same facility is prevented");

// Create a new valid department in FAC-1001
const pedDeptRes = OrganizationService.createDepartment(adminActor, {
  facility_id: "FAC-1001",
  name: "Pediatrics & Neonatal ICU",
  code: "PED-NICU",
  description: "Pediatric care and level-3 neonatal intensive care.",
  status: "ACTIVE",
});
assert(pedDeptRes.success, "Admin creates Pediatrics & Neonatal ICU in FAC-1001");

// Patient cannot create department
const patDeptRes = OrganizationService.createDepartment(patientActor, {
  facility_id: "FAC-1001",
  name: "Patient Department",
  code: "PAT",
  status: "ACTIVE",
});
assert(!patDeptRes.success, "Patient is unauthorized to create departments");

// ------------------------------------------------------------
// SECTION 2: HEALTHCARE SERVICE CATALOG
// ------------------------------------------------------------
console.log("\n--- SECTION 2: Healthcare Service Catalog ---");

const bbsrServices = getServicesForFacility("FAC-1001");
assert(bbsrServices.length >= 8, "FAC-1001 has 8 seeded clinical services", `Found: ${bbsrServices.length}`);

// Check department-scoped service
const ecgService = bbsrServices.find((s) => s.code === "CARD-ECG");
assert(ecgService !== undefined, "Found 12-Lead ECG service");
assert(ecgService?.department_id === "DEP-1001", "ECG service is scoped to Cardiology (DEP-1001)");
assert(ecgService?.base_price === 350, "ECG base fee is ₹350");

// Check facility-level service (no department)
const triageService = bbsrServices.find((s) => s.code === "EMERG-TRIAGE");
assert(triageService !== undefined, "Found Emergency Triage service");
assert(triageService?.department_id === null, "Emergency Triage is a facility-level service (no single dept)");

// Create a new procedure service under Cardiology
const angioServiceRes = OrganizationService.createService(adminActor, {
  facility_id: "FAC-1001",
  department_id: "DEP-1001",
  name: "Diagnostic Coronary Angiography",
  code: "CARD-ANGIO",
  category: "PROCEDURE",
  description: "Cath lab coronary angiogram under fluoroscopic guidance.",
  duration_minutes: 45,
  base_price: 12000,
  status: "ACTIVE",
});
assert(angioServiceRes.success, "Created Coronary Angiography procedure under Cardiology");

// ------------------------------------------------------------
// SECTION 3: DOCTOR MULTI-FACILITY AFFILIATIONS (UNIFIED IDENTITY)
// ------------------------------------------------------------
console.log("\n--- SECTION 3: Doctor Multi-Facility Affiliations ---");

// Dr. Ananya Sharma has a unified user identity (DOC-1001)
const doc1Affiliations = getDoctorAffiliations("DOC-1001");
assert(
  doc1Affiliations.length >= 3,
  "Dr. Ananya Sharma (DOC-1001) is affiliated with multiple distinct facilities",
  `Affiliations: ${doc1Affiliations.map((a) => `${a.facility_id} (${a.role_title})`).join("; ")}`
);

const cityAff = doc1Affiliations.find((a) => a.facility_id === "FAC-1001");
const clinicAff = doc1Affiliations.find((a) => a.facility_id === "FAC-2001");
assert(cityAff !== undefined && clinicAff !== undefined, "Doctor active at both City Hospital and Green Care Clinic");
assert(cityAff?.role_title === "Consultant Cardiologist", "Role at City Hospital is Consultant Cardiologist");
assert(clinicAff?.role_title === "Visiting Consultant", "Role at Clinic is Visiting Consultant");
assert(cityAff?.consultation_fee === 500, "City Hospital fee is ₹500");

// Connect Dr. Rahul Verma to Green Care Clinic (FAC-2001)
const newAffRes = OrganizationService.inviteDoctorAffiliation(adminActor, {
  doctor_id: "DOC-1003",
  doctor_name: "Dr. Rahul Verma",
  specialization: "Orthopedics",
  organization_id: "11111111-1111-1111-1111-111111111103",
  facility_id: "FAC-2001",
  role_title: "Visiting Orthopedic Consultant",
  consultation_fee: 550,
  opd_room: "Room 2",
  status: "ACTIVE",
  verification_status: "verified",
});
assert(newAffRes.success, "Dr. Rahul Verma successfully affiliated with second facility (FAC-2001)");

// ------------------------------------------------------------
// SECTION 4: DOCTOR SERVICE CAPABILITY ASSIGNMENTS
// ------------------------------------------------------------
console.log("\n--- SECTION 4: Doctor Service Capability Assignments ---");

// Check Dr. Ananya assigned services at FAC-1001
const docAssigned = getDoctorAssignedServices("DOC-1001", "FAC-1001");
assert(docAssigned.length >= 3, "Dr. Ananya is assigned to provide 3 services at FAC-1001 (Consult, ECG, Echo)");

// Assign Dr. Ananya to newly created Angiography service
const assignRes = OrganizationService.assignDoctorToService(
  adminActor,
  "DOC-1001",
  "Dr. Ananya Sharma",
  "FAC-1001",
  angioServiceRes.service!.id
);
assert(assignRes.success, "Dr. Ananya assigned to provide Coronary Angiography at FAC-1001");

// Remove doctor from service
const removeDocSrvRes = OrganizationService.removeDoctorFromService(
  adminActor,
  "DOC-1001",
  "FAC-1001",
  "SRV-1002"
);
assert(removeDocSrvRes.success, "Successfully unassigned Dr. Ananya from SRV-1002");

// ------------------------------------------------------------
// SECTION 5: STAFF AFFILIATIONS & OPERATIONAL ROSTERS
// ------------------------------------------------------------
console.log("\n--- SECTION 5: Staff Affiliations & Operational Rosters ---");

const fac1Staff = getFacilityStaff("FAC-1001");
assert(fac1Staff.length >= 2, "FAC-1001 has active staff personnel (Receptionist, Admin)", `Count: ${fac1Staff.length}`);

// Add a new Nurse to FAC-1001
const nurseRes = OrganizationService.assignStaff(adminActor, {
  user_id: "NURSE-1001",
  staff_name: "Pooja Mohanty",
  email: "pooja.nurse@cityhospital.org",
  phone: "+91 674 2550119",
  organization_id: "11111111-1111-1111-1111-111111111101",
  facility_id: "FAC-1001",
  department_id: "DEP-1001",
  department_name: "Cardiology & Cath Lab",
  role_title: "Staff Nurse — Cath Recovery",
  staff_role: "NURSE",
  status: "ACTIVE",
});
assert(nurseRes.success, "Successfully assigned Nurse Pooja Mohanty to Cardiology Department");

// ------------------------------------------------------------
// SECTION 6: HISTORICAL INTEGRITY & SOFT DEACTIVATION
// ------------------------------------------------------------
console.log("\n--- SECTION 6: Historical Integrity & Soft Deactivation ---");

// End doctor affiliation at FAC-2001
const endDocRes = OrganizationService.endDoctorAffiliation(
  adminActor,
  "FAC-2001",
  "DOC-1003",
  "Contract period ended"
);
assert(endDocRes.success, "Ended Dr. Rahul Verma affiliation at FAC-2001");

// Doctor still has active affiliation at FAC-1001
const rahulCityAff = getDoctorAffiliations("DOC-1003");
const activeRahul = rahulCityAff.filter((a) => a.status === "ACTIVE");
assert(
  activeRahul.some((a) => a.facility_id === "FAC-1001"),
  "Ending affiliation at FAC-2001 leaves FAC-1001 affiliation ACTIVE"
);

// Soft deactivation of department
const deactDeptRes = OrganizationService.deactivateDepartment(
  adminActor,
  "DEP-1009",
  "Unit merged with main orthopedics"
);
assert(deactDeptRes.success, "Department DEP-1009 soft-deactivated");

const deactDept = getDepartmentById("DEP-1009");
assert(deactDept?.status === "INACTIVE", "DEP-1009 status is INACTIVE (historical references intact)");

console.log("\n============================================================");
console.log(`PHASE 5.2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("============================================================\n");

if (failed > 0) {
  process.exit(1);
}
