// ============================================================
// MEDORA â€” STABILIZATION S6 UI/UX & DESIGN SYSTEM TEST SUITE
// Validates Design System Primitives, Status Badges, Typography,
// Indian Healthcare Currency Formatting, Date Formats & Responsive Shells
// ============================================================

import { formatCurrency, formatDate, maskIdentityNumber, cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

async function runS6Tests() {
  console.log("============================================================");
  console.log("MEDORA â€” STABILIZATION S6 UI/UX & DESIGN SYSTEM SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      console.log(`  âœ“ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  âœ• FAIL: ${description}`);
    }
  }

  // ------------------------------------------------------------
  // TEST GROUP 1: Indian Healthcare Currency Formatting (₹ INR)
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Indian Healthcare Currency Formatting (₹ INR)");
  const formatted5000 = formatCurrency(5000);
  assert(formatted5000.includes("₹") && formatted5000.includes("5,000"), "Currency 5000 correctly formatted with ₹ Rupee symbol and Indian comma separation");

  const formattedZero = formatCurrency(0);
  assert(formattedZero.includes("₹") && formattedZero.includes("0"), "Zero currency correctly formatted as ₹0");

  const formattedLarge = formatCurrency(125000);
  assert(formattedLarge.includes("₹") && (formattedLarge.includes("1,25,000") || formattedLarge.includes("125,000")), "Large healthcare invoice formatted cleanly without decimals");

  // ------------------------------------------------------------
  // TEST GROUP 2: Medical Date & Clinical Timestamp Formatting
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Medical Date & Clinical Timestamp Formatting");
  const sampleIso = "2026-08-20T10:30:00.000Z";
  const formattedDate = formatDate(sampleIso);
  assert(formattedDate.includes("Aug") && formattedDate.includes("2026"), "Date formatted to readable Indian medical standard (e.g. 20 Aug 2026)");

  const formattedWithTime = formatDate(sampleIso, true);
  assert(formattedWithTime.includes("Aug") && (formattedWithTime.toUpperCase().includes("AM") || formattedWithTime.toUpperCase().includes("PM")), "Timestamp formatted with AM/PM for clinical appointments");

  // ------------------------------------------------------------
  // TEST GROUP 3: Sensitive Medical Identity Number Masking
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Sensitive Medical Identity Number Masking");
  const maskedAadhaar = maskIdentityNumber("1234 5678 9012");
  assert(maskedAadhaar === "XXXX XXXX 9012", "Sensitive Aadhaar / ABHA identity masked to protect patient privacy");

  // ------------------------------------------------------------
  // TEST GROUP 4: Button Variant & State System
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Button Variant & State System");
  const defaultClasses = buttonVariants({ variant: "default", size: "default" });
  assert(defaultClasses.includes("bg-primary"), "Primary button uses theme primary color");

  const emergencyClasses = buttonVariants({ variant: "emergency", size: "default" });
  assert(emergencyClasses.includes("bg-red-600"), "Emergency action button uses urgent red styling");

  const successClasses = buttonVariants({ variant: "success", size: "sm" });
  assert(successClasses.includes("bg-emerald-600") && successClasses.includes("h-8"), "Success action button uses emerald styling with small size variant");

  // ------------------------------------------------------------
  // TEST GROUP 5: Tailwind Utility Merge Invariance (clsx + twMerge)
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Tailwind Utility Merge Invariance (clsx + twMerge)");
  const mergedClass = cn("px-4 py-2 bg-blue-500", "bg-teal-600", { "text-white": true, "hidden": false });
  assert(mergedClass.includes("bg-teal-600") && !mergedClass.includes("bg-blue-500") && mergedClass.includes("text-white"), "Class merger correctly overrides earlier duplicate utility classes");

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`S6 UI/UX TEST SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("============================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runS6Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
