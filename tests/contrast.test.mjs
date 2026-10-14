// WCAG contrast for every colour pairing this app puts text on.
//
// Reads the token values out of globals.css rather than restating them, so the
// test fails when somebody retunes a token rather than passing against a stale
// copy of what the colour used to be. That is the whole point: contrast is a
// property of the pair, and pairs break when one side moves.
//
// Admin is light-only; the dark blocks were deleted with the unreachable theme.
// Every assertion carries a small margin so a pair sitting exactly on the AA
// line (4.50) fails here rather than rounding into a pass.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { load } from "./load.mjs";

const { ratioOn, contrastRatio, hexToRgb, AA } = load("src/lib/contrast.ts");

// colors.css first: the console tokens alias its scale steps.
const css = readFileSync("src/styles/colors.css", "utf8") + readFileSync("src/app/globals.css", "utf8");

/**
 * The value a token resolves to. Tokens are defined more than once (an early
 * :root block, then the console retune), and CSS takes the last, so the last
 * definition wins here too. var() aliases are followed to the primitive.
 */
const LIGHT_CSS = css;

function rawToken(name, source = LIGHT_CSS) {
  const all = [...source.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, "g"))];
  assert.ok(all.length, `token --${name} not found in the light scope of globals.css`);
  return all[all.length - 1][1].trim();
}

function token(name) {
  let v = rawToken(name);
  // Follow one level of aliasing; the brand primitives are not themselves vars.
  const alias = v.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (alias) v = rawToken(alias[1].replace(/^--/, ""), css);
  return v;
}

const MARGIN = 0.05;
const NEED = { text: AA.text + MARGIN, nonText: AA.nonText + MARGIN };

const SURFACE = "#ffffff";
const CANVAS = token("adm-canvas");

const INK = token("adm-ink");
const INK_MUTE = token("adm-ink-mute");
const INK_SUBTLE = token("adm-ink-subtle");
const ACCENT = token("adm-accent");
const SUCCESS = token("adm-success");
const SUCCESS_INK = token("adm-success-ink");
const WARNING_INK = token("adm-warning-ink");
const DANGER = token("adm-danger");
const DANGER_INK = token("adm-danger-ink");
const WARNING = token("adm-warning");

const SUCCESS_SOFT = token("adm-success-soft");
const DANGER_SOFT = token("adm-danger-soft");
const ACCENT_SOFT = token("adm-accent-soft");
const WARNING_SOFT = token("adm-warning-soft");
const ACCENT_STRONG = token("adm-accent-strong");
const SURFACE_2 = token("adm-surface-2");
const SURFACE_SUNKEN = token("adm-surface-sunken");
const LINE_INPUT = token("adm-line-input");

describe("body text", () => {
  test("the ink ramp carries on both surfaces", () => {
    for (const [name, ink] of [["ink", INK], ["ink-mute", INK_MUTE], ["ink-subtle", INK_SUBTLE]]) {
      for (const [sName, surf] of [["surface", SURFACE], ["canvas", CANVAS]]) {
        const r = ratioOn(ink, surf);
        assert.ok(r >= NEED.text, `--adm-${name} on ${sName} is ${r.toFixed(2)}:1, needs ${NEED.text}`);
      }
    }
  });
});

describe("semantic colour as text", () => {
  /* The `-ink` variants, not the base tokens. `--adm-success` (3.77:1) and
     `--adm-warning` (3.19:1) are tuned as FILLS — dots, switch tracks, tinted
     chips — and both fail as text on white. Anything rendering a semantic
     colour as words must reach for the ink variant, and this is the assertion
     that keeps that true. */
  const asText = [
    ["accent", ACCENT],
    ["success-ink", SUCCESS_INK],
    ["warning-ink", WARNING_INK],
    ["danger", DANGER],
  ];

  test("on plain surfaces", () => {
    for (const [name, c] of asText) {
      for (const [sName, surf] of [["surface", SURFACE], ["canvas", CANVAS]]) {
        const r = ratioOn(c, surf);
        assert.ok(r >= NEED.text, `--adm-${name} text on ${sName} is ${r.toFixed(2)}:1, needs ${NEED.text}`);
      }
    }
  });

  test("on their own 10% tint - the chip and tinted-button case", () => {
    // The claimed-owner chip, the danger claim button, the stage control: each
    // sets a semantic colour as text on a soft version of the same hue.
    for (const [name, c, soft] of [
      ["success-ink", SUCCESS_INK, SUCCESS_SOFT],
      ["danger-ink", DANGER_INK, DANGER_SOFT],
      ["warning-ink", WARNING_INK, WARNING_SOFT],
      ["accent", ACCENT, ACCENT_SOFT],
    ]) {
      const r = ratioOn(c, soft);
      assert.ok(r >= NEED.text, `--adm-${name} on its soft tint is ${r.toFixed(2)}:1, needs ${NEED.text}`);
    }
  });

  test("the fill tokens still read as fills", () => {
    // They are allowed to be lighter, but a dot or a track still has to be
    // discernible against the surface behind it (1.4.11).
    for (const [name, c] of [["success", SUCCESS], ["warning", WARNING]]) {
      const r = ratioOn(c, SURFACE);
      assert.ok(r >= NEED.nonText, `--adm-${name} as a fill is ${r.toFixed(2)}:1, needs ${NEED.nonText}`);
    }
  });
});

