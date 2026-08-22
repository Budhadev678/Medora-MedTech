# Phase 6.3: Reception, Check-In, Operational Dashboards & Doctor Queue Workspace

## Overview

Phase 6.3 establishes the operational user interfaces, real-time desk flows, and distinct role-based workspaces required for hospitals and clinics to conduct full Outpatient Department (OPD) operations using MEDORA.

Building directly upon the foundations established in **Phase 6.1 (Appointment Discovery & Intelligent Booking)** and **Phase 6.2 (Capacity, Token & Dynamic Queue Engine)**, Phase 6.3 delivers dedicated, isolated frontends and backend workflow controllers for:

1. **Patients** (`/patient/appointments` & `/queue`): Real-time personal token display, waiting-time ranges, room location, and live status animations.
2. **Reception Staff** (`/reception` & `/reception/checkin`): Comprehensive OPD overview, fast multi-attribute patient search, scheduled check-in execution, token receipt reprinting, walk-in patient intake, and exception management.
3. **Doctors & Specialists** (`/doctor` & `/doctor/consultations`): Dedicated OPD consultation workspace, active session stats, current/next patient cards, server-authoritative `CALL NEXT`, single-active consultation guards (`START CONSULTATION`), skip/recall with audit justification, and pause/resume controls.
4. **Hospital Administrators** (`/hospital`): Facility-wide OPD department utilization metrics, queue health alerts, capacity monitoring, and statistical operations reporting without clinical privacy exposure.

---

## Architectural Principles & Strict Guarantees

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CENTRAL QUEUE & APPOINTMENT STATE                    │
│    Authoritative Server Store: QueueStore & AppointmentStore (SSOT)     │
└──────┬──────────────────────┬──────────────────────┬────────────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   PATIENT    │       │  RECEPTION   │       │    DOCTOR    │
│  WORKSPACE   │       │  WORKSPACE   │       │  WORKSPACE   │
│              │       │              │       │              │
│ • Live Token │       │ • Fast Search│       │ • Call Next  │
│ • Wait Range │       │ • Check-in   │       │ • Start/End  │
│ • Room / Pos │       │ • Walk-ins   │       │ • Skip/Recall│
│ • Called UI  │       │ • Reprint    │       │ • Pause/Play │
└──────────────┘       └──────────────┘       └──────────────┘
```

### 1. Separation of Workspaces
- **Patient Workspace** $\neq$ **Reception Dashboard** $\neq$ **Doctor Dashboard** $\neq$ **Hospital Admin Dashboard**.
- Each role is strictly guarded by `RoleGuard` and backend authorization checks.
- Reception staff cannot view unrestricted clinical consultation notes.
- Patients cannot view other patients in the queue (token numbers only on public boards; strict anti-IDOR checks on waiting-time estimates).

### 2. Single Authoritative Source of Truth
- The server queue database (`QueueStore`) is authoritative.
- Frontend state is a reactive representation updated via local mutations, periodic sync, and standard `medora-queue-updated` event dispatchers.
- Sequential tokens (`C-01`, `C-02`, etc.) are generated atomically and deterministically per doctor, session, and day.

### 3. Doctor-First Clinical Autonomy
- **Zero forced timeouts**: The system never rushes doctors or displays countdown timers (e.g. "5 minutes remaining"). The doctor alone decides when a consultation is finished.
- **Single-active consultation invariant**: A doctor cannot have multiple active patients `IN_CONSULTATION` simultaneously. The previous consultation must be completed before starting the next.
- **Handoff to C.1 Encounter**: Completing a consultation automatically initializes the C.1 Encounter record for clinical notes and prescription entry.

---

## Component Workspaces & Capabilities

### 1. Patient Workspace (`/patient/appointments` & `/queue`)
- **Self Check-In**: Enabled on the day of appointment when the session is active. Validates date, session, and anti-IDOR rules.
- **Live Token Display (`LiveQueueCard`)**:
  - `WAITING`: Displays position in line, estimated wait range (e.g. `20–35 min`), and assigned room.
  - `CALLED`: Prominent animated alert: *"Your Token Has Been Called — Proceed to OPD Room 102"*.
  - `IN_CONSULTATION`: Real-time consultation status.
  - `PAUSED`: Informative banner: *"Queue is temporarily paused — Doctor attending emergency"*.
  - `COMPLETED`: Post-consultation confirmation and discharge link.
- **Public Display Board (`/queue`)**: Privacy-preserving OPD monitor showing "Now Serving" token, "Next in Line", and waiting token numbers without patient names.

### 2. Reception Desk (`/reception` & `/reception/checkin`)
- **Real-Time Overview Metrics**: Today's Appointments, Checked-In, Waiting, In Consultation, Completed, and No-Show counts.
- **Fast Directory Search**: Instant filtering by Appointment ID, Patient ID, Patient Name, Phone Number, Doctor Name, or Department.
- **Scheduled Check-In**: One-click check-in converting confirmed appointments to active queue entries.
- **Deterministic Token Reprint**: Re-fetches the patient's existing assigned token receipt without creating duplicates.
- **Front-Desk Walk-In Intake**: Registers new or walk-in patients directly into active doctor working sessions after checking real-time capacity limits.
- **Exception Management**: Skip missing patients with documented operational reasons; requeue returned patients safely.

### 3. Doctor Consultation Workspace (`/doctor` & `/doctor/consultations`)
- **Active Session Overview**: Real-time summary of total capacity, confirmed bookings, checked-in count, waiting list, and completed count.
- **Current & Next Patient Cards**: Dedicated cards highlighting the active patient and the immediate next candidate.
- **Operational Action Controls**:
  - `CALL NEXT`: Server determines the highest-priority waiting patient in sequential order.
  - `START CONSULTATION`: Transitions status to `IN_CONSULTATION` while strictly enforcing the single-consultation exclusivity invariant.
  - `COMPLETE CONSULTATION`: Records timestamps, marks queue entry and appointment as `COMPLETED`, and provides an immediate handoff to the C.1 Clinical Encounter.
  - `SKIP`: Moves missing patient to skipped list with a mandatory operational reason.
  - `RECALL`: Restores skipped patient to `CALLED` status when they return to the waiting hall.
  - `PAUSE QUEUE` & `RESUME QUEUE`: Handles operational delays and clinical emergencies.

### 4. Hospital Admin Dashboard (`/hospital`)
- **Facility-Wide Department Breakdown**: Aggregates capacity, bookings, waiting count, active consultations, and completions across Cardiology, Neurology, Orthopedics, and other clinical units.
- **Queue Health Alerts**: Automatically highlights units experiencing high waiting times (>45 min), paused queues, or nearing capacity saturation.
- **Capacity Planning Suggestions**: Non-AI statistical suggestions highlighting high-demand morning/evening sessions.

---

## State Transition Lifecycle

```
┌─────────────┐
│  CONFIRMED  │ (Appointment booked via Phase 6.1)
└──────┬──────┘
       │ [Reception Check-In / Patient Self Check-In]
       ▼
