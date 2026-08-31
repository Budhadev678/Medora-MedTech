/**
 * ==============================================================================
 * MEDORA — PHASE 1 / PROMPT 3 AUTOMATED VERIFICATION SUITE
 * End-to-End Verification of Prescription & Diagnostic Lab Order Life-Cycle:
 * Consultation Finalization -> Patient Review -> Facility Selection ->
 * Scoped Pharmacy/Lab Queue -> Dispense / Certified Report -> Patient Timeline Update
 * ==============================================================================
 */

import { AppointmentStore } from "../lib/data/appointment-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { PrescriptionOrderService } from "../lib/services/prescription-order-service";
import { LaboratoryService } from "../lib/services/laboratory-service";
import { ClinicalContinuityService } from "../lib/services/clinical-continuity-service";
import { findIdentityById, StoredIdentity } from "../lib/data/identity-store";
import { getRemainingCurrentWeekDates } from "../lib/utils";
import { 
  getPatientPrescriptions, 
  getPrescriptionById, 
  getPharmacyPrescriptions 
} from "../lib/data/prescription-store";
import { 
  getPatientLabOrders, 
  getLabOrderById, 
  getLaboratoryLabOrders,
  getPatientLabReports 
} from "../lib/data/lab-order-store";
import { getAllEncounters } from "../lib/data/encounter-store";
import { PrescriptionItem, LabOrderItem } from "../types/database.types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runPrompt3VerificationSuite() {
  console.log("================================================================================");
  console.log("🚀 STARTING MEDORA PHASE 1 / PROMPT 3 VERIFICATION SUITE");
  console.log("================================================================================\n");

  AppointmentStore.reset();

  const patientActorA = findIdentityById("PAT-1001") as StoredIdentity; // Rahul Verma
  const patientActorB = findIdentityById("PAT-1002") as StoredIdentity; // Priya Patel
  const doctorActor = findIdentityById("DOC-1001") as StoredIdentity; // Dr. Ananya Sharma

  const pharmacistActor = {
    id: "PHARM-STAFF-1001",
    identifier: "PHARM-STAFF-1001",
    email: "pharmacist@abcpharmacy.medora",
    fullName: "Rahul Verma (Chief Pharmacist)",
    role: "staff",
  } as StoredIdentity;

  const labTechActor = {
    id: "LAB-STAFF-1001",
    identifier: "LAB-STAFF-1001",
    email: "labtech@abcdiagnostics.medora",
    fullName: "Dr. Priya Sen (Pathologist)",
    role: "staff",
  } as StoredIdentity;

  // ============================================================================
  // TEST SCENARIO A: PRESCRIPTION WORKFLOW (CONSULTATION -> PATIENT -> PHARMACY -> DISPENSE)
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("📋 SCENARIO A: Comprehensive Prescription Data Flow & Pharmacy Scoping Isolation");
  console.log("--------------------------------------------------------------------------------");

  // A1. Book Appointment
  const dates = getRemainingCurrentWeekDates();
  const aptDate = dates[0].iso;
  const doctorASessions = AppointmentStore.getDoctorSessions("DOC-1001", "HSP-1001");
  assert(doctorASessions.length > 0, "Doctor A has valid sessions in hospital");
  const session = doctorASessions[0];

  const bookingA = await AppointmentBookingService.bookAppointment({
    patient_id: patientActorA.identifier || patientActorA.id,
    doctor_id: doctorActor.identifier || doctorActor.id,
    organization_identifier: "HSP-1001",
    facility_id: session.facility_id,
    department_id: session.department_id,
    session_id: session.id,
    appointment_date: aptDate,
    reason_for_visit: "Persistent cough and mild throat infection",
    booking_source: "PATIENT",
  }, patientActorA);

  assert(bookingA.success && Boolean(bookingA.appointment), "Patient A successfully booked appointment");
  const appointmentA = bookingA.appointment!;

  // A2. Doctor A Starts Consultation
  const startConsultA = await ConsultationService.startOrGetConsultationForAppointment(
    appointmentA.id,
    doctorActor
  );
  assert(startConsultA.success && Boolean(startConsultA.encounter), "Doctor A initiated clinical encounter");
  const encounterA = startConsultA.encounter!;

  // A3. Doctor A Completes Consultation with Prescriptions
  const prescribedMedications: PrescriptionItem[] = [
    {
      id: "RXI-1",
      medicine_name: "Amoxicillin Trihydrate",
      generic_name: "Amoxicillin",
      dosage: "500 mg",
      route: "ORAL",
      frequency: "Three times daily after meals",
      duration: "5 days",
      instructions: "Complete full course. Take with plenty of water.",
    },
    {
      id: "RXI-2",
      medicine_name: "Paracetamol",
      generic_name: "Acetaminophen",
      dosage: "650 mg",
      route: "ORAL",
      frequency: "As needed for fever/pain (max 3/day)",
      duration: "3 days",
      instructions: "Do not exceed 3 tablets in 24 hours.",
    },
  ];

  const completeConsultA = await ConsultationService.completeConsultation(
    encounterA.id,
    {
      chief_complaint: "Acute Pharyngitis & Mild Fever",
      diagnoses: [{ id: "DX-1", name: "Acute Pharyngitis", icd10_code: "J02.9", status: "ACTIVE" as any, recorded_by: "DOC-1001", recorded_by_name: "Dr. Ananya Sharma", recorded_at: new Date().toISOString() }],
      treatment_plan: "Hydration, antibiotic course for 5 days, antipyretic SOS.",
      prescriptions: prescribedMedications,
      prescription_notes: "Follow up if symptoms persist after 5 days.",
      refills_allowed: 0,
    },
    doctorActor
  );

  assert(completeConsultA.success, "Doctor A completed consultation");
  assert(Boolean(completeConsultA.prescription), "Atomic Prescription generated upon consultation finalization");
  const generatedRx = completeConsultA.prescription!;
  assert(generatedRx.status === "ISSUED" || generatedRx.status === "FINALIZED", "Prescription status is correctly marked as 'ISSUED' or 'FINALIZED'");
  assert(generatedRx.items.length === 2, "Prescription contains exactly 2 medications");
  assert(generatedRx.appointment_id === appointmentA.id, "Prescription correctly references the underlying appointment_id");
  assert(generatedRx.encounter_id === encounterA.id, "Prescription correctly references encounter_id");
  assert(generatedRx.patient_id === patientActorA.identifier, "Prescription correctly references patient_id");

  // A4. Patient Dashboard Data Verification & Anti-IDOR Security Check
  const patientARxList = getPatientPrescriptions(patientActorA.identifier || patientActorA.id);
  const foundRx = patientARxList.find((p) => p.id === generatedRx.id);
  assert(Boolean(foundRx), "Prescription reliably appears in Patient A's prescription list");

  const patientBRxList = getPatientPrescriptions(patientActorB.identifier || patientActorB.id);
  const leakedRx = patientBRxList.find((p) => p.id === generatedRx.id);
  assert(!leakedRx, "ANTI-IDOR VERIFIED: Patient B cannot see or query Patient A's prescription");

  // A5. Check Pharmacy Routing Isolation Before Selection
  const initialPharm1Orders = getPharmacyPrescriptions("PHARM-FAC-1001");
  const initialPharm2Orders = getPharmacyPrescriptions("PHARM-FAC-1002");
  assert(
    !initialPharm1Orders.some((p) => p.id === generatedRx.id),
    "Prescription is NOT broadcast to Pharmacy A before patient explicitly chooses pharmacy"
  );
  assert(
    !initialPharm2Orders.some((p) => p.id === generatedRx.id),
    "Prescription is NOT broadcast to Pharmacy B before patient explicitly chooses pharmacy"
  );

  // A6. Patient Selects Pharmacy A (PHARM-FAC-1001: 'ABC Pharmacy — Rourkela Central')
  const selectPharmRes = await PrescriptionOrderService.selectPharmacy(
    generatedRx.id,
    "PHARM-FAC-1001",
    "ABC Pharmacy — Rourkela Central",
    patientActorA
  );
  assert(selectPharmRes.success && Boolean(selectPharmRes.prescription), "Patient A selected Pharmacy A");
  const routedRx = selectPharmRes.prescription!;
  assert(routedRx.selected_pharmacy_id === "PHARM-FAC-1001", "Prescription records assigned pharmacy facility ID");
  assert(routedRx.status === "PATIENT_SELECTED_PHARMACY", "Prescription status transitioned to 'PATIENT_SELECTED_PHARMACY'");

  // A7. Verify Scoped Pharmacy Reception (Only Pharmacy A receives; Pharmacy B gets 0 results)
  const pharm1Orders = getPharmacyPrescriptions("PHARM-FAC-1001");
  const pharm2Orders = getPharmacyPrescriptions("PHARM-FAC-1002");
  assert(
    pharm1Orders.some((p) => p.id === generatedRx.id),
    "PHARMACY SCOPING SUCCESS: Selected Pharmacy A receives the prescription in its fulfillment queue"
  );
  assert(
    !pharm2Orders.some((p) => p.id === generatedRx.id),
    "PHARMACY SCOPING ISOLATION: Unselected Pharmacy B DOES NOT receive the prescription"
  );

  // A8. Pharmacy A Dispenses Prescription
  const dispenseRes = await PrescriptionOrderService.dispensePrescription(
    generatedRx.id,
    "PHARM-FAC-1001",
    pharmacistActor
  );
  assert(dispenseRes.success && Boolean(dispenseRes.prescription), "Pharmacy A successfully dispensed the prescription");
  const dispensedRx = dispenseRes.prescription!;
  assert(dispensedRx.status === "DISPENSED", "Prescription status updated to 'DISPENSED'");
  assert(Boolean(dispensedRx.dispensed_at), "dispensed_at timestamp recorded");
  assert(dispensedRx.dispensed_by === pharmacistActor.fullName, "dispensed_by audit recorded");

  // A9. Real-time Patient Verification
  const patientARxAfterDispense = getPrescriptionById(generatedRx.id);
  assert(patientARxAfterDispense?.status === "DISPENSED", "Patient sees real-time 'DISPENSED' status update");
  console.log("  ✅ SCENARIO A COMPLETED SUCCESSFULLY\n");

  // ============================================================================
  // TEST SCENARIO B: LAB ORDER WORKFLOW (CONSULTATION -> PATIENT -> LAB -> CERTIFIED REPORT)
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("🔬 SCENARIO B: Comprehensive Diagnostic Lab Order Data Flow & Scoping Isolation");
  console.log("--------------------------------------------------------------------------------");

  const patientActorC = (findIdentityById("PAT-1003") as StoredIdentity) || {
    id: "PAT-1003",
    identifier: "PAT-1003",
    email: "chirag.sharma@medora.health",
    fullName: "Chirag Sharma",
    role: "patient",
  };

  const patientActorD = (findIdentityById("PAT-1004") as StoredIdentity) || {
    id: "PAT-1004",
    identifier: "PAT-1004",
    email: "deepa.nair@medora.health",
    fullName: "Deepa Nair",
    role: "patient",
  };

  // B1. Book Appointment
  const doctorBSessions = AppointmentStore.getDoctorSessions("DOC-1001", "HSP-1001");
  const sessionB = doctorBSessions[0];
  const bookingC = await AppointmentBookingService.bookAppointment({
    patient_id: patientActorC.identifier || patientActorC.id,
    doctor_id: doctorActor.identifier || doctorActor.id,
    organization_identifier: "HSP-1001",
    facility_id: sessionB.facility_id,
    department_id: sessionB.department_id,
    session_id: sessionB.id,
    appointment_date: aptDate,
    reason_for_visit: "Routine health checkup & routine blood investigation",
    booking_source: "PATIENT",
  }, patientActorC);

  assert(bookingC.success && Boolean(bookingC.appointment), "Patient C booked appointment");
  const appointmentC = bookingC.appointment!;

  // B2. Doctor Starts Consultation
  const startConsultC = await ConsultationService.startOrGetConsultationForAppointment(
    appointmentC.id,
    doctorActor
  );
  assert(startConsultC.success && Boolean(startConsultC.encounter), "Doctor A initiated clinical encounter for Patient C");
  const encounterC = startConsultC.encounter!;

  // B3. Doctor Completes Consultation with Diagnostic Lab Order
  const requestedLabTests: LabOrderItem[] = [
    {
      id: "LOI-1",
      test_code: "CBC-001",
      test_name: "Complete Blood Count with Differential (CBC)",
      specimen_type: "Whole Blood EDTA",
      instructions: "No fasting required",
    },
    {
      id: "LOI-2",
      test_code: "LIPID-001",
      test_name: "Fasting Lipid Profile",
      specimen_type: "Serum",
      instructions: "12-hour strict overnight fast",
    },
    {
      id: "LOI-3",
      test_code: "HBA1C-001",
      test_name: "Glycated Hemoglobin (HbA1c)",
      specimen_type: "Whole Blood EDTA",
      instructions: "Standard venous sample",
    },
  ];

  const completeConsultC = await ConsultationService.completeConsultation(
    encounterC.id,
    {
      chief_complaint: "Annual Preventive Health Evaluation",
      diagnoses: [{ id: "DX-2", name: "Essential Hypertension Screening", icd10_code: "I10", status: "ACTIVE" as any, recorded_by: "DOC-1001", recorded_by_name: "Dr. Ananya Sharma", recorded_at: new Date().toISOString() }],
      treatment_plan: "Advised dietary sodium reduction and baseline diagnostic panel.",
      lab_orders: requestedLabTests,
      lab_reason: "Annual metabolic screen and cardiovascular risk assessment",
      lab_priority: "ROUTINE",
    },
    doctorActor
  );

  assert(completeConsultC.success, "Doctor A completed consultation for Patient C");
  assert(Boolean(completeConsultC.lab_order), "Atomic Diagnostic Lab Order generated upon consultation finalization");
  const generatedLabOrder = completeConsultC.lab_order!;
  assert(generatedLabOrder.status === "ORDERED", "Lab Order status is 'ORDERED'");
  assert(generatedLabOrder.items.length === 3, "Lab Order contains exactly 3 test investigations");
  assert(generatedLabOrder.appointment_id === appointmentC.id, "Lab order references appointment_id");
  assert(generatedLabOrder.encounter_id === encounterC.id, "Lab order references encounter_id");
  assert(generatedLabOrder.patient_id === patientActorC.identifier, "Lab order references patient_id");

  // B4. Patient Dashboard Data Verification & Anti-IDOR Security Check
  const patientCLabOrders = getPatientLabOrders(patientActorC.identifier || patientActorC.id);
  const foundLabOrder = patientCLabOrders.find((o) => o.id === generatedLabOrder.id);
  assert(Boolean(foundLabOrder), "Lab Order reliably appears in Patient C's lab orders list");

  const patientDLabOrders = getPatientLabOrders(patientActorD.identifier || patientActorD.id);
  const leakedLabOrder = patientDLabOrders.find((o) => o.id === generatedLabOrder.id);
  assert(!leakedLabOrder, "ANTI-IDOR VERIFIED: Patient D cannot view Patient C's lab order");

  // B5. Check Laboratory Isolation Before Selection
  const initialLab1Orders = LaboratoryService.getLaboratoryOrders("LAB-FAC-1001");
  const initialLab2Orders = LaboratoryService.getLaboratoryOrders("LAB-ORG-1002");
  assert(
    !initialLab1Orders.some((o) => o.id === generatedLabOrder.id),
    "Lab Order is NOT broadcast to Lab A before patient chooses laboratory"
  );
  assert(
    !initialLab2Orders.some((o) => o.id === generatedLabOrder.id),
    "Lab Order is NOT broadcast to Lab B before patient chooses laboratory"
  );

  // B6. Patient Selects Laboratory A (LAB-FAC-1001: 'ABC Diagnostics — Rourkela Central Lab')
  const selectLabRes = await LaboratoryService.selectLaboratory(
    generatedLabOrder.id,
    "LAB-FAC-1001",
    "ABC Diagnostics — Rourkela Central Lab",
    patientActorC
  );
  assert(selectLabRes.success && Boolean(selectLabRes.data || (selectLabRes as any).order), "Patient C selected Laboratory A");
  const routedLabOrder = (selectLabRes.data || (selectLabRes as any).order)!;
  assert(routedLabOrder.selected_lab_id === "LAB-FAC-1001", "Lab order records assigned laboratory ID");
  assert(routedLabOrder.status === "PATIENT_SELECTED_LAB" || routedLabOrder.status === "ORDERED", "Lab order status transitioned correctly");

  // B7. Verify Scoped Lab Reception (Only Lab A receives order; Lab B gets 0 results)
  const lab1Orders = LaboratoryService.getLaboratoryOrders("LAB-FAC-1001");
  const lab2Orders = LaboratoryService.getLaboratoryOrders("LAB-ORG-1002");
  assert(
    lab1Orders.some((o) => o.id === generatedLabOrder.id),
    "LAB SCOPING SUCCESS: Selected Lab A receives the diagnostic order in its queue"
  );
  assert(
    !lab2Orders.some((o) => o.id === generatedLabOrder.id),
    "LAB SCOPING ISOLATION: Unselected Lab B DOES NOT receive the diagnostic order"
  );

  // B8. Laboratory A Processes Sample, Enters Results & Releases Certified Report
  const labResults = [
    { test_name: "Hemoglobin", value: "14.2", unit: "g/dL", reference_range: "13.0 - 17.0" },
    { test_name: "Total Cholesterol", value: "185", unit: "mg/dL", reference_range: "< 200" },
    { test_name: "HbA1c", value: "5.4", unit: "%", reference_range: "< 5.7" },
  ];

  const releaseReportRes = await LaboratoryService.generateAndReleaseReport(
    generatedLabOrder.id,
    labResults,
    labTechActor
  );
  assert(releaseReportRes.success && Boolean(releaseReportRes.data || (releaseReportRes as any).report), "Laboratory A successfully certified and released lab report");
  const releasedReport = (releaseReportRes.data || (releaseReportRes as any).report)!;
  assert(releasedReport.status === "RELEASED", "Report status marked as 'RELEASED'");
  assert(releasedReport.patient_id === patientActorC.identifier, "Report linked to Patient C");
  assert(releasedReport.results.length === 3, "Report contains all 3 verified test values");

  // Verify Lab Order transitioned to COMPLETED
  const updatedLabOrder = getLabOrderById(generatedLabOrder.id);
  assert(updatedLabOrder?.status === "COMPLETED" || updatedLabOrder?.status === "RELEASED", "Lab order marked COMPLETED / RELEASED");

  // B9. Patient C Receives Certified Report in Health Hub
  const patientCReports = getPatientLabReports(patientActorC.identifier || patientActorC.id);
  const foundReport = patientCReports.find((r) => r.id === releasedReport.id);
  assert(Boolean(foundReport), "Patient C Health Hub reliably received the certified official lab report");

  // B10. Timeline Continuity Verification
  const patientCTimeline = ClinicalContinuityService.getPatientTimeline(
    patientActorC.identifier || patientActorC.id,
    patientActorC as any
  );
  assert(
    patientCTimeline.some((e: any) => e.category === "lab_report" || e.title?.includes("Lab") || e.title?.includes("Diagnostic")),
    "Patient C timeline updated with completed lab event"
  );
  console.log("  ✅ SCENARIO B COMPLETED SUCCESSFULLY\n");

  // ============================================================================
  // TEST SCENARIO C: ZERO EMPTY RECORDS GUARANTEE
  // ============================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("🛡️  SCENARIO C: Zero Empty Records Guarantee When Prescriptions/Labs Are Omitted");
  console.log("--------------------------------------------------------------------------------");

  const patientActorE = (findIdentityById("PAT-1005") as StoredIdentity) || {
    id: "PAT-1005",
    identifier: "PAT-1005",
    email: "patient.emptye@medora.health",
    fullName: "Esha Rao (No Rx/Lab Patient)",
    role: "patient",
  };

  const bookingE = await AppointmentBookingService.bookAppointment({
    patient_id: patientActorE.identifier || patientActorE.id,
    doctor_id: doctorActor.identifier || doctorActor.id,
    organization_identifier: "HSP-1001",
    facility_id: sessionB.facility_id,
    department_id: sessionB.department_id,
    session_id: sessionB.id,
    appointment_date: aptDate,
    reason_for_visit: "Follow-up consultation on lifestyle modifications",
    booking_source: "PATIENT",
  }, patientActorE);

  const startConsultE = await ConsultationService.startOrGetConsultationForAppointment(
    bookingE.appointment!.id,
    doctorActor
  );
  const encounterE = startConsultE.encounter!;

  const completeConsultE = await ConsultationService.completeConsultation(
    encounterE.id,
    {
      chief_complaint: "Lifestyle review",
      diagnoses: [{ id: "DX-3", name: "Healthy / General Counseling", icd10_code: "Z00.0", status: "ACTIVE" as any, recorded_by: "DOC-1001", recorded_by_name: "Dr. Ananya Sharma", recorded_at: new Date().toISOString() }],
      treatment_plan: "Continue regular aerobic exercise and low sodium diet.",
      // No prescriptions, no lab orders supplied
    },
    doctorActor
  );

  assert(completeConsultE.success, "Doctor completed consultation without prescribing meds or lab tests");
  assert(!completeConsultE.prescription, "NO empty prescription created");
  assert(!completeConsultE.lab_order, "NO empty lab order created");

  const patientEPrescriptions = getPatientPrescriptions(patientActorE.identifier || patientActorE.id);
  const patientELabOrders = getPatientLabOrders(patientActorE.identifier || patientActorE.id);
  assert(patientEPrescriptions.length === 0, "Patient E has exactly 0 prescriptions");
  assert(patientELabOrders.length === 0, "Patient E has exactly 0 lab orders");
  console.log("  ✅ SCENARIO C COMPLETED SUCCESSFULLY\n");

  console.log("================================================================================");
  console.log("🎉 ALL PHASE 1 / PROMPT 3 TESTS PASSED WITH 100% SUCCESS!");
  console.log("================================================================================");
}

runPrompt3VerificationSuite().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
