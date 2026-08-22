# S5 NAVIGATION, ROUTING & SCREEN-FLOW STABILIZATION PLAN

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S5 Stabilization Track  
**Objective**: Navigation, Routing, Sidebar Truthfulness, Screen Connectivity, Workflow Transitions & UX States  

---

## 1. Executive Summary

Track S5 ensures that MEDORA operates as a unified, connected application where every user role (Patient, Doctor, Hospital Admin, Lab Staff, Pharmacy Staff, Finance Staff, Platform Admin) experiences seamless, deterministic navigation across all Phase 0–10 clinical and financial journeys.

S5 establishes:
```
LOGIN
  ↓
AUTHENTICATED ROLE
  ↓
DEDICATED ROLE WORKSPACE
  ↓
ACCURATE SIDEBAR / BOTTOM NAVIGATION
  ↓
SCREEN VIEW WITH AUTHORITATIVE DATA
  ↓
USER ACTION / RECORD INTERACTION
  ↓
NEXT CONNECTED STAGE / MODAL / DETAIL VIEW
  ↓
BREADCRUMB & BACK CONTEXT PRESERVATION
```

---

## 2. Navigation Scope & Core Principles

1. **One Authoritative Router**: Built upon Next.js App Router with consistent dynamic parameters (`[id]`, `[orderId]`, `[billId]`).
2. **Sidebar Truthfulness**: Every sidebar item links directly to an active, working internal route. Zero fake "coming soon" placeholders presented as completed features, and zero dead navigation links.
3. **Context Preservation**: Navigating to detail views (`/doctor/consultations/[id]`, `/lab/orders/[id]`, `/pharmacy/orders/[orderId]`, `/hospital/billing/[billId]`) preserves the specific record ID rather than defaulting to hardcoded or generic data.
4. **State Machine Completeness**: Every data-bound screen provides explicit Loading, Empty, and Error states with non-destructive Retry capabilities.
5. **Multi-Role Workspace Isolation**: `RoleGuard` prevents unauthorized cross-role workspace jumps, seamlessly returning users to their primary dashboard when access is restricted.
