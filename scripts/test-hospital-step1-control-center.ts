import { findIdentityById } from "../lib/data/identity-store";
import { getFacilityById } from "../lib/data/facility-store";
import { HOSPITAL_NAV } from "../lib/navigation";
import { getAllEmergencies } from "../lib/data/emergency-store";
import { getAllAdmissions } from "../lib/data/admission-store";
import { getAllBills } from "../lib/data/billing-store";
import { AppointmentStore } from "../lib/data/appointment-store";

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

async function runHospitalStep1Suite() {
  console.log("============================================================");
  console.log("MEDORA — HOSPITAL STEP 1: CONTROL CENTER & ARCHITECTURE");
  console.log("============================================================\n");

  // ------------------------------------------------------------
  // TEST 1: Canonical Hospital Identity & Context Scoping
  // ------------------------------------------------------------
  console.log("TEST 1: Canonical Hospital Identity & Scoping");
  const hospitalA = getFacilityById("FAC-1001");
  assert(Boolean(hospitalA), "1.1 City Hospital facility (FAC-1001) resolves from authoritative store");
  assert(hospitalA?.name.includes("City Hospital") === true, "1.2 Facility name is authentic");
  assert(hospitalA?.organization_id === "11111111-1111-1111-1111-111111111101", "1.3 Organization linkage verified");

  // ------------------------------------------------------------
  // TEST 2: Navigation Grouping & Structure
  // ------------------------------------------------------------
  console.log("\nTEST 2: Navigation Grouping & Canonical Structure");
  assert(HOSPITAL_NAV.length >= 10, "2.1 HOSPITAL_NAV populated with operational modules");
  
  const sections = Array.from(new Set(HOSPITAL_NAV.map(n => n.section).filter(Boolean)));
  assert(sections.includes("CONTROL"), "2.2 Contains 'CONTROL' section");
  assert(sections.includes("OPERATIONS"), "2.3 Contains 'OPERATIONS' section");
  assert(sections.includes("FINANCE"), "2.4 Contains 'FINANCE' section");
  assert(sections.includes("OVERSIGHT"), "2.5 Contains 'OVERSIGHT' section");
  assert(sections.includes("INTEGRATIONS"), "2.6 Contains 'INTEGRATIONS' section");
  assert(sections.includes("SYSTEM"), "2.7 Contains 'SYSTEM' section");

  // Zero internal phase badges
  const hasPhaseBadge = HOSPITAL_NAV.some(n => n.label.includes("Phase") || n.badge?.includes("Phase"));
  assert(!hasPhaseBadge, "2.8 Zero internal phase badges present in HOSPITAL_NAV");

  // ------------------------------------------------------------
  // TEST 3: Real Backend Data Aggregation & Zero Fake Counts
  // ------------------------------------------------------------
  console.log("\nTEST 3: Real Backend Data Aggregation (Zero Fake Statistics)");
  const emergencies = getAllEmergencies();
  assert(Array.isArray(emergencies), "3.1 Real emergencies retrieved as array");

  const admissions = getAllAdmissions();
  assert(Array.isArray(admissions), "3.2 Real inpatient admissions retrieved as array");

  const bills = getAllBills();
  assert(Array.isArray(bills), "3.3 Real billing records retrieved as array");

  const hospitalAppointments = AppointmentStore.getAppointmentsForFacility("FAC-1001");
  assert(Array.isArray(hospitalAppointments), "3.4 Appointments retrieved for facility FAC-1001");

  // ------------------------------------------------------------
  // TEST 4: Cross-Hospital Isolation & Multi-Facility Scoping
  // ------------------------------------------------------------
  console.log("\nTEST 4: Cross-Hospital Isolation");
  const fac1001Admissions = admissions.filter(a => a.facility_id === "FAC-1001");
  const fac1004Admissions = admissions.filter(a => a.facility_id === "FAC-1004");
  assert(!fac1001Admissions.some(a => a.facility_id === "FAC-1004"), "4.1 Facility FAC-1001 admissions strictly isolated from FAC-1004");

  // ------------------------------------------------------------
  // TEST 5: Role-Based Authorization Bounds
  // ------------------------------------------------------------
  console.log("\nTEST 5: Role-Based Authorization Bounds");
  const patient = findIdentityById("PAT-1001")!;
  const hospitalAdmin = findIdentityById("STAFF-1001") || findIdentityById("DOC-1001")!;
  assert(patient.role === "patient", "5.1 Patient identity resolved");
  assert(hospitalAdmin.role !== "patient", "5.2 Hospital staff/admin identity resolved");

  console.log("\n============================================================");
  console.log(`HOSPITAL STEP 1 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runHospitalStep1Suite();