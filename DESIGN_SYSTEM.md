# Ocean Blue Admin Design System

The single source of truth for how the admin app (`/admin/*`) looks, behaves, and grows.
Anatomy follows the three-layer model from
[Pencil & Paper — Anatomy of a Design System](https://www.pencilandpaper.io/articles/anatomy-design-system):
a **design layer** (principles, style, components, patterns), a **development layer**
(tokens + coded components — the part people actually use), and a **design-ops layer**
(governance, contribution, maintenance). Scope is deliberately small: this system serves
one staff-only ATS/CRM used by four roles — it does not need to rival Material or Polaris,
it needs to keep ~25 admin screens consistent.

---

## 1. Principles

1. **Calm density.** Recruiters live in these screens all day. Prefer compact rows,
   tabular numbers, and generous whitespace *between* groups over decoration *within* them.
2. **One neutral, one accent.** Slate is the only neutral family; cobalt
   (`--adm-accent`, #1d4ed8) is the only brand accent. Other hues appear solely as
   *status/categorical* tones from `theme.ts`.
3. **Components over classes.** Pages compose components; components consume tokens;
   tokens alias the brand. A page that hand-writes `border-slate-200/80 rounded-2xl …`
   is a bug to be migrated.
4. **Don't look generated.** No gradient stat tiles, no icon-chip+subtitle rows as filler,
   no detached floating dropdowns. Hovers fill or tint; menus connect to their triggers.
5. **State is always visible.** Filtered lists show chips; empty sections say why they're
   empty and what to do; loading mirrors the final layout (skeletons, never spinners-in-a-void).
6. **UI gating is courtesy, not security.** Every role check in the UI must be mirrored
   by authorization in the API route.

---

## 2. Design tokens (development layer, foundation)

Defined in `src/app/globals.css` under the `ADMIN` block. Admin UI may reference **only**
`--adm-*` tokens (they alias the landing `--hz-*` brand primitives so a rebrand is a
one-file change). TypeScript-side constants live in `src/components/admin/theme.ts`.

| Group | Tokens | Use |
|---|---|---|
| Accent | `--adm-accent`, `-strong`, `-soft`, `-tint`, `--adm-focus-ring` | Primary actions, hovers, selected rows, focus rings |
| Surface | `--adm-canvas`, `--adm-surface`, `--adm-line`, `--adm-line-soft` | Page bg, cards, borders, dividers |
| Ink | `--adm-ink`, `-mute`, `-subtle` | Headings → labels → hints |
| Status | `--adm-success`, `-warning`, `-danger`, `-info` | Semantic states only |
| Charts | `--adm-chart-1…7` / `CHART_COLORS`, `SERIES` in theme.ts | See §6 |
| Elevation | `--adm-shadow-sm/md/lg` | Card → popover → modal |
| Motion | `--adm-ease`, `--adm-duration-fast/base/slow` | One easing curve everywhere |
| Radius | `--adm-radius-control/input/chip/card` (8/10/12/16px) | Size ↔ roundness scale |

Type ramp (Geist Sans, compact density — tuned for 13–14" laptops): page title
19px bold · KPI value 25px (sm 20px) · card title 14px bold · body 14px · secondary
13px · labels/hints 11–12px · table headers 11px uppercase tracking-wider. Numbers
always `tabular-nums`. Density lives in the shared atoms (StatCard, PageHeader,
AdminCardHeader, FormSection padding, control `py-2`, layout `p-3 lg:p-4`, sidebar
`w-56`) so tightening is a one-place change, not a per-page edit.

---

## 3. Components (atoms)

**Reuse `src/components/ui/` (shadcn) for base primitives — do not fork parallel admin
copies.** The ui library is themed to navy `--primary` + cyan `--ring`; the admin language
is cobalt + slate, so apply a cobalt override class at the admin call site (see
`PageHeaderButton` and the `checkboxCobalt` const in `data-table.tsx` for the pattern).
Admin-specific atoms that have **no** ui equivalent live in `src/components/admin/`.

| Atom | Source | Notes |
|---|---|---|
| Button | `ui/button.tsx` | The one button. `PageHeaderButton` (`page-header.tsx`) is a thin cobalt-styling layer over it (`primary`/`secondary`/`ghost` → ui variants + accent class). Never fork a button. |
| Checkbox | `ui/checkbox.tsx` | Supports `indeterminate` (DataTable select-all); pass the cobalt override class. |
| Select / Input / Label / Avatar / Card / DropdownMenu / Sheet / Separator | `ui/*` | Use these; don't recreate. |
| Switch, Tooltip | _not yet in ui/_ | Add to `ui/` (shadcn style) when first needed — do **not** create an admin-only copy. |
| `EmptyState` | `admin/empty-state.tsx` | Icon well + title + why + optional action. No ui equivalent. |
| `Sparkline` | `admin/sparkline.tsx` | Pure-SVG trend shape, no axes/tooltip. No ui equivalent. |
| `StatusBadge` | `admin/status-badge.tsx` | Status text + tone from `statusMeta`. |
| `StarRating`, `OceanSpinner` | `admin/*`, `ui/ocean-spinner` | — |
| Form controls | `admin/forms/primitives.tsx` | `FormInput`, `FormSelect`, `FormTextarea`, `MoneyInput`, `Field`, `FormSection` — admin-form-specific wrappers. |

## 4. Patterns (components composed to solve a problem)

| Pattern | File | Solves |
|---|---|---|
| `PageHeader` | `page-header.tsx` | Title + subtitle + meta chips + actions on every page. |
| `AdminCard` / `AdminCardHeader` | `admin-card.tsx` | The canonical surface. |
| `StatCard` | `stat-card.tsx` | KPI: tinted icon + big number + delta chip + optional `trend` sparkline. |
| `SearchInput`, `FilterToggle`, `ViewSwitcher`, `BulkBar` | `toolbar.tsx` | The list-page toolbar kit. |
| `FilterChips` | `filter-chips.tsx` | Active filters stay visible & dismissible. |
| `DataTable<T>` | `data-table.tsx` | Sortable, selectable, paginated table with built-in loading skeletons and `EmptyState`. Numbers right-aligned; secondary columns `hideBelow`. |
| `AssigneePicker` | `forms/primitives.tsx` | Search + chip multi-select. |
| `ConfirmDialog` | `confirm-dialog.tsx` | Destructive confirmations (pair with `danger` button). |
| `CommandPalette` | `command-palette.tsx` | Global ⌘K navigation/search. |
| Skeletons | `skeletons.tsx` | Loading mirrors layout. |

**Canonical list page** = `PageHeader` → `StatCard` row (optional) → `AdminCard` toolbar
(`SearchInput` + `FilterToggle` + `ViewSwitcher` + `BulkBar`, `FilterChips` below) →
`AdminCard` + `DataTable`. Reference implementation: `/admin/contacts` (migrated).

---

## 5. Role-based access & complexity

Hierarchy (in `src/lib/auth/config.ts`): **ADMIN > HR > (RECRUITER = SALES)**; `role`
may be `null` (authenticated, no access). Three gating altitudes:

1. **Route** — `ProtectedRoute requiredRoles` (layout) + `routeAccess`.
2. **Navigation** — `roles` arrays on `NAV_GROUPS` items (layout). A role's sidebar *is*
   its complexity budget: recruiters/sales see Recruitment only; HR adds CRM; admins add
   Administration. Don't add nav items visible to all roles by default — start narrow.
3. **In-content** — `RoleGate` / `useCan` (`role-gate.tsx`):
   - `mode="hide"` (default) when the role will *never* use it (admin settings inside a
     shared page). Removing beats disabling — fewer dead controls, calmer screens.
   - `mode="disable"` when the capability exists for the role but isn't currently
     permitted; preserve layout, pair with a `Tooltip` saying why.

Always: server-side check in the API route too. UI gating is UX, not security.

---

## 6. Data visualization

Strategy for dashboards (implemented in `/admin`):

1. **Layered altitude.** Row 1: 4 KPI `StatCard`s (value + delta + sparkline) — answer
   "is anything wrong?" in 5 seconds. Row 2: behavior over time (area chart) + composition
   (donut). Row 3: process diagnostics (funnel, sources, leaderboards). Row 4: work queues
   ("Needs attention", recent items) — every insight ends in a clickable action.
2. **Chart choice.** Trend → area/line; composition at a point → donut (≤7 segments,
   merge the tail into "Other"); stage conversion → funnel with explicit % between stages;
   ranking → horizontal bars; tiny trend in a card/cell → `Sparkline`. No 3D, no dual axes,
   no pie with >7 slices.
3. **Color discipline.** Series 1 is always cobalt (`SERIES.primary`); emerald is reserved
   for success/hired, rose for rejected/failure, amber for at-risk, slate for "other".
   Categorical palettes come from `CHART_COLORS` **in order** — never invent hex values
   in a page.
4. **Annotation over legend-hunting.** Put numbers on the chart (funnel counts, conversion
   pills); axis labels 10px slate-400; gridlines horizontal-only, slate-100.
5. **Performance.** recharts only for charts with axes/tooltips; sparklines and donuts are
   hand-rolled SVG (no extra bundle). Aggregate in `useMemo` off one fetched dataset rather
   than re-fetching per widget. Respect `prefers-reduced-motion` (`useReducedMotion`)
   for entrance animation; count-ups and bar fills are decorative only.
6. **Empty & loading.** Every chart has a designed empty state; the dashboard skeleton
   mirrors the final grid.

---

## 7. Governance & maintenance (design-ops layer)

**Decision rule.** Anything visual used (or usable) on 2+ screens belongs in
`src/components/admin/` and consumes `--adm-*` tokens. One-off page logic stays in the page.

**Contribution checklist** (PR review gate for admin UI):
- [ ] No raw hex/rgba in pages — tokens or `theme.ts` constants only.
- [ ] Reused `ui/` primitives (Button, Checkbox, Select, …) with a cobalt override class — did NOT fork a parallel admin copy.
- [ ] No hand-rolled buttons, search inputs, badges, empty states, or tables — use §3/§4.
- [ ] New status/tone added to `theme.ts` (`statusMeta`/`tones`), not inline.
- [ ] Focus ring (`--adm-focus-ring`) visible on every new interactive element; icon-only
      buttons have `aria-label` or `Tooltip`.
- [ ] Role checks via `RoleGate`/`useCan` + matching API-route authorization.
- [ ] Loading skeleton mirrors layout; empty state says why + what to do.
- [ ] Client components never import values from AWS modules (`import type` only).

**Change management.** Token changes = system-wide, need a screenshot pass of dashboard,
one list page, one form page. Component API changes must keep existing call sites compiling
(extend, don't break). Deprecations: mark with `@deprecated` JSDoc, migrate call sites,
then delete — no parallel duplicates.

**Migration backlog** (legacy → system, in this order of payoff):
1. Replace hand-rolled search/filter toolbars with the `toolbar.tsx` kit —
   DONE across all pages: contacts, clients, vendors, resumes, users, applications,
   jobs, bench, jobs/[id] (SearchInput/FilterToggle/ViewSwitcher/BulkBar/FilterChips).
2. Replace inline empty states with `EmptyState` — DONE on migrated pages (incl. jobs/[id]).
3. Replace ad-hoc tables with `DataTable` where columns are simple cells (optional; the
   complex multi-view tables on applications/jobs/bench keep their bespoke rendering).
4. Replace remaining `--hz-*` references in admin pages with `--adm-*`.
5. Modal forms on `Field`/`FormInput`/`FormSelect` — DONE: clients, vendors.

**Health metrics.** Adoption = count of hand-rolled search inputs remaining
(`grep 'placeholder="Search' src/app/admin` → should trend to 0); consistency = no new
hex values in `src/app/admin` diffs; bundle = `@aws-sdk` count in `.next/static` stays 0.
