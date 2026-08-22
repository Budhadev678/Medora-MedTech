# S6 UI/UX, DESIGN SYSTEM & COMPONENT CONSISTENCY PLAN

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S6 Stabilization Track  
**Objective**: UI/UX Consistency, Design System, Responsive Layout, Component Consistency & Visual Usability  

---

## 1. Executive Summary

Track S6 stabilizes MEDORA's visual design system, component hierarchy, responsive layouts, accessibility baseline, and UX feedback states across all Phase 0–10 screens.

### Core Principle: Functionality First
- **No Deceptive Polish**: The UI accurately reflects real system state. Unimplemented features are clearly marked or omitted from primary flows; working features communicate their real-time state truthfully.
- **Unified Visual Hierarchy**: Consistent typography, spacing, colors, button variants, card layouts, table structures, and status badges across consumer and professional workspaces.
- **Dual-Experience Optimization**:
  - **Patient Portal**: Mobile-first, consumer-friendly, high contrast, large touch targets, simplified medical terminology.
  - **Professional Workspaces (Doctor, Hospital, Lab, Pharmacy, Finance)**: Desktop-first, data-dense, multi-column tables, keyboard accessible, robust filtering and audit visibility.

---

## 2. Design System Scope

| Primitive Component | Location | Role / Context | Design Standards |
|---|---|---|---|
| **Buttons** | `components/ui/button.tsx` | All Roles | Default (Teal Primary), Destructive (Red), Outline, Ghost, Emergency (Urgent Red Pulse), Success (Emerald) |
| **Cards** | `components/ui/card.tsx` | All Roles | Header, Title, Description, Content, Footer with subtle border and shadow |
| **Status Badges** | `components/ui/status-badge.tsx` | All Roles | Multi-modal: Semantic Icon + Distinct Color + Human-Readable Label (never color alone) |
| **Data Tables** | `components/ui/table.tsx` | Professional | Clean sticky headers, subtle hover state, accessible cell spacing, horizontal overflow protection |
| **Feedback States** | `components/shared/*` | All Roles | `LoadingState` (Activity pulse + spin), `EmptyState` (Icon + Title + Description + CTA), `ErrorState` (ShieldAlert + Message + Retry) |
| **Currency & Timestamps** | `lib/utils.ts` | All Roles | Standardized `₹` Indian Rupee currency and standard clinical timestamps |
