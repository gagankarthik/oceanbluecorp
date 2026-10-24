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

Statuses are coded as Plane codes states (Oct 2026). Every status belongs to one of
five groups, drawn by `StateIcon` (`kit/state-icon.tsx`) as a 14px circle:

| Group | Mark | Token | Used for |
|---|---|---|---|
| backlog | dashed grey ring | `--color-state-backlog` (`mist-500`) | New, draft, archived, on hold, closed |
| unstarted | plain blue ring | `--color-state-unstarted` (`ocean-600`) | open (internal), invited, unread |
| started | amber ring, filling as it advances | `--color-state-started` (`buoy-600`) | Screening 25%, Submitted 50%, Interview 70%, Offered 90%; live postings |
| completed | green disc, tick | `--color-state-completed` (`kelp-700`) | Hired, placed, responded |
| cancelled | red disc, cross | `--color-state-cancelled` (`coral-600`) | Rejected, lost, revoked |

Badges are Plane's property pills (`STATE_PILL`): neutral, bordered, navy text, the
colour carried by the state icon (stages, `StatusBadge`) or a dot (label tones). Maps:
`STAGE_STATE` / `stageState()` and `JOB_STATE` in `recruiting/model.ts`, `statusState()`
for free-text statuses. The pipeline tokens (`--color-stage-{stage}-{part}`, `@theme
static`) follow the same groups: in-flight stages fill `buoy-600` with `navy-950` text,
Hired `kelp-700`, Rejected `coral-700`, New hollow on `mist-500`. `StageChevrons` draws
the chain from them. Contrast is pinned in `tests/contrast.test.mjs`.

| Radius | Buttons, inputs, nav rows, menus 8 (`rounded-lg`) · badges 6 (`rounded-md`) · panels, stat cards, popovers 12 (`rounded-xl`) · modals 16 (`rounded-2xl`) |
| Elevation | Resting surfaces are ring-only. Menus and popovers `shadow-xl`; modals and drawers `shadow-2xl`; the batch bar `shadow-xl` |
| Motion | Backdrop fade 160ms, modal rise 200ms, drawer slide 240ms (up on phones), phone nav 220ms, sidebar width 200ms on `--ease-standard`. Skeleton shimmer 2.4s. All off under reduced motion |

### 2.8b Portal consistency rules (Oct 24 2026)

Every portal screen follows these; a new screen that breaks one is a bug.

1. **Width.** All pages start at the same left edge and use the full width. Only focused
   single-task forms (job posting, add/edit applicant) centre at `Page width="narrow"`;
   the article editor caps at 1360px. Loading skeletons match their page's width.
2. **Ground.** Lists and forms sit on the white surface. Pages built from cards
   (dashboard, candidate, contact, help) use `Page tinted`, a light grey ground, so the
   white cards carry the focus. The sidebar is the canvas grey; the current page is a
   white tab with the accent icon.
3. **Tables.** One style: `DataTable` (or a grid built to its spec), 44px rows, row
   rules only, never column lines. A list page is the table edge to edge; a table inside a
   page sits in a bordered box.
4. **Tabs.** One active state everywhere: a 2px `ocean-600` underline and semibold ink;
   inactive tabs muted (`mist-600`).
5. **Side sheets.** Open with what the record is (name or title) and how to reach it
   (email, phone). Properties as `KeyValue` rows with icons. Long text (descriptions,
   messages, notes, excerpts) in `ClampText` with "Show more". Actions always in
   `PeekFooter`, pinned to the sheet's bottom, never at the end of the scroll.
6. **Controls.** 32px in headers and toolbars (buttons, search, dropdowns, date fields),
   6px corners; 40px form fields; cards and panels 8px corners.
7. **No duplication.** A fact appears once per view (a count, a status, a contact detail).

### 2.9 Shell

Plane's layout (Oct 2026): a canvas (`bg-shell`, `mist-50`; `#0e0e0e` dark) holding a
52px top bar and, inset 8px left, right and below, one rounded (`rounded-lg`), bordered
white work surface with the sidebar and the page side by side.

