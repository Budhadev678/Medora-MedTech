// ============================================================
// MEDORA â€” MASTER PHASE 8 COMPREHENSIVE SUITE (PHASE 8.1 & 8.2)
// Master Phase 8: Connected Laboratory System
// (Phase 8.1 Lab Intake + Phase 8.2 Sample Collection & Custody)
// ============================================================

import { execSync } from "child_process";

async function runMasterPhase8() {
  console.log("============================================================");
  console.log("MEDORA â€” MASTER PHASE 8 COMPREHENSIVE VERIFICATION");
  console.log("============================================================\n");

  const suites = [
    { name: "Phase 8.1: Laboratory Organization & Order Intake", script: "scripts/test-phase-8-1-lab-intake.ts" },
    { name: "Phase 8.2: Patient Verification, Sample Collection & Chain of Custody", script: "scripts/test-phase-8-2-sample-custody.ts" },
  ];

  for (const s of suites) {
    console.log(`\nâ–¶ EXECUTING: ${s.name}...`);
    try {
      const output = execSync(`npx tsx ${s.script}`, { encoding: "utf-8" });
      console.log(output);
    } catch (err: any) {
      console.error(`âŒ FAILURE IN SUITE: ${s.name}`);
      console.error(err.stdout || err.message);
      process.exit(1);
    }
  }

  console.log("\n============================================================");
  console.log("MASTER PHASE 8.1 & 8.2 VERIFICATION SUCCESSFUL â€” 100% VERIFIED!");
  console.log("============================================================\n");
}

runMasterPhase8();
