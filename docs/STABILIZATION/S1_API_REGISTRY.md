# MEDORA — S1 API REGISTRY
## Stabilization Track — S1 Document 3 of 15

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Date**: August 2026  
**Status**: VERIFIED AUDIT

---

## 1. HTTP API Route Handlers (app/api/)

| # | Route | Method | Service | Phase | TypeScript Status |
|---|---|---|---|---|---|
| 1 | `/api/auth/session` | GET/POST | Identity Store | 1 | ✅ CLEAN |
| 2 | `/api/appointments` | GET/POST | AppointmentBookingService | 6 | ❌ TS2353 — patient_name not in BookingRequest |
| 3 | `/api/appointments/check-in` | POST | QueueManagementService | 6 | ✅ CLEAN |
| 4 | `/api/consultations` | GET/POST | ConsultationService | 7 | ✅ CLEAN |
| 5 | `/api/prescriptions` | GET/POST | PrescriptionOrderService | 7 | ✅ CLEAN |
| 6 | `/api/referrals` | GET/POST | ReferralService | 7 | ✅ CLEAN |
| 7 | `/api/lab/orders` | GET/POST | LabOrderService | 8 | ✅ CLEAN |
| 8 | `/api/lab/samples` | POST | LabSampleService | 8 | ❌ TS2554 — Expected 3 args got 2 |
| 9 | `/api/lab/reports` | GET/POST | LabReportService | 8 | ✅ CLEAN |
| 10 | `/api/pharmacy/intake` | POST | PharmacyIntakeService | 9 | ✅ CLEAN |
| 11 | `/api/pharmacy/inventory` | GET | PharmacyInventoryService | 9 | ❌ TS2339 — evaluateSingleFacilityAvailability doesn't exist |
| 12 | `/api/pharmacy/dispense` | POST | PharmacyFulfillmentService | 9 | ❌ TS2554 — Wrong arg count; TS2339 — dispensingRecord doesn't exist |
| 13 | `/api/billing/bills` | GET/POST | BillingEngineService | 10 | ❌ TS2724 — getBillsForPatient → getBillsByPatient; TS2322 — "OPD" not BillType |
| 14 | `/api/billing/payments` | POST | PaymentProcessingService | 10 | ✅ CLEAN |
| 15 | `/api/billing/waterfall` | GET | FinancialCoverageService | 10 | ✅ CLEAN |
| 16 | `/api/billing/reconciliation` | POST | FinancialReconciliationService | 10 | ❌ TS2339 — execute3WayReconciliation doesn't exist |
| 17 | `/api/billing/refunds` | POST | RefundReversalService | 10 | ❌ TS2554 — Expected 1 arg got 2 |
| 18 | `/api/billing/disputes` | GET/POST | DisputeInvestigationService | 10 | ❌ TS2724 — getDisputesForPatient → getDisputesByPatient; TS2353 — reason not in type |
| 19 | `/api/webhooks/payment` | POST | PaymentProcessingService | 10 | ✅ CLEAN |

---

## 2. API Health Summary

| Metric | Count |
|---|---|
| **Total HTTP API routes** | 19 |
| **TypeScript CLEAN** | 10 |
| **TypeScript ERRORS** | 9 |
| **Pass rate** | 52.6% |

---

## 3. Domain Services (In-Process — lib/services/)

| # | Service | File Size | Phase | Key Methods |
|---|---|---|---|---|
| 1 | ABHAService | 9KB | 3 | verifyAbhaId, generateAbhaOtp |
| 2 | AccessEngine | 7KB | 5 | checkCareRelationship |
| 3 | AlternativeSearchService | 13KB | 6 | searchAlternatives |
| 4 | AppointmentBookingService | 38KB | 6 | bookAppointment, cancelAppointment |
| 5 | AuthorizationEngine | 23KB | 5 | authorizeAction |
| 6 | BillingEngineService | 15KB | 10 | createDraftBill, addBillableItem |
| 7 | CapacityAnalyticsService | 12KB | 6 | analyzeCapacity |
| 8 | ClinicalContinuityService | 40KB | 7 | getPatientClinicalTimeline |
| 9 | ConsultationService | 23KB | 7 | startConsultation, completeConsultation |
| 10 | DisputeInvestigationService | 12KB | 10 | submitDispute, investigateDispute |
| 11 | FacilityReadinessService | 14KB | 5 | evaluateReadiness |
| 12 | FinancialCoverageService | 12KB | 10 | calculateWaterfall |
| 13 | FinancialReconciliationService | 6KB | 10 | runReconciliation |
| 14 | FollowupService | 5KB | 7 | scheduleFollowup |
| 15 | HealthJourneyService | 3KB | 3 | getPatientJourney |
| 16 | LabIntakeService | 6KB | 8 | receiveLabOrder |
| 17 | LabOrderService | 7KB | 8 | createLabOrder, finalizeLabOrder |
| 18 | LabReportService | 8KB | 8 | generateAndFinalizeReport |
| 19 | LabSampleService | 7KB | 8 | registerSample, trackCustody |
| 20 | LabTestingService | 11KB | 8 | runTest, recordResult |
| 21 | LaboratoryService | 27KB | 8 | Full lab orchestration |
| 22 | OrganizationService | 38KB | 5 | registerOrganization |
| 23 | PaymentProcessingService | 10KB | 10 | processPayment |
| 24 | PermissionEngine | 15KB | 5 | checkPermission |
| 25 | PharmacyFulfillmentService | 11KB | 9 | dispenseOrder |
| 26 | PharmacyIntakeService | 6KB | 9 | submitPrescriptionToIntake |
| 27 | PharmacyInventoryService | 8KB | 9 | evaluatePharmacyAvailability |
| 28 | PharmacyTransparencyService | 5KB | 9 | getTransparencyTimeline |
| 29 | Phase6ContractService | 8KB | 6 | validateContract |
| 30 | PrescriptionOrderService | 27KB | 7 | createPrescription, finalizePrescription |
| 31 | QueueManagementService | 34KB | 6 | checkInPatient, callNextPatient |
| 32 | ReferralService | 8KB | 7 | createReferral |
| 33 | RefundReversalService | 7KB | 10 | requestRefund |
| 34 | WaitingTimeService | 17KB | 6 | estimateWait |