describe("non-text: the account switch", () => {
  /* 1.4.11 requires each state of a control to be distinguishable from the
     ADJACENT surface — not from the control's other state. An earlier version
     of this test asserted ON against OFF and failed at 2.54:1, which was the
     test being wrong rather than the design: mid-greens and mid-greys sit at
     similar luminance, and no pairing of them would ever have passed.

     What actually protects the user here is that state is never colour-alone —
     the knob moves and the label reads "Active" / "Inactive" — which is 1.4.1
     (Use of Colour) and is satisfied structurally. */
  test("each track has a discernible boundary against the surface", () => {
    // The ON track is carried by its fill; the OFF track cannot be (no light
    // grey reaches 3:1 on white) so it carries a border, and the border is what
    // this asserts.
    const onFill = ratioOn(SUCCESS, SURFACE);
    assert.ok(onFill >= NEED.nonText, `switch ON fill is ${onFill.toFixed(2)}:1, needs ${NEED.nonText}`);

    const offBorder = ratioOn(INK_SUBTLE, SURFACE);
    assert.ok(offBorder >= NEED.nonText, `switch OFF border is ${offBorder.toFixed(2)}:1, needs ${NEED.nonText}`);
  });
});

describe("stage colours from theme.ts", () => {
  /* Parsed out of theme.ts rather than copied here. A copy passes forever
     while the real palette drifts, which is the failure mode this whole file
     exists to prevent. */
  const themeSrc = readFileSync("src/components/portal/console/theme.ts", "utf8");
  const block = themeSrc.slice(
    themeSrc.indexOf("export const toneColor"),
    themeSrc.indexOf("};", themeSrc.indexOf("export const toneColor")),
  );
  const entries = [...block.matchAll(/(\w+):\s*"([^"]+)"/g)].map(([, k, v]) => [k, v]);

  test("the palette was found", () => {
    assert.ok(entries.length >= 10, `expected the full tone ramp, parsed ${entries.length}`);
  });

  test("every tone is legible as text on white", () => {
    const failures = [];
    for (const [name, value] of entries) {
      // Resolve `var(--adm-x)` through globals.css so aliases are checked too.
      const alias = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
      const resolved = alias ? token(alias[1].replace(/^--/, "")) : value;
      const r = ratioOn(resolved, SURFACE);
      if (r < NEED.text) failures.push(`${name} ${resolved} = ${r.toFixed(2)}:1`);
    }
    assert.deepEqual(failures, [], `tones below ${NEED.text}:1 as text`);
  });
});

describe("quiet text on tinted greys", () => {
  test("ink-subtle on surface-2 (chips, wells, segmented tracks)", () => {
    const r = ratioOn(INK_SUBTLE, SURFACE_2);
    assert.ok(r >= NEED.text, `--adm-ink-subtle on surface-2 is ${r.toFixed(2)}:1, needs ${NEED.text}`);
  });
});

