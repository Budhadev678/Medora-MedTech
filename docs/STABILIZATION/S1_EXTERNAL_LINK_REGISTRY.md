# MEDORA — S1 EXTERNAL LINK REGISTRY
## Stabilization Track — S1 Document 8 of 15

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Date**: August 2026  
**Status**: VERIFIED AUDIT

---

## 1. External Links Found

| # | URL / Target | Used In | Purpose | Phase | Acceptable? |
|---|---|---|---|---|---|
| 1 | `https://abha.abdm.gov.in` | patient/profile/abha | ABHA ID verification portal | 3 | ✅ Yes — Government health portal |
| 2 | `https://uidai.gov.in` | patient/profile | Aadhaar reference | 3 | ✅ Yes — Government ID portal |
| 3 | `https://pmjay.gov.in` | patient/government | PM-JAY scheme reference | 10 | ✅ Yes — Government health scheme |
| 4 | `tel:112` | patient/emergency | Emergency SOS helpline | 3 | ✅ Yes — India emergency number |
| 5 | `https://images.unsplash.com/*` | constants.ts, identity-store.ts | Demo persona avatars | 1 | ⚠️ Acceptable for demo — should use local assets in production |
| 6 | `https://placeholder-project.supabase.co` | lib/supabase/client.ts | Placeholder Supabase URL | 0 | ⚠️ Fallback — not a real endpoint |

---

## 2. External Link Summary

| Category | Count |
|---|---|
| Government portals (legitimate) | 3 |
| Emergency telephone | 1 |
| External image CDN (demo) | 1 pattern (multiple URLs) |
| Placeholder backend | 1 |
| **Links redirecting away from MEDORA workflows** | **0** |

> [!NOTE]
> Zero core healthcare features redirect the user outside of MEDORA. All external links are either government reference portals, emergency contacts, or demo asset URLs. No `window.open()` calls were found in the codebase.
