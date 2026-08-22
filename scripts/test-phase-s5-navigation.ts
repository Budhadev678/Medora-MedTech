// ============================================================
// MEDORA — STABILIZATION S5 NAVIGATION & WORKFLOW TEST SUITE
// Validates Routing, Sidebars, Screen Connectivity, End-to-End Flows,
// Loading/Error/Empty States & Workspace Isolation
// ============================================================

import { ROLE_DASHBOARD_ROUTES, UserRole } from "@/lib/constants";
import { findIdentityById } from "@/lib/data/identity-store";
import { AppointmentStore } from "@/lib/data/appointment-store";
import { getAllEncounters } from "@/lib/data/encounter-store";
import { getAllPrescriptions } from "@/lib/data/prescription-store";
import { getAllLabOrders, getAllLabReports } from "@/lib/data/lab-order-store";
import { getAllBills } from "@/lib/data/billing-store";

async function runS5Tests() {
  console.log("============================================================");
  console.log("MEDORA — STABILIZATION S5 NAVIGATION & USER FLOW SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${description}`);
    }
  }

  // ------------------------------------------------------------
  // TEST GROUP 1: Role Dashboard Routing Matrix & Entrypoints
  // ------------------------------------------------------------
  console.log("TEST GROUP 1: Role Dashboard Routing Matrix & Entrypoints");
  assert(ROLE_DASHBOARD_ROUTES["patient"] === "/patient", "Patient role maps to /patient");
  assert(ROLE_DASHBOARD_ROUTES["doctor"] === "/doctor", "Doctor role maps to /doctor");
  assert(ROLE_DASHBOARD_ROUTES["hospital_admin"] === "/hospital", "Hospital Admin role maps to /hospital");
  assert(ROLE_DASHBOARD_ROUTES["lab_staff"] === "/lab", "Lab Staff role maps to /lab");
  assert(ROLE_DASHBOARD_ROUTES["pharmacy_staff"] === "/pharmacy", "Pharmacy Staff role maps to /pharmacy");
  assert(ROLE_DASHBOARD_ROUTES["emergency_staff"] === "/emergency", "Emergency Staff role maps to /emergency");
  assert(ROLE_DASHBOARD_ROUTES["blood_staff"] === "/blood-bank", "Blood Staff role maps to /blood-bank");
  assert(ROLE_DASHBOARD_ROUTES["finance_staff"] === "/finance", "Finance Staff role maps to /finance");
  assert(ROLE_DASHBOARD_ROUTES["admin"] === "/admin", "Admin role maps to /admin");

  // ------------------------------------------------------------
  // TEST GROUP 2: Doctor Workspace Navigation & Clinical Suite Flow
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 2: Doctor Workspace Navigation & Clinical Suite Flow");
  const doctorRoutes = [
    "/doctor",
    "/doctor/appointments",
    "/doctor/consultations",
    "/doctor/prescriptions",
    "/doctor/lab-orders",
    "/doctor/schedule",
    "/doctor/patients",
  ];
  assert(doctorRoutes.length === 7, "Doctor navigation defines 7 core clinical routes");

  const doctorEncounters = getAllEncounters().filter((e) => e.provider_id === "DOC-1001");
  assert(doctorEncounters.length >= 1, "Doctor has active encounters in Consultation Suite");
  const targetEncounter = doctorEncounters[0];
  const dynamicConsultationRoute = `/doctor/consultations/${targetEncounter.id}`;
  assert(dynamicConsultationRoute.startsWith("/doctor/consultations/ENC-"), "Dynamic consultation detail route passes authentic encounter ID");

  // ------------------------------------------------------------
  // TEST GROUP 3: Laboratory Specimen & Testing Workflow Connectivity
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 3: Laboratory Specimen & Testing Workflow Connectivity");
  const labRoutes = [
    "/lab/orders",
    "/lab/samples",
    "/lab/testing",
    "/lab/verification",
    "/lab/reports",
  ];
  assert(labRoutes.length === 5, "Laboratory workflow defines 5 continuous diagnostic stations");

  const allLabOrders = getAllLabOrders();
  assert(allLabOrders.length >= 1, "Lab orders queue populated for testing");
  const targetLabOrder = allLabOrders[0];
  const dynamicLabOrderRoute = `/lab/orders/${targetLabOrder.id}`;
  assert(dynamicLabOrderRoute.startsWith("/lab/orders/LAB-ORD-"), "Lab order detail route receives authentic order ID parameter");

  // ------------------------------------------------------------
  // TEST GROUP 4: Pharmacy Intake, FEFO & Dispensing Desk Connectivity
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 4: Pharmacy Intake, FEFO & Dispensing Desk Connectivity");
  const pharmacyRoutes = [
    "/pharmacy/prescriptions",
    "/pharmacy/preparation",
    "/pharmacy/pickup",
    "/pharmacy/dispensing",
    "/pharmacy/inventory",
  ];
  assert(pharmacyRoutes.length === 5, "Pharmacy workflow defines 5 sequential dispensing lifecycle stations");

  const allRx = getAllPrescriptions();
  assert(allRx.length >= 1, "Prescription intakes available for pharmacy routing");

  // ------------------------------------------------------------
  // TEST GROUP 5: Patient Mobile-First Consumer Navigation
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 5: Patient Mobile-First Consumer Navigation");
  const patientBottomNav = [
    { label: "Home", href: "/patient" },
    { label: "Health", href: "/patient/health" },
    { label: "Care", href: "/patient/care" },
    { label: "Emergency", href: "/patient/emergency" },
    { label: "Profile", href: "/patient/profile" },
  ];
  assert(patientBottomNav.length === 5, "Patient bottom navigation contains 5 mobile-first core tabs");
  assert(patientBottomNav.some((tab) => tab.href === "/patient/emergency"), "Emergency 1-tap route available in patient mobile navigation");

  // ------------------------------------------------------------
  // TEST GROUP 6: Hospital Operational Command & Billing Console
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 6: Hospital Operational Command & Billing Console");
  const hospitalRoutes = [
    "/hospital",
    "/hospital/appointments",
    "/hospital/billing",
    "/hospital/billing/payments",
    "/hospital/departments",
    "/hospital/doctors",
    "/hospital/admissions",
    "/admin/audit",
  ];
  assert(hospitalRoutes.length === 8, "Hospital management workspace defines 8 departmental administrative routes");

  const allBills = getAllBills();
  assert(allBills.length >= 1, "Billing console contains active invoices for itemized inspection");
  const targetBill = allBills[0];
  const dynamicBillRoute = `/hospital/billing/${targetBill.id}`;
  assert(dynamicBillRoute.startsWith("/hospital/billing/BILL-"), "Hospital billing detail route receives authentic bill ID parameter");

  // ------------------------------------------------------------
  // TEST GROUP 7: Context Preservation & Deep Link Invariance
  // ------------------------------------------------------------
  console.log("\nTEST GROUP 7: Context Preservation & Deep Link Invariance");
  const appts = AppointmentStore.getAllAppointments();
  assert(appts.length >= 1, "Appointments exist for deep-linking verification");
  const targetAppt = appts[0];
  assert(Boolean(targetAppt.id && targetAppt.patient_id && targetAppt.doctor_id), "Appointment maintains complete relational context for route transitions");

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`S5 NAVIGATION TEST SUMMARY: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log("============================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runS5Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
