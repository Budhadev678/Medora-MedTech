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

## 3. Global Application Shell & Role Routing Flow (Phase 2.1)

```
APPLICATION START
        ↓
Check authentication session (Supabase Auth / Session Provider)
        ↓
No authenticated session?
        ↓
PUBLIC ROUTES (Landing, Login, Register, QR Verification Slips)

OR

Authenticated session
        ↓
Resolve authenticated MEDORA identity (PAT-1001, DOC-1001, HSP-1001, LAB-1001, etc.)
        ↓
Determine Role-Aware Layout Shell:
        ├── PATIENT ROLE (PAT-1001 / PAT-1002 / PAT-1003):
        │   └── PatientShell (Mobile-first app layout, Header with SOS + Notifications, Bottom Nav: Home, Appointments, Records, More Drawer)
        │
        └── PROFESSIONAL ROLES (Doctor, Hospital, Clinic, Lab, Pharmacy, Insurance, Staff, Admin):
            └── ProfessionalShell (TopBar with OrganizationSwitcher + UserMenu, Collapsible Sidebar, Responsive Drawer, max-w-7xl content area)
        ↓
Role Guard Route Enforcement:
        ├── Direct URL access to unauthorized role route → Access Restricted barrier + Safe Return
        └── Session logout → Complete memory and state flush → Redirect to /login
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

## 5. Professional Workspaces Architecture (Phase 2.3)

```
PROFESSIONAL WORKSPACES
├── Doctor Clinical Workspace (/doctor)
│   ├── TopBar: Dr. Ananya Sharma (DOC-1001) + Practice Switcher (City Hospital, Green Care Hospital, Green Care Clinic)
│   ├── Dashboard (/doctor) → Clinical overview, today's schedule, pending tasks
│   ├── Patients (/doctor/patients) → Patient registry with consent-controlled access
│   ├── Appointments (/doctor/appointments) → Outpatient consultation calendar
│   ├── Schedule (/doctor/schedule) → Multi-hospital practice hours & room assignments
│   ├── Consultations (/doctor/consultations) → Clinical encounter suite (Phase 7)
│   ├── Prescriptions (/doctor/prescriptions) → Digital Rx authoring & signature
│   ├── Lab Orders (/doctor/lab-orders) → Investigation requests & report review
│   ├── Referrals (/doctor/referrals) → Specialist referral network
│   ├── Profile (/doctor/profile) → Medical council credentials & active affiliations
│   └── Settings (/doctor/settings) → Workspace preferences
│
├── Hospital Command Center (/hospital)
│   ├── Operations Overview (/hospital) → Bed occupancy, OPD queues, trauma readiness
│   ├── Patients (/hospital/patients) → Inpatient/outpatient directory
│   ├── Doctors (/hospital/doctors) → Medical staff roster & affiliation approval desk
│   ├── Departments (/hospital/departments) → Clinical department capacities
│   ├── Appointments (/hospital/appointments) → Central OPD queue & token dispenser
│   ├── Admissions (/hospital/admissions) → Inpatient bed occupancy (Phase 5)
│   ├── Emergency (/hospital/emergency) → Trauma unit & specialist escalation (Phase 13)
│   ├── Laboratory (/hospital/laboratory) → Hospital diagnostic lab desk
│   ├── Pharmacy (/hospital/pharmacy) → Hospital pharmacy dispensing desk
│   ├── Billing (/hospital/billing) → Lineage-backed hospital invoices
│   ├── Insurance (/hospital/insurance) → Cashless insurance pre-auth desk
│   ├── Staff (/hospital/staff) → Clinical staff appointments & rotas
│   └── Settings (/hospital/settings) → Facility license & multi-branch settings
│
├── Outpatient Clinic Workspace (/clinic)
│   ├── OPD Operations (/clinic) → Day clinic queue & room allocation
│   ├── Consulting Doctors (/hospital/doctors) → General physicians & visiting specialists
│   └── OPD Invoicing (/hospital/billing) → Transparent outpatient billing
│
├── Diagnostic Laboratory (/lab)
│   ├── Lab Overview (/lab) → Sample intake, instrument queues, report approvals
│   ├── Orders (/lab/orders) → Test orders queue
│   ├── Samples (/lab/samples) → Specimen accessioning & barcoding (Phase 8)
│   ├── Testing (/lab/testing) → Analyzer worklist & value entry
│   ├── Verification (/lab/verification) → Pathologist sign-off & digital signature
│   ├── Reports (/lab/reports) → Released NABL pathology reports archive
│   ├── Staff (/lab/staff) → Pathologist & technician roster
│   └── Settings (/lab/settings) → NABL accreditation settings
│
├── Pharmacy Dispensing Desk (/pharmacy)
│   ├── Overview (/pharmacy) → Incoming prescriptions & preparation worktable
│   ├── Prescriptions (/pharmacy/prescriptions) → Prescription intake queue
│   ├── Orders (/pharmacy/orders) → Packaging worklist
│   ├── Preparation (/pharmacy/preparation) → Batch verification & labels
│   ├── Pickup (/pharmacy/pickup) → Patient counter pickup OTP/QR check
│   ├── Dispensing (/pharmacy/dispensing) → Authoritative dispensing ledger
│   ├── Inventory (/pharmacy/inventory) → Medication stock & batches
│   ├── Staff (/pharmacy/staff) → Registered pharmacist roster
│   └── Settings (/pharmacy/settings) → Retail drug license
│
├── Insurance & Payer Portal (/insurance)
│   ├── Overview (/insurance) → Cashless claims, pre-auths, disbursements
│   ├── Policies (/insurance/policies) → Policyholder coverage registry (Phase 12)
│   ├── Claims (/insurance/claims) → Cashless claims adjudication desk
│   ├── Review (/insurance/review) → Medical officer pre-auth station
│   ├── Approvals (/insurance/approvals) → Decision vouchers & deductions
│   ├── Payments (/insurance/payments) → Direct hospital settlement disbursements
│   └── Settings (/insurance/settings) → IRDAI settings
│
└── Staff Shift Workspace (/staff)
    ├── Overview (/staff) → Active department appointment & duty tasks
    ├── Tasks (/staff/tasks) → Clinical handover & vitals rounds
    ├── Patients (/staff/patients) → Assigned ward inpatients
    └── Profile (/staff/profile) → Staff credentials & ID badge
```
