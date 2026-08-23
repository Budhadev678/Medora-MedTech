// ============================================================
// MEDORA â€” PHASE 9.1 TEST SUITE: PHARMACY ORGANIZATION & PRESCRIPTION INTAKE
// ============================================================

import { PharmacyIntakeService } from "../lib/services/pharmacy-intake-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { PrescriptionOrderService } from "../lib/services/prescription-order-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import {
  getAllPharmacyOrganizations,
  getPharmacyFacilityById,
  addPharmacyStaffMembership,
  getPharmacyStaffMembership,
  getAllMedicineCatalog,
} from "../lib/data/pharmacy-organization-store";
import { getIntakeById, getIntakesByFacility } from "../lib/data/pharmacy-intake-store";
import { findIdentityById } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  âœ“ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  âŒ FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase91Tests() {
  console.log("============================================================");
  console.log("MEDORA â€” PHASE 9.1 TEST SUITE: PHARMACY ORGANIZATION & INTAKE");
  console.log("============================================================\n");

  const today = getTodayDateStr();

  // Test Actors
  const doctorActor = findIdentityById("DOC-1001");
  const pharmacistActor = {
    id: "USR-PHARM-01",
    identifier: "USR-PHARM-01",
    fullName: "Pharmacist Priya",
    role: "lab_staff",
    accountStatus: "active",
  };
  const unauthorizedActor = {
    id: "USR-RECEPTION-99",
    identifier: "USR-RECEPTION-99",
    fullName: "Receptionist John",
    role: "patient",
    accountStatus: "active",
  };

  assert(Boolean(doctorActor), "Resolved Prescribing Doctor (DOC-1001)");

  // ------------------------------------------------------------
  // TEST GROUP 1: Pharmacy Organization & Facility Infrastructure
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 1: Pharmacy Organization & Facility Infrastructure");

  const orgs = getAllPharmacyOrganizations();
  assert(orgs.length >= 2, "Resolved Pharmacy Organizations (ABC Pharmacy Group & Hospital Pharmacy)");
  assert(orgs[0].connectivity_status === "CONNECTED", "Pharmacy Organization status is CONNECTED");

  const facility1 = getPharmacyFacilityById("PHARM-FAC-1001");
  assert(Boolean(facility1), "Resolved Facility 1: ABC Pharmacy â€” Rourkela Central");
  assert(facility1?.organization_id === "PHARM-ORG-1001", "Facility 1 belongs to PHARM-ORG-1001");

  const facility2 = getPharmacyFacilityById("PHARM-FAC-1002");
  assert(Boolean(facility2), "Resolved Facility 2: ABC Pharmacy â€” Branch 2 (Multi-Branch)");

  // ------------------------------------------------------------
  // TEST GROUP 2: Staff Memberships & RBAC Permissions
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Staff Memberships & RBAC Permissions");

  const mem = getPharmacyStaffMembership("USR-PHARM-01", "PHARM-FAC-1001");
  assert(Boolean(mem), "Resolved Staff Membership for Pharmacist Priya");
  assert(mem?.role === "PHARMACIST", "Staff role is PHARMACIST");

  const addStaffRes = addPharmacyStaffMembership({
    userId: "USR-NEW-PHARM",
    userName: "Pharmacist Sunita",
    organizationId: "PHARM-ORG-1001",
    facilityId: "PHARM-FAC-1001",
    role: "PHARMACIST",
    actorId: "USR-PHARM-ADMIN",
    actorName: "Manager Vikas",
    actorRole: "admin",
  });
  assert(addStaffRes.success === true, "Added new pharmacist membership");

  // ------------------------------------------------------------
  // TEST GROUP 3: Master Medicine Catalog Dictionary
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Master Medicine Catalog Dictionary");

  const catalog = getAllMedicineCatalog();
  assert(catalog.length >= 4, "Resolved Master Medicine Catalog dictionary items");
  assert(Boolean(catalog.find((m) => m.id === "MED-1001")), "Catalog contains Paracetamol 500mg");

  // ------------------------------------------------------------
  // TEST GROUP 4: Phase 7 Prescription Operational Intake
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Phase 7 Prescription Operational Intake");

  // Setup: Create encounter & finalized prescription
  QueueStore.reset();
  const existingQueue = QueueStore.getQueueForDoctor("DOC-1001");
  existingQueue.forEach((q) => {
    if (q.status === "IN_CONSULTATION") {
      QueueStore.saveQueueEntry({ ...q, status: "COMPLETED" });
    }
  });

  const tokenMeta = QueueStore.getNextToken("HSP-1001", "FAC-1001", "DEP-CARDIO", "DOC-1001", "SES-1001", today, "Dr. Ananya Sharma");
  const qEntry = QueueStore.saveQueueEntry({
    id: `q-p91-${Date.now()}`,
    queue_no: `QUE-P91-${Date.now()}`,
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

  const finalizedRxRes = await PrescriptionOrderService.finalizePrescription(
    encounterId,
    {
      items: [
        { id: "PRX-ITEM-1001", medicine_name: "Paracetamol 500mg Tablet", dosage: "1 tablet", frequency: "TDS", duration: "5 days", duration_days: 5, route: "ORAL" as any, instructions: "After meals" },
      ],
      refills_allowed: 0,
      notes: "Post-op analgesia",
    },
    doctorActor
  );
  const prescriptionId = finalizedRxRes.prescription!.id;

  // Submit prescription to pharmacy intake
  const intakeRes = await PharmacyIntakeService.submitPrescriptionToIntake(prescriptionId, "PHARM-FAC-1001", pharmacistActor as any);
  assert(intakeRes.success === true, "Submitted Phase 7 prescription to pharmacy intake");
  assert(Boolean(intakeRes.intake), "Server created operational PharmacyPrescriptionIntake entity");
  assert(intakeRes.intake?.status === "RECEIVED", "Intake initial status is RECEIVED");
  const intakeId = intakeRes.intake!.id;

  // Idempotent re-invocation test
  const intakeRes2 = await PharmacyIntakeService.submitPrescriptionToIntake(prescriptionId, "PHARM-FAC-1001", pharmacistActor as any);
  assert(intakeRes2.success === true && intakeRes2.intake?.id === intakeId, "Re-submitting returned same intake ID (Idempotency verified)");

  // ------------------------------------------------------------
  // TEST GROUP 5: Pharmacist Validation & Clarification Workflow
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Pharmacist Validation & Clarification Workflow");

  const validateRes = await PharmacyIntakeService.validateIntake(intakeId, "MARK_VALID", undefined, undefined, pharmacistActor as any);
  assert(validateRes.success === true, "Pharmacist validated prescription intake");
  assert(validateRes.intake?.status === "VALID", "Intake status updated to VALID");

  // Clarification request test
  const clarRes = await PharmacyIntakeService.requestClarification(intakeId, "Inquire about dosage duration", pharmacistActor as any);
  assert(clarRes.success === true, "Created prescriber clarification request");
  assert(clarRes.request?.status === "OPEN", "Clarification request status is OPEN");

  // ------------------------------------------------------------
  // TEST GROUP 6: RBAC & Security Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: RBAC & Security Isolation");

  const unauthValidate = await PharmacyIntakeService.validateIntake(intakeId, "MARK_VALID", undefined, undefined, unauthorizedActor as any);
  assert(unauthValidate.success === false, "Unauthorized role validating intake strictly DENIED");

  // ------------------------------------------------------------
  // TEST GROUP 7: Audit Ledger Trail
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Audit Ledger Trail");

  const auditEvents = AuditLedger.getEvents({ resourceId: intakeId });
  assert(auditEvents.length > 0, "Audit ledger recorded pharmacy intake events");

  console.log("\n============================================================");
  console.log(`PHASE 9.1 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase91Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
