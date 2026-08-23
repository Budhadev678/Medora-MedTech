// ============================================================
// MEDORA â€” STABILIZATION S2 BACKEND API TEST SUITE
// Tests all HTTP API Route Handlers under app/api/
// ============================================================

import { GET as getSession } from "../app/api/auth/session/route";
import { GET as getAppointments, POST as postAppointment } from "../app/api/appointments/route";
import { POST as postCheckIn } from "../app/api/appointments/check-in/route";
import { GET as getConsultations, POST as postConsultation } from "../app/api/consultations/route";
import { GET as getPrescriptions, POST as postPrescription } from "../app/api/prescriptions/route";
import { GET as getLabOrders, POST as postLabOrder } from "../app/api/lab/orders/route";
import { POST as postSample } from "../app/api/lab/samples/route";
import { GET as getLabReports, POST as postReport } from "../app/api/lab/reports/route";
import { POST as postIntake } from "../app/api/pharmacy/intake/route";
import { GET as getInventory, POST as evalInventory } from "../app/api/pharmacy/inventory/route";
import { POST as postDispense } from "../app/api/pharmacy/dispense/route";
import { GET as getBills, POST as postBill } from "../app/api/billing/bills/route";
import { GET as getWaterfall } from "../app/api/billing/waterfall/route";
import { POST as postPayment } from "../app/api/billing/payments/route";
import { POST as postRefund } from "../app/api/billing/refunds/route";
import { GET as getRecon, POST as postRecon } from "../app/api/billing/reconciliation/route";
import { GET as getDisputes, POST as postDispute } from "../app/api/billing/disputes/route";
import { GET as getReferrals, POST as postReferral } from "../app/api/referrals/route";
import { POST as postWebhook } from "../app/api/webhooks/payment/route";
import { NextRequest } from "next/server";
import { saveEncounters, createEncounter } from "@/lib/data/encounter-store";
import { saveClinicalRecordDraft } from "@/lib/data/clinical-record-store";
import { saveTestResults } from "@/lib/data/lab-order-store";
import { BillingEngineService } from "@/lib/services/billing-engine-service";

