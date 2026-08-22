# MEDORA — Stabilization Track S2: Bug Registry

**Stabilization Phase**: S2  
**Total Cataloged Bugs Addressed**: 10  
**Traceability**: Mapped from S1 Audit Registry

---

## 1. S1 to S2 Bug Repair Traceability Matrix

| S1 Bug ID | S2 Fix ID | Severity | Phase | Bug Description | Files Changed | Root Cause & Resolution | Status |
|---|---|---|---|---|---|---|---|
| `BUG-H001` / `BUG-L004` | `S2-FIX-001` | HIGH | 6 | `app/api/appointments/route.ts` TypeScript compilation error | `app/api/appointments/route.ts` | Extra properties `patient_name` & `slot_display_time` passed to `BookingRequest`. Aligned payload to typed interface. | `VERIFIED` |
| `BUG-H008` | `S2-FIX-002` | HIGH | 10 | `app/api/billing/bills/route.ts` import mismatch & invalid bill type | `app/api/billing/bills/route.ts` | Non-existent export `getBillsForPatient` imported; invalid `billType: "OPD"`. Replaced with `getBillsByPatient` and `billType: "FINAL"`. | `VERIFIED` |
| `BUG-H009` | `S2-FIX-003` | HIGH | 10 | `app/api/billing/disputes/route.ts` import mismatch & parameter error | `app/api/billing/disputes/route.ts` | Non-existent export `getDisputesForPatient` imported; passed `reason` instead of `{ category, description }`. Aligned parameters. | `VERIFIED` |
| `BUG-H004` | `S2-FIX-004` | HIGH | 10 | `app/api/billing/reconciliation/route.ts` method call error | `app/api/billing/reconciliation/route.ts` | Invoked `execute3WayReconciliation`. Replaced with authoritative method `FinancialReconciliationService.runReconciliation`. | `VERIFIED` |
| `BUG-H007` | `S2-FIX-005` | HIGH | 10 | `app/api/billing/refunds/route.ts` argument count mismatch | `app/api/billing/refunds/route.ts` | Method expected single structured object but route passed 2 arguments. Corrected to `{ paymentId, amount, reason, actor }`. | `VERIFIED` |
| `BUG-M007` | `S2-FIX-006` | MEDIUM | 8 | `app/api/lab/samples/route.ts` argument count mismatch | `app/api/lab/samples/route.ts` | Method expected 3 arguments `(orderId, data, actor)` but route passed 2. Supplied required 3 parameters. | `VERIFIED` |
| `BUG-H006` | `S2-FIX-007` | HIGH | 9 | `app/api/pharmacy/dispense/route.ts` signature & return mismatch | `app/api/pharmacy/dispense/route.ts` | Expected 3 args `(orderId, otpCode, actor)`; return property was `.dispensing`. Aligned signature and property access. | `VERIFIED` |
| `BUG-H005` | `S2-FIX-008` | HIGH | 9 | `app/api/pharmacy/inventory/route.ts` method call error | `app/api/pharmacy/inventory/route.ts` | Called `evaluateSingleFacilityAvailability`. Replaced with `PharmacyInventoryService.evaluatePharmacyAvailability`. | `VERIFIED` |
| `BUG-A001` | `S2-FIX-009` | MEDIUM | 1 | `lib/api/api-utils.ts` Admin persona lookup key mismatch | `lib/api/api-utils.ts` | Admin cookie lookup searched for `"ADMIN-1001"`, but identity store uses `"ADM-1001"`. Fixed lookup key. | `VERIFIED` |
| `BUG-T001` | `S2-FIX-010` | LOW | S2 | `scripts/test-phase-s2-backend-apis.ts` enum and type errors | `scripts/test-phase-s2-backend-apis.ts` | `EncounterStatus` used `"IN_CONSULTATION"` instead of `"IN_PROGRESS"`; test result fixture had extra fields. Corrected types. | `VERIFIED` |
| `BUG-P001` | `S2-FIX-011` | HIGH | 7 | Doctor provider check bypass in `lab-order-service.ts` & `prescription-order-service.ts` | `lib/services/lab-order-service.ts`, `lib/services/prescription-order-service.ts` | Removed erroneous `!actor.identifier.includes("doc")` substring bypass to strictly enforce attending doctor isolation. | `VERIFIED` |

---

## 2. Status Breakdown

* **Total Bugs Verified & Resolved**: 11
* **Open S2 Bugs**: 0
* **Regression Bugs**: 0
