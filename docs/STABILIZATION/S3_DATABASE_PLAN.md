# S3 DATABASE & DATA MODEL STABILIZATION PLAN

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S3 Stabilization Track  
**Objective**: Database Structure, Relationships, Data Consistency, Integrity & Single Source of Truth  

---

## 1. Executive Summary

Phase S3 ensures that all data models, entity relationships, relational tables, and in-memory stores form an immutable, single source of truth for the entire patient journey across Phase 0–10.

Before S3, certain cross-boundary flows risked creating parallel disconnected records (e.g., patient, doctor, and receptionist seeing slightly disparate views of an appointment or payment). S3 stabilizes:
1. **Primary Key & Identity Consistency**: Absolute relational alignment between authoritative personas (`PAT-1001`, `DOC-1001`, `FIN-1001`, etc.) and system records.
2. **Doctor Multi-Facility Affiliation**: Doctors practice across multiple hospitals/clinics with separate working sessions and capacities under ONE doctor identity.
3. **Clinical & Financial Cascades**: Deterministic foreign key relationships linking `Appointment -> QueueToken -> Encounter -> Prescription / LabOrder -> LabSample / Dispensation -> Bill -> Payment`.
4. **Authoritative SQL DDL (`supabase/schema.sql`)**: 52 production-ready relational tables with row-level security (RLS), multi-tenant foreign keys, and audit logging.

---

## 2. Core Relationship Architecture

```
[PATIENT: PAT-1001]
       │
       ▼
[DOCTOR SESSION: SES-1001] ─── (Doctor: DOC-1001, Facility: FAC-1001)
       │
       ▼
[APPOINTMENT: APT-1001]
       │
       ▼
[QUEUE ENTRY: QUE-1001]
       │
       ▼
[HEALTHCARE ENCOUNTER: ENC-1001]
       ├───► [PRESCRIPTION: RX-1001] ───► [FEFO DISPENSING: DISP-1001]
       │
       ├───► [LAB ORDER: LAB-ORD-1001] ───► [LAB SAMPLE: SMP-1001] ───► [LAB REPORT: REP-1001]
       │
       └───► [HEALTHCARE BILL: BILL-1001] ───► [5-TIER WATERFALL] ───► [PAYMENT RECORD: PAY-1001]
```

---

## 3. Key Stabilization Focus Areas

| Area | Challenge | Stabilization Action |
|------|-----------|----------------------|
| **Identity Uniqueness** | Risk of parallel user records | Enforced UUID primary keys with unique business identifiers (`PAT-*`, `DOC-*`) |
| **Doctor Sessions** | Multi-facility scheduling ambiguity | Decoupled doctor master profile from facility-specific working sessions & capacity slots |
| **Lab Sample Custody** | Specimen decoupling from order | Strict FK constraint (`lab_order_id`) linking physical specimens to diagnostic orders |
| **Pharmacy Inventory** | Stock availability drift | FEFO (First-Expiry-First-Out) batch reservation linked to verified e-prescriptions |
| **Billing Balance** | Overwriting total on payment | Gross total is invariant; payments record settled ledger entries and compute dynamic net balance |
