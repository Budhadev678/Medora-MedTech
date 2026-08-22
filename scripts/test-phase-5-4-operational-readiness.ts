// ============================================================
// MEDORA — PHASE 5.4 COMPREHENSIVE TEST SUITE
// FACILITY OPERATIONAL READINESS, CONNECTIVITY VALIDATION &
// PHASE 6 INTEGRATION CONTRACT
// ============================================================

import { FacilityReadinessService } from "../lib/services/facility-readiness-service";
import { Phase6ContractService } from "../lib/services/phase6-contract-service";
import {
  getAllDoctorServiceAssignments,
  saveDoctorServiceAssignments,
  resetServiceStore,
} from "../lib/data/service-store";
import { resetAffiliationStore } from "../lib/data/affiliation-store";
import { resetDepartmentStore } from "../lib/data/department-store";
import { resetFacilityStore } from "../lib/data/facility-store";

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedAssertions++;
    console.error(`  ✗ FAIL: ${testName}${details ? ` - ${details}` : ""}`);
  }
}

console.log("============================================================");
console.log("MEDORA — PHASE 5.4 TEST SUITE: OPERATIONAL READINESS & PHASE 6");
console.log("============================================================\n");

// Reset all stores to canonical state
resetFacilityStore();
resetDepartmentStore();
resetServiceStore();
resetAffiliationStore();

// ------------------------------------------------------------
// TEST GROUP 1: FACILITY OPERATIONAL READINESS EVALUATION
// ------------------------------------------------------------
console.log("TEST GROUP 1: Facility Operational Readiness & Integrity Check");

const fac1001Report = FacilityReadinessService.evaluateFacilityReadiness("FAC-1001");
assert(!!fac1001Report, "Generated operational readiness report for FAC-1001");
assert(
  fac1001Report?.readiness_score === 100,
  "FAC-1001 achieves 100% operational readiness score",
  `Score: ${fac1001Report?.readiness_score}`
);
assert(
  fac1001Report?.is_ready_for_phase6 === true,
  "FAC-1001 marked is_ready_for_phase6 = true"
);
assert(
  fac1001Report?.checks.parentOrganizationValid === true,
  "Check 1: Parent organization is valid and active"
);
assert(
  fac1001Report?.checks.departmentsConfigured === true && fac1001Report?.metrics.activeDepartments === 6,
  "Check 2: Clinical departments configured (6 active departments)"
);
assert(
  fac1001Report?.checks.servicesCataloged === true && fac1001Report?.metrics.activeServices === 8,
  "Check 3: Healthcare services cataloged (8 active services in FAC-1001)"
);
assert(
  fac1001Report?.checks.doctorsAffiliated === true && fac1001Report?.metrics.activeDoctors >= 3,
  "Check 4: Doctors actively affiliated with verified credentials"
);
assert(
  fac1001Report?.checks.staffAssigned === true && fac1001Report?.metrics.activeStaff >= 2,
  "Check 5: Operational staff assigned across clinical departments"
);
assert(
  fac1001Report?.checks.serviceCapabilitiesAssigned === true && fac1001Report?.metrics.doctorServiceMappings >= 3,
  "Check 6: Doctor-to-service capabilities mapped per facility"
);
assert(
  fac1001Report?.checks.zeroOrphanRecords === true,
  "Check 7: Zero orphan records detected across relational graph"
);
assert(
  fac1001Report?.checks.zeroCrossTenantMismatches === true,
  "Check 8: Zero cross-tenant / cross-facility mismatches"
);
assert(
  fac1001Report?.checks.schedulesLinked === true,
  "Check 9: Phase 4 operational schedules linked to active affiliations"
);
assert(
  fac1001Report?.issues.length === 0,
  "Zero configuration issues flagged on clean baseline facility"
);

// ------------------------------------------------------------
// TEST GROUP 2: CONFIGURATION ISSUE DETECTION & RECOVERY
// ------------------------------------------------------------
console.log("\nTEST GROUP 2: Issue Detection, Score Penalty & Automatic Recovery");

