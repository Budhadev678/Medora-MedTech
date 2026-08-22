# S5 SIDEBAR REGISTRY & NAVIGATION AUDIT

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S5 Stabilization Track  
**Focus**: Sidebar Item Truthfulness, Route Mappings & Status  

---

## 1. Sidebar Item Verification Matrix

| Role | Item Label | Route | Icon | Working Status | Audit Result |
|---|---|---|---|---|---|
| **Doctor** | Today's Overview | `/doctor` | Stethoscope | **ACTIVE** | Resolves Doctor Command Center |
| | Clinical Queue | `/doctor/appointments` | Users | **ACTIVE** | Renders live queue tokens |
| | Consultation Suite | `/doctor/consultations` | Layers | **ACTIVE** | Renders active patient visits |
| | Prescriptions | `/doctor/prescriptions` | Pill | **ACTIVE** | Renders prescription drafts |
| | Lab Test Orders | `/doctor/lab-orders` | FlaskConical | **ACTIVE** | Renders diagnostic orders |
| | Schedule & Appointments | `/doctor/schedule` | Clock | **ACTIVE** | Renders multi-facility sessions |
| | My Patients | `/doctor/patients` | Users | **ACTIVE** | Renders assigned patient list |
| **Hospital** | Command Center | `/hospital` | Building2 | **ACTIVE** | Resolves Hospital Overview |
| | Appointments Desk | `/hospital/appointments`| Clock | **ACTIVE** | Renders hospital-wide schedule |
| | Billing & Charges | `/hospital/billing` | Receipt | **ACTIVE** | Renders invoice console |
| | Cashier & Payments | `/hospital/billing/payments` | Receipt | **ACTIVE** | Renders payment settlement desk |
| | Departments | `/hospital/departments` | Layers | **ACTIVE** | Renders clinical departments |
| | Doctor & Staff Roster | `/hospital/doctors` | Users | **ACTIVE** | Renders affiliated physicians |
| | Bed & Admissions | `/hospital/admissions` | Building2 | **ACTIVE** | Renders inpatient bed tracking |
| | Hospital Audit Logs | `/admin/audit` | ShieldCheck | **ACTIVE** | Renders immutable audit ledger |
| **Lab Staff** | Test Orders Queue | `/lab/orders` | FlaskConical | **ACTIVE** | Renders diagnostic test queue |
| | Sample Custody Desk | `/lab/samples` | Layers | **ACTIVE** | Renders specimen custody trail |
| | Diagnostic Testing Desk | `/lab/testing` | Clock | **ACTIVE** | Renders analyzer result entry |
| | Report Verification | `/lab/verification` | ShieldCheck | **ACTIVE** | Renders pathologist sign-off |
| | Released Reports | `/lab/reports` | FlaskConical | **ACTIVE** | Renders certified reports |
| **Pharmacy** | Prescription Intakes | `/pharmacy/prescriptions` | Pill | **ACTIVE** | Renders received e-prescriptions |
| | Order Preparation | `/pharmacy/preparation`| Clock | **ACTIVE** | Renders picking & packing queue |
| | Ready for Pickup | `/pharmacy/pickup` | Users | **ACTIVE** | Renders counter collection queue |
| | Dispensing Desk | `/pharmacy/dispensing` | ShieldCheck | **ACTIVE** | Renders OTP verification desk |
| | Inventory & FEFO Batches| `/pharmacy/inventory` | Layers | **ACTIVE** | Renders batch expiry inventory |
| **Finance** | Hospital Billing Console| `/hospital/billing` | Receipt | **ACTIVE** | Renders invoice management |
| | Cashier & Payments | `/hospital/billing/payments` | Receipt | **ACTIVE** | Renders payment settlement desk |
| | 3-Way Reconciliation | `/hospital/finance/reconciliation` | Layers | **ACTIVE** | Renders ledger reconciliation |
| | Financial Disputes | `/hospital/finance/disputes` | AlertTriangle | **ACTIVE** | Renders dispute case graphs |
| **Admin** | System Overview | `/admin` | Building2 | **ACTIVE** | Platform overview |
| | Organizations | `/admin/organizations` | Building2 | **ACTIVE** | Tenant hospital registry |
| | Facilities Network | `/admin/facilities` | Building2 | **ACTIVE** | Physical facilities list |
| | User Identity Registry | `/admin/users` | Users | **ACTIVE** | User account management |
| | Staff Verification | `/admin/verification` | ShieldCheck | **ACTIVE** | Clinical license verification |
| | Immutable Audit Log | `/admin/audit` | ShieldCheck | **ACTIVE** | Platform audit trail |
