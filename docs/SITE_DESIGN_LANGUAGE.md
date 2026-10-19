# Oceanblue site design language

The public website (`/`, `/services`, `/industries`, `/careers`, `/jobs`,
resources, legal). The portal has its own system, in `DESIGN_SYSTEM.md`. Colour
lives in `src/styles/colors.css`; type, motion and button utilities are in the
"Website redesign v2" block at the end of `src/app/globals.css` plus the
`.btn-fill` family; components are in `src/components/site/` and
`src/components/visuals/`.

Pages use palette classes from `colors.css` (`bg-ocean-600`, `text-mist-600`),
never a hex. Literal hex stays only where CSS cannot reach: the OG/icon image
generators, `manifest.ts`, the `themeColor` in `layout.tsx`, `global-error.tsx`
(renders without the stylesheet), and the swatch values printed on the brand and
media-kit pages.

The old cobalt site's CSS is gone from `globals.css`: the `--color-*` semantic tier
and its `--p-slate/gray/blue/…` primitives, the legacy Tailwind colour aliases
(`ink-muted`, `paper`, `line`, `cobalt`, `brand`, `aqua`, `night`, `success`,
`warning`, `danger` and containers), `--p-text-*`, `--type-*` and the `type-*`
utilities, `--space-layout-*`, `--grid-max`, `--measure-prose`, the
`--size-control-*` / `--button-*` / `--input-*` component tokens, the HORIZON block
(`--hz-*`, `.horizon`, `.hz-*`), and the `.site`, `.rise`, `.word`, `.menu-in`,
`.side-sheet`, `.marquee`, `.grid-beam`, `.geo-art`, `.reveal`, `.timeline-fill`,
`.chamfer`, `.logo-in/out`, `demo-*`, `nf-*`, `mt-*`, `er-nudge` and `ann-*` rules.
Status colour on the site uses the `kelp` / `buoy` / `coral` scales directly.

`colors.css` names the site's muted and accent roles `--color-site-muted` and
`--color-site-accent`: `--color-muted` and `--color-accent` belong to the shadcn
primitives in `components/ui` (they alias the console tokens). `--color-ink` is
navy-900.

---

## 1. Colour

### Scales (`colors.css`)

