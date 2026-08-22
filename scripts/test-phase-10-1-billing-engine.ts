// ============================================================
// MEDORA — PHASE 10.1 TEST SUITE: BILLING ENGINE & PROVENANCE
// ============================================================

import { BillingEngineService } from "../lib/services/billing-engine-service";
import { getBillById, getBillVersions } from "../lib/data/billing-store";
import { findIdentityById } from "../lib/data/identity-store";
import { AuditLedger } from "../lib/data/audit-store";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase101Tests() {
  console.log("============================================================");
  console.log("MEDORA — PHASE 10.1 TEST SUITE: BILLING ENGINE & PROVENANCE");
  console.log("============================================================\n");

  const billingOfficer = {
    id: "USR-BILLING-01",
    identifier: "USR-BILLING-01",
    fullName: "Billing Officer Suresh",
    role: "lab_staff",
    accountStatus: "active",
  };
  const patientActor = findIdentityById("PAT-1001");

  // ------------------------------------------------------------
  // TEST GROUP 1: Draft Bill Creation & Decoupling
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Draft Bill Creation & Decoupling");

  const createRes = BillingEngineService.createDraftBill({
    patientId: "PAT-1001",
    patientName: "Rahul Verma",
    organizationId: "11111111-1111-1111-1111-111111111101",
    organizationName: "City Hospital",
    facilityId: "FAC-1001",
    facilityName: "City Hospital — Rourkela Central",
    encounterId: "ENC-1001",
    billType: "FINAL",
    actor: billingOfficer as any,
  });

  assert(createRes.success === true, "Created draft HealthcareBill entity");
  assert(Boolean(createRes.bill), "Server returned HealthcareBill instance");
  assert(createRes.bill?.status === "DRAFT", "Initial status is DRAFT");
  const billId = createRes.bill!.id;

  // ------------------------------------------------------------
  // TEST GROUP 2: Source Linkage & Service Catalog Pricing
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Source Linkage & Service Catalog Pricing");

  const consItemRes = BillingEngineService.addBillableItem({
    billId,
    serviceCode: "CONS-OPD-01",
    sourceType: "ENCOUNTER",
    sourceId: "ENC-1001",
    quantity: 1,
    actor: billingOfficer as any,
  });
  assert(consItemRes.success === true, "Added consultation charge item from ENCOUNTER source");
  assert(consItemRes.billItem?.unit_price === 500.00, "Looked up catalog price for CONS-OPD-01 (₹500)");

  const mriItemRes = BillingEngineService.addBillableItem({
    billId,
    serviceCode: "IMG-MRI-BRAIN-01",
    sourceType: "IMAGING",
    sourceId: "IMG-1001",
    quantity: 1,
    actor: billingOfficer as any,
  });
  assert(mriItemRes.success === true, "Added MRI charge item from IMAGING source");
  assert(mriItemRes.billItem?.unit_price === 12000.00, "Looked up catalog price for IMG-MRI-BRAIN-01 (₹12,000)");

  // ------------------------------------------------------------
  // TEST GROUP 3: "Why Was I Charged?" Provenance Chain
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: 'Why Was I Charged?' Provenance Chain");

  const updatedBill = getBillById(billId);
  assert(updatedBill?.items.length === 2, "Bill contains 2 itemized charges");
  assert(updatedBill?.items[1].verification_status === "VERIFIED", "MRI charge status is VERIFIED");
  assert(Boolean(updatedBill?.items[1].provenance?.ordered_by_name), "Compiled provenance: ordered_by_name populated");
  assert(Boolean(updatedBill?.items[1].provenance?.clinical_reason), "Compiled provenance: clinical_reason populated");

  // ------------------------------------------------------------
  // TEST GROUP 4: Bill Issuance & Versioning Engine
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Bill Issuance & Versioning Engine");

  const issueRes = BillingEngineService.issueBill(billId, billingOfficer as any);
  assert(issueRes.success === true, "Issued authoritative HealthcareBill");
  assert(issueRes.bill?.status === "ISSUED", "Bill status updated to ISSUED");

  // Versioning Test
  const versionRes = BillingEngineService.createNewBillVersion({
    billId,
    reason: "Added ICU room stay charge for overnight observation",
    newItems: [
      updatedBill!.items[0],
      updatedBill!.items[1],
      {
        service_id: "SERV-ROOM-01",
        service_code: "ROOM-ICU-DAY",
        service_name: "Intensive Care Unit (ICU) Room Stay",
        category: "ROOM",
        source_type: "ADMISSION",
        source_id: "ADM-1001",
        description_snapshot: "ICU Room Stay (1 Day)",
        quantity: 1,
        unit_price: 8000.00,
        base_amount: 8000.00,
        currency: "INR",
        price_id: "PRICE-ROOM-01",
        service_date: new Date().toISOString(),
        verification_status: "VERIFIED",
      },
    ],
    actor: billingOfficer as any,
  });

  assert(versionRes.success === true, "Created version 2 of bill with mandatory change reason");
  assert(versionRes.version?.version_number === 2, "New bill version number is 2");
  assert(versionRes.version?.change_delta === 8000.00, "Calculated change delta (+₹8,000)");

  const versions = getBillVersions(billId);
  assert(versions.length >= 2, "Preserved complete version history (V1 & V2)");

  // ------------------------------------------------------------
  // TEST GROUP 5: Full MEDORA Audit Integration
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Full MEDORA Audit Integration");

  const auditEvents = AuditLedger.getEvents({ resourceId: billId });
  assert(auditEvents.length > 0, "Audit ledger recorded BILL_ISSUED and BILL_VERSION_CREATED events");

  console.log("\n============================================================");
  console.log(`PHASE 10.1 TEST SUMMARY: ${passedCount}/${passedCount + failedCount} assertions passed (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase101Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