- **Top bar** (on the canvas, sticky): sidebar toggle and workspace mark left, search
  centred (a 364px field from md that opens to 554px from lg; an icon on phones;
  Ctrl K), then "Previewing as", notifications, theme and the account avatar. 32px
  ghost icon buttons.
- **Sidebar** (inside the surface, sticky under the top bar): 250px, drag its edge
  between 220 and 350px (`portal.sidebar-width`); the top-bar toggle hides it
  (`portal.sidebar-hidden`) from its one toggle, in the top bar right of the logo, whose icon shows the direction. Four
  collapsible groups (`portal.nav-closed`), 28px rows with 16px Lucide icons, the
  current page on a `mist-100` fill. Help sits in its 48px footer. Below lg it is an
  off-canvas drawer.
- **Page header** (`PageHeader`, every non-list page): a 44px bar pinned to the top of the
  page, the trail (Clients › Acme) ending in the title, status beside it, actions right
  at the 32px control size. Record pages pass `hero` and `leading` (an avatar): the
  name then also shows large on the page with its badges and the line under it.
- **Settings**: a section nav on the left (sticky); each section a two-column row,
  title and description left, fields right, hairlines between.
- **Record pages** (job detail first, Plane's work-item page): the 44px header with
  breadcrumbs (`ListHeader crumbs`) and actions right (View posting, Edit, ⋯); a main
  pane (ID, the title as h1, stage chips with state icons, underline tabs, content,
  max 50rem); a 360px properties rail from lg, sticky under the top bar, with
  `KeyValue narrow` rows (icon, label, value; a blank reads "Not set · Add" for
  editors) and the Team section. Status, place and terms show once, in the rail.
- **Side sheets** use `PeekTitle`, `KeyValue` rows with icons (stage as an inline
  state select, rating inline), `PeekSection` blocks, and `PeekFooter` for actions
  pinned to the sheet's bottom edge.
- **Notifications** dropdown: header with the unread count, mark-all-read and open-all
  icons; All / Unread tabs; rows with an icon chip, the title (bold while unread), a
  two-line message, time and an unread dot; "View all notifications" footer.
- **Account menu**: name, email and role, then Account settings, HR portal (admin, HR),
  View portal as (admin), and Sign out set apart.
- **Theme switch** crossfades the page for 200ms through the View Transitions API,
  instant under reduced motion.
- **Icons** are Lucide at a 1.75 stroke, in both `icons.tsx` and `console/icons.tsx`.
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
| `MarginPreview` / `FeePreview` | `fields/money.tsx` | Margin judged against the job's `targetMarginPct` (default 20, `src/lib/margin.ts`): at or above target `status-success` + check, positive but short `status-warning` + alert "Below target (20%)", zero or below `status-danger` + alert "Loss". Markup on pay sits beside margin on bill; never green for merely positive. `FeePreview`: `feePct` of the annual salary midpoint, "Fee ≈ $X". Commercial: render only for `canPrice`. |

## 4. Patterns

### Job editor (`records/JobForm.tsx`)

`/portal/jobs/new` and `/portal/jobs/[id]/edit`. A simple stepped flow, centred
in `Page width="narrow"`, one panel with no boxes inside it.

- **Steps**: Basics → Posting → Pay and deadline → Internal (recruiting roles
  only; media has four steps) → Review. `Stepper` (`form-steps.tsx`) joins the
  markers with a track from lg; below lg it reads "Step n of N" with a bar.
  Steps already reached are clickable; nothing skips past a step with a blocking
  error. `?step=n` keeps the place on refresh. A step change moves focus to its
  heading.
- **Actions**: Back (ghost) and Next (primary) in a sticky footer. Save draft is
  the one secondary, in the header, on every step. Publish appears only on
  Review, with a plain "Save as internal (not on website)" link beside it. Edit
  mode: Save changes in the header (secondary) and as the Review primary; status
  is a neutral menu beside the title and applies on save.
- **Fields**: about five per step. Basics: title, practice (grouped), job type,
  workplace beside role type (State / Open, defaulting to the list the form was
  opened from), city, state. Posting: the three public sections, an "Insert
  template" link (`lib/job-templates.ts`, fills only empty sections), skills.
  Pay and deadline: apply-by, basis (follows the job type until a figure is
  typed), range, "Show pay on posting" (off by default). Internal: client,
  vendor, then bill and pay with `MarginPreview` (contract) or fee with
  `FeePreview` (permanent); notes, manager and assignees under "Add more details".
- **Validation**: `useFormErrors(…, ids, { touched: true })` checks a field
  when it is left and clears its error on change; Next runs `validateSome` for
  that step only. Untouched required fields say "Required" in mist.
- **Review**: up to three suggestions from `lib/job-quality.ts` (plain lines
  with an icon, each opens its step and field), then the posting drawn by the
  site's `JobPostingView` in a URL-bar frame at 80%. The module loads only when
  Review opens.
- **Autosave**: quiet "Saved 2:14 pm" in the header (`aria-live`). New roles
  back up to localStorage (`portal.jobDraft.<user>.<category>`) with a one-line
  Restore / Discard on return; draft records PUT in place after 1.5s; live and
  open records only back up locally.
- **Starts**: "Copy an existing role" link beside the title (last 20 from the
  cached job list, `?from=`); `?fromContact=` seeds title, client and an
  internal note from an enquiry (`jobDraftFromContact`).
- **After saving**: a confirm that names the suggestions left before going
  live, then `JobCreatedDialog` with Copy link, Share on LinkedIn and Find
  matches now (starts the saved bench ranking for the job).

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
- **Dashboard** (Plane's home, Oct 2026): the 44px header with Overview / Team
  performance tabs, a date-range dropdown (`MenuSelect`), Refresh (icon) and New role.
  No shortcuts to other lists: the sidebar already has them. The page opens with
  "Good morning, <name>" (the h1) and today's date, then the four headline figures in
  one ruled strip (each opens its list), then flat sections (a muted title over one
  bordered body): Applications and hires, Needs attention, Hiring funnel, My tasks,
  Insights (tabs), Recent applications. A number appears once on the page.
  Redesigned again the same day: two flowing columns (Hiring activity with series toggles
  and a crosshair readout, Pipeline conversion with stage-to-stage rates and median wait,
  flagged past the stall limit; Needs attention, Roles at risk, My tasks), then Source
  effectiveness (sortable) beside Recent activity (arrivals and stage moves, who moved
  whom), then Insights. Chart colours: slot 1 `#1580c8`, hired `#0e8a4f`, rejected
  `#d9452c`, validated together on both surfaces with the dataviz script; single
  measures stay one hue, no donuts.

`InsightsSheet` takes `open` / `onOpenChange` so a menu item can open it; without
them it renders its own "Insights" button.

### DataTable (`DataTable.tsx`)

- **Page is the only vertical scroller.** The table never scrolls vertically; its
  header sticks under the 44px top bar. A `fill` table (list pages) fills the work
  surface instead and scrolls its rows under a fixed header.
- **Header** (`kit/list-chrome.tsx`, Plane's): a 44px bar with the section breadcrumb,
  a count chip ("9 of 15" while filtered) and underline tabs, then the layout switch,
  search icon, **Filters** (a 300px panel: search, one collapsible section per filter,
  counts), **Display** (property chips for columns, order by, row height, export) and
  the page's actions. Applied filters show as a row of removable chips with Clear all.
- **Rows** are 44px (36 compact, 56 relaxed) with hairline column rules; checkboxes
  appear on hover and stay once anything is selected.
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

Job fields follow the same split. `JOB_COMMERCIAL_FIELDS` (`config.ts`) lists
what media never reads or writes: rates, `feePct`, `targetMarginPct`, client,
client notes, `sourceContactId`, vendor and assignees. `skills` and `showPay`
are public-side: media edits them, and the careers site shows the salary only
when `showPay` is true (`toCandidateJob`, `toFeedJob`, `jobPostingJsonLd` in
`src/lib/job-jsonld.ts`). "Create role from enquiry" sits in the contacts row
menu and the contact record ⋯ menu for hiring enquiries only, and opens
`/portal/jobs/new?fromContact=<id>`; the draft (`jobDraftFromContact`,
`src/lib/job-from-contact.ts`) puts the enquiry in internal client notes, never
public copy.

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