| Scale | Steps | Role |
|---|---|---|
| `mist` | 0–700 | Cool neutral: grounds, hairlines, muted text. 500 (3.99:1 on white) is for edges and marks only; 550 (4.92:1) is the lightest text step |
| `tide` | 100–800 | Pale shallows: the lightest coloured field, hover fills |
| `cyan` | 100–700 | Logo cyan (500 = #0caacf). Fills and actions on dark fields; navy text on it |
| `ocean` | 50–900 | Logo blue (600 = #0a72c0). Brand block and primary action; links use 700 |
| `navy` | 600–950 | Deep water: running ink (900) and dark fields (900, 950) |
| `buoy` | 50–700 | Status only: warnings, the field-error mark |
| `kelp` | 50–800 | Success only |
| `coral` | 50–700 | Danger only |

Chapter fields name whole-section grounds: `field-paper` (mist-50, the page
canvas), `field-mist` (mist-100), `field-shallow` (tide-200), `field-cyan`,
`field-brand` (ocean-600), `field-deep` (navy-900), `field-abyss` (navy-950).

### 60-30-10

- **60%**: `mist-50` canvas, `mist-0` and `mist-100` tiles and sections.
- **30%**: `navy-900` type and the dark fields: the mega-menu feature panel
  (navy-900) and the footer (navy-950).
- **10%**: `ocean-600`. Primary buttons, the active nav underline, focus rings,
  links (`ocean-700`). The closing band is no longer an ocean block: it is the
  footer's opening row (see Footer below).

Status hues (`buoy`, `kelp`, `coral`) never decorate.

### Contrast (from the token comments)

ocean-600/white 5.0 · ocean-600 on mist-50 4.71 · navy-900/white 14.1 ·
white on ocean-700 7.0 · navy-950 on cyan-500 6.5 · navy-900 on mist-100 12.3 ·
mist-550/white 4.92 · mist-500/white 3.99 (edges only). Body text ≥ 4.5:1; large
text and UI edges ≥ 3:1.

## 2. Type

General Sans from Fontshare (linked in `src/app/layout.tsx`, weights 400/500/600
only; `b` and `strong` are 600) and Geist Mono (`font-mono`, used on the developer,
security, cookies, legal and error pages). Body is `--text-body`, 17 → 19px, leading 1.5.

### Scale

Every size comes from one scale in the `@theme` of the "Website redesign v2" block
of `globals.css`. Steps are fluid from 375 to 1280px and sit about 1.25 apart at
1280. A literal `text-[Npx]`, `text-[Nrem]` or inline `text-[clamp(…)]` fails
`tests/site-type-scale.test.mjs`; `em` sizes inside code samples are fine.

| Role | Size (375 → 1280) | Use |
|---|---|---|
| `text-caption` | 13 | Counts, fine print, the compact filter labels on phones |
| `text-small` | 14 → 15 | UI and supporting text: buttons, menu rows, labels, card copy, form notes |
| `text-body` | 17 → 19 | Running text (the body default), inputs, mobile menu rows |
| `text-title` | 19 → 22 | Card and list-item titles, `dt` terms, small `h3`s |
| `text-lead` | 20 → 26 | Lead paragraphs and standfirsts |
| `text-head-sm` | 24 → 28 | Tile and list headings, legal `h2`s, intro paragraphs set large |
| `text-head-md` | 28 → 36 | Sub-section headings, the auth panel line |
| `text-head` | 36 → 48 (max 56) | Section `h2`s |
| `text-head-xl` | 40 → 64 (max 72) | Large statements and stats, closing lines |
| `text-poster` | 48 → 102 (max 136) | The interior page title (`PageHero`, jobs, maintenance) |
| `text-hero` / `text-hero-tile` | `7.2cqi` / `11cqi` of the tile | Home hero only: the h1 and the two tile lines, sized on their `@container` tile so the board fits one screen |

Heading weight and leading come from two utilities:

| Utility | Setting | Use |
|---|---|---|
| `display` | 600, tracking -0.025em, leading 1.1, balanced | Every heading role except the page title |
| `poster` | 600, tracking -0.035em, leading 1.1 | The page title, with `text-poster` |

Leading: running text 1.5 (`leading-normal`, also the body default); short
headings set without `display` use `leading-snug`. No size carries its own line
height.

The site sizes are registered with tailwind-merge in `src/lib/utils.ts`, so
`cn("text-small text-navy-900")` keeps both.

### Measure

`max-w-measure` (65ch, `--container-measure`) for running text: legal documents,
articles, job descriptions, FAQ answers, long notes. `max-w-measure-narrow` (46ch)
for lead paragraphs, standfirsts and short supporting copy beside a heading. Nothing
runs wider than 65ch or narrower than 45ch; a `max-w-[Nch]` under 30ch is a heading
constraint (two remain) and is allowed.

## 3. Space and layout

- **`gutter`**: the page edge, 16px on phones, 28px from md, 40px from xl. Every
  section and the header use it.
- **Section rhythm**: `py-24 md:py-32` (96 / 128px). The closing band is
  `py-20 md:py-24`. `PageHero` sets `pt-12 md:pt-16` and `pb-24 md:pb-32` under its
  mosaic.
- **Axis**: on a 12-column grid from lg, `axis` puts headings and body on columns
  6–12 and `side` puts the aside on 1–4.
- **The board (home and `PageHero`).** Tiles sit 8px apart (`gap-2`, the home
  board; the `PageHero` mosaic tiles butt together) and 16px from the viewport sides
  (`px-4`), 8px from the header (`pt-2` / `py-2`). Text inside a tile keeps 20px+ of
  padding (`p-5`, `p-6 md:p-8 lg:p-10`).
- The home hero fills the first screen from md: `h-[calc(100svh-88px)]`, minimum
  38rem.

## 4. Shape and elevation

Square. Buttons, tiles, fields, menus and panels have no radius. Round shapes are
limited to marks: 48px carousel arrows, check and cross bullets, the job-alert
toggle, count badges.

Flat by default. The sticky header carries a hairline, and a soft shadow once the
page scrolls or a menu opens; the mega panel has a drop shadow. Nothing else lifts.
Photographs are greyscale (`.treated`).

## 5. Motion

| Motion | Where | Timing |
|---|---|---|
| Reveal | `[data-reveal]`, revealed once by `RevealObserver` | 400ms, 24px rise, stagger `--d` × 80ms |
| Headline line-up | `.lines [data-line]` (home hero, `PageHero`) | 400ms per line, `--i` × 110ms + 150ms; `[data-after-lines]` fades up after (700ms at 520ms) |
| Hero shutter | `.shutter`, the first hero picture | clip 400ms, image settles from 1.12 over 600ms, both at 150ms |
| Route enter | `.page-enter` (`app/template.tsx`) | 220ms opacity, client navigations only |
| Button hover | `.btn-fill` | see §5a |

Curve: `--ease-out-strong` (cubic-bezier(0.16, 1, 0.3, 1)). The reveal, line-up,
shutter and wave styles only apply under `prefers-reduced-motion: no-preference`
and once `RevealObserver` has put `.js` on `<html>`, so without script or with
reduced motion everything is simply visible. Printed pages never animate.

The home hero's `WaveField` canvas animates continuously while on screen and
answers the pointer; under reduced motion it draws one static frame.

## 5a. Controls

- **Buttons** are square links or buttons with Tailwind classes plus the
  `.btn-fill` family in `globals.css`. Primary: `bg-ocean-600 text-white btn-fill
  btn-fill-ocean`, 48px (`min-h-12`; header 44px, closing band 52px). Secondary:
  `ring-2 ring-inset ring-navy-900 btn-fill btn-fill-outline`. Pressed:
  `active:scale-[0.98]`.
- **`.btn-fill` variants** set `--btn-fill`, the hover and focus colour: `ocean`,
  `navy`, `deep`, `cyan`, `white`, `mist`, `quiet`, `glass`, `outline`,
  `outline-light`. Filled variants shift to it over 150ms (`--dur-short`). The two
  outline variants sweep it in left to right over 250ms (`--dur-medium`) and flip
  the label ink. Ease-out in, ease-in out; no transition when disabled or under
  reduced motion.
- **Form submit**: `SubmitButton` (`src/components/site/SubmitButton.tsx`). Busy
  shows a spinner and the busy label without changing width, sets `aria-busy` and
  disables. Disabled is `--opacity-disabled` (0.45) with a not-allowed cursor.
- **Field errors**: `FieldError` (`src/components/site/FieldError.tsx`), a buoy
  square and a sentence, referenced by `aria-describedby="<id>-error"`.
- **Fields**: the contact form uses an underline field (2px `mist-300` bottom edge,
  `ocean-600` on focus); the apply form uses a boxed 48px field (`ring-mist-300`,
  2px `ocean-600` ring on focus).
- **Focus**: one global `:focus-visible`, 2px `ocean-600` outline, 2px offset.
  Inside `.on-dark` it turns white.
- **Pairs**: every group is one primary and at most one secondary. Header: "Find a
  job" (outline) and "Contact us" (ocean). Hero: ocean primary, navy outline. Closing
  band: ocean primary, light outline secondary.
- **Targets**: 44px minimum on header controls and menu rows, 48px on page actions.

## 6. Navigation

- **Header** (`Header.tsx`): sticky, white, 72px. Logo left, four menus
  (Services, Industries, Resources, Company) from lg, actions right. The current
  section gets `ocean-700` text and a 2px `ocean-600` underline. Signed-in staff see
  their account in place of the visitor actions.
- **Mega panel**: one shared panel below the bar, opened on click or hover (90ms
  intent, 160ms close), closed by Escape or an outside click. Groups on the left, a
  navy feature panel with one cyan action on the right. Services lists names only:
  three groups, the long middle one in two columns. Industries is one group of five,
  two columns, each with a short tagline (`industries[].tagline` in `site-content.ts`).
- **Mobile menu** (below lg): sections are 56px rows that expand in place. Inside,
  links are names only on 44px rows. Services lists its items in two columns. A
  group whose links all land on one page (a service's features) collapses to one
  link named after the group. The visitor actions and a call button follow as
  full-width 48px buttons.
- **Footer**: `navy-950`. `Closing` sits flush above it on the same field as its
  opening row (heading and sentence left, actions right from lg), split from the
  link columns by a `white/10` hairline, so the CTA and footer read as one block.

## 7. Placement

- **Z-pattern** for the header and the home hero: logo top-left, menus, primary
  action top-right, then headline, supporting line, actions.
- **F-pattern** for reading pages: left-aligned headings on the axis, key facts in
  the first two lines.
- One primary action per view. The buyer action is "Contact us"; the candidate
  action is "Find a job" / "Apply now".
- Mobile first: design at 375px. The hero stacks; tiles go to two columns, then one.

## 7a. Job posting

`src/components/site/JobPostingView.tsx` draws a posting: title block (back
link, title, Job ID, apply button), About the role / What you will do / What you
bring on the axis, and the facts aside (Job ID, location, workplace, type, pay
when shown, practice, posted, closing date, skills as square chips). The public
page (`/jobs/[slug]`) passes its live controls in slots; the portal job editor's
Review step renders the same component with `preview`: static controls, empty
prompts, and the site's body type set on the wrapper so it escapes `.adm-scope`.
`preview="phone"` also forces the phone layout and the phone ends of the type
scale, for a frame narrower than the viewport. Pay prints only when the posting opts in
(`showPay`); commercial fields never reach the component.

## 8. Principles we check against

Jakob, Hick, Fitts, Miller, Von Restorff (one accent), Doherty (server-rendered
content, nothing waits past 400ms unannounced), Tesler, Postel, serial position,
peak-end (a strong closing band and success states), Gestalt proximity and common
region, aesthetic-usability, and WCAG 2.2 AA. The laws themselves are in
`DESIGN_LAWS.md`.
