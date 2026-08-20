# 📋 MEDORA — Feature Registry & Status Matrix

This document tracks every granular feature in MEDORA with its role, status, and layer completeness.

---

## 🔐 1. Authentication & Identity (`AUTH`)

| ID | Feature Description | Role | Status | UI | API | DB | Verified |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `AUTH-01` | Authentication Initialization (Supabase client/SSR) | System | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-02` | Unified Login (`/login` with password toggle) | All | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-03` | Patient Registration & Onboarding (`/register`) | Patient | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-04` | Session Persistence & Refresh Recovery | All | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-05` | Secure Sign Out & Session Teardown | All | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-06` | User Profile Foundation (`profiles` table) | All | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-07` | Controlled Role Model (9 User Roles) | System | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-08` | Protected Routes & Route Interception | System | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-09` | Role-Based Authorization Guard (`RoleGuard`) | System | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-10` | Supabase Row Level Security (RLS) Policies | System | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-11` | User-Friendly Error Sanitization | System | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |
| `AUTH-12` | Authentication Edge-Case Verification | System | `VERIFIED` | ✅ | ✅ | ✅ | ✅ |

---

## 👤 2. Patient Module (`PAT`)

| ID | Feature Description | Role | Status | UI | API | DB | Verified |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `PAT-01` | Patient Overview Dashboard | Patient | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `PAT-02` | Patient Profile & Medical Vitals Info | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PAT-03` | Emergency Medical ID Card & Contacts | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PAT-04` | Hospital & Doctor Discovery / Search | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PAT-05` | Appointment Booking & Live Queue Token | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PAT-06` | Digital Prescription & Medication Reminders | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PAT-07` | Lab Reports & Diagnostic Viewer | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PAT-08` | Transparent Itemized Bill & "Why charged?" | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PAT-09` | Bill Dispute / Question Charge Flow | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PAT-10` | Unified Healthcare Journey Timeline | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PAT-11` | Granular Time-Bound Record Sharing | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PAT-12` | Insurance Policy & Govt Scheme Aid Tracker | Patient | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 🩺 3. Doctor Module (`DOC`)

| ID | Feature Description | Role | Status | UI | API | DB | Verified |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `DOC-01` | Doctor Clinical Dashboard & Queue | Doctor | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `DOC-02` | Duty / Availability / On-Call Status Toggle | Doctor | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `DOC-03` | Authorized Patient Medical History Viewer | Doctor | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `DOC-04` | Digital Consultation & Clinical Diagnosis | Doctor | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `DOC-05` | Digital Structured Prescription Builder | Doctor | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `DOC-06` | Laboratory Test Order Creation | Doctor | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `DOC-07` | Follow-up Scheduler with Clinical Purpose | Doctor | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `DOC-08` | Inter-Department & Cross-Hospital Referral | Doctor | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 🏥 4. Hospital & Administration Module (`HOSP`)

| ID | Feature Description | Role | Status | UI | API | DB | Verified |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `HOSP-01` | Hospital Operations Command Dashboard | Admin | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `HOSP-02` | Department & Specialty Management | Admin | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `HOSP-03` | Doctor & Staff Availability Roster | Admin | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `HOSP-04` | Outpatient Queue & Token Coordinator | Staff | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `HOSP-05` | Inpatient Admission, Bed & Ward Allocation | Staff | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `HOSP-06` | Inpatient Care Log & Discharge Summary | Doctor/Staff | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 🧪 5. Connected Laboratory Module (`LAB`)

| ID | Feature Description | Role | Status | UI | API | DB | Verified |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `LAB-01` | Test Orders Intake & Queue | Lab Staff | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `LAB-02` | Sample Collection & Barcode/Sample ID Gen | Lab Staff | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `LAB-03` | Diagnostic Result Entry & Value Validation | Lab Staff | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `LAB-04` | Pathologist Report Review & Digital Approval | Pathologist | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `LAB-05` | Auto-sync to Patient Timeline & Doctor Feed | System | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 💊 6. Connected Pharmacy Module (`PHARM`)

| ID | Feature Description | Role | Status | UI | API | DB | Verified |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `PHARM-01` | Incoming Digital Prescription Queue | Pharmacy | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `PHARM-02` | Medication Verification & Preparation Flag | Pharmacy | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PHARM-03` | Ready for Pickup Notification | Pharmacy | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PHARM-04` | Patient Medora ID Verification & Physical Dispense | Pharmacy | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `PHARM-05` | Dispense Event Log & Pharmacy Audit Record | System | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 💰 7. Transparent Billing & Finance Module (`BILL`)

| ID | Feature Description | Role | Status | UI | API | DB | Verified |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `BILL-01` | Automated Itemized Bill Aggregator | Billing Staff| `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `BILL-02` | "Why Was I Charged?" Service Lineage Trace | Patient | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `BILL-03` | Bill Version History & Adjustment Audit | Admin/Patient| `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `BILL-04` | Insurance & Assistance Multi-split Coverage | Billing/Patient| `NOT_STARTED`| ⬜ | ⬜ | ⬜ | ⬜ |
| `BILL-05` | Payment Receipt & Settlement Logger | Patient/Billing| `NOT_STARTED`| ⬜ | ⬜ | ⬜ | ⬜ |
| `BILL-06` | Dispute Management & Hospital Resolution | Admin/Patient| `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 🚨 8. Emergency, Blood & Special Workflows (`EMERG`)

| ID | Feature Description | Role | Status | UI | API | DB | Verified |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `EMERG-01` | Rapid Emergency Intake & Triage Level | Emergency | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `EMERG-02` | Doctor Availability Check & Auto Escalation | Emergency | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `EMERG-03` | Emergency Medical Snapshot Viewer | Emergency | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `EMERG-04` | Urgent Blood Request & Donor Matcher | Blood Center | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `EMERG-05` | Simulated Road Accident Pre-Alert Protocol | Emergency | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |
| `EMERG-06` | Recognition & Award Badging (Gold/Silver) | System | `NOT_STARTED` | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 🛡️ 9. Audit & System Core (`AUDIT`)

| ID | Feature Description | Role | Status | UI | API | DB | Verified |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `AUDIT-01` | Immutable Append-Only Audit Logging | System | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `AUDIT-02` | Admin System Audit Explorer | Admin | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
| `AUDIT-03` | Multilingual Localization (EN, HI, OR) | All | `BUILT` | 🔨 | ⬜ | ⬜ | ⬜ |
