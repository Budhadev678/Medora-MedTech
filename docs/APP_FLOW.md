# 🔄 MEDORA — Complete Ecosystem Interaction & Operational Workflows

## 1. Master Patient Outpatient Journey Scenario (Section 72)

```
1. Discovery & Booking
   Rahul Verma (PAT-1001) books Dr. Ananya Sharma (DOC-1001) at City Hospital (HSP-1001)
   ↓ Creates Appointment (APT-1001) with Token #02 in Cardiology OPD

2. Encounter & Consultation
   Rahul checks in → Encounter (ENC-1001) starts in OPD Room 102
   Dr. Ananya conducts Consultation → records Vitals, Chief Complaint, Primary Diagnosis

3. Orders Generation
   ├── Digital Prescription (RX-1001) generated & digitally signed
   └── Lab Order (LAB-ORD-1024) generated for Complete Blood Count (CBC)

4. Diagnostic Investigation
   ABC Diagnostics (LAB-1001) receives LAB-ORD-1024
   → Sample (SMP-1024) collected → Analyzer runs tests → Pathologist certifies Report (RPT-1024)
   → Released immediately to Rahul's Timeline and Dr. Ananya's workspace

5. Prescription Fulfillment
   Rahul chooses ABC Pharmacy (PHA-1001)
   → Pharmacist verifies RX-1001 → Dispenses medication (Dispensing transaction recorded)

6. Transparent Billing ("Why Was I Charged?")
   Hospital generates Bill (BIL-1001):
   - Consultation Fee: ₹500 (Linked to ENC-1001)
   - Diagnostic Pathology: ₹850 (Linked to LAB-ORD-1024)
   - Medications: ₹420 (Linked to RX-1001)
   - Total Gross: ₹1,770

7. Multi-Source Financial Breakdown & Settlement
   - Insurance Pre-Auth Approved: ₹1,200
   - Government Subsidy (BSKY): ₹300
   - Patient Net Payable: ₹270
   - Rahul settles ₹270 via UPI → Receipt (RCP-1001) issued

8. Immutable Audit Trail
   Every step produces an AUDIT record: Actor, Action, Resource, Timestamp, Result: SUCCESS
```

---

## 2. Emergency Trauma & Critical Care Journey Scenario (Section 73)

```
1. Emergency Registration
   Road accident trauma patient arrives at City Hospital Emergency Care
   ↓ Creates Emergency Case (ER-1024) with Triage Level: RED (Critical)

2. Operational Doctor Assignment
   Hospital triage checks available specialists → Assigns Dr. Ananya Sharma & Emergency Trauma Lead

3. Emergency Medical Snapshot Access
   Clinical team requests emergency snapshot (Blood group O+, Penicillin allergy, Emergency Contact)
   → Instant emergency access granted & permanently audited

4. Critical Blood Requirement
   Clinical team identifies need for 2 units O+ PRBC
   → Creates Blood Request (BLD-REQ-1001) → Sent to City Blood Centre (BLC-1001)
   → Blood Centre accepts and dispatches units

5. Inter-Hospital Transfer
   Patient stabilized, requires tertiary catheterization
   → Hospital Transfer requested to Green Care Hospital
   → Ambulance (AMB-1001) dispatched with live pre-alert to destination ICU

6. Longitudinal Timeline & Audit
   All trauma events aggregate in Emergency Timeline and Patient Medical Record
```

---

## 3. Real-World Workspace Resolution Flow (Phase 2.4 Correction)

```
APPLICATION START
        ↓
Check authentication session (Supabase Auth / Session Provider)
        ↓
Resolve authenticated MEDORA identity (PAT-1001, DOC-1001, HSP-1001, CLN-1001, LAB-1001, PHA-1001, GOV-1001, AMB-1001, etc.)
        ↓
Workspace Resolver (resolveWorkspace(user, role)):
        ├── PATIENT → Patient Mobile App (/patient)
        ├── DOCTOR → Doctor Clinical Workspace (/doctor)
        ├── HOSPITAL ADMIN (Hospital) → Hospital Command Center (/hospital)
        ├── HOSPITAL ADMIN (Clinic) → Outpatient Clinic Operations (/clinic)
        ├── LAB STAFF → Laboratory Diagnostic Workbench (/lab)
        ├── PHARMACY STAFF → Pharmacy Dispensing Desk (/pharmacy)
        ├── INSURANCE STAFF → Insurance Claims & Pre-Auth Desk (/insurance)
        ├── GOVERNMENT STAFF → Government Assistance Desk (/government)
        ├── FINANCE STAFF → Healthcare Financing Workspace (/finance)
        ├── AMBULANCE STAFF → Emergency Dispatch Console (/ambulance)
        ├── BLOOD STAFF → Blood Coordination Desk (/blood-bank)
        ├── HEALTHCARE STAFF → Staff Shift Workspace (/staff)
        └── PLATFORM ADMIN → Platform Governance Overview (/admin)
        ↓
Strict RoleGuard Route Protection (Zero fallbacks to Doctor Workspace)
```

---

## 4. Patient Mobile Application Architecture (Phase 2.2)

