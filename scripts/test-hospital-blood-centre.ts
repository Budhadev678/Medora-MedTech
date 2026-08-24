import { findIdentityById } from "../lib/data/identity-store";
import {
  getAllBloodUnits,
  getAllBloodRequests,
  getBloodInventorySummary,
  createBloodRequest,
  reserveBloodUnit,
  issueBloodUnits,
  quarantineBloodUnit,
  discardBloodUnit,
} from "../lib/data/blood-centre-store";
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

async function runHospitalBloodCentreSuite() {
  console.log("============================================================");
  console.log("MEDORA — HOSPITAL ARCHITECTURE: BLOOD CENTRE INTEGRATION");
  console.log("============================================================\n");

  const doctor = findIdentityById("DOC-1001")!;
  const bloodStaff = findIdentityById("STAFF-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Hospital-Controlled Blood Centre & Inventory Integrity
  // ------------------------------------------------------------
  console.log("TEST 1: Hospital Blood Centre & Inventory Inventory Integrity");
  const units = getAllBloodUnits("FAC-1001");
  assert(units.length > 0, "1.1 Blood units retrieved for hospital FAC-1001");

  const summary = getBloodInventorySummary("FAC-1001");
  assert(summary.totalAvailable > 0, "1.2 Authoritative available blood units calculated");
  assert(typeof summary.byGroup["O+"].available === "number", "1.3 Blood group O+ inventory tracked");
  assert(typeof summary.byGroup["A+"].available === "number", "1.4 Blood group A+ inventory tracked");

  // ------------------------------------------------------------
  // TEST 2: Multi-Facility Scoping & Cross-Hospital Isolation
  // ------------------------------------------------------------
  console.log("\nTEST 2: Cross-Hospital Blood Inventory Isolation");
  const fac1004Units = getAllBloodUnits("FAC-1004");
  assert(fac1004Units.every((u) => u.hospital_id === "FAC-1004"), "2.1 FAC-1004 units strictly isolated from FAC-1001");

  // ------------------------------------------------------------
  // TEST 3: Clinical Blood Request Creation
  // ------------------------------------------------------------
  console.log("\nTEST 3: Clinical Blood Request Creation");
  const reqRes = createBloodRequest({
    hospitalId: "FAC-1001",
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    doctorId: "DOC-1001",
    doctorName: "Dr. Ananya Sharma",
    admissionId: "ADM-1001",
    bloodGroup: "O+",
    componentType: "PACKED_RBC",
    unitsRequested: 1,
    priority: "EMERGENCY",
    clinicalIndication: "Acute blood loss during trauma resuscitation",
    actorId: doctor.identifier || "DOC-1001",
    actorName: doctor.fullName,
    actorRole: "doctor",
  });

  assert(reqRes.success === true, "3.1 Clinical emergency blood request created");
  const req = reqRes.request!;
  assert(req.priority === "EMERGENCY", "3.2 Request priority flagged as EMERGENCY");
  assert(req.status === "REQUESTED", "3.3 Initial status is REQUESTED");

  // ------------------------------------------------------------
  // TEST 4: Blood Unit Reservation & Double-Reservation Protection
  // ------------------------------------------------------------
  console.log("\nTEST 4: Blood Unit Reservation & Concurrency Lock");
  const eligibleUnit = units.find((u) => u.blood_group === "O+" && u.status === "AVAILABLE")!;
  assert(Boolean(eligibleUnit), "4.1 Found available O+ blood unit");

  const resRes = reserveBloodUnit({
    requestId: req.id,
    unitId: eligibleUnit.id,
    actorId: bloodStaff.identifier || "STAFF-1001",
    actorName: bloodStaff.fullName,
    actorRole: "staff",
  });

  assert(resRes.success === true, "4.2 Unit successfully reserved for patient request");
  assert(resRes.unit?.status === "RESERVED", "4.3 Unit status transitioned to RESERVED");

  // Attempt double reservation of same unit by another request
  const doubleRes = reserveBloodUnit({
    requestId: "BREQ-9999",
    unitId: eligibleUnit.id,
    actorId: bloodStaff.identifier || "STAFF-1001",
    actorName: bloodStaff.fullName,
    actorRole: "staff",
  });
  assert(doubleRes.success === false, "4.4 Double reservation of occupied unit prevented");

  // ------------------------------------------------------------
  // TEST 5: Unit Issuance for Transfusion
  // ------------------------------------------------------------
  console.log("\nTEST 5: Blood Unit Issuance & Clinical Release");
  const issueRes = issueBloodUnits({
    requestId: req.id,
    actorId: bloodStaff.identifier || "STAFF-1001",
    actorName: bloodStaff.fullName,
    actorRole: "staff",
  });

  assert(issueRes.success === true, "5.1 Blood units issued for transfusion");
  assert(issueRes.request?.status === "ISSUED", "5.2 Request transitioned to ISSUED");

  // ------------------------------------------------------------
  // TEST 6: Quarantine & Biohazard Discard Workflows
  // ------------------------------------------------------------
  console.log("\nTEST 6: Quarantine & Discard Quality Workflows");
  const testUnit = units.find((u) => u.status === "AVAILABLE" && u.id !== eligibleUnit.id)!;
  if (testUnit) {
    const qRes = quarantineBloodUnit({
      unitId: testUnit.id,
      reason: "Quality serology re-testing hold",
      actorId: "STAFF-1001",
      actorName: "Blood Bank Tech",
      actorRole: "staff",
    });
    assert(qRes.success === true, "6.1 Blood unit placed on quarantine hold");
    assert(qRes.unit?.status === "QUARANTINED", "6.2 Status updated to QUARANTINED");

    const dRes = discardBloodUnit({
      unitId: testUnit.id,
      reason: "Biohazard disposal protocol",
      actorId: "STAFF-1001",
      actorName: "Blood Bank Tech",
      actorRole: "staff",
    });
    assert(dRes.success === true, "6.3 Blood unit discarded with mandatory reason");
    assert(dRes.unit?.status === "DISCARDED", "6.4 Status updated to DISCARDED");
  }

  // ------------------------------------------------------------
  // TEST 7: Audit Trail Verification
  // ------------------------------------------------------------
  console.log("\nTEST 7: Blood Centre Audit Trail Verification");
  const auditEvents = AuditLedger.getEvents({ resourceId: req.id });
  assert(auditEvents.length > 0, "7.1 Audit events captured in AuditLedger");

  console.log("\n============================================================");
  console.log(`BLOOD CENTRE SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runHospitalBloodCentreSuite();
