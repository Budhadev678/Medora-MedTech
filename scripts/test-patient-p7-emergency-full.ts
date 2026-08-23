import { findIdentityById } from "../lib/data/identity-store";
import {
  createEmergencyRequest,
  getEmergencyCaseById,
  getActiveEmergencyForPatient,
  getEmergenciesForPatient,
  acknowledgeEmergency,
  markPatientArrived,
  startEmergencyTriage,
  completeEmergencyCase,
  cancelEmergencyCase,
} from "../lib/data/emergency-store";

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

async function runPatientP7Suite() {
  console.log("============================================================");
  console.log("MEDORA — P7 PROMPT 1 EMERGENCY & URGENT CARE TEST SUITE");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST GROUP 1: Emergency Initiation & Medical Snapshot
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Emergency Initiation & Medical Snapshot");
  const initRes = createEmergencyRequest({
    patientId: "PAT-1001",
    emergencyType: "CHEST_PAIN",
    description: "Acute chest pressure radiating to left arm",
    arrivingByAmbulance: true,
    targetFacilityId: "FAC-1001",
    targetFacilityName: "Apex Multispeciality Hospital Trauma Center",
  });

  assert(initRes.success && Boolean(initRes.case), "1.1 Emergency request created successfully");
  const emCase = initRes.case!;
  assert(Boolean(emCase.case_number && emCase.created_at), "1.2 Case number and timestamp generated");
  assert(emCase.arriving_by_ambulance === true, "1.3 Ambulance arrival flag accurately recorded");
  assert(
    Boolean(emCase.medical_snapshot?.blood_group && emCase.medical_snapshot?.emergency_contact),
    "1.4 Medical snapshot (blood group, emergency contact) attached for ER team"
  );

  // ------------------------------------------------------------
  // TEST GROUP 2: Duplicate Emergency Prevention (Idempotency)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Duplicate Emergency Prevention");
  const dupRes = createEmergencyRequest({
    patientId: "PAT-1001",
    emergencyType: "CHEST_PAIN",
    description: "Second click attempt",
  });
  assert(dupRes.success && dupRes.case?.id === emCase.id, "2.1 Repeated request returns active existing emergency without duplicating");

  // ------------------------------------------------------------
  // TEST GROUP 3: Hospital Pre-Alert & Acknowledgement Lifecycle
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Hospital Pre-Alert & Acknowledgement Lifecycle");
  assert(
    emCase.status === "HOSPITAL_NOTIFIED" || emCase.status === "HOSPITAL_ACKNOWLEDGED",
    "3.1 Hospital pre-alert notification transmitted"
  );

  const ackRes = acknowledgeEmergency(emCase.id, "Dr. Emergency Desk");
  assert(ackRes.success && ackRes.case?.status === "HOSPITAL_ACKNOWLEDGED", "3.2 Hospital explicitly acknowledges pre-alert");
  assert(Boolean(ackRes.case?.hospital_acknowledged_at), "3.3 Hospital acknowledgement timestamp recorded");

  // ------------------------------------------------------------
  // TEST GROUP 4: Patient Arrival & Triage Initiation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Patient Arrival & Triage Initiation");
  const arrRes = markPatientArrived(emCase.id);
  assert(arrRes.success && arrRes.case?.status === "ARRIVED", "4.1 Hospital marks patient arrival at trauma bay");
  assert(Boolean(arrRes.case?.arrived_at), "4.2 Arrival timestamp recorded");

  const triageRes = startEmergencyTriage(emCase.id, "red_critical");
  assert(triageRes.success && triageRes.case?.status === "TRIAGE_STARTED", "4.3 Hospital initiates emergency triage");
  assert(triageRes.case?.triage_level === "red_critical", "4.4 Triage priority level assigned (Red/Critical)");

  // ------------------------------------------------------------
  // TEST GROUP 5: Anti-IDOR Patient Privacy & Role Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Anti-IDOR Patient Privacy & Role Isolation");
  const patientBEmergencies = getEmergenciesForPatient("PAT-1002");
  const crossLeak = patientBEmergencies.filter(e => e.patient_id === "PAT-1001");
  assert(crossLeak.length === 0, "5.1 Patient B query yields zero Patient A emergency cases");

  // ------------------------------------------------------------
  // TEST GROUP 6: Case Completion
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Case Completion");
  const compRes = completeEmergencyCase(emCase.id);
  assert(compRes.success && compRes.case?.status === "COMPLETED", "6.1 Emergency case transitions to COMPLETED");

  const activeAfterComp = getActiveEmergencyForPatient("PAT-1001");
  assert(activeAfterComp === null, "6.2 No lingering active emergency after case completion");

  console.log("\n============================================================");
  console.log(`P7 PROMPT 1 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPatientP7Suite();
