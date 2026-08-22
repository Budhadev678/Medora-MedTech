# Phase 6.4: Advanced Queue Optimization, Waiting-Time Reduction, Waitlist Intelligence & Final Integration

## Overview

Phase 6.4 introduces statistical waiting-time intelligence, capacity optimization analytics, automated waitlist slot notifications with explicit patient acceptance, and end-to-end integration across the entire Phase 6 architecture.

Crucially, **MEDORA never optimizes by rushing doctors**. The platform treats clinical consultation time as sacred and unconstrained, achieving waiting-time reductions exclusively through intelligent arrival scheduling, robust historical duration modeling, dynamic delay adjustments, and friction-free capacity recycling.

---

## Key Subsystems & Capabilities

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           PHASE 6.4 INTELLIGENCE                          │
├──────────────────────────────┬─────────────────────────────┬──────────────┤
│    WAITING-TIME ENGINE       │    WAITLIST INTELLIGENCE    │  CAPACITY    │
│ • 5-Level Fallback Chain     │ • Cancellation Released Slot│  ANALYTICS   │
│ • Outlier Trimming (IQR)     │ • Auto-Notify Earliest WTL  │ • Util Rates │
│ • Elapsed Time Accounting    │ • 2-Hour Explicit Acceptance│ • No-Show %  │
│ • Dynamic Duration Ranges    │ • Atomic Concurrency Lock   │ • Non-AI Recs│
└──────────────────────────────┴─────────────────────────────┴──────────────┘
```

### 1. Dynamic Waiting-Time Estimation Engine (`WaitingTimeEstimationService`)
- **Realistic Duration Ranges**: Communicates dynamic ranges (e.g. `20–35 min`, `40–60 min`) rather than misleading exact timestamps (e.g. `9:32 AM`).
- **5-Level Fallback Duration Hierarchy**:
  1. `Doctor + Service + Facility`: Specific historical profile for the doctor performing that exact procedure.
  2. `Doctor + Department`: General profile for the doctor within that clinical unit.
  3. `Service + Department`: Average duration for that service across all affiliated specialists.
  4. `Department + Facility`: Department-wide baseline duration.
  5. `Facility Baseline`: Global standard outpatient duration (default 12.5 minutes).
- **Elapsed Time Accounting**: Real-time integration of elapsed consultation minutes for the currently active patient. If a complex consultation exceeds the median baseline, the remaining queue is dynamically adjusted with buffer intervals without alerting the doctor to rush.
- **Queue Pause & Schedule Delay Adjustment**: Reflects clinic breaks, emergency surgeries, and doctor delays immediately in patient waiting ranges.

### 2. Waitlist Intelligence & Slot Recycling (`WaitlistStore`)
- **Capacity Saturated Waitlist Entry**: Patients can join an active waitlist when preferred doctor working sessions are fully booked (`status: ACTIVE`).
- **Cancellation-Triggered Notification**: When an existing appointment is cancelled, capacity is atomically released and the earliest eligible waitlisted patient is transitioned to `status: NOTIFIED` / `status: OFFERED`.
- **2-Hour Explicit Acceptance Window**: The offered patient must explicitly accept the released slot (`acceptWaitlistOffer`), which converts their waitlist record to `status: ACCEPTED` and confirms their booking.
- **Race Condition & Expiry Protection**: Unclaimed slot offers expire after the notification window, cascading seamlessly to the next waitlisted patient.

### 3. Capacity & Operational Analytics Engine (`CapacityAnalyticsService`)
- **Session Utilization Metrics**:
  - **Booking Utilization Rate**: $\frac{\text{Confirmed Bookings}}{\text{Session Capacity}} \times 100$
  - **Clinical Completion Rate**: $\frac{\text{Completed Consultations}}{\text{Session Capacity}} \times 100$
  - **No-Show Rate**: $\frac{\text{No Shows}}{\text{Confirmed Bookings} + \text{No Shows}} \times 100$
  - **Cancellation Rate**: $\frac{\text{Cancelled}}{\text{Confirmed} + \text{Cancelled}} \times 100$
- **Non-AI Explainable Capacity Recommendations**:
  - Automatically identifies sessions consistently exceeding $90\%$ booking utilization.
  - Formulates transparent operational guidance (e.g., *"Consider increasing session capacity limit by 2–4 slots or scheduling an afternoon follow-up session"*).

### 4. Explainable 5-Tier Alternative Suggestions (`AlternativeSearchService`)
- **Tier 1 — Same Doctor, Same Facility (Different Time/Date)**: Preserves doctor and location continuity.
- **Tier 2 — Same Doctor, Different Affiliated Facility**: Same specialist at another connected hospital or clinic in the city.
- **Tier 3 — Same Department/Specialty, Same Facility (Different Doctor)**: Faster availability within the same physical campus.
- **Tier 4 — Same Department/Specialty, Different Facility (Same Group)**: Nearby affiliated network facilities.
- **Tier 5 — Teleconsultation Option**: Video consultation alternative if in-person slots are exhausted.
- **Strict Preferred Doctor Filter**: When `filter_same_doctor_only = true`, tiers 3 and 4 are strictly excluded to preserve patient preference.

---

## Phase 6 End-to-End Master Flow

```
1. DISCOVERY & BOOKING (Phase 6.1)
   Doctor Search ──► Session Selection ──► Atomic Capacity Check ──► APT-1001 (CONFIRMED)
                                              │ (If Session Full)
                                              ▼
                                       Waitlist Queue (ACTIVE)

2. ARRIVAL & CHECK-IN (Phase 6.2 & 6.3)
   Patient Self Check-In / Reception Desk ──► Deterministic Token (C-01) ──► Queue (WAITING)

3. REAL-TIME QUEUE MONITORING (Phase 6.3 & 6.4)
   Patient Live Token Card ◄── Dynamic Estimate (20–35 min) ◄── WaitingTimeEstimationService

4. CLINICAL CALL & EXCLUSIVITY (Phase 6.3)
   Doctor: CALL NEXT ──► Token C-01 (CALLED) ──► START CONSULTATION ──► (IN_CONSULTATION)
   [Max 1 Active Patient In Consultation Guard]

5. CLINICAL COMPLETION & ENCOUNTER HANDOFF (Phase 6.3)
   Doctor: COMPLETE ──► Token C-01 (COMPLETED) ──► C.1 Encounter Initialized
   [Doctor Spends Actual Clinical Time Without Timers]

6. CAPACITY RECYCLING & ADVANCED OPTIMIZATION (Phase 6.4)
   Appointment Cancellation ──► Slot Match ──► Waitlist Offer (2hr Window) ──► Explicit Accept
```

---

## Verification & Test Coverage

Phase 6.4 is verified by `scripts/test-phase-6-4-optimization-waitlist.ts` covering **22 comprehensive assertions (100% pass rate)**:

1. **Advanced Dynamic Waiting Estimation**: Sequential check-ins, people-ahead calculation, duration range validation, dynamic non-timestamp formatting.
2. **Capacity & No-Show Analytics**: Session utilization metrics, confirmed counts, booking utilization rates, cancellation/no-show rate tracking, facility aggregation.
3. **Waitlist Intelligence & Explicit Acceptance**: Waitlist registration, cancellation capacity release, automated earliest candidate notification, explicit patient acceptance, atomic state updates.
4. **End-to-End Master Clinical Flow**: Sequential calling, start consultation, completion with C.1 Encounter handoff, strict preferred doctor preservation across multi-facility footprint.
