# 📄 MEDORA — Sub-Phase 7.1 Technical Specification

## Clinical Encounter Foundation, Doctor Workspace & Clinical Documentation

**Sub-Phase**: 7.1  
**Master Phase**: Phase 7 — Digital Consultation & Prescription  
**Status**: `VERIFIED`  

---

## 1. Overview & Operational-to-Clinical Transition

Sub-Phase 7.1 establishes MEDORA's core **Clinical Encounter Architecture**, transitioning the patient journey from operational queue management (Phase 6) into formal clinician-patient care delivery.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              OPERATIONAL-TO-CLINICAL FLOW                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PATIENT ──> APPOINTMENT ──> CHECK-IN ──> TOKEN ──> QUEUE ──> CALLED ──> DOCTOR         │
│                                                                           │            │
│                                                     [START CONSULTATION]  │            │
│                                                                           ▼            │
│ PATIENT TIMELINE <── FINALIZATION <── REVIEW <── NOTES <── ENCOUNTER (ENC-xxxx)        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fundamental System Guarantees

1. **Entity Separation**:
   - `Appointment` (`APT-1001`): Operational reservation.
   - `QueueEntry` (`QE-1001`): Operational token room movement.
   - `HealthcareEncounter` (`ENC-1001`): Authoritative clinical interaction record.
2. **Decoupled Queue & Encounter Completion**:
   - Marking a queue entry as `COMPLETED` frees the token board for `CALL NEXT`.
   - The encounter record transitions to `DOCUMENTING` / `FINALIZED`, allowing clinicians to finalize notes without holding up the OPD queue.
3. **Non-AI Infrastructure Principle**:
   - MEDORA provides infrastructure and documentation tools; clinicians make 100% of diagnostic and treatment decisions.
   - Zero auto-generated diagnoses or treatments.
4. **Data Provenance Categories**:
   - *Patient-Provided Reason*: Preserved from booking (e.g., "Patient-provided reason: Chest tightness").
   - *Clinician-Observed*: Examination findings & vitals with explicit units.
   - *Clinician-Assessed*: Doctor-authored ICD-10 diagnoses (`CONFIRMED` / `SUSPECTED`).
5. **Atomic Finalization & Amendment Versioning**:
   - Finalization locks ordinary edits (`FINALIZED`).
   - Post-finalization edits require a documented amendment, producing an immutable version snapshot ($V_1 \rightarrow V_2$) in `version_history`.

---

## 3. Data Architecture & Lifecycle

### Encounter State Machine
```
CREATED / DRAFT ──> ACTIVE / IN_PROGRESS ──> DOCUMENTING ──> READY_FOR_FINALIZATION ──> FINALIZED
                                                                                └──> CANCELLED
```

### Key API & Service Contracts

- **`ConsultationService.startConsultationFromQueue(queueEntryId, actor)`**:
  - Validates clinician identity (`actor.role === "doctor"`).
  - Checks doctor exclusivity (blocks starting concurrent active consultations).
  - Creates/opens authoritative `HealthcareEncounter` (`ENC-xxxx`).
  - Sets queue entry and appointment to `IN_CONSULTATION`.
  - Idempotent: Repeated invocations return existing active encounter.

- **`ConsultationService.saveDraft(encounterId, draftData, actor)`**:
  - Saves SOAP notes, vitals, symptoms, diagnoses to `ClinicalRecord`.
  - Status remains `DRAFT` / `IN_PROGRESS` (never auto-finalized).

- **`ConsultationService.completeConsultation(encounterId, finalData, actor)`**:
  - Validates required mandatory fields (Chief Complaint & Assessment/Diagnosis).
  - Transitions `HealthcareEncounter` to `FINALIZED` and sets `finalized_at`, `finalized_by`.
  - Atomically locks record against unversioned updates.

- **`ConsultationService.amendConsultation(encounterId, amendmentData, reason, actor)`**:
  - Requires explicit clinical amendment reason.
  - Pushes Version 1 state snapshot into `version_history`.
  - Increments version to 2 and sets status to `AMENDED`.

---

## 4. User Workspace (`/doctor/consultations/[id]`)

- **Context & Safety Header**:
  - Patient Identity, MEDORA ID, Blood Group (with provenance badge).
  - Known Allergies: Displays `"Not recorded"` when data is absent (no fabricated data).
  - Informational Elapsed Duration (`⏱️ 18m elapsed`) — zero forced timers.
  - Autosave status indicator: `● Saved at 10:42 AM`, `⏳ Saving...`, `⚠️ Unsaved changes`.
- **SOAP Composer**:
  - Chief Complaint with Patient-Provided Reason badge.
  - Symptoms with onset, duration, and severity badges.
  - Vitals with explicit units (°C, bpm, mmHg, SpO2 %, kg, cm) and auto-calculated BMI.
  - Clinician Assessment & ICD-10 Diagnoses.
  - Treatment & Follow-up Plan.
- **Review & Finalization Wizard**:
  - Review Modal $\rightarrow$ "You are about to finalize this clinical record" confirmation dialog.
  - Amendment Modal: Documented reason prompt for post-finalization updates.

---

## 5. Security, IDOR Protection & Audit

- **Access Engine & RLS**:
  - Evaluates `Access = Doctor + Org + Facility + Patient Relationship + Active Encounter + Scope`.
  - Strict Patient Isolation: Patient B attempting to load Patient A's encounter context receives `null` (`Access Denied`).
- **Audit Ledger Logging**:
  - `RECORD_VIEWED`, `ENCOUNTER_CREATED`, `ENCOUNTER_STARTED`, `CLINICAL_RECORD_CREATED`, `CLINICAL_RECORD_UPDATED`, `CLINICAL_RECORD_COMPLETED`, `ENCOUNTER_FINALIZED`, `CLINICAL_RECORD_AMENDED`.

---

## 6. Verification Results

- **Dedicated Test Suite**: `scripts/test-phase-7-1-clinical-encounter.ts`
- **Result**: **39 / 39 assertions passed (100%)**
- **Platform Regression Suite**: 18 test suites passed (776 / 776 assertions, 100%)
- **TypeScript Compilation**: 0 errors (`npx tsc --noEmit`)
