import { findIdentityById } from "../lib/data/identity-store";
import { 
  getAllEmergencies, 
  getEmergenciesForFacility, 
  createEmergencyRequest, 
  acknowledgeEmergency, 
  markEmergencyArrived, 
  startEmergencyTriage, 
  completeEmergencyCase, 
  cancelEmergency 
} from "../lib/data/emergency-store";
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

async function runHospitalStep2Suite() {
  console.log("============================================================");
  console.log("MEDORA — HOSPITAL STEP 2: EMERGENCY CONTROL & RAPID RESPONSE");
  console.log("============================================================\n");

  const hospitalStaff = findIdentityById("DOC-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Emergency Ingress & Scoping
  // ------------------------------------------------------------
  console.log("TEST 1: Emergency Ingress & Facility Scoping");
  const facEmergencies = getEmergenciesForFacility("FAC-1001");
  assert(facEmergencies.length > 0, "1.1 Facility FAC-1001 active emergencies retrieved");
  assert(facEmergencies.every(e => e.target_facility_id === "FAC-1001"), "1.2 All emergencies belong strictly to target facility");

  const primaryEmg = facEmergencies[0];
  assert(Boolean(primaryEmg.emergency_type), "1.3 Emergency classification type present");
  assert(Boolean(primaryEmg.patient_name), "1.4 Patient demographic context captured");
  assert(primaryEmg.arriving_by_ambulance === true, "1.5 Ambulance ingress accurately captured");
  assert(typeof primaryEmg.eta_minutes === "number", "1.6 ETA minutes calculated from authoritative tracking");

  // ------------------------------------------------------------
  // TEST 2: Rapid Response Lifecycle & Acknowledgement
  // ------------------------------------------------------------
  console.log("\nTEST 2: Rapid Response Lifecycle & Hospital Acknowledgement");
  const ackRes = acknowledgeEmergency(primaryEmg.id, "Dr. Ananya Sharma");
  assert(ackRes.success === true, "2.1 Hospital emergency desk acknowledged pre-alert");
  assert(ackRes.case?.status === "HOSPITAL_ACKNOWLEDGED" || ackRes.case?.status === "ACKNOWLEDGED", "2.2 Status transitioned to ACKNOWLEDGED");
  assert(Boolean(ackRes.case?.hospital_acknowledged_at), "2.3 Acknowledgement timestamp recorded");

  // ------------------------------------------------------------
  // TEST 3: Physical Arrival & Triage Workflow
  // ------------------------------------------------------------
  console.log("\nTEST 3: Physical Arrival & ER Triage Workflow");
  const arriveRes = markEmergencyArrived(primaryEmg.id);
  assert(arriveRes.success === true, "3.1 Patient physical arrival at trauma bay recorded");
  assert(arriveRes.case?.status === "ARRIVED", "3.2 Status transitioned to ARRIVED");
  assert(Boolean(arriveRes.case?.arrived_at), "3.3 Authoritative arrival timestamp recorded");

  const triageRes = startEmergencyTriage(primaryEmg.id, "red_critical");
  assert(triageRes.success === true, "3.4 ER clinical triage initiated");
  assert(triageRes.case?.status === "TRIAGE_STARTED", "3.5 Status transitioned to TRIAGE_STARTED");
  assert(triageRes.case?.triage_level === "red_critical", "3.6 Triage priority level assigned as red_critical");

  // ------------------------------------------------------------
  // TEST 4: Emergency Resolution & Outcome Handoff
  // ------------------------------------------------------------
  console.log("\nTEST 4: Emergency Resolution & Outcome Handoff");
  const completeRes = completeEmergencyCase(primaryEmg.id);
  assert(completeRes.success === true, "4.1 Emergency care closed & handed off to inpatient care");
  assert(completeRes.case?.status === "COMPLETED", "4.2 Status transitioned to COMPLETED");

  // ------------------------------------------------------------
  // TEST 5: Cancellation Workflow
  // ------------------------------------------------------------
  console.log("\nTEST 5: Emergency Cancellation Workflow");
  const testCancelReq = createEmergencyRequest({
    patientId: "PAT-TEST-CANCEL",
    emergencyType: "OTHER",
    description: "False alarm call test",
    targetFacilityId: "FAC-1001",
  });
  assert(testCancelReq.success === true, "5.1 Emergency pre-alert created for cancellation test");
  
  const cancelRes = cancelEmergency(testCancelReq.case!.id, "Caller resolved symptom at home");
  assert(cancelRes.success === true, "5.2 Emergency pre-alert cancelled");
  assert(cancelRes.case?.status === "CANCELLED", "5.3 Status transitioned to CANCELLED");

  // ------------------------------------------------------------
  // TEST 6: Audit Trail Verification
  // ------------------------------------------------------------
  console.log("\nTEST 6: Audit Trail Verification");
  const auditEvents = AuditLedger.getEvents();
  assert(auditEvents.length > 0, "6.1 Audit ledger captures platform activity");

  console.log("\n============================================================");
  console.log(`HOSPITAL STEP 2 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runHospitalStep2Suite();