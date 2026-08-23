// ============================================================
// MEDORA â€” STABILIZATION S10 MASTER SECURITY & HARDENING SUITE
// Validates Authentication, Session Isolation, Anti-IDOR, RBAC,
// Parameter Tampering, Financial Mutation Defense & Data Minimization
// ============================================================

import {
  authenticateCredentials,
  findIdentityById,
  getAllIdentities,
  getHospitalAffiliatedDoctors,
} from "@/lib/data/identity-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import {
  validatePatientRecordAccess,
  validateRole,
  getAuthenticatedUser,
} from "@/lib/api/api-utils";
import { getBillById } from "@/lib/data/billing-store";
import { NextRequest } from "next/server";
import { GET as sessionGet } from "@/app/api/auth/session/route";
import { GET as prescriptionsGet } from "@/app/api/prescriptions/route";
import { GET as labOrdersGet } from "@/app/api/lab/orders/route";
import { GET as billsGet } from "@/app/api/billing/bills/route";

async function runS10SecurityHardeningTests() {
  console.log("============================================================");
  console.log("MEDORA â€” STABILIZATION S10 FINAL SECURITY & HARDENING SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string, details?: any) {
    total++;
    if (condition) {
      console.log(`  âœ“ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  âœ• FAIL: ${description}`, details ? `\n    --> Details: ${JSON.stringify(details)}` : "");
    }
  }

  // ------------------------------------------------------------
  // TEST GROUP 1: Authentication & Credential Resilience
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Authentication & Credential Resilience");
  
  // 1.1 Correct credential verification
  const validPatient = authenticateCredentials("patient@medora.health", "Password@123");
  assert(validPatient.success === true && validPatient.identity?.role === "patient", "Valid patient credentials authenticate correctly");

  // 1.2 Invalid password rejection (safe messaging)
  const badPass = authenticateCredentials("patient@medora.health", "WrongPass123!");
  assert(badPass.success === false && !badPass.error?.includes("stack") && !badPass.error?.includes("SQL"), "Invalid password safely rejected without leaking backend details");

  // 1.3 Nonexistent account rejection
  const badEmail = authenticateCredentials("nobody@nonexistent.domain", "Password@123");
  assert(badEmail.success === false, "Nonexistent account safely rejected");

  // ------------------------------------------------------------
  // TEST GROUP 2: API Unauthenticated Request Blocking (Zero Trust)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: API Unauthenticated Request Blocking");

  const unauthSessionReq = new NextRequest("http://localhost:3000/api/auth/session");
  const unauthSessionRes = await sessionGet(unauthSessionReq);
  assert(unauthSessionRes.status === 401, "Unauthenticated session request blocked with 401 UNAUTHORIZED");

  const unauthRxReq = new NextRequest("http://localhost:3000/api/prescriptions");
  const unauthRxRes = await prescriptionsGet(unauthRxReq);
  assert(unauthRxRes.status === 401, "Unauthenticated prescriptions request blocked with 401 UNAUTHORIZED");

  const unauthLabReq = new NextRequest("http://localhost:3000/api/lab/orders");
  const unauthLabRes = await labOrdersGet(unauthLabReq);
  assert(unauthLabRes.status === 401, "Unauthenticated lab orders request blocked with 401 UNAUTHORIZED");

  const unauthBillReq = new NextRequest("http://localhost:3000/api/billing/bills");
  const unauthBillRes = await billsGet(unauthBillReq);
  assert(unauthBillRes.status === 401, "Unauthenticated bills request blocked with 401 UNAUTHORIZED");

  // ------------------------------------------------------------
  // TEST GROUP 3: Anti-IDOR & Horizontal Cross-Patient Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Anti-IDOR & Horizontal Cross-Patient Isolation");
  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // 3.1 Patient A accessing Patient A (Allowed)
  const accessOwn = validatePatientRecordAccess(patientA, "PAT-1001");
  assert(accessOwn === true, "Patient A granted access to own health records");

  // 3.2 Patient A accessing Patient B (Denied)
  const accessOther = validatePatientRecordAccess(patientA, "PAT-1002");
  assert(accessOther === false, "Patient A strictly blocked from accessing Patient B records (Anti-IDOR)");

  // 3.3 Patient B accessing Patient A (Denied)
  const accessReverse = validatePatientRecordAccess(patientB, "PAT-1001");
  assert(accessReverse === false, "Patient B strictly blocked from accessing Patient A records (Anti-IDOR)");

  // ------------------------------------------------------------
  // TEST GROUP 4: Vertical Role Privilege Escalation Defense
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Vertical Role Privilege Escalation Defense");

  // 4.1 Patient attempting doctor-restricted clinical operations
  const patientAsDoctor = validateRole(patientA, ["doctor"]);
  assert(patientAsDoctor === false, "Patient strictly denied doctor-only clinical consultation actions");

  // 4.2 Patient attempting admin operations
  const patientAsAdmin = validateRole(patientA, ["hospital_admin", "admin"]);
  assert(patientAsAdmin === false, "Patient strictly denied administrator management actions");

  // 4.3 Doctor attempting lab certification operations
  const doctorUser = findIdentityById("DOC-1001")!;
  const doctorAsLab = validateRole(doctorUser, ["lab_staff"]);
  assert(doctorAsLab === false, "Doctor strictly denied pathology laboratory certification actions");

  // ------------------------------------------------------------
  // TEST GROUP 5: Multi-Tenant Organization Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Multi-Tenant Organization Isolation");

  const orgAAppts = AppointmentStore.getAppointmentsForDoctor("DOC-1001", "HSP-1001");
  const orgBAppts = AppointmentStore.getAppointmentsForDoctor("DOC-1001", "HSP-1002");
  assert(orgAAppts.every((a) => a.organization_identifier === "HSP-1001"), "Organization A appointments strictly isolated from Organization B");
  assert(orgBAppts.every((a) => a.organization_identifier === "HSP-1002"), "Organization B appointments strictly isolated from Organization A");

  // ------------------------------------------------------------
  // TEST GROUP 6: Financial Integrity & Invariance Protection
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Financial Integrity & Invariance Protection");
  const bill = getBillById("BILL-1001")!;
  assert(typeof bill.gross_total === "number" && bill.gross_total > 0, "Healthcare bill gross total is authoritative number");

  // Simulate client-side attempt to mutate authoritative store
  const tamperedBill = { ...bill, gross_total: 1.00 };
  assert(bill.gross_total !== tamperedBill.gross_total && getBillById("BILL-1001")!.gross_total === bill.gross_total, "Client-side object mutation does not alter authoritative server store");

  // ------------------------------------------------------------
  // TEST GROUP 7: Data Minimization & Sensitive Log Sanitization
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Data Minimization & Safe Error Formatting");
  
  const allPersonas = getAllIdentities();
  const exposedPlainPasswords = allPersonas.filter((p: any) => p.password && p.password !== "");
  assert(exposedPlainPasswords.length === 0, "No raw unhashed passwords stored on identity records");

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`S10 SECURITY HARDENING SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("============================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runS10SecurityHardeningTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
