# 🏗️ MEDORA — Technical Architecture & System Design

## 1. System Architecture Overview

MEDORA is designed as a unified, high-performance Next.js 14+ full-stack web application with Supabase (PostgreSQL, Supabase Auth, Supabase Storage, and Realtime).

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 14+ Client                   │
│   (Tailwind CSS, shadcn/ui, Lucide Icons, React Context)│
└─────────────────────────┬──────────────────────────────┘
                          │
            Server Actions / Route Handlers
                          │
┌─────────────────────────▼──────────────────────────────┐
│                  Next.js API & Services                │
│    (Validation with Zod, Role Middleware, Audit Hooks) │
└─────────────────────────┬──────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────┐
│                    Supabase Backend                    │
│   ┌──────────────────────────────────────────────────┐ │
│   │ PostgreSQL Database (RLS Policies & Triggers)    │ │
│   ├──────────────────────────────────────────────────┤ │
│   │ Supabase Auth (JWT & Role Metadata)              │ │
│   ├──────────────────────────────────────────────────┤ │
│   │ Supabase Storage (Prescriptions, Lab Reports)    │ │
│   ├──────────────────────────────────────────────────┤ │
│   │ Realtime (Queue Updates, Emergency Pre-alerts)   │ │
│   └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure Convention

```
/
├── app/
│   ├── (auth)/                 # Login, Register, Recovery, Role Switcher
│   ├── (dashboard)/
│   │   ├── patient/            # Patient Portal (/patient/*)
│   │   ├── doctor/             # Doctor Clinical Suite (/doctor/*)
│   │   ├── hospital/           # Hospital Command Center (/hospital/*)
│   │   ├── lab/                # Connected Diagnostic Lab (/lab/*)
│   │   ├── pharmacy/           # Hospital Pharmacy Dispensing (/pharmacy/*)
│   │   ├── emergency/          # ER Triage & Coordination (/emergency/*)
│   │   ├── blood-bank/         # Blood Unit Coordination (/blood-bank/*)
│   │   ├── finance/            # Billing, Insurance & Scheme Aid (/finance/*)
│   │   └── admin/              # Master System Audit & Config (/admin/*)
│   ├── api/                    # Route Handlers & Webhooks
│   ├── layout.tsx              # Root Layout
│   └── page.tsx                # Landing Page & Portal Gateway
├── components/
│   ├── ui/                     # shadcn/ui base primitives (Button, Card, Dialog, etc.)
│   ├── shared/                 # Reusable components (Header, Sidebar, Timeline, Badges)
│   ├── patient/                # Patient-specific compound components
│   ├── doctor/                 # Consultation & Rx building components
│   ├── lab/                    # Lab sample & report entry forms
│   ├── pharmacy/               # Prescription dispensing views
│   ├── billing/                # Itemized invoice & "Why was I charged?" modal
│   └── emergency/              # Triage board & doctor availability cards
├── docs/                       # Project Documentation & Live Progress Tracking
├── lib/
│   ├── supabase/               # Supabase browser, server, and admin clients
│   ├── utils.ts                # Tailwind merge & common utilities
│   └── constants.ts            # Enums, statuses, role definitions
├── types/
│   └── database.types.ts       # Generated TypeScript database types
├── services/                   # Business logic (Audit, Timeline, Billing, Lab, Rx)
└── public/                     # Static assets, branding, placeholder documents
```

---

## 3. Security & Access Control Model

1. **Server-Enforced RBAC**: User role is attached to user metadata and validated on every server action / API handler using Supabase Row-Level Security (RLS) and middleware.
2. **Least Privilege**: Patients can only read their own medical records, prescriptions, and bills (unless explicitly shared with a doctor/hospital).
3. **Medical Record Access Tokens**: Sharing records creates a signed, time-bound token (e.g. valid for 24 hours).
4. **Append-Only Audit Logging**: All sensitive mutations automatically insert into `audit_logs`. Normal users have no delete or update permissions on audit tables.
