# Oceanblue site design language

The public website's design system (`/`, `/solutions`, `/careers`, resources,
legal). The admin console has its own, in `DESIGN_SYSTEM.md`, which also holds
the token rules both share (§2: tiers, naming, token-or-literal, how to add
one). Tokens live in `src/app/globals.css` (`TOKENS`, `@theme`, and the SITE /
TYPE ROLES blocks); components live in `src/components/site/`.

Pages compose roles. They never pick a raw colour, pixel size, shadow or
duration. If a page needs something the roles do not cover, add a role here
first.

---

## 1. Colour

### Roles

Each Tailwind role below is an alias of a semantic token (`text-ink` is
`--color-text-primary`, `bg-cobalt` is `--color-action-primary`), which points
at a primitive. Pages use the role; nothing references a primitive.

| Role | Token (Tailwind) | Value | Use |
|---|---|---|---|
| Surface | `bg-white` | #ffffff | Default page ground, cards |
| Surface container | `bg-paper` | #f3f6fb | Alternating sections, wells, footer |
| Surface container high | `bg-paper-deep` | #e7edf6 | Image placeholders, pressed wells |
| Inverse surface | `bg-ink` / `bg-night` | #0b1a33 | Dark bands and panels (navy) |
| On surface | `text-ink` | #0b1a33 | Headings, primary text |
| On surface variant | `text-ink-muted` | #3a4a66 | Body copy |
| On surface subtle | `text-ink-subtle` | #56637b | Meta, captions, placeholders |
| Outline | `border-line-strong` | #cbd5e3 | Inputs, outline buttons |
| Outline variant | `border-line` | #e2e8f1 | Card borders, dividers, hairline grids |
| Primary | `bg-cobalt` / `text-cobalt` | #1d4ed8 | The action colour: primary buttons, links, focus, selected state |
| Primary (pressed/hover) | `bg-cobalt-deep` | #1740ad | Hover and pressed state of primary |
| Primary container | `bg-cobalt-tint` | #eef2ff | Selected chips, soft highlights |
| Primary on dark | `text-cobalt-light` | #a9c1ff | Links and accents on navy |
| Brand | `text-brand` | #0975c1 | The logo blue: brand moments, illustration strokes |
| Brand accent | `bg-aqua` | #0cacCF | Fills and marks only. **Never text** (2.7:1) |
| Success | `text-success` / `bg-success-container` | #047857 / #ecfdf5 | Applied, operational, confirmed |
| Warning | `text-warning` / `bg-warning-container` | #92400e / #fffbeb | Time-sensitive only (deadlines) |
| Danger | `text-danger` / `bg-danger-container` | #b91c1c / #fef2f2 | Errors, destructive actions |

### 60-30-10

- **60%**: white and blue-grey surfaces.
- **30%**: navy, meaning type and one dark band per page at most (the closing panel counts).
- **10%**: cobalt, meaning actions and selection only. If cobalt is decorating something
  that is not clickable or selected, it is diluting the action colour (the Von Restorff
  effect only works if the accent is rare).

The palette is **analogous** (navy, cobalt, logo blue, aqua) with one **complementary**
warm hue (amber), reserved for urgency, so "closes tomorrow" is the only warm thing on a
page.

### Contrast (WCAG 2.2 AA, measured)

navy/white 17.4 · ink-muted/white 8.9 · ink-subtle/white 6.1 · ink-subtle/paper-deep 5.2 ·
white/cobalt 6.7 · cobalt/paper 6.2 · brand/white 4.9 · aqua/white 2.7 (decorative only).
Body text must be ≥ 4.5:1; large text and UI outlines ≥ 3:1.

## 2. Type

IBM Plex Sans. Use a **role**, not a size. Roles are fluid (375 → 1280px), so no
breakpoint variants are needed.

