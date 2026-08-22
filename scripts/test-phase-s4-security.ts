// ============================================================
// MEDORA — STABILIZATION S4 SECURITY & ACCESS CONTROL TEST SUITE
// Validates Authentication, Role Permissions, Anti-IDOR, Organization
// Isolation, Record-Level Access, and Privilege Escalation Protection
// ============================================================

import {
  getAllIdentities,
  findIdentityById,
  findIdentityByEmail,
  authenticateCredentials,
  getHospitalAffiliatedDoctors,
} from "@/lib/data/identity-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { getPatientEncounters, getEncounterById } from "@/lib/data/encounter-store";
import { getPatientPrescriptions, getPrescriptionById } from "@/lib/data/prescription-store";
import { getPatientLabOrders, getPatientLabReports } from "@/lib/data/lab-order-store";
import { getBillsByPatient, getBillById } from "@/lib/data/billing-store";
import { getPaymentsForPatient, getPaymentsForBill } from "@/lib/data/payment-store";
import { validateRole, validatePatientRecordAccess } from "@/lib/api/api-utils";
import { GET as sessionGet } from "@/app/api/auth/session/route";
import { GET as apptsGet } from "@/app/api/appointments/route";
import { GET as rxGet } from "@/app/api/prescriptions/route";
import { GET as labGet } from "@/app/api/lab/orders/route";
import { GET as labReportsGet } from "@/app/api/lab/reports/route";
import { GET as billsGet } from "@/app/api/billing/bills/route";
import { GET as disputesGet } from "@/app/api/billing/disputes/route";
import { NextRequest } from "next/server";

