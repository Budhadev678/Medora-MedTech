import { findIdentityById } from "../lib/data/identity-store";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  createPatientNotification,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deletePatientNotification,
} from "../lib/data/notification-store";
import { AppointmentStore } from "../lib/data/appointment-store";
import { getPatientLabOrders } from "../lib/data/lab-order-store";
import { getPatientPrescriptions } from "../lib/data/prescription-store";
import { getBillsByPatient } from "../lib/data/billing-store";
import { getPaymentsForPatient } from "../lib/data/payment-store";
import { getDisputesByPatient } from "../lib/data/dispute-store";
import { getEmergenciesForPatient } from "../lib/data/emergency-store";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ? PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ? FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
    failed++;
  }
}

async function runPrompt2NotificationsSuite() {
  console.log("============================================================");
  console.log("MEDORA — P8 PROMPT 2 NOTIFICATIONS INTEGRATION & RELIABILITY");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST 1: Multi-Module Event-to-Notification Matrix
  // ------------------------------------------------------------
  console.log("TEST 1: Multi-Module Event-to-Notification Matrix");
  
  // 1.1 Appointment Confirmation Event
  const apptNotif = createPatientNotification({
    userId: "PAT-1001",
    eventType: "APPOINTMENT_CONFIRMED",
    title: "Appointment Confirmed",
    message: "Consultation with Dr. Rajesh Sharma confirmed for tomorrow at 10:30 AM.",
    priority: "IMPORTANT",
    referenceType: "APPOINTMENT",
    referenceId: "APT-1001",
  });
  assert(Boolean(apptNotif.id && apptNotif.reference_id === "APT-1001"), "1.1 Appointment event correctly created");

  // 1.2 Lab Report Ready Event
  const labNotif = createPatientNotification({
    userId: "PAT-1001",
    eventType: "LAB_REPORT_READY",
    title: "Lab Report Available",
    message: "Complete Blood Count (CBC) test results have been released.",
    priority: "IMPORTANT",
    referenceType: "LAB_REPORT",
    referenceId: "LAB-ORD-1001",
  });
  assert(Boolean(labNotif.id && labNotif.reference_id === "LAB-ORD-1001"), "1.2 Lab report event correctly created");

  // 1.3 Bill Issued Event
  const billNotif = createPatientNotification({
    userId: "PAT-1001",
    eventType: "BILL_ISSUED",
    title: "New Healthcare Invoice Issued",
    message: "Bill BIL-1001 for ?10,000 has been generated.",
    priority: "IMPORTANT",
    referenceType: "BILL",
    referenceId: "BILL-1001",
  });
  assert(Boolean(billNotif.id && billNotif.reference_id === "BILL-1001"), "1.3 Bill issued event correctly created");

  // 1.4 Payment Receipt Event
  const payNotif = createPatientNotification({
    userId: "PAT-1001",
    eventType: "PAYMENT_CONFIRMED",
    title: "Payment Receipt Issued",
    message: "Receipt RCT-1001 for ?10,000 recorded successfully.",
    priority: "INFO",
    referenceType: "PAYMENT",
    referenceId: "RCT-1001",
  });
  assert(Boolean(payNotif.id && payNotif.reference_id === "RCT-1001"), "1.4 Payment receipt event correctly created");

  // 1.5 Dispute Updated Event
  const dispNotif = createPatientNotification({
    userId: "PAT-1001",
    eventType: "DISPUTE_UPDATED",
    title: "Billing Dispute Under Review",
    message: "Hospital administrative audit team is reviewing dispute DISP-1001.",
    priority: "IMPORTANT",
    referenceType: "DISPUTE",
    referenceId: "DISP-1001",
  });
  assert(Boolean(dispNotif.id && dispNotif.reference_id === "DISP-1001"), "1.5 Dispute event correctly created");

  // 1.6 Emergency Pre-Alert Acknowledged Event
  const emNotif = createPatientNotification({
    userId: "PAT-1001",
    eventType: "EMERGENCY_ACKNOWLEDGED",
    title: "Hospital Acknowledged Emergency Pre-Alert",
    message: "Apex Multispeciality Hospital ER is preparing trauma bay.",
    priority: "CRITICAL",
    referenceType: "EMERGENCY",
    referenceId: "EMR-1001",
  });
  assert(Boolean(emNotif.id && emNotif.priority === "CRITICAL"), "1.6 Emergency pre-alert event created with CRITICAL priority");

  // ------------------------------------------------------------
  // TEST 2: Deduplication & Idempotency
  // ------------------------------------------------------------
  console.log("\nTEST 2: Deduplication & Idempotency under Retries");
  const repeatAppt = createPatientNotification({
    userId: "PAT-1001",
    eventType: "APPOINTMENT_CONFIRMED",
    title: "Appointment Confirmed",
    message: "Consultation with Dr. Rajesh Sharma confirmed for tomorrow at 10:30 AM.",
    priority: "IMPORTANT",
    referenceType: "APPOINTMENT",
    referenceId: "APT-1001",
  });
  assert(repeatAppt.id === apptNotif.id, "2.1 Duplicate appointment event returns existing notification ID");

  const repeatPay = createPatientNotification({
    userId: "PAT-1001",
    eventType: "PAYMENT_CONFIRMED",
    title: "Payment Receipt Issued",
    message: "Receipt RCT-1001 for ?10,000 recorded successfully.",
    priority: "INFO",
    referenceType: "PAYMENT",
    referenceId: "RCT-1001",
  });
  assert(repeatPay.id === payNotif.id, "2.2 Duplicate payment event returns existing notification ID");

  // ------------------------------------------------------------
  // TEST 3: Priority-First Sorting & Active Emergency Prominence
  // ------------------------------------------------------------
  console.log("\nTEST 3: Priority-First Sorting & Emergency Prominence");
  const feed = getNotificationsForUser("PAT-1001", "ALL");
  assert(feed[0].priority === "CRITICAL", "3.1 CRITICAL emergency notification placed first in feed");

  // ------------------------------------------------------------
  // TEST 4: Read/Unread State Transitions & Persistence
  // ------------------------------------------------------------
  console.log("\nTEST 4: Read/Unread State Transitions");
  const unreadCountBefore = getUnreadNotificationCount("PAT-1001");
  markNotificationRead(apptNotif.id);
  const unreadCountAfter = getUnreadNotificationCount("PAT-1001");
  assert(unreadCountAfter === unreadCountBefore - 1, "4.1 markNotificationRead decrements unread count");

  markNotificationUnread(apptNotif.id);
  assert(getUnreadNotificationCount("PAT-1001") === unreadCountBefore, "4.2 markNotificationUnread restores unread count");

  markAllNotificationsRead("PAT-1001");
  assert(getUnreadNotificationCount("PAT-1001") === 0, "4.3 markAllNotificationsRead sets unread count to 0");

  // ------------------------------------------------------------
  // TEST 5: Source Record Referential Integrity
  // ------------------------------------------------------------
  console.log("\nTEST 5: Source Record Referential Integrity");
  const linkedAppt = AppointmentStore.getAppointmentById("APT-1001");
  assert(Boolean(linkedAppt && linkedAppt.patient_id === "PAT-1001"), "5.1 Linked appointment exists in authoritative store");

  const linkedLab = getPatientLabOrders("PAT-1001");
  assert(linkedLab.some(l => l.id === "LAB-ORD-1001"), "5.2 Linked lab report exists in authoritative store");

  const linkedBill = getBillsByPatient("PAT-1001");
  assert(linkedBill.some(b => b.id === "BILL-1001"), "5.3 Linked bill exists in authoritative store");

  const linkedPayment = getPaymentsForPatient("PAT-1001");
  assert(linkedPayment.some(p => (p.id === "PAY-1001" || p.receipt_number === "REC-1001")), "5.4 Linked payment receipt exists in authoritative store");

  const linkedDispute = getDisputesByPatient("PAT-1001");
  assert(linkedDispute.some(d => d.id === "DISP-1001"), "5.5 Linked dispute exists in authoritative store");

  // ------------------------------------------------------------
  // TEST 6: Non-Destruction of Underlying Records
  // ------------------------------------------------------------
  console.log("\nTEST 6: Non-Destruction of Underlying Records");
  const testNotif = createPatientNotification({
    userId: "PAT-1001",
    eventType: "CUSTOM_NOTICE",
    title: "Notice to Delete",
    message: "Temporary notification.",
    priority: "INFO",
    referenceType: "APPOINTMENT",
    referenceId: "APT-1001",
  });
  const deleted = deletePatientNotification(testNotif.id);
  assert(deleted === true, "6.1 Notification deleted successfully");
  const apptStillExists = AppointmentStore.getAppointmentById("APT-1001");
  assert(Boolean(apptStillExists), "6.2 Deleting notification did NOT delete underlying appointment record");

  // ------------------------------------------------------------
  // TEST 7: Anti-IDOR Complete Patient Privacy & Isolation
  // ------------------------------------------------------------
  console.log("\nTEST 7: Anti-IDOR Complete Patient Privacy & Isolation");
  const patBFeed = getNotificationsForUser("PAT-1002", "ALL");
  assert(patBFeed.filter(n => n.user_id === "PAT-1001").length === 0, "7.1 Patient B feed contains zero Patient A notifications");

  console.log("\n============================================================");
  console.log(`P8 PROMPT 2 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPrompt2NotificationsSuite();

