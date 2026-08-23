// ============================================================
// MEDORA â€” PHASE 9.2 TEST SUITE: INVENTORY, AVAILABILITY & STOCK RESERVATION
// ============================================================

import { PharmacyInventoryService } from "../lib/services/pharmacy-inventory-service";
import { PharmacyIntakeService } from "../lib/services/pharmacy-intake-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { PrescriptionOrderService } from "../lib/services/prescription-order-service";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import {
  getInventoryItem,
  getUsableBatchesForMedicine,
  releaseReservation,
} from "../lib/data/pharmacy-inventory-store";
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

async function runPhase92Tests() {
  console.log("============================================================");
  console.log("MEDORA â€” PHASE 9.2 TEST SUITE: INVENTORY, AVAILABILITY & RESERVATION");
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
    id: `q-p92-${Date.now()}`,
    queue_no: `QUE-P92-${Date.now()}`,
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
      notes: "Routine fever management",
    },
    doctorActor
  );
  const prescriptionId = finalizedRxRes.prescription!.id;

  // ------------------------------------------------------------
  // TEST GROUP 1: Inventory Stock & FEFO Batch Allocation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 1: Inventory Stock & FEFO Batch Allocation");

  const invItem = getInventoryItem("PHARM-FAC-1001", "MED-1001");
  assert(Boolean(invItem), "Resolved facility inventory item for Paracetamol 500mg");
  assert(invItem?.available_quantity === 150, "Initial available quantity is 150 units");

  const batches = getUsableBatchesForMedicine("PHARM-FAC-1001", "MED-1001");
  assert(batches.length > 0, "Resolved usable batches for FEFO allocation");
  assert(batches[0].batch_number === "PCM-2026-01", "First usable batch is FEFO-sorted PCM-2026-01");

  // ------------------------------------------------------------
  // TEST GROUP 2: Single-Facility Availability Evaluation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Single-Facility Availability Evaluation");

  const singleEval = PharmacyInventoryService.evaluatePharmacyAvailability(finalizedRxRes.prescription!, "PHARM-FAC-1001");
  assert(singleEval.overall_status === "FULLY_AVAILABLE", "Prescription evaluation status is FULLY_AVAILABLE");
  assert(singleEval.total_items_fully_available === 1, "Total items fully available matches requested items");
  assert(singleEval.estimated_subtotal > 0, "Calculated transparent itemized subtotal");

  // ------------------------------------------------------------
  // TEST GROUP 3: Multi-Pharmacy Discovery & Ranking
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Multi-Pharmacy Discovery & Ranking");

  const discovered = PharmacyInventoryService.discoverEligiblePharmaciesForPrescription(prescriptionId);
  assert(discovered.length >= 2, "Discovered connected pharmacy candidates for prescription");
  assert(discovered[0].overall_status === "FULLY_AVAILABLE", "Top ranked pharmacy candidate is FULLY_AVAILABLE");

  // ------------------------------------------------------------
  // TEST GROUP 4: Atomic Stock Reservation Engine
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Atomic Stock Reservation Engine");

  const reserveRes = await PharmacyInventoryService.reserveStock(prescriptionId, "PHARM-FAC-1001", patientActor as any);
  assert(reserveRes.success === true, "Reserved available inventory stock for prescription");
  assert(Boolean(reserveRes.reservations) && reserveRes.reservations!.length > 0, "Created server-authoritative PharmacyStockReservation");
  const reservationId = reserveRes.reservations![0].id;

  const invItemAfter = getInventoryItem("PHARM-FAC-1001", "MED-1001");
  assert(invItemAfter?.reserved_quantity === 10, "Inventory item reserved quantity updated to 10");
  assert(invItemAfter?.available_quantity === 140, "Inventory item available quantity decremented to 140");

  // Release reservation
  const releaseRes = releaseReservation(reservationId, patientActor!.identifier, patientActor!.fullName, "patient");
  assert(releaseRes.success === true, "Released stock reservation successfully");

  const invItemReleased = getInventoryItem("PHARM-FAC-1001", "MED-1001");
  assert(invItemReleased?.available_quantity === 150, "Available quantity restored to 150 after release");

  // ------------------------------------------------------------
  // TEST GROUP 5: Full MEDORA Audit Integration
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Full MEDORA Audit Integration");

  const auditEvents = AuditLedger.getEvents({ resourceId: reservationId });
  assert(auditEvents.length > 0, "Audit ledger recorded stock reservation and release events");

  console.log("\n============================================================");
  console.log(`PHASE 9.2 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase92Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
