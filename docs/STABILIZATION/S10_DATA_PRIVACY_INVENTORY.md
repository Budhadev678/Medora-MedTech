# S10 DATA PRIVACY INVENTORY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S10 Stabilization Track  
**Focus**: Personal Health Information (PHI), Personally Identifiable Information (PII) & Access Boundaries  

---

## 1. Privacy Data Inventory & Storage Boundaries

| Data Category | Specific Fields | Storage Location | Authorized Personas | Access Control Safeguard |
|---|---|---|---|---|
| **Patient Identity & PII** | Full name, DOB, phone, gender, email | `identities.patientData` | Patient, Assigned Doctor, Hospital Front Desk | `validatePatientRecordAccess` |
| **National Health ID (ABHA)**| 14-digit ABHA ID, ABHA Address | `identities.patientData.abhaNumber` | Patient, Healthcare Providers | Identity Token Authentication |
| **Clinical Records (PHI)** | SOAP notes, vital signs, diagnoses | `encounters.clinical_notes` | Patient, Attending Physician | Provider Affiliation Validation |
| **E-Prescriptions** | Drug names, dosage, duration, instructions | `prescriptions.items` | Patient, Doctor, Pharmacist | Encounter Key Binding |
| **Diagnostic Pathology** | Specimen barcodes, lab test results | `lab_orders`, `lab_reports` | Patient, Doctor, Pathologist | Certified Digital Signature |
| **Financial & Payments** | Itemized bills, insurance claims, UPI txns| `bills`, `payments` | Patient, Hospital Finance Officer | Billing Patient ID Matching |
