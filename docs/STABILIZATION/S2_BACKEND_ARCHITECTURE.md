# MEDORA — Stabilization Track S2: Backend Architecture

**Stabilization Phase**: S2  
**Scope**: Server Entry, API Registration, Middleware, Domain Services, Data Stores & Runtime Lifecycle

---

## 1. Backend Runtime & Entry Point

MEDORA runs on **Next.js 14 App Router** with TypeScript.

* **Entry Point**: `app/` directory routes and route handlers (`app/api/**/route.ts`).
* **Startup Command**: `npm run dev` (Node.js runtime on port 3000).
* **Execution Model**: Next.js Server Components and Edge/Node Route Handlers executing in-process domain logic.
* **Storage Reality**: In-process TypeScript singleton stores (`lib/data/*.ts`) representing 39 domain entities.

```
[HTTP Request from Browser / Client]
         │
         ▼
[middleware.ts] ── Edge Route Protection & Role Cookie Inspection
         │
         ▼
[app/api/**/route.ts] ── HTTP Route Handlers (19 Endpoints)
         │
         ├──► [lib/api/api-utils.ts] ── Identity Resolution & validateRole()
         │
         ▼
[lib/services/*.ts] ── 34 Domain Services (~540 KB business logic)
         │           • Capacity analytics & waitlists
         │           • Consultation & SOAP documentation
         │           • FEFO stock allocation & digital signatures
         │           • 3-way financial reconciliation & Maker-Checker
         │
         ▼
[lib/data/*.ts] ── 39 Data Stores (~580 KB in-memory repositories)
         │
         ▼
[Standard JSON Response] ── { success: boolean, data?: T, error?: string, code?: string }
```

---

## 2. API Route Registration & Prefixes

All HTTP APIs follow standard REST conventions under the `/api` route prefix:

```
/api
 ├── /auth/session                     (GET: Current user session identity)
 ├── /appointments                     (GET: Query appointments, POST: Book capacity slot)
 │    └── /check-in                    (POST: Reception/Self check-in to queue)
 ├── /consultations                    (GET: Encounter records, POST: Finalize consultation)
 ├── /prescriptions                    (GET: Rx list, POST: Issue digital Rx with SHA-256 signature)
 ├── /referrals                        (GET: Referrals list, POST: Create clinical referral)
 ├── /lab
 │    ├── /orders                      (GET: Lab orders, POST: Issue pathology order)
 │    ├── /samples                     (POST: Collect sample & initiate Chain of Custody)
 │    └── /reports                     (GET: View certified reports, POST: Pathologist release)
 ├── /pharmacy
 │    ├── /intake                      (POST: Pharmacist intake from verified prescription)
 │    ├── /inventory                   (GET: Facility stock, POST: Evaluate batch availability)
 │    └── /dispense                    (POST: Patient OTP-verified atomic dispensing)
 ├── /billing
 │    ├── /bills                       (GET: View bills, POST: Generate draft bill)
 │    ├── /waterfall                   (GET: 5-tier financial coverage calculation)
 │    ├── /payments                    (POST: Create intent & execute payment attempt)
 │    ├── /refunds                     (POST: Maker-Checker refund workflow)
 │    ├── /reconciliation              (GET: Recon runs, POST: Automated 3-way reconciliation)
 │    └── /disputes                    (GET: Dispute list, POST: File financial dispute)
 └── /webhooks
      └── /payment                     (POST: Synchronous payment gateway webhook listener)
```

---

## 3. Authentication & Authorization Resolution

1. **Identity Resolution Strategy** (`lib/api/api-utils.ts`):
   * Inspects `x-medora-user-id` custom header.
   * Inspects `Authorization: Bearer <token>` header.
   * Inspects `medora_session_id` session cookie.
   * Inspects `medora_role` cookie (resolves `PAT-1001`, `DOC-1001`, `ADM-1001`, `LAB-1001`, `PHA-1001`, `FIN-1001`).
   * Fallback for local development testing.

2. **Role Verification Guard** (`validateRole`):
   ```typescript
   export function validateRole(user: StoredIdentity | null, allowedRoles: UserRole | UserRole[]): boolean
   ```
   Ensures unauthorized roles receive HTTP `403 Forbidden` (`{ success: false, error: "Access denied.", code: "FORBIDDEN" }`).

3. **Object-Level Access Control**:
   * **Patients**: Restricted to records matching `patient_id === user.identifier`.
   * **Doctors**: Restricted to active care relationships, scheduled consultations, or assigned encounters.
   * **Pharmacists / Lab Technicians**: Restricted to facility-assigned work queues.

---

## 4. Business Logic Services & Data Store Architecture

* **34 Domain Services (`lib/services/`)**: Encapsulates 100% of business validation rules:
  * `AppointmentBookingService`: Atomic slot locking, schedule overrides, doctor capacity limits.
  * `ConsultationService`: SOAP notes, ICD-10 diagnostic codes, versioning & amendment trees.
  * `PrescriptionOrderService`: Structured dosage, generic duplicate warnings, SHA-256 digital signing.
  * `LabSampleService` & `LabReportService`: Chain of custody tracking, biometric verification, certified PDF release.
  * `PharmacyFulfillmentService`: FEFO expiry batch sorting, reservation releases, OTP handover.
  * `BillingEngineService` & `FinancialCoverageService`: Server-authoritative line-item calculation, 5-tier coverage waterfall.
  * `FinancialReconciliationService`: 3-way ledger matching (Hospital vs Gateway vs Bank).
  * `RefundReversalService`: Maker-Checker separation for financial disbursements.

* **39 In-Memory Data Stores (`lib/data/`)**: High-performance in-memory repositories simulating relational persistence with indexing helpers (`getById`, `getByPatient`, `getByDoctor`, `saveRecord`).
