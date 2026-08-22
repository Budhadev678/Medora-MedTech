# 📄 MEDORA — Sub-Phase 7.2 Technical Specification

## Digital Prescription & Medication Workflow

**Sub-Phase**: 7.2  
**Master Phase**: Phase 7 — Digital Consultation & Prescription  
**Status**: `VERIFIED`  

---

## 1. Executive Summary & Non-Autonomous Clinical Boundary

Sub-Phase 7.2 delivers MEDORA's authoritative **Digital Prescription Architecture**, allowing clinicians to compose, review, finalize, supersede, and void structured digital prescriptions attached to active clinical encounters.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PHASE 7.2 PRESCRIPTION FLOW                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PATIENT (PAT-1001) ──> ENCOUNTER (ENC-1001) ──> DOCTOR CONSULTATION WORKSPACE           │
│                                                       │                                │
│                                             [CREATE PRESCRIPTION]                      │
│                                                       │                                │
│                                                       ▼                                │
│                                             PRESCRIPTION (RX-1001)                     │
│                                                  [STATUS: DRAFT]                       │
│                                                       │                                │
│                                         + Add Structured Medication Items              │
│                                         + Periodic Safe Autosave ("Saved 10:42 AM")    │
│                                         + Duplicate Medicine Warning                   │
│                                                       │                                │
│                                             [REVIEW & FINALIZE]                        │
│                                                       │                                │
│                                                       ▼                                │
│                                             PRESCRIPTION (RX-1001)                     │
│                                                [STATUS: FINALIZED]                     │
│                                                + Digital Signature Hash                │
│                                                + Atomic Edit Lock                      │
│                                                       │                                │
│              ┌────────────────────────────────────────┼────────────────────────┐       │
│              ▼                                        ▼                        ▼       │
│    PATIENT PORTAL VIEW                  PUBLIC VERIFICATION PAGE        PHASE 9 HANDOFF│
│  (/patient/prescriptions)            (/verify/prescription/[token])   (PRESCRIPTION_   │
│  - Active/Finalized Regimen           - Authenticity: VALID            FINALIZED Event)│
│  - Open Pharmacy Freedom              - Minimal Public Context                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Core Clinical Invariant**: MEDORA NEVER independently prescribes medication, calculates recommended dosages, or automatically converts diagnoses into prescriptions. 100% of medication details, dosages, and instructions are explicitly authored, reviewed, and finalized by the attending clinician.

---

## 2. Key Technical Architecture & Rules

1. **Entity Relationships**:
   - `Patient` (`PAT-1001`) $\rightarrow$ `HealthcareEncounter` (`ENC-1001`) $\rightarrow$ `HealthcarePrescription` (`RX-1001`) $\rightarrow$ `PrescriptionItem` (`RXI-1`, `RXI-2`).
   - Prescription entity inherits Patient, Doctor, Facility, and Organization strictly from the authoritative server encounter.

2. **Prescription Status Machine**:
   - `DRAFT` $\rightarrow$ `READY_FOR_REVIEW` $\rightarrow$ `FINALIZED` $\rightarrow$ `SUPERSEDED` / `VOIDED` / `CANCELLED`.

3. **Prescription vs Pharmacy Order Separation**:
   - Finalized digital prescription is an **authoritative clinical instruction**. It is **NOT** a pharmacy billing order or fulfillment record.
   - Emits `PRESCRIPTION_FINALIZED` Phase 9 integration event with a stable idempotency key (`HANDSHAKE-RX-...`).

4. **Patient Freedom & Open Pharmacy Choice**:
   - Patient may fulfill the prescription at any licensed hospital pharmacy, retail chemist, or online pharmacy. Zero vendor lock-in.

5. **Atomic Finalization & Amendment Versioning**:
   - Finalization locks ordinary edits (`FINALIZED`).
   - Post-finalization edits require creating a superseding prescription ($V_1 \rightarrow V_2$ or `RX-1001` $\rightarrow$ `RX-1002`) with a mandatory clinical reason.

6. **Public Authenticity Verification**:
   - Endpoint: `/verify/prescription/[token]`
   - Public scanner displays minimal verification details (`VALID`, `VOIDED`, `SUPERSEDED`, `NOT_FOUND`) without exposing raw medical records to unauthenticated visitors.

---

## 3. Data Architecture & Lifecycle

### Key API & Service Contracts

- **`PrescriptionOrderService.saveDraft(encounterId, data, actor)`**:
  - Validates attending doctor match (`encounter.provider_id === actor.id`).
  - Creates/updates `DRAFT` prescription (`RX-xxxx`).
  - Hides draft prescriptions from patient portal.

- **`PrescriptionOrderService.finalizePrescription(encounterId, data, actor)`**:
  - Validates non-empty medication list (at least 1 item).
  - Validates required item fields: `medicine_name`, `dosage`, `frequency`.
  - Sets status to `FINALIZED`, records `finalized_at`/`finalized_by`, computes SHA-256 `digital_signature_hash`, and generates `verification_token`.
  - Emits Phase 9 `PRESCRIPTION_FINALIZED` integration event.

- **`PrescriptionOrderService.correctPrescription(prescriptionId, data, reason, actor)`**:
  - Marks original prescription as `SUPERSEDED` (with `superseded_by_prescription_id`).
  - Creates replacement prescription `RX-xxxx` with status `FINALIZED`, version history snapshot, and `supersedes_prescription_id`.

- **`PrescriptionOrderService.voidPrescription(prescriptionId, voidReason, actor)`**:
  - Sets status to `VOIDED`, records `void_reason` and `voided_at`. Original record remains auditable.

- **`PrescriptionOrderService.verifyPrescriptionAuthenticity(tokenOrId)`**:
  - Returns public authenticity metadata (`found: boolean`, `is_valid: boolean`, `status`, `prescriber_name`, `facility_name`, `digital_signature_hash`).

---

## 4. Verification Results

- **Dedicated Test Suite**: `scripts/test-phase-7-2-prescription-workflow.ts`
- **Result**: **49 / 49 assertions passed (100%)**
- **Platform Regression Suite**: 19 test suites passed (825 / 825 assertions, 100%)
- **TypeScript Compilation**: 0 errors (`npx tsc --noEmit`)
