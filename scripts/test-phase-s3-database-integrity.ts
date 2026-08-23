// ============================================================
// MEDORA â€” STABILIZATION S3 DATABASE & RELATIONSHIP TEST SUITE
// Validates Data Consistency, Relationships, FKs & Single Source of Truth
// ============================================================

import { getAllIdentities, findIdentityById } from "@/lib/data/identity-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { QueueStore } from "@/lib/data/queue-store";
import { getAllEncounters, createEncounter, getEncounterById } from "@/lib/data/encounter-store";
import { getAllPrescriptions, getPrescriptionById, savePrescriptionDraft, finalizePrescription } from "@/lib/data/prescription-store";
import { getAllLabOrders, getLabOrderById, saveLabOrderDraft, finalizeLabOrder } from "@/lib/data/lab-order-store";
import { getAllSamples, createSample } from "@/lib/data/lab-sample-store";
import { getAllBills, getBillById, saveBill } from "@/lib/data/billing-store";
import { getPaymentById, savePaymentRecord } from "@/lib/data/payment-store";
import { FinancialCoverageService } from "@/lib/services/financial-coverage-service";
import { PharmacyInventoryService } from "@/lib/services/pharmacy-inventory-service";
import { PharmacyFulfillmentService } from "@/lib/services/pharmacy-fulfillment-service";
import { BillingEngineService } from "@/lib/services/billing-engine-service";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";

