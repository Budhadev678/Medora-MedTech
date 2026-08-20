# 📖 MEDORA — Developer & Workflow Guide

## 1. Master Ecosystem Rules
1. **Never use hardcoded strings for relationships:** All connections between Doctor, Hospital, Department, Clinic, Lab, Pharmacy, Patient, and Bill must go through explicit relational records (`doctor_affiliations`, `encounters`, `prescriptions`, `lab_orders`, `bills`, `bill_items`).
2. **Never duplicate personas across facilities:** A Doctor (`DOC-1001`) who works at 3 hospitals has 1 user record and 3 `doctor_affiliations`.
3. **Prescriptions are open:** A prescription is created by a Doctor within a Healthcare Encounter and can be fulfilled by any connected pharmacy.
4. **Billing Lineage:** Every `bill_item` references its underlying medical event (`linked_event_type`, `linked_event_id`).
5. **Cross-cutting Audit Ledger:** Every critical action produces an `audit_logs` record detailing `WHO`, `WHAT`, `WHEN`, `WHY`, and `STATUS`.

---

## 2. Testing Roles & Personas
| Role | Email | Identifier | Default Context |
| :--- | :--- | :--- | :--- |
| **Patient A** | `patient@medora.health` | `PAT-1001` | Rahul Verma (Bhubaneswar) |
| **Patient B** | `priya@medora.health` | `PAT-1002` | Priya Sharma (Cuttack) |
| **Patient C** | `amit@medora.health` | `PAT-1003` | Amit Das (Puri) |
| **Doctor** | `doctor@medora.health` | `DOC-1001` | Dr. Ananya Sharma (Cardiologist — 3 Affiliations: HSP-1001, HSP-1002, CLN-1001) |
| **Hospital** | `hospital@medora.health` | `HSP-1001` | City Hospital (Command Center) |
| **Clinic** | `clinic@medora.health` | `CLN-1001` | Green Care Clinic |
| **Laboratory** | `lab@medora.health` | `LAB-1001` | ABC Diagnostics |
| **Pharmacy** | `pharmacy@medora.health` | `PHA-1001` | ABC Pharmacy |
| **Blood Centre** | `bloodbank@medora.health` | `BLC-1001` | City Blood Centre |
| **Insurance** | `insurance@medora.health` | `INS-1001` | ABC Insurance |
| **Financing** | `finance@medora.health` | `FIN-1001` | Healthcare Finance Partner |
| **Government** | `government@medora.health` | `GOV-1001` | Government Assistance Org |
| **Ambulance** | `ambulance@medora.health` | `AMB-1001` | ABC Ambulance Services |
| **Staff** | `staff@medora.health` | `STAFF-1001` | Sunita Mohanty (City Hospital Head Nurse) |
| **Admin** | `admin@medora.health` | `ADM-1001` | Medora Admin (Registry Auditor) |
