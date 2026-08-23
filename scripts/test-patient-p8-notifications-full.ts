import { findIdentityById } from "../lib/data/identity-store";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  createPatientNotification,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
} from "../lib/data/notification-store";

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

async function runPatientP8Suite() {
  console.log("============================================================");
  console.log("MEDORA — P8 PROMPT 1 NOTIFICATIONS & COMMUNICATION CENTER");
  console.log("============================================================\n");

  const patientA = findIdentityById("PAT-1001")!;
  const patientB = findIdentityById("PAT-1002")!;

  // ------------------------------------------------------------
  // TEST GROUP 1: Canonical Notifications & Multi-Event Sources
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Canonical Notifications & Multi-Event Sources");
  const allNotifs = getNotificationsForUser("PAT-1001", "ALL");
  assert(allNotifs.length >= 4, "1.1 Patient A has multi-category notifications populated");
  
  const apptNotif = allNotifs.find(n => n.event_type === "APPOINTMENT_CONFIRMED");
  assert(Boolean(apptNotif && apptNotif.reference_id === "APT-1001"), "1.2 Appointment confirmation event properly referenced");

  const labNotif = allNotifs.find(n => n.event_type === "LAB_REPORT_READY");
  assert(Boolean(labNotif && labNotif.reference_id === "LAB-ORD-1001"), "1.3 Diagnostic lab report notification properly referenced");

  const billNotif = allNotifs.find(n => n.event_type === "BILL_ISSUED");
  assert(Boolean(billNotif && billNotif.reference_id === "BILL-1001"), "1.4 Healthcare invoice notification properly referenced");

  // ------------------------------------------------------------
  // TEST GROUP 2: Notification Category Filtering
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Notification Category Filtering");
  const apptList = getNotificationsForUser("PAT-1001", "APPOINTMENT");
  assert(apptList.every(n => (n.reference_type as string) === "APPOINTMENT"), "2.1 APPOINTMENT category filter isolates appointment events");

  const billList = getNotificationsForUser("PAT-1001", "BILLING");
  assert(billList.every(n => (n.reference_type as string) === "BILL" || (n.reference_type as string) === "DISPUTE"), "2.2 BILLING category filter isolates bills and disputes");

  // ------------------------------------------------------------
  // TEST GROUP 3: Emergency Event Priority Ordering
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Emergency Event Priority Ordering");
  const emNotif = createPatientNotification({
    userId: "PAT-1001",
    eventType: "EMERGENCY_ACKNOWLEDGED",
    title: "Hospital Acknowledged Emergency Pre-Alert",
    message: "Apex Multispeciality Hospital ER is preparing trauma bay.",
    priority: "CRITICAL",
    referenceType: "EMERGENCY",
    referenceId: "EMR-1001",
  });
  assert(Boolean(emNotif.id), "3.1 Emergency critical notification created");

  const sortedNotifs = getNotificationsForUser("PAT-1001", "ALL");
  assert(sortedNotifs[0].priority === "CRITICAL", "3.2 CRITICAL emergency notification placed first in feed");

  // ------------------------------------------------------------
  // TEST GROUP 4: Read / Unread State Transitions
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Read / Unread State Transitions");
  const initialUnread = getUnreadNotificationCount("PAT-1001");
  markNotificationRead(emNotif.id);
  const unreadAfterRead = getUnreadNotificationCount("PAT-1001");
  assert(unreadAfterRead === initialUnread - 1, "4.1 markNotificationRead decrements unread count");

  markNotificationUnread(emNotif.id);
  const unreadAfterUnread = getUnreadNotificationCount("PAT-1001");
  assert(unreadAfterUnread === initialUnread, "4.2 markNotificationUnread restores unread count");

  markAllNotificationsRead("PAT-1001");
  const finalUnread = getUnreadNotificationCount("PAT-1001");
  assert(finalUnread === 0, "4.3 markAllNotificationsRead clears all unread notifications");

  // ------------------------------------------------------------
  // TEST GROUP 5: Duplicate Notification Prevention (Idempotency)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Duplicate Notification Prevention");
  const repeatNotif = createPatientNotification({
    userId: "PAT-1001",
    eventType: "EMERGENCY_ACKNOWLEDGED",
    title: "Hospital Acknowledged Emergency Pre-Alert",
    message: "Apex Multispeciality Hospital ER is preparing trauma bay.",
    priority: "CRITICAL",
    referenceType: "EMERGENCY",
    referenceId: "EMR-1001",
  });
  assert(repeatNotif.id === emNotif.id, "5.1 Re-creating identical event returns existing notification ID without duplicate creation");

  // ------------------------------------------------------------
  // TEST GROUP 6: Anti-IDOR Complete Patient Isolation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Anti-IDOR Complete Patient Isolation");
  const patBNotifs = getNotificationsForUser("PAT-1002", "ALL");
  const crossLeak = patBNotifs.filter(n => n.user_id === "PAT-1001");
  assert(crossLeak.length === 0, "6.1 Patient B query yields zero Patient A notifications");

  console.log("\n============================================================");
  console.log(`P8 PROMPT 1 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runPatientP8Suite();