| Role | Class | Range | Use |
|---|---|---|---|
| Display | `type-display` | 42 → 80px | Home hero only |
| Headline large | `type-headline-lg` | 36 → 56px | Page title (h1) on interior pages |
| Headline | `type-headline` | 30 → 48px | Section title (h2) |
| Headline small | `type-headline-sm` | 24 → 32px | Sub-section title, CTA panel title |
| Title large | `type-title-lg` | 20 → 24px | Card title (h3) |
| Title | `type-title` | 17px | List item title, small card title |
| Body large | `type-body-lg` | 17 → 19px | Lead paragraph under a title |
| Body | `type-body` | 16px | Running text |
| Body small | `type-body-sm` | 14.5px | Card body, secondary text |
| Label | `type-label` | 14px semibold | Buttons, kickers, form labels |
| Caption | `type-caption` | 13px | Meta, timestamps, footnotes |

Measure: body copy 60–75 characters (`max-w-[62ch]`). Headings balance; paragraphs
use `text-wrap: pretty` (both set globally).

## 3. Space

Base 4, mostly in steps of 8. Layout spacing is tokens, read through the
constants in `src/components/site/sections.tsx`:

- `SECTION_Y` = `--space-layout-section-gap`: 64 / 80 / 96px (phone / tablet /
  desktop), on the `<section>` with `data-tone`. Two borderless sections of the
  same tone collapse the second's top padding.
- `OPENER_Y`: first block under the fixed header.
- `STACK_LG` = `--space-layout-stack-lg` (40/48) title → content; `STACK_MD` =
  `--space-layout-stack-md` (32/40) between groups.
- `CONTAINER`: `--grid-max` 1240 wide, `--space-layout-gutter` (16, 24 from sm)
  at the edges.
- Inside a component use the Tailwind scale: card padding 24px phone, 32px from tablet (compact
  cards 20/24); card gaps 16px phone, 20–24px from tablet.

## 4. Shape and elevation

| Size | Radius | Examples |
|---|---|---|
| Small controls | `rounded-xl` (12) | Inputs, icon tiles, menu items |
| Cards | `rounded-2xl` (16) | Job rows, feature cards, dropdown panels |
| Panels | `rounded-[28px]` | CTA panel, sheets, large media |
| Actions | `rounded-full` | Buttons, chips, toggles |

Elevation is navy-tinted, one light source above: **flat** (border only, the default) →
`shadow-[var(--shadow-raised)]` (hover on interactive cards) →
`shadow-[var(--shadow-overlay)]` (menus, popovers) → `shadow-[var(--shadow-modal)]`
(sheets, dialogs). Nothing sits higher than it needs to.

## 5. Motion

After Material 3. Durations: `--dur-short` 150ms (state change: hover, press, toggle),
`--dur-medium` 250ms (small movement: menus, chips), `--dur-long` 400ms (entering the
page: sheets, reveals). Curves: `--ease-standard` for most things,
`--ease-emphasized-in` for arrivals, `--ease-emphasized-out` for exits (exits are faster
than entrances).

Load: headings rise 12px. Scroll: sections reveal 16px. Everything animates transform and
opacity only, and **every animation is removed under `prefers-reduced-motion`**. Motion
explains (where a sheet came from, what changed); it never decorates.

## 6. Layout and placement

- Grid: 4 columns on phones, 8 from md, 12 from lg,
  gutter 16 then 24; container 1240px; header 1440px. Breakpoints are sm 640, md 768,
  lg 1024, xl 1280.
- **Z-pattern** for openers and the home hero: logo top-left, navigation, primary action
  top-right, then headline → supporting line → action.
- **F-pattern** for reading pages (solutions, careers, legal): left-aligned headings,
  scannable first words, key facts in the first two lines.
- One primary action per view. The buyer action is **"Talk to us"** (cobalt); the
  candidate action is **"Find a job"** / **"Apply now"**. Secondary actions are outline
  buttons or text links.
- Mobile first: design at 375px, then add columns. Touch targets ≥ 44px. The primary
  action on long mobile pages stays reachable (fixed bottom bar on job pages).

## 7. Principles we check against

Jakob (familiar patterns), Hick (few choices per decision), Fitts (big, near targets),
Miller (chunk into ≤ 7 groups), Von Restorff (one accent), Doherty (respond < 400ms:
server-render content, skeletons over spinners), Tesler (the system absorbs complexity),
Postel (accept messy input), serial position (key items first and last), peak-end
(strong close and success states), Gestalt proximity and common region (space groups
things, hairlines separate them), aesthetic-usability, and WCAG 2.2 AA.
