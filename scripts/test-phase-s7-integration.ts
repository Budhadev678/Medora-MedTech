// ============================================================
// MEDORA — STABILIZATION S7 MASTER END-TO-END INTEGRATION SUITE
// Validates Full Cross-Role Lifecycle: Phase 0 -> Phase 10
// Patient -> Doctor -> Lab -> Pharmacy -> Billing -> Reconciliation
// ============================================================

import {
  findIdentityById,
  authenticateCredentials,
  getHospitalAffiliatedDoctors,
} from "@/lib/data/identity-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { QueueStore } from "@/lib/data/queue-store";
import {
  createEncounter,
  getEncounterById,
  getAllEncounters,
} from "@/lib/data/encounter-store";
import {
  savePrescriptionDraft,
  finalizePrescription,
  getPrescriptionById,
} from "@/lib/data/prescription-store";
import {
  saveLabOrderDraft,
  finalizeLabOrder,
  getLabOrderById,
} from "@/lib/data/lab-order-store";
import { createSample } from "@/lib/data/lab-sample-store";
import { BillingEngineService } from "@/lib/services/billing-engine-service";
import { FinancialCoverageService } from "@/lib/services/financial-coverage-service";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";
import { PharmacyInventoryService } from "@/lib/services/pharmacy-inventory-service";
import { getBillById } from "@/lib/data/billing-store";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

