# 🏥 MEDORA — Healthcare Ecosystem Master Reference

> **Platform:** MEDORA Connected Healthcare Platform  
> **Status:** Phase 1 Verified (Auth, Identity, Multi-Organization & Security Foundation)  
> **Target:** Nationwide, Transparent, Connected & Auditable Healthcare  

---

## 🌐 1. Platform Vision
MEDORA connects all participants of the healthcare journey into a single, verified, and transparent ecosystem:
- **Patients:** Mobile-first digital healthcare passport, verified prescriptions, diagnostic history, and patient-controlled access.
- **Doctors:** Multi-organization practice management (1 doctor identity across multiple hospitals and clinics), real-time queue, and digital clinical records.
- **Hospitals & Clinics:** Department management, bed capacity, clinical command center, and doctor affiliations.
- **Diagnostic Laboratories:** Sample intake, automated analysis values, and pathologist-certified digital reports.
- **Pharmacies:** Open-fulfillment prescription dispensing desk with Medora ID verification.
- **Blood Centres:** Emergency blood grouping, donor matching, and critical supply alerts.
- **Insurance & Financing:** Transparent itemized billing, pre-authorizations, and government assistance split.
- **Ambulance Services:** Emergency triage pre-alerts and hospital transit tracking.
- **Auditors & Administrators:** Immutable append-only audit ledger ensuring complete transparency.

---

## 🏛️ 2. Architectural Pillars
1. **Root Identity Anchor:** All sessions derive strictly from Supabase Auth `auth.uid()`.
2. **Decoupled Roles & Affiliations:** Doctors and staff are independent professionals who link to organizations via `doctor_affiliations` and `staff_memberships`.
3. **Open Prescription Fulfillment:** Prescriptions exist independently of retail fulfillment, allowing patients to choose their pharmacy of choice.
4. **Row-Level Security (RLS):** Private medical records are inaccessible across accounts at the database layer.
