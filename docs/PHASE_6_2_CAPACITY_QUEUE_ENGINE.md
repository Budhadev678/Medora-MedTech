# 📋 MEDORA — Phase 6.2 Architecture & Specification
## Capacity Engine, Token Generation & Dynamic Queue Management

---

### 1. Overview & Core Philosophy
Phase 6.2 establishes the server-authoritative operational queue and capacity execution engine for MEDORA. It bridges the gap between pre-booked reservations (Phase 6.1) and real-time clinical consultation execution (Phase 7 / C.1 Encounter).

The fundamental architectural principle of Phase 6.2 is the strict separation of:
1. **Appointment**: The patient's pre-scheduled reservation.
2. **Queue Entry / Token**: The patient's operational position in the clinic after check-in.
3. **Clinical Encounter**: The legal clinical consultation between doctor and patient.

---

### 2. Operational Entity Model

```typescript
export interface QueueEntry {
  id: string;                      // Primary Key (e.g. "q-1001")
  queue_no: string;                // e.g. "QUE-1001"
  appointment_id?: string;         // Linked reservation (if pre-booked)
  patient_id: string;              // StoredIdentity (PAT-1001)
  patient_name: string;
  patient_phone: string;
  doctor_id: string;               // StoredIdentity (DOC-1001)
  doctor_name: string;
  organization_id: string;
  organization_identifier: string; // e.g. "HSP-1001"
  organization_name: string;
  facility_id: string;             // Physical Campus ID (e.g. "FAC-1001")
  department_id: string;
  department_name: string;
  session_id: string;              // Working Session ID (e.g. "SES-1001")
  date: string;                    // YYYY-MM-DD
  token_number: string;            // Deterministic token (e.g. "C-01", "R-02")
  token_sequence: number;          // Sequential integer for queue sorting
  source: "APPOINTMENT" | "WALK_IN";
  checkin_source: "PATIENT_SELF" | "RECEPTIONIST" | "KIOSK";
  status: QueueStatus;             // "NOT_CHECKED_IN" | "WAITING" | "CALLED" | "IN_CONSULTATION" | "COMPLETED" | "SKIPPED" | "NO_SHOW" | "LEFT_QUEUE"
  priority_class?: "NORMAL" | "FOLLOW_UP" | "WALK_IN" | "CLINICAL_PRIORITY";
  room_number: string;
  checked_in_at: string;
  called_at?: string;
  consultation_started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}
```

---

### 3. Check-in & Deterministic Token Generation

- **Server-Authoritative Tokens**: Tokens are generated sequentially per department/doctor session prefix (e.g. `C-01`, `C-02`, `R-01`, `W-01`).
- **Token Stability vs Dynamic Position**:
  - `token_number` remains stable and immutable throughout the patient's visit.
  - `queue_position` is dynamically recomputed as preceding patients are called and completed.
- **Idempotency**: Repeated check-in attempts return the existing active token without creating duplicates.

---

### 4. Queue State Machine & Doctor Exclusivity Guard

```
               [ APPOINTMENT (CONFIRMED) ]
                           │
                 Check-in (Patient / Desk)
                           ↓
                     [ WAITING ] ─────────────┐ (Missing Patient)
                           │                  ↓
                 Doctor: Call Next        [ SKIPPED ]
                           ↓                  ↓ (Patient returns)
                      [ CALLED ] ─────────────┘ (Doctor: Recall)
                           │
                 Doctor: Start Consultation
                           ↓
                 [ IN_CONSULTATION ]  ← (Guard: Max 1 active consultation per doctor)
                           │
                 Doctor: Complete Consultation
                           ↓
                    [ COMPLETED ]
                           │
                 Handoff to C.1 Encounter
```

- **Single Active Consultation Invariant**: A doctor can only have **one** patient in `IN_CONSULTATION` status simultaneously. Any concurrent attempt to call or start another consultation is rejected with `error_code: "CONSULTATION_IN_PROGRESS"`.
- **Skip & Recall Lifecycle**: Missing patients are marked `SKIPPED` with documented reasons and can be recalled back to `CALLED` status upon return without corrupting queue sequence.

---

### 5. Dynamic Waiting-Time Range Engine

- `WaitingTimeEstimationService.calculatePatientWaitingEstimate` computes realistic, human-centric waiting ranges (e.g. `20–35 min`) based on:
  1. Count of active waiting patients ahead in the sequential queue.
  2. Observed historical consultation durations for the doctor.
  3. Elapsed time in the currently active consultation.
  4. Scheduled breaks and doctor arrival delay adjustments.
- **Transparent Communication**: Avoids false precision (never claims "Doctor will see you at 9:23 AM exactly").

---

### 6. Clinical Encounter Handoff
- Upon consultation completion, `completeConsultation` automatically creates the linked `encounter_id` and transitions control to the Phase 7 / C.1 Clinical Consultation workspace.

---

### 7. Verification Results
- **Automated Test Suite**: [`scripts/test-phase-6-2-capacity-queue.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/scripts/test-phase-6-2-capacity-queue.ts)
- **Results**: 20/20 assertions passed (100%).
