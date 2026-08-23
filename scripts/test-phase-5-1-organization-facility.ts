// ============================================================
// MEDORA TEST SUITE â€” PHASE 5.1
// ORGANIZATION & HEALTHCARE FACILITY FOUNDATION
// ============================================================

import {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deactivateOrganization,
  getAllFacilities,
  getFacilityById,
  getFacilitiesForOrganization,
  createFacility,
  updateFacility,
  deactivateFacility,
  resetFacilityStore,
} from "../lib/data/facility-store";
import { OrganizationService } from "../lib/services/organization-service";
import { getAuditLedger } from "../lib/data/audit-store";

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
console.log("RUNNING MEDORA PHASE 5.1 TEST SUITE: ORGANIZATION & FACILITY");
console.log("============================================================\n");

// Reset store
resetFacilityStore();

// ------------------------------------------------------------
// SECTION 1: SEEDED ORGANIZATIONS & MULTI-BRANCH FACILITIES
// ------------------------------------------------------------
console.log("--- SECTION 1: Seeded Organizations & Multi-Branch Facilities ---");

const seedOrgs = getAllOrganizations();
assert(seedOrgs.length >= 6, "Seeded organizations list loaded", `Found: ${seedOrgs.length}`);

const cityOrg = getOrganizationById("HSP-1001");
assert(cityOrg !== null, "Found City Healthcare Group (HSP-1001)");
assert(cityOrg?.name === "City Healthcare Group", "City Org name matches");
assert(cityOrg?.type === "HOSPITAL_GROUP", "City Org type is HOSPITAL_GROUP");

const cityFacilities = getFacilitiesForOrganization("HSP-1001");
assert(
  cityFacilities.length >= 3,
  "City Healthcare Group has multi-branch facilities (Bhubaneswar, Rourkela, Cuttack)",
  `Branches: ${cityFacilities.map((f) => f.facility_code).join(", ")}`
);

const bbsrBranch = getFacilityById("FAC-1001");
assert(bbsrBranch !== null, "Found Bhubaneswar Main Campus (FAC-1001)");
assert(bbsrBranch?.city === "Bhubaneswar", "FAC-1001 is in Bhubaneswar");

const rouBranch = getFacilityById("FAC-1002");
assert(rouBranch !== null, "Found Rourkela Trauma Center (FAC-1002)");
assert(rouBranch?.city === "Rourkela", "FAC-1002 is in Rourkela");

// ------------------------------------------------------------
// SECTION 2: ORGANIZATION CREATION & VALIDATION
// ------------------------------------------------------------
console.log("\n--- SECTION 2: Organization Creation & Validation ---");

const adminActor = { id: "ADM-9999", role: "admin", fullName: "Platform Admin" };
const patientActor = { id: "PAT-1001", role: "patient", fullName: "Rahul Verma" };

// Patient cannot create organization
const patCreateRes = OrganizationService.createOrganization(patientActor, {
  identifier: "HSP-FAIL",
  name: "Unauthorized Patient Hospital",
  type: "HOSPITAL_GROUP",
  license_no: "HSP-PAT-FAIL",
  phone: "+91 674 1111111",
  address: "Test Road",
  city: "Bhubaneswar",
  state: "Odisha",
  country: "India",
  status: "ACTIVE",
  verification_status: "verified",
});
assert(!patCreateRes.success, "Patient is blocked from creating healthcare organizations");

// Admin creates valid organization
const newOrgRes = OrganizationService.createOrganization(adminActor, {
  identifier: "HSP-5001",
  name: "Kalinga Apex Healthcare Network",
  legal_name: "Kalinga Apex Hospitals & Research Institute Pvt Ltd",
  type: "HEALTHCARE_NETWORK",
  license_no: "HSP-OD-2026-8801",
  phone: "+91 674 2990000",
  email: "contact@kalingaapex.org",
  website: "https://kalingaapex.org",
  address: "Infocity Healthcare Corridor, Chandrasekharpur",
  city: "Bhubaneswar",
  district: "Khordha",
  state: "Odisha",
  postal_code: "751024",
  country: "India",
  status: "ACTIVE",
  verification_status: "verified",
});
assert(newOrgRes.success, "Admin successfully creates Kalinga Apex Healthcare Network (HSP-5001)");
assert(newOrgRes.organization?.identifier === "HSP-5001", "New organization identifier matches HSP-5001");

// Duplicate identifier rejection
const duplicateOrgRes = createOrganization({
  identifier: "HSP-5001",
  name: "Duplicate Kalinga Health",
  type: "HOSPITAL_GROUP",
  license_no: "HSP-DUP-001",
  phone: "+91 674 0000000",
  address: "Test",
  city: "Bhubaneswar",
  state: "Odisha",
  country: "India",
  status: "ACTIVE",
  verification_status: "verified",
});
assert(!duplicateOrgRes.success, "Duplicate organization identifier is rejected");

// ------------------------------------------------------------
// SECTION 3: MULTI-BRANCH FACILITY CREATION & PARENT LINKING
// ------------------------------------------------------------
console.log("\n--- SECTION 3: Multi-Branch Facility Creation & Parent Linking ---");

// Create Facility Campus 1 under Kalinga Apex
const fac1Res = OrganizationService.createFacility(adminActor, {
  facility_code: "FAC-5001",
  organization_id: "HSP-5001",
  name: "Kalinga Apex Super-Specialty Hospital â€” Bhubaneswar Hub",
  type: "HOSPITAL",
  license_no: "HSP-OD-2026-8801-A",
  phone: "+91 674 2990100",
  emergency_phone: "112",
  email: "bbsr@kalingaapex.org",
  address: "Plot 12, Infocity Road",
  city: "Bhubaneswar",
  district: "Khordha",
  state: "Odisha",
  postal_code: "751024",
  country: "India",
  operating_hours: "24/7 Emergency & Inpatient Care",
  status: "ACTIVE",
  verification_status: "verified",
});
assert(fac1Res.success, "Created Bhubaneswar Hub facility (FAC-5001) under HSP-5001");

