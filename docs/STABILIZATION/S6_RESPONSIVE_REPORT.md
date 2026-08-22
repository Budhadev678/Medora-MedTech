# S6 RESPONSIVE LAYOUT & MULTI-DEVICE REPORT

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S6 Stabilization Track  
**Focus**: Mobile, Tablet & Desktop Responsive Architecture  

---

## 1. Responsive Layout Strategy

| Viewport Category | Screen Width | Target Workspaces | Layout Behavior | Navigation System |
|---|---|---|---|---|
| **Mobile Consumer** | `< 768px` | Patient Portal, Emergency Locator | Single column vertical stack, full-width touch cards, hidden desktop sidebars | `RoleBottomNav` (5-tab fixed bottom navigation) |
| **Tablet View** | `768px – 1024px` | Doctor Clinical Queue, Reception | 2-column grids, collapsible desktop sidebar | `RoleSidebar` (collapsed icon-only mode with tooltips) |
| **Desktop Enterprise**| `> 1024px` | Hospital Command, Lab, Pharmacy, Finance | Multi-column layouts, sticky data tables, split panes | `RoleSidebar` (expanded 240px enterprise sidebar) |

---

## 2. Touch Targets & Mobile Usability

- Minimum touch target for all patient-facing buttons: **44px height** (`h-10` or `h-11` on mobile).
- Emergency button in patient bottom nav: Highlighted with distinct red background and pulsing emergency indicator.
- Tables wrapped in `overflow-x-auto` to prevent layout breaking on small viewports.
