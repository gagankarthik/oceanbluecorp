# Design laws

The rules every screen on the public site and the staff portal is held to. They
come from the owner and override taste. Where a law has a token or component, the
implementation is named; check new work against this list before shipping.

## 1. Space and structure

- **Base grid.** Every dimension is a multiple of 4px, mostly 8px. Half steps (2, 6,
  10, 14px) only inside icon and badge atoms. No arbitrary `[Npx]` spacing.
- **Spatial hierarchy.** A component's inner padding is smaller than the margin
  around it (card padding < section gutter; portal panel < canvas padding).
- **Alignment.** Edges share vertical and horizontal axes; text rows, table columns
  and breadcrumbs sit on unbroken lines.
- **Visual balance.** Weight (size, density, contrast) is spread evenly; no
  top-heavy or lopsided layouts.
- **Margin boundary.** At least 16px of gutter at every width; nothing touches the
  viewport edge or scrolls sideways.

## 2. Perception (Gestalt)

- **Proximity.** Labels sit closer to their input than to the next field.
- **Similarity.** Identical controls look identical everywhere: one input, one
  button, one select per surface.
- **Common region.** Related items share a container (card, row, panel).
- **Figure-ground.** Overlays (modals, sheets, menus) sit on a scrim or shadow above
  the page.
- **Closure.** Horizontal scrollers show a partial next item or an edge fade.
- **Connectedness.** Steps and timelines are joined by a line or track.
- **Focal point / Von Restorff.** Exactly one high-contrast primary action per view;
  everything else is secondary.

## 3. Type

- **Modular scale, ratio 1.2–1.333.** Site: the `--text-*` roles (`caption` … `head-xl`,
  `poster`, `hero`) with the `display` / `poster` heading utilities.
  Carried-over console: its own 1.2 scale (`--text-adm-*`). No `text-[Npx]`.
- **Measure.** Running text 45–75 characters, 65ch by default (site: `max-w-measure`, 46ch `max-w-measure-narrow` for leads).
- **Leading falls as size rises.** Display 1.1–1.25, body 1.4–1.6.
- **Restraint.** At most two families per surface (site: General Sans + Geist Mono;
  portal: General Sans + Geist Mono) and three weights (400, 500, 600).

## 4. Colour

- **60-30-10.** 60% neutral canvas, 30% structure (surfaces, borders, text), 10%
  accent reserved for actions, focus and active states, never decoration.
- **One neutral family** (`mist` in `src/styles/colors.css`), tinted with the brand
  hue, stepped in a perceptual space.
- **Chromatic restraint.** One brand hue (ocean, `ocean-600` #0a72c0); vivid colour
  only on interactive controls and status.
- **Semantic exclusivity.** Blue = interactive/info, green = success, amber = warning,
  red = destructive. Never decorative. Each has a surface, border and text token.
- **Token layers.** Primitives (`--p-*`) → semantic aliases (surface, border, text,
  action) → components. Components never use raw hex or raw palette classes.
- **Contrast.** Text ≥ 4.5:1; large text ≥ 3:1; control boundaries and focus
  indicators ≥ 3:1 (`--color-border-control` = `mist-500`, 3.99:1 on white, 3.7:1 on
  `mist-50`). Test against the real
  background, not in isolation.
- **Dual channel.** State is never colour alone: pair it with text, an icon or shape.
- **Colour-blind check.** Success, warning and danger stay distinct in deuteranopia
  and protanopia through lightness and icons.

## 5. States and motion

- **Every control has six states:** default, hover, focus-visible (2px ring, 2px
  offset), active/pressed, disabled (0.45 opacity, not-allowed cursor, no
  `pointer-events-none`), loading (spinner + `aria-busy`).
- **Visible affordance.** Buttons look like buttons; drop-downs show a chevron.
- **Response ≤ 100ms** to direct input (hover, press).
- **Transitions 150–300ms.** Ease-out to enter, ease-in to exit.
- **No perpetual loops.** Decorative motion runs once and ends within five seconds,
  so no pause controls are needed. Skeletons and spinners may repeat; they report
  state.

## 6. Decisions and ergonomics

- **Hick.** At most ~7 choices per group; group or disclose the rest (Services
  menu: Talent and staffing / Technology services / Managed services).
- **Miller.** Forms and filters in clusters of 7 ± 2.
- **Tesler.** The system absorbs complexity: defaults, automation, validation.
- **Postel.** Accept loose input, store strict output: phone extensions, "$75",
  "1,200" (`toNumber`, `isPhone` in `src/lib/form-validation.ts`).
- **Jakob.** Follow conventions users already know.
- **Peak-end.** Clean completion states (focus moves to the success message) and
  clear error recovery.
- **Serial position.** Most important items first or last in menus and toolbars.
- **Occam.** Fewest layers and steps that do the job.
- **Fitts.** Targets ≥ 32px on desktop (site 40px), ≥ 44px on touch; frequent
  actions large and close.
- **Steering.** No cascading hover sub-menus; use flat panels, popovers or sheets.
- **Doherty.** Feedback within 400ms: loading states on every submit, skeletons on
  every data load.
- **Zeigarnik.** Multi-step flows show progress.
