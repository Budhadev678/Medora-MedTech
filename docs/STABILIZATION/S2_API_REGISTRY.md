# MEDORA — Stabilization Track S2: Repaired API Registry

**Stabilization Phase**: S2  
**Total Audited HTTP Endpoints**: 19  
**Repaired in S2**: 9  
**Status**: 100% Compiling & Verified

---

## 1. Complete HTTP Route Registry

| # | Route Handler Path | Methods | Required Role(s) | Underlying Service & Methods | Status |
|---|---|---|---|---|---|
| 1 | `app/api/auth/session/route.ts` | `GET` | All active personas | `findIdentityById` | `VERIFIED` |
| 2 | `app/api/appointments/route.ts` | `GET`, `POST` | `patient`, `doctor`, `admin` | `AppointmentBookingService.bookAppointment`, `AppointmentStore.getAllAppointments` | `VERIFIED` |
| 3 | `app/api/appointments/check-in/route.ts` | `POST` | `receptionist`, `staff`, `doctor` | `QueueManagementService.checkInAppointment` | `VERIFIED` |
| 4 | `app/api/consultations/route.ts` | `GET`, `POST` | `doctor`, `admin` | `ConsultationService.completeConsultation`, `EncounterStore` | `VERIFIED` |
| 5 | `app/api/prescriptions/route.ts` | `GET`, `POST` | `doctor`, `pharmacy_staff`, `patient` | `PrescriptionOrderService.issuePrescription`, `PrescriptionStore` | `VERIFIED` |
| 6 | `app/api/lab/orders/route.ts` | `GET`, `POST` | `doctor`, `lab_staff`, `patient` | `LabOrderService.finalizeLabOrder`, `LabOrderStore` | `VERIFIED` |
| 7 | `app/api/lab/samples/route.ts` | `POST` | `lab_staff`, `admin` | `LabSampleService.collectSample` | `VERIFIED` |
| 8 | `app/api/lab/reports/route.ts` | `GET`, `POST` | `lab_staff`, `doctor`, `patient` | `LabReportService.releaseCertifiedReport`, `LabOrderStore` | `VERIFIED` |
| 9 | `app/api/pharmacy/intake/route.ts` | `POST` | `pharmacy_staff`, `admin` | `PharmacyIntakeService.registerPrescriptionIntake` | `VERIFIED` |
| 10 | `app/api/pharmacy/inventory/route.ts` | `GET`, `POST` | `pharmacy_staff`, `admin` | `PharmacyInventoryService.evaluatePharmacyAvailability`, `InventoryStore` | `VERIFIED` |
| 11 | `app/api/pharmacy/dispense/route.ts` | `POST` | `pharmacy_staff`, `admin` | `PharmacyFulfillmentService.dispenseOrder` | `VERIFIED` |
| 12 | `app/api/billing/bills/route.ts` | `GET`, `POST` | `finance_staff`, `patient`, `admin` | `BillingEngineService.createDraftBill`, `BillingStore.getBillsByPatient` | `VERIFIED` |
| 13 | `app/api/billing/waterfall/route.ts` | `GET` | `finance_staff`, `patient`, `admin` | `FinancialCoverageService.calculateFinancialWaterfall` | `VERIFIED` |
| 14 | `app/api/billing/payments/route.ts` | `POST` | `finance_staff`, `patient` | `PaymentProcessingService.createPaymentIntent`, `executePaymentAttempt` | `VERIFIED` |
| 15 | `app/api/billing/refunds/route.ts` | `POST` | `finance_staff`, `hospital_admin` | `RefundReversalService.requestRefund` | `VERIFIED` |
| 16 | `app/api/billing/reconciliation/route.ts` | `GET`, `POST` | `finance_staff`, `admin` | `FinancialReconciliationService.runReconciliation`, `ReconciliationStore` | `VERIFIED` |
| 17 | `app/api/billing/disputes/route.ts` | `GET`, `POST` | `patient`, `finance_staff` | `DisputeInvestigationService.submitDispute`, `DisputeStore` | `VERIFIED` |
| 18 | `app/api/referrals/route.ts` | `GET`, `POST` | `doctor`, `admin` | `ReferralService.finalizeReferral`, `ReferralStore` | `VERIFIED` |
| 19 | `app/api/webhooks/payment/route.ts` | `POST` | Gateway / System | `PaymentProcessingService.executePaymentAttempt` | `VERIFIED` |

---

## 2. Standardized API Response Contract

All 19 routes return standardized payloads:

### Successful Response Format (`HTTP 200` / `201`)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response Format (`HTTP 400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "success": false,
  "error": "Human-readable explanation of error",
  "code": "ERROR_CODE"
}
```
