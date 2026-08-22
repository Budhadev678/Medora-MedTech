# MEDORA — S1 ROUTE REGISTRY
## Stabilization Track — S1 Document 2 of 15

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Date**: August 2026  
**Status**: VERIFIED AUDIT — 142 PAGES ENUMERATED

---

## 1. Authentication Routes (Phase 1)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 1 | `/login` | (auth)/login/page.tsx | 339 | 1 | FUNCTIONAL |
| 2 | `/register` | (auth)/register/page.tsx | 579 | 1 | FUNCTIONAL |

---

## 2. Patient Portal Routes (Phase 2–10)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 3 | `/patient` | patient/page.tsx | 303 | 2 | FUNCTIONAL — Dashboard |
| 4 | `/patient/appointments` | patient/appointments/page.tsx | 261 | 6 | FUNCTIONAL — List |
| 5 | `/patient/appointments/book` | patient/appointments/book/page.tsx | 974 | 6 | FUNCTIONAL — Booking |
| 6 | `/patient/health` | patient/health/page.tsx | 869 | 3 | FUNCTIONAL — Timeline |
| 7 | `/patient/profile` | patient/profile/page.tsx | 1127 | 3 | FUNCTIONAL — Full Profile |
| 8 | `/patient/profile/abha` | patient/profile/abha/page.tsx | 702 | 3 | FUNCTIONAL — ABHA Link |
| 9 | `/patient/documents` | patient/documents/page.tsx | 552 | 7 | FUNCTIONAL — Doc Vault |
| 10 | `/patient/prescriptions` | patient/prescriptions/page.tsx | 236 | 7 | FUNCTIONAL — Rx List |
| 11 | `/patient/lab` | patient/lab/page.tsx | 26 | 8 | STUB — EmptyState |
| 12 | `/patient/pharmacy` | patient/pharmacy/page.tsx | 26 | 9 | STUB — EmptyState |
| 13 | `/patient/pharmacy/select` | patient/pharmacy/select/page.tsx | 236 | 9 | FUNCTIONAL |
| 14 | `/patient/pharmacy/dispensing` | patient/pharmacy/dispensing/page.tsx | 104 | 9 | FUNCTIONAL |
| 15 | `/patient/pharmacy/orders/[orderId]` | patient/pharmacy/orders/[orderId]/page.tsx | 104 | 9 | FUNCTIONAL |
| 16 | `/patient/billing` | patient/billing/page.tsx | 96 | 10 | FUNCTIONAL — Bill List |
| 17 | `/patient/billing/[billId]` | patient/billing/[billId]/page.tsx | 93 | 10 | FUNCTIONAL — Detail |
| 18 | `/patient/billing/payments` | patient/billing/payments/page.tsx | 93 | 10 | FUNCTIONAL |
| 19 | `/patient/billing/disputes` | patient/billing/disputes/page.tsx | 187 | 10 | FUNCTIONAL |
| 20 | `/patient/bills` | patient/bills/page.tsx | 87 | 10 | FUNCTIONAL — Alt Entry |
| 21 | `/patient/records` | patient/records/page.tsx | 453 | 7 | FUNCTIONAL — Clinical |
| 22 | `/patient/reports` | patient/reports/page.tsx | 232 | 8 | FUNCTIONAL — Lab Reports |
| 23 | `/patient/care` | patient/care/page.tsx | 212 | 7 | FUNCTIONAL |
| 24 | `/patient/consent` | patient/consent/page.tsx | 26 | 3 | STUB — EmptyState |
| 25 | `/patient/emergency` | patient/emergency/page.tsx | 138 | 3 | FUNCTIONAL — SOS |
| 26 | `/patient/privacy` | patient/privacy/page.tsx | 728 | 3 | FUNCTIONAL |
| 27 | `/patient/insurance` | patient/insurance/page.tsx | 137 | 10 | FUNCTIONAL |
| 28 | `/patient/government` | patient/government/page.tsx | 118 | 10 | FUNCTIONAL |
| 29 | `/patient/finance` | patient/finance/page.tsx | 123 | 10 | FUNCTIONAL |
| 30 | `/patient/notifications` | patient/notifications/page.tsx | 119 | 2 | FUNCTIONAL |
| 31 | `/patient/more` | patient/more/page.tsx | 138 | 2 | FUNCTIONAL — Nav Drawer |
| 32 | `/patient/settings` | patient/settings/page.tsx | 110 | 2 | FUNCTIONAL |
| 33 | `/patient/help` | patient/help/page.tsx | 63 | 2 | FUNCTIONAL |
| 34 | `/patient/language` | patient/language/page.tsx | 64 | 2 | FUNCTIONAL |

---

