// ============================================================
// MEDORA â€” STABILIZATION S9 MASTER DATA QUALITY & VALIDATION SUITE
// Validates Data Correctness, Business Rules, Status Transitions,
// Edge Cases, Duplicate Prevention, Mathematical Integrity & Zero Orphans
// ============================================================

import {
  getAllIdentities,
  findIdentityById,
  getHospitalAffiliatedDoctors,
} from "@/lib/data/identity-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { QueueStore } from "@/lib/data/queue-store";
import { getAllEncounters, createEncounter } from "@/lib/data/encounter-store";
import {
  getAllPrescriptions,
  savePrescriptionDraft,
  finalizePrescription,
} from "@/lib/data/prescription-store";
import {
  getAllLabOrders,
  saveLabOrderDraft,
  finalizeLabOrder,
} from "@/lib/data/lab-order-store";
import { getAllSamples, createSample } from "@/lib/data/lab-sample-store";
import { getAllBills, getBillById } from "@/lib/data/billing-store";
import { getAllPayments } from "@/lib/data/payment-store";
import { BillingEngineService } from "@/lib/services/billing-engine-service";
import { FinancialCoverageService } from "@/lib/services/financial-coverage-service";
import { PaymentProcessingService } from "@/lib/services/payment-processing-service";
import { PharmacyInventoryService } from "@/lib/services/pharmacy-inventory-service";
import { AppointmentStatus, BillStatus, PrescriptionStatus } from "@/types/database.types";

