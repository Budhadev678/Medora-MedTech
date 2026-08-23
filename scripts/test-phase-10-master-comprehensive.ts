// ============================================================
// MEDORA â€” MASTER PHASE 10 COMPREHENSIVE TEST VERIFICATION SUITE
// Master Suite for Phase 10.1 & Phase 10.2
// ============================================================

import { execSync } from "child_process";

async function runMasterPhase10Suite() {
  console.log("============================================================");
  console.log("MEDORA â€” MASTER PHASE 10 COMPREHENSIVE VERIFICATION (10.1 & 10.2)");
  console.log("============================================================\n");

  const suites = [
    { name: "Phase 10.1: Billing Engine, Service Linkage & Provenance", script: "scripts/test-phase-10-1-billing-engine.ts" },
    { name: "Phase 10.2: Financial Coverage Waterfall & Assistance", script: "scripts/test-phase-10-2-coverage-assistance.ts" },
    { name: "Phase 10.3: Payments, Refunds & 3-Way Reconciliation", script: "scripts/test-phase-10-3-payments-reconciliation.ts" },
    { name: "Phase 10.4: Financial Disputes, Anomaly Engine & Complete Transparency", script: "scripts/test-phase-10-4-disputes-investigation.ts" },
  ];

  for (const s of suites) {
    console.log(`\nâ–¶ EXECUTING: ${s.name}...`);
    try {
      const output = execSync(`npx tsx ${s.script}`, { encoding: "utf8", stdio: "inherit" });
    } catch (err: any) {
      console.error(`âŒ Suite ${s.name} failed!`);
      process.exit(1);
    }
  }

  console.log("\n============================================================");
  console.log("MASTER PHASE 10 SUB-PHASES (10.1 & 10.2) 100% VERIFIED!");
  console.log("============================================================\n");
}

runMasterPhase10Suite().catch((err) => {
  console.error("Master Phase 10 test execution failed:", err);
  process.exit(1);
});