## 3. Doctor Workspace Routes (Phase 4, 7)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 35 | `/doctor` | doctor/page.tsx | 665 | 4 | FUNCTIONAL — Dashboard |
| 36 | `/doctor/consultations` | doctor/consultations/page.tsx | 1392 | 7 | FUNCTIONAL — Suite |
| 37 | `/doctor/consultations/[id]` | doctor/consultations/[id]/page.tsx | 1392 | 7 | FUNCTIONAL — Active |
| 38 | `/doctor/appointments` | doctor/appointments/page.tsx | 194 | 6 | FUNCTIONAL |
| 39 | `/doctor/patients` | doctor/patients/page.tsx | 178 | 7 | FUNCTIONAL |
| 40 | `/doctor/prescriptions` | doctor/prescriptions/page.tsx | 466 | 7 | FUNCTIONAL |
| 41 | `/doctor/lab-orders` | doctor/lab-orders/page.tsx | 479 | 8 | FUNCTIONAL |
| 42 | `/doctor/schedule` | doctor/schedule/page.tsx | 427 | 4 | FUNCTIONAL |
| 43 | `/doctor/referrals` | doctor/referrals/page.tsx | 199 | 7 | FUNCTIONAL |
| 44 | `/doctor/profile` | doctor/profile/page.tsx | 98 | 4 | FUNCTIONAL |
| 45 | `/doctor/settings` | doctor/settings/page.tsx | 44 | 2 | STUB — Settings |

---

## 4. Reception Routes (Phase 6)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 46 | `/reception` | reception/page.tsx | 239 | 6 | FUNCTIONAL — Dashboard |
| 47 | `/reception/appointments` | reception/appointments/page.tsx | 347 | 6 | FUNCTIONAL |
| 48 | `/reception/checkin` | reception/checkin/page.tsx | 458 | 6 | FUNCTIONAL |

---

## 5. Hospital Admin Routes (Phase 5)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 49 | `/hospital` | hospital/page.tsx | 816 | 5 | FUNCTIONAL — Command |
| 50 | `/hospital/departments` | hospital/departments/page.tsx | 458 | 5 | FUNCTIONAL |
| 51 | `/hospital/doctors` | hospital/doctors/page.tsx | 567 | 5 | FUNCTIONAL |
| 52 | `/hospital/staff` | hospital/staff/page.tsx | 519 | 5 | FUNCTIONAL |
| 53 | `/hospital/services` | hospital/services/page.tsx | 639 | 5 | FUNCTIONAL |
| 54 | `/hospital/appointments` | hospital/appointments/page.tsx | 26 | 6 | STUB |
| 55 | `/hospital/admissions` | hospital/admissions/page.tsx | 26 | 5 | STUB |
| 56 | `/hospital/encounters` | hospital/encounters/page.tsx | 251 | 7 | FUNCTIONAL |
| 57 | `/hospital/patients` | hospital/patients/page.tsx | 26 | 5 | STUB |
| 58 | `/hospital/billing` | hospital/billing/page.tsx | 175 | 10 | FUNCTIONAL |
| 59 | `/hospital/billing/[billId]` | hospital/billing/[billId]/page.tsx | 207 | 10 | FUNCTIONAL |
| 60 | `/hospital/billing/payments` | hospital/billing/payments/page.tsx | 207 | 10 | FUNCTIONAL |
| 61 | `/hospital/finance/reconciliation` | hospital/finance/reconciliation/page.tsx | 152 | 10 | FUNCTIONAL |
| 62 | `/hospital/finance/disputes` | hospital/finance/disputes/page.tsx | 175 | 10 | FUNCTIONAL |
| 63 | `/hospital/laboratory` | hospital/laboratory/page.tsx | 26 | 8 | STUB |
| 64 | `/hospital/pharmacy` | hospital/pharmacy/page.tsx | 26 | 9 | STUB |
| 65 | `/hospital/insurance` | hospital/insurance/page.tsx | 26 | 5 | STUB |
| 66 | `/hospital/emergency` | hospital/emergency/page.tsx | 26 | 5 | STUB |
| 67 | `/hospital/settings` | hospital/settings/page.tsx | 44 | 5 | STUB — Settings |

---

