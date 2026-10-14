# Oceanblue Portal Design System

How the staff portal (`/portal/*`) looks, behaves and grows. Anatomy follows the
three-layer model from
[Pencil & Paper. Anatomy of a Design System](https://www.pencilandpaper.io/articles/anatomy-design-system):
a **design layer** (principles, style, components, patterns), a **development layer**
(tokens and coded components) and a **design-ops layer** (governance, contribution,
maintenance). Scope is small on purpose: one staff-only ATS/CRM with five roles.

The portal has two layers of code:

- **The portal kit**, `src/components/portal/kit` plus `DataTable.tsx`, `ui.tsx`,
  `Select.tsx`, `charts.tsx`, `icons.tsx`. Every list page, the dashboard and the
  record screens. Usage notes in `src/components/portal/README.md`.
- **The carried-over console**, `src/app/portal/(console)` and
  `src/components/portal/console`. Detail, editor and utility screens moved from
  the old `/admin` app, wrapped in `.adm-scope` and reading `--adm-*` tokens that
  are retuned to the portal palette. New screens use the kit.

---

## 1. Principles

1. **Calm density.** Recruiters live in these screens all day. Compact rows,
   tabular numbers, whitespace *between* groups rather than decoration *within* them.
2. **One neutral, one accent.** `mist` is the only neutral family; `ocean-600`
   (#0a72c0, the logo blue) is the only accent. Green, amber and red appear only as
   success, warning and danger. See `docs/DESIGN_LAWS.md`.
3. **Components over classes.** Pages compose kit components; a page never pads
   itself or hand-builds a table, dialog or button.
4. **Don't look generated.** No gradient stat tiles, no tinted icon chips on KPI
   cards, headers or menu rows, no detached floating dropdowns.
5. **State is always visible.** Filters show as chips; empty tables say why and what
   to do; loading mirrors the final layout.
6. **UI gating is courtesy, not security.** Every role check in the UI is mirrored
   by authorization in the API route.

---

## 2. Design tokens

### 2.1 Where colour lives

`src/styles/colors.css` is the colour source for the site and the portal: the
`mist`, `tide`, `cyan`, `ocean`, `navy`, `buoy`, `kelp` and `coral` scales, and the
pipeline stage tokens (§2.5). Kit components use the scale classes directly
(`bg-ocean-600`, `ring-mist-200`, `text-coral-700`). The console's `--adm-*` tokens
(ADMIN block in `globals.css`) alias the same scales, so both layers draw the same
colours.

The `TOKENS` block at the top of `globals.css` keeps the three-tier scheme:

| Tier | Pattern | Example |
|---|---|---|
| Primitive | `--p-{scale}-{step}` | `--p-space-4` |
| Semantic | `--{category}-{property}-{role}[-{state}]` | `--color-border-control`, `--opacity-disabled` |
| Component | `--{component}-{part}-{property}[-{state}]` | `--skeleton-radius` |

The portal reads from it `--color-border-control` (control edges, `mist-500`),
`--opacity-disabled` (0.45) and `--ease-standard`. Names read general to specific,
states last.

### 2.2 Token or hardcoded value

It is a token if **any** of these is true: it is a colour; it repeats on two or more
screens; it encodes a decision someone could later change system-wide (radius,
elevation, duration, control height). It stays a literal if it is geometry local to
one component or a Tailwind scale step used for layout inside a component.

Never a raw hex in a portal class: `tests/portal-tokens.test.mjs` fails on a hex
inside `[...]` anywhere under `src/app/portal` or `src/components/portal`. The only
literals left are chart constants handed to SVG attributes (`SERIES`, `RAMP`, `SEQ`,
grid and axis in `charts.tsx`; `CHART_COLORS`, `CHART_TONE`, `FUNNEL_RAMP` in the
console) and the `#000` of a CSS mask. Inline styles read `var(--color-*)`.

### 2.3 Adding a token

1. Look for an existing token whose *purpose* matches. Same value is not the test.
2. If none, add a scale step to `colors.css` only if the value is new, then the
   semantic token that names the purpose.
3. A colour that carries text or a control goes into `tests/contrast.test.mjs` with
   the surfaces it sits on.
4. Document it here in the same change.
5. Token changes are system-wide: screenshot the dashboard, one list page and one
   form page.

### 2.4 Colour roles in the portal

| Role | Value |
|---|---|
| Canvas | `mist-50` |
| Surfaces (panels, cards, sidebar, top bar) | `mist-0` with a `mist-200` ring or hairline |
| Ink / secondary / meta | `navy-900` / `mist-700` / `mist-600` |
| Control edge | `--color-border-control` (`mist-500`, 3.99:1 on white) |
| Primary action, focus, active nav | `ocean-600`; hover `ocean-700`; selected wash `ocean-50` |
| Success / warning / danger | The `status-*` roles below; never the raw `kelp` / `buoy` / `coral` steps in a class |
| Scrim | `navy-950` at 40% (modals, phone sheets), 20% (drawers from sm), 50% (phone nav) |

**Status roles** (`colors.css`, Tailwind classes `text-status-danger`,
`bg-status-danger-soft`, `ring-status-danger-line`, …). Contrast pinned in
`tests/contrast.test.mjs`.

| Role | Danger | Warning | Success | Use |
|---|---|---|---|---|
| `status-{tone}` | coral-700 | buoy-700 | kelp-700 | Text, icons, links on white or the wash |
| `-soft` | coral-50 | buoy-50 | kelp-50 | Wash behind a notice, pill or hover |
| `-line` | coral-200 | buoy-200 | kelp-200 | Rim of that wash |
| `-hover` | coral-100 | buoy-100 | | Hover on a washed button |
| `-strong` | coral-800 | buoy-800 | kelp-800 | Body text inside a wash box |
| `-mark` | coral-600 | buoy-500 | | Dots, stars, invalid edges (non-text) |
| `-on-dark` | coral-300 | | kelp-300 | Icons on the navy toast |

The console's `--adm-danger*`, `--adm-warning*`, `--adm-success*` tokens keep
serving `(console)` code.

**Text contrast.** `mist-600` is the lightest text step. `mist-500` (3.99:1) is for
icons, icon buttons, control edges and list markers; `mist-400` only for disabled
fills and decorative hairlines. Placeholders use `placeholder:text-placeholder`
(`mist-550`, 4.92:1).

**Colour is never the only signal.** Badges carry a label and, for semantic tones and
stages, an icon. Hired and Rejected also differ by lightness, so they survive
deuteranopia and protanopia.

### 2.5 Stage colour system

Pipeline stages in `colors.css` (`@theme static`, `--color-stage-{stage}-{part}`).
In-flight stages step down the ocean ramp; only the two outcomes leave it. Each stage
has `fill`, `on-fill`, `edge`, `badge-bg`, `badge-ink`, `badge-rim`, and an icon.

| Stage (record value) | Fill | Badge | Icon |
|---|---|---|---|
| New (`pending`) | white, hollow on a `mist-500` edge | white, navy ink | clock |
| Screening (`reviewing`) | `ocean-300` | `ocean-50`, `ocean-700` ink | eye |
| Submitted | `ocean-600` | `ocean-100`, `ocean-800` ink | send |
| Interview | `ocean-800` | `ocean-700`, white ink | calendar |
| Offered | `navy-900` | `navy-900`, white ink | mail |
| Hired | `kelp-700` | `kelp-50`, `kelp-800` ink | check |
| Rejected | `coral-700` | `coral-50`, `coral-700` ink | x |

Read through `stageColors()` / `stageDotStyle()` (`recruiting/model.ts`) and the
`stage-*` tones of `Badge` (`ui.tsx`). `StageChevrons` draws the pipeline as a
chevron chain: current solid, passed tinted with a check, future grey. Contrast is
pinned in `tests/contrast.test.mjs`.

### 2.6 Space, grid, breakpoints, density

Base unit 4px; Tailwind's scale. Breakpoints are Tailwind's: sm 640, md 768,
lg 1024, xl 1280, 2xl 1536.

| Measure | Value |
|---|---|
| Canvas padding (`<main>` in `PortalShell`) | 20px phones, 24px from sm, 32px from lg. Pages never pad themselves |
| Page | `Page`: 24px (`gap-6`) between blocks; `default` up to 1600px, `narrow` 64rem, `full` |
| Panel | 12px radius, 20px padding, 56px header with a hairline |
| KPI row | 16px gaps; 1 column, 2 from sm, 3 from lg or 4 from xl |
| Controls | kit `Button` 32 (`sm`) / 40 (`md`); toolbar controls 40 |
| Table rows | 44 / 56 / 68 (compact / default / relaxed), set in `DataTable` |
| Containers | Padding and gaps on 4px steps (`py-2`, `py-4`, `px-3`); half steps (`py-1.5`, `gap-1.5`) only inside badges, chips and icon atoms. Icons are `size-3.5` / `4` / `5`, never `size-[18px]` |

### 2.7 Type

General Sans (400/500/600) for text, Geist Mono for codes (`font-mono`). The whole
portal, kit and console, sizes text from one scale, `text-adm-*`: ratio 1.2 from a
14px body.

| Step | Size | Leading | Used for |
|---|---|---|---|
| `text-adm-xs` | 11.5 | 1.45 | Badges, chips, labels, group titles, table headers, meta lines |
| `text-adm-base` | 14 | 1.5 | Body, controls, table cells, descriptions, card names |
| `text-adm-md` | 17 | 1.4 | Panel, modal and drawer titles; section and empty-state headings |
| `text-adm-lg` | 20 | 1.25 | Record names in drawers, inline figures |
| `text-adm-xl` | 24 | 1.2 | Page title (`PageHeader`) |
| `text-adm-2xl` | 29 | 1.15 | KPI value (`StatCard`), score dials |

`tests/type-scale.test.mjs` fails on a literal `text-[Npx]` anywhere under
`src/app/portal` or `src/components/portal`. Body copy keeps the scale's leading
(`leading-normal` where one is set; no `leading-relaxed`); running text in help and
docs is capped at 65ch. Sentence case for titles, buttons and labels (section names
too: "Case studies", "Customer stories"). Numbers are `tabular-nums`.

### 2.8 Radius, elevation, motion

| Group | Value |
|---|---|
| Radius | Buttons, inputs, nav rows, menus 8 (`rounded-lg`) · badges 6 (`rounded-md`) · panels, stat cards, popovers 12 (`rounded-xl`) · modals 16 (`rounded-2xl`) |
| Elevation | Resting surfaces are ring-only. Menus and popovers `shadow-xl`; modals and drawers `shadow-2xl`; the batch bar `shadow-xl` |
| Motion | Backdrop fade 160ms, modal rise 200ms, drawer slide 240ms (up on phones), phone nav 220ms, sidebar width 200ms on `--ease-standard`. Skeleton shimmer 2.4s. All off under reduced motion |

### 2.9 Shell

- **Sidebar**: white, `mist-200` right hairline, 216px wide below 2xl and 240px from
  1536px. Collapsible to a 64px icon rail from a 24px round toggle on its edge; a
  stored choice (`portal.sidebar` in localStorage) wins, else it is expanded from
  1280px and a rail from 1024 to 1279px. Below lg it is an off-canvas drawer (288px,
  focus trapped). Nav is four groups (Recruiting, Relationships, Publishing,
  Workspace), filtered per role by `canAccess`. Rows are 32px, 14px medium, 16px
  icons; the active row is `ocean-700` on `ocean-50` with a 4px `ocean-600` edge bar.
  In the rail, labels become fixed tooltips and group titles become dividers.
- **Top bar**: white, 64px, sticky. Phone menu button left; on the right, search
  (an icon that opens a 320/384px field from md, a full-width field on phones;
  Ctrl K), the admin "Previewing as" pill, notifications, help, and the account menu
  with avatar, name and role. No breadcrumbs: a record or form has a `PageHeader`
  back link.
- **No top loading bar.** `NavProgressProvider` tracks navigation state but renders
  nothing; each route's `loading.tsx` skeleton is the feedback.

---

## 3. Components (atoms)

| Atom | Source | Notes |
|---|---|---|
| `Button` | `kit/Button.tsx` | `primary` (ocean fill), `secondary` (white, control-edge ring), `ghost`, `danger` (white, coral ring). `sm` 32 / `md` 40, `href` renders a Link, `loading` disables and shows a spinner without changing width, `label` names icon-only buttons. |
| `Select` | `Select.tsx` | The one select: label, options with counts, 40px. |
| `Segmented` | `ui.tsx` | Radiogroup for 2–4 views (period, metric). |
| `Badge` / `StatusBadge` | `ui.tsx` | `text-adm-xs` on a 6px-radius wash with a rim. `statusTone()` maps words to tones; green, red and amber carry check, x and timer icons; stage tones carry the stage icon. |
| `StatCard` | `ui.tsx` | Label, `text-adm-2xl` value, optional sparkline, footer line. No icon well. Optional `delta` pill: arrow, sign and percent on kelp (good), coral (bad) or mist (flat, or "No data"), with `goodWhen`. |
| `Avatar`, `ProgressBar`, `KeyValue`, `BarList` | `ui.tsx` | |
| `EmptyState` / `ErrorState` / `NoAccess` | `kit/states.tsx` | `first-use`, `no-results` (with `onClearFilters`), `plain`; `framed` when it stands alone. `ErrorState` offers retry and help. |
| `ActionMenu` | `records/Menu.tsx` | Radix overflow menu, horizontal ⋯ trigger, "More actions". |
| Icons | `icons.tsx` | One set; icon-only buttons carry `aria-label` and `title`. |
| Toasts | `toast.tsx` | `useToast()(message, { tone, undo })`; reversible actions offer Undo. |

## 4. Patterns

### PageHeader (`kit/layout.tsx`)

Title (with optional `meta` beside it), description, `actions` right from md,
`back={{ href, label }}` above the title, `tabs` below. No icon chip; the `icon` and
`section` props are accepted for old call sites and ignored.

### Actions: one primary, one secondary, the rest in ⋯

A page header, view or panel shows at most one filled button and one secondary;
everything else goes in an `ActionMenu` (⋯), placed before the primary. Delete sits
last behind a separator, styled danger. Utilities such as Refresh are icon-only
ghost buttons with a `label` and do not count.

- **Applications**: My views · ⋯ (Insights) · Add applicant.
- **Talent bench**: Lead sourcing · ⋯ (Insights) · Add profile.
- **Dashboard**: Refresh (icon) · Applications · ⋯ (State roles for sales, Resumes
  for HR) · New role.

`InsightsSheet` takes `open` / `onOpenChange` so a menu item can open it; without
them it renders its own "Insights" button.

### DataTable (`DataTable.tsx`)

- **Page is the only vertical scroller.** The table never scrolls vertically; its
  header sticks under the 64px top bar.
- **Wide tables** (wider than their box) scroll sideways inside it, with the first
  column and the actions column pinned; a seam and soft shadow appear once content
  runs under them. The header then sticks to the top of the box.
- **Columns**: `numeric` (right-aligned, tabular), `align: "center"` (status pills),
  `grow` (share of spare width, truncates), `minWidth` (floor for a grow column once
  the table overflows), `hideBelow` (`md` … `2xl`), `defaultHidden`, `card: false`.
- **Toolbar**: search, then filters inline. Up to three filters all sit inline;
  past that, two stay (or those flagged `inline`) and the rest open in a second row
  from a "Filters" button that shows the applied count. Active filters are removable
  chips. `viewSwitch` sits right after Filters; a settings menu holds columns,
  density and CSV export ("Export N as CSV").
- **Density** 44 / 56 / 68, with rows per page (10/25/50) and hidden columns, saved
  per table in localStorage (`portal.table.{storageKey}`).
- **Rows** open a `Drawer` (`renderDetail`) on click or keyboard; the last column is a
  vertical ⋮ row menu ("Row actions").
- **Selection** opens a floating navy batch bar, bottom-centre, above the page and
  under overlays; page buttons on it restyle to glass.
- **Footer**: "1–10 of N", rows-per-page, numbered pages with gaps (1 … 4 5 6 … 12).
- **`renderGrid`** replaces rows with a custom layout (cards, a board) while search,
  filters and export still apply; **`gridAll`** hands it every filtered row and hides
  the pager.
- **Phones** get one card per row.

**Applications** puts a Table / Board icon switch in `viewSwitch`; the board renders
through `renderGrid` + `gridAll`, so it lives inside the table panel under the same
toolbar and chips.

### Overlays (`kit/overlay.tsx`)

- **`useDialog`** for every overlay: focus moves in, Tab is trapped, Escape closes
  the top overlay only, the page stops scrolling, focus returns to the opener.
- **`Modal`**: sizes sm/md/lg/xl, `footer`, centred from sm, a bottom sheet on
  phones, 40% scrim. `role="alertdialog"` available.
- **`Drawer`**: the record panel. 544px from sm (`lg` 768px), on a 20% scrim so the
  list stays readable; a 92% bottom sheet on phones on a 40% scrim. `actions` in the
  header, `footer`.
- **`ConfirmDialog`**: an `alertdialog` Modal. Cancel takes focus first; `busy`
  blocks closing. `requireText` keeps confirm disabled until the typed text matches
  (trimmed, case-insensitive); `deleteConfirmText(name, count)` gives the record's
  name, "delete N" for a batch, or "delete".

### Insights

`InsightsSheet` puts a list page's charts behind an "Insights" header button in a
right sheet; `InsightsRow` lays out one primary chart (2/3) and a side visual (1/3).

### Loading, empty, error

- Every list route has a `loading.tsx` with a `ListPageSkeleton` the shape of the
  page; the dashboard uses `DashboardSkeleton`. Pages that fetch in effects render
  the same skeleton while loading. The header always renders; only the body swaps.
- Skeletons are `.kit-skel`: a `mist-100` block with one shimmer swept across the
  whole page (2.4s), static under reduced motion. Never `animate-pulse`.
- Saving puts the state on the button that started it (`loading`).

---

## 5. Role-based access

Five roles, ADMIN > HR > (RECRUITER = SALES), and MEDIA beside them (see
`CLAUDE.md` and `src/lib/auth/config.ts`). In the portal:

1. **Route and nav**: `canAccess(role, href)` (`src/lib/portal/roles.ts`) filters
   the sidebar and guards the `(console)` layout.
2. **In-content**: `RoleGate` / `useCan` (`components/portal/session.tsx`). Hide what
   a role will never use; disable, with a reason, what it may not do right now.
3. Admins can preview another role from the account menu; the API still answers as
   admin.

Always mirror the check in the API route.

---

## 6. Data visualization

Charts are hand-rolled SVG in `charts.tsx` (no charting dependency): `TrendChart`,
`BarChart`, `DonutChart`, `Funnel`, `StackedBar`, `Heatmap`, `RadialProgress`,
`Sparkline`, `Legend`.

- **Series** take `SERIES` in a fixed order (ocean-600, navy-900, ocean-400,
  mist-500, ocean-800, mist-400), never cycled; overflow is the neutral. Legends and
  filter chips beside a chart (`SegmentChips`, `ChartFilter`) colour through
  `seriesColors()` in the chart's own order (largest first), so chip and slice
  match; nothing indexes a palette with `%`.
- **Green and red are never categories**; `seriesColors()` gives Hired kelp-700 and
  Rejected coral-700 by meaning.
- `RAMP` (single-hue ocean ordinal) and `SEQ` (heatmaps, light = near zero).
- One y-axis, 2px lines, recessive grid, hover tooltips; text never wears the series
  colour.
- Every chart has an empty state; the dashboard skeleton mirrors the grid.

---

## 7. Governance

**Decision rule.** Anything visual used on two or more screens belongs in the kit.
One-off page logic stays in the page. New screens do not import from
`components/portal/console`.

**Contribution checklist:**
- [ ] No raw hex in pages; `status-*` roles, scale classes or tokens only.
- [ ] Text sizes from `text-adm-*`; text no lighter than `mist-600`.
- [ ] Kit `Button`, `Select`, `DataTable`, `Modal`/`Drawer`/`ConfirmDialog`, `EmptyState`; no hand-rolled copies.
- [ ] One primary, one secondary, the rest in ⋯.
- [ ] Focus visible on every new control; icon-only buttons have `label`.
- [ ] Role checks in the UI and the API route.
- [ ] `loading.tsx` skeleton mirrors the page; empty state says why and what to do.
- [ ] Client components never import values from AWS modules (`import type` only).

**Change management.** Component API changes keep call sites compiling (extend,
don't break; dead props are accepted and ignored, as `icon` on `PageHeader`).
Deprecate with `@deprecated`, migrate, then delete.

---

## 8. Laws of UX, how they bind here

Reference: [Laws of UX](https://lawsofux.com). Each rule below is a number or a
structural check.

### Load-bearing, violations are bugs

| Law | The rule here | Check |
|---|---|---|
| **Doherty Threshold** | Nothing waits past 400ms unannounced. Global search debounces 250ms; list search filters client-side. Slow loads show the route skeleton. | Every list route has `loading.tsx` |
| **Fitts's Law** | Controls used while reading a long record are pinned: the candidate record's identity strip sticks under the top bar. | No primary action needs a scroll round-trip |
| **Miller's Law** | ~7 peers per view. The sidebar is 18 links in four named groups. | Count peers; chunk or tab past 7 |
| **Hick's Law** | At most three filters inline; more go behind "Filters (n)". | Inline filters per toolbar ≤ 3 |
| **Von Restorff** | Filled = action, outlined or tinted = state. One filled control per surface. | One `primary` per view |
| **Postel's Law** | Liberal in: `toNumber`, `isPhone` (`src/lib/form-validation.ts`). Strict out: `validate.ts` declares accepted fields. | New routes declare a schema |
| **Tesler's Law** | Resume parsing fills name, contact, location, skills and experience. | Prefer a parse over a field |

### Structural

- **Common region / proximity.** `Panel` is the grouping device; filters live in the
  table they filter.
- **Similarity.** One stage colour per stage everywhere (§2.5); one status tone per
  word (`statusTone`).
- **Jakob's Law.** ATS conventions: list → drawer → record, record header with
  tabbed detail, right rail for metadata.
- **Destructive friction.** Delete is last in ⋯, styled danger, confirmed; high-impact
  deletes require typed text.

### Judgement

- **Aesthetic-usability**, **peak-end** (confirmations the user can act on, undo
  toasts), **paradox of the active user** (empty states carry the next action),
  **working memory** (two facts a decision needs are on screen together).

### Known open items

1. **Account-level audit log**: not built.
2. **Custom dashboard date range**: the dashboard offers presets only (7D, 30D, 90D,
   12M, All).
3. **List state across a round trip**: rows per page, density and columns persist;
   search and filters reset when you leave a list (Applications keeps saved searches).
4. **Carried-over console**: `(console)` screens still use `components/portal/console`
   (`WorkspaceButton`, `AdminCard`) instead of the kit.
