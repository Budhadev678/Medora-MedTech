# 📄 MEDORA Phase 10.2 Documentation

## Financial Coverage Waterfall, Insurance, Assistance & Patient Responsibility

**Master Phase**: PHASE 10 — Itemized Billing & Financial Transparency  
**Current Sub-Phase**: PHASE 10.2  
**Status**: `COMPLETED & 100% VERIFIED`  
**Test Suite Pass**: 13/13 Assertions Passed (100%)

---

## 1. Executive Summary

Phase 10.2 builds the financial coverage and assistance layer on top of Phase 10.1. Its core rule is that original service charges (gross total) are never altered or hidden; coverage, discounts, and assistance are maintained as distinct financial allocations.

### Key Capabilities Built
- **Original Charge Protection**:
  - Original gross service charges remain untouched (e.g. MRI = ₹12,000). Coverage and assistance are stored as separate financial allocations.
- **Strict State Separation**:
  - `REQUESTED` $\neq$ `APPROVED` $\neq$ `ALLOCATED` $\neq$ `RECEIVED/SETTLED`.
  - Distinguishes between requested claims, approved amounts, and actual received cash flow.
- **Financial Waterfall Engine**:
  - `GROSS CHARGES` $\rightarrow$ `DISCOUNTS` $\rightarrow$ `NET BILLABLE AMOUNT` $\rightarrow$ `INSURANCE` $\rightarrow$ `GOVERNMENT ASSISTANCE` $\rightarrow$ `HOSPITAL ASSISTANCE` $\rightarrow$ `CHARITY` $\rightarrow$ `FINANCING` $\rightarrow$ `PATIENT RESPONSIBILITY`.
- **Multi-Channel Financial Coverage**:
  - **Discounts (`DISC-xxxx`)**: Authorized hospital, promotional, or contractual discounts with reason logging.
  - **Insurance Allocations (`COVERAGE-xxxx`)**: Policy linkage, requested vs approved vs received amounts, deductible & co-pay tracking.
  - **Government Assistance (`GOVT-xxxx`)**: Scheme linkage (BSKY, PM-JAY) with approval and settlement status.
  - **Hospital & Charity Relief (`HOSP-ASSIST-xxxx`, `CHARITY-xxxx`)**: Staff authorization, relief fund program tracking.
  - **Partner Financing (`FIN-xxxx`)**: Micro-financing (e.g. CarePay) tracked as financing (NOT discount), showing approved vs disbursed state.
- **Patient Consoles**:
  - Patient Mobile Billing Dashboard ([`/patient/billing`](file:///c:/Users/Dell/Downloads/Medora-MedTech/app/patient/billing/page.tsx)) and Interactive Bill Detail with "Why Was I Charged?" Provenance Modal ([`/patient/billing/[billId]`](file:///c:/Users/Dell/Downloads/Medora-MedTech/app/patient/billing/[billId]/page.tsx)).

---

## 2. Technical Architecture & File Map

| Component | File Path | Description |
| :--- | :--- | :--- |
| **Types** | [`types/database.types.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/types/database.types.ts) | Discount, coverage, assistance, financing & waterfall interfaces |
| **Coverage Store** | [`lib/data/financial-coverage-store.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/lib/data/financial-coverage-store.ts) | Repository for discounts, insurance, assistance, charity & financing |
| **Domain Service** | [`lib/services/financial-coverage-service.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/lib/services/financial-coverage-service.ts) | Server-authoritative financial waterfall engine & coverage calculator |
| **Patient Dashboard** | [`app/patient/billing/page.tsx`](file:///c:/Users/Dell/Downloads/Medora-MedTech/app/patient/billing/page.tsx) | Patient Mobile Billing Dashboard |
| **Patient Bill Detail**| [`app/patient/billing/[billId]/page.tsx`](file:///c:/Users/Dell/Downloads/Medora-MedTech/app/patient/billing/[billId]/page.tsx) | Interactive Bill Detail, Provenance Modal & Financial Waterfall |
| **Test Suite** | [`scripts/test-phase-10-2-coverage-assistance.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/scripts/test-phase-10-2-coverage-assistance.ts) | Automated Phase 10.2 test suite (13/13 passed) |

---
