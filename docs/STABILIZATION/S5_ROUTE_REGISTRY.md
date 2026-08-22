# S5 ROUTE REGISTRY & WORKSPACE DIRECTORY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S5 Stabilization Track  
**Focus**: Authoritative Route Inventory across Phase 0–10  

---

## 1. Core Role Workspace Routes

| Workspace | Primary Route | Role Access | Layout Shell | Protection |
|---|---|---|---|---|
| **Patient Consumer Portal** | `/patient` | `patient` | `PatientShell` | Protected |
| **Doctor Clinical Workspace** | `/doctor` | `doctor`, `admin` | `ProfessionalShell` | Protected |
| **Hospital Operations** | `/hospital` | `hospital_admin`, `admin` | `ProfessionalShell` | Protected |
| **Diagnostic Laboratory** | `/lab` | `lab_staff`, `admin` | `ProfessionalShell` | Protected |
| **Pharmacy Dispensing** | `/pharmacy` | `pharmacy_staff`, `admin` | `ProfessionalShell` | Protected |
| **Emergency Trauma Unit** | `/emergency` | `emergency_staff`, `admin` | `ProfessionalShell` | Protected |
| **Blood Bank Desk** | `/blood-bank` | `blood_staff`, `admin` | `ProfessionalShell` | Protected |
| **Healthcare Financing** | `/finance` | `finance_staff`, `admin` | `ProfessionalShell` | Protected |
| **Front Desk & Reception** | `/reception` | `receptionist`, `hospital_admin`, `admin` | `ProfessionalShell` | Protected |
| **Platform Governance** | `/admin` | `admin` | `ProfessionalShell` | Protected |

---

## 2. Detailed Clinical & Operational Route Map

### Doctor Workspace Routes
- `/doctor`: Today's clinical overview, active queue count, upcoming appointments.
- `/doctor/appointments`: Live queue tokens & appointment rosters.
- `/doctor/consultations`: Active patient consultations.
- `/doctor/consultations/[id]`: Patient encounter consultation suite (SOAP notes, vitals, diagnosis).
- `/doctor/prescriptions`: E-prescription drafting and digital signature.
- `/doctor/lab-orders`: Diagnostic investigation ordering desk.
- `/doctor/schedule`: Doctor working sessions and facility capacity configuration.
- `/doctor/patients`: Assigned patient directory with medical history summary.

### Laboratory Workspace Routes
- `/lab/orders`: Diagnostic test order queue.
- `/lab/orders/[id]`: Test order details and specimen requirements.
- `/lab/samples`: Biological specimen collection and custody movement desk.
- `/lab/testing`: Diagnostic testing workbench and analyzer result entry.
- `/lab/verification`: Pathologist result verification and delta checks.
- `/lab/reports`: Certified diagnostic laboratory reports archive.

### Pharmacy Workspace Routes
- `/pharmacy/prescriptions`: Digital prescription intakes routed to pharmacy.
- `/pharmacy/preparation`: Medication preparation, picking & packing desk.
- `/pharmacy/pickup`: Verified orders awaiting counter collection.
- `/pharmacy/dispensing`: OTP verification and atomic stock decrement dispensing desk.
- `/pharmacy/inventory`: FEFO batch tracking, expiry monitoring, and stock levels.

### Hospital Administration & Billing Routes
- `/hospital`: Operational command center with bed occupancy and revenue metrics.
- `/hospital/appointments`: Facility-wide appointment schedule and waitlists.
- `/hospital/billing`: Itemized healthcare billing console and invoice generation.
- `/hospital/billing/[billId]`: Detailed invoice itemization, discounts, and insurance waterfall.
- `/hospital/billing/payments`: Cashier desk and UPI payment settlement desk.
- `/hospital/departments`: Department rosters and clinical specialties.
- `/hospital/doctors`: Affiliated physician roster and session fees.
- `/hospital/admissions`: Inpatient bed registry and admission tracking.
- `/admin/audit`: Immutable compliance and security audit log.

### Patient Consumer Routes
- `/patient`: Mobile-first home dashboard with quick action cards.
- `/patient/appointments`: My Appointments roster and status.
- `/patient/appointments/book`: Search doctor/facility and select appointment slot.
- `/patient/prescriptions`: Digital prescriptions with active medication schedules.
- `/patient/reports`: Pathology lab test reports with normal reference ranges.
- `/patient/pharmacy`: Pharmacy order tracking and dispensing OTP code display.
- `/patient/billing`: Itemized bills, financial assistance waterfall, and dispute filing.
- `/patient/care`: Healthcare providers directory (hospitals, clinics, doctors).
- `/patient/profile`: Patient demographics, emergency contacts, and ABHA passport.
- `/patient/emergency`: Emergency hospital locator and 1-tap ambulance dispatch.