```
PATIENT PORTAL (/patient)
├── Top Header: MEDORA Brand + Instant Emergency SOS + Notification Bell + Profile Avatar
├── Home Dashboard (/patient)
│   ├── Greeting ("Good morning, [Patient Name]")
│   ├── Digital Health ID Passport Card (MEDORA ID, Blood Group, QR preview)
│   ├── Upcoming Schedule Card (Live OPD Token #, Room #, Doctor name)
│   ├── Quick Action Shortcuts (Appointments, Records, Prescriptions, Lab Reports)
│   ├── Recent Healthcare Activity (Consultation & Lab Report summaries)
│   └── Emergency Assistance Card
├── Bottom Navigation (Fixed thumb-friendly bar)
│   ├── [Home] → /patient
│   ├── [Appointments] → /patient/appointments (Tabs: Upcoming, Past, Cancelled)
│   ├── [Records] → /patient/records (Filters: All, Consultations, Reports, Prescriptions, Emergency)
│   ├── [Emergency] → /patient/emergency (SOS trigger, Blood group, Emergency contacts)
│   └── [More] → /patient/more (Healthcare, Emergency, Account, Support, Sign Out)
└── Sub-Services
    ├── /patient/prescriptions → Structured medication schedule + Verified QR slips
    ├── /patient/reports → NABL-certified pathology reports with physiological reference ranges
    ├── /patient/pharmacy → Open prescription fulfillment & pickup desk
    ├── /patient/bills → Itemized transparent invoices + "Why Was I Charged?" lineage
    ├── /patient/settings → Notifications, Privacy & Security preferences
    ├── /patient/language → Multilingual selector (English, Hindi, Odia)
    ├── /patient/consent → Time-bound record sharing permissions (Phase 15)
    └── /patient/help → National Helpline & FAQs
```

---

## 5. Professional Workspaces Architecture (Phase 2.3 & 2.4)

```
13 REAL-WORLD WORKSPACES
├── 1. Doctor Clinical Workspace (/doctor)
│   └── TopBar: Dr. Ananya Sharma (DOC-1001) + Multi-Hospital Practice Switcher (City Hospital, Green Care Hospital, Green Care Clinic)
│
├── 2. Hospital Command Center (/hospital)
│   └── Operations Overview, Medical Staff Roster & Affiliation Reviews, OPD Queues, Bed Admissions, Trauma Unit, Lineage Invoicing
│
├── 3. Outpatient Clinic Workspace (/clinic)
│   └── Day Clinic Queue, Visiting Specialists, Walk-in OPD Tokens, OPD Billing
│
├── 4. Diagnostic Laboratory Workbench (/lab)
│   └── Test Orders Queue, Specimen Intake & Barcoding, Instrument Worklists, Pathologist Verification, Certified Report Slips
│
├── 5. Pharmacy Dispensing Desk (/pharmacy)
│   └── Prescriptions Intake Queue, Medication Preparation Worktable, Patient Counter Pickup Verification, Dispensing Ledger, Batches
│
├── 6. Insurance & Claims Desk (/insurance)
│   └── Cashless Claims Review Station, Policy Registry, Pre-Auth Approvals, Direct Hospital Settlement Disbursements
│
├── 7. Government Health Assistance Desk (/government)
│   └── State Scheme Administration (BSKY, PM-JAY), Beneficiary Applications, Subsidy Pre-Auth Approvals, Treasury Disbursements
│
├── 8. Healthcare Financing Workspace (/finance)
│   └── CarePay Micro-Financing Applications, Zero-Cost EMI Plans, Multi-Source Split Accounting, Lender Ledger
│
├── 9. Emergency Dispatch Console (/ambulance)
│   └── Road Accident Detection Queue, Live Ambulance Fleet Telemetry, Active Transit Logs, Hospital Emergency Pre-Alerts
│
├── 10. Blood Coordination Desk (/blood-bank)
│   └── Blood Request Queue, PRBC/FFP Component Inventory, Voluntary Donor Registry, Serological Cross-Matching, Cold-Chain Dispatch
│
├── 11. Healthcare Staff Duty Desk (/staff)
│   └── Shift Handover Tasks, Assigned Ward Inpatients, Staff Credentials
│
├── 12. Platform Administration (/admin)
│   └── User Accounts Registry, Organizations & Facilities, Credential Verification Desk, Immutable Append-Only Audit Stream
│
└── 13. Patient Mobile Application (/patient)
    └── Dedicated Mobile-First Consumer Layout with Instant SOS, Bottom Navigation & Zero Enterprise Sidebars
```

---

## 6. Patient Identity, ABHA, Privacy & Access Control Flow (Phase 3)

```
PATIENT ONBOARDING / LOGIN
        ↓
1. Identity & Profile Foundation (/patient/profile)
   ├── Dynamic Profile Completeness Progress (0–100%)
   ├── Personal Demographics (Name, DOB, Gender, Language)
   ├── Residential Address Validation (6-digit Indian PIN)
   ├── Basic Health Profile (Blood Group with Patient vs Certified Source)
   ├── Emergency Contacts (Primary & Alternate)
   └── Identity Rectification (Submit Correction Request → PENDING)

2. National Health Identity (ABDM / ABHA) (/patient/profile/abha)
   ├── Step 1: Verification Method Selection (Aadhaar OTP / Mobile OTP)
   ├── Step 2: Masked Aadhaar Entry + Consent Declaration
   ├── Step 3: 6-Digit OTP Verification (60s cooldown + Demo OTP 123456)
   ├── Step 4: Identity Match Review (EXACT, PARTIAL, MISMATCH)
   ├── Step 5: @abdm Handle Selection & Availability Check
   ├── Step 6: Binding & Digital Health Passport Card
   └── Unlink / Disconnect Management with confirmation barrier

3. Privacy & Access Control Center (/patient/privacy)
   ├── Pending Consent Requests Queue (Allow / Decline)
   ├── Active Permissions (Purpose, Scopes, Expiration, Revoke Access)
   ├── Connected Healthcare Facilities (Active / Ended care relationships)
   ├── Identity Correction Tracker (Status: Pending / Under Review)
   └── Security & Privacy Audit Ledger (Append-only timeline)
```

