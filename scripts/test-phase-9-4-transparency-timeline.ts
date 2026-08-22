// ============================================================
// MEDORA — PHASE 9.4 TEST SUITE: PHARMACY TRANSPARENCY & NOTIFICATIONS
// ============================================================

import { PharmacyTransparencyService } from "../lib/services/pharmacy-transparency-service";
import { getNotificationsForUser } from "../lib/data/notification-store";
import { getTimelineEventsForOrder } from "../lib/data/notification-store";
import { getDispensingRecordsByPatient } from "../lib/data/dispensing-store";

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

async function runPhase94Tests() {
  console.log("============================================================");
  console.log("MEDORA — PHASE 9.4 TEST SUITE: TRANSPARENCY & NOTIFICATIONS");
  console.log("============================================================\n");

  const sampleOrder: any = {
    id: "PHARM-ORD-1001",
    prescription_id: "PRX-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    facility_id: "PHARM-FAC-1001",
    facility_name: "ABC Pharmacy — Rourkela Central",
    fulfillment_type: "PICKUP",
    verification_otp: "948201",
  };

  const sampleDispensing: any = {
    id: "DISP-1001",
    order_id: "PHARM-ORD-1001",
    prescription_id: "PRX-1001",
    patient_id: "PAT-1001",
    facility_name: "ABC Pharmacy — Rourkela Central",
    pharmacist_name: "Pharmacist Priya",
    status: "DISPENSED",
    is_partial: false,
    items: [
      { medicine_name: "Paracetamol 500mg Tablet", quantity_dispensed: 10, quantity_prescribed: 10 },
    ],
  };

  // ------------------------------------------------------------
  // TEST GROUP 1: In-App Patient Notifications & Idempotency
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: In-App Patient Notifications & Idempotency");

  await PharmacyTransparencyService.handleOrderCreated(sampleOrder);
  await PharmacyTransparencyService.handleOrderPreparing(sampleOrder, "Pharmacist Priya");
  await PharmacyTransparencyService.handleOrderReady(sampleOrder);
  await PharmacyTransparencyService.handleOrderDispensed(sampleOrder, sampleDispensing);

  const notifications = getNotificationsForUser("PAT-1001");
  assert(notifications.length >= 4, "Generated patient in-app notifications for order lifecycle events");
  assert(notifications.some((n) => n.event_type === "ORDER_CONFIRMED"), "Recorded ORDER_CONFIRMED notification");
  assert(notifications.some((n) => n.event_type === "MEDICINE_READY"), "Recorded MEDICINE_READY notification with OTP reference");

  // Re-trigger notification handler to test idempotency
  await PharmacyTransparencyService.handleOrderReady(sampleOrder);
  const notifications2 = getNotificationsForUser("PAT-1001");
  assert(notifications2.length === notifications.length, "Duplicate notification event suppressed (Idempotency verified)");

  // ------------------------------------------------------------
  // TEST GROUP 2: Visual Fulfillment Timeline Compilation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Visual Fulfillment Timeline Compilation");

  const timeline = PharmacyTransparencyService.getVisualTimeline("PHARM-ORD-1001");
  assert(timeline.length >= 4, "Compiled visual fulfillment timeline events");
  assert(timeline[0].event_type === "PRESCRIPTION_RECEIVED", "First timeline stage is PRESCRIPTION_RECEIVED");

  // ------------------------------------------------------------
  // TEST GROUP 3: Patient Dispensing History & Receipt Aggregation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Patient Dispensing History & Receipt Aggregation");

  const receipts = getDispensingRecordsByPatient("PAT-1001");
  assert(receipts.length > 0, "Resolved patient digital dispensing receipts");
  assert(receipts[0].id === "DISP-1001", "Receipt contains authoritative DISP-1001 identifier");

  console.log("\n============================================================");
  console.log(`PHASE 9.4 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase94Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
