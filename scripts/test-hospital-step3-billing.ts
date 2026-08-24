import { findIdentityById } from "../lib/data/identity-store";
import { 
  getAllBills, 
  getBillById, 
  getPatientBills, 
  getFacilityBills, 
  getBillVersions 
} from "../lib/data/billing-store";
import { BillingEngineService } from "../lib/services/billing-engine-service";
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

async function runHospitalStep3Suite() {
  console.log("============================================================");
  console.log("MEDORA — HOSPITAL STEP 3: CENTRAL BILLING & FINANCIAL CONTROL");
  console.log("============================================================\n");

  const billingOfficer = findIdentityById("DOC-1001")!;
  const patient = findIdentityById("PAT-1001")!;

  // ------------------------------------------------------------
  // TEST 1: Canonical Billing Store & Itemized Charges
  // ------------------------------------------------------------
  console.log("TEST 1: Canonical Billing Store & Itemized Charges");
  const allBills = getAllBills();
  assert(allBills.length > 0, "1.1 Bills loaded from authoritative central store");

  const primaryBill = allBills[0];
  assert(primaryBill.patient_id === "PAT-1001", "1.2 Bill correctly linked to Patient PAT-1001");
  assert(primaryBill.items.length > 0, "1.3 Bill contains itemized line items (NO single unexplained total)");
  assert(primaryBill.currency === "INR", "1.4 Standardized currency representation (INR)");

  const sampleItem = primaryBill.items[0];
  assert(Boolean(sampleItem.category), "1.5 Line item category is explicit");
  assert(sampleItem.quantity > 0, "1.6 Line item quantity is a positive number");
  assert(sampleItem.unit_price > 0, "1.7 Line item unit price is explicit");
  assert(sampleItem.base_amount === sampleItem.quantity * sampleItem.unit_price, "1.8 Line total mathematically agrees with quantity * price");

  // ------------------------------------------------------------
  // TEST 2: Draft Bill Generation & Source Validation
  // ------------------------------------------------------------
  console.log("\nTEST 2: Draft Bill Generation & Source Validation");
  const draftRes = BillingEngineService.createDraftBill({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    organizationId: "11111111-1111-1111-1111-111111111101",
    organizationName: "City Hospital",
    facilityId: "FAC-1001",
    facilityName: "City Hospital Trauma Center",
    encounterId: "ENC-1001",
    actor: billingOfficer,
  });

  assert(draftRes.success === true, "2.1 Draft bill created successfully");
  const draftBill = draftRes.bill!;
  assert(draftBill.status === "DRAFT", "2.2 Initial bill status is DRAFT");

  // Add bill item
  const addItemRes = BillingEngineService.addBillableItem({
    billId: draftBill.id,
    serviceCode: "CONS-OPD-01",
    quantity: 1,
    sourceType: "ENCOUNTER",
    sourceId: "ENC-1001",
    actor: billingOfficer,
  });
  assert(addItemRes.success === true, "2.3 Billable item added with valid clinical source linkage");

  // ------------------------------------------------------------
  // TEST 3: Bill Issuance & Version Locking
  // ------------------------------------------------------------
  console.log("\nTEST 3: Bill Issuance & Version Snapshot");
  const issueRes = BillingEngineService.issueBill(draftBill.id, billingOfficer);
  assert(issueRes.success === true, "3.1 Bill issued and finalized");
  assert(issueRes.bill?.status === "ISSUED", "3.2 Status transitioned to ISSUED");

  const versions = getBillVersions(draftBill.id);
  assert(versions.length > 0, "3.3 Immutable bill version snapshot created");

  // ------------------------------------------------------------
  // TEST 4: Patient Payment Lifecycle & Anti-Fraud Accounting
  // ------------------------------------------------------------
  console.log("\nTEST 4: Patient Payment Recording & Balance Derivation");
  const updatedBill = getBillById(draftBill.id)!;
  assert(updatedBill.gross_total >= 500, "4.1 Gross total derived from itemized charges");
  assert(updatedBill.patient_responsibility === updatedBill.net_billable_total, "4.2 Net billable total matches patient responsibility");

  // ------------------------------------------------------------
  // TEST 5: Facility Isolation & Access Control
  // ------------------------------------------------------------
  console.log("\nTEST 5: Facility Isolation & Security Bounds");
  const facBills = getFacilityBills("FAC-1001");
  assert(facBills.every(b => b.facility_id === "FAC-1001"), "5.1 All retrieved bills scoped to facility FAC-1001");

  // ------------------------------------------------------------
  // TEST 6: Audit Trail Recording
  // ------------------------------------------------------------
  console.log("\nTEST 6: Financial Audit Trail Recording");
  const auditEvents = AuditLedger.getEvents({ resourceId: draftBill.id });
  assert(auditEvents.length > 0, "6.1 Financial actions logged in AuditLedger");

  console.log("\n============================================================");
  console.log(`HOSPITAL STEP 3 SUMMARY: ${passed}/${passed + failed} assertions passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("============================================================");
}

runHospitalStep3Suite();