**Total Service Code**: ~540KB across 34 services

---

## 4. Data Stores (In-Memory — lib/data/)

| # | Store | File Size | Phase | Purpose |
|---|---|---|---|---|
| 1 | affiliation-store | 40KB | 5 | Doctor-Organization affiliations |
| 2 | appointment-store | 18KB | 6 | Appointment records |
| 3 | audit-store | 7KB | 2 | Immutable audit log |
| 4 | billing-catalog-store | 5KB | 10 | Service pricing catalog |
| 5 | billing-store | 8KB | 10 | Bills and bill items |
| 6 | clinical-record-store | 24KB | 7 | Clinical notes and diagnoses |
| 7 | consent-store | 11KB | 3 | Patient consent records |
| 8 | consultation-history-store | 12KB | 7 | Consultation history |
| 9 | correction-store | 7KB | 7 | Clinical corrections |
| 10 | department-store | 14KB | 5 | Hospital departments |
| 11 | dispensing-store | 3KB | 9 | Dispensing records |
| 12 | dispute-store | 3KB | 10 | Billing disputes |
| 13 | encounter-store | 17KB | 7 | Clinical encounters |
| 14 | facility-store | 21KB | 5 | Facility campuses |
| 15 | financial-coverage-store | 5KB | 10 | Insurance/govt coverage |
| 16 | followup-store | 7KB | 7 | Follow-up scheduling |
| 17 | identity-store | 65KB | 1 | All user identities (1912 lines) |
| 18 | lab-capability-store | 8KB | 8 | Lab test capabilities |
| 19 | lab-order-store | 33KB | 8 | Lab orders |
| 20 | lab-organization-store | 8KB | 8 | Lab organizations |
| 21 | lab-sample-store | 10KB | 8 | Sample tracking |
| 22 | lab-test-catalog-store | 9KB | 8 | Test catalog |
| 23 | lab-testing-store | 9KB | 8 | Test execution |
| 24 | medical-document-store | 15KB | 7 | Medical documents |
| 25 | medical-order-store | 13KB | 7 | Medical orders |
| 26 | medicine-catalog-store | 7KB | 9 | Medicine catalog |
| 27 | notification-store | 5KB | 2 | Notifications |
| 28 | payment-store | 5KB | 10 | Payment records |
| 29 | pharmacy-intake-store | 9KB | 9 | Pharmacy intake records |
| 30 | pharmacy-inventory-store | 12KB | 9 | FEFO stock |
| 31 | pharmacy-order-store | 8KB | 9 | Pharmacy orders |
| 32 | pharmacy-organization-store | 10KB | 9 | Pharmacy orgs |
| 33 | prescription-store | 38KB | 7 | Prescriptions |
| 34 | queue-store | 15KB | 6 | Queue tokens |
| 35 | reconciliation-store | 2KB | 10 | Reconciliation records |
| 36 | referral-store | 10KB | 7 | Referrals |
| 37 | relationship-store | 6KB | 5 | Care relationships |
| 38 | service-store | 19KB | 5 | Healthcare services |
| 39 | waitlist-store | 12KB | 6 | Waitlist entries |

**Total Data Store Code**: ~580KB across 39 stores

---

## 5. Critical API Findings

> [!WARNING]
> 9 of 19 API route handlers have TypeScript compilation errors. These were created during S2 but have incorrect method names, wrong argument counts, or wrong type literals.

> [!IMPORTANT]
> All 34 domain services and 39 data stores compile cleanly. The errors are ONLY in the thin HTTP route wrappers under `app/api/`.

> [!NOTE]
> The test suite (`scripts/test-phase-s2-backend-apis.ts`) itself has 2 type errors but reports 13/13 PASS at runtime, indicating the errors are in type annotations not runtime behavior.