// Inject an invalid orphan doctor-service mapping directly
const originalAssignments = getAllDoctorServiceAssignments();
const orphanAssignment = {
  id: "ORPHAN-TEST-1",
  doctor_id: "DOC-NONEXISTENT",
  doctor_name: "Dr. Phantom",
  service_id: "SRV-1001",
  service_name: "Cardiology OPD Consultation",
  facility_id: "FAC-1001",
  status: "ACTIVE" as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
saveDoctorServiceAssignments([...originalAssignments, orphanAssignment]);

const damagedReport = FacilityReadinessService.evaluateFacilityReadiness("FAC-1001");
assert(
  !!damagedReport && damagedReport.issues.length > 0,
  "Readiness evaluator immediately flags invalid/orphan doctor-service assignment",
  `Found ${damagedReport?.issues.length} issues`
);
assert(
  damagedReport?.is_ready_for_phase6 === false,
  "Facility with critical configuration issue is blocked from Phase 6 readiness (is_ready_for_phase6 = false)"
);
assert(
  (damagedReport?.readiness_score || 0) < 100,
  "Readiness score penalized for critical relational issue",
  `Damaged score: ${damagedReport?.readiness_score}`
);

// Recover by restoring clean assignments
saveDoctorServiceAssignments(originalAssignments);

const recoveredReport = FacilityReadinessService.evaluateFacilityReadiness("FAC-1001");
assert(
  recoveredReport?.issues.length === 0,
  "Configuration issue removed cleanly"
);
assert(
  recoveredReport?.readiness_score === 100 && recoveredReport?.is_ready_for_phase6 === true,
  "Operational readiness restored to 100% and Phase 6 ready"
);

// ------------------------------------------------------------
// TEST GROUP 3: ORGANIZATION-LEVEL READINESS AUDIT
// ------------------------------------------------------------
console.log("\nTEST GROUP 3: Organization-Wide Operational Health Roll-up");

const orgReport = FacilityReadinessService.evaluateOrganizationReadiness(
  "11111111-1111-1111-1111-111111111101"
);
assert(!!orgReport, "Generated organization readiness audit");
assert(orgReport?.facilitiesCount === 3, "Organization tracks all 3 child facilities (FAC-1001, FAC-1002, FAC-1003)");
assert(
  orgReport?.readyFacilitiesCount === 1,
  "Hub facility FAC-1001 is verified Phase 6 ready (branch facilities correctly identified as pending setup)",
  `Ready: ${orgReport?.readyFacilitiesCount}/${orgReport?.facilitiesCount}`
);
assert(
  (orgReport?.totalIssuesCount || 0) > 0,
  "Organization audit correctly reports missing doctors/services on incomplete branch clinics"
);

// ------------------------------------------------------------
// TEST GROUP 4: PHASE 6 DISCOVERY CONTRACT INTERFACES
// ------------------------------------------------------------
console.log("\nTEST GROUP 4: Phase 6 Integration Discovery Interfaces");

// 1. Discoverable Facilities
const discoverableFacs = Phase6ContractService.getDiscoverableFacilities();
assert(
  discoverableFacs.length >= 6,
  "getDiscoverableFacilities discovers all active facilities across organizations",
  `Discovered: ${discoverableFacs.length}`
);

const bhubaneswarFacs = Phase6ContractService.getDiscoverableFacilities({ city: "Bhubaneswar" });
assert(
  bhubaneswarFacs.length >= 3,
  "getDiscoverableFacilities filters facilities by city accurately",
  `Found in Bhubaneswar: ${bhubaneswarFacs.length}`
);

const facDetails = discoverableFacs.find((f) => f.facility_code === "FAC-1001");
assert(
  !!facDetails &&
    facDetails.departments_count === 6 &&
    facDetails.services_count === 8 &&
    facDetails.doctors_count >= 3,
  "Discovered facility provides precomputed department, service, and doctor counts for booking UI"
);

// 2. Discoverable Departments
const depts = Phase6ContractService.getDiscoverableDepartments("FAC-1001");
assert(depts.length === 6, "getDiscoverableDepartments returns all active clinical departments in facility");
const cardioDept = depts.find((d) => d.code === "CARD");
assert(
  !!cardioDept && cardioDept.name === "Cardiology & Cath Lab",
  "Discovered department includes name, code, description, and unit head"
);

// 3. Discoverable Services
const services = Phase6ContractService.getDiscoverableServices("FAC-1001");
assert(services.length === 8, "getDiscoverableServices returns catalog of active services with duration and pricing");

const cardioServices = Phase6ContractService.getDiscoverableServices("FAC-1001", "DEP-1001");
assert(cardioServices.length === 3, "Filtered services by department (3 Cardiology services)");

// 4. Eligible Doctors for Service
const ecgDoctors = Phase6ContractService.getEligibleDoctorsForService("FAC-1001", "SRV-1002");
assert(
  ecgDoctors.length >= 1,
  "getEligibleDoctorsForService discovers authorized doctors for ECG at FAC-1001",
  `Found: ${ecgDoctors.length} doctors`
);
assert(
  ecgDoctors.some((d) => d.doctor_id === "DOC-1001"),
  "Dr. Ananya (DOC-1001) is confirmed eligible provider for ECG at FAC-1001"
);

// 5. Doctor Facility Schedule Context
const docScheduleContext = Phase6ContractService.getDoctorFacilityScheduleContext("DOC-1001", "FAC-1001");
assert(
  !!docScheduleContext &&
    docScheduleContext.is_active === true &&
    docScheduleContext.consultation_fee === 500 &&
    docScheduleContext.opd_room === "OPD Room 102" &&
    docScheduleContext.facility_name.includes("Bhubaneswar Main Campus"),
  "getDoctorFacilityScheduleContext provides exact operational consultation parameters for Phase 6"
);

const docScheduleContext2 = Phase6ContractService.getDoctorFacilityScheduleContext("DOC-1001", "FAC-1004");
assert(
  !!docScheduleContext2 &&
    docScheduleContext2.is_active === true &&
    docScheduleContext2.consultation_fee === 600 &&
    docScheduleContext2.opd_room === "Specialist Suite 204",
  "getDoctorFacilityScheduleContext reflects facility-specific fee (₹600) and room (Specialist Suite 204) at FAC-1004"
);

console.log("\n============================================================");
console.log(`PHASE 5.4 TEST SUMMARY: ${passedAssertions}/${totalAssertions} assertions passed (${Math.round((passedAssertions / totalAssertions) * 100)}%)`);
console.log("============================================================\n");

if (failedAssertions > 0) {
  process.exit(1);
}