// Create Facility Campus 2 under Kalinga Apex
const fac2Res = OrganizationService.createFacility(adminActor, {
  facility_code: "FAC-5002",
  organization_id: "HSP-5001",
  name: "Kalinga Apex Specialty Clinic â€” Berhampur Branch",
  type: "CLINIC",
  license_no: "HSP-OD-2026-8801-B",
  phone: "+91 680 2200100",
  emergency_phone: "112",
  email: "berhampur@kalingaapex.org",
  address: "Medical College Road",
  city: "Berhampur",
  district: "Ganjam",
  state: "Odisha",
  postal_code: "760004",
  country: "India",
  operating_hours: "08:00 AM - 08:00 PM Daily",
  status: "ACTIVE",
  verification_status: "verified",
});
assert(fac2Res.success, "Created Berhampur Branch facility (FAC-5002) under HSP-5001");

// Verify Multi-Branch Retrieval for Kalinga Apex
const kalingaBranches = getFacilitiesForOrganization("HSP-5001");
assert(
  kalingaBranches.length === 2,
  "HSP-5001 has exactly 2 connected physical branches",
  `Found: ${kalingaBranches.length}`
);

// Cannot create facility under non-existent organization
const invalidOrgFacRes = createFacility({
  facility_code: "FAC-9999",
  organization_id: "NON-EXISTENT-ORG-9999",
  name: "Ghost Hospital",
  type: "HOSPITAL",
  phone: "+91 000 0000000",
  address: "Nowhere",
  city: "Bhubaneswar",
  state: "Odisha",
  postal_code: "751001",
  country: "India",
  status: "ACTIVE",
  verification_status: "verified",
});
assert(!invalidOrgFacRes.success, "Facility creation under non-existent parent organization is blocked");

// ------------------------------------------------------------
// SECTION 4: CROSS-ORGANIZATION ISOLATION & AUTHORIZATION
// ------------------------------------------------------------
console.log("\n--- SECTION 4: Cross-Organization Isolation & Authorization ---");

const kalingaOrgAdmin = {
  id: "ADM-5001",
  role: "hospital_admin",
  organizationId: "HSP-5001",
  fullName: "Kalinga Org Admin",
};

// Kalinga Org Admin updates own organization
const validUpdateRes = OrganizationService.updateOrganization(
  kalingaOrgAdmin,
  "HSP-5001",
  { phone: "+91 674 2990999" }
);
assert(validUpdateRes.success, "Org Admin successfully updates their own organization");

// Kalinga Org Admin attempts to tamper with City Healthcare Group (HSP-1001)
const forbiddenOrgUpdate = OrganizationService.updateOrganization(
  kalingaOrgAdmin,
  "HSP-1001",
  { name: "Hacked City Hospital" }
);
assert(!forbiddenOrgUpdate.success, "Forbidden: Org Admin cannot modify a different healthcare organization");

// Kalinga Org Admin attempts to create facility under City Healthcare Group
const forbiddenFacCreate = OrganizationService.createFacility(
  kalingaOrgAdmin,
  {
    facility_code: "FAC-HACK",
    organization_id: "HSP-1001",
    name: "Intruder Branch",
    type: "HOSPITAL",
    phone: "+91 674 0000000",
    address: "MG Road",
    city: "Bhubaneswar",
    state: "Odisha",
    postal_code: "751001",
    country: "India",
    status: "ACTIVE",
    verification_status: "verified",
  }
);
assert(!forbiddenFacCreate.success, "Forbidden: Cannot create facility under an organization not managed by actor");

// ------------------------------------------------------------
// SECTION 5: SOFT DEACTIVATION & AUDIT LEDGER
// ------------------------------------------------------------
console.log("\n--- SECTION 5: Soft Deactivation & Audit Ledger ---");

// Soft deactivation of Berhampur facility
const deactRes = OrganizationService.deactivateFacility(
  adminActor,
  "FAC-5002",
  "Temporary operational restructuring"
);
assert(deactRes.success, "Facility FAC-5002 soft-deactivated");

const deactFac = getFacilityById("FAC-5002");
assert(deactFac?.status === "INACTIVE", "FAC-5002 status is marked INACTIVE (not deleted)");

// Aggregations dynamically reflect status
const metrics = OrganizationService.getOrganizationDashboardMetrics("HSP-5001");
assert(metrics !== null, "Calculated organization metrics for HSP-5001");
assert(metrics?.totalFacilities === 2, "Total facilities is 2");
assert(metrics?.activeFacilities === 1, "Active facilities is 1");

// Audit Events Check
const auditEvents = getAuditLedger();
const orgCreatedEvent = auditEvents.find((e) => e.event_type === "ORGANIZATION_CREATED");
assert(orgCreatedEvent !== undefined, "Audit ledger recorded ORGANIZATION_CREATED event");

const facStatusEvent = auditEvents.find((e) => e.event_type === "FACILITY_STATUS_CHANGED");
assert(facStatusEvent !== undefined, "Audit ledger recorded FACILITY_STATUS_CHANGED event");

console.log("\n============================================================");
console.log(`PHASE 5.1 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("============================================================\n");

if (failed > 0) {
  process.exit(1);
}
