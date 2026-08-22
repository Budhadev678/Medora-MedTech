# MEDORA — Stabilization Track S2: Backend & API Plan

**Status Track**: S2  
**Scope**: Backend, API, Database-Connection & Data-Flow Stabilization (Phases 0–10)  
**Status Key**: `NOT_STARTED` | `IN_PROGRESS` | `FIXED` | `TESTING` | `FAILED` | `BLOCKED` | `VERIFIED` | `DEFERRED`

---

## 1. Objectives & Principles

The objective of **Stabilization Track S2** is to ensure that the frontend communicates with **ONE consistent backend** and **ONE consistent data source** across all Phase 0–10 workflows.

```
USER ──► MEDORA SCREEN ──► FRONTEND SERVICE ──► API ROUTE ──► AUTH & ROLE CHECK ──► DOMAIN SERVICE ──► DATA STORE ──► BACKEND RESPONSE ──► UI UPDATE
```

Every endpoint enforces:
1. Request payload validation (required fields, formats, positive numbers, non-empty text).
2. Server-side role validation (`validateRole`) and identity resolution (`getAuthenticatedUser`).
3. Business rules enforcement (capacity limits, doctor availability, non-negative amounts, duplicate-dispense protection).
4. Standardized JSON response formatting (`success`, `data`, `error`, `code`, and clean HTTP status codes).

---

## 2. API Repair & Implementation Matrix

| S1 Problem ID | Affected Feature | API Route | Affected Backend Service / File | Repair Action | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `S1-BUG-004` / `BUG-L004` | Phase 6 Appointments | `app/api/appointments/route.ts` | `AppointmentBookingService` | Removed unsupported `patient_name` & `slot_display_time` from `BookingRequest` literal | `VERIFIED` |
| `S1-BUG-008` / `BUG-H008` | Phase 10 Billing | `app/api/billing/bills/route.ts` | `BillingStore` | Replaced non-existent import `getBillsForPatient` with `getBillsByPatient`; set valid `BillType = "FINAL"` | `VERIFIED` |
| `S1-BUG-009` / `BUG-H009` | Phase 10 Billing | `app/api/billing/disputes/route.ts` | `DisputeInvestigationService` | Replaced `getDisputesForPatient` with `getDisputesByPatient`; aligned parameter keys (`description`, `category`) | `VERIFIED` |
| `S1-BUG-007` / `BUG-H004` | Phase 10 Billing | `app/api/billing/reconciliation/route.ts` | `FinancialReconciliationService` | Replaced non-existent method call `execute3WayReconciliation` with `runReconciliation` | `VERIFIED` |
| `S1-BUG-010` / `BUG-H007` | Phase 10 Billing | `app/api/billing/refunds/route.ts` | `RefundReversalService` | Fixed parameter count from 2 arguments to single structured parameter object `{ paymentId, amount, reason, actor }` | `VERIFIED` |
| `S1-BUG-017` / `BUG-M007` | Phase 8 Laboratory | `app/api/lab/samples/route.ts` | `LabSampleService` | Supplied all 3 required arguments `(orderId, data, actor)` to `LabSampleService.collectSample` | `VERIFIED` |
| `S1-BUG-006` / `BUG-H006` | Phase 9 Pharmacy | `app/api/pharmacy/dispense/route.ts` | `PharmacyFulfillmentService` | Aligned method signature to `(orderId, otpCode, actor)` and accessed returned `.dispensing` property | `VERIFIED` |
| `S1-BUG-005` / `BUG-H005` | Phase 9 Pharmacy | `app/api/pharmacy/inventory/route.ts` | `PharmacyInventoryService` | Replaced non-existent method `evaluateSingleFacilityAvailability` with `evaluatePharmacyAvailability` | `VERIFIED` |
| `S1-AUTH-001` | Phase 1 Identity | `lib/api/api-utils.ts` | `IdentityStore` | Fixed Admin identifier lookup key from `"ADMIN-1001"` to `"ADM-1001"` | `VERIFIED` |
| `S1-TEST-001` | S2 Test Suite | `scripts/test-phase-s2-backend-apis.ts` | Test Fixtures | Fixed `EncounterStatus = "IN_PROGRESS"` and `HealthcareTestResult` typing | `VERIFIED` |

---

## 3. Full HTTP API Route Inventory (19 Routes)

| # | Endpoint | Methods | Role Permission | Service Integration | Status |
|---|---|---|---|---|---|
| 1 | `/api/auth/session` | `GET` | All authenticated | `findIdentityById` | `VERIFIED` |
| 2 | `/api/appointments` | `GET`, `POST` | Patient, Doctor, Admin | `AppointmentBookingService` | `VERIFIED` |
| 3 | `/api/appointments/check-in` | `POST` | Receptionist, Staff, Doctor | `QueueManagementService` | `VERIFIED` |
| 4 | `/api/consultations` | `GET`, `POST` | Doctor, Admin | `ConsultationService` | `VERIFIED` |
| 5 | `/api/prescriptions` | `GET`, `POST` | Doctor, Pharmacist, Patient | `PrescriptionOrderService` | `VERIFIED` |
| 6 | `/api/lab/orders` | `GET`, `POST` | Doctor, Lab Staff, Patient | `LabOrderService` | `VERIFIED` |
| 7 | `/api/lab/samples` | `POST` | Lab Staff, Admin | `LabSampleService` | `VERIFIED` |
| 8 | `/api/lab/reports` | `GET`, `POST` | Pathologist, Lab Staff, Patient | `LabReportService` | `VERIFIED` |
| 9 | `/api/pharmacy/intake` | `POST` | Pharmacy Staff, Admin | `PharmacyIntakeService` | `VERIFIED` |
| 10 | `/api/pharmacy/inventory` | `GET`, `POST` | Pharmacy Staff, Admin | `PharmacyInventoryService` | `VERIFIED` |
| 11 | `/api/pharmacy/dispense` | `POST` | Pharmacy Staff, Admin | `PharmacyFulfillmentService` | `VERIFIED` |
| 12 | `/api/billing/bills` | `GET`, `POST` | Finance Staff, Patient, Admin | `BillingEngineService` | `VERIFIED` |
| 13 | `/api/billing/waterfall` | `GET` | Finance Staff, Patient | `FinancialCoverageService` | `VERIFIED` |
| 14 | `/api/billing/payments` | `POST` | Finance Staff, Patient | `PaymentProcessingService` | `VERIFIED` |
| 15 | `/api/billing/refunds` | `POST` | Finance Staff, Admin | `RefundReversalService` | `VERIFIED` |
| 16 | `/api/billing/reconciliation` | `GET`, `POST` | Finance Staff, Admin | `FinancialReconciliationService` | `VERIFIED` |
| 17 | `/api/billing/disputes` | `GET`, `POST` | Patient, Finance Staff | `DisputeInvestigationService` | `VERIFIED` |
| 18 | `/api/referrals` | `GET`, `POST` | Doctor, Admin | `ReferralService` | `VERIFIED` |
| 19 | `/api/webhooks/payment` | `POST` | Gateway Signature / System | `PaymentProcessingService` | `VERIFIED` |

---

## 4. Cross-Phase Dependency & Testing Verification

1. **Compilation Status**: `npx tsc --noEmit` verified with **0 errors**.
2. **S2 API Test Suite**: `scripts/test-phase-s2-backend-apis.ts` passed **13/13 test cases (100%)**.
3. **Core Regression Testing**: Comprehensive test suites for Phase 6, Phase 7, Phase 8, Phase 9, and Phase 10 all pass with zero regressions.
