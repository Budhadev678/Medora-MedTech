# 📋 MEDORA — Phase 6.1 Architecture & Specification
## Appointment Discovery, Doctor-First Booking & Intelligent Appointment Selection

---

### 1. Overview & Core Philosophy
Phase 6.1 establishes the server-authoritative appointment discovery and reservation foundation for the MEDORA Connected Healthcare Platform. It empowers patients to discover and book clinical care across multiple discovery vectors while strictly respecting patient intent and choice.

The central pillar of Phase 6.1 is **Doctor-First Discovery with Preferred Doctor Guarantees**: when a patient requests a specific clinician (e.g. Dr. Ananya Sharma), MEDORA aggregates that clinician's entire practice footprint across all connected campuses under **one unified user identity** and guarantees that MEDORA will **never** silently substitute another doctor without explicit patient consent.

---

### 2. Domain & Appointment Model

An appointment represents a patient's formal reservation for a clinical consultation session at a specific facility and department.

```typescript
export interface Appointment {
  id: string;                      // Primary Key (e.g. "apt-1001")
  appointment_no: string;          // Human-readable code (e.g. "APT-1001")
  patient_id: string;              // Reference to StoredIdentity (PAT-1001)
  patient_name: string;
  patient_phone: string;
  doctor_id: string;               // Reference to StoredIdentity (DOC-1001)
  doctor_name: string;
  organization_id: string;         // Legal Parent Org UUID
  organization_identifier: string; // e.g. "HSP-1001"
  organization_name: string;
  facility_id: string;             // Physical Campus ID (e.g. "FAC-1001")
  department_id: string;           // Clinical Department (e.g. "DEP-1001")
  department_name: string;
  service_id?: string;             // Optional Catalog Service (e.g. "SRV-1001")
  service_name?: string;
  session_id: string;              // Working Session ID (e.g. "SES-1001")
  appointment_date: string;        // YYYY-MM-DD
  session_start_time: string;      // HH:mm (e.g. "08:00")
  session_end_time: string;        // HH:mm (e.g. "10:00")
  slot_display_time: string;       // e.g. "08:00 AM - 10:00 AM"
  token_number: string;            // Sequential session token (e.g. "01")
  status: AppointmentStatus;       // "CONFIRMED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
  booking_source: BookingSource;   // "PATIENT" | "RECEPTION" | "WALK_IN"
  discovery_mode?: DiscoveryMode;  // "DOCTOR_FIRST" | "FACILITY_FIRST" | "SERVICE_FIRST" | "DEPARTMENT_FIRST"
  doctor_preference?: DoctorPreferenceMode; // "SAME_DOCTOR_ONLY" | "PREFER_DOCTOR_ALLOW_ALTERNATIVES"
  consultation_fee?: number;       // Facility-specific fee (e.g. ₹500)
  opd_room?: string;               // Room identifier (e.g. "OPD Room 102")
  is_follow_up?: boolean;
  previous_encounter_id?: string;
  reason_for_visit: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;
}
```

---

### 3. Discovery Modes

1. **Doctor-First Discovery (`DOCTOR_FIRST`)**:
   - Patient searches by clinician name or specialty.
   - MEDORA invokes `searchDoctorFirstAvailability(doctorId, startDate, daysCount, options)`, resolving all connected facilities where the doctor actively practices, facility-specific OPD fees, room allocations, and 7-day session capacity.
2. **Facility-First Discovery (`FACILITY_FIRST`)**:
   - Patient begins by selecting a hospital or clinic campus (`FAC-1001`), then chooses clinical department, service, and eligible doctors.
3. **Service-First Discovery (`SERVICE_FIRST`)**:
   - Patient searches for a healthcare service (e.g. "Cardiology Consultation", "ECG", "Echocardiography").
   - MEDORA returns all facilities offering that service along with practicing clinicians.
4. **Department-First Discovery (`DEPARTMENT_FIRST`)**:
   - Patient selects a specialty department (e.g. Cardiology, Orthopedics, Pediatrics), browsing practicing specialists across affiliated campuses.

---

### 4. Preferred Doctor Rules & 5-Tier Alternatives

```
                                  PREFERRED DOCTOR MODE
                                             │
                    ┌────────────────────────┴────────────────────────┐
                    ↓                                                 ↓
          "SAME DOCTOR ONLY"                             "PREFER THIS DOCTOR"
    (filter_same_doctor_only = true)               (filter_same_doctor_only = false)
                    │                                                 │
          Strict Doctor Isolation                         5-Tier Recommendation Hierarchy:
          (Never substitutes other doctors)               1. Same doctor, later session (same facility)
                                                          2. Same doctor, other connected facility
                                                          3. Same doctor, upcoming date
                                                          4. Alternative specialist in same department
                                                          5. Alternative doctor at other facility
```

---

### 5. Session Capacity vs Artificial Slots
- MEDORA explicitly rejects artificial fixed micro-slots (e.g. forcing 6-minute slots on an 8–10 AM session).
- Doctors operate within a realistic `SESSION + CAPACITY` model (e.g. 12 patients per morning session).
- Each patient receives a capacity reservation token upon booking; operational ordering is managed dynamically by the Phase 6.2 queue engine.

---

### 6. Atomic Capacity Reservation & Concurrency
- `AppointmentBookingService.bookAppointment` executes an atomic capacity verification check prior to persisting the appointment.
- If capacity is exhausted concurrently, the transaction aborts and returns `error_code: "SESSION_FULL"`.
- If an appointment is cancelled, session capacity is released and the earliest waitlisted patient is automatically offered the slot.

---

### 7. Security, Invariants & Audit Trail
- **Least-Privilege RBAC & Anti-IDOR**: Patients can only book and view their own appointments (`request.patient_id === actor.id`).
- **Validation**:
  - Rejects inactive facilities (`FACILITY_INACTIVE`)
  - Rejects inactive or suspended doctor affiliations (`DOCTOR_INACTIVE`)
  - Rejects past date bookings (`PAST_SESSION`)
  - Blocks booking during doctor leave overrides (`DOCTOR_ON_LEAVE`) and facility closures (`FACILITY_CLOSED`)
- **Immutable Audit Logging**: Every booking, cancellation, reschedule, and waitlist event is permanently recorded in the append-only [`AuditLedger`](file:///c:/Users/Dell/Downloads/Medora-MedTech/lib/data/audit-store.ts).

---

### 8. Verification Results
- **Automated Test Suite**: [`scripts/test-phase-6-1-discovery-booking.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/scripts/test-phase-6-1-discovery-booking.ts)
- **Results**: 25/25 assertions passed (100%).
