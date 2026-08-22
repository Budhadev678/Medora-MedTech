# S9 LIFECYCLE STATUS TRANSITION MAP

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S9 Stabilization Track  
**Focus**: Authoritative State Machine & Valid Lifecycle Transitions  

---

## 1. Status Transition Matrices

### A. Outpatient Appointments (`AppointmentStatus`)
```
REQUESTED ─────────► CONFIRMED ─────────► CHECKED_IN ─────────► IN_CONSULTATION ─────────► COMPLETED
    │                    │                      │
    ▼                    ▼                      ▼
CANCELLED            CANCELLED              NO_SHOW
```

### B. Clinical Encounters (`EncounterStatus`)
```
IN_PROGRESS ─────────► COMPLETED ─────────► SIGNED / FINALIZED
```

### C. Digital Prescriptions (`PrescriptionStatus`)
```
DRAFT ─────────► ACTIVE / FINALIZED ─────────► DISPENSED
                       │
                       ▼
                   CANCELLED
```

### D. Diagnostic Laboratory Orders & Reports (`LabOrderStatus`, `LabReportStatus`)
```
ORDERED ─────────► SPECIMEN_COLLECTED ─────────► IN_TESTING ─────────► VERIFIED ─────────► RELEASED
```

### E. Pharmacy Dispensing Orders (`PharmacyOrderStatus`)
```
RECEIVED ─────────► PREPARING ─────────► READY ─────────► DISPENSED
```

### F. Healthcare Bills & Invoices (`BillStatus`)
```
DRAFT ─────────► ISSUED / UNPAID ─────────► PARTIALLY_PAID ─────────► PAID / SETTLED
```
