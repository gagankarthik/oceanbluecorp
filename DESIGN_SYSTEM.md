# Oceanblue Admin Design System

The single source of truth for how the admin app (`/admin/*`) looks, behaves, and grows.
Anatomy follows the three-layer model from
[Pencil & Paper. Anatomy of a Design System](https://www.pencilandpaper.io/articles/anatomy-design-system):
a **design layer** (principles, style, components, patterns), a **development layer**
(tokens + coded components, the part people actually use), and a **design-ops layer**
(governance, contribution, maintenance). Scope is deliberately small: this system serves
one staff-only ATS/CRM used by four roles, it does not need to rival Material or Polaris,
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

All tokens live in `src/app/globals.css`. The `TOKENS` block at the top of that
file is the source; everything below it consumes it.

### 2.1 Three tiers, one direction

| Tier | Pattern | Holds | Example |
|---|---|---|---|
| Primitive | `--p-{scale}-{step}` | A raw value with no meaning | `--p-blue-700`, `--p-space-4` |
| Semantic | `--{category}-{property}-{role}[-{state}]` | A purpose | `--color-text-danger`, `--color-action-primary-hover`, `--space-layout-section-gap` |
| Component | `--{component}-{part}-{property}[-{state}]` | A decision scoped to one element | `--button-primary-background-pressed`, `--skeleton-background` |

A component reads a semantic or component token, **never a primitive**. A
semantic token points at a primitive; a component token points at a semantic
one. That is what makes a retheme a change to one block.

A name is read left to right, general to specific, and states come last
(`-hover`, `-pressed`, `-selected`, `-disabled`, `-inverse`). If a name needs a
comment to explain what it is for, the name is wrong.

Two semantic namespaces exist, one per surface:

- **Public site:** `--color-*`, exposed as Tailwind roles (`text-ink`,
  `bg-paper`, `border-line`, `bg-cobalt`) in `@theme`. Light only, by design.
- **Console:** `--adm-{role}[-{variant}]`, light only. Declared on `:root`
  (not `.adm-scope`) so portalled dialogs, sheets and menus resolve them; the
  public site never reads them. The old dark set was unreachable and is gone.

`--hz-*` is the retired landing namespace. It survives only for the
announcement bar and the maintenance screen; do not add
to it.

### 2.2 Token or hardcoded value

It is a token if **any** of these is true: it is a colour; it repeats on two or
more screens; it encodes a decision someone could later change system-wide
(radius, elevation, duration, a control height); it must differ by theme or
density. It stays a literal if it is geometry local to one component (an icon's
18px box, a one-off illustration offset) or a Tailwind scale step used for
layout inside a component (`gap-2`, `p-4` are the base-4 primitives by another
name).

Never a raw hex, rgba, pixel font size, shadow or duration in a page.

### 2.3 Adding a token

1. Look for an existing token whose *purpose* matches. Same value is not the
   test; same meaning is.
2. If none: add the primitive only if the value is new, then the semantic
   token that names the purpose. Add a component token only when one element
   needs to diverge from the semantic default.
3. A colour that carries text or a control goes into `tests/contrast.test.mjs`
   with the surfaces it sits on. The test reads `globals.css`, so it fails when
   the token is retuned below AA (4.5:1 text, 3:1 large text and UI).
4. Document it in the table below, in the same change.
5. Review: token changes are system-wide, so the PR carries screenshots of the
   dashboard, one list page and one form page,
   and is approved by whoever owns this file.

### 2.4 Colour

| Group | Tokens | Use |
|---|---|---|
| Primitive ramps | `--p-neutral-0`, `--p-slate-50…900`, `--p-gray-50…900`, `--p-blue-50…900`, `--p-green/amber/red/rose-*`, `--p-brand-blue/aqua` | Raw material only |
| Background | `--color-background-primary / secondary / tertiary / inverse / selected` | Page, alternate section, well, dark band, selected chip |
| Text | `--color-text-primary / secondary / tertiary / inverse / interactive / brand` | Heading, body, meta, on dark, link, logo blue |
| Border | `--color-border-default / strong / interactive / focus` | Card, input, hover edge, focus ring |
| Interactive state | `--color-action-primary`, `-hover`, `-pressed`, `--color-action-on-primary`, `--opacity-disabled`, `--color-background-selected`, `--color-border-focus` | Default, hover, pressed, disabled, selected, focused, on every filled action |
| Feedback | `--color-text-{success,warning,danger,info}` with `--color-background-{…}` | Alerts, validation, badges, status |
| Console | `--adm-accent`(`-strong`/`-soft`/`-tint`), `--adm-canvas`, `--adm-surface`(`-2`/`-sunken`), `--adm-line`(`-soft`/`-strong`/`-input`), `--adm-ink`(`-mute`/`-subtle`), `--adm-success/warning/danger/info` with `-ink` (text) and `-soft` (tint), `--adm-scrim` | Same roles. `--adm-line` is a decorative hairline (1.2:1); a control's edge uses `--adm-line-input` (3.4:1). Every overlay dims with `--adm-scrim`. |

**Brand.** Cobalt (`--p-blue-700`, 6.7:1 under white text) carries every text
and interactive role. Logo blue passes for text (4.9:1). Aqua is 2.7:1 on
white, so it is restricted to fills and marks.

**Contrast.** Measured pairs are in SITE_DESIGN_LANGUAGE.md §1 and asserted for
the console in `tests/contrast.test.mjs`. Status colours have a separate `-ink`
shade because a tone tuned as a fill fails as text, and a tinted background
eats contrast again.

**Colour is never the only signal.** A status is a dot or icon *and* a text
label (`StatusBadge`), an error is an icon and a sentence, a sorted column has
an arrow. Red/green pairs (hired/rejected) therefore survive deuteranopia and
protanopia; check any new state in greyscale before shipping it.

### 2.5 Space, grid, breakpoints, density

Base unit 4px. Primitives `--p-space-1 2 4 6 8 10 12 16 20 24` = 4, 8, 16, 24,
32, 40, 48, 64, 80, 96; the step is the multiple, so it matches Tailwind
(`p-4` = `--p-space-4`).

Two scales, kept apart on purpose:

| Scale | Tokens | For |
|---|---|---|
| Component | Tailwind's scale (`p-2 3 4 6`, `gap-1 2 3 4`), which is the same base-4 steps | Padding and gaps *inside* a component |
| Layout | `--space-layout-gutter` (16 → 24), `--space-layout-section-gap` (64 → 80 → 96), `--space-layout-stack-md` (32 → 40), `--space-layout-stack-lg` (40 → 48) | Distance *between* components; steps up with the breakpoint |

Breakpoints, shared with design: **sm 640, md 768, lg 1024, xl 1280**
(`--breakpoint-*` in `@theme`; use the Tailwind prefixes, never a bare pixel
media query).

Column grid, built with Tailwind's `grid-cols-*` inside `CONTAINER`:

| Breakpoint | Columns | Gutter | Margin |
|---|---|---|---|
| below md | 4 | 16 (24 from sm) | `--space-layout-gutter` |
| md | 8 | 24 | 24 |
| lg and up | 12 | 24 | 24, content capped at `--grid-max` 1240 |

Density, console data grids only (`data-density` on the grid, a user setting
that persists): **compact 44 · default 56 · relaxed 68** row height
(`--adm-row-h-*`). Only vertical rhythm changes; type size does not.

Vertical rhythm: control heights are 32/36 in the console and `--size-control-lg/xl` = 40/48 on the site,
and row heights 44/56/68, all multiples of 4, so stacked controls and rows land
on the same beat.

### 2.6 Other console tokens

| Group | Tokens | Use |
|---|---|---|
| Charts | `CHART_COLORS`, `SERIES` in theme.ts | See §6 |
| Elevation | `--adm-shadow-sm/md/lg/pop` | Card → popover → modal |
| Motion | `--adm-ease`, `--adm-duration-fast/base` | One easing curve everywhere |
| Radius | `--adm-radius-xs` 4 · `-control` 6 · `-chip` 6 · `-input` 8 · `-card` 8 · `-dialog` 12 | Hairline affordances · buttons, nav rows, menu items · badges and tags · fields · cards, panels, popovers, the BrandBand · modals and the command palette |
| Loading | `--skeleton-background/radius/duration`, `--content-enter-duration` | See "Loading" under §4 |

Type ramp (Geist Sans, set on `.adm-scope`): page title 21px semibold · headline
figures 22–26px semibold, tight tracking · card title 14.5px semibold · body 13.5–14px ·
labels/hints 12–12.5px. **Sentence case everywhere, no uppercase tracked
micro-labels.** Numbers always `tabular-nums`. Buttons, selects and toolbar controls
36px (`h-9`). Radius comes from the `--adm-radius-*` scale above, never a literal;
status badges are pills.

Greys are one cool family (`#101828` ink, `#475467` mute, `#606a7e` subtle), all
AA on white, the `#f5f7fa` canvas and `--adm-surface-2`; `tests/contrast.test.mjs`
enforces it with a 0.05 margin, so a pair sitting on 4.50 fails.

On the cobalt band, text is white at 85% or more (5.3:1); the selected figure
cell carries a white underline bar and `aria-pressed`/`aria-current`, because its
darker fill alone is only 1.3:1 from its neighbours. Focus inside the band
(`.adm-on-band`) is a white outline, not the accent.

Shell: white 240px sidebar (64px rail, collapsed by default under 1440px) and
white 60px top bar frame a grey workspace. Navigation recedes: brand colour
appears only in the full-colour logo (favicon in the rail) and the active item
(cobalt on a cobalt tint with a 3px edge bar, 6.1:1). Search centred, account
top-right, no breadcrumbs. Content sits flush on the canvas (`p-4 sm:p-5 lg:p-6`).

**Not generic:** no tinted icon squares on KPI cards or list rows, no gradients or
glows. Figures lead; hierarchy comes from type scale and hairlines. Density lives
in the shared atoms so tightening is a one-place change, not a per-page edit.

---

## 3. Components (atoms)

**Reuse `src/components/ui/` (shadcn) for base primitives, do not fork parallel admin
copies.** The ui library is themed to navy `--primary` + cyan `--ring`; the admin language
is cobalt + slate, so apply a cobalt override class at the admin call site (see
`PageHeaderButton` and the `checkboxCobalt` const in `data-table.tsx` for the pattern).
Admin-specific atoms that have **no** ui equivalent live in `src/components/admin/`.

| Atom | Source | Notes |
|---|---|---|
| Button | `WorkspaceButton` (`workspace.tsx`) | The one console button: `primary` (one per view), default, `ghost`, `danger`, and `asChild` for links. Never fork a button. |
| Checkbox | `ui/checkbox.tsx` | Supports `indeterminate` (DataTable select-all); pass the cobalt override class. |
| DropdownMenu / Sheet / Tooltip | `ui/*` | Use these; don't recreate. Inputs and selects are the form primitives below; cards are `AdminCard`. |
| `EmptyState` | `admin/empty-state.tsx` | Icon well + title + why + optional action. No ui equivalent. |
| `Sparkline` | `admin/sparkline.tsx` | Pure-SVG trend shape, no axes/tooltip. No ui equivalent. |
| `StatusBadge` | `admin/status-badge.tsx` | Status text + tone from `statusMeta`. Sentence case, dot + tinted pill; the label is always rendered, so status never rests on colour alone. Tones per lifecycle: New sky, Screening cobalt, Submitted indigo, Interview violet, Offered amber, Hired emerald, Rejected rose; job Draft sky, Active emerald, On hold amber, Closed slate (ended, not rejected). |
| `PeriodSwitcher` | `admin/charts.tsx` | The segmented control (date ranges, small view toggles). |
| `StarRating` | `admin/star-rating.tsx` | , |
| Form controls | `admin/forms/primitives.tsx` | `FormInput`, `FormSelect`, `FormTextarea`, `MoneyInput`, `Field`, `FormSection`, admin-form-specific wrappers. |

## 4. Patterns (components composed to solve a problem)

| Pattern | File | Solves |
|---|---|---|
| `PageHeader` | `page-header.tsx` | Title + subtitle + meta chips + actions on every page. |
| `AdminCard` / `AdminCardHeader` | `admin-card.tsx` | The canonical surface. |
| `SearchInput`, `FilterToggle`, `ViewSwitcher`, `BulkBar` | `toolbar.tsx` | The list-page toolbar kit. |
| `FilterChips` | `filter-chips.tsx` | Active filters stay visible & dismissible. |
| `DataTable<T>` | `data-table.tsx` | Sortable, selectable, paginated table with built-in loading skeletons and `EmptyState`. Numbers right-aligned; secondary columns `hideBelow`. |
| `AssigneePicker` | `forms/primitives.tsx` | Search + chip multi-select. |
| `AdminDialog` | `admin-dialog.tsx` | Every console modal. Radix Dialog: focus trap, Escape, scrim click, focus return, labelled by its title. Sizes `sm/md/lg/xl`, a `footer` slot, `actions` in the header, `busy` blocks dismissal. A form in the body pairs with a footer submit via `form="id"`. Guard unsaved work by gating `onOpenChange(false)` behind a "Discard changes?" `ConfirmDialog`. |
| `ConfirmDialog` | `confirm-dialog.tsx` | Confirmations on `AdminDialog` (`alertdialog`), Cancel focused first, `WorkspaceButton` `danger` for destructive. |
| `CommandPalette` | `command-palette.tsx` | Global ⌘K navigation/search. Combobox: input owns `aria-activedescendant` over a grouped listbox. |
| `HeaderSearch` | `header-search.tsx` | The centred top-bar search, same combobox pattern, inline results. |
| Skeletons | `skeletons.tsx` | Loading mirrors layout. See below. |

**Canonical list page** = `PageHeader` → stat strip (optional) → `AdminCard` toolbar
(`SearchInput` + `FilterToggle` + `ViewSwitcher` + `BulkBar`, `FilterChips` below) →
`AdminCard` + `DataTable`. Reference implementation: `/admin/contacts` (migrated).

### Loading

A skeleton (`skeletons.tsx`, the `.skel` class) is used when a view takes long
enough to notice: a route's `loading.tsx` or a first fetch. Anything that
resolves at once shows nothing, and an action on an existing view (save,
delete) puts its state on the button that started it, not over the page.

- **Mirrors the layout.** Same blocks, same sizes, same order as the content,
  so nothing moves when it lands. When a screen's layout changes, its skeleton
  changes in the same commit.
- **Flat and neutral.** `--skeleton-background`, no border, no shadow, radius
  `--skeleton-radius`. One quiet pulse (`--skeleton-duration`), off under
  reduced motion.
- **Says what is loading.** The skeleton root is `role="status"` with a
  specific label ("Loading candidates"), passed through the `label` prop.
  "Loading" alone is the fallback.
- **Hands over with a fade.** Content entering `#adm-main` fades in over
  `--content-enter-duration`.
- **Spinners** (`Loader2`) are for an in-flight button only, next to a verb
  ("Saving…"), inheriting the button's text colour so they read on any ground.

---

## 5. Role-based access & complexity

Hierarchy (in `src/lib/auth/config.ts`): **ADMIN > HR > (RECRUITER = SALES)**; `role`
may be `null` (authenticated, no access). Three gating altitudes:

1. **Route** , `ProtectedRoute requiredRoles` (layout) + `routeAccess`.
2. **Navigation** , `roles` arrays on `NAV_GROUPS` items (layout). A role's sidebar *is*
   its complexity budget: recruiters/sales see Recruitment only; HR adds CRM; admins add
   Administration. Don't add nav items visible to all roles by default, start narrow.
3. **In-content** , `RoleGate` / `useCan` (`role-gate.tsx`):
   - `mode="hide"` (default) when the role will *never* use it (admin settings inside a
     shared page). Removing beats disabling, fewer dead controls, calmer screens.
   - `mode="disable"` when the capability exists for the role but isn't currently
     permitted; preserve layout, pair with a `Tooltip` saying why.

Always: server-side check in the API route too. UI gating is UX, not security.

---

## 6. Data visualization

Strategy for dashboards (implemented in `/admin`):

1. **Layered altitude.** Row 1: the KPI band (value + delta), answer
   "is anything wrong?" in 5 seconds. Row 2: behavior over time (area chart) + composition
   (donut). Row 3: process diagnostics (funnel, sources, leaderboards). Row 4: work queues
   ("Needs attention", recent items), every insight ends in a clickable action.
2. **Chart choice.** Trend → area/line; composition at a point → donut (≤7 segments,
   merge the tail into "Other"); stage conversion → funnel with explicit % between stages (hovered band zooms, siblings recede);
   ranking → horizontal bars; tiny trend in a card/cell → `Sparkline`. No 3D, no dual axes,
   no pie with >7 slices.
3. **Color discipline.** Series 1 is always cobalt (`SERIES.primary`); emerald is reserved
   for success/hired, rose for rejected/failure, amber for at-risk, slate for "other".
   Categorical palettes come from `CHART_COLORS` **in order**, never invent hex values
   in a page.
4. **Annotation over legend-hunting.** Put numbers on the chart (funnel counts, conversion
   pills); axis labels 10px slate-400; gridlines horizontal-only, slate-100.
5. **Performance.** Every chart is hand-rolled SVG (`charts.tsx`); there is no charting
   dependency in the bundle. Aggregate in `useMemo` off one fetched dataset rather
   than re-fetching per widget. Respect `prefers-reduced-motion` (`useReducedMotion`)
   for entrance animation; count-ups and bar fills are decorative only.
6. **Empty & loading.** Every chart has a designed empty state; the dashboard skeleton
   mirrors the final grid.

---

## 7. Governance & maintenance (design-ops layer)

**Decision rule.** Anything visual used (or usable) on 2+ screens belongs in
`src/components/admin/` and consumes `--adm-*` tokens. One-off page logic stays in the page.

**Contribution checklist** (PR review gate for admin UI):
- [ ] No raw hex/rgba in pages, tokens or `theme.ts` constants only. A new token followed §2.3.
- [ ] Reused `ui/` primitives (Button, Checkbox, Select, …) with a cobalt override class, did NOT fork a parallel admin copy.
- [ ] No hand-rolled buttons, search inputs, badges, empty states, or tables, use §3/§4.
- [ ] New status/tone added to `theme.ts` (`statusMeta`/`tones`), not inline.
- [ ] Focus ring (`--adm-focus-ring`) visible on every new interactive element; icon-only
      buttons have `aria-label` or `Tooltip`.
- [ ] Role checks via `RoleGate`/`useCan` + matching API-route authorization.
- [ ] Loading skeleton mirrors layout; empty state says why + what to do.
- [ ] Client components never import values from AWS modules (`import type` only).

**Change management.** Token changes = system-wide, need a screenshot pass of dashboard,
one list page, one form page. Component API changes must keep existing call sites compiling
(extend, don't break). Deprecations: mark with `@deprecated` JSDoc, migrate call sites,
then delete, no parallel duplicates.

**Migration backlog** (legacy → system, in this order of payoff):
1. Replace hand-rolled search/filter toolbars with the `toolbar.tsx` kit. DONE across all pages: contacts, clients, vendors, resumes, users, applications,
   jobs, bench, jobs/[id] (SearchInput/FilterToggle/ViewSwitcher/BulkBar/FilterChips).
2. Replace inline empty states with `EmptyState`. DONE on migrated pages (incl. jobs/[id]).
3. Replace ad-hoc tables with `DataTable` where columns are simple cells (optional; the
   complex multi-view tables on applications/jobs/bench keep their bespoke rendering).
4. Replace remaining `--hz-*` references in admin pages with `--adm-*`.
5. Modal forms on `Field`/`FormInput`/`FormSelect`. DONE: clients, vendors.
6. Hand-built `fixed inset-0` modals onto `AdminDialog`. DONE: clients, vendors, users,
   api-keys, help, resumes preview, job-form (add client, add vendor, preview).

**Health metrics.** Adoption = count of hand-rolled search inputs remaining
(`grep 'placeholder="Search' src/app/admin` → should trend to 0); consistency = no new
hex values in `src/app/admin` diffs; bundle = `@aws-sdk` count in `.next/static` stays 0.

---

## 8. Laws of UX, how they bind here

Reference: [Laws of UX](https://lawsofux.com), Jon Yablonski. Listing a law is
worthless; what follows is the **rule this codebase enforces** because of it, and
the measurement that says whether we still comply. Anything unmeasurable is a
slogan, so each rule below is either a number or a structural check.

Audited 2026-08-07 against the admin app.

### Load-bearing, violations are bugs

| Law | The rule here | Check |
|---|---|---|
| **Doherty Threshold** | No interaction waits on us past 400ms without saying so. Search debounce is 250ms (lists) / 200ms (global). Anything slower gets a skeleton that mirrors the final layout, never a spinner in a void. | `useDebouncedValue` default ≤ 250; long fetches render `skeletons.tsx` |
| **Fitts's Law** | A control used while reading a long record is pinned, not parked at the top. The candidate record scrolls ~4,100px, so identity, stage and the primary action ride in a sticky header. | No primary action may require a scroll round-trip to reach |
| **Miller's Law** | Max ~7 peer items in one view. The candidate record was 10 stacked cards under one tab; it is now 5 labelled tabs. Sidebar is 22 links in 3 named sections, never a flat list. | Count peers per view; if > 7, chunk or tab |
| **Hick's Law** | One control per decision, not one per dimension. The applications toolbar was 4 filter pills + an "Advanced" drawer of 4 more; it is now a single `FilterMenu`. | Count filter controls in a toolbar: 1 |
| **Von Restorff** | **Filled = action. Outlined or tinted = state.** Exactly one filled control per surface. This is what stops semantic colour (red "Unclaimed", green owner, stage tints) from cancelling the primary action out, they are different *kinds* of thing, not competing buttons. | One `variant="primary"` per view |
| **Postel's Law** | Be liberal inbound: ownership matches on email *or* id, case-insensitively (`isOwnRecord`). Conservative outbound: `validate.ts` declares accepted fields; undeclared ones cannot reach a record. | New routes declare a schema |
| **Tesler's Law** | Irreducible complexity belongs to the system, not the user. Resume parsing extracts name, contact, location, skills and experience so nobody retypes a document we can read. | Prefer a parse/derive over a field |

### Structural, followed by construction

- **Law of Common Region / Proximity / Uniform Connectedness.** `AdminCard` is the
  only grouping device. Related fields share one card; unrelated fields never do.
  Hairlines separate bands *within* a card, whitespace separates cards.
- **Law of Similarity.** One status colour per state everywhere it appears,
  `statusColor()` is the single source, so a stage is the same colour in the rail,
  the badge, the list cell and the dropdown.
- **Jakob's Law.** ATS conventions are kept deliberately: record header with
  tabbed detail, right rail for metadata, list → detail navigation. Novelty is
  spent on the marketing site, not here.
- **Chunking.** Long forms are titled sections (`AdminCardHeader`), never one
  continuous field list.
- **Selective Attention.** Empty fields are not rendered as data. A grid of nine
  cells with four em-dashes made the reader parse four cells to learn nothing;
  they collapse behind one line that says how many are missing.
- **Zeigarnik Effect.** That same line is the open loop , "4 fields are not
  recorded" states an incomplete task rather than hiding it.
- **Goal-Gradient.** The pipeline stepper shows position and distance to hire;
  progress bars fill toward a stated end.

### Judgement, no automatic check

- **Aesthetic-Usability Effect.** Justifies polish, never at the cost of the rules
  above. Decoration that competes with data loses: four marketplace background
  effects were removed from the marketing site for exactly this reason.
- **Peak-End Rule.** The end of a flow is a confirmation the user can act on, not
  a silent redirect.
- **Paradox of the Active User.** Nobody reads instructions. Empty states carry
  the next action as a button; hints sit inside the control they describe.
- **Cognitive Load / Working Memory.** Never make the user hold a value across a
  scroll. If a decision needs two facts, both are on screen together.

### Known open items

1. **Choice Overload, `FilterMenu`.** Consolidating eight filters into one control
   fixed Hick's at the toolbar and moved the cost inside the menu. Acceptable while
   the fields stay labelled and scannable; if a screen needs more than ~8, group
   them or make the menu two-column. Watch it.
2. **Checklist gaps, recorded rather than implied.** Not yet built: typed
   confirmation for irreversible deletes (`ConfirmDialog` has no `requireText`);
   an account-level audit log; a custom date range on the dashboard; date
   grouping on the notifications list; list filters surviving a round trip to
   a record; the pinned first column (`pinFirstColumn`) switched on for the
   wide grids; exports that name how many rows they hold; the Notifications
   tab in settings, which is disabled until it has a backend.
3. **Tables scroll the page, not themselves.** `DataTable` already has everything
   needed to scroll internally, an `overflow-auto` container, a `maxHeight` prop,
   and a sticky `thead` (`.adm-grid thead th`, in `globals.css` rather than the
   component, which is easy to miss). What is missing is at the page level: list
   pages do not bound its height, so the whole page scrolls and the header sticks
   to nothing. Converting a page means making it `h-full min-h-0 flex flex-col`
   so the table becomes the scrolling element. Not yet done on any page.