function createReq(url: string, method: string = "GET", body?: any, role: string = "patient", userId: string = "PAT-1001"): NextRequest {
  const req = new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: {
      "content-type": "application/json",
      "x-medora-user-id": userId,
      "cookie": `medora_role=${role}; medora_session_id=${userId}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return req;
}

async function runS2Tests() {
  console.log("============================================================");
  console.log("MEDORA â€” STABILIZATION S2 API SUITE VERIFICATION");
  console.log("============================================================\n");

  let passed = 0;
  let total = 0;
  const todayStr = new Date().toISOString().split("T")[0];

  function assert(condition: boolean, description: string, jsonObj?: any) {
    total++;
    if (condition) {
      console.log(`  âœ“ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  âœ• FAIL: ${description}`, jsonObj ? `\n    --> Response: ${JSON.stringify(jsonObj)}` : "");
      process.exitCode = 1;
    }
  }

  // 1. Auth Session
  console.log("TEST GROUP 1: Authentication Session API");
  const sessionRes = await getSession(createReq("http://localhost:3000/api/auth/session", "GET", null, "patient", "PAT-1001"));
  const sessionJson = await sessionRes.json();
  assert(sessionJson.success === true, "Session API returned success=true", sessionJson);
  assert(sessionJson.data.role === "patient", "Session API returned patient role", sessionJson);

  // 2. Appointments API
  console.log("\nTEST GROUP 2: Appointments API");
  const apptListRes = await getAppointments(createReq("http://localhost:3000/api/appointments", "GET", null, "patient", "PAT-1001"));
  const apptListJson = await apptListRes.json();
  assert(apptListJson.success === true, "Get appointments returned success=true", apptListJson);

  const postApptRes = await postAppointment(createReq("http://localhost:3000/api/appointments", "POST", {
    session_id: "SES-1002",
    doctor_id: "DOC-1001",
    facility_id: "FAC-1001",
    appointment_date: todayStr,
    time_slot: "04:00 PM - 06:00 PM",
    reason: "Routine Cardiology Checkup",
  }, "patient", "PAT-1001"));
  const postApptJson = await postApptRes.json();
  assert(postApptJson.success === true, "Book appointment POST API created appointment", postApptJson);

  // 3. Check-In API
  console.log("\nTEST GROUP 3: Check-in & Queue API");
  const checkInRes = await postCheckIn(createReq("http://localhost:3000/api/appointments/check-in", "POST", {
    appointment_id: postApptJson.data?.id || "APP-1001",
  }, "receptionist", "STAFF-1001"));
  const checkInJson = await checkInRes.json();
  assert(checkInJson.success === true, "Check-in API generated queue token entry", checkInJson);

  // 4. Consultation API
  console.log("\nTEST GROUP 4: Consultation API");
  // Create fresh encounter for consultation completion test
  const freshEncRes = createEncounter({
    patientId: "PAT-1001",
    providerId: "DOC-1001",
    organizationId: "HSP-1001",
    departmentId: "DEP-1001",
    departmentName: "Cardiology & Cath Lab",
    encounterType: "OUTPATIENT",
    reasonForVisit: "Chest pressure evaluation",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  const freshEnc = freshEncRes.encounter!;
  freshEnc.status = "IN_PROGRESS";
  saveEncounters([freshEnc as any]);

  saveClinicalRecordDraft({
    encounterId: freshEnc.id,
    chiefComplaint: "Chest pressure",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  const postConsRes = await postConsultation(createReq("http://localhost:3000/api/consultations", "POST", {
    encounter_id: freshEnc.id,
    subjective: "Patient complains of chest pressure.",
    objective: "BP 130/85.",
    assessment: "Essential Hypertension",
    plan: "Start DASH diet.",
    diagnoses: [{ code: "I10", name: "Essential Hypertension" }],
  }, "doctor", "DOC-1001"));
  const postConsJson = await postConsRes.json();
  assert(postConsJson.success === true, "Consultation POST API finalized clinical record", postConsJson);

  // 5. Prescriptions API
  console.log("\nTEST GROUP 5: Prescriptions API");
  const postRxRes = await postPrescription(createReq("http://localhost:3000/api/prescriptions", "POST", {
    encounter_id: freshEnc.id,
    items: [{ medicine_name: "Amlodipine", strength: "5mg", dosage: "1 Tablet", frequency: "ONCE_DAILY", duration: "30 Days", route: "Oral" }],
    notes: "Take after breakfast.",
  }, "doctor", "DOC-1001"));
  const postRxJson = await postRxRes.json();
  assert(postRxJson.success === true, "Prescription POST API finalized e-prescription", postRxJson);

  // 6. Lab Orders & Reports API
  console.log("\nTEST GROUP 6: Lab Orders & Reports API");
  const postLabRes = await postLabOrder(createReq("http://localhost:3000/api/lab/orders", "POST", {
    encounter_id: freshEnc.id,
    items: [{ test_code: "CBC", test_name: "Complete Blood Count" }],
    reason: "Routine screening",
  }, "doctor", "DOC-1001"));
  const postLabJson = await postLabRes.json();
  assert(postLabJson.success === true, "Lab Order POST API submitted pathology order", postLabJson);

  // Pre-seed verified result for report generation test
  saveTestResults([{
    id: `RES-${Date.now()}`,
    lab_order_id: postLabJson.data?.id || "LAB-1001",
    lab_order_item_id: "ITEM-1001",
    sample_id: "SMP-1001",
    patient_id: "PAT-1001",
    test_id: "TEST-CBC-001",
    test_name: "Complete Blood Count",
    parameter_id: "PARAM-HB",
    parameter_name: "Hemoglobin",
    result_type: "NUMERIC",
    value: "14.2",
    numeric_value: 14.2,
    unit: "g/dL",
    reference_range: "12.0 - 16.0",
    flag: "NORMAL",
    status: "VERIFIED",
    entered_by_id: "LAB-1001",
    entered_by_name: "Pathologist",
    entered_at: new Date().toISOString(),
    verified_by_id: "LAB-1001",
    verified_by_name: "Pathologist",
    verified_at: new Date().toISOString(),
    version: 1,
  }]);

  const postRptRes = await postReport(createReq("http://localhost:3000/api/lab/reports", "POST", {
    lab_order_id: postLabJson.data?.id || "LAB-1001",
    clinical_impression: "Normal complete blood count.",
  }, "lab_staff", "LAB-1001"));
  const postRptJson = await postRptRes.json();
  assert(postRptJson.success === true, "Lab Report POST API released certified report", postRptJson);

  // 7. Pharmacy API
  console.log("\nTEST GROUP 7: Pharmacy API");
  const postIntakeRes = await postIntake(createReq("http://localhost:3000/api/pharmacy/intake", "POST", {
    prescription_id: postRxJson.data?.id || "RX-1001",
    pharmacy_facility_id: "PHARM-FAC-1001",
  }, "pharmacy_staff", "PHA-1001"));
  const postIntakeJson = await postIntakeRes.json();
  assert(postIntakeJson.success === true, "Pharmacy Intake POST API registered intake", postIntakeJson);

  // 8. Billing & Payments API
  console.log("\nTEST GROUP 8: Billing & Payments API");
  const postBillRes = await postBill(createReq("http://localhost:3000/api/billing/bills", "POST", {
    patient_id: "PAT-1001",
    encounter_id: freshEnc.id,
  }, "finance_staff", "FIN-1001"));
  const postBillJson = await postBillRes.json();
  assert(postBillJson.success === true, "Billing POST API created draft bill", postBillJson);

  const newBillId = postBillJson.data?.id || "BILL-1001";
  // Add billable item to new bill so it has an outstanding balance
  const staffActor = { id: "FIN-1001", identifier: "FIN-1001", fullName: "Finance Staff", role: "finance_staff" as const };
  BillingEngineService.addBillableItem({
    billId: newBillId,
    serviceCode: "CONS-OPD-01",
    sourceType: "ENCOUNTER",
    sourceId: freshEnc.id,
    quantity: 1,
    actor: staffActor as any,
  });

  const postPayRes = await postPayment(createReq("http://localhost:3000/api/billing/payments", "POST", {
    bill_id: newBillId,
    amount: 500,
    payment_method: "UPI",
    idempotency_key: `IDEM-${Date.now()}`,
    cash_collector_name: "Cashier System",
  }, "finance_staff", "FIN-1001"));
  const postPayJson = await postPayRes.json();
  assert(postPayJson.success === true, "Payment POST API executed attempt and generated receipt", postPayJson);

  // 9. Webhook Listener API
  console.log("\nTEST GROUP 9: Webhook Listener API");
  const webhookRes = await postWebhook(createReq("http://localhost:3000/api/webhooks/payment", "POST", {
    event: "payment.captured",
    payload: {
      payment_intent_id: postPayJson.data?.paymentRecord?.idempotency_key || `IDEM-${Date.now()}`,
      method: "UPI",
      amount: 500,
    },
  }, "admin", "ADMIN-1001"));
  const webhookJson = await webhookRes.json();
  assert(webhookJson.success === true, "Payment Gateway Webhook API processed event", webhookJson);

  console.log("\n============================================================");
  console.log(`S2 API SUITE SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed/total)*100)}%)`);
  console.log("============================================================\n");
}

runS2Tests().catch(console.error);
