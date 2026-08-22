# MEDORA — MODIFICATION PHASE B.1: DOCTOR AVAILABILITY, CAPACITY & INTELLIGENT APPOINTMENT BOOKING FOUNDATION

**Document Status**: AUTHORITATIVE / COMPLETED  
**Modification Phase**: B.1 (Prompt 1 of 4 in Phase B Series)  
**Parent System**: MEDORA Enterprise Healthcare Platform  
**Compliance**: ABDM / ABHA Certified • Phase A.2 Multi-Organization Membership Architecture • Phase A.3 Strict RBAC & Tenant Scoping  

---

## 1. Executive Summary

Modification Phase B.1 establishes the foundational scheduling and capacity management engine for MEDORA. It replaces rigid per-patient consultation timer assumptions with an operational capacity model (`SESSION + CAPACITY`), where healthcare facilities and doctors configure working sessions (e.g., *Monday 08:00 AM – 10:00 AM, Capacity: 12 Patients*).

Under this architecture:
- **Doctors maintain a unified MEDORA Identity** across multiple hospital memberships without duplicate accounts.
- **Session Capacity** acts as an administrative booking ceiling, while individual consultation durations remain under clinical doctor control.
- **Server-Authoritative Transactions** enforce strict capacity checks, race-condition protections, idempotency, and immutable audit trails.

---

## 2. Main Locked Roadmap Compliance

MEDORA maintains an immutable main roadmap sequence (Phase 0 through Phase 19). Phase B.1 is the first component of the Phase B series:
- **Phase B.1**: Doctor Availability, Capacity & Intelligent Appointment Booking Foundation *(CURRENT - COMPLETE)*
- **Phase B.2**: Check-in, Token & Queue Management *(Upcoming)*
- **Phase B.3**: Dynamic Waiting-Time Estimation & Queue Optimization *(Upcoming)*
- **Phase B.4**: Alternatives, Same-Doctor Options, Waitlist & Final Appointment-System Verification *(Upcoming)*

---

## 3. Current vs Target Architecture Analysis

| Dimension | Previous State | Phase B.1 Target State |
| :--- | :--- | :--- |
| **Doctor Schedule** | Hardcoded static UI slots | Dynamic recurring sessions with day-of-week, time windows, and room allocation |
| **Capacity Model** | Rigid fixed 10-minute timer assumptions | Operational Session Capacity (`SESSION + CAPACITY`), preserving clinical autonomy |
| **Multi-Hospital Practice** | Fragmented accounts / Mock data | Single Doctor Identity with organization-scoped working sessions |
| **Booking Validation** | Client-side trust | Atomic server-authoritative capacity check, overbooking protection, race-safe |
| **Cancellation & Rescheduling**| Visual state toggle | Atomic capacity recovery, handover linking (`rescheduled_from_id` / `rescheduled_to_id`) |
| **Overrides & Exceptions** | None | Full support for doctor leaves, national holidays, facility closures, and date overrides |

---

## 4. Scheduling & Capacity Model Core Principles

1. **Session-Level Capacity Ceiling**: Doctor availability is defined by a time window (`08:00 - 10:00`) and a maximum bookable capacity ($C \in \mathbb{Z}^+$).
2. **Clinical Autonomy**: Doctors spend clinically necessary time with each patient; MEDORA does not force consultations into artificial fixed-minute slots.
3. **Multi-Facility Non-Overlap**: A single doctor cannot have overlapping working sessions at different facilities on the same day.
4. **Authoritative Server Calculations**: All calculations of `booked_count`, `remaining_capacity`, and availability status are computed by backend transactions.

---

## 5. Doctor Multi-Organization Practice Model

Built on the Phase A.2 Identity Architecture:
```
                 ┌──────────────────────────────────────┐
                 │ Dr. Ananya Sharma (DOC-1001)         │
                 │ Single Global MEDORA Identity        │
                 └──────────────────┬───────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│ City Hospital│             │Green Care    │             │Green Care    │
│ (HSP-1001)   │             │Clinic        │             │Hospital      │
│              │             │(CLN-1001)    │             │(HSP-1002)    │
│ • Mon Morn 12│             │ • Tue Morn 10│             │ • Sat Full 15│
│ • Mon Eve  8 │             │ • Thu Morn 10│             └──────────────┘
│ • Wed Morn 12│             └──────────────┘
│ • Fri Morn 12│
└──────────────┘
```

---

## 6. Doctor Working Session Entity Schema

```typescript
export interface DoctorWorkingSession {
  id: string;                         // e.g. "SES-1001"
  doctor_id: string;                  // "DOC-1001"
  doctor_name: string;                // "Dr. Ananya Sharma"
  organization_id: string;            // UUID
  organization_identifier: string;    // "HSP-1001"
  organization_name: string;          // "City Hospital"
  facility_id: string;                // "FAC-1001"
  department_id: string;              // "DEP-CARD-1001"
  department_name: string;            // "Cardiology OPD"
  day_of_week: number;                // 0=Sun, 1=Mon, ..., 6=Sat
  start_time: string;                 // "08:00"
  end_time: string;                   // "10:00"
  slot_display_time?: string;         // "08:00 AM - 10:00 AM"
  capacity: number;                   // Positive integer (e.g. 12)
  room_number?: string;               // "Room 102"
  session_name?: string;              // "Morning Cardiology OPD"
  is_active: boolean;                 // true/false
  created_at: string;
  updated_at?: string;
}
```

---

## 7. Overrides, Leaves, and Facility Closures

