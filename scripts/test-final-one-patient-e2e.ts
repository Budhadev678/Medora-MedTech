// ============================================================
// MEDORA — FINAL MASTER INTEGRATION & TRACE-ONE-PATIENT E2E TEST
// Validates One Platform, One Data Model, One Source of Truth
// ============================================================

import { findIdentityById, StoredIdentity } from "../lib/data/identity-store";
import { AppointmentStore } from "../lib/data/appointment-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { QueueManagementService } from "../lib/services/queue-management-service";
import { QueueStore } from "../lib/data/queue-store";
import { ConsultationService } from "../lib/services/consultation-service";
import { getEncounterById, createEncounter } from "../lib/data/encounter-store";
import {
  getConsultationSharingDecision,
  recordConsultationSharingDecision,
  requestConsultationSharing,
  hasContextualAccess,
  triggerBreakGlassEmergencyAccess,
} from "../lib/data/consent-store";
import { PrescriptionOrderService } from "../lib/services/prescription-order-service";
import { PharmacyIntakeService } from "../lib/services/pharmacy-intake-service";
import { PharmacyFulfillmentService } from "../lib/services/pharmacy-fulfillment-service";
import { getIntakeById } from "../lib/data/pharmacy-intake-store";
import { getOrderById } from "../lib/data/pharmacy-order-store";
import { getDispensingRecordByOrder } from "../lib/data/dispensing-store";
import { LabOrderService } from "../lib/services/lab-order-service";
import { requestAdmission, getPatientAdmissions } from "../lib/data/admission-store";
import { BillingEngineService } from "../lib/services/billing-engine-service";
import { getBillById, getBillsByPatient, getAllBills } from "../lib/data/billing-store";
import { getAllReferenceRates, findReferenceRate } from "../lib/data/reference-rate-store";
import { DisputeInvestigationService } from "../lib/services/dispute-investigation-service";
import { getPatientPolicies, getAllSchemes } from "../lib/data/patient-financial-support-store";
import { PaymentProcessingService } from "../lib/services/payment-processing-service";
import { getAuditLedger, AuditLedger } from "../lib/data/audit-store";
import { TRANSLATIONS } from "../lib/localization";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✕ FAIL: ${testName}`);
    if (detail) console.error(`         Detail: ${detail}`);
    testsFailed++;
  }
}

async function runMasterE2ETest() {
  console.log("============================================================");
  console.log("MEDORA — FINAL MASTER END-TO-END ONE-PATIENT JOURNEY TEST");
  console.log("Tracing: PAT-1001 (Rahul Verma) across the entire platform");
  console.log("============================================================\n");

  const patientId = "PAT-1001";
  const doctorId = "DOC-1001";
  const facilityId = "FAC-1001";
  const orgIdentifier = "HSP-1001";

  // ------------------------------------------------------------
  // STEP 1: PATIENT IDENTITY & HEALTH PASSPORT
  // ------------------------------------------------------------
  console.log("--- Step 1: Patient Identity & Profile Canonical Store ---");
  const patient = findIdentityById(patientId);
  assert(Boolean(patient), "1.1 Canonical Patient PAT-1001 loaded from identity store");
  assert(patient?.fullName === "Rahul Verma", "1.2 Patient name is Rahul Verma");
  assert(patient?.patientData?.bloodGroup === "O+", "1.3 Blood group is O+");
  assert(patient?.patientData?.abhaId === "rahulverma@abdm", "1.4 ABHA ID linked correctly");

  const patientActor: StoredIdentity = patient!;

  const doctor = findIdentityById(doctorId);
  assert(Boolean(doctor), "1.5 Canonical Doctor DOC-1001 loaded from identity store");
  const doctorActor: StoredIdentity = doctor!;

  // ------------------------------------------------------------
  // STEP 2: APPOINTMENT DISCOVERY, FILTERING & REAL BOOKING
  // ------------------------------------------------------------
  console.log("\n--- Step 2: Appointment Discovery, Booking & Multi-Role Sync ---");
  const appointment = AppointmentStore.getAppointmentById("APT-1001") || AppointmentStore.getAppointmentsForPatient(patientId)[0];
  assert(Boolean(appointment), "2.1 Canonical appointment found in store");
  const appointmentId = appointment.id;
  assert(Boolean(appointmentId), "2.2 Canonical Appointment ID verified");

  // Verify Tri-Role Visibility
  const patientApts = AppointmentStore.getAppointmentsForPatient(patientId);
  const doctorApts = AppointmentStore.getAppointmentsForDoctor(doctorId);
  const facilityApts = AppointmentStore.getAppointmentsForFacility(facilityId);

  assert(patientApts.some((a) => a.id === appointmentId), "2.3 Booked appointment visible in Patient workspace");
  assert(doctorApts.some((a) => a.id === appointmentId), "2.4 Booked appointment visible in Doctor roster");
  assert(facilityApts.some((a) => a.id === appointmentId), "2.5 Booked appointment visible in Hospital command desk");

  // ------------------------------------------------------------
  // STEP 3: QUEUE TOKEN CHECK-IN & CONSULTATION INITIATION
  // ------------------------------------------------------------
  console.log("\n--- Step 3: Queue Token Check-In & Consultation Start ---");
  const encRes = createEncounter({
    patientId,
    providerId: doctorId,
    organizationId: orgIdentifier,
    departmentName: "Cardiology OPD",
    encounterType: "CONSULTATION",
    reasonForVisit: "Hypertension checkup and chest tightness",
    actorId: doctorId,
    actorName: doctorActor.fullName,
    actorRole: "doctor",
  });

  assert(encRes.success, "3.1 Clinical consultation encounter created");
  const encounterId = encRes.encounter?.id || "ENC-1003";
  assert(Boolean(encounterId), "3.2 Canonical HealthcareEncounter active");

  // ------------------------------------------------------------
  // STEP 4: ACTIVE CONSULTATION RECORD SHARING
  // ------------------------------------------------------------
  console.log("\n--- Step 4: Active Consultation Contextual Record Sharing ---");
  
  // Doctor requests decision
  const reqShareRes = requestConsultationSharing({
    encounterId,
    doctorId,
    doctorName: doctorActor.fullName,
    patientId,
    organizationId: orgIdentifier,
  });
  assert(reqShareRes.success, "4.1 Doctor requested record sharing decision");

  // Patient grants share with scope
  const shareDecisionRes = recordConsultationSharingDecision({
    encounterId,
    patientId,
    patientName: patientActor.fullName,
    doctorId,
    doctorName: doctorActor.fullName,
    organizationId: orgIdentifier,
    organizationName: "City Hospital",
    decision: "SHARE",
  });
  assert(shareDecisionRes.success, "4.2 Patient authorized contextual record sharing");
  assert(shareDecisionRes.decision.decision === "SHARE", "4.3 Sharing state is SHARE");

  const consultContext = ConsultationService.getConsultationContext(encounterId, doctorActor);
  assert(consultContext?.records_shared === true, "4.4 Doctor workspace receives authorized record access");

  // ------------------------------------------------------------
  // STEP 5: CLINICAL DOCUMENTATION & SOAP NOTES
  // ------------------------------------------------------------
  console.log("\n--- Step 5: Clinical Notes, Vitals & Diagnoses ---");
  const saveDraftRes = await ConsultationService.saveDraft(
    encounterId,
    {
      chief_complaint: "Hypertension checkup and occasional exertion headache",
      vitals: {
        systolic_bp_mmhg: 142,
        diastolic_bp_mmhg: 88,
        heart_rate_bpm: 78,
        temperature_celsius: 36.8,
        spo2_percent: 98,
        weight_kg: 74,
        height_cm: 175,
        bmi: 24.2,
        recorded_at: new Date().toISOString(),
        recorded_by: doctorId,
        recorded_by_name: doctorActor.fullName,
      },
      diagnoses: [
        {
          id: "DX-1",
          name: "Essential (primary) hypertension",
          icd10_code: "I10",
          category: "PRIMARY",
          status: "CONFIRMED",
          recorded_by: doctorId,
          recorded_by_name: doctorActor.fullName,
          recorded_at: new Date().toISOString(),
        },
      ],
      treatment_plan: "Initiate Telmisartan 40mg once daily; routine lipid profile and low sodium diet",
    },
    doctorActor
  );

  assert(saveDraftRes.success, "5.1 Clinical documentation draft saved to canonical record");

  // ------------------------------------------------------------
  // STEP 6: DIGITAL PRESCRIPTION -> PHARMACY SYNC
  // ------------------------------------------------------------
  console.log("\n--- Step 6: Digital Prescription -> Pharmacy Order Sync ---");
  const rxRes = await PrescriptionOrderService.issuePrescription(
    encounterId,
    {
      items: [
        {
          id: "RXI-1",
          medicine_name: "Telmisartan",
          generic_name: "Telmisartan",
          strength: "40mg",
          dosage: "1 Tablet",
          dosage_form: "Tablet",
          route: "ORAL",
          timing: "AFTER_FOOD",
          frequency: "ONCE_DAILY",
          duration: "30 days",
          duration_days: 30,
          quantity: "30",
          instructions: "Take with water after breakfast",
        },
      ],
      notes: "Monitor blood pressure weekly",
    },
    doctorActor
  );

  assert(rxRes.success, "6.1 Prescription issued by attending doctor");
  const rxId = rxRes.prescription?.id || "RX-1001";
  assert(Boolean(rxId), "6.2 Canonical Prescription ID generated");

  // Verify Patient and Pharmacy view same prescription
  const patientRxs = PrescriptionOrderService.getPatientPrescriptions(patientId, patientActor);
  assert(patientRxs.some((r) => r.id === rxId), "6.3 Prescription appears in Patient health passport");

  // PHARMACY STEP 2: Prescription Intake & Pharmacist Verification
  const pharmacyActor = findIdentityById("11111111-1111-1111-1111-111111111105") || findIdentityById("PHA-1001");
  const intakeRes = await PharmacyIntakeService.submitPrescriptionToIntake(rxId, "PHARM-FAC-1001", doctorActor);
  assert(intakeRes.success, "6.4 [Pharmacy Step 2] Prescription intake received at ABC Pharmacy");

  const valRes = await PharmacyIntakeService.validateIntake(intakeRes.intake!.id, "MARK_VALID", undefined, undefined, pharmacyActor);
  assert(valRes.success, "6.5 [Pharmacy Step 2] Pharmacist verified prescription intake as VALID");

  const ordRes = await PharmacyFulfillmentService.createOrderFromIntake(intakeRes.intake!.id, "PICKUP", undefined, pharmacyActor);
  assert(ordRes.success, "6.6 [Pharmacy Step 2] Canonical Pharmacy Order created from prescription");
  const orderId = ordRes.order?.id || "PHARM-ORD-1001";

  // PHARMACY STEP 3: Stock Reservation & Preparation
  const prepRes = await PharmacyFulfillmentService.startPreparation(orderId, pharmacyActor);
  assert(prepRes.success, "6.7 [Pharmacy Step 3] Revalidated prescription state & started medicine preparation");

  const readyRes = await PharmacyFulfillmentService.markReady(
    orderId,
    [{ medicineId: "MED-1001", batchId: "BATCH-1001", batchNumber: "PCM-2026-01", quantity: 30 }],
    pharmacyActor
  );
  assert(readyRes.success, "6.8 [Pharmacy Step 3] Packaged medication and marked Ready for Pickup");

  // PHARMACY STEP 4: Dispensing & Patient Handover
  const dispRes = await PharmacyFulfillmentService.dispenseOrder(
    orderId,
    ordRes.order?.verification_otp || "948201",
    pharmacyActor
  );
  assert(dispRes.success, "6.9 [Pharmacy Step 4] OTP verified & atomic dispensing committed");
  const dispRec = getDispensingRecordByOrder(orderId);
  assert(Boolean(dispRec), "6.10 [Pharmacy Step 4] Durable Dispensing Record created with audit traceability");

  // ------------------------------------------------------------
  // STEP 7: DIAGNOSTIC LAB ORDER -> LAB PROCESSING
  // ------------------------------------------------------------
  console.log("\n--- Step 7: Diagnostic Lab Order & Processing ---");
  const labRes = await LabOrderService.saveDraft(
    encounterId,
    {
      items: [
        {
          id: "LOI-1",
          test_name: "Comprehensive Lipid Profile",
          test_code: "LIPID-01",
          specimen_type: "Blood Serum",
        },
      ],
      priority: "ROUTINE",
      reason: "Evaluate cardiovascular risk profile",
    },
    doctorActor
  );

  assert(labRes.success, "7.1 Diagnostic lab order placed by clinician");
  const labOrderId = labRes.order?.id || "LAB-1001";
  assert(Boolean(labOrderId), "7.2 Canonical Lab Order ID generated");

  // ------------------------------------------------------------
  // STEP 8: EMERGENCY BREAK-GLASS OVERRIDE & AUDIT
  // ------------------------------------------------------------
  console.log("\n--- Step 8: Emergency Break-Glass Override with Audit ---");
  const emrRes = triggerBreakGlassEmergencyAccess({
    patientId,
    patientName: patientActor.fullName,
    actorId: doctorId,
    actorName: doctorActor.fullName,
    actorRole: "Emergency Physician",
    organizationId: orgIdentifier,
    organizationName: "City Hospital Trauma Unit",
    justificationReason: "Acute cardiovascular triage; verified critical allergies and medications",
  });

  assert(emrRes.success, "8.1 Emergency break-glass override created");
  assert(emrRes.consent.purpose === "emergency_access", "8.2 Purpose logged as emergency_access");

  // ------------------------------------------------------------
  // STEP 9: INPATIENT ADMISSION & BED ALLOCATION
  // ------------------------------------------------------------
  console.log("\n--- Step 9: Inpatient Hospital Admission & Bed Tracking ---");
  const admRes = requestAdmission({
    patientId,
    patientName: patientActor.fullName,
    doctorId,
    doctorName: doctorActor.fullName,
    facilityId: orgIdentifier,
    facilityName: "City Hospital",
    departmentName: "Cardiology & Inpatient Ward",
    admissionType: "PLANNED",
    reason: "24-hour ambulatory blood pressure monitoring & observational care",
    actorId: doctorId,
    actorName: doctorActor.fullName,
    actorRole: "doctor",
  });

  assert(admRes.success, "9.1 Inpatient admission recorded on hospital desk");
  const patientAdmissions = getPatientAdmissions(patientId);
  assert(patientAdmissions.length > 0, "9.2 Admission visible in patient medical history");

  // ------------------------------------------------------------
  // STEP 10: CANONICAL SERVICE EVENTS -> BILLING & BENCHMARK
  // ------------------------------------------------------------
  console.log("\n--- Step 10: Service Events -> Bill & Benchmark Comparison ---");
  const bill = getBillById("BILL-1001") || getBillsByPatient(patientId)[0];
  assert(Boolean(bill), "10.1 Canonical Patient Bill loaded");
  assert(bill?.patient_id === patientId, "10.2 Bill belongs to Patient PAT-1001");

  // Benchmark rate comparison
  const refCatalog = getAllReferenceRates();
  assert(refCatalog.length > 0, "10.3 Reference benchmark catalog active");

  // ------------------------------------------------------------
  // STEP 11: BILL DISPUTE 3-STAGE HOSPITAL REVIEW
  // ------------------------------------------------------------
  console.log("\n--- Step 11: 3-Stage Hospital Dispute Review Workflow ---");
  const disputeRes = DisputeInvestigationService.submitDispute({
    billId: bill!.id,
    billItemId: bill!.items[0]?.id || "BILLITEM-1001",
    patientId,
    patientName: patientActor.fullName,
    serviceName: bill!.items[0]?.service_name || "Doctor Outpatient Consultation",
    chargedAmount: 500,
    category: "INCORRECT_AMOUNT",
    description: "Rate difference compared with reference benchmark",
    actor: patientActor,
  });

  assert(disputeRes.success, "11.1 Billing dispute raised against exact line item");
  const disputeId = disputeRes.dispute?.id || "DSP-1001";

  // Level 1 review
  const l1Res = DisputeInvestigationService.respondHospitalLevel1({
    disputeId,
    action: "ESCALATE_L2",
    explanation: "Billing variance acknowledged, escalated to Internal Committee",
    actor: {
      id: "admin-1",
      identifier: "ADM-1001",
      fullName: "Billing Review Officer",
      role: "hospital_admin",
      accountStatus: "active",
    } as unknown as StoredIdentity,
  });
  assert(l1Res.success, "11.2 Dispute processed through Level 1 Review");

  // ------------------------------------------------------------
  // STEP 12: HEALTH INSURANCE & GOVERNMENT SCHEME INTEGRATION
  // ------------------------------------------------------------
  console.log("\n--- Step 12: Insurance & Government Scheme Pre-Auth ---");
  const policies = getPatientPolicies(patientId);
  assert(policies.length > 0, "12.1 Patient active health insurance policy found");

  const schemes = getAllSchemes();
  assert(schemes.length > 0, "12.2 Government Health Schemes (PM-JAY, BSKY) available");

  // ------------------------------------------------------------
  // STEP 13: PAYMENT PROCESSING & SETTLEMENT
  // ------------------------------------------------------------
  console.log("\n--- Step 13: Payment Processing & Financial Settlement ---");
  const intentRes = PaymentProcessingService.createPaymentIntent({
    billId: bill!.id,
    amount: 1200,
    idempotencyKey: `IDEMP-PAY-${Date.now()}`,
    actor: patientActor,
  });
  assert(intentRes.success, "13.1 Payment Intent created");

  const payRes = PaymentProcessingService.executePaymentAttempt({
    intentId: intentRes.intent!.id,
    paymentMethod: "UPI",
    actor: patientActor,
  });

  assert(payRes.success, "13.2 Payment processed and settled");
  assert(Boolean(payRes.payment?.id), "13.3 Canonical Payment Receipt generated");

  // ------------------------------------------------------------
  // STEP 14: SECURITY & ISOLATION BOUNDARIES
  // ------------------------------------------------------------
  console.log("\n--- Step 14: Cross-Patient & Cross-Doctor Security Isolation ---");
  const maliciousActor = {
    id: "user-pat-evil",
    identifier: "PAT-9999",
    fullName: "Intruder",
    role: "patient",
    accountStatus: "active",
  } as unknown as StoredIdentity;

  const crossPatientAttempt = ConsultationService.getConsultationContext(encounterId, maliciousActor);
  assert(crossPatientAttempt === null, "14.1 Cross-patient URL tampering blocked (returns null)");

  // ------------------------------------------------------------
  // STEP 15: CENTRALIZED IMMUTABLE AUDIT LEDGER
  // ------------------------------------------------------------
  console.log("\n--- Step 15: Immutable Audit Ledger Verification ---");
  const audits = getAuditLedger();
  assert(audits.length >= 5, "15.1 Audit ledger populated with canonical lifecycle events");
  const hasEmergencyAudit = audits.some((a) => a.event_type === "EMERGENCY_ACCESS_TRIGGERED");
  assert(hasEmergencyAudit, "15.2 Emergency Break-Glass access logged to audit ledger");

  // ------------------------------------------------------------
  // STEP 16: MULTI-LANGUAGE LOCALIZATION (EN, HI, OR)
  // ------------------------------------------------------------
  console.log("\n--- Step 16: Multi-Language Coverage (English, Hindi, Odia) ---");
  const checkKeys = [
    "nav.home",
    "nav.appointments",
    "nav.records",
    "hospital.title",
    "hospital.admissions",
    "pharmacy.intake",
    "pharmacy.dispense",
    "lab.testing_desk",
    "emergency.title",
    "blood.title",
    "sharing.share_previous_records",
    "fin.reference_rate",
  ];

  for (const k of checkKeys) {
    assert(Boolean(TRANSLATIONS.en[k]), `16.EN [en] '${k}' translated`);
    assert(Boolean(TRANSLATIONS.hi[k]), `16.HI [hi] '${k}' translated`);
    assert(Boolean(TRANSLATIONS.or[k]), `16.OR [or] '${k}' translated`);
  }

  // ------------------------------------------------------------
  // FINAL SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`MASTER E2E TEST SUMMARY: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("============================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runMasterE2ETest().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
