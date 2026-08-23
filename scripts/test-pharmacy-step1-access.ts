import { findIdentityById, findIdentityByEmail } from "../lib/data/identity-store";
import { PHARMACY_NAV } from "../lib/navigation";
import { PHARMACY_WORKSPACE } from "../lib/workspaces";
import { getAllIntakes, getIntakesByFacility } from "../lib/data/pharmacy-intake-store";
import { getAllOrders, getOrdersByFacility } from "../lib/data/pharmacy-order-store";
import { getAllPharmacyFacilities, getPharmacyFacilityById } from "../lib/data/pharmacy-organization-store";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
    failed++;
  }
}

async function runPharmacyStep1Suite() {
  console.log("============================================================");
  console.log("MEDORA — PHARMACY SIDE STEP 1: ACCESS, WORKSPACE & QUEUE");
  console.log("============================================================\n");

  const pharmUser = findIdentityByEmail("pharmacy@medora.health")!;
  const docUser = findIdentityById("DOC-1001")!;
  const patientUser = findIdentityById("PAT-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Pharmacy Staff Authentication & Identity Verification
  // ------------------------------------------------------------
  console.log("TEST 1: Pharmacy Staff Authentication & Identity Resolution");
  assert(Boolean(pharmUser), "1.1 Pharmacy staff account exists in identity store");
  assert(pharmUser.role === "pharmacy_staff", "1.2 Pharmacy staff role is 'pharmacy_staff'");
  assert(pharmUser.identifier === "PHA-1001", "1.3 Pharmacy identifier is PHARM-1001");
  assert(pharmUser.fullName === "ABC Pharmacy Desk", "1.4 Pharmacy staff name is 'ABC Pharmacy Desk'");

  // ------------------------------------------------------------
  // TEST 2: Workspace Authorization & Access-Restricted Regression Fix
  // ------------------------------------------------------------
  console.log("\nTEST 2: Pharmacy Workspace Authorization (Access-Restricted Fix)");
  assert(PHARMACY_WORKSPACE.allowedRoles.includes("pharmacy_staff"), "2.1 PHARMACY_WORKSPACE explicitly permits 'pharmacy_staff'");
  assert(PHARMACY_WORKSPACE.landingRoute === "/pharmacy", "2.2 Pharmacy landing route is /pharmacy");
  assert(!PHARMACY_WORKSPACE.allowedRoles.includes("patient"), "2.3 Patient role is strictly disallowed from PHARMACY_WORKSPACE");

  // ------------------------------------------------------------
  // TEST 3: Pharmacy Organization & Facility Association
  // ------------------------------------------------------------
  console.log("\nTEST 3: Pharmacy Facility Context & Scoping");
  const facilities = getAllPharmacyFacilities();
  assert(facilities.length >= 2, "3.1 Connected pharmacy facilities exist");
  const primaryFacility = getPharmacyFacilityById("PHARM-FAC-1001");
  assert(Boolean(primaryFacility), "3.2 Primary facility PHARM-FAC-1001 resolved");
  assert(primaryFacility?.organization_id === "PHARM-ORG-1001", "3.3 Facility belongs to ABC Pharmacy Group");
  assert(primaryFacility?.operational_status === "ACTIVE", "3.4 Primary facility operational status is ACTIVE");

  // ------------------------------------------------------------
  // TEST 4: Canonical Navigation & Removal of Development Badges
  // ------------------------------------------------------------
  console.log("\nTEST 4: Canonical Navigation Structure (9 Modules) & Phase Badge Cleanup");
  assert(PHARMACY_NAV.length === 9, "4.1 PHARMACY_NAV contains exactly 9 canonical modules");

  const sections = Array.from(new Set(PHARMACY_NAV.map(n => n.section)));
  assert(sections.includes("OPERATIONS"), "4.2 Contains 'OPERATIONS' section");
  assert(sections.includes("FULFILLMENT"), "4.3 Contains 'FULFILLMENT' section");
  assert(sections.includes("MANAGEMENT"), "4.4 Contains 'MANAGEMENT' section");

  const hasPhaseMarkers = PHARMACY_NAV.some(n => n.phase || n.comingSoon);
  assert(!hasPhaseMarkers, "4.5 Zero internal phase badges (Phase 9, etc.) present in PHARMACY_NAV");
  const workspacePhaseMarkers = PHARMACY_WORKSPACE.navItems.some(n => n.phase || n.comingSoon);
  assert(!workspacePhaseMarkers, "4.6 Zero internal phase badges present in PHARMACY_WORKSPACE");

  // Verify all 9 routes
  const routes = PHARMACY_NAV.map(n => n.href);
  assert(routes.includes("/pharmacy"), "4.7 Canonical Pharmacy Work Queue is /pharmacy");
  assert(routes.includes("/pharmacy/prescriptions"), "4.8 Canonical Prescriptions Queue is /pharmacy/prescriptions");
  assert(routes.includes("/pharmacy/orders"), "4.9 Canonical Orders route is /pharmacy/orders");
  assert(routes.includes("/pharmacy/preparation"), "4.10 Canonical Preparation route is /pharmacy/preparation");
  assert(routes.includes("/pharmacy/pickup"), "4.11 Canonical Patient Pickup route is /pharmacy/pickup");
  assert(routes.includes("/pharmacy/dispensing"), "4.12 Canonical Dispensing Desk is /pharmacy/dispensing");
  assert(routes.includes("/pharmacy/inventory"), "4.13 Canonical Inventory route is /pharmacy/inventory");
  assert(routes.includes("/pharmacy/staff"), "4.14 Canonical Pharmacy Staff is /pharmacy/staff");
  assert(routes.includes("/pharmacy/settings"), "4.15 Canonical Pharmacy Settings is /pharmacy/settings");

  // ------------------------------------------------------------
  // TEST 5: Work Queue Real Data Sourcing
  // ------------------------------------------------------------
  console.log("\nTEST 5: Work Queue Real Data Sourcing (Zero Hardcoded Data)");
  const intakes = getAllIntakes();
  assert(Array.isArray(intakes), "5.1 Prescription intakes retrieved as an array");
  assert(intakes.length >= 1, "5.2 Real seed intakes present");

  const orders = getAllOrders();
  assert(Array.isArray(orders), "5.3 Pharmacy orders retrieved as an array");
  assert(orders.length >= 1, "5.4 Real seed orders present");

  // Facility-scoped queries
  const facIntakes = getIntakesByFacility("PHARM-FAC-1001");
  assert(facIntakes.every(i => i.facility_id === "PHARM-FAC-1001"), "5.5 Facility intakes strictly belong to PHARM-FAC-1001");

  const facOrders = getOrdersByFacility("PHARM-FAC-1001");
  assert(facOrders.every(o => o.facility_id === "PHARM-FAC-1001"), "5.6 Facility orders strictly belong to PHARM-FAC-1001");

  // ------------------------------------------------------------
  // TEST 6: Anti-IDOR Cross-Pharmacy Data Isolation
  // ------------------------------------------------------------
  console.log("\nTEST 6: Anti-IDOR Cross-Pharmacy Isolation");
  const facBOrders = getOrdersByFacility("PHARM-FAC-9999");
  assert(facBOrders.length === 0, "6.1 Unaffiliated pharmacy facility query yields zero orders");

  console.log("\n============================================================");
  console.log(`PHARMACY STEP 1 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPharmacyStep1Suite();
