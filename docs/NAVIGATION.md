# 🧭 MEDORA — Navigation Architecture & Role Routes

This document defines the centralized routing, role permission maps, and navigation layouts.

---

## 1. Role-Based Navigation Matrix

| Role | Primary Navigation Pattern | Primary Menu Items |
| :--- | :--- | :--- |
| **`patient`** | Responsive Bottom Bar (Mobile) / Top Bar (Desktop) | Home, Appointments, Health Records, Bills & Insurance, Profile |
| **`doctor`** | Left Sidebar (Desktop) / Drawer (Tablet/Mobile) | Dashboard, Appointments Queue, Consultations, Prescriptions, Lab Orders, Referrals, Availability |
| **`hospital_admin`** | Left Sidebar (Desktop) | Overview, Departments, Staff Roster, Admissions, Bed Board, Emergency, Billing, Audit Logs |
| **`lab_staff`** | High-Density Left Sidebar | Orders Queue, Sample Collection, Testing & Values, Verification, Reports History |
| **`pharmacy_staff`** | Queue-Driven Sidebar | Incoming Prescriptions, Packaging, Pickup Verification, Dispense Logs |
| **`emergency_staff`** | Rapid Triage Board Header | Live Triage Queue, Doctor Availability, Escalation Desk, Blood Coordination |
| **`blood_staff`** | Inventory & Request Sidebar | Blood Unit Requests, Compatible Donor Matcher, Fulfillment Records |
| **`finance_staff`** | Tabular Financial Sidebar | Invoices, Insurance Claims, Govt Aid Split, Bill Disputes, Settlement History |
| **`admin`** | System Command Sidebar | System Overview, User Role Matrix, Security & Audit Trail Explorer |

---

## 2. Route Map & Permission Matrix

```
/
├── (auth)/
│   ├── login                (Public / All roles)
│   ├── register             (Patient registration)
│   └── role-switcher        (Demo quick-switcher for SIH judges)
│
├── patient/                 (Role: patient)
│   ├── page.tsx             (Patient Home Dashboard)
│   ├── appointments/        (Discovery & Booking)
│   ├── health/              (Timeline, Prescriptions, Lab Reports, Admissions)
│   ├── bills/               (Itemized Invoices & "Why was I charged?")
│   └── profile/             (Vitals, Emergency Card, ABHA connection)
│
├── doctor/                  (Role: doctor)
│   ├── page.tsx             (Clinical Queue & Schedule)
│   ├── consult/[id]/        (Digital Consultation & Rx Builder)
│   ├── patients/[id]/       (Authorized Medical Records & History)
│   └── availability/        (Duty status & on-call toggle)
│
├── hospital/                (Role: hospital_admin)
│   ├── page.tsx             (Operational Command Overview)
│   ├── departments/         (Specialty & Doctor assignment)
│   ├── admissions/          (Bed & Ward Management)
│   └── audit/               (Hospital Audit Logs)
│
├── lab/                     (Role: lab_staff)
│   ├── page.tsx             (Orders Queue)
│   ├── sample-intake/       (Barcode / Sample ID Gen)
│   └── reports/[id]/        (Result Entry & Pathologist Approval)
│
├── pharmacy/                (Role: pharmacy_staff)
│   ├── page.tsx             (Incoming Rx Queue)
│   └── dispense/            (Medora ID Verification & Handover)
│
├── emergency/               (Role: emergency_staff)
│   ├── page.tsx             (Live Triage Board)
│   └── cases/[id]/          (Emergency Snapshot & Doctor Escalation)
│
└── blood-bank/              (Role: blood_staff)
    └── page.tsx             (Urgent Unit Matching & Fulfillment)
```