describe("form controls (1.4.11)", () => {
  test("the input edge is discernible on every surface a field sits on", () => {
    for (const [sName, surf] of [["surface", SURFACE], ["canvas", CANVAS], ["sunken", SURFACE_SUNKEN]]) {
      const r = ratioOn(LINE_INPUT, surf);
      assert.ok(r >= NEED.nonText, `--adm-line-input on ${sName} is ${r.toFixed(2)}:1, needs ${NEED.nonText}`);
    }
  });

  test("every control edge (buttons, pills, toggles, checkboxes) reaches 3:1", () => {
    const edge = token("adm-line-control");
    for (const [sName, surf] of [["surface", SURFACE], ["canvas", CANVAS], ["sunken", SURFACE_SUNKEN], ["surface-2", SURFACE_2]]) {
      const r = ratioOn(edge, surf);
      assert.ok(r >= NEED.nonText, `--adm-line-control on ${sName} is ${r.toFixed(2)}:1, needs ${NEED.nonText}`);
    }
  });

  test("grid headers and the sidebar read at AA", () => {
    const pairs = [
      ["head-ink on head", token("adm-head-ink"), token("adm-head")],
      ["nav-mute on nav", token("adm-nav-mute"), token("adm-nav-bg")],
      ["nav-subtle on nav", token("adm-nav-subtle"), token("adm-nav-bg")],
      ["nav-mute on nav hover", token("adm-nav-mute"), token("adm-nav-hover")],
      ["nav-active-ink on nav-active", token("adm-nav-active-ink"), token("adm-nav-active")],
    ];
    for (const [name, fg, bg] of pairs) {
      const r = ratioOn(fg, bg);
      assert.ok(r >= NEED.text, `${name} is ${r.toFixed(2)}:1, needs ${NEED.text}`);
    }
  });

  test("white on the danger button", () => {
    const r = ratioOn("#ffffff", DANGER);
    assert.ok(r >= NEED.text, `white on --adm-danger is ${r.toFixed(2)}:1, needs ${NEED.text}`);
  });
});

