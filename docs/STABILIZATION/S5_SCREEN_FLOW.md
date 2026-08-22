# S5 SCREEN FLOW & INTERCONNECTED JOURNEYS

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S5 Stabilization Track  
**Focus**: Screen-to-Screen Transitions & Healthcare Journeys  

---

## 1. Primary Healthcare Workflow Graphs

### Patient Outpatient Journey
```
[PATIENT DASHBOARD] (/patient)
       │
       ▼
[APPOINTMENTS DESK] (/patient/appointments)
       │
       ▼
[BOOK APPOINTMENT] (/patient/appointments/book) ── (Select Specialty, Doctor & Slot)
       │
       ▼
[CONFIRMATION & DETAILS] (/patient/appointments) ── (Live Queue Token C-01)
       │
       ▼
[CHECK-IN TOKEN] ──► Assigned to Doctor Queue
```

### Doctor Consultation & Clinical Cascade
```
[DOCTOR OVERVIEW] (/doctor)
       │
       ▼
[CLINICAL QUEUE] (/doctor/appointments) ── (Select Waiting Patient)
       │
       ▼
[CONSULTATION SUITE] (/doctor/consultations/[id]) ── (SOAP, Vitals, Assessment)
       ├───► [ISSUE E-PRESCRIPTION] (/doctor/prescriptions)
       │            │
       │            ▼
       │     Routes to [PHARMACY INTAKE] (/pharmacy/prescriptions)
       │
       └───► [ORDER LAB TESTS] (/doctor/lab-orders)
                    │
                    ▼
             Routes to [LAB ORDERS QUEUE] (/lab/orders)
```

### Diagnostic Laboratory Lifecycle
```
[LAB ORDERS QUEUE] (/lab/orders) ── (Select Order LAB-ORD-1001)
       │
       ▼
[SPECIMEN CUSTODY DESK] (/lab/samples) ── (Collect Sample SMP-1001)
       │
       ▼
[TESTING WORKBENCH] (/lab/testing) ── (Enter Analyzer Results)
       │
       ▼
[REPORT VERIFICATION] (/lab/verification) ── (Pathologist Sign-off)
       │
       ▼
[CERTIFIED REPORT RELEASE] (/lab/reports) ──► Visible in Patient & Doctor Portals
```

### Pharmacy FEFO Dispensing Lifecycle
```
[PRESCRIPTION INTAKES] (/pharmacy/prescriptions) ── (Receive RX-1001)
       │
       ▼
[ORDER PREPARATION] (/pharmacy/preparation) ── (Reserve FEFO Batch BATCH-1001)
       │
       ▼
[READY FOR PICKUP] (/pharmacy/pickup) ── (Notify Patient with OTP)
       │
       ▼
[DISPENSING DESK] (/pharmacy/dispensing) ── (Verify OTP & Execute Atomic Dispense)
       │
       ▼
[COMPLETED & RECEIPT] ──► Stock decremented; Receipt stored
```

### Financial Billing & 3-Way Reconciliation
```
[HOSPITAL BILLING] (/hospital/billing) ── (Generate Draft Bill BILL-1001)
       │
       ▼
[BILL DETAILS] (/hospital/billing/[billId]) ── (Compile Provenance & 5-Tier Waterfall)
       │
       ▼
[CASHIER & PAYMENTS] (/hospital/billing/payments) ── (Process UPI / Card / Cash)
       │
       ▼
[3-WAY RECONCILIATION] (/hospital/finance/reconciliation) ── (Automated Ledger Run)
```