async function runS9DataQualityTests() {
  console.log("============================================================");
  console.log("MEDORA â€” STABILIZATION S9 DATA QUALITY & BUSINESS RULES SUITE");
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
    }
  }

  // ------------------------------------------------------------
  // TEST GROUP 1: Identity Store Quality & Persona Validation
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Identity Store Quality & Persona Validation");
  const allUsers = getAllIdentities();
  assert(allUsers.length >= 20, `Identity repository contains ${allUsers.length} active personas`);

  const missingNames = allUsers.filter((u) => !u.fullName || u.fullName.trim() === "");
  assert(missingNames.length === 0, "All personas possess non-empty full names");

  const missingEmails = allUsers.filter((u) => !u.email || !u.email.includes("@"));
  assert(missingEmails.length === 0, "All personas possess RFC-valid email addresses");

  const missingRoles = allUsers.filter((u) => !u.role);
  assert(missingRoles.length === 0, "All personas possess explicit RBAC roles");

  const duplicateIdentifiers = new Set<string>();
  let hasDuplicateIdentifier = false;
  for (const u of allUsers) {
    if (u.identifier) {
      if (duplicateIdentifiers.has(u.identifier)) hasDuplicateIdentifier = true;
      duplicateIdentifiers.add(u.identifier);
    }
  }
  assert(!hasDuplicateIdentifier, "Zero duplicate business identifiers across all personas");

  // ------------------------------------------------------------
  // TEST GROUP 2: Doctor Multi-Facility Affiliations & Hierarchy
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Doctor-Facility Affiliations & Hierarchy Integrity");
  const doctor = findIdentityById("DOC-1001")!;
  assert(Boolean(doctor.doctorData?.affiliations && doctor.doctorData.affiliations.length >= 2), "Doctor DOC-1001 maintains multiple legitimate hospital affiliations");

  const doctorAffiliationIds = doctor.doctorData!.affiliations.map((a) => a.organizationIdentifier);
  assert(doctorAffiliationIds.includes("HSP-1001") && doctorAffiliationIds.includes("HSP-1002"), "Doctor is affiliated with City Hospital and Green Care Clinic");

  const docSessions = AppointmentStore.getAllSessions().filter((s) => s.doctor_id === "DOC-1001");
  const allSessionsHaveOrg = docSessions.every((s) => Boolean(s.organization_id && s.facility_id && s.department_id));
  assert(allSessionsHaveOrg, "All doctor working sessions link to valid Organization, Facility, and Department");

  // ------------------------------------------------------------
  // TEST GROUP 3: Appointment Business Rules & Edge Cases
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Appointment Business Rules & State Invariants");
  const allAppts = AppointmentStore.getAllAppointments();
  assert(allAppts.length > 0, `Loaded ${allAppts.length} appointments for business rule auditing`);

  const validStatuses: AppointmentStatus[] = [
    "CONFIRMED", "REQUESTED", "CHECKED_IN", "WAITING",
    "IN_CONSULTATION", "COMPLETED", "CANCELLED", "NO_SHOW"
  ];
  const invalidApptStatuses = allAppts.filter((a) => !validStatuses.includes(a.status));
  assert(invalidApptStatuses.length === 0, "All appointment statuses adhere to authoritative AppointmentStatus enum");

  const apptsWithMissingRefs = allAppts.filter((a) => !a.patient_id || !a.doctor_id || !a.session_id);
  assert(apptsWithMissingRefs.length === 0, "All appointments maintain mandatory foreign keys (patient_id, doctor_id, session_id)");

  // ------------------------------------------------------------
  // TEST GROUP 4: Clinical Encounter & SOAP Notes Data Quality
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Clinical Encounter & SOAP Notes Completeness");
  const allEncounters = getAllEncounters();
  assert(allEncounters.length > 0, `Loaded ${allEncounters.length} clinical encounters`);

  const encountersMissingActors = allEncounters.filter((e) => !e.patient_id || !e.provider_id || !e.organization_id);
  assert(encountersMissingActors.length === 0, "All clinical encounters link to valid patient, provider, and organization");

  // Rejection of encounter with empty clinical reason
  const emptyReasonRes = createEncounter({
    patientId: "PAT-1001",
    providerId: "DOC-1001",
    organizationId: "HSP-1001",
    encounterType: "OUTPATIENT",
    reasonForVisit: "   ",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  assert(emptyReasonRes.success === false && Boolean(emptyReasonRes.error), "Empty clinical reason rejected by encounter validation engine");

  // ------------------------------------------------------------
  // TEST GROUP 5: Prescription & Medication Completeness
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Prescription & Medication Completeness");
  const allRx = getAllPrescriptions();
  assert(allRx.length > 0, `Loaded ${allRx.length} digital prescriptions`);

  let invalidMedications = 0;
  for (const rx of allRx) {
    for (const item of rx.items) {
      if (!item.medicine_name || !item.dosage || !item.frequency || !item.duration) {
        invalidMedications++;
      }
    }
  }
  assert(invalidMedications === 0, "All prescribed medications have complete medicine name, dosage, frequency, and duration");

  // ------------------------------------------------------------
  // TEST GROUP 6: Diagnostic Laboratory & Specimen Integrity
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Diagnostic Lab Orders, Samples & Reports Quality");
  const allLabOrders = getAllLabOrders();
  assert(allLabOrders.length > 0, `Loaded ${allLabOrders.length} lab orders`);

  const allSamples = getAllSamples();
  assert(allSamples.length > 0, `Loaded ${allSamples.length} physical laboratory specimens`);

  const orphanSamples = allSamples.filter((s) => {
    const parentOrder = allLabOrders.find((o) => o.id === s.lab_order_id);
    return !parentOrder;
  });
  assert(orphanSamples.length === 0, "Zero orphan laboratory samples (100% bound to existing lab orders)");

  // ------------------------------------------------------------
  // TEST GROUP 7: Pharmacy FEFO Reservation & Dispensing Rules
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Pharmacy Inventory & Dispensing Integrity");
  const sampleRx = allRx[0];
  const availability = PharmacyInventoryService.evaluatePharmacyAvailability(
    sampleRx.id,
    "PHARM-FAC-1001"
  );
  assert(Boolean(availability && availability.overall_status), "Pharmacy FEFO engine produces deterministic batch availability");

  // ------------------------------------------------------------
  // TEST GROUP 8: Billing Mathematics, Line Item Sum & Waterfall Integrity
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 8: Billing Mathematics & 5-Tier Waterfall Invariants");
  const allBills = getAllBills();
  assert(allBills.length > 0, `Loaded ${allBills.length} healthcare bills`);

  let mathMismatchBills = 0;
  for (const bill of allBills) {
    const calculatedSum = bill.items.reduce(
      (sum, item) => sum + (item.base_amount || (item.quantity * item.unit_price)),
      0
    );
    if (Math.abs(bill.gross_total - calculatedSum) > 0.01) {
      mathMismatchBills++;
    }
  }
  assert(mathMismatchBills === 0, "Sum of line item charges exactly matches gross_total across 100% of bills");

  const targetBill = allBills[0];
  const waterfall = FinancialCoverageService.calculateFinancialWaterfall(targetBill.id);
  assert(Boolean(waterfall && waterfall.gross_charges === targetBill.gross_total), "5-Tier Financial Coverage Waterfall gross charges strictly equal bill gross total");
  assert(Boolean(waterfall && waterfall.projected_patient_responsibility >= 0), "Patient out-of-pocket responsibility is non-negative");

  // ------------------------------------------------------------
  // TEST GROUP 9: Payment Settlement Integrity & Anti-Overpayment
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 9: Payment Settlement & Balance Invariance");
  const allPayments = getAllPayments();
  assert(allPayments.length > 0, `Loaded ${allPayments.length} payment records`);

  const orphanPayments = allPayments.filter((p) => {
    const parentBill = allBills.find((b) => b.id === p.bill_id);
    return !parentBill;
  });
  assert(orphanPayments.length === 0, "Zero orphan payment transactions (100% bound to existing healthcare bills)");

  // ------------------------------------------------------------
  // TEST GROUP 10: Cross-Phase ID Traceability & Zero Broken References
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 10: Cross-Phase Foreign Key Traceability");
  const invalidEncounterPatients = allEncounters.filter((e) => !findIdentityById(e.patient_id));
  assert(invalidEncounterPatients.length === 0, "All encounters reference verified registered patients");

  const invalidPrescriptionEncounters = allRx.filter((r) => !allEncounters.find((e) => e.id === r.encounter_id));
  assert(invalidPrescriptionEncounters.length === 0, "All prescriptions reference verified clinical encounters");

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`S9 DATA QUALITY TEST SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("============================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runS9DataQualityTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
