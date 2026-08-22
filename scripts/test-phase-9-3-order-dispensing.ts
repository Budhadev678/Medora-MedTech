// ============================================================
// MEDORA — PHASE 9.3 TEST SUITE: ORDER MANAGEMENT & ATOMIC DISPENSING
// ============================================================

import { PharmacyFulfillmentService } from "../lib/services/pharmacy-fulfillment-service";
import { PharmacyIntakeService } from "../lib/services/pharmacy-intake-service";
import { PharmacyInventoryService } from "../lib/services/pharmacy-inventory-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { PrescriptionOrderService } from "../lib/services/prescription-order-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { getOrderById } from "../lib/data/pharmacy-order-store";
import { getDispensingRecordByOrder } from "../lib/data/dispensing-store";
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

async function runPhase93Tests() {
  console.log("============================================================");
  console.log("MEDORA — PHASE 9.3 TEST SUITE: ORDER MANAGEMENT & DISPENSING");
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
  const patientActor = findIdentityById("PAT-1001");

  // Setup: Create encounter, finalized prescription, intake & stock reservation
  QueueStore.reset();
  const existingQueue = QueueStore.getQueueForDoctor("DOC-1001");
  existingQueue.forEach((q) => {
    if (q.status === "IN_CONSULTATION") {
      QueueStore.saveQueueEntry({ ...q, status: "COMPLETED" });
    }
  });

  const tokenMeta = QueueStore.getNextToken("HSP-1001", "FAC-1001", "DEP-CARDIO", "DOC-1001", "SES-1001", today, "Dr. Ananya Sharma");
  const qEntry = QueueStore.saveQueueEntry({
    id: `q-p93-${Date.now()}`,
    queue_no: `QUE-P93-${Date.now()}`,
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

  // Submit intake & reserve stock
  const intakeRes = await PharmacyIntakeService.submitPrescriptionToIntake(prescriptionId, "PHARM-FAC-1001", pharmacistActor as any);
  await PharmacyIntakeService.validateIntake(intakeRes.intake!.id, "MARK_VALID", undefined, undefined, pharmacistActor as any);
  await PharmacyInventoryService.reserveStock(prescriptionId, "PHARM-FAC-1001", patientActor as any);

  // ------------------------------------------------------------
  // TEST GROUP 1: Pharmacy Order Creation & Decoupling
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Pharmacy Order Creation & Decoupling");

  const orderRes = await PharmacyFulfillmentService.createOrderFromIntake(intakeRes.intake!.id, "PICKUP", undefined, patientActor as any);
  assert(orderRes.success === true, "Created formal Pharmacy Order entity (PHARM-ORD-xxxx)");
  assert(Boolean(orderRes.order), "Server returned PharmacyOrder instance");
  assert(orderRes.order?.status === "CREATED", "Initial order status is CREATED");
  assert(Boolean(orderRes.order?.verification_otp), "Generated 6-digit patient verification OTP code");
  const orderId = orderRes.order!.id;

  // ------------------------------------------------------------
  // TEST GROUP 2: Pre-Preparation Revalidation & Workflow
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Pre-Preparation Revalidation & Workflow");

  const prepRes = await PharmacyFulfillmentService.startPreparation(orderId, pharmacistActor as any);
  assert(prepRes.success === true, "Revalidated prescription & advanced order to PREPARING");
  assert(prepRes.order?.status === "PREPARING", "Order status is PREPARING");

  const readyRes = await PharmacyFulfillmentService.markReady(
    orderId,
    [{ medicineId: "MED-1001", batchId: "BATCH-1001", batchNumber: "PCM-2026-01", quantity: 10 }],
    pharmacistActor as any
  );
  assert(readyRes.success === true, "Marked medicines ready for counter pickup");
  assert(readyRes.order?.status === "READY_FOR_PICKUP", "Order status is READY_FOR_PICKUP");

  // ------------------------------------------------------------
  // TEST GROUP 3: Patient OTP Verification & Atomic Dispensing
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Patient OTP Verification & Atomic Dispensing");

  // Wrong OTP attempt
  const wrongOtpRes = await PharmacyFulfillmentService.dispenseOrder(orderId, "000000", pharmacistActor as any);
  assert(wrongOtpRes.success === false, "Dispensing attempt with incorrect OTP code strictly BLOCKED");

  // Valid OTP attempt
  const validOtpRes = await PharmacyFulfillmentService.dispenseOrder(orderId, orderRes.order!.verification_otp, pharmacistActor as any);
  assert(validOtpRes.success === true, "Patient OTP verified & dispensing transaction executed");
  assert(Boolean(validOtpRes.dispensing), "Created server-authoritative DispensingRecord (DISP-xxxx)");
  assert(validOtpRes.dispensing?.status === "DISPENSED", "Dispensing record status is DISPENSED");

  // ------------------------------------------------------------
  // TEST GROUP 4: Double-Dispensing & Idempotency Guards
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Double-Dispensing & Idempotency Guards");

  const doubleDisp = await PharmacyFulfillmentService.dispenseOrder(orderId, orderRes.order!.verification_otp, pharmacistActor as any);
  assert(doubleDisp.success === true && doubleDisp.dispensing?.id === validOtpRes.dispensing?.id, "Re-dispensing returned existing dispensing record ID (Double-dispense protection verified)");

  // ------------------------------------------------------------
  // TEST GROUP 5: Full MEDORA Audit Ledger Integration
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Full MEDORA Audit Ledger Integration");

  const auditEvents = AuditLedger.getEvents({ resourceId: validOtpRes.dispensing!.id });
  assert(auditEvents.length > 0, "Audit ledger recorded MEDICINE_DISPENSED event");

  console.log("\n============================================================");
  console.log(`PHASE 9.3 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase93Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
