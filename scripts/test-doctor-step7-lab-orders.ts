import { findIdentityById } from "../lib/data/identity-store";
import { 
  getDoctorLabOrders, 
  getLabOrderById, 
  saveLabOrderDraft, 
  placeLabOrder, 
  cancelLabOrder, 
  getOrderTestResults,
  getAllLabReports
} from "../lib/data/lab-order-store";
import { createEncounter } from "../lib/data/encounter-store";
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

async function runDoctorStep7Suite() {
  console.log("============================================================");
  console.log("MEDORA — DOCTOR SIDE STEP 7: LAB & DIAGNOSTIC INVESTIGATION");
  console.log("============================================================\n");

  const docA = findIdentityById("DOC-1001")!;
  const docB = findIdentityById("DOC-1002")!;
  const patient = findIdentityById("PAT-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Authoritative Lab Orders Loading & Facility Scoping
  // ------------------------------------------------------------
  console.log("TEST 1: Authoritative Lab Orders Loading & Facility Scoping");
  const docAOrders = getDoctorLabOrders("DOC-1001");
  assert(docAOrders.length > 0, "1.1 Doctor A lab orders loaded from authoritative store");
  assert(docAOrders.every(o => o.ordering_provider_id === "DOC-1001"), "1.2 All orders strictly belong to Doctor A");

  const primaryOrder = docAOrders[0];
  assert(primaryOrder.patient_id === "PAT-1001", "1.3 Order correctly references Patient PAT-1001");
  assert(Boolean(primaryOrder.order_reference), "1.4 Order reference format is present");
  assert(Boolean(primaryOrder.facility_id || primaryOrder.organization_id), "1.5 Facility context attached to lab order");

  // ------------------------------------------------------------
  // TEST 2: Structured Investigation Ordering & Priority
  // ------------------------------------------------------------
  console.log("\nTEST 2: Structured Investigation Ordering & Priority");
  const encRes = createEncounter({
    patientId: "PAT-1001",
    providerId: "DOC-1001",
    organizationId: "HSP-1001",
    departmentId: "DEP-1001",
    departmentName: "Cardiology OPD",
    encounterType: "CONSULTATION",
    reasonForVisit: "Diagnostic workup for dyspnea",
    location: "OPD Room 102",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });
  const encId = encRes.encounter!.id;

  const draftRes = saveLabOrderDraft({
    encounterId: encId,
    items: [
      {
        id: "LOI-STEP7-1",
        test_name: "Lipid Profile Panel",
        test_code: "TEST-LIP-001",
        specimen_type: "Venous Blood",
      },
    ],
    priority: "URGENT",
    reason: "Evaluate hyperlipidemia and cardiovascular risk",
    instructions: "12-hour fasting required prior to blood draw.",
    actorId: "DOC-1001",
    actorName: "Dr. Ananya Sharma",
    actorRole: "doctor",
  });

  assert(draftRes.success === true, "2.1 Investigation order draft created successfully");
  const draftOrder = draftRes.order!;
  assert(draftOrder.status === "DRAFT", "2.2 Initial investigation order status is DRAFT");
  assert(draftOrder.priority === "URGENT", "2.3 Order priority captured as URGENT");

  // ------------------------------------------------------------
  // TEST 3: Place Order & State Transition
  // ------------------------------------------------------------
  console.log("\nTEST 3: Place Order & State Transition");
  const placeRes = placeLabOrder(draftOrder.id);
  assert(placeRes.success === true, "3.1 Investigation order submitted/placed");
  assert(placeRes.order?.status === "ORDERED", "3.2 Order status transitioned to ORDERED");
  assert(Boolean(placeRes.order?.ordered_at), "3.3 Authoritative ordered timestamp recorded");

  // ------------------------------------------------------------
  // TEST 4: Lab Result Retrieval & Abnormal Parameter Flagging
  // ------------------------------------------------------------
  console.log("\nTEST 4: Lab Result Retrieval & Abnormal Parameter Flagging");
  const results = getOrderTestResults("LAB-ORD-1001");
  assert(results.length > 0, "4.1 Verified test results retrieved for primary order");

  const cholesterolResult = results.find(r => r.parameter_name.toLowerCase().includes("cholesterol"));
  assert(Boolean(cholesterolResult), "4.2 Total cholesterol parameter result present");
  if (cholesterolResult) {
    assert(Boolean(cholesterolResult.unit), "4.3 Explicit unit (mg/dL) attached to numeric value");
    assert(Boolean(cholesterolResult.reference_range), "4.4 Laboratory reference range provided");
    assert(cholesterolResult.flag === "HIGH" || cholesterolResult.flag === "NORMAL", "4.5 Clinical abnormality flag present");
  }

  // ------------------------------------------------------------
  // TEST 5: Order Cancellation & Non-Destructive Archival
  // ------------------------------------------------------------
  console.log("\nTEST 5: Order Cancellation & Non-Destructive Archival");
  const cancelRes = cancelLabOrder(
    draftOrder.id,
    "Patient preferred to perform testing at specialized external center",
    "DOC-1001",
    "Dr. Ananya Sharma",
    "doctor"
  );
  assert(cancelRes.success === true, "5.1 Investigation order cancelled");
  assert(cancelRes.order?.status === "CANCELLED", "5.2 Order status transitioned to CANCELLED");
  assert(cancelRes.order?.cancellation_reason?.length! > 0, "5.3 Cancellation reason preserved");

  // Verify non-destructive trace
  const queriedOrder = getLabOrderById(draftOrder.id);
  assert(Boolean(queriedOrder), "5.4 Cancelled order remains queryable in database");

  // ------------------------------------------------------------
  // TEST 6: Anti-IDOR & Doctor Authorization Protection
  // ------------------------------------------------------------
  console.log("\nTEST 6: Anti-IDOR & Doctor Authorization Protection");
  // Doctor B attempting to cancel Doctor A's order
  const unauthorizedCancel = cancelLabOrder(
    "LAB-ORD-1001",
    "Illegal cancellation attempt",
    "DOC-1002",
    "Dr. Rajesh Sharma",
    "doctor"
  );
  assert(unauthorizedCancel.success === false, "6.1 Doctor B cannot cancel Doctor A's lab order");

  // ------------------------------------------------------------
  // TEST 7: Audit Trail Recording
  // ------------------------------------------------------------
  console.log("\nTEST 7: Audit Trail Recording");
  const auditEvents = AuditLedger.getEvents({ resourceId: draftOrder.id });
  assert(auditEvents.length > 0, "7.1 Investigation lifecycle events captured in AuditLedger");

  console.log("\n============================================================");
  console.log(`DOCTOR STEP 7 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runDoctorStep7Suite();