┌─────────────┐
│   WAITING   │ (Assigned Token e.g. C-01; position calculated)
└──────┬──────┘
       │ [Doctor: CALL NEXT]
       ▼
┌─────────────┐
│   CALLED    │ ◄────────────────────────┐
└──────┬──────┘                          │
       │                                 │ [Doctor: RECALL]
       ├──────────────► ┌─────────────┐  │
       │ [Doctor: SKIP] │   SKIPPED   │──┘
       │                └─────────────┘
       ▼ [Doctor: START CONSULTATION]
┌─────────────────┐
│ IN_CONSULTATION │ (Exclusivity constraint enforced: Max 1 per doctor)
└──────┬──────────┘
       │ [Doctor: COMPLETE CONSULTATION]
       ▼
┌─────────────┐
│  COMPLETED  │ ──► [Handoff to C.1 Clinical Encounter]
└─────────────┘
```

---

## Verification & Test Coverage

Phase 6.3 is verified by `scripts/test-phase-6-3-reception-dashboards.ts` covering **28 comprehensive assertions (100% pass rate)**:

1. **Patient Workspace & Eligibility**: Confirmed booking, same-day self check-in, double check-in idempotency, unauthorized third-party check-in rejection.
2. **Reception Dashboard & Controls**: Live facility queue queries, appointment search, token reprint stability, walk-in registration with capacity validation.
3. **Doctor Workspace & Queue Progression**: `CALL NEXT`, `START CONSULTATION` exclusivity guard, unconstrained consultation completion, skip with reason, recall to called status.
4. **Hospital Admin Dashboard**: Facility-wide operations summary, department aggregation, pause/resume queue controls.
5. **Security & Anti-IDOR**: Strict privacy isolation preventing unauthorized users from accessing other patients' waiting estimates.