async function runS7IntegrationTests() {
  console.log("============================================================");
  console.log("MEDORA — STABILIZATION S7 END-TO-END INTEGRATION SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${description}`);
    }
  }

  // ------------------------------------------------------------
  // STAGE 1: Phase 0 & 1 Foundation, Multi-Persona Login & Auth Guard
  // ------------------------------------------------------------
  console.log("STAGE 1: Foundation, Multi-Persona Authentication & RBAC Isolation");
  const patAuth = authenticateCredentials("patient@medora.health", "Password@123");
  assert(patAuth.success && patAuth.identity?.role === "patient", "Patient Rahul Verma (PAT-1001) authenticated");

  const docAuth = authenticateCredentials("doctor@medora.health", "Password@123");
  assert(docAuth.success && docAuth.identity?.role === "doctor", "Dr. Ananya Sharma (DOC-1001) authenticated");

  const labAuth = authenticateCredentials("lab@medora.health", "Password@123");
  assert(labAuth.success && labAuth.identity?.role === "lab_staff", "Lab Pathologist (LAB-1001) authenticated");

  const phaAuth = authenticateCredentials("pharmacy@medora.health", "Password@123");
  assert(phaAuth.success && phaAuth.identity?.role === "pharmacy_staff", "Pharmacist Rajesh Kumar (PHA-1001) authenticated");

  const finAuth = authenticateCredentials("finance@medora.health", "Password@123");
  assert(finAuth.success && finAuth.identity?.role === "finance_staff", "Finance Officer (FIN-1001) authenticated");

  // ------------------------------------------------------------
  // STAGE 2: Phase 3, 4 & 5 Patient Profile, Doctor Affiliation & Facility
  // ------------------------------------------------------------
  console.log("\nSTAGE 2: Patient Health Profile, Multi-Facility Affiliations & Capacity");
  const patientProfile = findIdentityById("PAT-1001")!;
  assert(patientProfile.patientData?.bloodGroup === "O+" && Boolean(patientProfile.patientData?.abhaNumber), "Patient ABHA and clinical health profile verified");

  const affiliatedDocs = getHospitalAffiliatedDoctors("HSP-1001");
  assert(affiliatedDocs.some((d) => d.doctorIdentifier === "DOC-1001" || d.doctorId === "doc-1001"), "City Hospital Main Campus lists Dr. Ananya Sharma as active cardiologist");

  const docSessions = AppointmentStore.getAllSessions().filter((s) => s.doctor_id === "DOC-1001");
  assert(docSessions.length >= 2, "Doctor has defined working sessions across multiple hospital facilities");

  // ------------------------------------------------------------
  // STAGE 3: Phase 6 Outpatient Discovery, Booking & Queue Token
  // ------------------------------------------------------------
  console.log("\nSTAGE 3: Outpatient Appointment Booking & Queue Token Issuance");
  const targetSession = docSessions[0];
  const aptId = `apt-s7-${Date.now()}`;
  const newAppointment = AppointmentStore.saveAppointment({
    id: aptId,
    appointment_no: `APT-S7-1001`,
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: targetSession.organization_id,
    organization_identifier: targetSession.organization_identifier,
    organization_name: targetSession.organization_name,
    facility_id: targetSession.facility_id,
    department_id: targetSession.department_id,
    department_name: targetSession.department_name,
    session_id: targetSession.id,
    appointment_date: "2026-08-25",
    session_start_time: "08:00",
    session_end_time: "10:00",
    slot_display_time: "08:00 AM - 10:00 AM",
    status: "CONFIRMED",
    booking_source: "PATIENT",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  assert(Boolean(newAppointment && newAppointment.id), `Patient successfully booked appointment: ${newAppointment.id}`);

  // Check-in and queue token issuance
  const queueEntry = QueueStore.saveQueueEntry({
    id: `que-s7-${Date.now()}`,
    queue_no: `QUE-S7-1001`,
    appointment_id: newAppointment.id,
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    patient_phone: "+91 98765 43210",
    doctor_id: "DOC-1001",
    doctor_name: "Dr. Ananya Sharma",
    organization_id: targetSession.organization_id,
    organization_identifier: targetSession.organization_identifier,
    organization_name: targetSession.organization_name,
    facility_id: targetSession.facility_id,
    department_id: targetSession.department_id,
    department_name: targetSession.department_name,
    session_id: targetSession.id,
    date: "2026-08-25",
    token_number: "C-01",
    token_sequence: 1,
    source: "APPOINTMENT",
    checkin_source: "RECEPTIONIST",
    status: "IN_CONSULTATION",
    room_number: "Room 102",
    checked_in_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
  assert(Boolean(queueEntry && queueEntry.token_number === "C-01"), `Front desk check-in issued Queue Token: ${queueEntry.token_number}`);

  // ------------------------------------------------------------
  // STAGE 4: Phase 7 Clinical Encounter, SOAP Notes & E-Prescription
  // ------------------------------------------------------------
  console.log("\nSTAGE 4: Clinical Consultation Suite & Signed E-Prescription");
  const encounterRes = createEncounter({
    patientId: "PAT-1001",
    providerId: "DOC-1001",
    organizationId: "HSP-1001",
    departmentId: "DEP-1001",
    departmentName: "Cardiology",
    encounterType: "OUTPATIENT",
    reasonForVisit: "Hypertension review and episodic chest tightness",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(encounterRes.success && Boolean(encounterRes.encounter), `Clinical encounter successfully documented: ${encounterRes.encounter?.id}`);
  const enc = encounterRes.encounter!;

  const rxRes = savePrescriptionDraft({
    encounterId: enc.id,
    items: [{
      id: `PRI-${Date.now()}`,
      medicine_id: "MED-1001",
      medicine_name: "Ramipril 5mg Tablet",
      generic_name: "Ramipril",
      strength: "5 mg",
      dosage_form: "TABLET",
      dosage: "1 Tablet",
      frequency: "ONCE_DAILY",
      duration: "30 Days",
      route: "ORAL",
      instructions: "Take morning after food",
    }],
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(rxRes.success && Boolean(rxRes.prescription), `Prescription drafted: ${rxRes.prescription?.id}`);

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
  assert(finalizedRx.success && finalizedRx.prescription?.status === "FINALIZED", "Prescription finalized with digital signature");

  // ------------------------------------------------------------
  // STAGE 5: Phase 8 Diagnostic Laboratory Orders & Certified Reports
  // ------------------------------------------------------------
  console.log("\nSTAGE 5: Diagnostic Laboratory Orders & Certified Pathology Report");
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
  assert(labRes.success && Boolean(labRes.order), `Lab Order drafted: ${labRes.order?.id}`);

  const finalizedLab = finalizeLabOrder({
    orderId: labRes.order!.id,
    encounterId: enc.id,
    items: labRes.order!.items,
    reason: labRes.order!.reason || "Hypertension risk assessment",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(finalizedLab.success && finalizedLab.order?.status === "FINALIZED", "Lab order finalized");

  // Accession sample
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
  assert(Boolean(sampleRes.success && sampleRes.sample && sampleRes.sample.id.startsWith("SMP-")), `Biological specimen accessioned: ${sampleRes.sample?.id}`);

  assert(sampleRes.sample?.lab_order_id === finalizedLab.order!.id, `Biological specimen strictly bound to parent lab order: ${finalizedLab.order!.id}`);

  // ------------------------------------------------------------
  // STAGE 6: Phase 9 Pharmacy FEFO Inventory & Dispensing
  // ------------------------------------------------------------
  console.log("\nSTAGE 6: Pharmacy FEFO Stock Evaluation & Order Dispensing");
  const avail = PharmacyInventoryService.evaluatePharmacyAvailability(
    finalizedRx.prescription!.id,
    "PHARM-FAC-1001"
  );
  assert(Boolean(avail && avail.items.length > 0), "FEFO inventory engine evaluated batch availability for prescription");

  // ------------------------------------------------------------
  // STAGE 7: Phase 10 Itemized Billing, 5-Tier Waterfall & Settlement
  // ------------------------------------------------------------
  console.log("\nSTAGE 7: Itemized Billing Engine, 5-Tier Waterfall & Settlement");
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
  assert(draftBillRes.success && Boolean(draftBillRes.bill), `Generated itemized draft bill: ${draftBillRes.bill?.id}`);
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

  // Payment Settlement
  const actorUser = findIdentityById("PAT-1001");
  const intentRes = PaymentProcessingService.createPaymentIntent({
    billId: bill.id,
    amount: updatedBill.patient_responsibility || updatedBill.net_billable_total || updatedBill.gross_total,
    idempotencyKey: `IDEM-PAY-${Date.now()}`,
    actor: actorUser,
  });
  assert(intentRes.success && Boolean(intentRes.intent), "Created payment intent");

  const payAttempt = PaymentProcessingService.executePaymentAttempt({
    intentId: intentRes.intent!.id,
    paymentMethod: "UPI",
    transactionReference: `REF-TXN-${Date.now()}`,
    actor: actorUser,
  });
  assert(payAttempt.success && payAttempt.payment?.status === "SUCCESS", `Payment settlement completed: ₹${payAttempt.payment?.amount} (Receipt: ${payAttempt.payment?.receipt_number})`);

  // ------------------------------------------------------------
  // STAGE 8: Cross-Role Data Consistency & Relational Invariants
  // ------------------------------------------------------------
  console.log("\nSTAGE 8: Cross-Role Relational Consistency & Zero-Leakage Validation");
  const loadedBill = getBillById(bill.id);
  assert(loadedBill !== null && loadedBill.gross_total === updatedBill.gross_total, "Authoritative bill balance preserved invariant under settlement");

  const loadedPrescription = getPrescriptionById(finalizedRx.prescription!.id);
  assert(loadedPrescription !== null && loadedPrescription.patient_id === "PAT-1001", "Prescription strictly bound to Patient A");

  const loadedOrder = getLabOrderById(finalizedLab.order!.id);
  assert(loadedOrder !== null && loadedOrder.encounter_id === enc.id, "Diagnostic order maintains foreign key link to encounter");

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`S7 INTEGRATION TEST SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("============================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runS7IntegrationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
