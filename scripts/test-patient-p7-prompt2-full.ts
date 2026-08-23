import { findIdentityById } from "../lib/data/identity-store";
import {
  createEmergencyRequest,
  getEmergencyCaseById,
  getActiveEmergencyForPatient,
  getEmergenciesForPatient,
  getEmergenciesForFacility,
  acknowledgeEmergency,
  markPatientArrived,
  startEmergencyTriage,
  completeEmergencyCase,
  cancelEmergencyCase,
  PatientEmergencyCase,
} from "../lib/data/emergency-store";
import { getPatientEncounters } from "../lib/data/encounter-store";
import { getBillsByPatient } from "../lib/data/billing-store";
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

async function runPrompt2EmergencySuite() {
  console.log("============================================================");
  console.log("MEDORA — P7 PROMPT 2 EMERGENCY INTEGRATION & STATE MATRIX");
  console.log("============================================================\n");

  // Clear any existing active emergency for clean lifecycle test
  const existingActive = getActiveEmergencyForPatient("PAT-1001");
  if (existingActive) {
    completeEmergencyCase(existingActive.id);
  }

  // ------------------------------------------------------------
  // TEST 1: Full Emergency Lifecycle & State Machine Transitions
  // ------------------------------------------------------------
  console.log("TEST 1: Full Emergency Lifecycle & State Machine Transitions");
  
  // Step 1: Patient initiates fresh emergency with ambulance
  const initRes = createEmergencyRequest({
    patientId: "PAT-1001",
    emergencyType: "UNCONSCIOUSNESS",
    description: "Acute collapse and unresponsive",
    arrivingByAmbulance: true,
    targetFacilityId: "FAC-1001",
    targetFacilityName: "Apex Multispeciality Hospital Trauma Center",
  });
  assert(initRes.success && Boolean(initRes.case), "1.1 Emergency case created");
  const emCase = initRes.case!;
  assert(emCase.status === "HOSPITAL_NOTIFIED", "1.2 Initial state is HOSPITAL_NOTIFIED");
  assert(emCase.arriving_by_ambulance === true && emCase.ambulance_status === "EN_ROUTE", "1.3 Ambulance status is EN_ROUTE");
  assert(Boolean(emCase.hospital_notified_at), "1.4 Hospital notified timestamp present");

  // Step 2: Hospital acknowledges pre-alert
  const ackRes = acknowledgeEmergency(emCase.id, "Trauma Team In-Charge");
  assert(ackRes.success && ackRes.case?.status === "HOSPITAL_ACKNOWLEDGED", "1.5 State transitions to HOSPITAL_ACKNOWLEDGED");
  assert(Boolean(ackRes.case?.hospital_acknowledged_at), "1.6 Hospital acknowledgement timestamp present");

  // Step 3: Patient arrives at ER bay
  const arrRes = markPatientArrived(emCase.id);
  assert(arrRes.success && arrRes.case?.status === "ARRIVED", "1.7 State transitions to ARRIVED");
  assert(arrRes.case?.ambulance_status === "ARRIVED", "1.8 Ambulance status updated to ARRIVED");
  assert(Boolean(arrRes.case?.arrived_at), "1.9 Arrival timestamp present");

  // Step 4: Hospital starts trauma triage
  const triageRes = startEmergencyTriage(emCase.id, "red_critical");
  assert(triageRes.success && triageRes.case?.status === "TRIAGE_STARTED", "1.10 State transitions to TRIAGE_STARTED");
  assert(triageRes.case?.triage_level === "red_critical", "1.11 Triage level assigned as red_critical");
  assert(Boolean(triageRes.case?.triage_started_at), "1.12 Triage start timestamp present");

  // Step 5: Emergency completed
  const compRes = completeEmergencyCase(emCase.id);
  assert(compRes.success && compRes.case?.status === "COMPLETED", "1.13 State transitions to COMPLETED");
  assert(Boolean(compRes.case?.completed_at), "1.14 Completion timestamp present");

  // ------------------------------------------------------------
  // TEST 2: Idempotency & Duplicate Request Protection
  // ------------------------------------------------------------
  console.log("\nTEST 2: Idempotency & Duplicate Request Protection");
  // Start a fresh active emergency for test
  const activeReq1 = createEmergencyRequest({
    patientId: "PAT-1001",
    emergencyType: "MAJOR_INJURY",
    description: "Fracture trauma",
  });
  const activeReq2 = createEmergencyRequest({
    patientId: "PAT-1001",
    emergencyType: "MAJOR_INJURY",
    description: "Rapid repeat click",
  });
  assert(activeReq1.success && activeReq2.success, "2.1 Both rapid requests respond with success");
  assert(activeReq1.case?.id === activeReq2.case?.id, "2.2 Second request returns identical active case ID without duplication");

  // ------------------------------------------------------------
  // TEST 3: Hospital Scoping & Access Control
  // ------------------------------------------------------------
  console.log("\nTEST 3: Hospital Scoping & Facility Access Control");
  const facEmergencies = getEmergenciesForFacility("FAC-1001");
  assert(facEmergencies.length > 0, "3.1 Facility FAC-1001 retrieves assigned emergency pre-alerts");
  assert(facEmergencies.every(e => e.target_facility_id === "FAC-1001"), "3.2 All retrieved pre-alerts strictly belong to FAC-1001");

  const otherFacEmergencies = getEmergenciesForFacility("FAC-9999");
  assert(otherFacEmergencies.length === 0, "3.3 Unrelated facility receives zero pre-alerts for FAC-1001");

  // ------------------------------------------------------------
  // TEST 4: Anti-IDOR Patient Privacy & Role Isolation
  // ------------------------------------------------------------
  console.log("\nTEST 4: Anti-IDOR Complete Patient Data Isolation");
  const patBEmergencies = getEmergenciesForPatient("PAT-1002");
  assert(patBEmergencies.filter(e => e.patient_id === "PAT-1001").length === 0, "4.1 Patient B query yields zero Patient A emergency cases");

  // ------------------------------------------------------------
  // TEST 5: Cross-Module Cohesion & Non-Duplication
  // ------------------------------------------------------------
  console.log("\nTEST 5: Cross-Module Separation & Cohesion");
  const appts = AppointmentStore.getAppointmentsForPatient("PAT-1001");
  const dummyAppts = appts.filter(a => a.id.includes("EMR"));
  assert(dummyAppts.length === 0, "5.1 Emergency initiation did not pollute routine appointment schedule");

  const bills = getBillsByPatient("PAT-1001");
  assert(bills.every(b => Boolean(b.id && b.gross_total >= 0)), "5.2 Canonical billing store integrity maintained");

  // Clean up active emergency
  if (activeReq1.case) {
    cancelEmergencyCase(activeReq1.case.id, "Test suite cleanup");
  }

  console.log("\n============================================================");
  console.log(`P7 PROMPT 2 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPrompt2EmergencySuite();