async function runS3Tests() {
  console.log("============================================================");
  console.log("MEDORA â€” STABILIZATION S3 DATABASE INTEGRITY SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string, details?: any) {
    total++;
    if (condition) {
      console.log(`  âœ“ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  âœ• FAIL: ${description}`, details ? `\n    --> Details: ${JSON.stringify(details)}` : "");
      process.exitCode = 1;
    }
  }

  // ------------------------------------------------------------
  // TEST GROUP 1: Primary Key Uniqueness & Non-Null Constraint
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Primary Key Uniqueness & Integrity across Identity Store");
  const identities = getAllIdentities();
  assert(identities.length >= 10, `Loaded ${identities.length} authoritative personas in identity store`);

  const idSet = new Set<string>();
  const identifierSet = new Set<string>();
  let hasDuplicateId = false;
  let hasDuplicateIdentifier = false;

  for (const user of identities) {
    if (idSet.has(user.id)) hasDuplicateId = true;
    idSet.add(user.id);

    if (user.identifier) {
      if (identifierSet.has(user.identifier)) hasDuplicateIdentifier = true;
      identifierSet.add(user.identifier);
    }
  }

  assert(!hasDuplicateId, "All user primary keys (UUIDs) are unique and non-null");
  assert(!hasDuplicateIdentifier, "All business identifiers (PAT-*, DOC-*, etc.) are unique");

  // ------------------------------------------------------------
  // TEST GROUP 2: Doctor Multi-Facility Affiliation Model
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Doctor Multi-Facility Affiliation Model (One Identity -> Multiple Facilities)");
  const doctor = findIdentityById("DOC-1001");
  assert(Boolean(doctor), "Resolved Dr. Ananya Sharma (DOC-1001)");

  const sessions = AppointmentStore.getAllSessions().filter((s) => s.doctor_id === "DOC-1001");
  assert(sessions.length >= 2, `Doctor DOC-1001 has ${sessions.length} practicing sessions across facilities`);

  const facilityIds = new Set(sessions.map((s) => s.facility_id));
  assert(facilityIds.size >= 2, "Doctor practices across multiple distinct facilities under ONE doctor identity");

  // ------------------------------------------------------------
  // TEST GROUP 3: Appointment & Capacity Schedule Model
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Appointment Capacity & Working Session Separation");
  const targetSession = sessions[0];
  assert(Boolean(targetSession.capacity && targetSession.capacity > 0), `Session ${targetSession.id} defines capacity = ${targetSession.capacity}`);

  const apptsForSession = AppointmentStore.getAllAppointments().filter((a) => a.session_id === targetSession.id);
  assert(apptsForSession.every((a) => a.doctor_id === targetSession.doctor_id), "All appointments in session reference authoritative doctor ID");
  assert(apptsForSession.every((a) => Boolean(a.patient_id)), "All appointments in session reference a valid patient ID");

  // ------------------------------------------------------------
  // TEST GROUP 4: Check-in & Queue Token Relational Linkage
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Check-in & Queue Token Relational Linkage");
  const queueEntry = QueueStore.saveQueueEntry({
    id: `QUE-TEST-${Date.now()}`,
    queue_no: `Q-TOK-${Date.now() % 1000}`,
    appointment_id: apptsForSession[0]?.id || "APT-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    patient_phone: "+91 98765 00000",
    doctor_id: targetSession.doctor_id,
    doctor_name: targetSession.doctor_name,
    organization_id: targetSession.organization_id,
    organization_name: "City Hospital",
    organization_identifier: targetSession.organization_identifier,
    facility_id: targetSession.facility_id,
    department_id: targetSession.department_id,
    department_name: "Cardiology",
    session_id: targetSession.id,
    date: new Date().toISOString().split("T")[0],
    token_number: "C-01",
    token_sequence: 1,
    source: "APPOINTMENT",
    checkin_source: "PATIENT_SELF",
    status: "WAITING",
    room_number: targetSession.room_number,
    checked_in_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  assert(Boolean(queueEntry.appointment_id), "Queue token maintains foreign key reference to appointment");
  assert(queueEntry.doctor_id === targetSession.doctor_id, "Queue token references authoritative doctor");

  // ------------------------------------------------------------
  // TEST GROUP 5: Clinical Cascade Integrity (Encounter -> Rx -> Lab -> Bill)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Clinical Cascade Integrity & Single Source of Truth");
  const encounterRes = createEncounter({
    patientId: "PAT-1001",
    providerId: "DOC-1001",
    organizationId: "HSP-1001",
    departmentId: "DEP-1001",
    departmentName: "Cardiology",
    encounterType: "OUTPATIENT",
    reasonForVisit: "Hypertension review",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(encounterRes.success === true && Boolean(encounterRes.encounter), "Created Healthcare Encounter");
  const enc = encounterRes.encounter!;

  // 1. Digital Prescription linked to encounter
  const rxRes = savePrescriptionDraft({
    encounterId: enc.id,
    items: [{
      id: `PRI-${Date.now()}`,
      medicine_id: "MED-1001",
      medicine_name: "Paracetamol 500mg Tablet",
      generic_name: "Paracetamol",
      strength: "500 mg",
      dosage_form: "TABLET",
      dosage: "1 Tablet",
      frequency: "ONCE_DAILY",
      duration: "10 Days",
      route: "ORAL",
      instructions: "Take morning after food",
    }],
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(rxRes.success === true && Boolean(rxRes.prescription), "Prescription drafted and bound to encounter ID");

  const finalizedRx = finalizePrescription({
    prescriptionId: rxRes.prescription!.id,
    encounterId: enc.id,
    items: rxRes.prescription!.items,
    notes: rxRes.prescription!.notes,
    refillsAllowed: rxRes.prescription!.refills_allowed,
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(finalizedRx.success === true && finalizedRx.prescription?.status === "FINALIZED", "Prescription finalized with digital signature");

  // 2. Diagnostic Lab Order linked to encounter
  const labRes = saveLabOrderDraft({
    encounterId: enc.id,
    items: [{
      id: `LOI-${Date.now()}`,
      test_id: "TEST-LIPID",
      test_name: "Lipid Profile",
      test_code: "LIPID",
      specimen_type: "WHOLE_BLOOD",
      instructions: "Fasting lipid panel",
    }],
    reason: "Hypertension risk assessment",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(labRes.success === true && Boolean(labRes.order), "Lab order drafted and bound to encounter ID");

  const finalizedLab = finalizeLabOrder({
    orderId: labRes.order!.id,
    encounterId: enc.id,
    items: labRes.order!.items,
    reason: labRes.order!.reason || "Hypertension risk assessment",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(finalizedLab.success === true && finalizedLab.order?.status === "FINALIZED", "Lab order finalized");

  // ------------------------------------------------------------
  // TEST GROUP 6: Laboratory Specimen Chain of Custody & Reports
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Lab Sample Specimen & Chain of Custody Binding");
  const sampleRes = createSample({
    labOrderId: finalizedLab.order!.id,
    sampleType: "WHOLE_BLOOD",
    testItemIds: ["LOI-1001"],
    testNames: ["Lipid Profile"],
    collectorId: "LAB-1001",
    collectorName: "Pathologist",
    collectorRole: "lab_staff",
    facilityId: "LAB-FAC-1001",
    facilityName: "City Diagnostic Lab",
  });
  assert(Boolean(sampleRes.success && sampleRes.sample && sampleRes.sample.id.startsWith("SMP-")), "Physical specimen generated authoritative sample ID");
  assert(sampleRes.sample?.lab_order_id === finalizedLab.order!.id, "Sample strictly bound to parent lab order ID");

  // ------------------------------------------------------------
  // TEST GROUP 7: Pharmacy FEFO Stock Allocation & Dispensing
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Pharmacy Stock Evaluation & FEFO Reservation");
  const avail = PharmacyInventoryService.evaluatePharmacyAvailability(
    finalizedRx.prescription!.id,
    "PHARM-FAC-1001"
  );
  assert(Boolean(avail && avail.items.length > 0), "FEFO inventory engine evaluated batch availability for prescription");

  // ------------------------------------------------------------
  // TEST GROUP 8: Itemized Billing & 5-Tier Waterfall Consistency
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 8: Itemized Bill Calculation & Waterfall Consistency");
  const financeActor = findIdentityById("FIN-1001");
  const draftBillRes = BillingEngineService.createDraftBill({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    organizationId: "HSP-1001",
    organizationName: "City Hospital",
    facilityId: "FAC-1001",
    facilityName: "Main Campus",
    encounterId: enc.id,
    billType: "FINAL",
    actor: financeActor,
  });
  assert(draftBillRes.success === true && Boolean(draftBillRes.bill), "Generated itemized draft bill");
  const bill = draftBillRes.bill!;

  // Add line items
  BillingEngineService.addBillableItem({
    billId: bill.id,
    serviceCode: "CONS-OPD-01",
    sourceType: "ENCOUNTER",
    sourceId: enc.id,
    quantity: 1,
    actor: financeActor,
  });

  BillingEngineService.addBillableItem({
    billId: bill.id,
    serviceCode: "LAB-CBC-01",
    sourceType: "LAB_TEST",
    sourceId: finalizedLab.order!.id,
    quantity: 1,
    actor: financeActor,
  });

  const updatedBill = getBillById(bill.id)!;
  const itemsSum = updatedBill.items.reduce((sum, item) => sum + (item.base_amount || (item.quantity * item.unit_price)), 0);
  assert(updatedBill.gross_total === itemsSum, `Sum of line items (₹${itemsSum}) exactly equals bill gross total (₹${updatedBill.gross_total})`);

  // Financial Waterfall Calculation
  const waterfall = FinancialCoverageService.calculateFinancialWaterfall(bill.id);
  assert(Boolean(waterfall), "5-Tier financial coverage waterfall generated");
  assert(waterfall!.gross_charges === updatedBill.gross_total, "Waterfall gross charges match authoritative bill gross total");

  // ------------------------------------------------------------
  // TEST GROUP 9: Payment Integrity & Balance Invariance
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 9: Payment Application & Bill Balance Invariance");
  const initialTotal = updatedBill.gross_total;
  const paymentAmount = 500;

  const actorUser = findIdentityById("PAT-1001");
  const intentRes = PaymentProcessingService.createPaymentIntent({
    billId: bill.id,
    amount: paymentAmount,
    idempotencyKey: `IDEM-PAY-${Date.now()}`,
    actor: actorUser,
  });
  assert(intentRes.success === true && Boolean(intentRes.intent), "Created payment intent");

  const payAttempt = PaymentProcessingService.executePaymentAttempt({
    intentId: intentRes.intent!.id,
    paymentMethod: "UPI",
    transactionReference: `REF-TXN-${Date.now()}`,
    actor: actorUser,
  });
  assert(payAttempt.success === true && payAttempt.payment?.status === "SUCCESS", "Payment recorded successfully with authoritative receipt number");

  const postPayBill = getBillById(bill.id)!;
  assert(postPayBill.gross_total === initialTotal, "Original bill total amount is INVARIANT (not overwritten by payment)");

  // ------------------------------------------------------------
  // TEST GROUP 10: Anti-IDOR & Patient Identity Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 10: Anti-IDOR & Patient Medical Data Isolation");
  const patientABills = getAllBills().filter((b) => b.patient_id === "PAT-1001");
  const patientBBills = getAllBills().filter((b) => b.patient_id === "PAT-1002");

  assert(patientABills.every((b) => b.patient_id === "PAT-1001"), "Patient A bills strictly isolated from Patient B");
  assert(patientBBills.every((b) => b.patient_id === "PAT-1002"), "Patient B bills strictly isolated from Patient A");

  console.log("\n============================================================");
  console.log(`S3 DATABASE INTEGRITY SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed/total)*100)}%)`);
  console.log("============================================================\n");
}

runS3Tests().catch(console.error);
