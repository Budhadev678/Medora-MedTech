# 📐 MEDORA — Design System & Token Specifications

This document defines the centralized design tokens and reusable UI primitives for MEDORA.

---

## 1. Color Tokens & Semantic Palette

All colors are configured via Tailwind CSS variables in `globals.css` and `tailwind.config.ts`.

### Surface & Neutral Tones
* **Background:** `#F8FAFC` (Slate-50) — Calm, clean medical off-white
* **Surface (Card):** `#FFFFFF` (Pure White)
* **Surface-Secondary:** `#F1F5F9` (Slate-100) — Input backgrounds, table headers
* **Border-Default:** `#E2E8F0` (Slate-200) — Subtle dividing borders
* **Text-Primary:** `#0F172A` (Slate-900) — High contrast readability
* **Text-Secondary:** `#475569` (Slate-600) — Contextual text, descriptions
* **Text-Muted:** `#94A3B8` (Slate-400) — Captions, disabled labels

### Primary Brand Accents (Trust & Clinical Precision)
* **Primary (Medora Teal):** `#0D9488` (Teal-600)
* **Primary-Hover:** `#0F766E` (Teal-700)
* **Primary-Light:** `#CCFBF1` (Teal-100) — Badge fills, active tab highlights
* **Primary-Dark:** `#115E59` (Teal-800)

### Semantic State Tokens
* **Success (Verified / Dispensed):** `#16A34A` (Green-600) | Light: `#DCFCE7`
* **Warning (Pending / In Review):** `#D97706` (Amber-600) | Light: `#FEF3C7`
* **Error (Cancelled / Failed):** `#DC2626` (Red-600) | Light: `#FEE2E2`
* **Info (Booked / Scheduled):** `#2563EB` (Blue-600) | Light: `#DBEAFE`

### Emergency Priority Tokens
* **Emergency-Critical (Triage Red):** `#B91C1C` (Red-700) | Light: `#FEE2E2` | Pulse Indicator
* **Emergency-High (Triage Amber):** `#EA580C` (Orange-600) | Light: `#FFEDD5`
* **Emergency-Moderate (Triage Yellow):** `#CA8A04` (Yellow-600) | Light: `#FEF9C3`
* **Emergency-Low (Triage Green):** `#16A34A` (Green-600) | Light: `#DCFCE7`

---

## 2. Typography Scale (Inter / Sans-Serif)

| Token | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `display` | 32px (2rem) | 36px | Bold (700) | Landing hero, Welcome greetings |
| `h1` | 24px (1.5rem) | 32px | SemiBold (600) | Primary page headers, Dashboard titles |
| `h2` | 20px (1.25rem) | 28px | SemiBold (600) | Card group headers, Section titles |
| `h3` | 18px (1.125rem) | 24px | Medium (500) | Modal titles, Card titles |
| `h4` | 16px (1rem) | 22px | SemiBold (600) | Subsection labels, Table headers |
| `body-large`| 16px (1rem) | 24px | Regular (400) | Clinical notes, Instruction descriptions |
| `body` | 14px (0.875rem)| 20px | Regular (400) | Default text, Form labels, Table rows |
| `body-small`| 13px (0.8125rem)| 18px | Regular (400) | Metadata, secondary attributes |
| `caption` | 12px (0.75rem) | 16px | Medium (500) | Timestamps, badge labels, helper text |
| `button` | 14px (0.875rem)| 20px | Medium (500) | Interactive CTA buttons |

---

## 3. Spacing & Border Radius System

* **Spacing Grid:** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`
* **Border Radius:**
  - `sm` (6px): Input fields, badges, small buttons, status chips
  - `md` (10px): Cards, dialog modals, dropdown menus, notification banners
  - `lg` (14px): Main container shells, full-page sheets

---

## 4. Centralized UI Primitives Component Library (`@/components/ui`)

All components are standard, accessible shadcn/ui primitives styled with Medora design tokens:
1. `Button` (Variants: `default`, `secondary`, `outline`, `destructive`, `ghost`, `emergency`)
2. `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
3. `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`
4. `Sheet` (Side Drawer for "Why was I charged?" and Medical Record view)
5. `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
6. `Badge` / `StatusChip` (Semantic icons + text)
7. `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
8. `Input`, `Textarea`, `Select`, `RadioGroup`, `Checkbox`, `Switch`
9. `Timeline`, `TimelineItem`, `TimelineConnector`, `TimelineIcon`, `TimelineContent`
10. `EmptyState` (Icon + Title + Description + Primary CTA)
11. `LoadingSkeleton` (Pulsing placeholder bars)
12. `ConfirmationDialog` (Consequences clearly explained before action)
