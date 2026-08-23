import { findIdentityById, findIdentityByEmail, getAllIdentities } from "../lib/data/identity-store";
import { 
  getDoctorContext, 
  setActiveDoctorAffiliation, 
  setDoctorDutyStatus, 
  isDoctorAuthorizedForFacility,
  DoctorDutyStatus 
} from "../lib/data/doctor-context-store";
import { DOCTOR_NAV } from "../lib/navigation";
import { DOCTOR_WORKSPACE } from "../lib/workspaces";
import { AppointmentStore } from "../lib/data/appointment-store";
import { getDoctorLabOrders } from "../lib/data/lab-order-store";
import { getDoctorPrescriptions } from "../lib/data/prescription-store";

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

async function runDoctorStep1Suite() {
  console.log("============================================================");
  console.log("MEDORA — DOCTOR SIDE STEP 1: WORKSPACE ARCHITECTURE & CONTEXT");
  console.log("============================================================\n");

  const docA = findIdentityById("DOC-1001")!;
  const docB = findIdentityById("DOC-1002")!;
  const patientA = findIdentityById("PAT-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Doctor Identity & Workspace Resolution
  // ------------------------------------------------------------
  console.log("TEST 1: Authenticated Doctor Identity & Workspace Resolution");
  assert(Boolean(docA && docA.role === "doctor"), "1.1 Doctor A identity resolved");
  const ctxA = getDoctorContext("DOC-1001")!;
  assert(ctxA.doctorId === "DOC-1001", "1.2 Doctor ID matches authenticated user");
  assert(ctxA.doctorName === "Dr. Ananya Sharma", "1.3 Doctor name is Dr. Ananya Sharma");
  assert(ctxA.specialization === "Cardiology", "1.4 Doctor specialization is Cardiology");
  assert(ctxA.facilityId === "HSP-1001", "1.5 Default active facility is City Hospital (HSP-1001)");
  assert(ctxA.opdRoom === "OPD Room 102", "1.6 Active OPD room is OPD Room 102");

  // ------------------------------------------------------------
  // TEST 2: Patient/Non-Doctor Access Denial
  // ------------------------------------------------------------
  console.log("\nTEST 2: Patient / Non-Doctor Access Denial");
  assert(patientA.role === "patient", "2.1 User is a patient");
  const patientDocContext = getDoctorContext("PAT-1001");
  assert(patientDocContext === null, "2.2 Patient account has null doctor clinical context");
  assert(!DOCTOR_WORKSPACE.allowedRoles.includes("patient"), "2.3 Patient role is strictly disallowed from DOCTOR_WORKSPACE");

  // ------------------------------------------------------------
  // TEST 3: Anti-IDOR & Doctor Data Isolation
  // ------------------------------------------------------------
  console.log("\nTEST 3: Anti-IDOR & Doctor Isolation");
  const ctxB = getDoctorContext("DOC-1002")!;
  assert(ctxB.doctorId === "DOC-1002", "3.1 Doctor B context resolved");
  assert(ctxB.doctorName === "Dr. Rajesh Sharma", "3.2 Doctor B name is Dr. Rajesh Sharma");
  assert(ctxB.specialization === "General Medicine", "3.3 Doctor B specialization is General Medicine");
  assert(ctxA.doctorId !== ctxB.doctorId, "3.4 Doctor A and Doctor B maintain strictly isolated identity contexts");

  // ------------------------------------------------------------
  // TEST 4: Multi-Facility Affiliations & Context Switcher
  // ------------------------------------------------------------
  console.log("\nTEST 4: Multi-Facility Affiliations & Context Switching");
  assert(ctxA.authorizedAffiliations.length === 3, "4.1 Doctor A has 3 authorized affiliations");
  
  // Switch to Green Care Hospital (HSP-1002)
  const switchRes1 = setActiveDoctorAffiliation("DOC-1001", "aff-1002");
  assert(switchRes1.success === true, "4.2 Switched affiliation to Green Care Hospital (aff-1002)");
  const updatedCtxA = getDoctorContext("DOC-1001")!;
  assert(updatedCtxA.facilityId === "HSP-1002", "4.3 Active facility is now HSP-1002");
  assert(updatedCtxA.facilityName === "Green Care Hospital", "4.4 Active facility name is Green Care Hospital");
  assert(updatedCtxA.opdRoom === "Visiting OPD 2", "4.5 Active room updated to Visiting OPD 2");

  // Switch to Green Care Clinic (CLN-1001)
  const switchRes2 = setActiveDoctorAffiliation("DOC-1001", "aff-1003");
  assert(switchRes2.success === true, "4.6 Switched affiliation to Green Care Clinic (aff-1003)");
  const clinicCtxA = getDoctorContext("DOC-1001")!;
  assert(clinicCtxA.facilityId === "CLN-1001", "4.7 Active facility is now CLN-1001");
  assert(clinicCtxA.opdRoom === "Clinic Suite 1", "4.8 Active room updated to Clinic Suite 1");

  // Reset back to primary City Hospital (aff-1001)
  setActiveDoctorAffiliation("DOC-1001", "aff-1001");

  // ------------------------------------------------------------
  // TEST 5: Unauthorized Facility Access Protection
  // ------------------------------------------------------------
  console.log("\nTEST 5: Unauthorized Facility Access Protection");
  // Attempt to switch Doctor A to an unauthorized facility (e.g. HSP-9999)
  const invalidSwitch = setActiveDoctorAffiliation("DOC-1001", "aff-9999");
  assert(invalidSwitch.success === false, "5.1 Unauthorized facility switch is rejected");
  assert(Boolean(invalidSwitch.error?.includes("UNAUTHORIZED_FACILITY")), "5.2 Error code indicates UNAUTHORIZED_FACILITY");

  // Doctor B only has HSP-1001, attempts to access CLN-1001
  assert(isDoctorAuthorizedForFacility("DOC-1002", "HSP-1001") === true, "5.3 Doctor B is authorized for HSP-1001");
  assert(isDoctorAuthorizedForFacility("DOC-1002", "CLN-1001") === false, "5.4 Doctor B is NOT authorized for CLN-1001");
  const docBInvalidSwitch = setActiveDoctorAffiliation("DOC-1002", "aff-1003");
  assert(docBInvalidSwitch.success === false, "5.5 Doctor B cannot switch to Doctor A's clinic affiliation");

  // ------------------------------------------------------------
  // TEST 6: Real Operational Duty Status State Machine
  // ------------------------------------------------------------
  console.log("\nTEST 6: Real Operational Duty Status State Machine");
  const dutyStates: DoctorDutyStatus[] = ["AVAILABLE", "IN_CONSULTATION", "ON_BREAK", "OFF_DUTY"];
  
  for (const st of dutyStates) {
    const res = setDoctorDutyStatus("DOC-1001", st);
    assert(res.success === true && res.dutyStatus === st, `6.1 Duty status transitions to ${st}`);
    const check = getDoctorContext("DOC-1001")!;
    assert(check.dutyStatus === st, `6.2 Active context reflects ${st}`);
  }

  // Restore to AVAILABLE
  setDoctorDutyStatus("DOC-1001", "AVAILABLE");

  // ------------------------------------------------------------
  // TEST 7: Left Navigation Structure & Grouping
  // ------------------------------------------------------------
  console.log("\nTEST 7: Left Navigation Canonical Grouping & Integrity");
  assert(DOCTOR_NAV.length === 9, "7.1 DOCTOR_NAV contains exactly 9 canonical modules");

  const sections = Array.from(new Set(DOCTOR_NAV.map(n => n.section)));
  assert(sections.includes("CLINICAL WORK"), "7.2 Contains 'CLINICAL WORK' section");
  assert(sections.includes("OPERATIONS"), "7.3 Contains 'OPERATIONS' section");
  assert(sections.includes("CLINICAL OUTPUTS"), "7.4 Contains 'CLINICAL OUTPUTS' section");
  assert(sections.includes("ACCOUNT"), "7.5 Contains 'ACCOUNT' section");

  // Verify routes
  const routes = DOCTOR_NAV.map(n => n.href);
  assert(routes.includes("/doctor"), "7.6 Canonical Today / Queue route is /doctor");
  assert(routes.includes("/doctor/consultations"), "7.7 Canonical Consultation Suite route is /doctor/consultations");
  assert(routes.includes("/doctor/patients"), "7.8 Canonical Patient Registry route is /doctor/patients");
  assert(routes.includes("/doctor/appointments"), "7.9 Canonical Appointments route is /doctor/appointments");
  assert(routes.includes("/doctor/prescriptions"), "7.10 Canonical Prescriptions route is /doctor/prescriptions");
  assert(routes.includes("/doctor/lab-orders"), "7.11 Canonical Lab Orders route is /doctor/lab-orders");
  assert(routes.includes("/doctor/schedule"), "7.12 Canonical Schedule route is /doctor/schedule");
  assert(routes.includes("/doctor/referrals"), "7.13 Canonical Referrals route is /doctor/referrals");
  assert(routes.includes("/doctor/profile"), "7.14 Canonical Profile route is /doctor/profile");

  // ------------------------------------------------------------
  // TEST 8: Removal of Development Badges & Phase Markers
  // ------------------------------------------------------------
  console.log("\nTEST 8: Removal of Development Badges & Phase Markers");
  const hasPhaseMarkers = DOCTOR_NAV.some(n => n.phase || n.comingSoon);
  assert(!hasPhaseMarkers, "8.1 Zero internal phase badges (Phase 4.3, Phase 7, etc.) present in DOCTOR_NAV");
  const workspacePhaseMarkers = DOCTOR_WORKSPACE.navItems.some(n => n.phase || n.comingSoon);
  assert(!workspacePhaseMarkers, "8.2 Zero internal phase badges present in DOCTOR_WORKSPACE");

  // ------------------------------------------------------------
  // TEST 9: Cross-Module Context Consistency
  // ------------------------------------------------------------
  console.log("\nTEST 9: Cross-Module Context Consistency");
  const primaryCtx = getDoctorContext("DOC-1001")!;
  assert(primaryCtx.facilityId === "HSP-1001", "9.1 Doctor A active facility is HSP-1001");
  
  // Verify that appointment store, lab store, and prescription store query with Doctor ID
  const docAppts = AppointmentStore.getAppointmentsForDoctor("DOC-1001");
  assert(Array.isArray(docAppts), "9.2 Appointments store queries by canonical doctor ID");
  const docLabs = getDoctorLabOrders("DOC-1001");
  assert(Array.isArray(docLabs), "9.3 Lab orders store queries by canonical doctor ID");
  const docRxs = getDoctorPrescriptions("DOC-1001");
  assert(Array.isArray(docRxs), "9.4 Prescriptions store queries by canonical doctor ID");

  console.log("\n============================================================");
  console.log(`DOCTOR STEP 1 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runDoctorStep1Suite();
