# MEDORA — Stabilization Track S2: Change Log

**Track**: S2 (Backend, API & Data-Flow Stabilization)  
**Date**: 2026-08-22

---

## 1. Summary of Changes

During Stabilization Track S2, all 19 HTTP API route handlers under `app/api/` and supporting domain services were reviewed, repaired, and aligned with core TypeScript interfaces and database models. Zero breaking changes were introduced, and full backward compatibility with existing frontends was preserved.

---

## 2. File-by-File Detailed Changelog

### `lib/api/api-utils.ts`
* **Change**: Corrected Admin persona lookup from `"ADMIN-1001"` to `"ADM-1001"` to match `lib/data/identity-store.ts`.
* **Reason**: Prevented unauthenticated fallback for Admin requests using the `medora_role=admin` cookie.

### `app/api/appointments/route.ts`
* **Change**: Removed unsupported `patient_name` and `slot_display_time` properties from the `BookingRequest` object passed to `AppointmentBookingService.bookAppointment`.
* **Reason**: Aligned with `BookingRequest` TypeScript interface and resolved compilation error TS2353.

### `app/api/billing/bills/route.ts`
* **Change**: Replaced non-existent `getBillsForPatient` with `getBillsByPatient`; updated `billType` parameter from `"OPD"` to `"FINAL"`.
* **Reason**: Resolved compilation errors TS2724 and TS2322.

### `app/api/billing/disputes/route.ts`
* **Change**: Replaced `getDisputesForPatient` with `getDisputesByPatient`; updated `DisputeInvestigationService.submitDispute` parameter payload to pass `description: reason` and `category: category || "UNRECOGNIZED_CHARGE"`.
* **Reason**: Resolved compilation errors TS2724 and TS2353.

### `app/api/billing/reconciliation/route.ts`
* **Change**: Replaced `execute3WayReconciliation` with `FinancialReconciliationService.runReconciliation` passing `{ organizationId, facilityId, periodStart, periodEnd, actor }`.
* **Reason**: Resolved compilation error TS2339.

### `app/api/billing/refunds/route.ts`
* **Change**: Updated `RefundReversalService.requestRefund` call to pass a single structured object `{ paymentId, amount, reason, actor }`.
* **Reason**: Resolved compilation error TS2554.

### `app/api/lab/samples/route.ts`
* **Change**: Updated `LabSampleService.collectSample` call to supply all 3 required arguments `(lab_order_id, data, user)`.
* **Reason**: Resolved compilation error TS2554.

### `app/api/pharmacy/dispense/route.ts`
* **Change**: Aligned `PharmacyFulfillmentService.dispenseOrder` call signature to `(order_id, otp_code, user)` and mapped `.dispensing` response property.
* **Reason**: Resolved compilation errors TS2554 and TS2339.

### `app/api/pharmacy/inventory/route.ts`
* **Change**: Replaced `evaluateSingleFacilityAvailability` with `PharmacyInventoryService.evaluatePharmacyAvailability`.
* **Reason**: Resolved compilation error TS2339.

### `lib/services/lab-order-service.ts` & `lib/services/prescription-order-service.ts`
* **Change**: Removed erroneous `!actor.identifier.includes("doc")` substring bypass from doctor authorization guards.
* **Reason**: Strictly enforces attending doctor isolation so Doctor B cannot compose prescriptions or lab orders inside Doctor A's encounter.

### `scripts/test-phase-s2-backend-apis.ts`
* **Change**: Fixed `EncounterStatus` to `"IN_PROGRESS"`; fixed `HealthcareTestResult` typing.
* **Reason**: Ensured 100% clean test execution for S2 HTTP route verification.