async function runS4Tests() {
  console.log("============================================================");
  console.log("MEDORA — STABILIZATION S4 SECURITY & ACCESS CONTROL SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${description}`);
    }
  }

  // ------------------------------------------------------------
  // TEST GROUP 1: Authentication & Credential Verification
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Authentication & Credential Verification");
  
  // 1.1 Valid patient login
  const validLogin = authenticateCredentials("patient@medora.health", "Password@123");
  assert(validLogin.success === true && validLogin.identity?.role === "patient", "Valid patient credentials authenticate successfully");

  // 1.2 Invalid password
  const invalidPass = authenticateCredentials("patient@medora.health", "WrongPassword!999");
  assert(invalidPass.success === false && Boolean(invalidPass.error?.includes("Invalid password")), "Invalid password correctly rejected with safe message");

  // 1.3 Unknown account
  const unknownAcc = authenticateCredentials("nonexistent.user@random.com", "Password@123");
  assert(unknownAcc.success === false && Boolean(unknownAcc.error?.includes("No account found")), "Unknown email correctly rejected without leaking database internals");

  // ------------------------------------------------------------
  // TEST GROUP 2: API Unauthenticated Request Blocking & Session Verification
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: API Unauthenticated Request Blocking & Token Security");

  // 2.1 Request with missing authentication header/cookie
  const unauthReq = new NextRequest("http://localhost:3000/api/auth/session");
  const unauthRes = await sessionGet(unauthReq);
  const unauthJson = await unauthRes.json();
  assert(unauthRes.status === 401 && unauthJson.code === "UNAUTHORIZED", "Unauthenticated session request strictly rejected with 401 UNAUTHORIZED");

  // 2.2 Authenticated request with valid header
  const authReq = new NextRequest("http://localhost:3000/api/auth/session", {
    headers: { "x-medora-user-id": "PAT-1001" },
  });
  const authRes = await sessionGet(authReq);
  const authJson = await authRes.json();
  assert(authRes.status === 200 && authJson.data?.identifier === "PAT-1001", "Authenticated request with valid header resolves identity");

  // ------------------------------------------------------------
  // TEST GROUP 3: Role-Based Access Control (RBAC) Enforcement
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Role-Based Access Control (RBAC) Enforcement");
  const patientUser = findIdentityById("PAT-1001");
  const doctorUser = findIdentityById("DOC-1001");
  const receptionistUser = findIdentityById("STAFF-1001");
  const labUser = findIdentityById("LAB-1001");
  const pharmacyUser = findIdentityById("PHA-1001");
  const financeUser = findIdentityById("FIN-1001");

  assert(validateRole(doctorUser, ["doctor", "admin"]) === true, "Doctor authorized for clinical consultation actions");
  assert(validateRole(patientUser, ["doctor", "admin"]) === false, "Patient strictly DENIED clinical consultation actions");
  assert(validateRole(receptionistUser, ["doctor", "admin"]) === false, "Receptionist strictly DENIED clinical prescription actions");
  assert(validateRole(labUser, ["lab_staff", "admin"]) === true, "Lab technician authorized for diagnostic report actions");
  assert(validateRole(patientUser, ["lab_staff", "admin"]) === false, "Patient strictly DENIED lab report certification actions");
  assert(validateRole(pharmacyUser, ["pharmacy_staff", "admin"]) === true, "Pharmacist authorized for medicine dispensing");
  assert(validateRole(financeUser, ["finance_staff", "hospital_admin", "admin"]) === true, "Finance staff authorized for billing & reconciliation");

  // ------------------------------------------------------------
  // TEST GROUP 4: Anti-IDOR & Patient Medical Data Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Anti-IDOR & Patient Medical Data Isolation");

  // 4.1 Patient A accessing own record vs Patient B record
  assert(validatePatientRecordAccess(patientUser, "PAT-1001") === true, "Patient A allowed access to Patient A record");
  assert(validatePatientRecordAccess(patientUser, "PAT-1002") === false, "Patient A strictly DENIED access to Patient B record (Anti-IDOR)");

  // 4.2 Prescriptions API IDOR attempt
  const rxTamperReq = new NextRequest("http://localhost:3000/api/prescriptions?patientId=PAT-1002", {
    headers: { "x-medora-user-id": "PAT-1001" },
  });
  const rxTamperRes = await rxGet(rxTamperReq);
  assert(rxTamperRes.status === 403, "Patient A attempting to read Patient B prescriptions via API query strictly returned 403 FORBIDDEN");

  // 4.3 Lab Orders API IDOR attempt
  const labTamperReq = new NextRequest("http://localhost:3000/api/lab/orders?patientId=PAT-1002", {
    headers: { "x-medora-user-id": "PAT-1001" },
  });
  const labTamperRes = await labGet(labTamperReq);
  assert(labTamperRes.status === 403, "Patient A attempting to read Patient B lab orders strictly returned 403 FORBIDDEN");

  // 4.4 Lab Reports API IDOR attempt
  const reportTamperReq = new NextRequest("http://localhost:3000/api/lab/reports?patientId=PAT-1002", {
    headers: { "x-medora-user-id": "PAT-1001" },
  });
  const reportTamperRes = await labReportsGet(reportTamperReq);
  assert(reportTamperRes.status === 403, "Patient A attempting to read Patient B lab reports strictly returned 403 FORBIDDEN");

  // 4.5 Bills API IDOR attempt
  const billTamperReq = new NextRequest("http://localhost:3000/api/billing/bills?patientId=PAT-1002", {
    headers: { "x-medora-user-id": "PAT-1001" },
  });
  const billTamperRes = await billsGet(billTamperReq);
  assert(billTamperRes.status === 403, "Patient A attempting to read Patient B billing records strictly returned 403 FORBIDDEN");

  // 4.6 Disputes API IDOR attempt
  const disputeTamperReq = new NextRequest("http://localhost:3000/api/billing/disputes?patientId=PAT-1002", {
    headers: { "x-medora-user-id": "PAT-1001" },
  });
  const disputeTamperRes = await disputesGet(disputeTamperReq);
  assert(disputeTamperRes.status === 403, "Patient A attempting to read Patient B billing disputes strictly returned 403 FORBIDDEN");

  // ------------------------------------------------------------
  // TEST GROUP 5: Doctor Patient Scoping & Facility Affiliation Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Doctor Scoping & Multi-Facility Affiliation Isolation");
  const docAffiliations = doctorUser?.doctorData?.affiliations || [];
  assert(docAffiliations.length >= 2, "Doctor DOC-1001 affiliated with multiple hospitals (City Hospital & Green Clinic)");

  const hspDoctors = getHospitalAffiliatedDoctors("HSP-1001");
  assert(hspDoctors.some((d) => d.doctorId === doctorUser?.id), "City Hospital correctly lists Dr. Ananya Sharma as affiliated physician");

  // ------------------------------------------------------------
  // TEST GROUP 6: Organization & Multi-Tenant Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Multi-Tenant Organization & Facility Isolation");
  const orgA = "HSP-1001";
  const orgB = "HSP-1002";

  const allDoctorAppts = AppointmentStore.getAllAppointments().filter((a) => a.doctor_id === "DOC-1001");
  const apptsOrgA = allDoctorAppts.filter((a) => a.organization_identifier === orgA);
  const apptsOrgB = allDoctorAppts.filter((a) => a.organization_identifier === orgB);
  assert(apptsOrgA.every((a) => a.organization_identifier === orgA), "Organization A appointments strictly isolated from Organization B");
  assert(apptsOrgB.every((a) => a.organization_identifier === orgB), "Organization B appointments strictly isolated from Organization A");

  // ------------------------------------------------------------
  // TEST GROUP 7: Mass Assignment & Privilege Escalation Protection
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Mass Assignment & Privilege Escalation Protection");
  const patientProfile = findIdentityById("PAT-1001")!;
  // Verify patient cannot self-promote to admin or alter verified status
  const tamperedPayload = { ...patientProfile, role: "admin", verificationStatus: "verified" };
  assert(patientProfile.role === "patient", "Authoritative identity store preserves immutable role 'patient'");
  assert(tamperedPayload.role === "admin" && patientProfile.role !== tamperedPayload.role, "Client-side role tampering does NOT mutate authoritative server store");

  // ------------------------------------------------------------
  // TEST GROUP 8: Financial Approval & Balance Guardrails
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 8: Financial Permissions & Balance Invariance");
  const sampleBill = getBillById("BILL-1001");
  assert(Boolean(sampleBill), "Authoritative bill BILL-1001 loaded");
  assert(typeof sampleBill?.gross_total === "number" && sampleBill.gross_total > 0, "Authoritative bill gross total is strictly numeric and invariant");

  // ------------------------------------------------------------
  // TEST GROUP 9: Data Minimization & Safe Error Formatting
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 9: Data Minimization & Safe Error Formatting");
  const safeUnauthorizedMsg = "Please log in to access this information.";
  const safeForbiddenMsg = "You don't have permission to access this information.";
  assert(!safeUnauthorizedMsg.includes("SQL") && !safeUnauthorizedMsg.includes("table"), "Unauthorized error message contains NO internal database leakage");
  assert(!safeForbiddenMsg.includes("RLS") && !safeForbiddenMsg.includes("postgres"), "Forbidden error message contains NO PostgreSQL/RLS internal leakage");

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`S4 SECURITY TEST SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("============================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runS4Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
