// ============================================================
// MEDORA â€” MASTER PHASE 9 COMPREHENSIVE SUITE (SUB-PHASES 9.1 & 9.2)
// Master Phase 9: Connected Pharmacy & Medicine Dispensing System
// ============================================================

import { execSync } from "child_process";

async function runMasterPhase9Comprehensive() {
  console.log("============================================================");
  console.log("MEDORA â€” MASTER PHASE 9 COMPREHENSIVE VERIFICATION (9.1 & 9.2)");
  console.log("============================================================\n");

  const suites = [
    { name: "Phase 9.1: Pharmacy Organization & Prescription Intake", script: "scripts/test-phase-9-1-pharmacy-intake.ts" },
    { name: "Phase 9.2: Inventory, Availability & Stock Reservation", script: "scripts/test-phase-9-2-inventory-availability.ts" },
    { name: "Phase 9.3: Pharmacy Order Management & Dispensing", script: "scripts/test-phase-9-3-order-dispensing.ts" },
    { name: "Phase 9.4: Transparency, Notifications & Timeline", script: "scripts/test-phase-9-4-transparency-timeline.ts" },
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
  console.log("MASTER PHASE 9 ALL 4 SUB-PHASES (9.1, 9.2, 9.3, 9.4) 100% VERIFIED!");
  console.log("============================================================\n");
}

runMasterPhase9Comprehensive();