describe("record and page headers", () => {
  /* The cobalt band was retired for the portal look: headers sit on the canvas
     and the candidate identity sits on a white card. Pin both the colours and
     that no white-on-fill text survives in the header components. */
  const ws = readFileSync("src/components/portal/console/workspace.tsx", "utf8");
  const slice = (from, to) => ws.slice(ws.indexOf(from), ws.indexOf(to, ws.indexOf(from)));
  const header = slice("export function BackLink", "export function RecordFact");

  test("the header components were found", () => {
    assert.ok(header.includes("export function RecordHeader"), "RecordHeader not found");
  });

  test("no white text on a fill in the headers", () => {
    for (const [name, src] of [["RecordHeader/BackLink", header]]) {
      assert.doesNotMatch(src, /text-white/, `${name} still sets white text`);
    }
  });

  test("title, subtitle and facts read on canvas and surface", () => {
    const failures = [];
    for (const name of ["ink", "ink-mute", "ink-subtle"]) {
      for (const [sName, surf] of [["canvas", CANVAS], ["surface", SURFACE]]) {
        const r = ratioOn(token(`adm-${name}`), surf);
        if (r < NEED.text) failures.push(`--adm-${name} on ${sName} = ${r.toFixed(2)}:1`);
      }
    }
    assert.deepEqual(failures, [], `header text below ${NEED.text}:1`);
  });

  test("the back link reads at rest and on hover", () => {
    assert.match(header, /text-\[var\(--adm-accent-strong\)\][^"]*hover:text-\[var\(--adm-accent-press\)\]/);
    for (const name of ["accent-strong", "accent-press"]) {
      for (const [sName, surf] of [["canvas", CANVAS], ["surface", SURFACE]]) {
        const r = ratioOn(token(`adm-${name}`), surf);
        assert.ok(r >= NEED.text, `--adm-${name} back link on ${sName} is ${r.toFixed(2)}:1`);
      }
    }
  });
});

describe("the feedback quartet", () => {
  // Each status has a surface, a border and a text token; the text must read on
  // its own surface and on plain white.
  test("ink reads on its own surface and on white", () => {
    const failures = [];
    for (const k of ["info", "success", "warning", "danger"]) {
      const ink = token(`adm-${k}-ink`);
      for (const [sName, surf] of [["soft", token(`adm-${k}-soft`)], ["surface", SURFACE], ["canvas", CANVAS]]) {
        const r = ratioOn(ink, surf);
        if (r < NEED.text) failures.push(`--adm-${k}-ink on ${sName} = ${r.toFixed(2)}:1`);
      }
    }
    assert.deepEqual(failures, [], `feedback ink below ${NEED.text}:1`);
  });
});

describe("the accent ramp", () => {
  test("action text and the deep steps read on white, soft and tint", () => {
    const failures = [];
    for (const name of ["accent", "accent-strong", "accent-press", "nav-active-ink"]) {
      for (const [sName, surf] of [["surface", SURFACE], ["soft", ACCENT_SOFT], ["tint", token("adm-accent-tint")]]) {
        const r = ratioOn(token(`adm-${name}`), surf);
        if (r < NEED.text) failures.push(`--adm-${name} on ${sName} = ${r.toFixed(2)}:1`);
      }
    }
    assert.deepEqual(failures, [], `accent text below ${NEED.text}:1`);
  });

  test("white labels read on every filled step from seq-3 down", () => {
    for (const k of [3, 4, 5]) {
      const r = ratioOn("#ffffff", token(`adm-seq-${k}`));
      assert.ok(r >= NEED.text, `white on --adm-seq-${k} is ${r.toFixed(2)}:1`);
    }
  });

  test("the focus ring reads on canvas and surface", () => {
    for (const [sName, surf] of [["surface", SURFACE], ["canvas", CANVAS], ["surface-2", SURFACE_2]]) {
      const r = ratioOn(token("adm-focus"), surf);
      assert.ok(r >= NEED.nonText, `--adm-focus on ${sName} is ${r.toFixed(2)}:1`);
    }
  });
});

describe("pipeline stage tokens (colors.css)", () => {
  const KEYS = ["new", "screening", "submitted", "interview", "offered", "hired", "rejected"];
  test("text on the solid fill and on the badge reads at AA", () => {
    const failures = [];
    for (const k of KEYS) {
      const onFill = ratioOn(token(`color-stage-${k}-on-fill`), token(`color-stage-${k}-fill`));
      const badge = ratioOn(token(`color-stage-${k}-badge-ink`), token(`color-stage-${k}-badge-bg`));
      if (onFill < NEED.text) failures.push(`${k} on-fill ${onFill.toFixed(2)}:1`);
      if (badge < NEED.text) failures.push(`${k} badge ${badge.toFixed(2)}:1`);
    }
    assert.deepEqual(failures, [], `stage text below ${NEED.text}:1`);
  });
  test("every stage mark is discernible on white (New by its edge, the rest by fill)", () => {
    const failures = [];
    for (const k of KEYS) {
      const mark = k === "new" ? token(`color-stage-${k}-edge`) : token(`color-stage-${k}-fill`);
      const edge = token(`color-stage-${k}-edge`);
      const r = Math.max(ratioOn(mark, SURFACE), ratioOn(edge, SURFACE));
      if (r < NEED.nonText) failures.push(`${k} ${r.toFixed(2)}:1`);
    }
    assert.deepEqual(failures, [], `stage marks below ${NEED.nonText}:1`);
  });
  test("the control border token reaches 3:1 on white and mist-50", () => {
    for (const surf of [SURFACE, token("color-mist-50")]) {
      const r = ratioOn(token("color-border-control"), surf);
      assert.ok(r >= NEED.nonText, `--color-border-control is ${r.toFixed(2)}:1 on ${surf}`);
    }
  });
  test("the placeholder token reads at AA on white", () => {
    const r = ratioOn(token("color-text-placeholder"), SURFACE);
    assert.ok(r >= NEED.text, `--color-text-placeholder is ${r.toFixed(2)}:1`);
  });
});

describe("portal status roles (colors.css)", () => {
  for (const tone of ["danger", "warning", "success"]) {
    test(`${tone} text and strong text read at AA on white and on their wash`, () => {
      const soft = token(`color-status-${tone}-soft`);
      for (const ink of [`color-status-${tone}`, `color-status-${tone}-strong`]) {
        for (const surf of [SURFACE, soft]) {
          const r = ratioOn(token(ink), surf);
          assert.ok(r >= NEED.text, `--${ink} on ${surf} is ${r.toFixed(2)}:1`);
        }
      }
    });
    if (tone !== "warning") test(`${tone} on-dark icons clear 3:1 on navy`, () => {
      const r = ratioOn(token(`color-status-${tone}-on-dark`), token("color-navy-900"));
      assert.ok(r >= NEED.nonText, `--color-status-${tone}-on-dark is ${r.toFixed(2)}:1`);
    });
  }
  test("danger mark clears 3:1 on white", () => {
    const r = ratioOn(token("color-status-danger-mark"), SURFACE);
    assert.ok(r >= NEED.nonText, `${r.toFixed(2)}:1`);
  });
});
