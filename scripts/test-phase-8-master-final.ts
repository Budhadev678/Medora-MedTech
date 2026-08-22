// ============================================================
// MEDORA — MASTER PHASE 8 COMPREHENSIVE FINAL SUITE (8.1, 8.2, 8.3, 8.4)
// Master Phase 8: Connected Laboratory System
// ============================================================

import { execSync } from "child_process";

async function runMasterPhase8Final() {
  console.log("============================================================");
  console.log("MEDORA — MASTER PHASE 8 COMPREHENSIVE FINAL VERIFICATION");
  console.log("============================================================\n");

  const suites = [
    { name: "Phase 8.1: Laboratory Organization & Order Intake", script: "scripts/test-phase-8-1-lab-intake.ts" },
    { name: "Phase 8.2: Patient Verification, Sample Collection & Chain of Custody", script: "scripts/test-phase-8-2-sample-custody.ts" },
    { name: "Phase 8.3: Laboratory Testing, Result Entry & Report Generation", script: "scripts/test-phase-8-3-testing-reports.ts" },
    { name: "Phase 8.4: Report Delivery, Access & Authenticity Verification", script: "scripts/test-phase-8-4-delivery-authenticity.ts" },
  ];

  for (const s of suites) {
    console.log(`\n▶ EXECUTING: ${s.name}...`);
    try {
      const output = execSync(`npx tsx ${s.script}`, { encoding: "utf-8" });
      console.log(output);
    } catch (err: any) {
      console.error(`❌ FAILURE IN SUITE: ${s.name}`);
      console.error(err.stdout || err.message);
      process.exit(1);
    }
  }

  console.log("\n============================================================");
  console.log("MASTER PHASE 8 ALL 4 SUB-PHASES (8.1, 8.2, 8.3, 8.4) 100% VERIFIED!");
  console.log("============================================================\n");
}

runMasterPhase8Final();
