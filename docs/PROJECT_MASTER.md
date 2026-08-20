# 🏥 MEDORA — Healthcare Ecosystem Master Reference

> **Platform:** MEDORA Connected Healthcare Platform  
> **Status:** Phase 2 Verified (Real-World Role Workspaces, Global Shell, Patient Mobile App & Multi-Role Navigation)  
> **Target:** Nationwide, Transparent, Connected & Auditable Healthcare  

---

## 🌐 1. Platform Vision & Core Principles
MEDORA connects all participants of the healthcare journey into a single, verified, and transparent ecosystem:
- **Core Principle: Role-Specific Workspaces, Not Generic Dashboards**: MEDORA is a real healthcare operating system. Each participant receives a dedicated operational workspace tailored to their daily job (e.g. Doctor Clinical Suite, Hospital Command Center, Clinic Outpatient Desk, Laboratory Workbench, Pharmacy Dispensing Desk, Emergency Dispatch Console, Government Assistance Desk, Insurance Claims Workspace, Staff Duty Desk).
- **Patients:** Mobile-first digital healthcare passport, verified prescriptions, diagnostic history, transparent billing with *"Why Was I Charged?"*, and patient-controlled access.
- **Doctors:** Multi-organization practice management (1 doctor identity practicing across multiple hospitals and clinics), real-time OPD token queue, and digital consultation records.
- **Hospitals:** Operational command center, department management, bed occupancy, doctor roster reviews, and emergency trauma triage.
- **Outpatient Clinics:** Day clinic management, visiting physicians, walk-in OPD token queue, and day receipts.
- **Diagnostic Laboratories:** Sample intake, specimen accessioning, analyzer worklists, and pathologist-certified digital reports.
- **Pharmacies:** Open-fulfillment prescription dispensing desk with batch verification and patient pickup OTP/QR checks.
- **Blood Centres:** Emergency blood cross-matching, compatible donor network, and cold-chain dispatch logistics.
- **Insurance & Payers:** Cashless claims adjudication desk, pre-authorizations, and direct hospital disbursements.
- **Government Assistance:** State & National scheme administration (BSKY, PM-JAY), beneficiary approvals, and treasury fund releases.
- **Healthcare Financing:** Patient treatment micro-financing, zero-cost EMI plans, and transparent multi-source cost splits.
- **Ambulance Services:** Real-time road accident response, fleet GPS telemetry, emergency triage pre-alerts, and hospital transit tracking.
- **Platform Administrators:** Immutable append-only audit ledger and ecosystem credential verification ensuring complete transparency.

---

## 🏛️ 2. Architectural Pillars
1. **Root Identity Anchor:** All sessions derive strictly from Supabase Auth `auth.uid()`.
2. **Decoupled Roles & Affiliations:** Doctors and staff are independent professionals who link to organizations via `doctor_affiliations` and `staff_memberships`.
3. **Dedicated Real-World Workspaces:** Centralized workspace resolver evaluates `(Identity + Role + Organization + Permissions)` to select the authentic workspace with zero fallbacks to Doctor or generic dashboards.
4. **Open Prescription Fulfillment:** Prescriptions exist independently of retail fulfillment, allowing patients to choose any connected hospital or independent pharmacy.
5. **Row-Level Security (RLS):** Private medical and operational records are strictly isolated across accounts and organizations at the database layer.
