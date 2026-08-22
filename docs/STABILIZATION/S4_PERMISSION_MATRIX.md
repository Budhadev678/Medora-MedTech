# S4 PERMISSION MATRIX & ROLE ACCESS REGISTRY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S4 Stabilization Track  
**Focus**: Role-Based & Resource-Level Permissions Matrix  

---

## 1. Role Definitions

| Role Identifier | Role Title | Description | Domain Scope |
|---|---|---|---|
| `patient` | Patient | Healthcare consumer & account owner | Own profile, own appointments, own medical records, own bills |
| `doctor` | Doctor / Physician | Licensed medical practitioner | Clinical encounters, diagnosis, e-prescriptions, lab orders |
| `receptionist` / `staff` | Front-Desk Staff | Reception & patient intake | Appointment check-in, queue token assignment, patient lookup |
| `nurse` | Nurse | Clinical nursing staff | Vitals recording, triage, bed management |
| `lab_staff` | Lab Technician / Pathologist | Diagnostic pathology staff | Specimen custody, testing, certified report release |
| `pharmacy_staff` | Pharmacist | Pharmacy dispensing staff | Prescription intake, FEFO stock reservation, OTP dispensing |
| `finance_staff` | Billing & Finance Officer | Financial reconciliation staff | Bill creation, itemization, waterfall coverage, payment reconciliation |
| `hospital_admin` | Hospital Administrator | Facility executive | Department config, staff affiliation, operational reporting |
| `admin` | Platform Super Admin | System administrator | Global tenant configuration, user activation, audit inspection |

---

## 2. Resource Permission Matrix

| Resource | Action | Patient | Doctor | Receptionist | Lab Staff | Pharmacy | Finance | Admin |
|---|---|---|---|---|---|---|---|---|
| **Patient Profile** | VIEW | OWN ONLY | ASSIGNED | ASSIGNED | ASSIGNED | ASSIGNED | ASSIGNED | ALLOW |
| | UPDATE | OWN ONLY | DENY | DENY | DENY | DENY | DENY | ALLOW |
| **Appointments** | VIEW | OWN ONLY | ASSIGNED | FACILITY | DENY | DENY | FACILITY | ALLOW |
| | CREATE | OWN ONLY | ALLOW | ALLOW | DENY | DENY | DENY | ALLOW |
| | CANCEL | OWN ONLY | ASSIGNED | FACILITY | DENY | DENY | DENY | ALLOW |
| **Queue Tokens** | VIEW | OWN ONLY | ASSIGNED | FACILITY | DENY | DENY | FACILITY | ALLOW |
| | CREATE | OWN ONLY | DENY | ALLOW | DENY | DENY | DENY | ALLOW |
| **Encounters** | VIEW | OWN ONLY | ASSIGNED | DENY | DENY | DENY | DENY | ALLOW |
| | CREATE | DENY | ALLOW | DENY | DENY | DENY | DENY | ALLOW |
| | FINALIZE | DENY | ALLOW | DENY | DENY | DENY | DENY | ALLOW |
| **Prescriptions** | VIEW | OWN ONLY | ASSIGNED | DENY | DENY | ASSIGNED | DENY | ALLOW |
| | CREATE | DENY | ALLOW | DENY | DENY | DENY | DENY | ALLOW |
| | DISPENSE | DENY | DENY | DENY | DENY | ALLOW | DENY | ALLOW |
| **Lab Orders** | VIEW | OWN ONLY | ASSIGNED | DENY | ASSIGNED | DENY | DENY | ALLOW |
| | CREATE | DENY | ALLOW | DENY | DENY | DENY | DENY | ALLOW |
| **Lab Reports** | VIEW | OWN ONLY | ASSIGNED | DENY | ASSIGNED | DENY | DENY | ALLOW |
| | CERTIFY | DENY | DENY | DENY | ALLOW | DENY | DENY | ALLOW |
| **Healthcare Bills**| VIEW | OWN ONLY | DENY | DENY | DENY | DENY | FACILITY | ALLOW |
| | CREATE | DENY | DENY | DENY | DENY | DENY | ALLOW | ALLOW |
| **Payments** | VIEW | OWN ONLY | DENY | DENY | DENY | DENY | FACILITY | ALLOW |
| | INITIATE | OWN ONLY | DENY | ALLOW | DENY | DENY | ALLOW | ALLOW |
| | REFUND | DENY | DENY | DENY | DENY | DENY | ALLOW | ALLOW |
| **Disputes** | CREATE | OWN ONLY | DENY | DENY | DENY | DENY | DENY | ALLOW |
| | RESOLVE | DENY | DENY | DENY | DENY | DENY | ALLOW | ALLOW |
