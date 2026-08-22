// ============================================================
// MEDORA — PHASE 8.1 TEST SUITE: LAB ORGANIZATION & ORDER INTAKE
// ============================================================

import { LabIntakeService } from "../lib/services/lab-intake-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { LabOrderService } from "../lib/services/lab-order-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import {
  getLabOrganizationById,
  getLabFacilityById,
  getLabStaffMemberships,
  inviteLabStaff,
} from "../lib/data/lab-organization-store";
import {
  getMasterTestById,
  checkFacilityCapability,
  setFacilityCapabilityStatus,
} from "../lib/data/lab-capability-store";
import { getLabOrderById } from "../lib/data/lab-order-store";
import { findIdentityById } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase81Tests() {
  console.log("============================================================");
  console.log("MEDORA — PHASE 8.1 TEST SUITE: LAB ORGANIZATION & ORDER INTAKE");
  console.log("============================================================\n");

  const today = getTodayDateStr();

  // Test Actors
  const doctorActor = findIdentityById("DOC-1001");
  const labAdminActor = findIdentityById("USR-LAB-ADMIN") || {
    id: "USR-LAB-ADMIN",
    identifier: "USR-LAB-ADMIN",
    fullName: "Lab Manager Ramesh",
    role: "lab_staff",
    accountStatus: "active",
  };
  const patientActor = findIdentityById("PAT-1001");

  assert(Boolean(doctorActor), "Resolved Prescribing Doctor (DOC-1001)");

  // ------------------------------------------------------------
  // TEST GROUP 1: Laboratory Organization, Facilities & Multi-Branch Model
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 1: Laboratory Organization & Facilities");

  const org = getLabOrganizationById("LAB-ORG-1001");
  assert(Boolean(org), "Resolved Laboratory Organization (ABC Diagnostics)");
  assert(org?.status === "ACTIVE", "Organization status is ACTIVE");

  const facility1 = getLabFacilityById("LAB-FAC-1001");
  const facility2 = getLabFacilityById("LAB-FAC-1002");
  assert(Boolean(facility1), "Resolved Facility 1: Rourkela Central Lab");
  assert(Boolean(facility2), "Resolved Facility 2: Sambalpur Branch");
  assert(facility1?.organization_id === "LAB-ORG-1001", "Facility 1 belongs to LAB-ORG-1001");

  // ------------------------------------------------------------
  // TEST GROUP 2: Staff Memberships & RBAC Roles
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Staff Memberships & RBAC Roles");

  const memberships = getLabStaffMemberships("USR-1005");
  assert(memberships.length > 0, "Resolved Lab Staff Membership for USR-1005");
  assert(memberships[0].role === "LAB_TECHNICIAN", "Staff role is LAB_TECHNICIAN");

  const inviteRes = inviteLabStaff({
    userId: "USR-NEW-TECH",
    userName: "New Tech Anita",
    userEmail: "anita@abcdiagnostics.com",
    organizationId: "LAB-ORG-1001",
    facilityIds: ["LAB-FAC-1001"],
    role: "LAB_TECHNICIAN",
    actorId: "USR-LAB-ADMIN",
    actorName: "Lab Manager Ramesh",
    actorRole: "LAB_ADMIN",
  });
  assert(inviteRes.success === true, "Invited new lab technician successfully");
  assert(inviteRes.membership?.status === "INVITED", "Invitation status is INVITED");

  // ------------------------------------------------------------
  // TEST GROUP 3: Test Catalog Master Data & Capability Mapping
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Test Catalog Master Data & Capability Mapping");

  const masterCbc = getMasterTestById("TEST-CBC-001");
  assert(Boolean(masterCbc), "Resolved Master Test: CBC");

  const cbcCheck = checkFacilityCapability("LAB-FAC-1001", "TEST-CBC-001");
  assert(cbcCheck.supported === true, "Facility 1 supports CBC test");

  const specCheck = checkFacilityCapability("LAB-FAC-1001", "TEST-SPEC-999");
  assert(specCheck.supported === false, "Facility 1 DOES NOT support Specialized Genetic Panel");

  // Temporarily set capability status
  setFacilityCapabilityStatus("LAB-FAC-1002", "TEST-LIP-001", "TEMPORARILY_UNAVAILABLE", "Reagent depleted");
  const lipCheck = checkFacilityCapability("LAB-FAC-1002", "TEST-LIP-001");
  assert(lipCheck.supported === false && lipCheck.status === "TEMPORARILY_UNAVAILABLE", "Facility 2 lipid test status updated to TEMPORARILY_UNAVAILABLE");

  // ------------------------------------------------------------
  // TEST GROUP 4: Lab Order Intake, Review & Acceptance
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Lab Order Intake, Review & Acceptance");

  // Setup: Create an active encounter & finalized lab order from Phase 7.3
  QueueStore.reset();
  const existingQueue = QueueStore.getQueueForDoctor("DOC-1001");
  existingQueue.forEach((q) => {
    if (q.status === "IN_CONSULTATION") {
      QueueStore.saveQueueEntry({ ...q, status: "COMPLETED" });
    }
  });

  const tokenMeta = QueueStore.getNextToken("HSP-1001", "FAC-1001", "DEP-CARDIO", "DOC-1001", "SES-1001", today, "Dr. Ananya Sharma");
  const qEntry = QueueStore.saveQueueEntry({
    id: `q-intake-${Date.now()}`,
    queue_no: `QUE-INT-${Date.now()}`,
    appointment_id: "APT-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Hospital",
    facility_id: "FAC-1001",
    department_id: "DEP-CARDIO",
    department_name: "Cardiology OPD",
    session_id: "SES-1001",
    date: today,
    token_number: tokenMeta.tokenNumber,
    token_sequence: tokenMeta.sequenceNumber,
    source: "APPOINTMENT",
    checkin_source: "PATIENT_SELF",
    status: "CALLED",
    checked_in_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  const startRes = await ConsultationService.startConsultationFromQueue(qEntry.id, doctorActor);
  const encounterId = startRes.encounter!.id;

  const finalizedLabRes = await LabOrderService.finalizeLabOrder(
    encounterId,
    {
      items: [{ id: "LOI-CBC-01", test_id: "TEST-CBC-001", test_name: "Complete Blood Count (CBC)", specimen_type: "WHOLE_BLOOD" }],
      priority: "ROUTINE",
      reason: "Baseline evaluation",
    },
    doctorActor
  );
  assert(finalizedLabRes.success === true, "Created finalized lab order in Phase 7.3");
  const orderId = finalizedLabRes.order!.id;

  // Lab Order Intake Acceptance
  const acceptRes = await LabIntakeService.acceptOrder(orderId, "LAB-FAC-1001", labAdminActor as any);
  assert(acceptRes.success === true, "Lab facility accepted order for processing");
  assert(acceptRes.order?.status === "ACCEPTED", "Lab order status updated to ACCEPTED");

  // Idempotent double-click acceptance test
  const acceptRes2 = await LabIntakeService.acceptOrder(orderId, "LAB-FAC-1001", labAdminActor as any);
  assert(acceptRes2.success === true && acceptRes2.order?.id === orderId, "Double-click acceptance returned same accepted order");

  // ------------------------------------------------------------
  // TEST GROUP 5: Unable to Process Workflow
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Unable to Process Workflow");

  const unprocessableRes = await LabIntakeService.markUnableToProcess(
    orderId,
    "EQUIPMENT_MAINTENANCE",
    "Hematology analyzer undergoing scheduled calibration",
    labAdminActor as any
  );
  assert(unprocessableRes.success === true, "Marked lab order as unable to process");
  assert(unprocessableRes.order?.status === "REJECTED", "Lab order status updated to REJECTED");

  // ------------------------------------------------------------
  // TEST GROUP 6: Audit Ledger Logging
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Audit Ledger Logging");

  const auditEvents = AuditLedger.getEvents({ resourceId: orderId });
  assert(auditEvents.length > 0, "Audit ledger recorded events for lab order intake");
  assert(
    auditEvents.some((e) => e.event_type === "LAB_ORDER_ACCEPTED" || (e as any).action === "LAB_ORDER_ACCEPTED"),
    "Audit recorded LAB_ORDER_ACCEPTED"
  );

  console.log("\n============================================================");
  console.log(`PHASE 8.1 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase81Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
