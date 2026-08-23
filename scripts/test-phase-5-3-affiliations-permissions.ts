// ============================================================
// MEDORA â€” PHASE 5.3 COMPREHENSIVE TEST SUITE
// HEALTHCARE STAFF, DOCTOR AFFILIATIONS, ROLES, PERMISSIONS &
// OPERATIONAL ASSIGNMENT ENGINE
// ============================================================

import {
  getAllDoctorAffiliations,
  getFacilityDoctors,
  getDoctorAffiliations,
  createDoctorAffiliation,
  approveDoctorAffiliation,
  rejectDoctorAffiliation,
  endDoctorAffiliation,
  suspendDoctorAffiliation,
  reactivateDoctorAffiliation,
  getAllStaffAffiliations,
  getFacilityStaff,
  getUserStaffAffiliations,
  createStaffAffiliation,
  endStaffAffiliation,
  suspendStaffAffiliation,
  reactivateStaffAffiliation,
  getAllAffiliationInvitations,
  getFacilityInvitations,
  getPendingInvitationsForUser,
  createAffiliationInvitation,
  acceptAffiliationInvitation,
  rejectAffiliationInvitation,
  revokeAffiliationInvitation,
  getAllDepartmentHeadAssignments,
  getDepartmentHead,
  getDepartmentHeadHistory,
  assignDepartmentHead,
  isDoctorActiveAtFacility,
  isStaffActiveAtFacility,
  resetAffiliationStore,
} from "../lib/data/affiliation-store";
import { PermissionEngine } from "../lib/services/permission-engine";
import { OrganizationService } from "../lib/services/organization-service";

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  âœ“ PASS: ${testName}`);
  } else {
    failedAssertions++;
    console.error(`  âœ— FAIL: ${testName}${details ? ` - ${details}` : ""}`);
  }
}

console.log("============================================================");
console.log("MEDORA â€” PHASE 5.3 TEST SUITE: PEOPLE, AFFILIATIONS & RBAC");
console.log("============================================================\n");

resetAffiliationStore();

// ------------------------------------------------------------
// TEST GROUP 1: ONE IDENTITY, MULTIPLE FACILITY AFFILIATIONS
// ------------------------------------------------------------
console.log("TEST GROUP 1: Unified Doctor Identity Across Multiple Facilities");

const drAnanyaAffiliations = getDoctorAffiliations("DOC-1001", false);
assert(
  drAnanyaAffiliations.length >= 3,
  "Dr. Ananya (DOC-1001) maintains multiple distinct facility affiliations under ONE unified identity",
  `Found ${drAnanyaAffiliations.length} affiliations`
);

const fac1001Aff = drAnanyaAffiliations.find((a) => a.facility_id.toUpperCase() === "FAC-1001");
const fac1004Aff = drAnanyaAffiliations.find((a) => a.facility_id.toUpperCase() === "FAC-1004");
const fac2001Aff = drAnanyaAffiliations.find((a) => a.facility_id.toUpperCase() === "FAC-2001");

assert(
  !!fac1001Aff && fac1001Aff.consultation_fee === 500 && fac1001Aff.opd_room === "OPD Room 102",
  "Affiliation 1 (FAC-1001): ₹500 fee, OPD Room 102"
);
assert(
  !!fac1004Aff && fac1004Aff.consultation_fee === 600 && fac1004Aff.opd_room === "Specialist Suite 204",
  "Affiliation 2 (FAC-1004): ₹600 fee, Specialist Suite 204"
);
assert(
  !!fac2001Aff && fac2001Aff.consultation_fee === 500 && fac2001Aff.opd_room === "Consultation Room 1",
  "Affiliation 3 (FAC-2001): ₹500 fee, Consultation Room 1"
);

// ------------------------------------------------------------
// TEST GROUP 2: DOCTOR AFFILIATION LIFECYCLE & SUSPENSION
// ------------------------------------------------------------
console.log("\nTEST GROUP 2: Doctor Affiliation Lifecycle & Suspension Controls");

// Direct creation & approval
const newDocAff = createDoctorAffiliation({
  doctor_id: "DOC-1004",
  doctor_name: "Dr. Arvind Mehta",
  specialization: "Pediatrics",
  medical_reg_no: "MCI-2026-9912",
  organization_id: "11111111-1111-1111-1111-111111111101",
  facility_id: "FAC-1001",
  department_id: "DEP-1003",
  role_title: "Consultant Pediatrician",
  consultation_fee: 400,
  status: "PENDING",
  verification_status: "verified",
});
assert(newDocAff.success && newDocAff.affiliation?.status === "PENDING", "Created doctor affiliation with PENDING status");

const approveRes = approveDoctorAffiliation("FAC-1001", "DOC-1004");
assert(approveRes.success && approveRes.affiliation?.status === "ACTIVE", "Approved doctor affiliation transitions to ACTIVE");
assert(isDoctorActiveAtFacility("DOC-1004", "FAC-1001"), "Helper isDoctorActiveAtFacility confirms active status");

// Suspension
const suspendRes = suspendDoctorAffiliation("FAC-1001", "DOC-1004", "Credential verification in progress");
assert(suspendRes.success && suspendRes.affiliation?.status === "SUSPENDED", "Suspended doctor affiliation transitions to SUSPENDED");
assert(!isDoctorActiveAtFacility("DOC-1004", "FAC-1001"), "Helper isDoctorActiveAtFacility confirms blocked status during suspension");

// Reactivation
const reactivateRes = reactivateDoctorAffiliation("FAC-1001", "DOC-1004");
assert(reactivateRes.success && reactivateRes.affiliation?.status === "ACTIVE", "Reactivated doctor affiliation transitions back to ACTIVE");
assert(isDoctorActiveAtFacility("DOC-1004", "FAC-1001"), "Helper isDoctorActiveAtFacility confirms active status restored");

// End affiliation
const endRes = endDoctorAffiliation("FAC-1001", "DOC-1004", "Contract concluded");
assert(endRes.success && endRes.affiliation?.status === "ENDED" && !!endRes.affiliation?.end_date, "Ended affiliation sets status to ENDED with end_date");
assert(!isDoctorActiveAtFacility("DOC-1004", "FAC-1001"), "Ended doctor is no longer active at facility");

// ------------------------------------------------------------
// TEST GROUP 3: AFFILIATION INVITATION LIFECYCLE
// ------------------------------------------------------------
console.log("\nTEST GROUP 3: Affiliation Invitation Architecture");

const inviteRes = createAffiliationInvitation({
  facility_id: "FAC-1001",
  target_user_id: "DOC-1005",
  target_name: "Dr. Vikram Seth",
  target_email: "vikram@medora.org",
  role_type: "DOCTOR",
  role_title: "Cardiothoracic Surgeon",
  specialization: "Cardiology",
  department_id: "DEP-1001",
  consultation_fee: 900,
  invited_by_id: "USR-ADMIN-1001",
});
assert(inviteRes.success && inviteRes.invitation?.status === "PENDING", "Super admin creates affiliation invitation with PENDING status");

const pendingInvites = getPendingInvitationsForUser("DOC-1005");
assert(pendingInvites.length === 1 && pendingInvites[0].id === inviteRes.invitation?.id, "Target user discovers pending invitation");

// Prevent duplicate pending invitations
const dupInvite = createAffiliationInvitation({
  facility_id: "FAC-1001",
  target_user_id: "DOC-1005",
  role_type: "DOCTOR",
  role_title: "Cardiothoracic Surgeon",
  invited_by_id: "USR-ADMIN-1001",
});
assert(!dupInvite.success, "Duplicate pending invitation for same person at facility is rejected");

// Accept invitation
const acceptRes = acceptAffiliationInvitation(inviteRes.invitation!.id, { id: "DOC-1005", name: "Dr. Vikram Seth" });
assert(acceptRes.success && acceptRes.invitation?.status === "ACCEPTED", "Target user accepts invitation successfully");
assert(isDoctorActiveAtFacility("DOC-1005", "FAC-1001"), "Accepting invitation auto-creates active doctor affiliation at facility");

// Cannot re-accept accepted invitation
const reAccept = acceptAffiliationInvitation(inviteRes.invitation!.id, { id: "DOC-1005" });
assert(!reAccept.success, "Cannot accept already accepted invitation");

// Reject invitation flow
const rejectInviteRes = createAffiliationInvitation({
  facility_id: "FAC-1001",
  target_user_id: "DOC-1006",
  target_name: "Dr. Preeti Nair",
  role_type: "DOCTOR",
  role_title: "Consultant Physician",
  invited_by_id: "USR-ADMIN-1001",
});
const rejRes = rejectAffiliationInvitation(rejectInviteRes.invitation!.id, { id: "DOC-1006" }, "Schedule conflict");
assert(rejRes.success && rejRes.invitation?.status === "REJECTED", "Target user rejects invitation cleanly");

// Revoke invitation flow
const revokeInviteRes = createAffiliationInvitation({
  facility_id: "FAC-1001",
  target_user_id: "DOC-1007",
  target_name: "Dr. Kabir Roy",
  role_type: "DOCTOR",
  role_title: "Consultant Dermatologist",
  invited_by_id: "USR-ADMIN-1001",
});
const revRes = revokeAffiliationInvitation(revokeInviteRes.invitation!.id, { id: "USR-ADMIN-1001" }, "Position filled");
assert(revRes.success && revRes.invitation?.status === "REVOKED", "Admin revokes invitation before acceptance");

// ------------------------------------------------------------
// TEST GROUP 4: STAFF AFFILIATIONS & LIFECYCLE
// ------------------------------------------------------------
console.log("\nTEST GROUP 4: Staff Personnel Affiliations & Operational Roles");

const staffAffRes = createStaffAffiliation({
  user_id: "STAFF-1005",
  staff_name: "Kalyani Jena",
  email: "kalyani@cityhospital.org",
  organization_id: "11111111-1111-1111-1111-111111111101",
  facility_id: "FAC-1001",
  department_id: "DEP-1001",
  role_title: "Cardiology Nurse",
  staff_role: "NURSE",
  status: "ACTIVE",
});
assert(staffAffRes.success && staffAffRes.affiliation?.status === "ACTIVE", "Created staff affiliation for NURSE");
assert(isStaffActiveAtFacility("STAFF-1005", "FAC-1001"), "Helper isStaffActiveAtFacility confirms active staff status");

// Suspend staff
const suspStaff = suspendStaffAffiliation("FAC-1001", "STAFF-1005", "Leave of absence");
assert(suspStaff.success && suspStaff.affiliation?.status === "SUSPENDED", "Staff affiliation suspended");
assert(!isStaffActiveAtFacility("STAFF-1005", "FAC-1001"), "Suspended staff is not active");

// Reactivate staff
const reactStaff = reactivateStaffAffiliation("FAC-1001", "STAFF-1005");
assert(reactStaff.success && reactStaff.affiliation?.status === "ACTIVE", "Staff affiliation reactivated");

// End staff affiliation
const endStaff = endStaffAffiliation("FAC-1001", "STAFF-1005", "Transferred");
assert(endStaff.success, "Staff affiliation ended with historical record preserved");
assert(!isStaffActiveAtFacility("STAFF-1005", "FAC-1001"), "Ended staff member is no longer active");

// ------------------------------------------------------------
// TEST GROUP 5: DEPARTMENT HEAD ENGINE
// ------------------------------------------------------------
console.log("\nTEST GROUP 5: Department Head Assignment & Historical Tracking");

const initialHead = getDepartmentHead("DEP-1001");
assert(initialHead?.doctor_id === "DOC-1001", "Initial Head of Cardiology is Dr. Ananya (DOC-1001)");

// Reassign department head to Dr. Vikram (DOC-1005, who is active at FAC-1001)
const newHeadRes = assignDepartmentHead("FAC-1001", "DEP-1001", "DOC-1005", {
  id: "USR-ADMIN-1001",
  name: "Super Administrator",
});
assert(newHeadRes.success && newHeadRes.assignment?.doctor_id === "DOC-1005", "Reassigned Head of Cardiology to Dr. Vikram (DOC-1005)");

const currentHead = getDepartmentHead("DEP-1001");
assert(currentHead?.doctor_id === "DOC-1005" && currentHead?.status === "ACTIVE", "Current active Head is Dr. Vikram");

const headHistory = getDepartmentHeadHistory("DEP-1001");
assert(headHistory.length >= 2, "Department head history contains both previous and current head assignments");

const previousHeadAssignment = headHistory.find((h) => h.doctor_id === "DOC-1001");
assert(
  previousHeadAssignment?.status === "ENDED" && !!previousHeadAssignment?.end_date,
  "Previous Head (Dr. Ananya) assignment is marked ENDED with end_date (clinical encounter history untouched)"
);

// Unaffiliated doctor cannot be appointed head
const invalidHeadRes = assignDepartmentHead("FAC-1001", "DEP-1001", "DOC-NONEXISTENT", {
  id: "USR-ADMIN-1001",
  name: "Admin",
});
assert(!invalidHeadRes.success, "Unaffiliated doctor cannot be appointed department head");

// ------------------------------------------------------------
// TEST GROUP 6: PERMISSION & CONTEXT ENGINE (LEAST PRIVILEGE)
// ------------------------------------------------------------
console.log("\nTEST GROUP 6: Role-Based Access Control & Context Boundaries");

// Doctor Permissions
const docEncounterPerm = PermissionEngine.hasPermission(
  { id: "DOC-1001", role: "doctor", facilityId: "FAC-1001" },
  "ENCOUNTER_CREATE",
  { facilityId: "FAC-1001" }
);
assert(docEncounterPerm.allowed, "Doctor is permitted to create clinical consultation encounters");

const docOrgAdminPerm = PermissionEngine.hasPermission(
  { id: "DOC-1001", role: "doctor", facilityId: "FAC-1001" },
  "ORGANIZATION_UPDATE"
);
assert(!docOrgAdminPerm.allowed, "Doctor is prohibited from modifying organizational configuration");

// Receptionist Permissions
const recepTokenPerm = PermissionEngine.hasPermission(
  { id: "STAFF-1001", role: "RECEPTIONIST", facilityId: "FAC-1001" },
  "TOKEN_GENERATE",
  { facilityId: "FAC-1001" }
);
assert(recepTokenPerm.allowed, "Receptionist is permitted to generate OPD tokens and check in patients");

const recepRxPerm = PermissionEngine.hasPermission(
  { id: "STAFF-1001", role: "RECEPTIONIST", facilityId: "FAC-1001" },
  "PRESCRIPTION_CREATE"
);
assert(!recepRxPerm.allowed, "Receptionist is strictly prohibited from creating clinical prescriptions");

// Patient Permissions
const patientRxPerm = PermissionEngine.hasPermission(
  { id: "PAT-1001", role: "patient" },
  "PRESCRIPTION_CREATE"
);
assert(!patientRxPerm.allowed, "Patient is prohibited from creating clinical prescriptions");

const patientApptPerm = PermissionEngine.hasPermission(
  { id: "PAT-1001", role: "patient" },
  "APPOINTMENT_CREATE"
);
assert(patientApptPerm.allowed, "Patient is permitted to book appointments");

// Cross-organization boundary
const crossOrgPerm = PermissionEngine.hasPermission(
  { id: "ADMIN-1", role: "hospital_admin", organizationId: "11111111-1111-1111-1111-111111111101" },
  "FACILITY_UPDATE",
  { organizationId: "22222222-2222-2222-2222-222222222201" }
);
assert(!crossOrgPerm.allowed, "Hospital Admin cannot modify facilities of a foreign organization");

// Privilege escalation guard
const privEscalation = PermissionEngine.hasPermission(
  { id: "DOC-1001", role: "doctor", facilityId: "FAC-1001" },
  "STAFF_ASSIGN",
  { targetRole: "admin" }
);
assert(!privEscalation.allowed, "Non-admin actor cannot grant administrative roles");

// Facility Context Validation
const validSwitch = PermissionEngine.validateFacilityContext("DOC-1001", "FAC-1001");
assert(validSwitch.valid && validSwitch.role === "doctor", "Doctor DOC-1001 can switch context to affiliated facility FAC-1001");

const validSwitch2 = PermissionEngine.validateFacilityContext("DOC-1001", "FAC-1004");
assert(validSwitch2.valid, "Doctor DOC-1001 can switch context to secondary affiliated facility FAC-1004");

const invalidSwitch = PermissionEngine.validateFacilityContext("STAFF-1001", "FAC-2001");
assert(!invalidSwitch.valid, "Staff member cannot switch context to unaffiliated facility");

const accessibleFacs = PermissionEngine.getAccessibleFacilitiesForUser("DOC-1001");
assert(accessibleFacs.length >= 3, "Doctor discovers all 3 affiliated facilities with active privileges");

console.log("\n============================================================");
console.log(`PHASE 5.3 TEST SUMMARY: ${passedAssertions}/${totalAssertions} assertions passed (${Math.round((passedAssertions / totalAssertions) * 100)}%)`);
console.log("============================================================\n");

if (failedAssertions > 0) {
  process.exit(1);
}
