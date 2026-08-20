# 🛠️ MEDORA — Developer Workflow & Progress Tracking Guide

This guide explains how the development process works, how to know what has been built, what is being built right now, and how to verify and track every step.

---

## 1. How You (The Developer) Can Track Progress Anytime

Whenever you want to know what is happening in the project:
1. **Check `docs/BUILD_STATUS.md`**:  
   This is the top-level mission control dashboard. It shows the active phase, completed tasks, in-progress tasks, and the exact next step.
2. **Check `docs/FEATURE_STATUS.md`**:  
   This provides the granular ID-level registry of all features across Patient, Doctor, Hospital, Lab, Pharmacy, Emergency, Billing, and Admin modules.
3. **Check `docs/CHANGELOG.md`**:  
   This contains the chronological changelog of what was implemented in each session.

---

## 2. The Strict 7-Step Development Cycle

To prevent regressions, broken links, or disconnected mock data, every feature follows this exact cycle:

```
[1. User Request / Phase Step]
       ↓
[2. Impact Analysis & Reusability Check]
       ↓
[3. Technical Design (DB tables + API routes + UI components)]
       ↓
[4. Implementation (Centralized, reusable code)]
       ↓
[5. Multi-scenario Verification (Happy path + Edge cases + Errors)]
       ↓
[6. Documentation Sync (Update BUILD_STATUS.md & FEATURE_STATUS.md)]
       ↓
[7. Approval & Next Milestone Transition]
```

---

## 3. How We Maintain Single-Developer Simplicity

Because this platform is developed by a single engineer:
- **Centralized Layouts**: All role dashboards share common navigation, header, status badges, and notification shells.
- **Centralized Data Layer**: All Supabase client calls, mutations, and database helpers live in `@/lib/supabase` and `@/services`.
- **Reusable UI Primitives**: Standardized shadcn/ui components (`Button`, `Card`, `Dialog`, `Badge`, `Tabs`, `Table`, `Timeline`) are reused across all roles.
- **No Over-Engineering**: Monolithic Next.js full-stack app without redundant microservices.
- **Controlled Demo Seeding**: Consistent IDs (e.g., `PAT-1001`, `DOC-1001`, `HOSP-1001`, `RX-1001`) ensure that outpatient, inpatient, laboratory, pharmacy, and billing flows tie together seamlessly during live demonstrations.

---

## 4. Status Life Cycle Definitions

- `NOT_STARTED`: The feature is planned in the roadmap but no code exists.
- `IN_PROGRESS`: Currently being designed, coded, or wired to the database.
- `BUILT`: Implementation is complete (UI + Backend + DB schema ready).
- `TESTING`: Undergoing verification across edge cases and failure modes.
- `VERIFIED`: Tested and confirmed working end-to-end within the connected workflow.
- `BLOCKED`: Dependent on a prerequisite feature that is not yet completed.

---

## 5. Command Quick Reference

When developing:
- **Run dev server**: `npm run dev`
- **Run type check**: `npx tsc --noEmit`
- **Run build check**: `npm run build`
- **Lint code**: `npm run lint`
