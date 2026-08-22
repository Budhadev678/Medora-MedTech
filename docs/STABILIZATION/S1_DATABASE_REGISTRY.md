# MEDORA — S1 DATABASE REGISTRY
## Stabilization Track — S1 Document 6 of 15

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Date**: August 2026  
**Status**: VERIFIED AUDIT

---

## 1. Enums Defined in Schema

| Enum | Values |
|---|---|
| user_role | patient, doctor, hospital_admin, lab_staff, pharmacy_staff, emergency_staff, blood_staff, finance_staff, insurance_staff, government_staff, ambulance_staff, staff, admin |
| account_status | active, pending, suspended, disabled |
| verification_status | pending, verified, rejected, suspended |
| affiliation_status | active, pending, rejected, suspended, ended |
| doctor_status | available, busy, on_call, emergency_occupied, off_duty |
| organization_type | hospital, clinic, diagnostic_lab, pharmacy, blood_bank, insurance, financing_partner, government_assistance, ambulance_provider |
| organization_membership_status | INVITED, PENDING, ACTIVE, SUSPENDED, REVOKED |

**Note**: `user_role` enum in SQL is missing `receptionist` which exists in TypeScript `UserRole` type. This is a gap.

---

## 2. Foreign Key Relationship Map

```
profiles ←──── patients (user_id)
    │ ├──── doctors (user_id)
    │ ├──── staff_memberships (user_id)
    │ ├──── organization_memberships (user_id)
    │ ├──── audit_logs (actor_id)
    │ └──── emergency_access_logs (actor_id)
    │
organizations ←── facilities (organization_id)
    │ ├──── departments (organization_id)
    │ ├──── doctor_affiliations (organization_id)
    │ ├──── staff_memberships (organization_id)
    │ ├──── organization_memberships (organization_id)
    │ ├──── facility_partnerships (partner_organization_id)
    │ ├──── insurance_policies (insurance_organization_id)
    │ ├──── prescriptions (encounter_organization_id, fulfillment_pharmacy_id)
    │ ├──── lab_orders (target_laboratory_id)
    │ ├──── lab_reports (laboratory_id)
    │ ├──── blood_requests (hospital_id, target_blood_centre_id)
    │ ├──── ambulance_requests (ambulance_organization_id)
    │ ├──── financing_applications (financing_partner_org_id)
    │ └──── emergency_access_logs (organization_id)
    │
patients ←──── appointments (patient_id)
    │ ├──── encounters (patient_id)
    │ ├──── consultations (patient_id)
    │ ├──── prescriptions (patient_id)
    │ ├──── lab_orders (patient_id)
    │ ├──── lab_reports (patient_id)
    │ ├──── insurance_policies (patient_id)
    │ ├──── consent_records (patient_id)
    │ ├──── emergency_cases (patient_id)
    │ ├──── hospital_transfers (patient_id)
    │ ├──── referrals (patient_id)
    │ ├──── bills (patient_id)
    │ ├──── payments (patient_id)
    │ ├──── insurance_claims (patient_id)
    │ ├──── assistance_applications (patient_id)
    │ ├──── financing_applications (patient_id)
    │ ├──── bill_disputes (patient_id)
    │ └──── emergency_access_logs (patient_id)
    │
doctors ←──── appointments (doctor_id)
    │ ├──── encounters (doctor_id)
    │ ├──── consultations (doctor_id)
    │ ├──── prescriptions (doctor_id)
    │ ├──── lab_orders (doctor_id)
    │ ├──── doctor_affiliations (doctor_id)
    │ ├──── emergency_cases (assigned_doctor_id)
    │ └──── referrals (referring_doctor_id, target_doctor_id)
    │
encounters ←── consultations (encounter_id, UNIQUE)
    │ ├──── prescriptions (encounter_id)
    │ ├──── lab_orders (encounter_id)
    │ ├──── referrals (source_encounter_id)
    │ └──── bills (encounter_id)
    │
appointments ←── encounters (appointment_id)
```

---

## 3. RLS Policy Coverage

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | Own only | — | Own only | — |
| patients | Own only | — | Own only | — |
| organization_memberships | Own + admin | Admin | — | — |
| encounters | Patient own + org staff | — | Org staff | — |
| prescriptions | Patient + doctor + pharmacy | Doctor | — | — |
| lab_orders | — | — | Lab staff | — |
| lab_reports | Patient own | — | — | — |
| bills | — | — | — | — |
| payments | — | — | — | — |
| audit_logs | Own + admin | Anyone | — | BLOCKED |
| emergency_access_logs | Actor + patient + admin | Actor only | — | — |

> [!WARNING]
> Many tables have `ENABLE ROW LEVEL SECURITY` but NO actual policy rules defined (bills, payments, facilities, departments, etc.). This means with RLS enabled but no policies, these tables would **deny all access** in a real Supabase deployment.

---

## 4. Schema Issues Found

| Issue | Severity | Detail |
|---|---|---|
| `receptionist` missing from SQL enum | MEDIUM | TypeScript has `receptionist` role but SQL `user_role` enum does not |
| Duplicate RLS ENABLE blocks | LOW | Lines 605-619 and 639-657 both enable RLS on same tables |
| Missing RLS policies | HIGH | 21 tables have RLS enabled but no SELECT/INSERT/UPDATE policies |
| No migration system | MEDIUM | Schema is a single SQL file, no versioned migrations |
| 19 stores have no SQL table | HIGH | Queue, waitlist, notifications, catalogs, etc. have no SQL backing |
