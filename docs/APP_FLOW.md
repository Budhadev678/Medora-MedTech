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

## 3. Real-World Workspace Resolution Flow (Phase A.4 Correction)

```
AUTHENTICATED USER
        ↓
IDENTITY RESOLUTION
        ↓
ORGANIZATION MEMBERSHIPS LOOKUP
        ↓
ACTIVE CONTEXT SELECTION (Default: Primary Active Membership / Context Switcher)
        ↓
CONTEXTUAL ROLE RESOLUTION
        ↓
ROLE-TO-PERMISSION EVALUATION (AuthorizationEngine)
        ↓
WORKSPACE ASSIGNMENT (resolveWorkspace(user, activeMembership, role)):
        ├── PATIENT (Sovereign) → Patient Mobile App (/patient)
        │       ├── Bottom Navigation: Home, Appointments, Health, More
        │       └── Welfare & Financial Services: /patient/insurance, /patient/government, /patient/finance
        ├── DOCTOR (Clinician) → Doctor Clinical Workspace (/doctor)
        │       └── Header Context: Active Hospital/Clinic Switcher
        ├── RECEPTIONIST (Front Desk) → Reception Workspace (/reception)
        │       └── Queue Dispatch & Patient Check-in Desk
        ├── NURSE (Clinical Care) → Nursing Care Workspace (/nurse)
        │       └── Inpatient Ward Vitals & Task Monitoring
        ├── HOSPITAL ADMIN (Hospital) → Hospital Command Center (/hospital)
        ├── CLINIC ADMIN (Clinic) → Outpatient Clinic Operations (/clinic)
        ├── LAB STAFF (Diagnostics) → Laboratory Diagnostic Workbench (/lab)
        ├── PHARMACY STAFF (Dispensing) → Pharmacy Dispensing Desk (/pharmacy)
        ├── BLOOD STAFF (Emergency) → Blood Coordination Desk (/blood-bank)
        └── PLATFORM ADMIN (Governance) → Medora Platform Governance (/admin)
        ↓
SCOPED DATA LOADING (Zero cross-facility or cross-patient leakage)
        ↓
Strict RoleGuard Route Protection & Access Restricted Interception
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

4. Unified Patient Health Journey & Continuity (/patient/health)
   ├── View Mode 1: Chronological Care Stream
   │   ├── Upcoming Care & Appointments Section (Future-dated events)
   │   ├── Today's Healthcare Activity Section (Live consultation, tests, prescriptions)
   │   └── Historical Care Trajectory Section (Grouped by date)
   ├── View Mode 2: Encounter Clinical Bundles
   │   ├── Consultation Visit Header (Doctor, Facility, Department, Timestamp)
   │   ├── Clinical Assessment & Diagnoses (Doctor authored)
   │   ├── Prescribed Regimen (Medicine names, dosages, instructions)
   │   ├── Diagnostic Lab Orders & Certified Released Reports
   │   └── Care Orders & Recommendations (Imaging, Referrals, Follow-ups)
   ├── Top Structured Health Facts Ribbon (Active Regimen, Allergies, Recent Reports, Upcoming Care)
   ├── Multi-Dimensional Filtering & Search (Category pills, Date range, Facility, Full-text search)
   └── Secure Document Vault Integration (/patient/documents)

5. Doctor Consultation Continuity Workspace (/doctor/consultations/[id])
   ├── Current Consultation Encounter Badge (ENC-xxxx, ACTIVE/IN_CONSULTATION)
   ├── Patient Profile & Known Allergies Safety Banner
   ├── Clinical Documentation Form (Chief complaint, Symptoms, Vitals, Assessment, Diagnoses, Treatment plan)
   ├── Order Composers (Prescriptions, Diagnostic Labs, Imaging, Specialty Referrals)
   ├── Clinical Continuity Sidebar (Previous consultations, active prescriptions, recent released lab reports)
   └── Full Patient Timeline Drawer (Modal stream with search and category filters without losing unsaved draft)

6. Healthcare Organization & Facility Governance Workflows
   ├── Organization Entity Registry (/admin/organizations)
   │   ├── Organization Listing (Legal name, identifier, type, location, status)
   │   ├── Register Organization Modal (Form validation, license, contact, address)
   │   ├── Direct drilldown to connected facility campuses (?orgId=xxxx)
   │   └── Safe Administrative Deactivation (Soft status update with audit logging)
   ├── Multi-Branch Facilities & Campuses Desk (/admin/facilities)
   │   ├── Facility Listing (Campus name, code, parent org, city, status)
   │   ├── Register Facility Branch Modal (Parent organization picker, operating hours, coordinates)
   │   └── Dynamic Department, Doctor & Service Aggregations
   ├── Clinical Department Management Desk (/hospital/departments)
   │   ├── Department Grid (Active/Inactive units, codes, head of department)
   │   ├── Add/Edit Department Modal (Name, code, description, head doctor)
   │   └── Live Doctor & Service counts per unit
   ├── Healthcare Services Catalog & Assignments (/hospital/services)
   │   ├── Services Catalog (Consultations, Diagnostics, Imaging, Procedures, Emergency)
   │   ├── Add Service Modal (Department link or facility-wide, base fee, duration)
   │   └── Assign Doctor to Service Modal (Link affiliated practitioner to service offering)
   ├── Medical Staff Roster & Affiliation Management (/hospital/doctors)
   │   ├── Pending Doctor Affiliation Requests Queue (Approve / Reject)
   │   ├── Active Verified Medical Practitioners (Specialization, department, room, fee)
   │   ├── Connect / Invite Doctor Modal (Role designation, fee, room, department)
   │   └── End Doctor Affiliation (Preserves all historical encounters and orders)
   ├── Operational Staff Personnel Workspace (/hospital/staff)
   │   ├── Staff Personnel Roster (Receptionists, Nurses, Lab techs, Pharmacists, Admins)
   │   └── Register Staff Member Modal (Role category, department link, phone, email)
   └── Outpatient Clinic Operations Workspace (/clinic)
       ├── Connected Facility Overview (Green Care Clinic FAC-2001)
       ├── Live OPD Doctor and Service counts
       └── Quick navigation to Clinic Doctors, Services, and Departments

7. Appointment Discovery, Doctor-First Booking & Queue Operations (Phase 6.1 & 6.2)
   ├── Patient Booking Wizard (/patient/appointments/book)
   │   ├── Mode 1: Doctor-First Discovery
   │   │   ├── Search clinician by name or specialty across network
   │   │   ├── Discovers clinician's multi-facility footprint under ONE identity (e.g. City Hospital @ ₹500, Green Care @ ₹600)
   │   │   ├── Doctor Preference Mode Toggle: "Same doctor only" vs "Prefer this doctor"
   │   │   └── View 7-day session availability with configured capacity
   │   ├── Mode 2: Facility-First Discovery
   │   │   ├── Select hospital campus or clinic branch
   │   │   ├── Filter by clinical department and catalog service
   │   │   └── Browse available practicing specialists and session times
   │   ├── Mode 3: Service-First Discovery
   │   │   ├── Search medical catalog (e.g. Cardiology Consultation, ECG, Ultrasound)
   │   │   ├── Locate all facilities offering the selected service
   │   │   └── Select affiliated clinician and working session
   │   ├── Session Capacity Validation & Overbooking Protection
   │   ├── 5-Tier Explainable Alternative Recommendations when session is full
   │   └── Waitlist Registration & Explicit Slot Offer Acceptance (2-Hour Window)
   │
   ├── Patient Appointment & Active Token View (/patient/appointments)
   │   ├── Confirmed Upcoming Bookings (Date, Session, Doctor, Facility, Room)
   │   ├── Self-Service Mobile Check-in (Enabled on appointment date)
   │   ├── Live Token Card (Token #C-01, Status: WAITING/CALLED/IN_CONSULTATION)
   │   └── Dynamic Waiting Time Range (e.g. "Estimated: 20–35 min")
   │
   ├── Hospital Reception Check-in Desk (/reception)
   │   ├── Daily Scheduled Appointments Queue
   │   ├── Front-Desk Check-in Action (Generates sequential token)
   │   ├── Direct Walk-in Registration (Assigns token & enters queue)
   │   └── Real-time Session Capacity & Waiting Roster
   │
   └── Doctor Active Queue Management (/doctor/consultations)
       ├── Session-Scoped Patient Queue (Sorted by sequential token)
       ├── "Call Next Patient" Action (Transitions patient to CALLED)
       ├── "Start Consultation" Action (Transitions to IN_CONSULTATION; enforces max 1 active per doctor)
       ├── "Complete Consultation" Action (Transitions to COMPLETED + C.1 Clinical Encounter handoff)
       ├── Missing Patient "Skip" Action (Transitions to SKIPPED with documented reason)
       └── "Recall Patient" Action (Reinstates patient to CALLED when returned)
