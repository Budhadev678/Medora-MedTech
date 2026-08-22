// ============================================================
// MEDORA — MODIFICATION PHASE B.4 TEST SUITE
// Alternative Availability, Same-Doctor Options, Waitlist & Final Integration
// ============================================================

import { AlternativeSearchService } from "../lib/services/alternative-search-service";
import { WaitlistStore } from "../lib/data/waitlist-store";
import { AppointmentBookingService } from "../lib/services/appointment-booking-service";
import { AppointmentStore } from "../lib/data/appointment-store";
import { QueueStore, getTodayDateStr } from "../lib/data/queue-store";
import { findIdentityById, StoredIdentity } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}${failureDetails ? ` — ${failureDetails}` : ""}`);
    failedCount++;
  }
}

export async function runPhaseB4Tests() {
  console.log("============================================================");
  console.log("MEDORA PHASE B.4: ALTERNATIVES & WAITLIST TEST SUITE");
  console.log("============================================================\n");

  const todayStr = getTodayDateStr();

  // Reset stores for clean deterministic state
  AppointmentStore.reset();
  QueueStore.clearAll();
  WaitlistStore.clearAll();

  // Fixtures
  const patientA = findIdentityById("PAT-1001") as StoredIdentity; // Rahul Verma
  const patientB = findIdentityById("PAT-1002") as StoredIdentity; // Priya Sharma
  const doctorAnanya = findIdentityById("DOC-1001") as StoredIdentity; // Dr. Ananya Sharma
  const doctorRahul = findIdentityById("MULTI-1001") as StoredIdentity; // Dr. Rahul Sharma
  const receptionistAnita = findIdentityById("STAFF-1002") as StoredIdentity; // Anita

  assert(Boolean(patientA && patientB && doctorAnanya && doctorRahul && receptionistAnita), "1. Identity Fixtures Loaded");

  // ============================================================
  // TEST GROUP 1: SAME-DOCTOR SAME-FACILITY ALTERNATIVE SESSIONS
  // ============================================================
  console.log("\n--- TEST GROUP 1: SAME-DOCTOR SAME-FACILITY ALTERNATIVE SESSIONS ---");

  const ananyaCitySessions = AppointmentStore.getDoctorSessions("DOC-1001", "HSP-1001");
  assert(ananyaCitySessions.length >= 2, "1.1 Dr. Ananya has multiple sessions configured at City Hospital");

  const morningSession = ananyaCitySessions[0]; // SES-1001 (Morning)
  const eveningSession = ananyaCitySessions[1]; // SES-1002 (Evening)

  // Search alternatives for preferred morning session
  const altsGroup1 = AlternativeSearchService.findAppointmentAlternatives(
    {
      patient_id: patientA.identifier || patientA.id,
      preferred_doctor_id: "DOC-1001",
      preferred_organization_identifier: "HSP-1001",
      preferred_session_id: morningSession.id,
      preferred_date: todayStr,
      specialty: "Cardiology",
    },
    patientA
  );

  assert(altsGroup1.length > 0, "1.2 Alternatives discovered");
  const sameDocSameFac = altsGroup1.find(
    (a) => a.doctor_id === "DOC-1001" && a.organization_identifier === "HSP-1001" && a.session_id === eveningSession.id
  );
  assert(Boolean(sameDocSameFac), "1.3 Same doctor later session found as alternative");
  assert(sameDocSameFac?.reason_badge === "SAME_DOCTOR_LATER_SESSION", "1.4 Correct reason badge: SAME_DOCTOR_LATER_SESSION");
  assert(sameDocSameFac?.is_same_doctor === true, "1.5 is_same_doctor flag is true");
  assert(sameDocSameFac?.is_same_facility === true, "1.6 is_same_facility flag is true");

  // ============================================================
  // TEST GROUP 2: SAME-DOCTOR CONNECTED-FACILITY ALTERNATIVES
  // ============================================================
  console.log("\n--- TEST GROUP 2: SAME-DOCTOR CONNECTED-FACILITY ALTERNATIVES ---");

  const sameDocDiffFac = altsGroup1.find(
    (a) => a.doctor_id === "DOC-1001" && a.organization_identifier === "CLN-1001"
  );
  assert(Boolean(sameDocDiffFac), "2.1 Same doctor at connected clinic (Green Care Clinic) discovered");
  assert(sameDocDiffFac?.reason_badge === "SAME_DOCTOR_DIFFERENT_FACILITY", "2.2 Correct reason badge: SAME_DOCTOR_DIFFERENT_FACILITY");
  assert(sameDocDiffFac?.distance_km === 2.4, "2.3 Distance (2.4 km) computed accurately for Green Care Clinic");
  assert(sameDocDiffFac?.is_same_doctor === true, "2.4 is_same_doctor is true");
  assert(sameDocDiffFac?.is_same_facility === false, "2.5 is_same_facility is false");

  // ============================================================
  // TEST GROUP 3: OTHER-DOCTOR SAME-SPECIALTY ALTERNATIVES
  // ============================================================
  console.log("\n--- TEST GROUP 3: OTHER-DOCTOR SAME-SPECIALTY ALTERNATIVES ---");

  const otherDocSameFac = altsGroup1.find(
    (a) => a.doctor_id === "MULTI-1001" && a.organization_identifier === "HSP-1001"
  );
  assert(Boolean(otherDocSameFac), "3.1 Other doctor (Dr. Rahul) in same facility discovered");
  assert(otherDocSameFac?.reason_badge === "OTHER_DOCTOR_SAME_FACILITY", "3.2 Correct reason badge: OTHER_DOCTOR_SAME_FACILITY");
  assert(otherDocSameFac?.is_same_doctor === false, "3.3 is_same_doctor is false");
  assert(otherDocSameFac?.is_same_facility === true, "3.4 is_same_facility is true");

  // ============================================================
  // TEST GROUP 4: SPECIALTY MATCHING GUARD
  // ============================================================
  console.log("\n--- TEST GROUP 4: SPECIALTY MATCHING GUARD ---");

  // Query for Orthopedics specialty
  const altsOrtho = AlternativeSearchService.findAppointmentAlternatives(
    {
      patient_id: patientA.identifier || patientA.id,
      preferred_doctor_id: "DOC-1001",
      preferred_organization_identifier: "HSP-1001",
      preferred_date: todayStr,
      specialty: "Orthopedics",
    },
    patientA
  );

  const containsCardio = altsOrtho.some((a) => a.department_name.toLowerCase().includes("cardiology"));
  assert(!containsCardio, "4.1 Cardiology sessions NOT suggested when searching for Orthopedics");

  // ============================================================
  // TEST GROUP 5: DOCTOR LEAVE & CLOSURE EXCLUSIONS
  // ============================================================
  console.log("\n--- TEST GROUP 5: DOCTOR LEAVE & CLOSURE EXCLUSIONS ---");

  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // Add doctor leave override on tomorrow
  AppointmentStore.saveOverride({
    id: "OVR-TEST-B4",
    override_type: "DOCTOR_LEAVE",
    doctor_id: "DOC-1001",
    organization_identifier: "HSP-1001",
    date: tomorrowStr,
    reason: "Medical Conference in New Delhi",
    is_closed: true,
    created_at: new Date().toISOString(),
  });

  const altsLeave = AlternativeSearchService.findAppointmentAlternatives(
    {
      patient_id: patientA.identifier || patientA.id,
      preferred_doctor_id: "DOC-1001",
      preferred_organization_identifier: "HSP-1001",
      preferred_date: tomorrowStr,
      specialty: "Cardiology",
    },
    patientA
  );

  const hasLeaveSession = altsLeave.some(
    (a) => a.doctor_id === "DOC-1001" && a.organization_identifier === "HSP-1001" && a.can_book_immediately
  );
  assert(!hasLeaveSession, "5.1 Doctor on leave is excluded from bookable alternatives");

  // ============================================================
  // TEST GROUP 6: ATOMIC REPLACEMENT SAFETY
  // ============================================================
  console.log("\n--- TEST GROUP 6: ATOMIC REPLACEMENT SAFETY ---");

  // 1. Patient A books original appointment with Dr. Ananya (Morning)
  const origBook = await AppointmentBookingService.bookAppointment(
    {
      patient_id: patientA.identifier || patientA.id,
      session_id: morningSession.id,
      appointment_date: todayStr,
      booking_source: "PATIENT",
      reason_for_visit: "Initial Consultation",
    },
    patientA
  );
  assert(origBook.success, "6.1 Original appointment booked successfully");
  const origApt = origBook.appointment!;

  // 2. Patient A replaces with Dr. Rahul (Evening / Other Doctor)
  const rahulSession = AppointmentStore.getDoctorSessions("MULTI-1001", "HSP-1001")[0];
  const replaceResult = await AlternativeSearchService.bookAlternativeWithReplacement(
    {
      new_session_id: rahulSession.id,
      new_date: todayStr,
      new_doctor_id: "MULTI-1001",
      new_org_identifier: "HSP-1001",
      new_facility_id: "FAC-1001",
      new_department_id: "DEP-MED-1001",
      patient_id: patientA.identifier || patientA.id,
      patient_name: patientA.fullName,
      original_appointment_id: origApt.id,
    },
    patientA
  );

  assert(replaceResult.success, "6.2 Alternative booking with replacement succeeded");
  assert(replaceResult.appointment?.doctor_id === "MULTI-1001", "6.3 New appointment booked under Dr. Rahul");
  assert(replaceResult.original_appointment_status === "CANCELLED", "6.4 Original appointment cleanly cancelled upon successful replacement");

  const freshOrigApt = AppointmentStore.getAppointmentById(origApt.id)!;
  assert(freshOrigApt.status === "CANCELLED", "6.5 Original appointment verified CANCELLED in database");

  // ============================================================
  // TEST GROUP 7: REPLACEMENT FAILURE SAFETY (ORIGINAL PRESERVED)
  // ============================================================
  console.log("\n--- TEST GROUP 7: REPLACEMENT FAILURE SAFETY (ORIGINAL PRESERVED) ---");

  // Re-book an appointment for Patient B
  const bBook = await AppointmentBookingService.bookAppointment(
    {
      patient_id: patientB.identifier || patientB.id,
      session_id: morningSession.id,
      appointment_date: todayStr,
      booking_source: "PATIENT",
      reason_for_visit: "Cardiac checkup",
    },
    patientB
  );
  const patientBApt = bBook.appointment!;

  // Attempt replacement with an invalid session ID
  const failReplace = await AlternativeSearchService.bookAlternativeWithReplacement(
    {
      new_session_id: "SES-INVALID-999",
      new_date: todayStr,
      new_doctor_id: "DOC-1001",
      new_org_identifier: "HSP-1001",
      new_facility_id: "FAC-1001",
      new_department_id: "DEP-CARD-1001",
      patient_id: patientB.identifier || patientB.id,
      patient_name: patientB.fullName,
      original_appointment_id: patientBApt.id,
    },
    patientB
  );

  assert(!failReplace.success, "7.1 Invalid alternative booking safely failed");
  const preservedBApt = AppointmentStore.getAppointmentById(patientBApt.id)!;
  assert(preservedBApt.status === "CONFIRMED", "7.2 Original appointment remains 100% CONFIRMED (Not cancelled)");

  // ============================================================
  // TEST GROUP 8: WAITLIST JOINING & DUPLICATE PROTECTION
  // ============================================================
  console.log("\n--- TEST GROUP 8: WAITLIST JOINING & DUPLICATE PROTECTION ---");

  const waitlistJoin1 = WaitlistStore.joinWaitlist(
    {
      patient_id: patientA.identifier || patientA.id,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      preferred_date: todayStr,
      preferred_session_id: morningSession.id,
    },
    patientA.fullName,
    "Dr. Ananya Sharma",
    "Cardiology OPD",
    "City Hospital"
  );

  assert(waitlistJoin1.success, "8.1 Patient A successfully joined waitlist");
  assert(waitlistJoin1.waitlist_entry?.status === "ACTIVE", "8.2 Initial waitlist status is ACTIVE");
  assert(Boolean(waitlistJoin1.waitlist_entry?.waitlist_no.startsWith("WTL-")), "8.3 Assigned deterministic waitlist number");

  // Duplicate Join Attempt
  const waitlistJoinDup = WaitlistStore.joinWaitlist(
    {
      patient_id: patientA.identifier || patientA.id,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      preferred_date: todayStr,
      preferred_session_id: morningSession.id,
    },
    patientA.fullName,
    "Dr. Ananya Sharma",
    "Cardiology OPD",
    "City Hospital"
  );

  assert(!waitlistJoinDup.success, "8.4 Duplicate waitlist join rejected");
  assert(waitlistJoinDup.error_code === "ALREADY_WAITLISTED", "8.5 Error code is ALREADY_WAITLISTED");

  // ============================================================
  // TEST GROUP 9: SLOT RELEASE & WAITLIST NOTIFICATION
  // ============================================================
  console.log("\n--- TEST GROUP 9: SLOT RELEASE & WAITLIST NOTIFICATION ---");

  // When patient B cancels their appointment, the capacity release should trigger waitlist notification
  await AppointmentBookingService.cancelAppointment(
    patientBApt.id,
    patientB,
    "Patient stepping out of town"
  );

  const updatedWaitlist = WaitlistStore.getWaitlistById(waitlistJoin1.waitlist_entry!.id)!;
  assert(updatedWaitlist.status === "NOTIFIED", "9.1 Waitlist entry auto-transitioned to NOTIFIED upon cancellation");
  assert(Boolean(updatedWaitlist.notified_at), "9.2 notified_at timestamp recorded");

  // ============================================================
  // TEST GROUP 10: WAITLIST BOOKING COMPLETION
  // ============================================================
  console.log("\n--- TEST GROUP 10: WAITLIST BOOKING COMPLETION ---");

  // Notified patient books the newly opened slot
  const waitlistBook = await AppointmentBookingService.bookAppointment(
    {
      patient_id: patientA.identifier || patientA.id,
      session_id: morningSession.id,
      appointment_date: todayStr,
      booking_source: "PATIENT",
      reason_for_visit: "Booked from waitlist notification",
    },
    patientA
  );

  assert(waitlistBook.success, "10.1 Waitlisted patient booked released slot successfully");
  const bookedWaitlist = WaitlistStore.getWaitlistById(waitlistJoin1.waitlist_entry!.id)!;
  assert(bookedWaitlist.status === "BOOKED", "10.2 Waitlist record marked BOOKED");
  assert(bookedWaitlist.booked_appointment_id === waitlistBook.appointment?.id, "10.3 Linked appointment ID recorded on waitlist entry");

  // ============================================================
  // TEST GROUP 11: WAITLIST CANCELLATION & EXPIRATION
  // ============================================================
  console.log("\n--- TEST GROUP 11: WAITLIST CANCELLATION & EXPIRATION ---");

  // Patient B joins a new waitlist
  const wJoinB = WaitlistStore.joinWaitlist(
    {
      patient_id: patientB.identifier || patientB.id,
      doctor_id: "DOC-1001",
      organization_identifier: "HSP-1001",
      facility_id: "FAC-1001",
      department_id: "DEP-CARD-1001",
      preferred_date: todayStr,
    },
    patientB.fullName,
    "Dr. Ananya Sharma",
    "Cardiology OPD",
    "City Hospital"
  );
  assert(wJoinB.success, "11.1 Patient B joined waitlist");

  // Patient B cancels waitlist
  WaitlistStore.cancelWaitlistEntry(wJoinB.waitlist_entry!.id, patientB.identifier || patientB.id);
  const cancelledW = WaitlistStore.getWaitlistById(wJoinB.waitlist_entry!.id)!;
  assert(cancelledW.status === "CANCELLED", "11.2 Waitlist entry cancelled successfully");

  // ============================================================
  // TEST GROUP 12: SECURITY & ISOLATION BOUNDARIES
  // ============================================================
  console.log("\n--- TEST GROUP 12: SECURITY & ISOLATION BOUNDARIES ---");

  // Patient A queries own waitlists
  const patientAWaitlists = WaitlistStore.getPatientActiveWaitlists(patientA.identifier || patientA.id);
  const patientBInA = patientAWaitlists.some((w) => w.patient_id === (patientB.identifier || patientB.id));
  assert(!patientBInA, "12.1 Patient A query contains zero Patient B waitlist records (Patient Isolation)");

  // Unauthorized actor trying to replace an appointment with missing auth
  const anonReplace = await AlternativeSearchService.bookAlternativeWithReplacement(
    {
      new_session_id: morningSession.id,
      new_date: todayStr,
      new_doctor_id: "DOC-1001",
      new_org_identifier: "HSP-1001",
      new_facility_id: "FAC-1001",
      new_department_id: "DEP-CARD-1001",
      patient_id: patientA.identifier || patientA.id,
      patient_name: patientA.fullName,
    },
    null
  );
  assert(!anonReplace.success && anonReplace.error_code === "UNAUTHORIZED", "12.2 Unauthenticated replacement request safely REJECTED");

  // ============================================================
  // TEST SUMMARY
  // ============================================================
  console.log("\n============================================================");
  console.log(`PHASE B.4 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhaseB4Tests().catch((err) => {
  console.error("Test Suite crashed:", err);
  process.exit(1);
});
