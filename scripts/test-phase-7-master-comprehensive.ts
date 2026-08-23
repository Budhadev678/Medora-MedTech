// ============================================================
// MEDORA â€” MASTER PHASE 7 COMPREHENSIVE SUITE
// Master Phase 7: Digital Consultation & Prescription
// (Phase 7.1 + Phase 7.2 + Phase 7.3 + Phase 7.4)
// ============================================================

import { execSync } from "child_process";

async function runMasterPhase7() {
  console.log("============================================================");
  console.log("MEDORA â€” MASTER PHASE 7 COMPREHENSIVE VERIFICATION");
  console.log("============================================================\n");

  const suites = [
    { name: "Phase 7.1: Clinical Encounter & Documentation", script: "scripts/test-phase-7-1-clinical-encounter.ts" },
    { name: "Phase 7.2: Digital Prescription & Medication Workflow", script: "scripts/test-phase-7-2-prescription-workflow.ts" },
    { name: "Phase 7.3: Lab Orders, Referrals & Follow-Up", script: "scripts/test-phase-7-3-lab-referral-followup.ts" },
    { name: "Phase 7.4: Integration, Integrity & Hardening", script: "scripts/test-phase-7-4-hardening-integration.ts" },
  ];

  let totalPassed = 0;

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
  console.log("MASTER PHASE 7 VERIFICATION SUCCESSFUL â€” ALL 4 SUB-PHASES 100% VERIFIED!");
  console.log("============================================================\n");
}

runMasterPhase7();
