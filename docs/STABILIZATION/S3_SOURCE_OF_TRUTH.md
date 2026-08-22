# S3 SOURCE OF TRUTH REGISTRY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S3 Stabilization Track  
**Focus**: Authoritative Records, Table Ownership & Entity Unification  

---

## 1. Single Source of Truth Principles

In MEDORA, no two records represent the same clinical or financial event. Every actor (patient, doctor, receptionist, nurse, lab technician, pharmacist, billing admin) views and interacts with the **exact same underlying record**.

---

## 2. Core Entities & Authoritative Stores

| Entity Domain | Authoritative Identifier Format | In-Memory Data Store (`lib/data/`) | Supabase PostgreSQL Table (`supabase/schema.sql`) | Authoritative Service Layer (`lib/services/`) |
|---------------|--------------------------------|-----------------------------------|---------------------------------------------------|----------------------------------------------|
| **User Identity** | `PAT-1001`, `DOC-1001`, `FIN-1001` | `identity-store.ts` | `public.users`, `public.patients`, `public.doctors` | Auth Middleware / Session Token |
| **Doctor Sessions** | `SES-1001`, `SES-1002` | `appointment-store.ts` | `public.doctor_working_sessions` | `AppointmentStore.getDoctorSessions()` |
| **Appointments** | `APT-1001`, `APT-1002` | `appointment-store.ts` | `public.appointments` | `AppointmentStore.bookAppointment()` |
| **Queue Entries** | `QUE-1001`, `QUE-1002` | `queue-store.ts` | `public.queue_entries` | `QueueStore.saveQueueEntry()` |
| **Encounters** | `ENC-1001`, `ENC-1002` | `encounter-store.ts` | `public.encounters` | `createEncounter()`, `getEncounterById()` |
| **Prescriptions** | `RX-1001`, `RX-1002` | `prescription-store.ts` | `public.prescriptions`, `public.prescription_items` | `savePrescriptionDraft()`, `finalizePrescription()` |
| **Lab Orders** | `LAB-ORD-1001`, `LAB-ORD-1002` | `lab-order-store.ts` | `public.lab_orders`, `public.lab_order_items` | `saveLabOrderDraft()`, `finalizeLabOrder()` |
| **Lab Samples** | `SMP-1001`, `SMP-1002` | `lab-sample-store.ts` | `public.lab_samples`, `public.sample_custody_events` | `createSample()`, `updateSampleStatus()` |
| **Lab Reports** | `REP-1001`, `REP-1002` | `lab-report-store.ts` | `public.lab_reports`, `public.lab_report_items` | `saveLabReportDraft()`, `releaseLabReport()` |
| **Pharmacy Intakes**| `PHARM-INTAKE-1001` | `pharmacy-intake-store.ts` | `public.pharmacy_intakes` | `PharmacyFulfillmentService.createIntake()` |
| **Pharmacy Stock** | `INV-1001`, `BATCH-1001` | `pharmacy-inventory-store.ts` | `public.pharmacy_inventory_items`, `public.pharmacy_inventory_batches` | `PharmacyInventoryService.evaluatePharmacyAvailability()` |
| **Dispensing** | `DISP-1001` | `pharmacy-dispensing-store.ts`| `public.dispensing_records` | `PharmacyFulfillmentService.confirmDispensing()` |
| **Healthcare Bills**| `BILL-1001`, `BILL-1002` | `billing-store.ts` | `public.bills`, `public.bill_items` | `BillingEngineService.createDraftBill()`, `addBillableItem()` |
| **Financial Waterfall** | `WF-1001` | Calculated Dynamic | `public.financial_coverages` | `FinancialCoverageService.calculateFinancialWaterfall()` |
| **Payment Records** | `PAY-1001`, `PAY-1002` | `payment-store.ts` | `public.payment_records`, `public.payment_allocations` | `PaymentProcessingService.createPaymentIntent()`, `executePaymentAttempt()` |
| **Audit Log** | `AUD-1001` | `audit-store.ts` | `public.audit_logs` | `appendAuditEvent()` |

---

## 3. Entity Integrity Invariants

1. **Patient Identifier Invariance**: The patient ID (`PAT-1001`) in an appointment, queue token, encounter, prescription, lab order, bill, and payment receipt points to the same patient persona.
2. **Doctor Multi-Facility Session Invariance**: A doctor has ONE identity (`DOC-1001`). Sessions at City Hospital (`FAC-1001`) and Green Clinic (`FAC-1002`) reference `doctor_id: 'DOC-1001'` and never mutate the doctor's primary identity.
3. **Clinical Provenance Invariance**: Every bill item generated from a consultation or lab test stores immutable source provenance (`ordered_by_id`, `order_reference_id`, `clinical_reason`).
4. **Financial Balance Invariance**: Payments do not mutate the `gross_total` of a bill. Instead, payments generate immutable allocation records (`PAYALLOC-*`) that deduct from `patient_responsibility`.
