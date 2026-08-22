# S6 COMPONENT REGISTRY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S6 Stabilization Track  
**Focus**: Reusable UI Components Directory & Usage Inventory  

---

## 1. Core UI Components (`components/ui/`)

| Component | File Path | Primary Props | Key Variants | Status |
|---|---|---|---|---|
| **Button** | `components/ui/button.tsx` | `variant`, `size`, `className`, `disabled`, `onClick` | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `emergency`, `success` | **VERIFIED** |
| **Card** | `components/ui/card.tsx` | `className`, `children` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | **VERIFIED** |
| **Badge** | `components/ui/badge.tsx` | `variant`, `className` | `default`, `secondary`, `destructive`, `outline`, `teal`, `emerald`, `warning`, `info`, `emergency` | **VERIFIED** |
| **StatusBadge** | `components/ui/status-badge.tsx` | `status`, `customLabel`, `size` | Multi-modal icon + color + label covering 20+ clinical & financial statuses | **VERIFIED** |
| **Table** | `components/ui/table.tsx` | `className`, `children` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | **VERIFIED** |
| **Input** | `components/ui/input.tsx` | `type`, `placeholder`, `disabled`, `className` | Standard text, number, date, search inputs | **VERIFIED** |
| **Textarea** | `components/ui/textarea.tsx`| `placeholder`, `rows`, `disabled` | Clinical encounter notes, consultation SOAP notes | **VERIFIED** |
| **Skeleton** | `components/ui/skeleton.tsx` | `className` | Content placeholder loading bars | **VERIFIED** |
| **EmptyState** | `components/ui/empty-state.tsx` | `icon`, `title`, `description`, `actionLabel`, `actionHref` | Empty rosters, no records found, initial states | **VERIFIED** |

---

## 2. Shared Shell & Layout Components (`components/shared/`)

| Component | File Path | Purpose | Consuming Roles | Status |
|---|---|---|---|---|
| **RoleSidebar** | `components/shared/role-sidebar.tsx` | Collapsible desktop enterprise navigation sidebar | Doctor, Hospital, Lab, Pharmacy, Finance, Admin | **VERIFIED** |
| **RoleBottomNav**| `components/shared/role-bottom-nav.tsx` | Mobile-first 5-tab bottom navigation bar | Patient | **VERIFIED** |
| **RoleGuard** | `components/shared/role-guard.tsx` | Route-level role RBAC and login redirect guard | All Roles | **VERIFIED** |
| **Navbar** | `components/shared/navbar.tsx` | Top application header with brand logo, org switcher, demo switcher, and profile menu | All Roles | **VERIFIED** |
| **LoadingState**| `components/shared/loading-state.tsx` | Animated pulse and spinner state | All Roles | **VERIFIED** |
| **ErrorState** | `components/shared/error-state.tsx` | ShieldAlert indicator, message, retry, and sign out CTA | All Roles | **VERIFIED** |
| **PageHeader** | `components/shared/page-header.tsx` | Consistent page title, subtitle, and primary actions | All Roles | **VERIFIED** |
| **Breadcrumbs** | `components/shared/breadcrumbs.tsx`| Contextual hierarchical navigation path | Professional Roles | **VERIFIED** |
