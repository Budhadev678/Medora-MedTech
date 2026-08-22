# MEDORA — MODIFICATION PHASE C.1: CLINICAL ENCOUNTER & DOCTOR CONSULTATION WORKSPACE

## 1. Executive Summary

Modification Phase C.1 establishes the authoritative clinical encounter and doctor consultation layer in MEDORA. It bridges the transition from appointment booking and token queue check-in to real clinical documentation:

$$\text{Patient} \rightarrow \text{Appointment (B.1)} \rightarrow \text{Check-In \& Token (B.2)} \rightarrow \text{Doctor Called} \rightarrow \text{Start Consultation} \rightarrow \text{Healthcare Encounter} \rightarrow \text{Clinical Documentation} \rightarrow \text{Complete Consultation}$$

---

## 2. Core Architectural Principles & Guardrails

### 2.1 Invariant: Appointment $\neq$ Encounter
- **Appointment**: Represents scheduling metadata (*"The patient was scheduled to meet the doctor"*).
- **Healthcare Encounter**: Represents the actual clinical interaction (*"The consultation actually took place"*).
- **Trigger**: An encounter is **never** created at the time of appointment booking. It is created and activated strictly when the doctor explicitly selects `[Start Consultation]`.

### 2.2 Exclusivity & Single Active Consultation Invariant
- A doctor cannot have multiple active consultations in progress simultaneously.
- Attempting to start a new consultation while one is active returns `CONSULTATION_IN_PROGRESS` error.

### 2.3 Doctor Autonomy & Informational Timer
- The elapsed consultation timer is purely operational/informational (e.g. `⏱️ 14m elapsed`).
- MEDORA never counts down, never forces completion, never auto-closes sessions, and never pressures clinicians.
- Upon consultation completion, MEDORA returns the clinician to the OPD desk and **never auto-starts the next patient**, preserving complete doctor autonomy.

### 2.4 Immutable Clinical Record & Amendment Snapshots
- Completed consultations and clinical records cannot be silently overwritten.
- Any post-completion edit creates an immutable Version 1 snapshot, increments the version to 2, and requires a documented clinical reason for amendment (`ENCOUNTER_AMENDED`).

### 2.5 Strict Patient Privacy & Data Isolation
- Patient isolation is maintained across all query APIs (`PAT-1001` vs `PAT-1002`).
- Unfinalized drafts and internal doctor clinical notes are protected and hidden from patient records until explicitly completed and released.

---

## 3. Architecture & Key Modules

| Module | Location | Description |
| :--- | :--- | :--- |
| **Consultation Service** | `lib/services/consultation-service.ts` | Authoritative consultation coordinator: `startConsultationFromQueue`, `saveDraft`, `completeConsultation`, `amendConsultation`, `getConsultationContext`. |
| **Encounter Store** | `lib/data/encounter-store.ts` | Healthcare encounter entity lifecycle repository with in-memory persistence and RLS guards. |
| **Clinical Record Store** | `lib/data/clinical-record-store.ts` | Structured clinical documentation store (SOAP, vitals with units, ICD-10 diagnoses, treatment plan, version history). |
| **Consultation Workspace UI** | `app/doctor/consultations/[id]/page.tsx` | Dedicated desktop & tablet clinical consultation interface. |
| **Doctor OPD Console** | `app/doctor/page.tsx` | OPD queue with direct links to the consultation workspace. |
| **Patient Records View** | `app/patient/records/page.tsx` | Patient view displaying only finalized and released clinical consultation summaries. |

---

## 4. Structured Clinical Sections & Units

| Section | Attributes | Explicit Clinical Units |
| :--- | :--- | :--- |
| **Patient Header** | Identity, Blood Group, Age, Gender, Emergency Contact | Prominent Allergies Banner (never assumes "No allergies") |
| **Chief Complaint** | Primary presenting symptoms & duration | Freeform & structured text |
| **Presenting Symptoms** | Symptom name, duration, onset, severity | `MILD`, `MODERATE`, `SEVERE` |
| **Vitals & Observations** | Heart Rate, BP, Temp, $\text{SpO}_2$, Weight, Height, BMI | `bpm`, `mmHg` (systolic/diastolic), `°C`, `%`, `kg`, `cm`, `kg/m²` |
| **Assessment & Diagnoses** | Doctor-authored clinical impression & ICD-10 codes | `PRIMARY`, `SECONDARY`, `CONFIRMED`, `SUSPECTED` |
| **Treatment & Follow-Up** | Medical plan, lifestyle changes, follow-up date | Timeframe (e.g. `7 days`), return precautions |
| **Connected Orders** | Prescription (C.2) & Lab Orders (C.3) | Integration placeholder points |

---

## 5. Automated Verification Results

All 50 automated tests in `scripts/test-phase-c1-consultation-encounter.ts` pass with 100% success:

```
============================================================
TOTAL PHASE C.1 TESTS: 50
PASSED: 50
FAILED: 0
============================================================
```

All previous test suites (A.2, A.3, A.4, B.1, B.2, B.3, B.4) remain 100% passing with zero regressions.
