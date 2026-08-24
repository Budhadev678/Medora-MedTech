# MEDORA — Technical Requirements Document (TRD) & System Tech Stack

**Document Version:** 2.4.0 (Consolidated Production Architecture)  
**Platform Name:** MEDORA (Unified Healthcare, Clinical, Diagnostic, Pharmacy & Inpatient Platform)  
**Repository:** Budhadev678/Medora-MedTech  
**License:** Proprietary / Healthcare Enterprise  

---

## 1. System Overview & Core Architectural Principles

MEDORA is a unified, multi-role digital health ecosystem designed to replace disconnected healthcare silos with one single source of truth across all healthcare actors:
- Patients & Citizens (Digital Health Passports, Appointments, Longitudinal EMR, Billing, Insurance & Scheme Claims)
- Doctors & Clinicians (Clinical Encounter Suites, SOAP Notes, Digital Rx, Lab Order Entry, Bed Admissions)
- Hospital Administrators & Desk (Patient Census, Inpatient Bed Allocation, Queue Token Management, Multi-Tier Dispute Settlement)
- Diagnostic Laboratories (Specimen Barcode Accessioning, Chain-of-Custody Tracking, NABL Pathology Certification, Public QR Verification Slips)
- Pharmacies & Outlets (Prescription Intake Validation, FEFO Batch Inventory, Atomic Stock Reservation, OTP Counter Dispensing, Audit Ledgers)
- Emergency & Blood Centers (Break-Glass Clinical Overrides, ABHA/ABDM Linking, Emergency Triage, Cold-Chain Blood Bank Logistics)

### Core Architectural Invariants:
1. Single Source of Truth: All patient identities, encounters, prescriptions, orders, admissions, bills, and dispensing records derive from central, authoritative domain repositories.
2. Deterministic Data Provenance & Traceability:
   Patient -> Appointment -> Queue Token -> Encounter -> Prescription -> Pharmacy Intake -> Batch Reservation -> Dispensing -> Medication History
3. Multi-Role Security & Isolation: Strict tenant, facility, and role scoping with zero client-trusted identity spoofing.
4. Immutable Audit Ledger: Every clinical access, break-glass override, prescription issuance, billing dispute transition, and dispensing event is recorded in a tamper-evident audit ledger.
5. Universal Trilingual Localization: Native support for English (en), Hindi (hi), and Odia (or) across all user-facing interfaces.

---

## 2. Complete Technology Stack Matrix

### 2.1 Frontend & Application Framework
- Core Framework: Next.js 14.2 (App Router, Server/Client components, layouts)
- Language: TypeScript 5.4 (Strict type-safety, zero-any policy)
- UI Library: React 18.3
- Styling: Tailwind CSS 3.4
- UI Primitives: Radix UI & Shadcn
- Iconography: Lucide React
- Utilities: clsx, tailwind-merge

### 2.2 Domain Store, State & Business Logic Architecture
- Identity & Demographics: lib/data/identity-store.ts
- Appointments & Schedules: lib/data/appointment-store.ts, lib/services/appointment-booking-service.ts
- OPD Queue & Token Engine: lib/data/queue-store.ts, lib/services/queue-management-service.ts
- Clinical Encounters & EMR: lib/data/encounter-store.ts, lib/services/consultation-service.ts
- Consent & Record Sharing: lib/data/consent-store.ts
- Digital Prescriptions: lib/data/prescription-store.ts, lib/services/prescription-order-service.ts
- Laboratory Diagnostics: lib/data/lab-order-store.ts, lib/services/lab-order-service.ts
- Pharmacy & Inventory: lib/data/pharmacy-*-store.ts, lib/services/pharmacy-*-service.ts
- Inpatient Bed Allocation: lib/data/admission-store.ts
- Billing & Benchmarking: lib/data/billing-store.ts, lib/services/billing-engine-service.ts
- Financial Disputes: lib/data/dispute-store.ts, lib/services/dispute-investigation-service.ts
- Insurance & Schemes (PM-JAY / BSKY): lib/data/patient-financial-support-store.ts, lib/data/insurance-store.ts
- Audit Stream: lib/data/audit-store.ts

---

## 3. Role-Based Access Control (RBAC) Matrix
Enforces strict workspace routing and access rules across 11 authenticated roles:
patient, doctor, hospital_admin, staff, lab_staff, pharmacy_staff, blood_staff, emergency_staff, finance_staff, insurance_staff, admin.

---

## 4. Key Integration & Compliance Specifications
1. ABDM / ABHA (Ayushman Bharat Digital Mission): 14-digit ABHA Number & ABHA Address.
2. NABL & CAP Diagnostic Laboratory Standard: Specimen chain-of-custody barcode accessioning (SMP-1024), Pathologist electronic digital signature verification, Publicly verifiable QR verification certificates (/verify/lab/[id]).
3. Pharmacy FEFO (First Expiry, First Out) Inventory: Usable stock vs. reserved stock segregation, batch tracking (PCM-2026-01), 6-digit OTP verification on patient handover.
4. Transparent Healthcare Pricing & Schemes (BSKY, PM-JAY): Reference pricing index and 3-tier hospital dispute review.
5. Emergency Break-Glass Access Protocol: Instant critical record override for trauma & casualty units with mandatory audit reason logging.

---

## 5. Verification & Test Architecture
- Static Type Safety: npm run typecheck
- Automated End-to-End Suite: npx tsx scripts/test-final-one-patient-e2e.ts (82 assertions).
