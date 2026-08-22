# 📄 MEDORA — Sub-Phase 7.3 Technical Specification

## Clinical Orders, Laboratory Order Foundation, Referral Workflow & Follow-Up Recommendation

**Sub-Phase**: 7.3  
**Master Phase**: Phase 7 — Digital Consultation & Prescription  
**Status**: `VERIFIED`  

---

## 1. Executive Summary & Domain Scope

Sub-Phase 7.3 completes MEDORA's **Clinical Orders & Recommendations Engine**, empowering clinicians to order diagnostic lab tests, issue specialty referrals, and record follow-up recommendations within an active clinical encounter.

```
                                    CLINICAL ENCOUNTER WORKSPACE
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                ▼                                 ▼                                 ▼
         LABORATORY ORDERS                   REFERRALS                 FOLLOW-UP RECOMMENDATIONS
         (Phase 7.3)                        (Phase 7.3)                       (Phase 7.3)
         • ID: LAB-ORD-1001                 • ID: REF-1001                    • ID: FU-1001
         • Selected Tests (CBC, Lipid)      • Destination Specialty / Doctor  • Recommended Timeframe
         • Status: DRAFT -> FINALIZED       • Status: DRAFT -> FINALIZED      • Links to Phase 6 Appointment
         • Handoff: LAB_ORDER_FINALIZED     • Handoff: Future Care            • Status: RECOMMENDED -> BOOKED
```

> [!IMPORTANT]
> **Strict Operational Boundaries**:
> - **Lab Orders $\neq$ Lab Results**: Phase 7.3 creates clinical orders. Sample collection, testing, result entry, and report verification belong to Phase 8.
> - **Referrals $\neq$ Auto-Booked Appointments**: Referrals record clinical evaluation requests without forcing automatic appointment creation.
> - **Follow-up $\neq$ Parallel Booking Engine**: Recommended follow-ups link directly into Phase 6 appointment booking.

---

## 2. Key Architecture & Workflows

1. **Laboratory Orders (`LAB-ORD-xxxx`)**:
   - `LabOrderService.saveDraft(encounterId, data, actor)`
   - `LabOrderService.finalizeLabOrder(encounterId, data, actor)`: Emits Phase 8 handoff payload (`LAB_ORDER_FINALIZED`) with stable idempotency key (`HANDSHAKE-LAB-xxxx`).
   - `LabOrderService.cancelLabOrder(orderId, reason, actor)`

2. **Specialty Referrals (`REF-xxxx`)**:
   - `ReferralService.saveDraft(encounterId, data, actor)`
   - `ReferralService.finalizeReferral(encounterId, data, actor)`
   - Destination types: `SPECIALTY`, `DOCTOR`, `FACILITY`, `DEPARTMENT`.

3. **Follow-Up Recommendations (`FU-xxxx`)**:
   - `FollowUpService.createRecommendation(encounterId, data, actor)`
   - Timeframe types: `DAYS`, `WEEKS`, `MONTHS`, `SPECIFIC_DATE`.
   - `FollowUpService.linkAppointment(followupId, appointmentId, actor)`: Links Phase 6 appointment upon booking.

---

## 3. Verification Results

- **Dedicated Test Suite**: `scripts/test-phase-7-3-lab-referral-followup.ts`
- **Result**: **40 / 40 assertions passed (100%)**