## 6. Laboratory Routes (Phase 8)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 68 | `/lab` | lab/page.tsx | 1144 | 8 | FUNCTIONAL — Work Queue |
| 69 | `/lab/orders` | lab/orders/page.tsx | 169 | 8 | FUNCTIONAL |
| 70 | `/lab/orders/[id]` | lab/orders/[id]/page.tsx | 169 | 8 | FUNCTIONAL |
| 71 | `/lab/samples` | lab/samples/page.tsx | 26 | 8 | STUB |
| 72 | `/lab/samples/[id]` | lab/samples/[id]/page.tsx | 26 | 8 | STUB (BUT nav links to /lab/samples/SMP-1001) |
| 73 | `/lab/testing` | lab/testing/page.tsx | 162 | 8 | FUNCTIONAL |
| 74 | `/lab/testing/[testWorkId]` | lab/testing/[testWorkId]/page.tsx | 162 | 8 | FUNCTIONAL |
| 75 | `/lab/verification` | lab/verification/page.tsx | 268 | 8 | FUNCTIONAL |
| 76 | `/lab/reports` | lab/reports/page.tsx | 62 | 8 | FUNCTIONAL |
| 77 | `/lab/staff` | lab/staff/page.tsx | 49 | 8 | STUB |
| 78 | `/lab/settings` | lab/settings/page.tsx | 44 | 8 | STUB — Settings |

---

## 7. Pharmacy Routes (Phase 9)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 79 | `/pharmacy` | pharmacy/page.tsx | 167 | 9 | FUNCTIONAL — Queue |
| 80 | `/pharmacy/prescriptions` | pharmacy/prescriptions/page.tsx | 164 | 9 | FUNCTIONAL |
| 81 | `/pharmacy/prescriptions/[intakeId]` | pharmacy/prescriptions/[intakeId]/page.tsx | 164 | 9 | FUNCTIONAL |
| 82 | `/pharmacy/inventory` | pharmacy/inventory/page.tsx | 180 | 9 | FUNCTIONAL |
| 83 | `/pharmacy/orders` | pharmacy/orders/page.tsx | 168 | 9 | FUNCTIONAL |
| 84 | `/pharmacy/orders/[orderId]` | pharmacy/orders/[orderId]/page.tsx | 168 | 9 | FUNCTIONAL |
| 85 | `/pharmacy/dispensing` | pharmacy/dispensing/page.tsx | 26 | 9 | STUB |
| 86 | `/pharmacy/pickup` | pharmacy/pickup/page.tsx | 26 | 9 | STUB |
| 87 | `/pharmacy/preparation` | pharmacy/preparation/page.tsx | 26 | 9 | STUB |
| 88 | `/pharmacy/staff` | pharmacy/staff/page.tsx | 49 | 9 | STUB |
| 89 | `/pharmacy/settings` | pharmacy/settings/page.tsx | 44 | 9 | STUB — Settings |

---

## 8. Queue Routes (Phase 6)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 90 | `/queue` | queue/page.tsx | 223 | 6 | FUNCTIONAL |
| 91 | `/queue/display` | queue/display/page.tsx | 221 | 6 | FUNCTIONAL — Public TV |

---

## 9. Clinic Routes (Phase 5)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 92 | `/clinic` | clinic/page.tsx | 184 | 5 | FUNCTIONAL |
| 93 | `/clinic/encounters` | clinic/encounters/page.tsx | 138 | 7 | FUNCTIONAL |

---

## 10. Admin Routes (Phase 2)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 94 | `/admin` | admin/page.tsx | 146 | 2 | FUNCTIONAL — Dashboard |
| 95 | `/admin/organizations` | admin/organizations/page.tsx | 537 | 5 | FUNCTIONAL |
| 96 | `/admin/facilities` | admin/facilities/page.tsx | 587 | 5 | FUNCTIONAL |
| 97 | `/admin/users` | admin/users/page.tsx | 95 | 2 | FUNCTIONAL |
| 98 | `/admin/verification` | admin/verification/page.tsx | 126 | 5 | FUNCTIONAL |
| 99 | `/admin/audit` | admin/audit/page.tsx | 84 | 2 | FUNCTIONAL |
| 100 | `/admin/settings` | admin/settings/page.tsx | 44 | 2 | STUB — Settings |

---

## 11. Verification Routes (Phase 7–8)

| # | Route | File | Lines | Phase | Status |
|---|---|---|---|---|---|
| 101 | `/verify/prescription/[id]` | verify/prescription/[id]/page.tsx | 26 | 7 | STUB |
| 102 | `/verify/rx/[id]` | verify/rx/[id]/page.tsx | 26 | 7 | STUB |
| 103 | `/verify/lab/[id]` | verify/lab/[id]/page.tsx | 26 | 8 | STUB |
| 104 | `/verify/report/[token]` | verify/report/[token]/page.tsx | 26 | 8 | STUB |
| 105 | `/reports/[reportId]` | reports/[reportId]/page.tsx | 458 | 8 | FUNCTIONAL |

---

## 12. Future Phase Stub Routes (Phase 11–19)

### Finance Staff (Phase 12+)
| # | Route | Lines | Phase | Status |
|---|---|---|---|---|
| 106 | `/finance` | 206 | 12+ | UI_ONLY — Dashboard shell |
| 107 | `/finance/applications` | 32 | 12 | STUB |
| 108 | `/finance/ledger` | 32 | 12 | STUB |
| 109 | `/finance/plans` | 32 | 12 | STUB |
| 110 | `/finance/splits` | 32 | 12 | STUB |

