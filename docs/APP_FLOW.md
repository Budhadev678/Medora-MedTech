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
