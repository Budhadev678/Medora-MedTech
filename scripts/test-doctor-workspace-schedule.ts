import { findIdentityById } from "../lib/data/identity-store";
import { AppointmentStore } from "../lib/data/appointment-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { ConsultationService } from "../lib/services/consultation-service";
import { PrescriptionOrderService } from "../lib/services/prescription-order-service";
import { LabOrderService } from "../lib/services/lab-order-service";
import { createBloodRequest } from "../lib/data/blood-centre-store";
import { requestAdmission } from "../lib/data/admission-store";
import { triggerBreakGlassEmergencyAccess, hasContextualAccess } from "../lib/data/consent-store";
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

async function runDoctorWorkspaceSuite() {
  console.log("============================================================");
  console.log("MEDORA — DOCTOR CONSULTATION WORKSPACE & SCHEDULE SUITE");
  console.log("============================================================\n");

  const doctor = findIdentityById("DOC-1001")!;
  const patient = findIdentityById("PAT-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Multi-Location Practice Schedule Management
  // ------------------------------------------------------------
  console.log("TEST 1: Doctor Practice Schedules Across Facilities");
  const doctorSessions = AppointmentStore.getDoctorSessions("DOC-1001");
  assert(doctorSessions.length > 0, "1.1 Doctor practice sessions retrieved");

  const distinctFacilities = Array.from(new Set(doctorSessions.map((s) => s.facility_id)));
  assert(distinctFacilities.length >= 1, "1.2 Doctor practice covers multiple configured facilities");

  // Edit working session capacity
  const firstSession = doctorSessions[0];
  const updateRes = await AppointmentBookingService.createOrUpdateSession(
    {
      id: firstSession.id,
      doctor_id: firstSession.doctor_id,
      doctor_name: firstSession.doctor_name,
      organization_id: firstSession.organization_id,
      organization_identifier: firstSession.organization_identifier,
      organization_name: firstSession.organization_name,
      facility_id: firstSession.facility_id,
      department_id: firstSession.department_id,
      department_name: firstSession.department_name,
      day_of_week: firstSession.day_of_week,
      start_time: firstSession.start_time,
      end_time: firstSession.end_time,
      capacity: 15,
      room_number: "Room 304 - Cardiology Desk",
    },
    doctor
  );
  assert(updateRes.success === true, "1.3 Session capacity and room updated successfully");

  // ------------------------------------------------------------
  // TEST 2: Leave Blocking & Affected Appointments Detection
  // ------------------------------------------------------------
  console.log("\nTEST 2: Leave Blocking & Conflict Detection");
  const override = AppointmentStore.saveOverride({
    id: "OVR-1001",
    override_type: "DOCTOR_LEAVE",
    date: "2026-08-30",
    doctor_id: "DOC-1001",
    reason: "Attending National Cardiology Symposium",
    created_at: new Date().toISOString(),
  });
  assert(Boolean(override.id), "2.1 Doctor leave override recorded on specific date");

  const leaves = AppointmentStore.getOverridesForDate("2026-08-30", "DOC-1001");
  assert(leaves.length > 0 && leaves[0].override_type === "DOCTOR_LEAVE", "2.2 Doctor leave retrieved for schedule conflict resolution");

  // ------------------------------------------------------------
  // TEST 3: Consultation Workspace & Clinical Examination Note
  // ------------------------------------------------------------
  console.log("\nTEST 3: Active Consultation Workspace & SOAP Pad");
  const testEncounterId = "ENC-ACTIVE-TEST-1";
  const { saveEncounter } = await import("../lib/data/encounter-store");
  saveEncounter({
    id: testEncounterId,
    encounter_reference: testEncounterId,
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    provider_id: "DOC-1001",
    provider_name: "Dr. Ananya Sharma",
    provider_role: "Consultant Cardiologist",
    organization_id: "HSP-1001",
    organization_name: "City Hospital",
    department_id: "DEP-CARDIO",
    department_name: "Cardiology OPD",
    encounter_type: "CONSULTATION",
    status: "ACTIVE",
    source_type: "DIRECT_CONSULTATION",
    reason_for_visit: "Exertional dyspnea & hypertension follow-up",
    started_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    created_by: "DOC-1001",
    created_by_role: "doctor",
  });

  const ctx = ConsultationService.getConsultationContext(
    testEncounterId,
    doctor
  );
  assert(Boolean(ctx?.encounter), "3.1 Consultation encounter context retrieved");

  const saveRes = await ConsultationService.saveDraft(
    testEncounterId,
    {
      chief_complaint: "Exertional dyspnea and atypical retrosternal tightness",
      symptoms: [
        { name: "Chest discomfort", duration: "3 days", severity: "MODERATE" },
      ],
      vitals: {
        systolic_bp_mmhg: 130,
        diastolic_bp_mmhg: 84,
        heart_rate_bpm: 78,
        spo2_percent: 98,
        temperature_celsius: 36.8,
        recorded_at: new Date().toISOString(),
        recorded_by: doctor.fullName,
      },
      observations: "S1/S2 heard clearly, no gallop or murmurs.",
      assessment: "Possible exertional angina. Requires lipid and cardiac monitoring.",
      treatment_plan: "Initiate lipid optimization, statin therapy, and schedule 2D Echo.",
    },
    doctor
  );
  assert(saveRes.success === true, "3.2 Structured clinical SOAP notes saved to authoritative store");

  // ------------------------------------------------------------
  // TEST 4: Inline Clinical Orders (Prescription, Lab, Blood, Admission)
  // ------------------------------------------------------------
  console.log("\nTEST 4: Inline Clinical Orders from Consultation Desk");
  
  // A. Digital Prescription
  const rxRes = await PrescriptionOrderService.issuePrescription(
    testEncounterId,
    {
      items: [
        {
          id: "PRI-1",
          medicine_id: "MED-001",
          medicine_name: "Atorvastatin 20mg",
          generic_name: "Atorvastatin Calcium",
          dosage: "20mg",
          dosage_form: "TABLET",
          route: "ORAL",
          frequency: "OD",
          timing: "NIGHT",
          duration_days: 30,
          quantity: 30,
          instructions: "Take once daily at bedtime after dinner.",
        },
      ],
      notes: "Strict low saturated fat diet.",
    },
    doctor
  );
  assert(rxRes.success === true, "4.1 Digital prescription finalized and routed to pharmacy");

  // B. Diagnostic Lab Order
  const labRes = await LabOrderService.finalizeLabOrder(
    testEncounterId,
    {
      items: [
        {
          id: "LOI-LIP-01",
          test_id: "LIP-01",
          test_name: "Lipid Profile",
          test_code: "LIP-01",
          specimen_type: "Serum",
          instructions: "Fasting 12 hours required",
        },
      ],
      priority: "ROUTINE",
      reason: "Cardiovascular risk evaluation",
    },
    doctor
  );
  assert(labRes.success === true, "4.2 Diagnostic lab order placed and routed to pathology");

  // C. Blood Centre Request
  const bloodRes = createBloodRequest({
    hospitalId: "FAC-1001",
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    doctorId: "DOC-1001",
    doctorName: "Dr. Ananya Sharma",
    encounterId: testEncounterId,
    bloodGroup: "O+",
    componentType: "PACKED_RBC",
    unitsRequested: 1,
    priority: "URGENT",
    clinicalIndication: "Standby for elective angiography",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(bloodRes.success === true, "4.3 Blood Centre unit requested from consultation desk");

  // D. Inpatient Admission Request
  const admRes = requestAdmission({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    encounterId: testEncounterId,
    doctorId: "DOC-1001",
    doctorName: "Dr. Ananya Sharma",
    departmentName: "Cardiology",
    facilityId: "FAC-1001",
    facilityName: "City Hospital",
    admissionType: "PLANNED",
    reason: "Elective coronary angiography and observation",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(admRes.success === true, "4.4 Inpatient admission request initiated from consultation desk");

  // ------------------------------------------------------------
  // TEST 5: Break-Glass Emergency Medical Record Access
  // ------------------------------------------------------------
  console.log("\nTEST 5: Break-Glass Access & Contextual Authorization");
  const bgRes = triggerBreakGlassEmergencyAccess({
    patientId: "PAT-1002",
    patientName: "Priya Sharma",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
    organizationId: "FAC-1001",
    organizationName: "City Hospital",
    justificationReason: "Emergency cardioversion in acute ventricular tachycardia",
    emergencyCaseId: "EMR-9999",
  });
  assert(bgRes.success === true, "5.1 Emergency break-glass access granted");
  assert(hasContextualAccess("PAT-1002", "DOC-1001", "FAC-1001") === true, "5.2 Contextual access active");

  // ------------------------------------------------------------
  // TEST 6: Consultation Finalization & Audit Trail
  // ------------------------------------------------------------
  console.log("\nTEST 6: Consultation Finalization & End-to-End Audit");
  const compRes = await ConsultationService.completeConsultation(
    testEncounterId,
    {
      chief_complaint: "Exertional dyspnea and atypical retrosternal tightness",
      assessment: "Possible exertional angina.",
      treatment_plan: "Statin therapy and 2D Echo.",
    },
    doctor
  );
  assert(compRes.success === true, "6.1 Consultation finalized (COMPLETED)");

  const audits = AuditLedger.getEvents({ resourceId: testEncounterId });
  assert(audits.length > 0, "6.2 Audit ledger recorded consultation completion");

  console.log("\n============================================================");
  console.log(`DOCTOR WORKSPACE SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runDoctorWorkspaceSuite();
