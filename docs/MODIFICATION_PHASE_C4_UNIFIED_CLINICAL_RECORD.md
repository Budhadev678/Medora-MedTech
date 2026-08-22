# MEDORA — MODIFICATION PHASE C.4
# UNIFIED CLINICAL RECORD & CONTINUITY LAYER SPECIFICATION

## 1. Overview & Core Philosophy

Modification Phase C.4 establishes MEDORA's **Unified Clinical Record & Continuity Layer**. 

### The Core Problem C.4 Solves
In traditional disconnected healthcare software, patients and clinicians have to navigate fragmented silos:
- "Where is my consultation note?"
- "Where is my prescription from last week?"
- "Where is my lipid profile lab report?"
- "Which hospital generated this follow-up?"
- "Which doctor prescribed this medication?"

### The Architectural Solution
Phase C.4 connects all authoritative underlying clinical records into a single, unified, longitudinal health journey **without copying or duplicating data**:
- **C.1** owns the authoritative Clinical Encounter & Doctor Consultation.
- **C.2** owns the authoritative Prescriptions & Medical Orders (Imaging, Referrals, Follow-ups).
- **C.3** owns the authoritative Connected Laboratory system (Order $\rightarrow$ Sample $\rightarrow$ Result $\rightarrow$ Report).
- **C.4** is the **Connectivity & Continuity Engine** that dynamically aggregates, indexes, sorts, bundles, and presents this data with role-scoped least privilege and zero duplication.

---

## 2. Architectural Design & Zero-Duplication Invariant

```
+---------------------------------------------------------------------------------------+
|                       MEDORA CLINICAL CONTINUITY ENGINE (C.4)                          |
|                       lib/services/clinical-continuity-service.ts                     |
+---------------------------------------------------------------------------------------+
        |                    |                    |                    |
        v                    v                    v                    v
+------------------+ +------------------+ +------------------+ +------------------+
|  Appointments &  | |   Consultation   | |  Prescriptions & | |  Connected Lab   |
| Capacity Stores  | | Encounter Stores | |  Medical Orders  | |  Orders/Reports  |
|   (Phases B)     | |   (Phase C.1)    | |   (Phase C.2)    | |   (Phase C.3)    |
+------------------+ +------------------+ +------------------+ +------------------+
```

### Single Source of Truth
Every timeline event contains:
- `source_type`: `APPOINTMENT` | `ENCOUNTER` | `CLINICAL_RECORD` | `PRESCRIPTION` | `LAB_ORDER` | `SAMPLE` | `LAB_REPORT` | `MEDICAL_ORDER` | `MEDICAL_DOCUMENT`
- `source_id`: Exact primary key in the source store (e.g. `PRX-1001`, `LAB-ORD-1001`, `RPT-1001`)
- `occurred_at`: Clinically meaningful timestamp
- Zero duplicate copies of medical notes or prescription tables.

---

## 3. Clinical Timestamp & Sectioning Semantics

Events are categorized into 3 dynamic sections based on canonical occurrence timestamps (`occurred_at`):

| Entity | Occurrence Timestamp (`occurred_at`) | Section Resolution |
| :--- | :--- | :--- |
| **Appointment** | Scheduled date/time (`2026-08-25T09:00:00Z`) | `UPCOMING` (if future-dated) or `TODAY` or `PAST` |
| **Encounter** | `started_at` / `created_at` | `TODAY` (if today) or `PAST` |
| **Clinical Record** | `created_at` | `TODAY` (if today) or `PAST` |
| **Prescription** | `issued_at` / `created_at` | `TODAY` (if today) or `PAST` |
| **Lab Order** | `ordered_at` / `created_at` | `TODAY` (if today) or `PAST` |
| **Lab Sample** | `collected_at` / `received_at` | `TODAY` (if today) or `PAST` |
| **Lab Report** | `released_at` / `verified_at` | `TODAY` (if today) or `PAST` |
| **Follow-Up Order** | `recommended_date` (`2026-09-01T09:00:00Z`) | `UPCOMING` (if future-dated) or `PAST` |
| **Imaging / Referral** | `created_at` | `TODAY` (if today) or `PAST` |

### Same-Day Clinical Ordering
Events on the same day follow logical medical progression:
1. `APPOINTMENT`
2. `ENCOUNTER`
3. `CLINICAL_RECORD`
4. `PRESCRIPTION`
5. `LAB_ORDER`
6. `SAMPLE`
7. `LAB_REPORT`
8. `MEDICAL_ORDER`

---

## 4. Encounter Clinical Bundles (`EncounterClinicalBundle`)

The engine provides `getPatientEncounterBundles(patientId)` which aggregates all records created under or linked to each consultation encounter:
- Linked `HealthcareEncounter`
- Linked `ClinicalRecord` (Diagnoses, Vitals, Assessment, Treatment Plan)
- Linked `Appointment`
- Linked `HealthcarePrescription[]`
- Linked `HealthcareLabOrder[]`
- Linked `HealthcareLabSample[]`
- Linked `HealthcareLabReport[]` (Certified released reports)
- Linked `HealthcareMedicalOrder[]` (Imaging, Referrals, Follow-up orders)
- Linked `HealthcareMedicalDocument[]`

---

## 5. Structured Health Summary (No AI)

`ClinicalContinuityService.getPatientStructuredHealthSummary(patientId)` extracts factual health data:
- **Active Prescriptions**: Active medicines currently prescribed to the patient.
- **Known Allergies**: Documented drug and food allergies.
- **Recent Certified Reports**: Latest released laboratory investigations.
- **Upcoming Care**: Upcoming scheduled appointments and recommended follow-up dates.
- **Encounters Count & Diagnostics Count**: Numerical metrics derived directly from authoritative records.
- **Strict Compliance**: Zero AI hallucination, zero automated disease prediction, zero autonomous clinical summaries.

---

## 6. Role-Based Access Control & Least Privilege Scoping

| Role | Permitted Event Types | Scoping Rules |
| :--- | :--- | :--- |
| **Patient** | All event types | IDOR protected: strictly scoped to own `patient_id`. |
| **Doctor** | All clinical event types | Authorized for patient's care relationship; includes Current Encounter highlight. |
| **Laboratory Staff** | `LAB_ORDER`, `SAMPLE`, `LAB_REPORT` | Scoped to assigned laboratory orders/reports. Doctor notes and prescriptions are withheld. |
| **Pharmacy Staff** | `PRESCRIPTION` | Scoped to valid prescriptions for dispensing. Doctor clinical notes and lab reports are withheld. |
| **Hospital Staff** | All facility events | Scoped to hospital/clinic organization context. |

---

## 7. Audit Logging

Every access to a patient's timeline triggers an append-only audit event in `AuditLedger`:
- `event_type`: `TIMELINE_ACCESSED`
- `actor_id`, `actor_name`, `actor_role`, `patient_id`, `organization_id`
- `metadata`: `eventCount`, `categoryFilter`, `dateRangeFilter`

---

## 8. Verification & Test Suite

All 46 assertions in `scripts/test-phase-c4-unified-clinical-record.ts` pass with a 100% pass rate:
- Dynamic aggregation across C.1, C.2, C.3, B.1, and medical document stores.
- Single source of truth & zero duplication invariants.
- Strict patient isolation and IDOR rejection.
- Multi-role least privilege (Doctor, Lab, Pharmacy, Hospital).
- Encounter clinical bundles.
- Search, facility filtering, and category filtering.
- Rebuild idempotency and audit ledger verification.
