import { findIdentityById } from "../lib/data/identity-store";
import { 
  getAllAdmissions, 
  getAllBeds, 
  requestAdmission, 
  acceptAdmission, 
  confirmAdmission, 
  transferBed, 
  initiateDischarge, 
  completeDischarge 
} from "../lib/data/admission-store";
import { AuditLedger } from "../lib/data/audit-store";

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

async function runHospitalStep4Suite() {
  console.log("============================================================");
  console.log("MEDORA — HOSPITAL STEP 4: ADMISSION, BEDS & DISCHARGE");
  console.log("============================================================\n");

  const hospitalStaff = findIdentityById("DOC-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Inpatient Admission Request
  // ------------------------------------------------------------
  console.log("TEST 1: Doctor Admission Request Creation");
  const reqRes = requestAdmission({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    encounterId: "ENC-1001",
    doctorId: "DOC-1001",
    doctorName: "Dr. Ananya Sharma",
    departmentName: "Cardiology Inpatient Ward",
    facilityId: "FAC-1001",
    facilityName: "City Hospital",
    admissionType: "PLANNED",
    reason: "Cardiac telemetry monitoring and post-CABG observation",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(reqRes.success === true, "1.1 Inpatient admission requested successfully");
  const admission = reqRes.admission!;
  assert(admission.status === "REQUESTED", "1.2 Initial status is REQUESTED");
  assert(admission.patient_id === "PAT-1001", "1.3 Linked to Patient PAT-1001");

  // ------------------------------------------------------------
  // TEST 2: Hospital Administrative Acceptance
  // ------------------------------------------------------------
  console.log("\nTEST 2: Hospital Administrative Acceptance");
  const acceptRes = acceptAdmission(admission.id, "STAFF-1001", "Admission Desk", "staff");
  assert(acceptRes.success === true, "2.1 Admission request accepted by hospital desk");
  assert(acceptRes.admission?.status === "ACCEPTED", "2.2 Status transitioned to ACCEPTED");

  // ------------------------------------------------------------
  // TEST 3: Bed Assignment & Inpatient Ingress
  // ------------------------------------------------------------
  console.log("\nTEST 3: Bed Allocation & Inpatient Confirmation");
  const availableBed = getAllBeds("FAC-1001").find(b => b.status === "AVAILABLE")!;
  assert(Boolean(availableBed), "3.1 Found available bed for allocation");

  const confirmRes = confirmAdmission({
    admissionId: admission.id,
    bedId: availableBed.id,
    actorId: "STAFF-1001",
    actorName: "Admission Desk",
    actorRole: "staff",
  });

  assert(confirmRes.success === true, "3.2 Bed allocated and admission confirmed");
  assert(confirmRes.admission?.status === "INPATIENT", "3.3 Status transitioned to INPATIENT");
  assert(confirmRes.admission?.bed_id === availableBed.id, "3.4 Bed ID recorded on admission");

  // Prevent double assignment of same occupied bed
  const doubleBedAssign = confirmAdmission({
    admissionId: "ADM-9999",
    bedId: availableBed.id,
    actorId: "STAFF-1001",
    actorName: "Admission Desk",
    actorRole: "staff",
  });
  assert(doubleBedAssign.success === false, "3.5 Occupied bed cannot be double-assigned");

  // ------------------------------------------------------------
  // TEST 4: Inpatient Bed Transfer Workflow
  // ------------------------------------------------------------
  console.log("\nTEST 4: Inpatient Bed Transfer & Movement History");
  const destBed = getAllBeds("FAC-1001").find(b => b.status === "AVAILABLE" && b.id !== availableBed.id)!;
  assert(Boolean(destBed), "4.1 Found destination bed for transfer");

  const transferRes = transferBed({
    admissionId: admission.id,
    newBedId: destBed.id,
    reason: "Stepped down from ICU to step-down ward",
    actorId: "STAFF-1001",
    actorName: "Admission Desk",
    actorRole: "staff",
  });

  assert(transferRes.success === true, "4.2 Patient bed transfer executed");
  assert(transferRes.admission?.bed_id === destBed.id, "4.3 Current bed updated to destination bed");
  assert(transferRes.admission?.movements.length === 1, "4.4 Transfer movement history preserved");

  // ------------------------------------------------------------
  // TEST 5: Discharge Clearance & Bed Release
  // ------------------------------------------------------------
  console.log("\nTEST 5: Discharge Clearance & Bed Release");
  const initDischargeRes = initiateDischarge(admission.id, "DOC-1001", "Dr. Ananya Sharma", "doctor");
  assert(initDischargeRes.success === true, "5.1 Physician initiated discharge clearance");
  assert(initDischargeRes.admission?.status === "DISCHARGE_PENDING", "5.2 Status transitioned to DISCHARGE_PENDING");

  const completeDischargeRes = completeDischarge({
    admissionId: admission.id,
    dischargeSummary: "Patient stable. Normal sinus rhythm. Resuming home medications.",
    actorId: "STAFF-1001",
    actorName: "Discharge Desk",
    actorRole: "staff",
  });

  assert(completeDischargeRes.success === true, "5.3 Inpatient discharge finalized");
  assert(completeDischargeRes.admission?.status === "DISCHARGED", "5.4 Status transitioned to DISCHARGED");

  // Ensure bed is freed
  const releasedBed = getAllBeds("FAC-1001").find(b => b.id === destBed.id)!;
  assert(releasedBed.status === "AVAILABLE", "5.5 Occupied bed automatically released to AVAILABLE");

  // ------------------------------------------------------------
  // TEST 6: Audit Trail Recording
  // ------------------------------------------------------------
  console.log("\nTEST 6: Admission Lifecycle Audit Trail");
  const auditEvents = AuditLedger.getEvents({ resourceId: admission.id });
  assert(auditEvents.length > 0, "6.1 Audit ledger recorded admission lifecycle events");

  console.log("\n============================================================");
  console.log(`HOSPITAL STEP 4 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runHospitalStep4Suite();