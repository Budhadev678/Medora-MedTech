# 🎨 MEDORA — Master UI/UX Philosophy & Interface Standards

## 1. Executive Design Vision

MEDORA is a realistic, dignified, and trustworthy healthcare platform. It connects Patients, Doctors, Hospital Staff, Labs, Pharmacies, Emergency teams, Blood Centers, and Financial desks.

### What MEDORA Is NOT:
- ❌ NOT a colorful student project or Dribbble concept
- ❌ NOT an over-animated AI tech landing page
- ❌ NOT a collection of disjointed screens or isolated mock pages
- ❌ NOT visually cluttered with excessive gradients, glassmorphism, or 3D illustrations

### What MEDORA IS:
- ✅ **Professional & Calm**: Clean white/slate surfaces with purposeful, restrained medical accents.
- ✅ **Connected & Traceable**: Every view clearly indicates *Who, What, Where, When, What's Next, and What Action is needed*.
- ✅ **Accessible & Human-Centric**: High contrast, readable typography scales, clear non-color-dependent status badges, and prominent emergency workflows.
- ✅ **Mobile-First for Patients / High-Density for Staff**: Responsive, touch-friendly layouts for patients; structured, high-efficiency tabular views for clinical and hospital staff.

---

## 2. Core UI Information Hierarchy & Workflow Continuity

Every screen in MEDORA must answer 6 questions without cognitive overload:
1. **WHO** is acting? (Current authenticated persona & role)
2. **WHAT** is the current state? (Clear badge + icon + text)
3. **WHERE** is it happening? (Hospital / Department / Ward / Desk)
4. **WHEN** was it performed? (Timestamp / Elapsed time)
5. **WHAT HAPPENS NEXT?** (Step progression indicator / Stepper)
6. **WHAT ACTION MUST BE TAKEN?** (Primary contextual CTA)

---

## 3. UI Status Communication Rule

**Color alone is never used to communicate state.** Every status token must combine:
$$\text{Status Indicator} = \text{Semantic Color} + \text{Specific Icon} + \text{Clear Text Label}$$

Examples:
* `✓ Report Ready` (Emerald Green + CheckCircle + "Report Ready")
* `⏳ Sample Processing` (Amber + Loader2 + "Sample In Processing")
* `🚨 Critical Triage` (Crimson Red + AlertTriangle + "Immediate Attention Required")
* `ℹ️ Ready for Pickup` (Blue + PackageCheck + "Ready for Pharmacy Pickup")

---

## 4. UI Slices & Vertical Development Strategy

We will build the UI in vertical, connected slices:
1. **Slice 1:** Auth, Role Selection & Responsive Patient Shell
2. **Slice 2:** Doctor Clinical Suite (Queue, Schedule, Patient Record)
3. **Slice 3:** Outpatient Consultation & Structured Prescription Builder
4. **Slice 4:** Connected Lab Workflow (Test Order $\rightarrow$ Sample Collection $\rightarrow$ Verification $\rightarrow$ Report)
5. **Slice 5:** Hospital Pharmacy Queue & Physical Dispense Verification
6. **Slice 6:** Transparent Billing, "Why was I charged?" Traceability & Dispute Drawer
7. **Slice 7:** Emergency Triage Board, Escalation & Blood Matcher
8. **Slice 8:** Unified Healthcare Timeline & Granular Record Sharing
