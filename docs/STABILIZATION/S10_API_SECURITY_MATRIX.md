# S10 API SECURITY & ACCESS CONTROL MATRIX

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S10 Stabilization Track  
**Focus**: Server-Side Endpoint Authorization & Zero-Trust Defense  

---

## 1. API Security Matrix

| API Route | Supported Methods | Allowed Roles | Anti-IDOR Scoping | Missing Auth Behavior | Tampered ID Behavior |
|---|---|---|---|---|---|
| `/api/auth/session` | `GET` | All Authenticated | Session Token | `401 UNAUTHORIZED` | `401 UNAUTHORIZED` |
| `/api/appointments` | `GET`, `POST` | `patient`, `doctor`, `staff` | `patient_id` / `doctor_id` | `401 UNAUTHORIZED` | `403 FORBIDDEN` |
| `/api/consultations` | `GET`, `POST` | `doctor`, `hospital_admin` | Provider Affiliation | `401 UNAUTHORIZED` | `403 FORBIDDEN` |
| `/api/prescriptions` | `GET`, `POST` | `doctor`, `patient`, `pharmacy` | Patient / Provider Ownership | `401 UNAUTHORIZED` | `403 FORBIDDEN` |
| `/api/lab/orders` | `GET`, `POST` | `doctor`, `lab_staff`, `patient`| Order Ownership | `401 UNAUTHORIZED` | `403 FORBIDDEN` |
| `/api/lab/reports` | `GET`, `POST` | `doctor`, `lab_staff`, `patient`| Report Ownership | `401 UNAUTHORIZED` | `403 FORBIDDEN` |
| `/api/pharmacy/dispense`| `POST` | `pharmacy_staff` | Pharmacy Facility Match | `401 UNAUTHORIZED` | `403 FORBIDDEN` |
| `/api/billing/bills` | `GET`, `POST` | `finance_staff`, `patient` | Invariant Bill Ownership | `401 UNAUTHORIZED` | `403 FORBIDDEN` |
| `/api/billing/payments`| `POST` | `finance_staff`, `patient` | Bill Patient Invariance | `401 UNAUTHORIZED` | `403 FORBIDDEN` |
