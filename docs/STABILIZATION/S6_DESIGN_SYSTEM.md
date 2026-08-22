# S6 DESIGN SYSTEM & VISUAL LANGUAGE SOURCE OF TRUTH

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S6 Stabilization Track  
**Focus**: Colors, Typography, Spacing, Buttons, Badges, Tables, Cards & Feedback Primitives  

---

## 1. Color System Palette

| Token / Purpose | Tailwind Color Class | Hex / HSL Equivalent | Context & Usage |
|---|---|---|---|
| **Primary Brand** | `bg-teal-700`, `text-teal-700` | `#0f766e` | Primary buttons, active sidebar items, header accents |
| **Primary Hover** | `bg-teal-800` | `#115e59` | Hover states for primary interactive elements |
| **Secondary Surface** | `bg-slate-50`, `bg-slate-100` | `#f8fafc`, `#f1f5f9` | Card surfaces, sidebar background, table headers |
| **Text Primary** | `text-slate-900`, `text-slate-800` | `#0f172a`, `#1e293b` | Main headings, body content, table data cells |
| **Text Muted** | `text-slate-500`, `text-slate-400` | `#64748b`, `#94a3b8` | Subtitles, helper text, timestamps, labels |
| **Border Neutral** | `border-slate-200` | `#e2e8f0` | Card borders, dividers, table row borders |
| **Success / Verified** | `bg-emerald-600`, `text-emerald-700`| `#059669` | Dispensed drugs, paid bills, verified licenses, approved reports |
| **Warning / Pending** | `bg-amber-500`, `text-amber-700` | `#d97706` | In queue, preparing medications, draft records, triage level 3 |
| **Emergency / Alert** | `bg-red-600`, `text-red-700` | `#dc2626` | Trauma unit alerts, critical vitals, billing disputes, triage level 1 |
| **Info / Active** | `bg-blue-600`, `text-blue-700` | `#2563eb` | In-progress testing, consultation ongoing |

---

## 2. Typography Scale

- **App Page Title**: `text-xl md:text-2xl font-bold tracking-tight text-slate-900`
- **Section / Card Heading**: `text-base md:text-lg font-semibold text-slate-900`
- **Body Regular**: `text-sm text-slate-700 leading-relaxed`
- **Caption / Meta**: `text-xs text-slate-500`
- **Status / Micro-Badge**: `text-[10px] md:text-[11px] font-semibold uppercase tracking-wider`

---

## 3. Standardized Formatting Helpers

1. **Indian Rupee Currency (`formatCurrency`)**:
   - Always formatted using `en-IN` standard with Rupee symbol: `₹5,000`, `₹1,25,000`, `₹0`.
2. **Clinical Timestamps (`formatDate`)**:
   - Standard Date: `20 Aug 2026`
   - Date + Time: `20 Aug 2026, 10:30 AM`
3. **Identity Privacy Masking (`maskIdentityNumber`)**:
   - Masks sensitive Aadhaar / ABHA digits: `XXXX XXXX 9012`.