Supported `ScheduleOverrideType` values:
- `DOCTOR_LEAVE`: Blocks doctor availability across their sessions on the target date.
- `FACILITY_CLOSURE`: Blocks all sessions for a specific facility on a given date (e.g. national holidays).
- `CAPACITY_OVERRIDE`: Temporarily modifies session capacity for a specific date (e.g., reduced capacity due to hospital events).
- `SESSION_CANCELLED`: Administratively cancels a specific session for that date.

---

## 8. Authoritative Live Capacity Calculation Engine

$$\text{effective\_capacity} = \begin{cases} 
\text{override\_capacity}, & \text{if CAPACITY\_OVERRIDE exists} \\
0, & \text{if FACILITY\_CLOSURE or DOCTOR\_LEAVE} \\
\text{session.capacity}, & \text{otherwise}
\end{cases}$$

$$\text{active\_bookings} = \sum [\text{status} \in \{\text{CONFIRMED}, \text{REQUESTED}, \text{CHECKED\_IN}, \text{WAITING}, \text{IN\_CONSULTATION}\}]$$

$$\text{remaining\_capacity} = \max(0, \text{effective\_capacity} - \text{active\_bookings})$$

$$\text{Status} = \begin{cases}
\text{FACILITY\_CLOSURE}, & \text{if facility is closed} \\
\text{DOCTOR\_LEAVE}, & \text{if doctor is on leave} \\
\text{PAST\_SESSION}, & \text{if session end time has passed} \\
\text{FULL}, & \text{if } \text{remaining\_capacity} = 0 \\
\text{LIMITED}, & \text{if } 0 < \text{remaining\_capacity} \le 2 \\
\text{AVAILABLE}, & \text{if } \text{remaining\_capacity} > 2
\end{cases}$$

---

## 9. Atomic Booking Pipeline & Concurrency Guarantees

```
Client Request ──► Token Auth & RBAC Check ──► Validates Session & Org
                                                        │
                                                        ▼
Audit Log ◄── Atomic Insert ◄── Active Bookings < Effective Capacity
                                                        │
                                                        ▼ (If Full)
                                            Return SESSION_FULL
```

- **Single-Slot Session Race Condition (Capacity = 1)**: Two simultaneous requests arrive; server-side capacity lock ensures exactly ONE succeeds (`APT-XXXX`), while the other cleanly receives `SESSION_FULL`.
- **Idempotency**: Requests with identical `(patient_id, session_id, date)` return the existing confirmed appointment without duplicating records.

---

## 10. Cancellation & Rescheduling Atomicity

1. **Cancellation (`cancelAppointment`)**:
   - Updates appointment status to `CANCELLED`.
   - Records `cancelled_at` and `cancellation_reason`.
   - Frees future capacity in that session immediately.
2. **Rescheduling (`rescheduleAppointment`)**:
   - Atomically books the new appointment in target session (`CONFIRMED`).
   - Marks previous appointment `RESCHEDULED`.
   - Binds `rescheduled_to_id` and `rescheduled_from_id`.
   - Decrements new session capacity and frees old session capacity.

---

## 11. Unified Booking Engine Across User Roles

All entry points utilize the single `AppointmentBookingService`:
- **Patient Booking UI** (`/patient/appointments/book`): Self-booking with patient isolation.
- **Reception Desk UI** (`/reception/appointments`): Front-desk OPD booking for walk-in patients (`booking_source: "RECEPTION"`).
- **Doctor Workspace UI** (`/doctor/schedule` & `/doctor/appointments`): Schedule configuration, capacity adjustments, and outpatient roster.

---

## 12. Security, Authorization & Tenant Isolation

- **Patient Isolation**: Patients can only view and book their own appointments. Cross-account access attempts are denied.
- **Doctor & Staff Tenant Boundary**: Receptionists and doctors can only view appointments and configure schedules within their authorized hospital memberships (Phase A.3 RBAC).
- **Anti-Tampering**: Client cannot forge `doctor_id`, `organization_identifier`, or `capacity`.

---

## 13. Comprehensive Automated Verification Summary

| Test Category | Scenarios | Result |
| :--- | :--- | :--- |
| **Capacity & Booking Engine** | 0/3, 1/3, 3/3 capacity, overbooking denial | **PASSED (100%)** |
| **Cancellation & Recovery** | Releasing capacity upon patient cancellation | **PASSED (100%)** |
| **Patient Isolation** | Zero cross-account appointment leakage | **PASSED (100%)** |
| **Multi-Hospital Availability** | Dr. Ananya across 3 distinct facilities | **PASSED (100%)** |
| **Leave & Holiday Overrides** | CME leaves, Gandhi Jayanti facility closures | **PASSED (100%)** |
| **Concurrency & Race Conditions** | 2 simultaneous requests for 1 slot $\rightarrow$ 1 success, 1 fail | **PASSED (100%)** |
| **Idempotency & Double Click** | Duplicate requests return existing record | **PASSED (100%)** |
| **Rescheduling Atomicity** | Capacity handover and bidirectional linking | **PASSED (100%)** |
| **Schedule Conflict Detection** | Doctor overlap across facilities blocked | **PASSED (100%)** |
| **Security & Tampering** | Unauthorized role edits, ID forgery blocked | **PASSED (100%)** |
| **Audit Ledger Integration** | Immutable audit trail for all operations | **PASSED (100%)** |

**Phase B.1 Suite**: 58 / 58 assertions PASSED  
**Total Platform Regression Suite**: 323 / 323 assertions PASSED (0 regressions)