### Insurance Staff (Phase 12+)
| # | Route | Lines | Phase | Status |
|---|---|---|---|---|
| 111 | `/insurance` | 127 | 12 | UI_ONLY — Dashboard shell |
| 112 | `/insurance/approvals` | 31 | 12 | STUB |
| 113 | `/insurance/claims` | 31 | 12 | STUB |
| 114 | `/insurance/payments` | 31 | 12 | STUB |
| 115 | `/insurance/policies` | 31 | 12 | STUB |
| 116 | `/insurance/review` | 31 | 12 | STUB |
| 117 | `/insurance/settings` | 44 | 12 | STUB |

### Government Staff (Phase 13+)
| # | Route | Lines | Phase | Status |
|---|---|---|---|---|
| 118 | `/government` | 203 | 13 | UI_ONLY — Dashboard shell |
| 119 | `/government/applications` | 32 | 13 | STUB |
| 120 | `/government/approvals` | 32 | 13 | STUB |
| 121 | `/government/beneficiaries` | 32 | 13 | STUB |
| 122 | `/government/cases` | 32 | 13 | STUB |
| 123 | `/government/disbursements` | 32 | 13 | STUB |
| 124 | `/government/settings` | 43 | 13 | STUB |

### Blood Bank (Phase 14+)
| # | Route | Lines | Phase | Status |
|---|---|---|---|---|
| 125 | `/blood-bank` | 147 | 14 | UI_ONLY — Dashboard shell |
| 126 | `/blood-bank/inventory` | 32 | 14 | STUB |
| 127 | `/blood-bank/donors` | 32 | 14 | STUB |
| 128 | `/blood-bank/matching` | 32 | 14 | STUB |
| 129 | `/blood-bank/dispatch` | 32 | 14 | STUB |

### Emergency / Ambulance (Phase 15–18)
| # | Route | Lines | Phase | Status |
|---|---|---|---|---|
| 130 | `/emergency` | 152 | 15 | UI_ONLY — Dashboard shell |
| 131 | `/ambulance` | 222 | 18 | UI_ONLY — Dashboard shell |
| 132 | `/ambulance/fleet` | 32 | 18 | STUB |
| 133 | `/ambulance/queue` | 32 | 18 | STUB |
| 134 | `/ambulance/trips` | 32 | 18 | STUB |
| 135 | `/ambulance/transfers` | 32 | 18 | STUB |
| 136 | `/ambulance/settings` | 43 | 18 | STUB |

### Staff Portal (Phase 5)
| # | Route | Lines | Phase | Status |
|---|---|---|---|---|
| 137 | `/staff` | 113 | 5 | FUNCTIONAL |
| 138 | `/staff/patients` | 26 | 5 | STUB |
| 139 | `/staff/profile` | 57 | 5 | FUNCTIONAL |
| 140 | `/staff/tasks` | 26 | 5 | STUB |

### System Pages
| # | Route | Lines | Phase | Status |
|---|---|---|---|---|
| 141 | `/` | 169 | 0 | FUNCTIONAL — Landing |
| 142 | `/access-denied` | 39 | 1 | FUNCTIONAL |

---

## 13. Route Status Summary

| Status | Count |
|---|---|
| **FUNCTIONAL** (real UI + data) | 83 |
| **UI_ONLY** (dashboard shell, no backend) | 6 |
| **STUB** (EmptyState placeholder) | 53 |
| **TOTAL** | 142 |

### By Phase:
| Phase | Functional | UI_Only | Stub | Total |
|---|---|---|---|---|
| 0 (Setup) | 1 | 0 | 0 | 1 |
| 1 (Auth) | 3 | 0 | 0 | 3 |
| 2 (Dashboards) | 9 | 0 | 2 | 11 |
| 3 (Patient) | 6 | 0 | 1 | 7 |
| 4 (Doctor) | 3 | 0 | 0 | 3 |
| 5 (Hospital) | 10 | 0 | 7 | 17 |
| 6 (Appointments) | 7 | 0 | 1 | 8 |
| 7 (Consultation) | 9 | 0 | 2 | 11 |
| 8 (Laboratory) | 8 | 0 | 6 | 14 |
| 9 (Pharmacy) | 7 | 0 | 4 | 11 |
| 10 (Billing) | 9 | 0 | 0 | 9 |
| 12+ (Future) | 0 | 3 | 14 | 17 |
| 13+ (Future) | 0 | 1 | 6 | 7 |
| 14+ (Future) | 0 | 1 | 4 | 5 |
| 15–18 (Future) | 0 | 1 | 6 | 7 |
